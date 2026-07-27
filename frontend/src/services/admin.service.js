import api from './api'
import { mockAdmin, mockQuestions } from './mockApi'

export const adminService = {
  getDashboard: async () => {
    try {
      return await api.get('/admin/dashboard')
    } catch (e) {
      return await mockAdmin.dashboard()
    }
  },
  getParticipants: async (params) => {
    try {
      return await api.get('/admin/participants', { params })
    } catch (e) {
      return await mockAdmin.participants(params)
    }
  },
  getParticipant: async (id) => {
    try {
      return await api.get(`/admin/participants/${id}`)
    } catch (e) {
      return await mockAdmin.participant(id)
    }
  },
  getLeaderboard: async () => {
    try {
      return await api.get('/admin/results')
    } catch (e) {
      return await mockAdmin.leaderboard()
    }
  },
  getAnalytics: async () => {
    try {
      return await api.get('/admin/dashboard')
    } catch (e) {
      return await mockAdmin.analytics()
    }
  },
  getSettings: async () => {
    try {
      return await api.get('/admin/dashboard')
    } catch (e) {
      return await mockAdmin.settings()
    }
  },
  updateSettings: async (data) => {
    try {
      return await api.put('/admin/settings', data)
    } catch (e) {
      return await mockAdmin.updateSettings(data)
    }
  },
}

export const questionService = {
  getAll: async (type) => {
    try {
      const phase = type === 'easy' ? 'EASY' : type === 'intermediate' ? 'MEDIUM' : type === 'hard' ? 'HARD' : ''
      const url = phase ? `/admin/questions?phase=${phase}` : '/admin/questions'
      return await api.get(url)
    } catch (e) {
      return await mockQuestions.getAll(type)
    }
  },
  create: async (data) => {
    try {
      return await api.post('/admin/questions', data)
    } catch (e) {
      return await mockQuestions.create(data)
    }
  },
  update: async (id, data) => {
    try {
      return await api.put(`/admin/questions/${id}`, data)
    } catch (e) {
      return await mockQuestions.update(id, data)
    }
  },
  remove: async (id) => {
    try {
      return await api.delete(`/admin/questions/${id}`)
    } catch (e) {
      return await mockQuestions.remove(id)
    }
  },
  removeAll: async (type) => {
    try {
      return await api.delete('/questions/all', { params: { type } })
    } catch (e) {
      return await mockQuestions.removeAll(type)
    }
  },
  importBulk: async (data) => {
    try {
      return await api.post('/questions/import', data)
    } catch (e) {
      return Promise.resolve({ data: { inserted: 0 } })
    }
  },
  exportAll: async () => {
    try {
      return await api.get('/questions/export')
    } catch (e) {
      return await mockQuestions.exportAll()
    }
  },
}
