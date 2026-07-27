import express from 'express';
import { supabase } from '../supabase.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { writeRateLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

router.use(authenticateToken, requireAdmin);

// GET /admin/questions
router.get('/questions', async (req, res) => {
  try {
    const { data: questions, error } = await supabase
      .from('questions')
      .select('*')
      .order('phase', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw error;
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

    const { data: question, error } = await supabase
      .from('questions')
      .insert({
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
      })
      .select()
      .single();

    if (error) throw error;

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

    const { data: question, error } = await supabase
      .from('questions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

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
    const { error } = await supabase.from('questions').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Admin delete question error:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

// GET /admin/results
router.get('/results', async (req, res) => {
  try {
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('*, user:users(id, name, email, college_id, terminal_number)')
      .order('auto_score', { ascending: false })
      .order('total_time_sec', { ascending: true })
      .order('end_time', { ascending: true });

    if (error) throw error;

    const leaderboard = (sessions || []).map((s, index) => ({
      rank: index + 1,
      user_id: s.user ? s.user.id : null,
      name: s.user ? s.user.name : 'Unknown',
      email: s.user ? s.user.email : '',
      college_id: s.user ? s.user.college_id : '',
      enrollment_number: s.user ? s.user.college_id : '',
      terminal_number: (s.user && s.user.terminal_number) || 'T-01',
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

// GET /admin/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const { count: totalParticipants } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'PARTICIPANT');
    const { count: activeSessions } = await supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('status', 'IN_PROGRESS');
    const { count: completedSessions } = await supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('status', 'SUBMITTED');
    const { count: totalQuestions } = await supabase.from('questions').select('*', { count: 'exact', head: true });

    const { data: recentUsers } = await supabase
      .from('users')
      .select('id, name, email, college_id, terminal_number, created_at')
      .eq('role', 'PARTICIPANT')
      .order('created_at', { ascending: false })
      .limit(10);

    res.json({
      stats: {
        total_participants: totalParticipants || 0,
        active_participants: activeSessions || 0,
        completed_participants: completedSessions || 0,
        total_questions: totalQuestions || 0,
      },
      recent_participants: (recentUsers || []).map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        college_id: u.college_id,
        enrollment_number: u.college_id,
        terminal_number: u.terminal_number || 'T-01',
        created_at: u.created_at,
      })),
    });
  } catch (error) {
    console.error('Admin dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// GET /admin/participants
router.get('/participants', async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*, sessions(*), attempts(*)')
      .eq('role', 'PARTICIPANT')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const participants = (users || []).map(u => {
      const activeSession = (u.sessions && u.sessions[0]) || {};
      return {
        _id: u.id,
        id: u.id,
        name: u.name,
        email: u.email,
        college_id: u.college_id,
        enrollment_number: u.college_id,
        terminal_number: u.terminal_number || 'T-01',
        status: activeSession.status === 'SUBMITTED' ? 'completed' : activeSession.status === 'IN_PROGRESS' ? 'in_progress' : 'not_started',
        easy_score: activeSession.auto_score || null,
        total_score: activeSession.auto_score || 0,
        total_time: activeSession.total_time_sec || null,
        created_at: u.created_at,
      };
    });

    res.json({
      total: participants.length,
      participants,
    });
  } catch (error) {
    console.error('Admin get participants error:', error);
    res.status(500).json({ error: 'Failed to fetch participants' });
  }
});

// GET /admin/participants/:id
router.get('/participants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: user, error } = await supabase
      .from('users')
      .select('*, sessions(*), attempts(*, question:questions(*)), run_logs(*)')
      .eq('id', id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    const session = (user.sessions && user.sessions[0]) || {};
    const runLogs = (user.run_logs || []).sort((a, b) => new Date(b.ran_at) - new Date(a.ran_at));
    const lastRun = runLogs[0] || {};

    res.json({
      participant: {
        id: user.id,
        name: user.name,
        email: user.email,
        college_id: user.college_id,
        enrollment_number: user.college_id,
        terminal_number: user.terminal_number || 'T-01',
        total_score: session.auto_score || 0,
        total_time: session.total_time_sec || 0,
        status: session.status || 'not_started',
        submitted_code: lastRun.submitted_code || '',
        attempts: user.attempts,
        run_logs: runLogs,
      },
    });
  } catch (error) {
    console.error('Admin get participant details error:', error);
    res.status(500).json({ error: 'Failed to fetch participant details' });
  }
});

export default router;
