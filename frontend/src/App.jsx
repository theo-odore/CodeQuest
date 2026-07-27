import React, { Component } from 'react'
import { Routes, Route, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Navbar } from '@components/layout/Navbar'
import { Footer } from '@components/layout/Footer'
import { AdminLayout } from '@components/layout/AdminSidebar'
import { PrivateRoute, GuestRoute } from '@components/layout/RouteGuards'
import HomePage from '@pages/home/HomePage'
import LoginPage from '@pages/auth/LoginPage'
import StudentDashboard from '@pages/student/Dashboard'
import ExamEasy from '@pages/student/ExamEasy'
import ExamIntermediate from '@pages/student/ExamIntermediate'
import ExamHard from '@pages/student/ExamHard'
import AdminDashboard from '@pages/admin/AdminDashboard'
import ParticipantsPage from '@pages/admin/Participants'
import QuestionsPage from '@pages/admin/Questions'
import LeaderboardPage from '@pages/admin/Leaderboard'
import AnalyticsPage from '@pages/admin/Analytics'
import SettingsPage from '@pages/admin/Settings'
import { ROUTES } from '@constants/routes'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('App ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 mb-4 text-2xl font-bold">⚠️</div>
          <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
          <p className="text-sm text-gray-400 mb-6 max-w-md">{this.state.error?.message || 'An unexpected error occurred while loading the dashboard.'}</p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                localStorage.removeItem('cq-auth')
                window.location.href = '/login'
              }}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium text-sm"
            >
              Reset Session & Login
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-gray-700 text-white font-medium text-sm"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2 } },
}

function PageWrapper({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  )
}

function PublicLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
    </>
  )
}

function AdminWrapper() {
  return (
    <PrivateRoute requireAdmin>
      <AdminLayout>
        <Outlet />
      </AdminLayout>
    </PrivateRoute>
  )
}

function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center text-center px-4"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div className="text-8xl font-black mb-4" style={{ color: 'var(--border-strong)' }}>404</div>
      <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Page not found</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
        The page you're looking for doesn't exist.
      </p>
      <a href="/" className="btn-primary">Go Home</a>
    </div>
  )
}

export function AppRouter() {
  const location = useLocation()

  return (
    <ErrorBoundary>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public */}
          <Route element={<PublicLayout />}>
            <Route path={ROUTES.HOME} element={<PageWrapper><HomePage /></PageWrapper>} />
          </Route>

          {/* Auth */}
          <Route
            path={ROUTES.LOGIN}
            element={
              <GuestRoute>
                <PageWrapper><LoginPage /></PageWrapper>
              </GuestRoute>
            }
          />

          {/* Student */}
          <Route
            path={ROUTES.STUDENT.DASHBOARD}
            element={<PrivateRoute><PageWrapper><StudentDashboard /></PageWrapper></PrivateRoute>}
          />
          <Route
            path={ROUTES.STUDENT.EXAM_EASY}
            element={<PrivateRoute><ExamEasy /></PrivateRoute>}
          />
          <Route
            path={ROUTES.STUDENT.EXAM_INTERMEDIATE}
            element={<PrivateRoute><ExamIntermediate /></PrivateRoute>}
          />
          <Route
            path={ROUTES.STUDENT.EXAM_HARD}
            element={<PrivateRoute><ExamHard /></PrivateRoute>}
          />

          {/* Admin */}
          <Route element={<AdminWrapper />}>
            <Route path={ROUTES.ADMIN.DASHBOARD}    element={<PageWrapper><AdminDashboard /></PageWrapper>} />
            <Route path={ROUTES.ADMIN.PARTICIPANTS} element={<PageWrapper><ParticipantsPage /></PageWrapper>} />
            <Route path={ROUTES.ADMIN.QUESTIONS}    element={<PageWrapper><QuestionsPage /></PageWrapper>} />
            <Route path={ROUTES.ADMIN.LEADERBOARD}  element={<PageWrapper><LeaderboardPage /></PageWrapper>} />
            <Route path={ROUTES.ADMIN.ANALYTICS}    element={<PageWrapper><AnalyticsPage /></PageWrapper>} />
            <Route path={ROUTES.ADMIN.SETTINGS}     element={<PageWrapper><SettingsPage /></PageWrapper>} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </ErrorBoundary>
  )
}

export default AppRouter
