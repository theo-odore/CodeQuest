// ============================================================================
// code-challenge.js
// ============================================================================
import { auth, db, ref, update, onValue, onAuthStateChanged } from "../firebase-config.js";
import { escapeHtml, formatClock } from "./utils.js";

let uid = null;
let participant = null;
let challenge = null;
let quizState = {};
let editorTouchedByUser = false;
let ccTimerInterval = null;
let autoSubmitted = false;
let redirectedToResults = false;
let autoSaveInterval = null;
let lastAutoSave = "";

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "participant-login.html";
    return;
  }
  uid = user.uid;
  init();
});

// Connection status indicator
function updateConnectionStatus(isConnected) {
  const banner = document.getElementById("connBanner");
  if (banner) banner.classList.toggle("hidden", isConnected);
  const dot = document.getElementById("connDot");
  if (dot) {
    dot.className = `conn-dot ${isConnected ? "connected" : "disconnected"}`;
    dot.textContent = isConnected ? "Live" : "Disconnected";
  }
}

function init() {
  // Watch connection
  onValue(ref(db, ".info/connected"), (snap) => {
    updateConnectionStatus(snap.val() === true);
  });

  onValue(ref(db, `participants/${uid}`), (snap) => {
    const val = snap.val();
    if (!val) { window.location.href = "participant-login.html"; return; }
    participant = val;
    document.getElementById("whoami").textContent = `${val.name} · Lab ${val.lab} · Terminal ${val.terminal}`;
    render();
  });

  onValue(ref(db, "codeChallenge"), (snap) => {
    challenge = snap.val();
    render();
    renderCountdown();
  });

  // Once the host publishes the combined Quiz + Code Challenge results,
  // send everyone back to the dashboard, which shows the results panel.
  onValue(ref(db, "quizState"), (snap) => {
    quizState = snap.val() || {};
    if (quizState.scoresReleased && !redirectedToResults) {
      redirectedToResults = true;
      window.location.href = "participant-dashboard.html";
    }
  });

  document.getElementById("submitCodeBtn").addEventListener("click", () => submitCode(false));
  document.getElementById("codeInput").addEventListener("input", () => {
    editorTouchedByUser = true;
    autoSaveDraft();
  });

  // Restore draft from sessionStorage
  restoreDraft();
}

function render() {
  const waitingPanel = document.getElementById("waitingPanel");
  const challengePanel = document.getElementById("challengePanel");

  if (!challenge || !challenge.released) {
    waitingPanel.classList.remove("hidden");
    challengePanel.classList.add("hidden");
    return;
  }

  waitingPanel.classList.add("hidden");
  challengePanel.classList.remove("hidden");

  document.getElementById("ccTitleDisplay").textContent = challenge.title || "Problem";
  document.getElementById("ccLangTag").textContent = challenge.language || "plaintext";
  document.getElementById("ccStatementDisplay").textContent = challenge.statement || "";

  const submitted = !!(participant && participant.codeSubmission && participant.codeSubmission.submittedAt);
  const codeInput = document.getElementById("codeInput");
  const submitBtn = document.getElementById("submitCodeBtn");
  const banner = document.getElementById("submittedBanner");

  if (submitted) {
    codeInput.value = participant.codeSubmission.code || "";
    codeInput.disabled = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitted";
    banner.classList.remove("hidden");
    banner.textContent = participant.codeSubmission.autoSubmitted
      ? "⏱ Time ran out — your code was submitted automatically."
      : "✓ Your code has been submitted and saved. You can keep this tab open.";
    // Clear draft since it's submitted
    sessionStorage.removeItem("cq_code_draft");
  } else {
    // Only seed the starter code once, so we don't clobber what the user is typing.
    // First try restored draft, then starter code
    if (!editorTouchedByUser && !codeInput.value) {
      const draft = sessionStorage.getItem("cq_code_draft");
      codeInput.value = draft || challenge.starterCode || "";
      if (draft) editorTouchedByUser = true;
    }
    codeInput.disabled = false;
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit code";
    banner.classList.add("hidden");
  }
}

// Auto-save draft to sessionStorage every 2 seconds when typing
function autoSaveDraft() {
  const code = document.getElementById("codeInput").value;
  if (code !== lastAutoSave && code.trim()) {
    lastAutoSave = code;
    try {
      sessionStorage.setItem("cq_code_draft", code);
    } catch (e) { /* sessionStorage full — ignore */ }
  }
}

function restoreDraft() {
  // Start periodic auto-save of draft
  autoSaveInterval = setInterval(() => {
    const alreadySubmitted = participant && participant.codeSubmission && participant.codeSubmission.submittedAt;
    if (!alreadySubmitted) autoSaveDraft();
  }, 2000);
}

// ---------------------------------------------------------------- countdown
function renderCountdown() {
  clearInterval(ccTimerInterval);
  const display = document.getElementById("ccTimerDisplay");

  if (!challenge || !challenge.released || !challenge.releasedAt || !challenge.durationSeconds) {
    display.textContent = "--:--";
    display.className = "timer-display";
    return;
  }

  const tick = () => {
    const elapsed = (Date.now() - challenge.releasedAt) / 1000;
    const remaining = Math.max(0, challenge.durationSeconds - elapsed);
    display.textContent = formatClock(remaining);
    if (remaining <= 0) {
      display.className = "timer-display done";
      clearInterval(ccTimerInterval);
      const alreadySubmitted = participant && participant.codeSubmission && participant.codeSubmission.submittedAt;
      if (!alreadySubmitted && !autoSubmitted) {
        autoSubmitted = true;
        submitCode(true);
      }
    } else if (remaining <= 30) {
      display.className = "timer-display warn";
    } else {
      display.className = "timer-display running";
    }
  };
  tick();
  ccTimerInterval = setInterval(tick, 250);
}

// ---------------------------------------------------------------- submission
async function submitCode(isAutoSubmit) {
  const code = document.getElementById("codeInput").value;
  if (!isAutoSubmit) {
    if (!code.trim()) { showToast("Write some code before submitting", "error"); return; }
    if (!confirm("Submit this code? You won't be able to edit it after this.")) return;
  }

  try {
    await update(ref(db, `participants/${uid}`), {
      codeSubmission: {
        code,
        language: challenge?.language || "plaintext",
        submittedAt: Date.now(),
        autoSubmitted: !!isAutoSubmit
      }
    });
    // Clear draft on successful submit
    sessionStorage.removeItem("cq_code_draft");
    showToast(isAutoSubmit ? "Time's up — code auto-submitted" : "Code submitted", "success");
    if (autoSaveInterval) clearInterval(autoSaveInterval);
  } catch (err) {
    showToast("Failed to submit code — try again", "error");
  }
}

// ---------------------------------------------------------------- toast (stacked)
function showToast(msg, type = "default") {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const el = document.createElement("div");
  el.className = `toast ${type !== "default" ? type : ""}`;
  el.textContent = msg;
  container.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("show")));
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 260);
  }, 2800);
}
