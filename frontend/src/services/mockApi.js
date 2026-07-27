/**
 * Lightweight API Fallback Stubs
 */

export const mockAuth = {
  login: async ({ enrollment_number, terminal_number, email, role }) => ({
    data: {
      token: 'mock-token',
      user: {
        id: 'mock-user-1',
        name: enrollment_number || 'Participant',
        college_id: enrollment_number || '22CS001',
        enrollment_number: enrollment_number || '22CS001',
        terminal_number: terminal_number || 'T-01',
        role: role === 'admin' ? 'ADMIN' : 'PARTICIPANT',
      }
    }
  }),
}

export const mockStudent = {
  dashboard: async () => ({
    data: {
      exam: { is_exam_live: true, max_violations: 3 },
      status: 'in_progress',
      current_round: 'easy',
      rounds: { easy: { status: 'unlocked' }, intermediate: { status: 'locked' }, hard: { status: 'locked' } },
      violations: 0,
    }
  }),
  getQuestions: async (round) => {
    if (round === 'hard') {
      const q = {
        _id: 'hard-1',
        id: 'hard-1',
        title: 'Reverse Words in String',
        description: 'Given a string s, reverse the order of characters in each word while preserving whitespace.',
        code_snippet: 'def solve():\n    # Write Python 3 code\n    pass',
        test_cases: [
          { input: 'Hello World', expected_output: 'olleH dlroW', is_hidden: false },
          { input: 'Python 3', expected_output: 'nohtyP 3', is_hidden: true },
        ],
      }
      return { data: { question: q, questions: [q] } }
    }

    if (round === 'intermediate') {
      return {
        data: {
          questions: Array.from({ length: 10 }, (_, i) => ({
            _id: `int-${i+1}`,
            id: `int-${i+1}`,
            title: `Predict Output Q${i+1}`,
            description: `What will be the output of the code snippet below?`,
            code_snippet: `def func_${i+1}():\n    res = [x * 2 for x in range(${i+2})]\n    return sum(res)\nprint(func_${i+1}())`,
          }))
        }
      }
    }

    return {
      data: {
        questions: Array.from({ length: 10 }, (_, i) => ({
          _id: `easy-${i+1}`,
          id: `easy-${i+1}`,
          title: `MCQ Question ${i+1}`,
          description: `Which of the following is correct for Python 3 data structures?`,
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
        }))
      }
    }
  },
  submitRound: async () => ({ data: { success: true } }),
  logViolation: async () => ({ data: { success: true } }),
}

export const mockAdmin = {
  dashboard: async () => ({ data: { stats: { total_participants: 0, active_participants: 0, completed_participants: 0, total_questions: 65 } } }),
  participants: async () => ({ data: { total: 0, participants: [] } }),
  participant: async () => ({ data: { participant: {} } }),
  leaderboard: async () => ({ data: { leaderboard: [] } }),
  analytics: async () => ({ data: {} }),
  settings: async () => ({ data: {} }),
  updateSettings: async () => ({ data: {} }),
}

export const mockQuestions = {
  getAll: async () => ({ data: { questions: [] } }),
  create: async () => ({ data: {} }),
  update: async () => ({ data: {} }),
  remove: async () => ({ data: {} }),
  removeAll: async () => ({ data: {} }),
  exportAll: async () => ({ data: {} }),
}
