import express from 'express';
import { prisma } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { getOrUpdateSessionState } from '../services/timerService.js';

const router = express.Router();

// GET /questions?phase=easy|medium|hard
router.get('/', authenticateToken, async (req, res) => {
  try {
    const requestedPhase = (req.query.phase || 'EASY').toUpperCase();

    if (!['EASY', 'MEDIUM', 'HARD'].includes(requestedPhase)) {
      return res.status(400).json({ error: 'Invalid phase parameter. Must be easy, medium, or hard.' });
    }

    // For participants, check session state
    if (req.user.role === 'PARTICIPANT' && req.query.demo !== 'true') {
      const state = await getOrUpdateSessionState(req.user.id);

      if (state.status !== 'IN_PROGRESS') {
        console.log(`Session status for ${req.user.email} is '${state.status}'. Allowing question preview.`);
      }
    }

    // Fetch questions for requested phase with test cases
    const questions = await prisma.question.findMany({
      where: { phase: requestedPhase },
      include: {
        testCases: {
          select: {
            id: true,
            stdin: true,
            expected_output: true,
            is_hidden: true,
            weight: true
          }
        }
      },
      orderBy: { created_at: 'asc' },
    });

    // Sanitize questions for participants (hide answer keys & hidden testcase outputs)
    const sanitizedQuestions = questions.map((q) => {
      const isParticipant = req.user.role === 'PARTICIPANT';

      const visibleTestCases = (q.testCases || []).map(tc => {
        if (isParticipant && tc.is_hidden) {
          return {
            id: tc.id,
            stdin: '[HIDDEN TEST CASE]',
            expected_output: '[HIDDEN TEST CASE]',
            is_hidden: true
          };
        }
        return tc;
      });

      if (isParticipant) {
        const { correct_option, expected_output, ...publicFields } = q;
        return { ...publicFields, testCases: visibleTestCases };
      }

      return { ...q, testCases: visibleTestCases };
    });

    res.json({
      phase: requestedPhase,
      total_questions: sanitizedQuestions.length,
      questions: sanitizedQuestions,
    });
  } catch (error) {
    console.error('Fetch questions error:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

export default router;
