import crypto from 'crypto';
import { supabase } from '../supabase.js';

export const TOTAL_QUIZ_DURATION_SEC = 59 * 60; // 3540 seconds (59 minutes)

/**
 * Checks and updates session timer state.
 * Returns session state object with server-computed remaining seconds.
 * Auto-submits session if timer has elapsed.
 */
export async function getOrUpdateSessionState(userId) {
  let { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (!session) {
    const now = new Date().toISOString();
    const { data: newSession, error: createErr } = await supabase
      .from('sessions')
      .insert({
        id: crypto.randomUUID(),
        user_id: userId,
        start_time: now,
        status: 'IN_PROGRESS',
        current_phase: 'EASY',
      })
      .select()
      .single();

    if (!createErr && newSession) {
      session = newSession;
    }
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
  const { data: session } = await supabase
    .from('sessions')
    .select('*, user:users(*)')
    .eq('id', sessionId)
    .single();

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

  const { data: userAttempts } = await supabase
    .from('attempts')
    .select('*, question:questions(*)')
    .eq('user_id', session.user_id);

  const autoScore = (userAttempts || []).reduce((sum, att) => {
    if (!att.question) return sum;
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

  const { data: updatedSession } = await supabase
    .from('sessions')
    .update({
      status: 'SUBMITTED',
      end_time: now.toISOString(),
      total_time_sec: totalTimeSec,
      auto_score: autoScore,
    })
    .eq('id', sessionId)
    .select()
    .single();

  return updatedSession;
}
