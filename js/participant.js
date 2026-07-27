// ============================================================================
// participant.js — single-question-at-a-time flow + results + code-challenge redirect
// ============================================================================
import { auth, db, ref, update, onValue, onAuthStateChanged } from "../firebase-config.js";
import {
  DIFFICULTY_LABEL, formatClock, formatDuration, escapeHtml,
  pickActiveQuestion, allReleasedAnswered, hasFinishedReleasedQuestions, getQuizPhase
} from "./utils.js";

let uid = null;
let participant = null;
let questionsCache = {};
let quizState = {};
let codeChallengeCache = {};
let timerInterval = null;      // overall quiz timer (top bar)
let questionTimerInterval = null; // per-question countdown
let currentLetter = null;      // which question is currently rendered, so we don't re-render every tick
let redirected = false;

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "participant-login.html";
    return;
  }
  uid = user.uid;
  init();
});

onValue(ref(db, ".info/connected"), (snap) => {
  const connected = snap.val() === true;
  const banner = document.getElementById("connBanner");
  if (banner) banner.classList.toggle("hidden", connected);
  const dot = document.getElementById("connDot");
  if (dot) {
    dot.className = `conn-dot ${connected ? "connected" : "disconnected"}`;
    dot.textContent = connected ? "Live" : "Disconnected";
  }
});

function init() {
  document.getElementById("loadingOverlay")?.classList.add("hidden");

  onValue(ref(db, `participants/${uid}`), (snap) => {
    const val = snap.val();
    if (!val) { window.location.href = "participant-login.html"; return; }
    participant = val;
    document.getElementById("whoami").textContent = `${val.name} · Lab ${val.lab} · Terminal ${val.terminal}`;
    renderActiveQuestion();
    renderTimer();
    updateStats();
  });

  onValue(ref(db, "questions"), (snap) => {
    questionsCache = snap.val() || {};
    renderActiveQuestion();
    renderTimer();
    updateStats();
  });

  onValue(ref(db, "quizState"), (snap) => {
    quizState = snap.val() || {};
    renderTimer();
    renderActiveQuestion();
    maybeRedirectToChallenge();
    if (quizState.scoresReleased) loadResults();
  });

  // The moment the host releases the coding challenge — or once the global
  // quiz timer runs out — every participant is sent to the shared page,
  // whether they were mid-quiz or just joining for the first time.
  onValue(ref(db, "codeChallenge"), (snap) => {
    codeChallengeCache = snap.val() || {};
    maybeRedirectToChallenge();
  });
}

function maybeRedirectToChallenge() {
  if (redirected) return;
  if (quizState.scoresReleased) return; // final results are out — stay here, don't bounce away
  const phase = getQuizPhase(quizState);
  const challengeLive = codeChallengeCache && codeChallengeCache.released;
  if (phase === "ended" || challengeLive) {
    redirected = true;
    window.location.href = "code-challenge.html";
  }
}

// ---------------------------------------------------------------- overall timer
function renderTimer() {
  clearInterval(timerInterval);
  const display = document.getElementById("timerDisplay");

  if (!quizState.timerRunning || !quizState.timerStart) {
    display.textContent = "00:00";
    display.className = "timer-display";
    return;
  }

  // Answered everything released so far? Freeze the clock right where it is
  // instead of letting it keep ticking down while there's nothing to do —
  // the participant is now just waiting on the coding challenge.
  if (participant && hasFinishedReleasedQuestions(questionsCache, participant.answers || {})) {
    const elapsed = (Date.now() - quizState.timerStart) / 1000;
    const remaining = Math.max(0, quizState.timerDuration - elapsed);
    display.textContent = formatClock(remaining);
    display.className = "timer-display";
    display.title = "Paused — you've answered every question released so far";
    return;
  }

  const tick = () => {
    const elapsed = (Date.now() - quizState.timerStart) / 1000;
    const remaining = quizState.timerDuration - elapsed;
    display.textContent = formatClock(remaining);
    display.title = "";
    if (remaining <= 0) {
      display.className = "timer-display done";
      clearInterval(timerInterval);
    } else if (remaining <= 30) {
      display.className = "timer-display warn";
    } else {
      display.className = "timer-display running";
    }
  };
  tick();
  timerInterval = setInterval(tick, 250);
}

// ---------------------------------------------------------------- active question
function updateStats() {
  const releasedCount = Object.values(questionsCache).filter((q) => q.released).length;
  const answeredCount = Object.keys((participant && participant.answers) || {}).length;
  document.getElementById("progressStat").textContent = `${answeredCount} / ${releasedCount}`;
  document.getElementById("scoreStat").textContent = (participant && participant.totalScore) || 0;
}

function renderActiveQuestion() {
  if (!participant) return;

  const phase = getQuizPhase(quizState);
  const answers = participant.answers || {};
  const active = pickActiveQuestion(questionsCache, answers);
  const releasedCount = Object.values(questionsCache).filter((q) => q.released).length;

  const wrap = document.getElementById("activeQuestionWrap");
  const empty = document.getElementById("emptyFeed");
  const waiting = document.getElementById("waitingFeed");

  clearInterval(questionTimerInterval);

  if (phase === "not_started") {
    wrap.innerHTML = "";
    currentLetter = null;
    waiting.classList.add("hidden");
    empty.classList.remove("hidden");
    empty.innerHTML = `<div class="glyph">&lt;/&gt;</div>Waiting for the host to start the quiz…`;
    return;
  }

  if (!releasedCount) {
    wrap.innerHTML = "";
    currentLetter = null;
    empty.innerHTML = `<div class="glyph">&lt;/&gt;</div>Quiz is live — no questions released yet. They'll appear here the moment the host presses a key.`;
    empty.classList.remove("hidden");
    waiting.classList.add("hidden");
    return;
  }

  if (!active) {
    // Every released question so far has been answered — nothing left to do
    // until the host either releases another question or the coding
    // challenge. The timer above is now frozen (see renderTimer).
    wrap.innerHTML = "";
    currentLetter = null;
    empty.classList.add("hidden");
    waiting.classList.remove("hidden");
    waiting.innerHTML = `<div class="glyph">✓</div>You've answered every question released so far. Your timer is paused — sit tight, the coding challenge will appear here the moment the host publishes it.`;
    return;
  }

  empty.classList.add("hidden");
  waiting.classList.add("hidden");
  currentLetter = active.letter;

  wrap.innerHTML = `
    <div class="qcard">
      <div class="qcard-head">
        <span class="qcard-serial">#${active.serial} · KEY ${active.letter}</span>
        <span class="tag ${active.difficulty}">${DIFFICULTY_LABEL[active.difficulty]}</span>
        <span class="qcard-score">${active.score} pts</span>
      </div>
      <p class="qcard-text">${escapeHtml(active.text)}</p>
      <div id="qTimerRow" style="margin-bottom:12px;">
        <span class="timer-display" id="qTimerDisplay" style="font-size:20px; padding:5px 12px;">--:--</span>
      </div>
      <div class="opt-list">
        ${active.options.map((opt, i) => `
          <button type="button" class="opt-btn" data-idx="${i}">${escapeHtml(opt)}</button>`).join("")}
      </div>
    </div>`;

  wrap.querySelectorAll(".opt-btn").forEach((btn) => {
    btn.addEventListener("click", () => lockAnswer(active, Number(btn.dataset.idx)));
  });

  startQuestionTimer(active);
}

function startQuestionTimer(active) {
  const display = document.getElementById("qTimerDisplay");
  if (!active.releasedAt || !active.timeLimitSeconds) {
    if (display) display.textContent = "--:--";
    return;
  }
  const tick = () => {
    if (!display || currentLetter !== active.letter) { clearInterval(questionTimerInterval); return; }
    const elapsed = (Date.now() - active.releasedAt) / 1000;
    const remaining = Math.max(0, active.timeLimitSeconds - elapsed);
    display.textContent = formatClock(remaining);
    if (remaining <= 0) {
      display.className = "timer-display done";
      clearInterval(questionTimerInterval);
      // Skip if already locked answer for this question
      if (!participant || (participant.answers && participant.answers[active.letter] !== undefined)) return;
      lockAnswer(active, null); // time's up — auto-submit as unanswered
    } else if (remaining <= 10) {
      display.className = "timer-display warn";
    } else {
      display.className = "timer-display running";
    }
  };
  tick();
  questionTimerInterval = setInterval(tick, 250);
}

// ---------------------------------------------------------------- answer locking
let lockingAnswer = false; // prevents double-fire from rapid clicks + timer expiry

async function lockAnswer(question, selectedIndex) {
  // Guard against double-fire (click right as the timer expires).
  if (lockingAnswer) return;
  if (!participant || (participant.answers && participant.answers[question.letter] !== undefined)) return;
  lockingAnswer = true;

  // Disable all option buttons visually
  document.querySelectorAll(".opt-btn").forEach((b) => b.disabled = true);

  const correct = selectedIndex !== null && selectedIndex === question.correctIndex;
  const pointsEarned = correct ? (question.score || 0) : 0;

  const nextAnswers = { ...(participant.answers || {}), [question.letter]: { selectedIndex, correct, pointsEarned } };
  const nextTotal = Object.values(nextAnswers).reduce((sum, a) => sum + (a.pointsEarned || 0), 0);
  const finishedForNow = allReleasedAnswered(questionsCache, nextAnswers);

  const updates = {
    [`answers/${question.letter}`]: { selectedIndex, correct, pointsEarned },
    totalScore: nextTotal
  };
  if (finishedForNow) {
    updates.completedAt = Date.now();
    updates.submitted = true;
  }

  try {
    await update(ref(db, `participants/${uid}`), updates);
    showToast(selectedIndex === null ? "Time's up — moved on" : "Answer locked in", "success");
  } catch (err) {
    showToast("Failed to save answer — try again", "error");
  } finally {
    lockingAnswer = false;
  }
}

// ---------------------------------------------------------------- results
async function loadResults() {
  document.getElementById("resultsPanel").classList.remove("hidden");

  onValue(ref(db, "leaderboard"), (snap) => {
    const board = snap.val() || {};
    const ranked = Object.values(board).sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));

    const myIndex = ranked.findIndex((p) => p.uid === uid);
    const myEntry = ranked[myIndex];
    document.getElementById("myQuizScore").textContent = myEntry?.quizScore ?? participant?.totalScore ?? 0;
    document.getElementById("myCodeScore").textContent = myEntry?.codeScore ?? (participant?.codeSubmission?.pointsAwarded || 0);
    document.getElementById("myScore").textContent = myEntry?.totalScore ?? ((participant?.totalScore || 0) + (participant?.codeSubmission?.pointsAwarded || 0));
    document.getElementById("myRank").textContent = myIndex >= 0 ? `#${myIndex + 1}` : "Unranked";
    document.getElementById("myTime").textContent = participant?.completedAt
      ? formatDuration(participant.completedAt - (participant.startedAt || participant.completedAt))
      : "—";

    const podium = document.getElementById("podium");
    const top3 = ranked.slice(0, 3);
    const order = [1, 0, 2].filter((i) => top3[i]);
    podium.innerHTML = order.map((i) => {
      const p = top3[i];
      const place = i + 1;
      return `<div class="podium-slot p${place}">
        <div class="podium-avatar">${(p.name || "?").slice(0, 1).toUpperCase()}</div>
        <div class="podium-name">${escapeHtml(p.name || "—")}</div>
        <div class="podium-score">${p.totalScore || 0} pts</div>
        <div class="podium-bar">${place}</div>
      </div>`;
    }).join("");

    document.getElementById("leaderboardBody").innerHTML = ranked.map((p, i) => `
      <tr class="rank-${i + 1}" style="${p.uid === uid ? 'outline:1px solid var(--accent);' : ''}">
        <td>${i + 1}</td>
        <td>${escapeHtml(p.name || "—")}${p.uid === uid ? " (you)" : ""}</td>
        <td>${escapeHtml(p.lab || "—")}</td>
        <td>${escapeHtml(p.terminal || "—")}</td>
        <td>${p.quizScore ?? "—"}</td>
        <td>${p.codeScore ?? "—"}</td>
        <td>${p.totalScore || 0}</td>
        <td>${p.completedAt ? formatDuration(p.completedAt - (p.startedAt || p.completedAt)) : "—"}</td>
      </tr>`).join("");
  });
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
