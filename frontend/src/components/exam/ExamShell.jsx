import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Clock, ChevronLeft, ChevronRight, Send } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useQuery, useMutation } from '@tanstack/react-query'
import Button from '@components/ui/Button'
import Modal from '@components/ui/Modal'
import { ProgressBar } from '@components/ui/ProgressBar'
import { SkeletonCard } from '@components/ui/Skeleton'
import { useExamSecurity } from '@hooks/useExamSecurity'
import { useTimer } from '@hooks/useTimer'
import { examService } from '@services/exam.service'
import api from '@services/api'
import { useExamStore } from '@store/examStore'
import { useAuthStore } from '@store/authStore'
import { formatShortTime } from '@utils/formatTime'
import { ROUTES } from '@constants/routes'

/* ─── Exam Header ─────────────────────────────────────────────── */
function ExamHeader({ round, currentQ, totalQ, timerSeconds, violations, maxViolations }) {
  const pct = ((currentQ) / totalQ) * 100
  const isLow = timerSeconds < 300 // < 5 min

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 border-b"
      style={{
        background: 'var(--bg-card)',
        borderColor: 'var(--border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Violation banner */}
      {violations > 0 && (
        <div className="exam-warning-banner text-center">
          <AlertTriangle size={14} />
          Warning {violations}/{maxViolations} — Stay on this window or your exam will be auto-submitted.
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Round label */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            {round} Round
          </p>
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Question {currentQ} of {totalQ}
          </p>
        </div>

        {/* Timer */}
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-sm font-bold"
          style={{
            background: isLow ? 'rgba(239,68,68,0.1)' : 'var(--bg-secondary)',
            color: isLow ? 'var(--danger)' : 'var(--text-primary)',
            border: `1px solid ${isLow ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
          }}
        >
          <Clock size={14} />
          {formatShortTime(timerSeconds)}
        </div>
      </div>

      {/* Progress bar */}
      <ProgressBar value={currentQ} max={totalQ} color="var(--accent-primary)" />
    </div>
  )
}

/* ─── MCQ Question (Easy Round) ─────────────────────────────── */
export function MCQQuestion({ question, selectedAnswer, onSelect }) {
  if (!question) return null

  return (
    <div>
      {/* Question text */}
      <div className="mb-6">
        {question.code_snippet && (
          <div className="code-block mb-4 text-sm">
            <pre className="whitespace-pre-wrap">{question.code_snippet}</pre>
          </div>
        )}
        <p className="font-medium leading-relaxed" style={{ color: 'var(--text-primary)' }}>
          {question.description || question.title}
        </p>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {question.options?.map((option, i) => {
          const labels = ['A', 'B', 'C', 'D', 'E']
          const isSelected = selectedAnswer === i

          return (
            <button
              key={i}
              className={`question-option ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(i)}
              aria-pressed={isSelected}
            >
              <span
                className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                style={{
                  background: isSelected ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                  color: isSelected ? '#fff' : 'var(--text-muted)',
                }}
              >
                {labels[i]}
              </span>
              <span className="text-sm text-left">{option}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Code Fill Question (Intermediate Round) ─────────────────── */
export function CodeFillQuestion({ question, answer, onAnswer }) {
  if (!question) return null

  return (
    <div>
      <p className="font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
        {question.title}
      </p>
      <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
        {question.description}
      </p>

      {/* Code with blank */}
      <div className="code-block mb-5">
        <pre className="whitespace-pre-wrap text-sm">
          {question.code_snippet?.replace('___BLANK___', '______')}
        </pre>
      </div>

      {/* Fill-in input */}
      <div>
        <label className="label">Fill in the missing code:</label>
        <input
          type="text"
          className="input font-mono"
          value={answer || ''}
          onChange={(e) => onAnswer(e.target.value)}
          placeholder="Enter the missing code..."
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
        />
      </div>
    </div>
  )
}

/* ─── Exam Shell — wraps Easy & Intermediate ─────────────────── */
export function ExamShell({
  round,
  roundLabel,
  nextRoute,
  nextRound,
  timerMinutes = 45,
}) {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const {
    rounds,
    currentQuestionIndex,
    setQuestions,
    setAnswer,
    submitRound,
    setQuestionIndex,
    violationCount,
    startTime,
    setStartTime,
  } = useExamStore()

  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const roundData = rounds[round]
  const questions = roundData?.questions || []
  const answers = roundData?.answers || {}

  // Load questions
  const { data, isLoading } = useQuery({
    queryKey: ['questions', round],
    queryFn: () => examService.getQuestions(round).then((r) => r.data),
    enabled: roundData?.status === 'unlocked',
    staleTime: Infinity, // Never re-fetch during session
  })

  useEffect(() => {
    if (data?.questions) {
      setQuestions(round, data.questions)
    }
  }, [data, round, setQuestions])

  // Start global timer if not started
  useEffect(() => {
    if (!startTime && round === 'easy') {
      setStartTime(Date.now())
    }
  }, [startTime, setStartTime, round])

  const initialSeconds = Math.max(0, 60 * 60 - Math.floor((Date.now() - (startTime || Date.now())) / 1000))

  // Auto-submit on timer expire
  const handleTimerExpire = useCallback(() => {
    toast.error('Time is up! Your exam has been auto-submitted.')
    handleSubmit(true)
  }, [])

  const { seconds } = useTimer(initialSeconds, handleTimerExpire)

  // Security
  const { violationCount: violations } = useExamSecurity({
    enabled: true,
    maxViolations: 3,
    onAutoSubmit: () => handleSubmit(true),
  })

  const currentQ = questions[currentQuestionIndex]
  const answeredCount = Object.keys(answers).length

  const handleSelect = (answer) => {
    if (!currentQ) return
    setAnswer(round, currentQ._id, answer)
  }

  const handleSubmit = useCallback(async (isAuto = false) => {
    setSubmitting(true)
    setShowSubmitModal(false)
    try {
      if (questions && questions.length > 0) {
        for (const q of questions) {
          const ans = answers[q._id || q.id]
          if (ans !== undefined) {
            let answerText = ans
            if (q.options && typeof ans === 'number') {
              answerText = ['A', 'B', 'C', 'D', 'E'][ans] || String(ans)
            }
            await api.post('/attempts', {
              question_id: q._id || q.id,
              answer_text: String(answerText),
              time_taken_sec: 60 * 60 - seconds,
            }).catch(() => {})
          }
        }
      }

      await examService.submitRound(round, {
        answers,
        time_taken: 60 * 60 - seconds,
      })
      submitRound(round, nextRound)
      if (!isAuto) toast.success('Round completed!')
      navigate(nextRoute || ROUTES.STUDENT.DASHBOARD)
    } catch (err) {
      toast.error('Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }, [answers, round, nextRound, navigate, seconds, nextRoute, submitRound, questions])

  // Guard: round not unlocked
  useEffect(() => {
    if (roundData?.status === 'submitted') {
      navigate(ROUTES.STUDENT.DASHBOARD)
      toast('This round is already submitted.', { icon: '✓' })
    }
    if (roundData?.status === 'locked') {
      navigate(ROUTES.STUDENT.DASHBOARD)
      toast.error('This round is locked.')
    }
  }, [roundData?.status, navigate])

  return (
    <div
      className="exam-overlay exam-mode no-select"
      style={{ background: 'var(--bg-primary)' }}
    >
      <ExamHeader
        round={roundLabel}
        currentQ={currentQuestionIndex + 1}
        totalQ={questions.length || 10}
        timerSeconds={seconds}
        violations={violations}
        maxViolations={3}
      />

      {/* Content */}
      <div className="pt-24 pb-32 max-w-3xl mx-auto px-4">
        {isLoading ? (
          <SkeletonCard className="mt-8" />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.2 }}
              className="card p-8"
            >
              {/* Q number */}
              <p
                className="text-xs font-bold uppercase tracking-wider mb-4"
                style={{ color: 'var(--accent-primary)' }}
              >
                Question {currentQuestionIndex + 1} / {questions.length}
              </p>

              {round === 'easy' && (
                <MCQQuestion
                  question={currentQ}
                  selectedAnswer={currentQ ? answers[currentQ._id] : undefined}
                  onSelect={handleSelect}
                />
              )}
              {round === 'intermediate' && (
                <CodeFillQuestion
                  question={currentQ}
                  answer={currentQ ? answers[currentQ._id] : ''}
                  onAnswer={(val) => currentQ && setAnswer(round, currentQ._id, val)}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Navigation dots */}
        <div className="flex flex-wrap gap-2 justify-center mt-6">
          {questions.map((q, i) => (
            <button
              key={i}
              onClick={() => setQuestionIndex(i)}
              className="w-8 h-8 rounded-lg text-xs font-bold transition-all"
              style={{
                background: answers[q._id] !== undefined
                  ? 'var(--accent-primary)'
                  : i === currentQuestionIndex
                  ? 'var(--bg-secondary)'
                  : 'var(--bg-secondary)',
                color: answers[q._id] !== undefined ? '#fff' : 'var(--text-muted)',
                border: i === currentQuestionIndex ? '2px solid var(--accent-primary)' : '1px solid var(--border)',
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom navigation bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 border-t"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<ChevronLeft size={16} />}
            onClick={() => setQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>

          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {answeredCount}/{questions.length} answered
          </span>

          {currentQuestionIndex < questions.length - 1 ? (
            <Button
              variant="primary"
              size="sm"
              rightIcon={<ChevronRight size={16} />}
              onClick={() => setQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              rightIcon={<Send size={16} />}
              onClick={() => {
                if (nextRound) handleSubmit(false)
                else setShowSubmitModal(true)
              }}
            >
              {nextRound ? `Continue to ${nextRound.charAt(0).toUpperCase() + nextRound.slice(1)}` : 'Submit Round'}
            </Button>
          )}
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Submit Round"
        closeOnBackdrop={false}
      >
        <div className="space-y-5">
          <div
            className="p-4 rounded-xl text-sm"
            style={{
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.2)',
              color: 'var(--warning)',
            }}
          >
            <p className="font-semibold mb-1">⚠️ This action is permanent</p>
            <p style={{ color: 'var(--text-muted)' }}>
              Once submitted, this round will be permanently locked. You cannot review or change your answers.
              No marks will be displayed after submission.
            </p>
          </div>

          <div className="text-sm space-y-1" style={{ color: 'var(--text-muted)' }}>
            <p>Answered: <strong style={{ color: 'var(--text-primary)' }}>{answeredCount}</strong> / {questions.length}</p>
            <p>Unanswered: <strong style={{ color: answeredCount < questions.length ? 'var(--danger)' : 'var(--text-primary)' }}>{questions.length - answeredCount}</strong></p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowSubmitModal(false)}
            >
              Go Back
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              loading={submitting}
              onClick={() => handleSubmit()}
            >
              Confirm Submit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
