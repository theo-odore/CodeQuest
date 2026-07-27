import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Trophy, Clock, CheckCircle, Lock, ChevronRight,
  Target, Zap, Code, AlertTriangle, LogOut, User
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import Button from '@components/ui/Button'
import Card from '@components/ui/Card'
import { Badge } from '@components/ui/Badge'
import { ProgressBar, StepProgress } from '@components/ui/ProgressBar'
import { SkeletonCard } from '@components/ui/Skeleton'
import { useAuth } from '@hooks/useAuth'
import { examService } from '@services/exam.service'
import { useExamStore } from '@store/examStore'
import { ROUTES } from '@constants/routes'
import { EXAM_ROUNDS } from '@constants/exam.constants'
import { LampToggle } from '@components/lamp/LampToggle'

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }
const stagger = { show: { transition: { staggerChildren: 0.08 } } }

/* ─── Student Navbar ─────────────────────────────────────────── */
function StudentNavbar({ user, onLogout }) {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-40 navbar-blur h-14"
    >
      <div className="h-full max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--accent-primary)' }}
          >
            <Code size={14} color="#fff" strokeWidth={2.5} />
          </div>
          <span
            className="font-bold text-sm"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display, var(--font-sans))' }}
          >
            Code<span style={{ color: 'var(--accent-primary)' }}>Quest</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <LampToggle />
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            <User size={12} />
            {user?.name || user?.enrollment_number}
          </div>
          <button
            onClick={onLogout}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </nav>
  )
}

/* ─── Difficulty Card ─────────────────────────────────────────── */
function DifficultyCard({ round, status, score, exam }) {
  const navigate = useNavigate()
  const isLocked = status === 'locked'
  const isSubmitted = status === 'submitted'
  const isUnlocked = status === 'unlocked'

  const config = {
    easy: {
      label: 'Easy', color: 'var(--success)', bg: 'rgba(34,197,94,0.08)',
      icon: <Zap size={20} />, desc: '10 output-based MCQs',
      route: ROUTES.STUDENT.EXAM_EASY,
    },
    intermediate: {
      label: 'Intermediate', color: 'var(--warning)', bg: 'rgba(245,158,11,0.08)',
      icon: <Target size={20} />, desc: '10 code-completion questions',
      route: ROUTES.STUDENT.EXAM_INTERMEDIATE,
    },
    hard: {
      label: 'Hard', color: 'var(--danger)', bg: 'rgba(239,68,68,0.08)',
      icon: <Code size={20} />, desc: '1 Python coding problem',
      route: ROUTES.STUDENT.EXAM_HARD,
    },
  }

  const c = config[round]
  const isExamLive = exam?.is_exam_live ?? true

  return (
    <motion.div
      variants={fadeUp}
      className="card card-hover relative overflow-hidden"
      style={{
        opacity: isLocked ? 0.55 : 1,
        cursor: isLocked ? 'not-allowed' : 'pointer',
      }}
      onClick={() => {
        if (isLocked) { toast.error('Complete the previous round first.'); return }
        if (isSubmitted) { toast('This round is already submitted.', { icon: '✓' }); return }
        if (!isExamLive) { toast.error('The exam is not live yet.'); return }
        navigate(c.route)
      }}
    >
      {/* Color bar */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: c.color }}
      />

      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ background: c.bg, color: c.color }}
          >
            {c.icon}
          </div>
          {isLocked && <Lock size={16} style={{ color: 'var(--text-faint)' }} />}
          {isSubmitted && <CheckCircle size={16} style={{ color: 'var(--success)' }} />}
          {isUnlocked && !isSubmitted && (
            <Badge variant="success" dot>Ready</Badge>
          )}
        </div>

        <h3
          className="font-bold text-base mb-1"
          style={{ color: 'var(--text-primary)' }}
        >
          {c.label} Round
        </h3>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>{c.desc}</p>

        {isSubmitted ? (
          <div
            className="flex items-center gap-2 text-xs font-semibold"
            style={{ color: 'var(--success)' }}
          >
            <CheckCircle size={14} />
            Submitted — Locked
          </div>
        ) : isLocked ? (
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-faint)' }}>
            <Lock size={12} />
            Locked until previous round completes
          </div>
        ) : (
          <div
            className="flex items-center gap-2 text-xs font-semibold"
            style={{ color: c.color }}
          >
            Enter Round <ChevronRight size={14} />
          </div>
        )}
      </div>
    </motion.div>
  )
}

/* ─── Student Dashboard ─────────────────────────────────────── */
export function StudentDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const { data, isLoading, error } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: () => examService.getDashboard().then((r) => r.data),
    retry: 1,
  })

  useEffect(() => {
    if (error) toast.error('Could not load dashboard. Please refresh.')
  }, [error])

  const storeRounds = useExamStore((state) => state.rounds) || {}

  const serverRounds = data?.rounds || {
    easy: { status: 'unlocked' },
    intermediate: { status: 'locked' },
    hard: { status: 'locked' },
  }

  const rounds = {
    easy: storeRounds?.easy?.status === 'submitted' ? storeRounds.easy : (serverRounds.easy || { status: 'unlocked' }),
    intermediate: (storeRounds?.intermediate?.status && storeRounds.intermediate.status !== 'locked') ? storeRounds.intermediate : (serverRounds.intermediate || { status: 'locked' }),
    hard: (storeRounds?.hard?.status && storeRounds.hard.status !== 'locked') ? storeRounds.hard : (serverRounds.hard || { status: 'locked' }),
  }

  const roundsCompleted = Object.values(rounds).filter((r) => r.status === 'submitted').length
  const roundLabels = ['Easy', 'Intermediate', 'Hard']
  const currentStep = roundsCompleted

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <StudentNavbar user={user} onLogout={logout} />

      <main className="pt-14 container-wide px-4 md:px-6 py-10">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="space-y-8"
        >
          {/* Welcome row */}
          <motion.div variants={fadeUp} className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1
                className="text-2xl font-bold tracking-tight"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display, var(--font-sans))' }}
              >
                Welcome, {user?.name || 'Participant'} 👋
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Enrollment: <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  {user?.enrollment_number}
                </span>
              </p>
            </div>
            {!data?.exam?.is_exam_live && (
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
                style={{
                  background: 'rgba(245,158,11,0.1)',
                  border: '1px solid rgba(245,158,11,0.3)',
                  color: 'var(--warning)',
                }}
              >
                <AlertTriangle size={14} />
                Exam not yet live
              </div>
            )}
          </motion.div>

          {/* Progress tracker */}
          <motion.div variants={fadeUp}>
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div>
                  <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Competition Progress
                  </h2>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {roundsCompleted} of 3 rounds completed
                  </p>
                </div>
                <Badge variant={roundsCompleted === 3 ? 'success' : 'primary'} dot>
                  {roundsCompleted === 3 ? 'All Complete' : `Round ${roundsCompleted + 1} Active`}
                </Badge>
              </div>
              <StepProgress steps={roundLabels} currentStep={currentStep} className="mb-4" />
              <ProgressBar
                value={roundsCompleted}
                max={3}
                showPercent
                label="Overall completion"
                className="mt-4"
              />
            </Card>
          </motion.div>

          {/* Stats row */}
          <motion.div variants={stagger} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Rounds Done', value: roundsCompleted, icon: <CheckCircle size={16} />, color: 'var(--success)' },
              { label: 'Rounds Left', value: 3 - roundsCompleted, icon: <Target size={16} />, color: 'var(--accent-primary)' },
              { label: 'Violations', value: data?.violations || 0, icon: <AlertTriangle size={16} />, color: 'var(--warning)' },
              { label: 'Status', value: data?.status === 'completed' ? 'Done ✓' : 'Active', icon: <Zap size={16} />, color: 'var(--accent-secondary)' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="card p-5"
              >
                <div
                  className="flex items-center gap-2 mb-2 text-sm"
                  style={{ color: stat.color }}
                >
                  {stat.icon}
                  <span style={{ color: 'var(--text-muted)' }}>{stat.label}</span>
                </div>
                <p
                  className="text-2xl font-bold"
                  style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display, var(--font-sans))' }}
                >
                  {isLoading ? '—' : stat.value}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Difficulty cards */}
          <div>
            <motion.h2
              variants={fadeUp}
              className="font-semibold mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              Exam Rounds
            </motion.h2>
            <motion.div
              variants={stagger}
              className="grid grid-cols-1 sm:grid-cols-3 gap-5"
            >
              {isLoading ? (
                [0, 1, 2].map((i) => <SkeletonCard key={i} />)
              ) : (
                [EXAM_ROUNDS.EASY, EXAM_ROUNDS.INTERMEDIATE, EXAM_ROUNDS.HARD].map((round) => (
                  <DifficultyCard
                    key={round}
                    round={round}
                    status={rounds[round]?.status || (round === 'easy' ? 'unlocked' : 'locked')}
                    score={rounds[round]?.score}
                    exam={data?.exam}
                  />
                ))
              )}
            </motion.div>
          </div>

          {/* Quick instructions */}
          <motion.div variants={fadeUp}>
            <Card className="p-6">
              <h2 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Quick Instructions
              </h2>
              <ul className="space-y-2.5">
                {[
                  'Complete rounds in order — Easy → Intermediate → Hard.',
                  'Each round locks permanently once submitted. You cannot go back.',
                  'Switching tabs or windows will count as a violation. 3 violations = auto-submit.',
                  'Hard round: Python 3 only. Code runs against hidden test cases.',
                  'No scores shown during the exam. Results released after all submissions.',
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                    <span
                      className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                      style={{ background: 'rgba(79,109,255,0.1)', color: 'var(--accent-primary)' }}
                    >
                      {i + 1}
                    </span>
                    {tip}
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>

          {/* Exam complete state */}
          {data?.status === 'completed' && (
            <motion.div
              variants={fadeUp}
              className="card p-8 text-center"
            >
              <div className="text-5xl mb-4">🎉</div>
              <h2
                className="text-xl font-bold mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Exam Submitted Successfully!
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Your responses have been recorded. Results will be announced after the event.
                Thank you for participating in Code Quest!
              </p>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  )
}

export default StudentDashboard
