import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useExamStore = create(
  persist(
    (set, get) => ({
      // Session
      userId: null,
      sessionId: null,
      currentRound: null, // 'easy' | 'intermediate' | 'hard' | 'done'

      // Round states
      rounds: {
        easy:         { status: 'unlocked', questions: [], answers: {}, score: null, submitTime: null },
        intermediate: { status: 'locked',   questions: [], answers: {}, score: null, submitTime: null },
        hard:         { status: 'locked',   question: null, code: '',   score: null, submitTime: null },
      },

      // Timer
      startTime: null,
      roundStartTimes: { easy: null, intermediate: null, hard: null },

      // Security
      violations: [],
      violationCount: 0,

      // Questions
      currentQuestionIndex: 0,

      // Actions
      setSession: (sessionId, round, rounds) => set({ sessionId, currentRound: round, rounds }),

      setQuestions: (round, questions) => set((state) => ({
        rounds: {
          ...state.rounds,
          [round]: { ...state.rounds[round], questions },
        },
        roundStartTimes: { ...state.roundStartTimes, [round]: Date.now() },
      })),

      setAnswer: (round, questionId, answer) => set((state) => ({
        rounds: {
          ...state.rounds,
          [round]: {
            ...state.rounds[round],
            answers: { ...state.rounds[round].answers, [questionId]: answer },
          },
        },
      })),

      setCode: (code) => set((state) => ({
        rounds: {
          ...state.rounds,
          hard: { ...state.rounds.hard, code },
        },
      })),

      submitRound: (round, nextRound) => set((state) => {
        const now = Date.now()
        const updatedRounds = { ...state.rounds }
        updatedRounds[round] = { ...updatedRounds[round], status: 'submitted', submitTime: now }
        if (nextRound && updatedRounds[nextRound]) {
          updatedRounds[nextRound] = { ...updatedRounds[nextRound], status: 'unlocked' }
        }
        return { rounds: updatedRounds, currentRound: nextRound || 'done', currentQuestionIndex: 0 }
      }),

      setQuestionIndex: (index) => set({ currentQuestionIndex: index }),

      setStartTime: (time) => set((state) => {
        const existing = state.startTime
        return { startTime: existing || time }
      }),

      addViolation: (type) => set((state) => ({
        violations: [...state.violations, { type, timestamp: Date.now() }],
        violationCount: state.violationCount + 1,
      })),

      resetForUser: (newUserId) => set({
        userId: newUserId,
        sessionId: null, currentRound: 'easy',
        rounds: {
          easy:         { status: 'unlocked', questions: [], answers: {}, score: null, submitTime: null },
          intermediate: { status: 'locked',   questions: [], answers: {}, score: null, submitTime: null },
          hard:         { status: 'locked',   question: null, code: '',   score: null, submitTime: null },
        },
        startTime: null,
        roundStartTimes: { easy: null, intermediate: null, hard: null },
        violations: [], violationCount: 0,
        currentQuestionIndex: 0,
      }),

      reset: () => set({
        userId: null,
        sessionId: null, currentRound: null,
        rounds: {
          easy:         { status: 'unlocked', questions: [], answers: {}, score: null, submitTime: null },
          intermediate: { status: 'locked',   questions: [], answers: {}, score: null, submitTime: null },
          hard:         { status: 'locked',   question: null, code: '',   score: null, submitTime: null },
        },
        startTime: null,
        roundStartTimes: { easy: null, intermediate: null, hard: null },
        violations: [], violationCount: 0,
        currentQuestionIndex: 0,
      }),
    }),
    {
      name: 'cq-exam-state',
    }
  )
)
