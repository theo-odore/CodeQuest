import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useExamStore } from './examStore'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,         // { id, name, enrollment_number, role, email }
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        const normalizedUser = user ? {
          ...user,
          enrollment_number: user.enrollment_number || user.college_id || '22CS001',
          college_id: user.college_id || user.enrollment_number || '22CS001',
        } : null

        if (normalizedUser && normalizedUser.id) {
          const currentExamUser = useExamStore.getState().userId
          if (currentExamUser !== normalizedUser.id) {
            useExamStore.getState().resetForUser(normalizedUser.id)
          }
        }

        set({ user: normalizedUser, token, isAuthenticated: true })
      },

      logout: () => {
        useExamStore.getState().reset()
        localStorage.removeItem('cq-exam-state')
        set({ user: null, token: null, isAuthenticated: false })
      },

      isAdmin: () => get().user?.role?.toUpperCase() === 'ADMIN',
      isStudent: () => get().user?.role?.toUpperCase() === 'STUDENT' || get().user?.role?.toUpperCase() === 'PARTICIPANT',
    }),
    {
      name: 'cq-auth',
    }
  )
)
