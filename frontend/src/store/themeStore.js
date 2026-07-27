import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'light', // 'light' | 'dark'

      setTheme: (theme) => {
        set({ theme })
        const root = document.documentElement
        if (theme === 'dark') {
          root.classList.add('dark')
        } else {
          root.classList.remove('dark')
        }
      },

      toggleTheme: () => {
        set((state) => {
          const next = state.theme === 'light' ? 'dark' : 'light'
          const root = document.documentElement
          if (next === 'dark') root.classList.add('dark')
          else root.classList.remove('dark')
          return { theme: next }
        })
      },
    }),
    {
      name: 'cq-theme',
      onRehydrateStorage: () => (state) => {
        // Apply theme class on hydration
        if (state?.theme === 'dark') {
          document.documentElement.classList.add('dark')
        }
      },
    }
  )
)
