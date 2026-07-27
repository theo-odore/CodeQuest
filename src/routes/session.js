import express from 'express';
import crypto from 'crypto';
import { supabase } from '../supabase.js';
import { authenticateToken, requireParticipant } from '../middleware/auth.js';
import { writeRateLimiter } from '../middleware/rateLimit.js';
import { getOrUpdateSessionState, finalizeSession, TOTAL_QUIZ_DURATION_SEC } from '../services/timerService.js';
import { notifyAdmin } from '../websocket.js';

const router = express.Router();

router.use(authenticateToken, requireParticipant);

// GET /session/status
router.get('/status', async (req, res) => {
  try {
    const state = await getOrUpdateSessionState(req.user.id);
    res.json(state);
  } catch (error) {
    console.error('Session status error:', error);
    res.status(500).json({ error: 'Failed to retrieve session status' });
  }
});

// POST /session/start
router.post('/start', writeRateLimiter, async (req, res) => {
  try {
    const { data: existingSession } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', req.user.id)
      .maybeSingle();

    const now = new Date().toISOString();
    let session = null;

    if (existingSession) {
      await supabase.from('attempts').delete().eq('user_id', req.user.id);

      const { data: updatedSession, error: updateErr } = await supabase
        .from('sessions')
        .update({
          start_time: now,
          end_time: null,
          status: 'IN_PROGRESS',
          current_phase: 'EASY',
          auto_score: 0,
          total_time_sec: 0,
        })
        .eq('id', existingSession.id)
        .select()
        .single();

      if (updateErr) throw updateErr;
      session = updatedSession;
    } else {
      const { data: newSession, error: createErr } = await supabase
        .from('sessions')
        .insert({
          id: crypto.randomUUID(),
          user_id: req.user.id,
          start_time: now,
          status: 'IN_PROGRESS',
          current_phase: 'EASY',
        })
        .select()
        .single();

      if (createErr) throw createErr;
      session = newSession;
    }

    notifyAdmin('SESSION_STARTED', {
      user_id: req.user.id,
      user_name: req.user.name,
      college_id: req.user.college_id,
      start_time: now,
    });

    res.json({
      message: 'Quiz session started successfully',
      session,
      remaining_sec: TOTAL_QUIZ_DURATION_SEC,
    });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({ error: 'Failed to start quiz session' });
  }
});

// POST /session/phase/advance
router.post('/phase/advance', writeRateLimiter, async (req, res) => {
  try {
    const state = await getOrUpdateSessionState(req.user.id);

    if (state.status !== 'IN_PROGRESS') {
      return res.status(400).json({ error: 'Quiz session is not active', status: state.status });
    }

    const currentPhase = state.current_phase;
    let nextPhase = null;

    if (currentPhase === 'EASY') nextPhase = 'MEDIUM';
    else if (currentPhase === 'MEDIUM') nextPhase = 'HARD';
    else return res.status(400).json({ error: 'Already at final phase (HARD).' });

    const { data: updatedSession, error: updateErr } = await supabase
      .from('sessions')
      .update({ current_phase: nextPhase })
      .eq('id', state.session.id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    notifyAdmin('PHASE_ADVANCED', {
      user_id: req.user.id,
      user_name: req.user.name,
      previous_phase: currentPhase,
      current_phase: nextPhase,
    });

    res.json({
      message: `Advanced to Phase: ${nextPhase}`,
      current_phase: nextPhase,
      remaining_sec: state.remaining_sec,
    });
  } catch (error) {
    console.error('Advance phase error:', error);
    res.status(500).json({ error: 'Failed to advance phase' });
  }
});

// POST /session/submit
router.post('/submit', writeRateLimiter, async (req, res) => {
  try {
    const { data: session } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (!session) {
      return res.status(404).json({ error: 'No quiz session found' });
    }

    if (session.status === 'SUBMITTED') {
      return res.json({ message: 'Session already submitted', session });
    }

    const finalizedSession = await finalizeSession(session.id);

    notifyAdmin('SESSION_SUBMITTED', {
      user_id: req.user.id,
      user_name: req.user.name,
      college_id: req.user.college_id,
      auto_score: finalizedSession.auto_score,
      total_time_sec: finalizedSession.total_time_sec,
    });

    res.json({
      message: 'Quiz session submitted successfully',
      session: finalizedSession,
    });
  } catch (error) {
    console.error('Submit session error:', error);
    res.status(500).json({ error: 'Failed to submit quiz session' });
  }
});

export default router;
