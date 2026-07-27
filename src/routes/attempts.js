import express from 'express';
import crypto from 'crypto';
import { supabase } from '../supabase.js';
import { authenticateToken, requireParticipant } from '../middleware/auth.js';
import { writeRateLimiter } from '../middleware/rateLimit.js';
import { getOrUpdateSessionState } from '../services/timerService.js';
import { gradeCodeWrite } from '../services/gradeCodeWrite.js';
import { notifyAdmin } from '../websocket.js';

const router = express.Router();

// POST /attempts
router.post('/', authenticateToken, requireParticipant, writeRateLimiter, async (req, res) => {
  try {
    const { question_id, answer_text, time_taken_sec = 0 } = req.body;

    if (!question_id || answer_text === undefined) {
      return res.status(400).json({ error: 'question_id and answer_text are required' });
    }

    const state = await getOrUpdateSessionState(req.user.id);
    if (state.status !== 'IN_PROGRESS') {
      return res.status(403).json({
        error: 'Cannot submit attempt: Quiz session is not active',
        session_status: state.status,
      });
    }

    const { data: question } = await supabase
      .from('questions')
      .select('*, testCases:test_cases(*)')
      .eq('id', question_id)
      .single();

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    if (question.phase !== state.current_phase) {
      return res.status(403).json({
        error: `Cannot attempt question from phase '${question.phase}' while session is in phase '${state.current_phase}'`,
      });
    }

    let isCorrect = null;
    let testCasesPassed = 0;
    let totalTestCases = 0;
    let gradingResult = null;

    if (question.type === 'MCQ') {
      const userChoice = String(answer_text).trim().toUpperCase();
      const expectedChoice = String(question.correct_option).trim().toUpperCase();
      isCorrect = userChoice === expectedChoice;
    } else if (question.type === 'OUTPUT_PREDICT') {
      const userOutput = String(answer_text).trim();
      const expectedOutput = String(question.expected_output).trim();
      isCorrect = userOutput === expectedOutput;
    } else if (question.type === 'CODE_WRITE') {
      const testCases = question.testCases || [];
      gradingResult = await gradeCodeWrite(String(answer_text), question, testCases);

      isCorrect = gradingResult.is_correct;
      testCasesPassed = gradingResult.test_cases_passed;
      totalTestCases = gradingResult.total_test_cases;
    }

    const { data: existingAttempt } = await supabase
      .from('attempts')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('question_id', question.id)
      .maybeSingle();

    let attempt;
    if (existingAttempt) {
      const { data: updated, error: uErr } = await supabase
        .from('attempts')
        .update({
          answer_text: String(answer_text),
          is_correct: isCorrect,
          test_cases_passed: testCasesPassed,
          total_test_cases: totalTestCases,
          time_taken_sec: Number(time_taken_sec) || 0,
          answered_at: new Date().toISOString(),
        })
        .eq('id', existingAttempt.id)
        .select()
        .single();

      if (uErr) throw uErr;
      attempt = updated;
    } else {
      const { data: created, error: cErr } = await supabase
        .from('attempts')
        .insert({
          id: crypto.randomUUID(),
          user_id: req.user.id,
          question_id: question.id,
          answer_text: String(answer_text),
          is_correct: isCorrect,
          test_cases_passed: testCasesPassed,
          total_test_cases: totalTestCases,
          time_taken_sec: Number(time_taken_sec) || 0,
        })
        .select()
        .single();

      if (cErr) throw cErr;
      attempt = created;
    }

    notifyAdmin('ATTEMPT_SUBMITTED', {
      user_id: req.user.id,
      user_name: req.user.name,
      college_id: req.user.college_id,
      question_id: question.id,
      question_type: question.type,
      phase: question.phase,
      is_correct: isCorrect,
      test_cases_passed: testCasesPassed,
      total_test_cases: totalTestCases,
      time_taken_sec: attempt.time_taken_sec,
    });

    res.json({
      message: 'Attempt recorded successfully',
      attempt: {
        id: attempt.id,
        question_id: attempt.question_id,
        answered_at: attempt.answered_at,
      },
    });
  } catch (error) {
    console.error('Submit attempt error:', error);
    res.status(500).json({ error: 'Failed to record attempt' });
  }
});

export default router;
