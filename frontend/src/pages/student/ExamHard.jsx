import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Send, Clock, AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import Editor from '@monaco-editor/react'
import { toast } from 'react-hot-toast'
import { useQuery } from '@tanstack/react-query'
import Button from '@components/ui/Button'
import Modal from '@components/ui/Modal'
import { SkeletonCard } from '@components/ui/Skeleton'
import { ConfettiEffect } from '@components/shared/ConfettiEffect'
import { useExamSecurity } from '@hooks/useExamSecurity'
import { useTimer } from '@hooks/useTimer'
import { examService } from '@services/exam.service'
import { useExamStore } from '@store/examStore'
import { useThemeStore } from '@store/themeStore'
import { formatShortTime } from '@utils/formatTime'
import { ROUTES } from '@constants/routes'

const STARTER_CODE = `# Code Quest — Hard Round
# Write your solution below
# Python 3 only

def solve():
    # Read input
    n = int(input())
    
    # Your logic here
    
    # Print output
    print(n)

solve()
`

/* ─── Test Result Row ─────────────────────────────────────────── */
function TestResultRow({ result, index }) {
  return (
    <div
      className="flex flex-col gap-2 p-3 rounded-lg text-sm mb-2"
      style={{
        background: result.passed ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
        border: `1px solid ${result.passed ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-medium">
          {result.passed
            ? <CheckCircle size={15} style={{ color: 'var(--success)', flexShrink: 0 }} />
            : <XCircle size={15} style={{ color: 'var(--danger)', flexShrink: 0 }} />
          }
          <span style={{ color: 'var(--text-primary)' }}>
            Test Case {index + 1} {result.is_hidden ? '(Hidden Test Case)' : ''}
          </span>
        </div>
        <span
          className="font-semibold text-xs px-2 py-0.5 rounded"
          style={{
            background: result.passed ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            color: result.passed ? 'var(--success)' : 'var(--danger)',
          }}
        >
          {result.passed ? 'Passed' : 'Failed'}
        </span>
      </div>

      {!result.is_hidden && (
        <div className="text-xs space-y-1 mt-1 font-mono">
          {result.stdin && <p style={{ color: 'var(--text-muted)' }}><span className="font-semibold">Input:</span> {result.stdin}</p>}
          {result.expected_output && <p style={{ color: 'var(--text-muted)' }}><span className="font-semibold">Expected:</span> {result.expected_output}</p>}
          <p style={{ color: result.passed ? 'var(--success)' : 'var(--danger)' }}>
            <span className="font-semibold">Your Output:</span> {result.actual_output || result.stderr || '(No output)'}
          </p>
        </div>
      )}
    </div>
  )
}

/* ─── Hard Exam Page ─────────────────────────────────────────── */
export function ExamHard() {
  const navigate = useNavigate()
  const { theme } = useThemeStore()
  const {
    rounds,
    setCode,
    submitRound,
    violationCount,
    startTime,
    setStartTime,
  } = useExamStore()

  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [runResults, setRunResults] = useState(null)
  const [running, setRunning] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showProblem, setShowProblem] = useState(true)

  const hardRound = rounds.hard
  const code = hardRound?.code || STARTER_CODE

  // Load hard question
  const { data, isLoading } = useQuery({
    queryKey: ['questions', 'hard'],
    queryFn: () => examService.getQuestions('hard').then((r) => r.data),
    staleTime: Infinity,
  })

  useEffect(() => {
    if (data?.question) {
      useExamStore.getState().rounds.hard.question = data.question
    }
  }, [data])

  const question = data?.question || hardRound?.question

  // Start global timer if not started
  useEffect(() => {
    if (!startTime) {
      setStartTime(Date.now())
    }
  }, [startTime, setStartTime])

  const initialSeconds = Math.max(0, 60 * 60 - Math.floor((Date.now() - (startTime || Date.now())) / 1000))

  // Timer — global 60 minutes for entire exam
  const handleTimerExpire = useCallback(() => {
    toast.error('Time is up! Your code has been auto-submitted.')
    handleSubmit(true)
  }, [])
  const { seconds } = useTimer(initialSeconds, handleTimerExpire)

  // Security
  const { violationCount: violations } = useExamSecurity({
    enabled: true,
    maxViolations: 3,
    onAutoSubmit: () => handleSubmit(true),
  })

  const isLowTime = seconds < 600

  // Guard
  useEffect(() => {
    if (showSuccess || submitted) return
    if (hardRound?.status === 'submitted') {
      navigate(ROUTES.STUDENT.DASHBOARD)
    }
    if (hardRound?.status === 'locked') {
      navigate(ROUTES.STUDENT.DASHBOARD)
      toast.error('Complete the Intermediate round first.')
    }
  }, [hardRound?.status, navigate, showSuccess, submitted])

  const handleRun = async () => {
    if (!code.trim()) { toast.error('Write some code first!'); return }
    setRunning(true)
    setRunResults(null)
    try {
      const res = await examService.runCode({
        question_id: question?._id || question?.id,
        code,
        language: 'python',
        stdin: question?.test_cases?.[0]?.input || '',
        question,
      })
      const resultData = res.data || {}
      const resultsList = resultData.results || []
      setRunResults(resultsList)
      const passed = resultsList.filter((r) => r.passed).length
      if (passed > 0) {
        toast.success(`Test execution complete: ${passed}/${resultsList.length} test case(s) passed`)
      } else {
        toast.error(`0/${resultsList.length} test cases passed. Check output below.`)
      }
    } catch (err) {
      toast.error('Execution error. Check code syntax.')
    } finally {
      setRunning(false)
    }
  }

  const handleSubmit = useCallback(async (isAuto = false) => {
    setSubmitting(true)
    setShowSubmitModal(false)
    setSubmitted(true)
    try {
      if (question?._id || question?.id) {
        await api.post('/attempts', {
          question_id: question._id || question.id,
          answer_text: code,
          time_taken_sec: 3600 - seconds,
        }).catch(() => {})
      }

      await examService.submitRound('hard', {
        code,
        language: 'python',
        time_taken: 3600 - seconds,
      })
      setShowSuccess(true)
      submitRound('hard', null)
      if (!isAuto) {
        toast.success('Code submitted successfully!')
      }
      setTimeout(() => navigate(ROUTES.STUDENT.DASHBOARD), 3500)
    } catch (err) {
      setSubmitted(false)
      toast.error('Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }, [code, seconds, submitRound, navigate, question])

  if (showSuccess) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-primary)' }}
      >
        <ConfettiEffect trigger />
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          className="card p-12 text-center max-w-md"
        >
          <div className="text-6xl mb-6">🎉</div>
          <h1
            className="text-2xl font-bold mb-3"
            style={{ color: 'var(--text-primary)' }}
          >
            Exam Submitted Successfully!
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Your code has been received and will be evaluated against hidden test cases.
            Results will be announced after the competition concludes.
          </p>
          <p className="mt-4 text-xs" style={{ color: 'var(--text-faint)' }}>
            Redirecting to dashboard...
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div
      className="exam-overlay exam-mode no-select"
      style={{ background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}
    >
      {/* Header */}
      <div
        className="flex-shrink-0 border-b"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border)',
        }}
      >
        {violations > 0 && (
          <div className="exam-warning-banner text-center">
            <AlertTriangle size={14} />
            Warning {violations}/3 — Stay on this window.
          </div>
        )}
        <div className="flex items-center justify-between px-4 py-3 gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Hard Round
            </p>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {isLoading ? 'Loading...' : question?.title || 'Coding Challenge'}
            </p>
          </div>
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-sm font-bold"
            style={{
              background: isLowTime ? 'rgba(239,68,68,0.1)' : 'var(--bg-secondary)',
              color: isLowTime ? 'var(--danger)' : 'var(--text-primary)',
              border: `1px solid ${isLowTime ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
            }}
          >
            <Clock size={14} />
            {formatShortTime(seconds)}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Play size={14} />}
              loading={running}
              onClick={handleRun}
              id="run-code-btn"
            >
              Run
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Send size={14} />}
              onClick={() => setShowSubmitModal(true)}
              id="submit-code-btn"
            >
              Submit
            </Button>
          </div>
        </div>
      </div>

      {/* Main split pane */}
      <div className="flex-1 flex overflow-hidden">

        {/* Problem panel */}
        <div
          className="flex flex-col overflow-hidden border-r"
          style={{
            width: '38%',
            minWidth: '300px',
            borderColor: 'var(--border)',
          }}
        >
          {/* Problem header */}
          <button
            className="flex items-center justify-between px-4 py-3 border-b text-sm font-semibold"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
            }}
            onClick={() => setShowProblem((v) => !v)}
          >
            Problem Statement
            {showProblem ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {isLoading ? (
              <SkeletonCard />
            ) : question ? (
              <>
                <div>
                  <h2
                    className="font-bold text-base mb-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {question.title}
                  </h2>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: 'var(--text-muted)', whiteSpace: 'pre-wrap' }}
                  >
                    {question.description}
                  </p>
                </div>

                {/* Sample I/O */}
                {question.test_cases?.filter((tc) => !tc.is_hidden).map((tc, i) => (
                  <div key={i}>
                    <p className="label">Sample {i + 1}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-[--text-muted] mb-1">Input:</p>
                        <pre className="code-block text-xs">{tc.input}</pre>
                      </div>
                      <div>
                        <p className="text-xs text-[--text-muted] mb-1">Output:</p>
                        <pre className="code-block text-xs">{tc.expected_output}</pre>
                      </div>
                    </div>
                  </div>
                ))}

                <div
                  className="p-3 rounded-lg text-xs"
                  style={{
                    background: 'rgba(79,109,255,0.06)',
                    border: '1px solid rgba(79,109,255,0.15)',
                    color: 'var(--accent-primary)',
                  }}
                >
                  🐍 Python 3 only. Use <code className="font-mono">input()</code> and <code className="font-mono">print()</code>.
                </div>
              </>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>Problem loading...</p>
            )}

            {/* Run results */}
            {runResults && (
              <div>
                <p className="label mb-2">Visible Test Results:</p>
                <div className="space-y-2">
                  {runResults.map((r, i) => (
                    <TestResultRow key={i} result={r} index={i} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Editor panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor toolbar */}
          <div
            className="flex items-center gap-3 px-4 py-2 border-b text-xs"
            style={{
              background: 'var(--bg-secondary)',
              borderColor: 'var(--border)',
              color: 'var(--text-muted)',
            }}
          >
            <span
              className="px-2.5 py-1 rounded font-mono font-medium"
              style={{ background: 'rgba(79,109,255,0.1)', color: 'var(--accent-primary)' }}
            >
              🐍 Python 3
            </span>
            <span>solution.py</span>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1">
            <Editor
              height="100%"
              language="python"
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              value={code}
              onChange={(val) => setCode(val || '')}
              options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                fontLigatures: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                renderLineHighlight: 'line',
                padding: { top: 16, bottom: 16 },
                autoIndent: 'full',
                formatOnType: true,
                bracketPairColorization: { enabled: true },
                suggest: { enabled: true },
                tabSize: 4,
                wordWrap: 'on',
                contextmenu: false, // Disable right-click in editor
              }}
            />
          </div>
        </div>
      </div>

      {/* Submit Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Submit Code"
        closeOnBackdrop={false}
      >
        <div className="space-y-5">
          <div
            className="p-4 rounded-xl text-sm"
            style={{
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.2)',
            }}
          >
            <p className="font-semibold mb-1" style={{ color: 'var(--warning)' }}>
              ⚠️ Final Submission
            </p>
            <p style={{ color: 'var(--text-muted)' }}>
              Your code will be evaluated against all hidden test cases.
              This action is permanent and cannot be undone.
              No score will be shown after submission.
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowSubmitModal(false)}>
              Keep Coding
            </Button>
            <Button variant="primary" className="flex-1" loading={submitting} onClick={() => handleSubmit()}>
              Submit Final Code
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ExamHard
