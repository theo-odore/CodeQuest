// ============================================================================
// admin.js
// ============================================================================
import { db, ref, set, update, get, remove, onValue } from "../firebase-config.js";
import { guardAdminPage, adminLogout, addNewAdmin, listenAdminProfiles } from "./auth.js";
import {
  KEYBOARD_ROWS, ALL_LETTERS, letterToDifficulty, DIFFICULTY_LABEL,
  DIFFICULTY_SCORE_DEFAULT, DIFFICULTY_TIME_LIMIT_DEFAULT, SEED_QUESTIONS, formatClock, formatDuration,
  computeCombinedRanking, escapeHtml, getQuizPhase, TOTAL_MAX_MARKS, QUIZ_MAX_MARKS, CODE_CHALLENGE_MAX_MARKS
} from "./utils.js";

let questionsCache = {};
let participantsCache = {};
let quizState = {};
let codeChallengeCache = {};
let currentUser = null;
let timerInterval = null;

// ---------------------------------------------------------------- bootstrap
watchConnection();

guardAdminPage(async (user) => {
  currentUser = user;
  await seedQuestionsIfEmpty();
  renderKeyboard();
  listenQuestions();
  listenParticipants();
  listenQuizState();
  listenCodeChallenge();
  listenAdmins();
  wireStaticControls();
  wireCodeChallengeControls();
  wireResetControls();
  wireAdminAccountControls();
  document.getElementById("loadingOverlay").classList.add("hidden");
});

document.getElementById("logoutBtn").addEventListener("click", adminLogout);

// A dropped connection is a real failure mode on lab/classroom wifi — flag it
// clearly rather than letting button clicks silently fail to save.
function watchConnection() {
  onValue(ref(db, ".info/connected"), (snap) => {
    const connected = snap.val() === true;
    document.getElementById("connBanner").classList.toggle("hidden", connected);
    const dot = document.getElementById("connDot");
    if (dot) {
      dot.className = `conn-dot ${connected ? "connected" : "disconnected"}`;
      dot.textContent = connected ? "Live" : "Disconnected";
    }
  });
}


async function seedQuestionsIfEmpty() {
  const snap = await get(ref(db, "questions"));
  if (!snap.exists()) {
    const initial = {};
    for (const [letter, q] of Object.entries(SEED_QUESTIONS)) {
      initial[letter] = { ...q, difficulty: letterToDifficulty(letter), released: false };
    }
    await set(ref(db, "questions"), initial);
  }
}

// ---------------------------------------------------------------- keyboard
function renderKeyboard() {
  const kbd = document.getElementById("keyboard");
  kbd.innerHTML = "";
  KEYBOARD_ROWS.forEach(({ row, difficulty, keys }) => {
    const rowEl = document.createElement("div");
    rowEl.className = `kbd-row ${row}`;
    keys.forEach((letter) => {
      const btn = document.createElement("button");
      btn.className = "key";
      btn.dataset.letter = letter;
      btn.dataset.difficulty = difficulty;
      btn.innerHTML = `<span class="letter">${letter}</span><span class="serial">—</span>`;
      btn.addEventListener("click", () => onKeyPress(letter));
      rowEl.appendChild(btn);
    });
    kbd.appendChild(rowEl);
  });
}

function onKeyPress(letter) {
  const q = questionsCache[letter];
  if (!q) {
    openQuestionModal(letter); // nothing seeded for this key yet — let admin add one
    return;
  }
  if (q.released) return; // already live, edit via the table below
  update(ref(db, `questions/${letter}`), { released: true, releasedAt: Date.now() });
  showToast(`Released ${letter} — ${DIFFICULTY_LABEL[letterToDifficulty(letter)]}`);
}

function updateKeyboardUI() {
  document.querySelectorAll(".key").forEach((btn) => {
    const letter = btn.dataset.letter;
    const q = questionsCache[letter];
    const serialEl = btn.querySelector(".serial");
    if (!q) {
      btn.classList.add("empty");
      btn.classList.remove("released");
      serialEl.textContent = "—";
    } else {
      btn.classList.remove("empty");
      serialEl.textContent = `#${q.serial ?? "—"}`;
      btn.classList.toggle("released", !!q.released);
    }
  });
}

// ---------------------------------------------------------------- questions
function listenQuestions() {
  onValue(ref(db, "questions"), (snap) => {
    questionsCache = snap.val() || {};
    updateKeyboardUI();
    renderQuestionTable();
    renderOverview();
  });
}

function renderQuestionTable() {
  const tbody = document.getElementById("questionTableBody");
  tbody.innerHTML = "";
  ALL_LETTERS.forEach((letter) => {
    const q = questionsCache[letter];
    const tr = document.createElement("tr");
    if (!q) {
      tr.innerHTML = `
        <td><strong>${letter}</strong></td>
        <td colspan="4" style="color:var(--text-faint)">No question added yet</td>
        <td><span class="tag ${letterToDifficulty(letter)}">${DIFFICULTY_LABEL[letterToDifficulty(letter)]}</span></td>
        <td><button class="btn btn-sm" data-add="${letter}">Add</button></td>`;
    } else {
      tr.innerHTML = `
        <td><strong>${letter}</strong></td>
        <td>${q.serial ?? "—"}</td>
        <td><span class="tag ${q.difficulty}">${DIFFICULTY_LABEL[q.difficulty]}</span></td>
        <td style="white-space:normal; max-width:320px;">${escapeHtml(q.text)}</td>
        <td>${q.score}</td>
        <td>${q.released ? '<span class="tag easy">Live</span>' : '<span class="tag" style="color:var(--text-dim); background:transparent; border-color:var(--border);">Pending</span>'}</td>
        <td><button class="btn btn-sm" data-edit="${letter}">Edit</button></td>`;
    }
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll("[data-add]").forEach((b) => b.addEventListener("click", () => openQuestionModal(b.dataset.add)));
  tbody.querySelectorAll("[data-edit]").forEach((b) => b.addEventListener("click", () => openQuestionModal(b.dataset.edit, true)));
}

// ---------------------------------------------------------------- modal
const qModalOverlay = document.getElementById("qModalOverlay");
const qForm = document.getElementById("qForm");
const qLetterSelect = document.getElementById("qLetterSelect");
const qDeleteBtn = document.getElementById("qDeleteBtn");
let editingLetter = null;
let modalDirty = false;

document.getElementById("newQuestionBtn").addEventListener("click", () => openQuestionModal(null));
document.getElementById("qModalClose").addEventListener("click", closeModal);
qModalOverlay.addEventListener("click", (e) => { if (e.target === qModalOverlay) closeModal(); });

function markModalDirty() { modalDirty = true; }
function markModalClean() { modalDirty = false; }

function optionRowHtml(i, value = "", checked = false) {
  return `
    <div class="opt-row">
      <input type="radio" name="correctOpt" value="${i}" ${checked ? "checked" : ""} required />
      <input type="text" class="opt-input" placeholder="Option ${i + 1}" value="${escapeHtml(value)}" required />
    </div>`;
}

function openQuestionModal(letter, isEdit = false) {
  editingLetter = letter;
  qLetterSelect.innerHTML = ALL_LETTERS.map((l) => `<option value="${l}">${l} — ${DIFFICULTY_LABEL[letterToDifficulty(l)]}</option>`).join("");
  document.getElementById("optionRows").innerHTML = [0, 1, 2, 3].map((i) => optionRowHtml(i)).join("");
  qDeleteBtn.classList.add("hidden");
  markModalClean();

  const existing = letter ? questionsCache[letter] : null;

  if (existing) {
    document.getElementById("qModalTitle").textContent = `Edit ${letter}`;
    qLetterSelect.value = letter;
    qLetterSelect.disabled = true;
    document.getElementById("qSerial").value = existing.serial ?? "";
    document.getElementById("qText").value = existing.text ?? "";
    document.getElementById("qScore").value = existing.score ?? "";
    document.getElementById("qTimeLimit").value = existing.timeLimitSeconds ?? DIFFICULTY_TIME_LIMIT_DEFAULT[existing.difficulty];
    document.getElementById("qDifficulty").value = DIFFICULTY_LABEL[existing.difficulty] ?? "";
    const rows = document.getElementById("optionRows");
    rows.innerHTML = (existing.options || ["", "", "", ""]).map((opt, i) => optionRowHtml(i, opt, i === existing.correctIndex)).join("");
    qDeleteBtn.classList.remove("hidden");
  } else {
    document.getElementById("qModalTitle").textContent = letter ? `Add question — key ${letter}` : "Add question";
    qLetterSelect.disabled = false;
    if (letter) qLetterSelect.value = letter;
    document.getElementById("qSerial").value = "";
    document.getElementById("qText").value = "";
    const diff = letterToDifficulty(qLetterSelect.value);
    document.getElementById("qScore").value = DIFFICULTY_SCORE_DEFAULT[diff] ?? "";
    document.getElementById("qTimeLimit").value = DIFFICULTY_TIME_LIMIT_DEFAULT[diff];
    document.getElementById("qDifficulty").value = DIFFICULTY_LABEL[diff];
  }

  qLetterSelect.onchange = () => {
    const diff = letterToDifficulty(qLetterSelect.value);
    document.getElementById("qDifficulty").value = DIFFICULTY_LABEL[diff];
    if (!existing) {
      document.getElementById("qTimeLimit").value = DIFFICULTY_TIME_LIMIT_DEFAULT[diff];
      document.getElementById("qScore").value = DIFFICULTY_SCORE_DEFAULT[diff] ?? "";
    }
  };

  // Track dirty state for unsaved changes guard
  document.querySelectorAll("#qForm input, #qForm select, #qForm textarea").forEach((el) => {
    el.addEventListener("input", markModalDirty);
    el.addEventListener("change", markModalDirty);
  });

  qModalOverlay.classList.remove("hidden");
}

function closeModal() {
  if (modalDirty && !confirm("You have unsaved changes. Discard them?")) return;
  qModalOverlay.classList.add("hidden");
  editingLetter = null;
  markModalClean();
}

qForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const letter = qLetterSelect.value;
  const options = Array.from(document.querySelectorAll(".opt-input")).map((i) => i.value.trim());
  const correctRadio = qForm.querySelector('input[name="correctOpt"]:checked');
  if (!correctRadio) { showToast("Select the correct option", "error"); return; }

  const payload = {
    serial: Number(document.getElementById("qSerial").value),
    text: document.getElementById("qText").value.trim(),
    options,
    correctIndex: Number(correctRadio.value),
    score: Number(document.getElementById("qScore").value),
    timeLimitSeconds: Number(document.getElementById("qTimeLimit").value) || DIFFICULTY_TIME_LIMIT_DEFAULT[letterToDifficulty(letter)],
    difficulty: letterToDifficulty(letter),
    released: questionsCache[letter]?.released || false,
    releasedAt: questionsCache[letter]?.releasedAt || null
  };

  await set(ref(db, `questions/${letter}`), payload);
  markModalClean();
  showToast(`Saved ${letter}`, "success");
  closeModal();
});

qDeleteBtn.addEventListener("click", async () => {
  if (!editingLetter) return;
  if (!confirm(`Delete the question on key ${editingLetter}?`)) return;
  await remove(ref(db, `questions/${editingLetter}`));
  showToast(`Deleted ${editingLetter}`);
  closeModal();
});

// ---------------------------------------------------------------- timer
function wireStaticControls() {
  document.getElementById("startTimerBtn").addEventListener("click", startTimer);
  document.getElementById("resetTimerBtn").addEventListener("click", resetTimer);
  document.getElementById("releaseScoreBtn").addEventListener("click", releaseScore);
  document.getElementById("exportDataBtn").addEventListener("click", exportData);
}

async function startTimer() {
  // Validate that at least one question exists
  if (!Object.keys(questionsCache).length) {
    showToast("Add at least one question before starting the quiz", "error");
    return;
  }
  const minutes = Math.max(1, Number(document.getElementById("durationInput").value) || 1);
  try {
    await set(ref(db, "quizState"), {
      timerStart: Date.now(),
      timerDuration: minutes * 60,
      timerRunning: true,
      scoresReleased: false
    });
    showToast(`Timer started — ${minutes} min`, "success");
  } catch (err) {
    showToast(`Couldn't start the quiz: ${err.message || err.code || "unknown error"}`, "error");
  }
}

async function resetTimer() {
  try {
    await update(ref(db, "quizState"), { timerRunning: false, timerStart: null });
    showToast("Timer reset");
  } catch (err) {
    showToast(`Couldn't reset the timer: ${err.message || err.code || "unknown error"}`);
  }
}

function listenQuizState() {
  onValue(ref(db, "quizState"), (snap) => {
    quizState = snap.val() || {};
    renderTimer();
    renderOverview();
  });
}

function renderTimer() {
  clearInterval(timerInterval);
  const display = document.getElementById("timerDisplay");
  const label = document.getElementById("timerStatusLabel");

  if (!quizState.timerRunning || !quizState.timerStart) {
    display.textContent = formatClock(quizState.timerDuration || 0);
    display.className = "timer-display";
    label.textContent = "Not started";
    return;
  }

  const tick = () => {
    const elapsed = (Date.now() - quizState.timerStart) / 1000;
    const remaining = quizState.timerDuration - elapsed;
    display.textContent = formatClock(remaining);
    if (remaining <= 0) {
      display.className = "timer-display done";
      label.textContent = "Time's up — late joiners now go straight to the coding challenge";
      clearInterval(timerInterval);
      renderOverview(); // phase just flipped to "ended" without a fresh quizState write
    } else if (remaining <= 30) {
      display.className = "timer-display warn";
      label.textContent = "Ending soon";
    } else {
      display.className = "timer-display running";
      label.textContent = "In progress — synced to every participant";
    }
  };
  tick();
  timerInterval = setInterval(tick, 250);
}

async function releaseScore() {
  if (!confirm("Publish final combined results (Quiz + Code Challenge) to every participant now?")) return;
  const ranked = computeCombinedRanking(participantsCache, questionsCache);
  const top10 = {};
  ranked.slice(0, 10).forEach((p, i) => {
    top10[i] = {
      uid: p.uid, name: p.name, lab: p.lab, terminal: p.terminal,
      quizScore: p.quizScore, codeScore: p.codeScore, totalScore: p.combinedScore,
      completedAt: p.completedAt || null, startedAt: p.startedAt || null
    };
  });
  try {
    await set(ref(db, "leaderboard"), top10);
    await update(ref(db, "quizState"), { scoresReleased: true });
    showToast("Final results published to all participants");
  } catch (err) {
    showToast(`Couldn't publish results: ${err.message || err.code || "unknown error"}`);
  }
}

// ---------------------------------------------------------------- participants / leaderboard
function listenParticipants() {
  onValue(ref(db, "participants"), (snap) => {
    participantsCache = snap.val() || {};
    document.getElementById("participantCount").textContent = `${Object.keys(participantsCache).length} connected`;
    renderLeaderboard();
    renderSubmissions();
    renderOverview();
  });
}

function renderLeaderboard() {
  const ranked = computeCombinedRanking(participantsCache, questionsCache);
  const completed = ranked.filter((p) => p.completedAt);
  document.getElementById("statTotal").textContent = ranked.length;
  document.getElementById("statCompleted").textContent = completed.length;
  document.getElementById("statTop").textContent = ranked[0]?.combinedScore ?? "—";
  document.getElementById("scoreReleaseStatus").textContent = quizState.scoresReleased ? "Live — visible to participants" : "Scores not released yet";

  const podiumWrap = document.getElementById("podiumWrap");
  const podium = document.getElementById("podium");
  const top3 = ranked.slice(0, 3);
  if (top3.length) {
    podiumWrap.classList.remove("hidden");
    const order = [1, 0, 2].filter((i) => top3[i]); // silver, gold, bronze visual order
    podium.innerHTML = order.map((i) => {
      const p = top3[i];
      const place = i + 1;
      return `<div class="podium-slot p${place}">
        <div class="podium-avatar">${(p.name || "?").slice(0, 1).toUpperCase()}</div>
        <div class="podium-name">${escapeHtml(p.name || "—")}</div>
        <div class="podium-score">${p.combinedScore || 0} pts</div>
        <div class="podium-bar">${place}</div>
      </div>`;
    }).join("");
  } else {
    podiumWrap.classList.add("hidden");
  }

  const tbody = document.getElementById("leaderboardBody");
  tbody.innerHTML = ranked.slice(0, 10).map((p, i) => `
    <tr class="rank-${i + 1}">
      <td>${i + 1}</td>
      <td>${escapeHtml(p.name || "—")}</td>
      <td>${escapeHtml(p.lab || "—")}</td>
      <td>${escapeHtml(p.terminal || "—")}</td>
      <td>${p.quizScore || 0}</td>
      <td>${p.codeScore || 0}</td>
      <td>${p.combinedScore || 0}</td>
      <td>${p.completedAt ? formatDuration(p.completedAt - (p.startedAt || p.completedAt)) : "—"}</td>
    </tr>`).join("") || `<tr><td colspan="8" style="color:var(--text-faint)">No participants yet</td></tr>`;
}

// ---------------------------------------------------------------- coding challenge
function listenCodeChallenge() {
  onValue(ref(db, "codeChallenge"), (snap) => {
    codeChallengeCache = snap.val() || {};
    renderCodeChallengeStatus();
    renderSubmissions();
    renderOverview();
  });
}

function wireCodeChallengeControls() {
  document.getElementById("ccSaveDraftBtn").addEventListener("click", () => saveCodeChallenge(false));
  document.getElementById("ccReleaseBtn").addEventListener("click", () => saveCodeChallenge(true));
  document.getElementById("ccUnpublishBtn").addEventListener("click", unpublishCodeChallenge);
  document.getElementById("ccSubModalClose").addEventListener("click", closeSubModal);
  document.getElementById("ccSubModalOverlay").addEventListener("click", (e) => {
    if (e.target === document.getElementById("ccSubModalOverlay")) closeSubModal();
  });
}

async function saveCodeChallenge(release) {
  const minutes = Math.max(1, Number(document.getElementById("ccDurationMinutes").value) || 15);
  const payload = {
    title: document.getElementById("ccTitle").value.trim(),
    statement: document.getElementById("ccStatement").value.trim(),
    starterCode: document.getElementById("ccStarterCode").value,
    language: document.getElementById("ccLanguage").value.trim() || "plaintext",
    durationSeconds: minutes * 60,
    released: release,
    releasedAt: release ? Date.now() : (codeChallengeCache.releasedAt || null)
  };
  if (!payload.title || !payload.statement) {
    showToast("Add a title and problem statement first");
    return;
  }
  try {
    await set(ref(db, "codeChallenge"), payload);
    showToast(release ? `Problem statement released — ${minutes} min on the clock` : "Draft saved");
  } catch (err) {
    showToast(`Couldn't save: ${err.message || err.code || "unknown error"}`);
  }
}

async function unpublishCodeChallenge() {
  if (!confirm("Hide the problem statement from participants? Their in-progress code stays saved.")) return;
  try {
    await update(ref(db, "codeChallenge"), { released: false });
    showToast("Problem statement unpublished");
  } catch (err) {
    showToast(`Couldn't unpublish: ${err.message || err.code || "unknown error"}`);
  }
}

function renderCodeChallengeStatus() {
  const cc = codeChallengeCache;
  document.getElementById("ccTitle").value = cc.title || "";
  document.getElementById("ccStatement").value = cc.statement || "";
  document.getElementById("ccStarterCode").value = cc.starterCode || "";
  document.getElementById("ccLanguage").value = cc.language || "";
  document.getElementById("ccDurationMinutes").value = cc.durationSeconds ? Math.round(cc.durationSeconds / 60) : 15;

  const statusEl = document.getElementById("ccStatus");
  if (cc.released) {
    statusEl.innerHTML = `<span class="tag easy">Live</span> released ${cc.releasedAt ? new Date(cc.releasedAt).toLocaleTimeString() : ""} · ${cc.durationSeconds ? Math.round(cc.durationSeconds / 60) + " min" : ""}`;
  } else if (cc.title) {
    statusEl.innerHTML = `<span class="tag" style="color:var(--text-dim); background:transparent; border-color:var(--border);">Draft — not visible to participants</span>`;
  } else {
    statusEl.innerHTML = `<span style="color:var(--text-faint)">Nothing set up yet</span>`;
  }
}

function renderSubmissions() {
  const rows = Object.entries(participantsCache)
    .filter(([, p]) => p.codeSubmission && p.codeSubmission.code)
    .map(([uid, p]) => ({ uid, ...p }))
    .sort((a, b) => (a.codeSubmission.submittedAt || 0) - (b.codeSubmission.submittedAt || 0));

  document.getElementById("ccSubCount").textContent = `${rows.length} submitted`;
  renderReadinessStat();

  const tbody = document.getElementById("ccSubmissionsBody");
  tbody.innerHTML = rows.map((p) => `
    <tr>
      <td>${escapeHtml(p.name || "—")}</td>
      <td>${escapeHtml(p.lab || "—")}</td>
      <td>${escapeHtml(p.terminal || "—")}</td>
      <td>${p.codeSubmission.submittedAt ? new Date(p.codeSubmission.submittedAt).toLocaleTimeString() : "—"}${p.codeSubmission.autoSubmitted ? ' <span title="Auto-submitted when time ran out">⏱</span>' : ""}</td>
      <td><input type="number" min="0" max="100" class="cc-score-input" data-uid="${p.uid}" value="${p.codeSubmission.pointsAwarded ?? 0}" style="width:70px; background:#0E1219; border:1px solid var(--border); color:var(--text); border-radius:6px; padding:6px 8px; font-size:13px;" /> <span style="color:var(--text-faint); font-size:11px;">/ 100</span></td>
      <td><button class="btn btn-sm" data-view="${p.uid}">View code</button></td>
    </tr>`).join("") || `<tr><td colspan="6" style="color:var(--text-faint)">No submissions yet</td></tr>`;

  tbody.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => openSubModal(rows.find((r) => r.uid === b.dataset.view))));
  tbody.querySelectorAll(".cc-score-input").forEach((input) => {
    input.addEventListener("change", async () => {
      const uid = input.dataset.uid;
      const points = Math.min(100, Math.max(0, Number(input.value) || 0));
      input.value = points;
      try {
        await update(ref(db, `participants/${uid}/codeSubmission`), { pointsAwarded: points });
        showToast("Code challenge score saved (out of 100)");
      } catch (err) {
        showToast(`Couldn't save score: ${err.message || err.code || "unknown error"}`);
      }
    });
  });
}

// Lets the admin "assure" the group is ready before publishing the coding
// challenge — how many participants have finished every released question.
function renderReadinessStat() {
  const el = document.getElementById("ccReadinessStat");
  if (!el) return;
  const total = Object.keys(participantsCache).length;
  const finished = Object.values(participantsCache).filter((p) => p.submitted === true).length;
  el.textContent = total ? `${finished} of ${total} participants have finished the quiz` : "No participants connected yet";
}

function openSubModal(p) {
  if (!p) return;
  document.getElementById("ccSubModalTitle").textContent = `${p.name} — Lab ${p.lab} / Terminal ${p.terminal}`;
  document.getElementById("ccSubModalCode").textContent = p.codeSubmission.code || "";
  document.getElementById("ccSubModalOverlay").classList.remove("hidden");
}

function closeSubModal() {
  document.getElementById("ccSubModalOverlay").classList.add("hidden");
}

// ---------------------------------------------------------------- resets
function wireResetControls() {
  document.getElementById("resetReleasesBtn").addEventListener("click", resetReleases);
  document.getElementById("resetSessionBtn").addEventListener("click", resetEntireSession);
}

async function resetReleases() {
  if (!Object.keys(questionsCache).length) { showToast("No questions to reset"); return; }
  if (!confirm("Reset every question back to pending? The keyboard grid goes dark for all participants — their existing answers and scores are kept as-is.")) return;

  const updates = {};
  Object.keys(questionsCache).forEach((letter) => {
    updates[`${letter}/released`] = false;
    updates[`${letter}/releasedAt`] = null;
  });
  try {
    await update(ref(db, "questions"), updates);
    showToast("Release grid reset — all keys are pending again");
  } catch (err) {
    showToast(`Reset failed: ${err.message || err.code || "unknown error"}`);
  }
}

async function resetEntireSession() {
  if (!confirm("This clears every participant, score, the leaderboard, and the coding challenge, and resets the timer and release grid. Question content and admin accounts are kept. Continue?")) return;
  if (!confirm("This can't be undone. Reset the whole session now?")) return;

  const updates = { participants: null, leaderboard: null, codeChallenge: null };
  Object.keys(questionsCache).forEach((letter) => {
    updates[`questions/${letter}/released`] = false;
    updates[`questions/${letter}/releasedAt`] = null;
  });
  updates.quizState = { timerRunning: false, timerStart: null, timerDuration: 0, scoresReleased: false };
  try {
    await update(ref(db), updates);
    showToast("Session reset — ready for a new run");
  } catch (err) {
    showToast(`Session reset failed: ${err.message || err.code || "unknown error"}`);
  }
}

// ---------------------------------------------------------------- admin accounts
function listenAdmins() {
  listenAdminProfiles((snap) => {
    const profiles = snap.val() || {};
    renderAdminTable(profiles);
  });
}

function renderAdminTable(profiles) {
  const tbody = document.getElementById("adminTableBody");
  const rows = Object.entries(profiles).sort((a, b) => (a[1].addedAt || 0) - (b[1].addedAt || 0));
  tbody.innerHTML = rows.map(([uid, p]) => `
    <tr>
      <td>${escapeHtml(p.email || uid)}${currentUser && uid === currentUser.uid ? " (you)" : ""}</td>
      <td>${p.addedAt ? new Date(p.addedAt).toLocaleString() : "—"}</td>
    </tr>`).join("") || `<tr><td colspan="2" style="color:var(--text-faint)">No admin profiles recorded yet</td></tr>`;
}

function wireAdminAccountControls() {
  document.getElementById("addAdminForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("newAdminEmail").value.trim();
    const password = document.getElementById("newAdminPassword").value;
    const btn = document.getElementById("addAdminBtn");
    const errEl = document.getElementById("addAdminError");
    errEl.classList.remove("show");
    btn.disabled = true;
    btn.textContent = "Adding…";
    try {
      await addNewAdmin(email, password);
      showToast(`${email} added as an admin`);
      document.getElementById("addAdminForm").reset();
    } catch (err) {
      errEl.textContent = friendlyAdminError(err);
      errEl.classList.add("show");
    } finally {
      btn.disabled = false;
      btn.textContent = "Add admin";
    }
  });
}

function friendlyAdminError(err) {
  const code = err.code || "";
  if (code.includes("email-already-in-use")) return "That email is already registered.";
  if (code.includes("weak-password")) return "Password must be at least 6 characters.";
  if (code.includes("invalid-email")) return "Enter a valid email address.";
  return "Couldn't add that admin. Check the details and try again.";
}

// ---------------------------------------------------------------- export
function exportData() {
  if (typeof XLSX === "undefined") {
    showToast("Export library didn't load — check your internet connection", "error");
    return;
  }
  const participants = Object.entries(participantsCache).map(([uid, p]) => ({ uid, ...p }));
  if (!participants.length) {
    showToast("No participants to export yet", "error");
    return;
  }

  const releasedQuestions = Object.values(questionsCache).filter((q) => q && q.released);
  const maxRawQuizScore = releasedQuestions.reduce((sum, q) => sum + (q.score || 0), 0);
  const letters = ALL_LETTERS.filter((l) => questionsCache[l]);

  const rows = participants.map((p) => {
    const rawQuizScore = p.totalScore || 0;
    const quizScore = maxRawQuizScore > 0
      ? Math.round((rawQuizScore / maxRawQuizScore) * QUIZ_MAX_MARKS)
      : 0;
    const codeScore = Math.min(CODE_CHALLENGE_MAX_MARKS, Math.max(0, (p.codeSubmission && p.codeSubmission.pointsAwarded) || 0));
    const row = {
      "Name": p.name || "",
      "Email": p.email || "",
      "Lab No.": p.lab || "",
      "Terminal No.": p.terminal || "",
      "Raw Quiz Score (Earned)": rawQuizScore,
      "Normalized Quiz Score (/100)": quizScore,
      "Code Challenge Score (/100)": codeScore,
      "Final Score (/200)": quizScore + codeScore,
      "Quiz Started At": p.startedAt ? new Date(p.startedAt).toLocaleString() : "",
      "Quiz Completed At": p.completedAt ? new Date(p.completedAt).toLocaleString() : "",
      "Quiz Duration": p.completedAt ? formatDuration(p.completedAt - (p.startedAt || p.completedAt)) : "",
      "All Quiz Questions Answered": p.submitted ? "Yes" : "No",
      "Code Submitted At": (p.codeSubmission && p.codeSubmission.submittedAt) ? new Date(p.codeSubmission.submittedAt).toLocaleString() : "",
      "Code Auto-Submitted (time ran out)": (p.codeSubmission && p.codeSubmission.autoSubmitted) ? "Yes" : "No",
      "Code Submission": (p.codeSubmission && p.codeSubmission.code) || "",
      "Code Language": (p.codeSubmission && p.codeSubmission.language) || ""
    };
    letters.forEach((letter) => {
      const q = questionsCache[letter];
      const a = p.answers && p.answers[letter];
      const hasAnswer = a && a.selectedIndex !== null && a.selectedIndex !== undefined;
      row[`Q${letter} (#${q.serial}) — Score`] = q.score || 0;
      row[`Q${letter} (#${q.serial}) — Answer`] = hasAnswer ? (q.options?.[a.selectedIndex] ?? `Option ${a.selectedIndex + 1}`) : (a ? "No answer (time ran out)" : "Not reached");
      row[`Q${letter} (#${q.serial}) — Correct`] = hasAnswer ? (a.correct ? "Yes" : "No") : (a ? "No" : "—");
      row[`Q${letter} (#${q.serial}) — Points Earned`] = a ? (a.pointsEarned || 0) : 0;
      row[`Q${letter} (#${q.serial}) — Difficulty`] = DIFFICULTY_LABEL[q.difficulty];
    });
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "CodeQuest Results");
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  XLSX.writeFile(wb, `codequest-results-${stamp}.xlsx`);
  showToast("Spreadsheet exported", "success");
}

// Table scroll shadow detection
function updateTableScrollHint(wrapper) {
  if (!wrapper) return;
  const hasScroll = wrapper.scrollWidth > wrapper.clientWidth;
  if (!hasScroll) { wrapper.className = "table-wrap"; return; }
  const atStart = wrapper.scrollLeft <= 2;
  const atEnd = wrapper.scrollLeft >= wrapper.scrollWidth - wrapper.clientWidth - 2;
  wrapper.className = atStart && atEnd ? "table-wrap" :
    atStart ? "table-wrap scroll-right" :
    atEnd ? "table-wrap scroll-end" : "table-wrap scroll-both";
}

// Wire up scroll detection on all table wraps
document.querySelectorAll(".table-wrap").forEach((wrap) => {
  wrap.addEventListener("scroll", () => updateTableScrollHint(wrap));
  new ResizeObserver(() => updateTableScrollHint(wrap)).observe(wrap);
});

// ---------------------------------------------------------------- event overview
function renderOverview() {
  const grid = document.getElementById("statusGrid");
  if (!grid) return;

  const phase = getQuizPhase(quizState);
  const quizStatus = phase === "not_started"
    ? { dot: "idle", text: "Not started" }
    : phase === "running"
      ? { dot: "active", text: "Running" }
      : { dot: "done", text: "Ended" };

  const answeredParticipants = Object.values(participantsCache).filter((p) => p.completedAt).length;
  const totalParticipants = Object.keys(participantsCache).length;

  const ccStatus = !codeChallengeCache.title
    ? { dot: "idle", text: "Not set up" }
    : codeChallengeCache.released
      ? { dot: "active", text: "Live" }
      : { dot: "warn", text: "Draft saved" };

  const submissionCount = Object.values(participantsCache).filter((p) => p.codeSubmission && p.codeSubmission.code).length;

  const resultsStatus = quizState.scoresReleased
    ? { dot: "done", text: "Published" }
    : { dot: "idle", text: "Not published" };

  const cards = [
    { label: "Quiz", dot: quizStatus.dot, value: quizStatus.text, sub: `${answeredParticipants}/${totalParticipants} finished the quiz` },
    { label: "Coding challenge", dot: ccStatus.dot, value: ccStatus.text, sub: `${submissionCount} submission${submissionCount === 1 ? "" : "s"}` },
    { label: "Final results", dot: resultsStatus.dot, value: resultsStatus.text, sub: quizState.scoresReleased ? "Visible to participants" : "Grade code, then publish" },
    { label: "Connected", dot: totalParticipants ? "active" : "idle", value: String(totalParticipants), sub: "participant devices" }
  ];

  grid.innerHTML = cards.map((c) => `
    <div class="status-card">
      <div class="label">${c.label}</div>
      <div class="value"><span class="status-dot ${c.dot}"></span>${escapeHtml(c.value)}</div>
      <div class="panel-sub" style="margin-top:6px;">${escapeHtml(c.sub)}</div>
    </div>`).join("");
}

// ---------------------------------------------------------------- toast (stacked)
function showToast(msg, type = "default") {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const el = document.createElement("div");
  el.className = `toast ${type !== "default" ? type : ""}`;
  el.textContent = msg;
  container.appendChild(el);
  // Trigger reflow for animation
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("show")));
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 260);
  }, 2800);
}
