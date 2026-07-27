import express from 'express';
import { prisma } from '../db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { writeRateLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// Enforce authentication & admin role on all routes
router.use(authenticateToken, requireAdmin);

// GET /admin/questions
router.get('/questions', async (req, res) => {
  try {
    const questions = await prisma.question.findMany({
      orderBy: [{ phase: 'asc' }, { created_at: 'asc' }],
    });
    res.json({ total: questions.length, questions });
  } catch (error) {
    console.error('Admin get questions error:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// POST /admin/questions
router.post('/questions', writeRateLimiter, async (req, res) => {
  try {
    const {
      phase,
      type,
      text,
      code_snippet,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_option,
      expected_output,
      points = 10,
    } = req.body;

    if (!phase || !type || !text) {
      return res.status(400).json({ error: 'phase, type, and text are required fields' });
    }

    const question = await prisma.question.create({
      data: {
        phase: phase.toUpperCase(),
        type: type.toUpperCase(),
        text,
        code_snippet,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_option,
        expected_output,
        points: Number(points) || 10,
        created_by_admin_id: req.user.id,
      },
    });

    res.status(201).json({ message: 'Question created successfully', question });
  } catch (error) {
    console.error('Admin create question error:', error);
    res.status(500).json({ error: 'Failed to create question' });
  }
});

// PUT /admin/questions/:id
router.put('/questions/:id', writeRateLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.phase) updateData.phase = updateData.phase.toUpperCase();
    if (updateData.type) updateData.type = updateData.type.toUpperCase();
    if (updateData.points) updateData.points = Number(updateData.points);

    const question = await prisma.question.update({
      where: { id },
      data: updateData,
    });

    res.json({ message: 'Question updated successfully', question });
  } catch (error) {
    console.error('Admin update question error:', error);
    res.status(500).json({ error: 'Failed to update question' });
  }
});

// DELETE /admin/questions/:id
router.delete('/questions/:id', writeRateLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.question.delete({ where: { id } });
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Admin delete question error:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

// GET /admin/results
// Deterministic ranking: ORDER BY auto_score DESC, total_time_sec ASC, end_time ASC
router.get('/results', async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            college_id: true,
          },
        },
      },
      orderBy: [
        { auto_score: 'desc' },
        { total_time_sec: 'asc' },
        { end_time: 'asc' },
      ],
    });

    const leaderboard = sessions.map((s, index) => ({
      rank: index + 1,
      user_id: s.user.id,
      name: s.user.name,
      email: s.user.email,
      college_id: s.user.college_id,
      status: s.status,
      current_phase: s.current_phase,
      auto_score: s.auto_score,
      total_time_sec: s.total_time_sec,
      start_time: s.start_time,
      end_time: s.end_time,
    }));

    res.json({
      total_participants: leaderboard.length,
      leaderboard,
    });
  } catch (error) {
    console.error('Admin get results error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard results' });
  }
});

export default router;
