import express from 'express';
import { prisma } from '../db.js';
import { authenticateToken, requireParticipant } from '../middleware/auth.js';
import { writeRateLimiter } from '../middleware/rateLimit.js';
import { getOrUpdateSessionState, finalizeSession, TOTAL_QUIZ_DURATION_SEC } from '../services/timerService.js';
import { notifyAdmin } from '../websocket.js';

const router = express.Router();

// Apply authentication to all session routes
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

// POST /session/start (Starts or Resets quiz session to IN_PROGRESS)
router.post('/start', writeRateLimiter, async (req, res) => {
  try {
    let session = await prisma.session.findFirst({ where: { user_id: req.user.id } });
    const now = new Date();

    if (session) {
      // Clear previous attempts for a fresh session run
      await prisma.attempt.deleteMany({ where: { user_id: req.user.id } });

      session = await prisma.session.update({
        where: { id: session.id },
        data: {
          start_time: now,
          end_time: null,
          status: 'IN_PROGRESS',
          current_phase: 'EASY',
          auto_score: 0,
          total_time_sec: 0,
        },
      });
    } else {
      session = await prisma.session.create({
        data: {
          user_id: req.user.id,
          start_time: now,
          status: 'IN_PROGRESS',
          current_phase: 'EASY',
        },
      });
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
    else return res.status(400).json({ error: 'Already at final phase (HARD). Submit session when finished.' });

    const updatedSession = await prisma.session.update({
      where: { id: state.session.id },
      data: { current_phase: nextPhase },
    });

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
    const session = await prisma.session.findFirst({ where: { user_id: req.user.id } });

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
