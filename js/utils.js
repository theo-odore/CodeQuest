// ============================================================================
// utils.js — shared helpers, the keyboard layout map, and the seed question set
// ============================================================================

// The three literal keyboard rows double as the three difficulty tiers.
export const KEYBOARD_ROWS = [
  { row: "top", difficulty: "easy", keys: ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"] },
  { row: "home", difficulty: "medium", keys: ["A", "S", "D", "F", "G", "H", "J", "K", "L"] },
  { row: "bottom", difficulty: "hard", keys: ["Z", "X", "C", "V", "B", "N", "M"] }
];

export const ALL_LETTERS = KEYBOARD_ROWS.flatMap(r => r.keys);

export function letterToDifficulty(letter) {
  const row = KEYBOARD_ROWS.find(r => r.keys.includes(letter.toUpperCase()));
  return row ? row.difficulty : null;
}

export const DIFFICULTY_LABEL = { easy: "Easy", medium: "Medium", hard: "Hard" };
export const DIFFICULTY_SCORE_DEFAULT = { easy: 10, medium: 20, hard: 30 };
export const DIFFICULTY_TIME_LIMIT_DEFAULT = { easy: 60, medium: 90, hard: 120 }; // seconds

/**
 * Picks the single question a participant should be working on right now:
 * the earliest-released question (by releasedAt, falling back to serial)
 * that this participant hasn't answered yet. Returns null when there's
 * nothing released, or when every released question is already answered.
 */
export function pickActiveQuestion(questionsObj, answersObj) {
  const answered = answersObj || {};
  const releasedList = Object.entries(questionsObj || {})
    .filter(([letter, q]) => q && q.released && !answered[letter])
    .map(([letter, q]) => ({ letter, ...q }));
  releasedList.sort((a, b) => (a.releasedAt || 0) - (b.releasedAt || 0) || (a.serial || 0) - (b.serial || 0));
  return releasedList[0] || null;
}

export function allReleasedAnswered(questionsObj, answersObj) {
  const answered = answersObj || {};
  const releasedLetters = Object.entries(questionsObj || {}).filter(([, q]) => q && q.released).map(([letter]) => letter);
  if (!releasedLetters.length) return false;
  return releasedLetters.every((letter) => answered[letter] !== undefined);
}

/** True once a participant has answered every question released so far
 * (and at least one question has been released) — used to freeze their
 * timer and switch their screen to "waiting for the coding challenge". */
export function hasFinishedReleasedQuestions(questionsObj, answersObj) {
  return allReleasedAnswered(questionsObj, answersObj);
}

export function formatClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const r = (s % 60).toString().padStart(2, "0");
  return `${m}:${r}`;
}

export function formatDuration(ms) {
  if (ms == null || isNaN(ms)) return "—";
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  const tenths = Math.floor((ms % 1000) / 100);
  return m > 0 ? `${m}m ${s}.${tenths}s` : `${s}.${tenths}s`;
}

// Deterministic short id for a device/session (used alongside Firebase Auth uid)
export function getSessionId() {
  let id = sessionStorage.getItem("cq_session_id");
  if (!id) {
    id = "sess_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    sessionStorage.setItem("cq_session_id", id);
  }
  return id;
}

export function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

export function computeRanking(participantsObj) {
  const list = Object.entries(participantsObj || {}).map(([uid, p]) => ({ uid, ...p }));
  list.sort((a, b) => {
    const sa = a.totalScore || 0, sb = b.totalScore || 0;
    if (sb !== sa) return sb - sa;
    const ta = a.completedAt ? a.completedAt - (a.startedAt || 0) : Infinity;
    const tb = b.completedAt ? b.completedAt - (b.startedAt || 0) : Infinity;
    return ta - tb;
  });
  return list;
}

export const QUIZ_MAX_MARKS = 100;
export const CODE_CHALLENGE_MAX_MARKS = 100;
export const TOTAL_MAX_MARKS = QUIZ_MAX_MARKS + CODE_CHALLENGE_MAX_MARKS;

/**
 * Ranks participants by Quiz score + Code Challenge score combined, both
 * normalized to a fixed 100-mark scale so the final result is always out of
 * 200 regardless of how many questions were released or what per-question
 * point values the admin chose:
 *
 *  - Quiz score: raw points earned, scaled against the total points
 *    available across the questions that were actually released this
 *    session (so releasing only 10 of 26 questions still tops out at 100).
 *  - Code Challenge score: whatever the admin awarded, clamped to 0–100
 *    (there's no auto-grader for free-form code).
 *
 * Ties break on quiz completion speed, same as before.
 */
export function computeCombinedRanking(participantsObj, questionsObj) {
  const releasedQuestions = Object.values(questionsObj || {}).filter((q) => q && q.released);
  const maxRawQuizScore = releasedQuestions.reduce((sum, q) => sum + (q.score || 0), 0);

  const list = Object.entries(participantsObj || {}).map(([uid, p]) => {
    const rawQuizScore = p.totalScore || 0;
    const quizScore = maxRawQuizScore > 0
      ? Math.round((rawQuizScore / maxRawQuizScore) * QUIZ_MAX_MARKS)
      : 0;
    const codeScoreRaw = (p.codeSubmission && p.codeSubmission.pointsAwarded) || 0;
    const codeScore = Math.min(CODE_CHALLENGE_MAX_MARKS, Math.max(0, codeScoreRaw));
    return { uid, ...p, rawQuizScore, quizScore, codeScore, combinedScore: quizScore + codeScore };
  });
  list.sort((a, b) => {
    if (b.combinedScore !== a.combinedScore) return b.combinedScore - a.combinedScore;
    const ta = a.completedAt ? a.completedAt - (a.startedAt || 0) : Infinity;
    const tb = b.completedAt ? b.completedAt - (b.startedAt || 0) : Infinity;
    return ta - tb;
  });
  return list;
}

/**
 * "not_started"  — admin hasn't clicked Start Quiz yet.
 * "running"      — the global quiz timer is counting down.
 * "ended"        — time's up. Anyone in this phase (including brand-new
 *                  joiners) should go straight to the coding challenge page.
 */
export function getQuizPhase(quizState) {
  const qs = quizState || {};
  if (!qs.timerRunning || !qs.timerStart) return "not_started";
  const endsAt = qs.timerStart + (qs.timerDuration || 0) * 1000;
  return Date.now() >= endsAt ? "ended" : "running";
}

// A starter bank so the admin dashboard isn't empty on first run.
// Serials are assigned per-letter; feel free to edit/delete/add from the UI.
export const SEED_QUESTIONS = {
  Q: { serial: 1, text: "Which keyword declares a block-scoped variable in JS?", options: ["var", "let", "global", "define"], correctIndex: 1, score: 10, timeLimitSeconds: 60 },
  W: { serial: 2, text: "What does HTML stand for?", options: ["HyperText Markup Language", "HighText Machine Language", "HyperTransfer Markup Language", "Home Tool Markup Language"], correctIndex: 0, score: 10, timeLimitSeconds: 60 },
  E: { serial: 3, text: "Which symbol starts a single-line comment in JS?", options: ["#", "//", "<!--", "%%"], correctIndex: 1, score: 10, timeLimitSeconds: 60 },
  R: { serial: 4, text: "What does CSS stand for?", options: ["Cascading Style Sheets", "Computer Style Sheets", "Creative Style System", "Colorful Style Sheets"], correctIndex: 0, score: 10, timeLimitSeconds: 60 },
  T: { serial: 5, text: "Which array method adds an item to the end?", options: ["shift()", "push()", "pop()", "unshift()"], correctIndex: 1, score: 10, timeLimitSeconds: 60 },
  Y: { serial: 6, text: "What tag creates a hyperlink in HTML?", options: ["<link>", "<a>", "<href>", "<nav>"], correctIndex: 1, score: 10, timeLimitSeconds: 60 },
  U: { serial: 7, text: "Which value type is `true` in JS?", options: ["String", "Number", "Boolean", "Object"], correctIndex: 2, score: 10, timeLimitSeconds: 60 },
  I: { serial: 8, text: "Which HTTP method retrieves data without side effects?", options: ["POST", "GET", "DELETE", "PUT"], correctIndex: 1, score: 10, timeLimitSeconds: 60 },
  O: { serial: 9, text: "What does JSON stand for?", options: ["JavaScript Object Notation", "Java Standard Object Notation", "JavaScript Ordered Nodes", "Joint Syntax Object Notation"], correctIndex: 0, score: 10, timeLimitSeconds: 60 },
  P: { serial: 10, text: "Which CSS property changes text color?", options: ["font-color", "text-color", "color", "fg-color"], correctIndex: 2, score: 10, timeLimitSeconds: 60 },

  A: { serial: 11, text: "What is the time complexity of binary search on a sorted array?", options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"], correctIndex: 1, score: 20, timeLimitSeconds: 90 },
  S: { serial: 12, text: "Which data structure uses LIFO order?", options: ["Queue", "Stack", "Tree", "Graph"], correctIndex: 1, score: 20, timeLimitSeconds: 90 },
  D: { serial: 13, text: "Which SQL clause filters grouped rows?", options: ["WHERE", "GROUP BY", "HAVING", "ORDER BY"], correctIndex: 2, score: 20, timeLimitSeconds: 90 },
  F: { serial: 14, text: "What does the `this` keyword refer to in a regular JS object method?", options: ["The global object always", "The object the method was called on", "The function itself", "undefined always"], correctIndex: 1, score: 20, timeLimitSeconds: 90 },
  G: { serial: 15, text: "Which sorting algorithm has O(n log n) average time complexity?", options: ["Bubble sort", "Insertion sort", "Merge sort", "Selection sort"], correctIndex: 2, score: 20, timeLimitSeconds: 90 },
  H: { serial: 16, text: "What does REST stand for in web APIs?", options: ["Remote State Transfer", "Representational State Transfer", "Reliable State Transaction", "Recursive State Transfer"], correctIndex: 1, score: 20, timeLimitSeconds: 90 },
  J: { serial: 17, text: "Which Git command creates a new branch and switches to it?", options: ["git branch -m", "git checkout -b", "git merge -b", "git switch --new"], correctIndex: 1, score: 20, timeLimitSeconds: 90 },
  K: { serial: 18, text: "In a relational database, what enforces referential integrity between tables?", options: ["Primary key", "Foreign key", "Index", "View"], correctIndex: 1, score: 20, timeLimitSeconds: 90 },
  L: { serial: 19, text: "Which HTTP status code means \"Not Found\"?", options: ["200", "301", "404", "500"], correctIndex: 2, score: 20, timeLimitSeconds: 90 },

  Z: { serial: 20, text: "Which concurrency issue occurs when two threads update shared state without synchronization?", options: ["Deadlock", "Race condition", "Starvation", "Livelock"], correctIndex: 1, score: 30, timeLimitSeconds: 120 },
  X: { serial: 21, text: "In Big-O terms, what is the worst-case time complexity of quicksort?", options: ["O(n log n)", "O(n)", "O(n^2)", "O(log n)"], correctIndex: 2, score: 30, timeLimitSeconds: 120 },
  C: { serial: 22, text: "Which design pattern restricts a class to a single instance?", options: ["Factory", "Observer", "Singleton", "Adapter"], correctIndex: 2, score: 30, timeLimitSeconds: 120 },
  V: { serial: 23, text: "What does CAP theorem say a distributed system can guarantee at most two of?", options: ["Consistency, Availability, Partition tolerance", "Cache, Auth, Performance", "Concurrency, Atomicity, Persistence", "Compression, Aggregation, Parallelism"], correctIndex: 0, score: 30, timeLimitSeconds: 120 },
  B: { serial: 24, text: "Which traversal visits a binary tree's left subtree, root, then right subtree?", options: ["Pre-order", "In-order", "Post-order", "Level-order"], correctIndex: 1, score: 30, timeLimitSeconds: 120 },
  N: { serial: 25, text: "What problem does dynamic programming primarily optimize away?", options: ["Redundant recomputation of overlapping subproblems", "Memory leaks", "Network latency", "Type coercion"], correctIndex: 0, score: 30, timeLimitSeconds: 120 },
  M: { serial: 26, text: "Which index structure is commonly used by databases for range queries?", options: ["Hash map", "B-tree", "Linked list", "Bloom filter"], correctIndex: 1, score: 30, timeLimitSeconds: 120 }
};
