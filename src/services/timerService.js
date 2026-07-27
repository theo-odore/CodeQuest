import { prisma } from '../db.js';

export const TOTAL_QUIZ_DURATION_SEC = 59 * 60; // 3540 seconds (59 minutes)

/**
 * Checks and updates session timer state.
 * Returns session state object with server-computed remaining seconds.
 * Auto-submits session if timer has elapsed.
 */
export async function getOrUpdateSessionState(userId) {
  let session = await prisma.session.findFirst({
    where: { user_id: userId },
  });

  if (!session) {
    return { status: 'NOT_STARTED', remaining_sec: TOTAL_QUIZ_DURATION_SEC, session: null };
  }

  if (session.status === 'SUBMITTED') {
    return {
      status: 'SUBMITTED',
      remaining_sec: 0,
      total_time_sec: session.total_time_sec,
      auto_score: session.auto_score,
      session,
    };
  }

  if (session.status === 'IN_PROGRESS' && session.start_time) {
    const now = new Date();
    const elapsedSec = Math.floor((now.getTime() - new Date(session.start_time).getTime()) / 1000);
    const remainingSec = TOTAL_QUIZ_DURATION_SEC - elapsedSec;

    if (remainingSec <= 0) {
      // Auto-submit session when timer hits zero
      session = await finalizeSession(session.id, 3540);
      return {
        status: 'SUBMITTED',
        remaining_sec: 0,
        total_time_sec: 3540,
        auto_score: session.auto_score,
        auto_submitted: true,
        session,
      };
    }

    return {
      status: 'IN_PROGRESS',
      remaining_sec: remainingSec,
      elapsed_sec: elapsedSec,
      current_phase: session.current_phase,
      session,
    };
  }

  return { status: session.status, remaining_sec: TOTAL_QUIZ_DURATION_SEC, session };
}

/**
 * Finalize session, calculate total auto_score from Phase 1 (EASY), Phase 2 (MEDIUM), and Phase 3 (HARD auto-graded test cases).
 * Winner determination order: auto_score DESC, total_time_sec ASC, end_time ASC.
 */
export async function finalizeSession(sessionId, overrideTimeSec = null) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: true },
  });

  if (!session || session.status === 'SUBMITTED') {
    return session;
  }

  const now = new Date();
  const startTime = session.start_time ? new Date(session.start_time) : now;
  const elapsedSec = Math.min(
    TOTAL_QUIZ_DURATION_SEC,
    Math.floor((now.getTime() - startTime.getTime()) / 1000)
  );

  const totalTimeSec = overrideTimeSec !== null ? overrideTimeSec : elapsedSec;

  // Fetch all attempts by this user
  const userAttempts = await prisma.attempt.findMany({
    where: { user_id: session.user_id },
    include: { question: true },
  });

  const autoScore = userAttempts.reduce((sum, att) => {
    if (att.question.phase === 'EASY' || att.question.phase === 'MEDIUM') {
      return att.is_correct ? sum + att.question.points : sum;
    } else if (att.question.phase === 'HARD') {
      if (att.total_test_cases > 0) {
        const ratio = att.test_cases_passed / att.total_test_cases;
        const partialPoints = Math.round(att.question.points * ratio);
        return sum + partialPoints;
      }
    }
    return sum;
  }, 0);

  const updatedSession = await prisma.session.update({
    where: { id: sessionId },
    data: {
      status: 'SUBMITTED',
      end_time: now,
      total_time_sec: totalTimeSec,
      auto_score: autoScore,
    },
  });

  return updatedSession;
}
