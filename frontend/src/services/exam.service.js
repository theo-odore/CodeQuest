import api from './api'
import { mockStudent } from './mockApi'

export const examService = {
  getDashboard: async () => {
    try {
      const res = await api.get('/session/status')
      const statusData = res.data || {}
      return {
        data: {
          exam: { is_exam_live: true, max_violations: 3 },
          status: statusData.status === 'SUBMITTED' ? 'completed' : 'in_progress',
          current_round: (statusData.current_phase || 'EASY').toLowerCase(),
          rounds: {
            easy: { status: 'unlocked' },
            intermediate: { status: statusData.current_phase === 'MEDIUM' || statusData.current_phase === 'HARD' ? 'unlocked' : 'locked' },
            hard: { status: statusData.current_phase === 'HARD' ? 'unlocked' : 'locked' },
          },
          violations: 0,
        },
      }
    } catch (e) {
      return await mockStudent.dashboard()
    }
  },
  getQuestions: async (round) => {
    try {
      let uppercaseRound = round ? round.toUpperCase() : 'EASY'
      if (uppercaseRound === 'INTERMEDIATE') uppercaseRound = 'MEDIUM'

      const res = await api.get(`/questions?phase=${uppercaseRound}`)
      if (res.data && Array.isArray(res.data.questions) && res.data.questions.length > 0) {
        const mappedQuestions = res.data.questions.map((q) => ({
          _id: q.id,
          id: q.id,
          type: round,
          title: q.title || (q.text ? (q.text.length > 60 ? q.text.substring(0, 60) + '...' : q.text) : 'Question'),
          description: q.description || q.text,
          code_snippet: q.code_snippet,
          options: q.type === 'MCQ' ? [q.option_a, q.option_b, q.option_c, q.option_d].filter(Boolean) : undefined,
          test_cases: q.testCases ? q.testCases.map(tc => ({ input: tc.stdin, expected_output: tc.expected_output, is_hidden: tc.is_hidden })) : [],
        }))

        if (round === 'hard') {
          return { data: { question: mappedQuestions[0], questions: mappedQuestions } }
        }
        return { data: { questions: mappedQuestions } }
      }
      return await mockStudent.getQuestions(round)
    } catch (e) {
      return await mockStudent.getQuestions(round)
    }
  },
  submitRound: async (round, payload) => {
    try {
      return await api.post('/session/submit', payload)
    } catch (e) {
      return await mockStudent.submitRound(round, payload)
    }
  },
  logViolation: async (payload) => {
    try {
      return await api.post('/student/exam/violation', payload)
    } catch (e) {
      return await mockStudent.logViolation(payload)
    }
  },
  runCode: async ({ question_id, code, language = 'python', stdin = '' }) => {
    try {
      const res = await api.post('/run-code', { question_id, code, language, stdin })
      return { data: res.data }
    } catch (e) {
      console.warn('Run code API error, using fallback output', e)
      return {
        data: {
          results: [{ passed: false, actual_output: 'Execution error', stderr: e.message || 'Execution error' }]
        }
      }
    }
  },
  getStatus: async () => {
    try {
      return await api.get('/session/status')
    } catch (e) {
      return { data: {} }
    }
  },
}
