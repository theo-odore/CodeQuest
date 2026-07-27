import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Code2, User, Shield, Lock, Hash, ArrowLeft } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Button from '@components/ui/Button'
import Input from '@components/ui/Input'
import AnimatedBackground from '@components/shared/AnimatedBackground'
import { useAuth } from '@hooks/useAuth'
import { ROUTES } from '@constants/routes'

/* ─── Login Illustration Panel ─────────────────────────────── */
function IllustrationPanel() {
  return (
    <div
      className="relative hidden lg:flex flex-col items-center justify-center h-full overflow-hidden"
      style={{ background: 'var(--bg-secondary)' }}
    >
      <AnimatedBackground />

      {/* Gradient orb */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(79,109,255,0.08), transparent)',
        }}
      />

      <div className="relative z-10 text-center px-12">
        {/* Code Quest logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
          className="flex flex-col items-center mb-12"
        >
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-elevated"
            style={{ background: 'var(--accent-primary)' }}
          >
            <Code2 size={40} color="#fff" strokeWidth={2} />
          </div>
          <h1
            className="text-4xl font-black tracking-tight"
            style={{
              fontFamily: 'var(--font-display, var(--font-sans))',
              color: 'var(--text-primary)',
            }}
          >
            Code<span style={{ color: 'var(--accent-primary)' }}>Quest</span>
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
            Tech Spark Club • Coding Competition
          </p>
        </motion.div>

        {/* Floating terminal illustration */}
        <motion.div
          animate={{ y: [-8, 8, -8] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div
            className="rounded-xl overflow-hidden text-left w-72 mx-auto shadow-modal"
            style={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {/* Window chrome */}
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ background: '#1E293B', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="w-3 h-3 rounded-full bg-red-500 opacity-80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-80" />
              <div className="w-3 h-3 rounded-full bg-green-500 opacity-80" />
              <span className="ml-2 text-xs font-mono" style={{ color: '#64748B' }}>
                solution.py
              </span>
            </div>
            {/* Code content */}
            <div className="p-4 font-mono text-xs leading-relaxed space-y-1">
              <p><span style={{ color: '#818CF8' }}>def</span>{' '}
                <span style={{ color: '#34D399' }}>solve</span>
                <span style={{ color: '#F8FAFC' }}>(nums):</span></p>
              <p className="pl-4"><span style={{ color: '#818CF8' }}>    seen</span>
                <span style={{ color: '#F8FAFC' }}> = </span>
                <span style={{ color: '#F59E0B' }}>set</span>
                <span style={{ color: '#F8FAFC' }}>()</span></p>
              <p className="pl-4"><span style={{ color: '#818CF8' }}>    for</span>
                <span style={{ color: '#F8FAFC' }}> n </span>
                <span style={{ color: '#818CF8' }}>in</span>
                <span style={{ color: '#F8FAFC' }}> nums:</span></p>
              <p className="pl-8"><span style={{ color: '#818CF8' }}>        if</span>
                <span style={{ color: '#F8FAFC' }}> n </span>
                <span style={{ color: '#F87171' }}>in</span>
                <span style={{ color: '#F8FAFC' }}> seen:</span></p>
              <p className="pl-12"><span style={{ color: '#818CF8' }}>            return</span>
                <span style={{ color: '#34D399' }}> True</span></p>
              <p className="pl-8"><span style={{ color: '#F8FAFC' }}>        seen.add(n)</span></p>
              <p className="pl-4"><span style={{ color: '#818CF8' }}>    return</span>
                <span style={{ color: '#F87171' }}> False</span></p>
              <p className="mt-2" style={{ color: '#4ADE80' }}>
                ✓ All 5 test cases passed
              </p>
            </div>
          </div>
        </motion.div>

        {/* Decorative badges */}
        <motion.div
          className="flex items-center justify-center gap-3 mt-8 flex-wrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {['Python 3', 'Judge0', 'Monaco Editor', 'Anti-Cheat'].map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{
                background: 'rgba(79,109,255,0.08)',
                border: '1px solid rgba(79,109,255,0.15)',
                color: 'var(--accent-primary)',
              }}
            >
              {tag}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

/* ─── Login Form ─────────────────────────────────────────── */
function LoginForm() {
  const [tab, setTab] = useState('student') // 'student' | 'admin'
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ enrollment_number: '', terminal_number: '', email: '', password: '', remember: false })
  const [errors, setErrors] = useState({})
  const { login } = useAuth()

  const validate = () => {
    const errs = {}
    if (tab === 'student') {
      if (!form.enrollment_number.trim()) errs.enrollment_number = 'Enrollment number is required'
      if (!form.terminal_number.trim()) errs.terminal_number = 'Terminal number is required'
    } else {
      if (!form.email.trim()) errs.email = 'Email is required'
      if (!form.password) errs.password = 'Password is required'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const credentials = tab === 'student'
        ? { enrollment_number: form.enrollment_number, terminal_number: form.terminal_number, role: 'student' }
        : { email: form.email, password: form.password, role: 'admin' }

      await login(credentials)
      toast.success(`Welcome back!`)
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.error || 'Invalid credentials. Please try again.'
      toast.error(msg)
      setErrors({ submit: msg })
    } finally {
      setLoading(false)
    }
  }

  const handleInput = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [field]: val }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }))
  }

  return (
    <div className="flex flex-col justify-center h-full px-8 py-12 lg:px-12 xl:px-16">
      {/* Back link */}
      <Link
        to={ROUTES.HOME}
        className="flex items-center gap-2 text-sm mb-10 w-fit transition-colors"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        <ArrowLeft size={16} />
        Back to Home
      </Link>

      {/* Heading */}
      <div className="mb-8">
        <h2
          className="text-2xl font-bold tracking-tight mb-2"
          style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display, var(--font-sans))' }}
        >
          Sign in to Code Quest
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Enter your details to access the exam portal
        </p>
      </div>

      {/* Tab selector */}
      <div
        className="flex items-center p-1 rounded-xl mb-8"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
        role="tablist"
      >
        {[
          { id: 'student', label: 'Student', icon: <User size={15} /> },
          { id: 'admin', label: 'Admin', icon: <Shield size={15} /> },
        ].map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => { setTab(t.id); setErrors({}); setForm({ enrollment_number: '', terminal_number: '', email: '', password: '', remember: false }) }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all duration-200"
            style={{
              background: tab === t.id ? 'var(--bg-card)' : 'transparent',
              color: tab === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: tab === t.id ? 'var(--shadow-card)' : 'none',
            }}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Form */}
      <AnimatePresence mode="wait">
        <motion.form
          key={tab}
          onSubmit={handleSubmit}
          className="space-y-5"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.2 }}
          noValidate
        >
          {tab === 'student' ? (
            <>
              <Input
                label="Enrollment Number"
                id="enrollment-number"
                type="text"
                placeholder="e.g. 22CS001"
                value={form.enrollment_number}
                onChange={handleInput('enrollment_number')}
                error={errors.enrollment_number}
                leftIcon={<Hash size={16} />}
                autoComplete="username"
                autoFocus
              />

              <Input
                label="Terminal Number"
                id="terminal-number"
                type="text"
                placeholder="e.g. T-01 or PC-12"
                value={form.terminal_number}
                onChange={handleInput('terminal_number')}
                error={errors.terminal_number}
                leftIcon={<Code2 size={16} />}
              />
            </>
          ) : (
            <>
              <Input
                label="Admin Email"
                id="admin-email"
                type="email"
                placeholder="admin@codequest.com"
                value={form.email}
                onChange={handleInput('email')}
                error={errors.email}
                leftIcon={<Shield size={16} />}
                autoComplete="email"
                autoFocus
              />

              <Input
                label="Password"
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={form.password}
                onChange={handleInput('password')}
                error={errors.password}
                leftIcon={<Lock size={16} />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{ pointerEvents: 'all', color: 'var(--text-muted)' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
                autoComplete="current-password"
              />
            </>
          )}

          {/* Remember me */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                id="remember-me"
                checked={form.remember}
                onChange={handleInput('remember')}
                className="sr-only"
              />
              <div
                className="w-4 h-4 rounded border-2 flex items-center justify-center transition-all"
                style={{
                  background: form.remember ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                  borderColor: form.remember ? 'var(--accent-primary)' : 'var(--border-strong)',
                }}
              >
                {form.remember && <span className="text-white text-[10px]">✓</span>}
              </div>
            </div>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Remember me for this session</span>
          </label>

          {errors.submit && (
            <p className="text-sm p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {errors.submit}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2"
            loading={loading}
            id="login-submit-btn"
          >
            {tab === 'student' ? 'Enter Exam Portal' : 'Access Admin Panel'}
          </Button>
        </motion.form>
      </AnimatePresence>

      {/* Footer note */}
      <p
        className="mt-6 text-xs text-center leading-relaxed"
        style={{ color: 'var(--text-faint)' }}
      >
        Having trouble? Contact a proctor or email{' '}
        <a
          href="mailto:techspark@paruluniversity.ac.in"
          style={{ color: 'var(--accent-primary)' }}
        >
          techspark@paruluniversity.ac.in
        </a>
      </p>
    </div>
  )
}

/* ─── Login Page ─────────────────────────────────────────── */
export function LoginPage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div className="grid lg:grid-cols-[60%_40%] min-h-screen">
        {/* Left: Illustration */}
        <IllustrationPanel />

        {/* Right: Login form in glassmorphism card */}
        <div
          className="flex items-center justify-center min-h-screen relative"
          style={{ background: 'var(--bg-card)' }}
        >
          <div className="w-full max-w-md">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
