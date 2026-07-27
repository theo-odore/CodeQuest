import { useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { ArrowRight, Zap, Target, Clock, Trophy, Terminal, Code, GitBranch, ChevronDown } from 'lucide-react'
import Button from '@components/ui/Button'
import AnimatedBackground from '@components/shared/AnimatedBackground'
import { ROUTES } from '@constants/routes'

/* ─── Shared animation helpers ─────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] } },
}

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.1 } },
}

function Section({ id, children, className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.section
      id={id}
      ref={ref}
      className={`section ${className}`}
      variants={stagger}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
    >
      {children}
    </motion.section>
  )
}

function SectionTitle({ eyebrow, title, subtitle }) {
  return (
    <div className="text-center mb-16">
      {eyebrow && (
        <motion.p
          variants={fadeUp}
          className="text-xs font-bold uppercase tracking-widest mb-3"
          style={{ color: 'var(--accent-primary)' }}
        >
          {eyebrow}
        </motion.p>
      )}
      <motion.h2
        variants={fadeUp}
        className="text-3xl md:text-4xl font-bold tracking-tight text-balance"
        style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display, var(--font-sans))' }}
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          variants={fadeUp}
          className="mt-4 text-base max-w-2xl mx-auto"
          style={{ color: 'var(--text-muted)' }}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  )
}

/* ─── Hero Section ─────────────────────────────────────────── */
function HeroSection() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20"
      style={{ background: 'var(--bg-primary)' }}
    >
      <AnimatedBackground />

      {/* Gradient orb */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(79,109,255,0.12), transparent)',
        }}
      />

      <div className="relative container-narrow px-4 text-center">
        {/* Club badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8"
          style={{
            background: 'rgba(79,109,255,0.08)',
            border: '1px solid rgba(79,109,255,0.2)',
            color: 'var(--accent-primary)',
          }}
        >
          <Zap size={12} fill="currentColor" />
          Tech Spark Club presents
        </motion.div>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
          className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tight leading-none mb-6"
          style={{ fontFamily: 'var(--font-display, var(--font-sans))' }}
        >
          <span style={{ color: 'var(--text-primary)' }}>Code</span>
          <br />
          <span
            style={{
              background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Quest
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="text-lg md:text-xl max-w-xl mx-auto mb-10 leading-relaxed"
          style={{ color: 'var(--text-muted)' }}
        >
          A three-round coding competition that tests your skills from
          fundamentals to algorithmic thinking.{' '}
          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
            One exam. Three levels. No second chances.
          </span>
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link to={ROUTES.LOGIN}>
            <Button variant="primary" size="lg" rightIcon={<ArrowRight size={18} />}>
              Enter the Arena
            </Button>
          </Link>
          <a href="#about">
            <Button variant="secondary" size="lg">
              Learn More
            </Button>
          </a>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="flex items-center justify-center gap-8 md:gap-16 mt-16 flex-wrap"
        >
          {[
            { value: '3', label: 'Rounds' },
            { value: '55', label: 'Questions' },
            { value: '∞', label: 'Glory' },
            { value: '1', label: 'Winner' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p
                className="text-3xl font-black"
                style={{
                  color: 'var(--accent-primary)',
                  fontFamily: 'var(--font-display, var(--font-sans))',
                }}
              >
                {stat.value}
              </p>
              <p className="text-xs mt-1 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>

      </div>

      {/* Floating elements (viewport positioned) */}
      <motion.div
        className="absolute right-4 lg:right-16 xl:right-24 top-1/3 hidden lg:block opacity-75 z-0"
        animate={{ y: [-8, 8, -8] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <FloatingTerminal />
      </motion.div>

      <motion.div
        className="absolute left-4 lg:left-16 xl:left-24 top-[45%] hidden lg:block opacity-75 z-0"
        animate={{ y: [8, -8, 8] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      >
        <FloatingPyBadge />
      </motion.div>
      
      <motion.div
        className="absolute right-[10%] lg:right-[15%] xl:right-48 bottom-[15%] hidden lg:block opacity-60 z-0"
        animate={{ y: [-10, 10, -10] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      >
        <FloatingEventBadge />
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <div
          className="w-6 h-10 rounded-full border-2 flex items-start justify-center pt-1.5"
          style={{ borderColor: 'var(--border-strong)' }}
        >
          <div
            className="w-1 h-2.5 rounded-full"
            style={{ background: 'var(--accent-primary)' }}
          />
        </div>
      </motion.div>
    </section>
  )
}

function FloatingTerminal() {
  return (
    <div
      className="card p-4 w-64 text-left"
      style={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="flex gap-1.5 mb-3">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
      </div>
      <div className="font-mono text-xs space-y-1">
        <p style={{ color: '#6EE7B7' }}>$ python solution.py</p>
        <p style={{ color: '#94A3B8' }}>{'>'} Running test cases...</p>
        <p style={{ color: '#4ADE80' }}>✓ Test 1 passed</p>
        <p style={{ color: '#4ADE80' }}>✓ Test 2 passed</p>
        <p style={{ color: '#4ADE80' }}>✓ All tests passed!</p>
        <p style={{ color: '#FDE68A' }}>Score: 100/100</p>
      </div>
    </div>
  )
}

function FloatingPyBadge() {
  return (
    <div
      className="card p-4 flex items-center gap-3"
      style={{ background: 'var(--bg-card)' }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: 'rgba(79,109,255,0.1)', color: '#4F6DFF' }}
      >
        <Code size={20} />
      </div>
      <div>
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Python 3</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Hard round language</p>
      </div>
    </div>
  )
}

function FloatingEventBadge() {
  return (
    <div
      className="card p-4 flex items-center gap-3"
      style={{ background: 'var(--bg-card)' }}
    >
      <div>
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Tech Spark</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Coding Event</p>
      </div>
    </div>
  )
}

/* ─── About Section ─────────────────────────────────────────── */
function AboutSection() {
  const features = [
    { icon: <Target size={20} />, title: 'Three Distinct Rounds', desc: 'Easy MCQs → Intermediate Code Fill → Hard Coding Problem. Progressive difficulty, permanent locks.' },
    { icon: <Clock size={20} />, title: 'Timed & Tracked', desc: 'Global timer tracks time per round. Performance measured to the second.' },
    { icon: <Trophy size={20} />, title: 'Live Leaderboard', desc: 'Ranked by score, then time, then violations. The best coder wins.' },
    { icon: <Terminal size={20} />, title: 'Real Code Execution', desc: 'Hard round runs actual Python code against hidden test cases via Judge0.' },
    { icon: <Code size={20} />, title: 'Monaco Editor', desc: 'VS Code-quality editor in your browser. Syntax highlighting, auto-indent, and more.' },
    { icon: <GitBranch size={20} />, title: 'Anti-Cheat System', desc: 'Tab switching, window blur, and copy-paste detection with automatic violation logging.' },
  ]

  return (
    <Section id="about" className="container-wide">
      <SectionTitle
        eyebrow="About the Event"
        title="What is Code Quest?"
        subtitle="A rigorous, three-round coding competition designed to surface the most talented developers in your college."
      />

      <motion.div
        variants={stagger}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        {features.map((f, i) => (
          <motion.div
            key={i}
            variants={fadeUp}
            className="card card-hover p-6 group"
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
              style={{
                background: 'rgba(79,109,255,0.08)',
                color: 'var(--accent-primary)',
              }}
            >
              {f.icon}
            </div>
            <h3 className="font-semibold mb-2 text-sm" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  )
}

/* ─── Rules Section ─────────────────────────────────────────── */
function RulesSection() {
  const rules = [
    'Each participant may attempt the exam only once. All rounds are permanently locked upon submission.',
    'The Easy round consists of 10 output-based MCQs. The Intermediate round has 10 code-completion questions.',
    'The Hard round contains one coding problem, solvable in Python 3 only.',
    'Questions are randomly assigned from a pool — every student gets a unique set.',
    'Tab switching, window blurring, and copy-paste are monitored. Three violations trigger auto-submission.',
    'No scores are displayed during the exam. Results are finalized after all submissions.',
    'The leaderboard ranks participants by: Total Score → Fastest Completion → Fewest Violations.',
    'All decisions made by the Tech Spark Club organizing committee are final.',
  ]

  return (
    <Section
      id="rules"
      className="relative"
      style={{ background: 'var(--bg-secondary)' }}
    >
      <div className="container-narrow px-4">
        <SectionTitle
          eyebrow="Rules & Guidelines"
          title="Know Before You Compete"
          subtitle="Read carefully. These rules are enforced automatically by the platform."
        />

        <motion.div variants={stagger} className="space-y-3">
          {rules.map((rule, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className="flex items-start gap-4 p-4 rounded-xl"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
              }}
            >
              <span
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: 'var(--accent-primary)',
                  color: '#fff',
                  minWidth: '28px',
                }}
              >
                {i + 1}
              </span>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                {rule}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  )
}

/* ─── Timeline Section ─────────────────────────────────────── */
function TimelineSection() {
  const events = [
    { time: '09:00 AM', title: 'Registration Opens', desc: 'Log in with your enrollment number and password.', status: 'done' },
    { time: '10:00 AM', title: 'Easy Round Begins', desc: '10 MCQ questions. Answer carefully — no going back.', status: 'done' },
    { time: '10:45 AM', title: 'Intermediate Round', desc: 'Find the missing code. Logic and syntax tested.', status: 'active' },
    { time: '11:30 AM', title: 'Hard Round', desc: 'One Python problem. Real execution against hidden test cases.', status: 'pending' },
    { time: '12:30 PM', title: 'Submissions Close', desc: 'All active exams are auto-submitted at this time.', status: 'pending' },
    { time: '01:00 PM', title: 'Results & Leaderboard', desc: 'Winners announced. Leaderboard goes live.', status: 'pending' },
  ]

  const statusColor = { done: 'var(--success)', active: 'var(--accent-primary)', pending: 'var(--border-strong)' }

  return (
    <Section id="timeline" className="container-narrow px-4">
      <SectionTitle
        eyebrow="Event Timeline"
        title="Day of the Competition"
        subtitle="Everything runs on a tight schedule. Be ready."
      />

      <div className="relative">
        {/* Vertical line */}
        <div
          className="absolute left-5 top-0 bottom-0 w-px"
          style={{ background: 'var(--border)' }}
        />

        <motion.div variants={stagger} className="space-y-6 pl-14">
          {events.map((event, i) => (
            <motion.div key={i} variants={fadeUp} className="relative">
              {/* Dot */}
              <div
                className="absolute -left-[38px] w-5 h-5 rounded-full border-2 flex items-center justify-center"
                style={{
                  background: 'var(--bg-card)',
                  borderColor: statusColor[event.status],
                  boxShadow: event.status === 'active' ? `0 0 12px ${statusColor[event.status]}` : 'none',
                }}
              >
                {event.status === 'done' && (
                  <span style={{ color: statusColor[event.status], fontSize: '10px' }}>✓</span>
                )}
                {event.status === 'active' && (
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ background: statusColor[event.status] }}
                  />
                )}
              </div>

              <div className="card p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p
                      className="text-xs font-mono font-semibold mb-1"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {event.time}
                    </p>
                    <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {event.title}
                    </h3>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                      {event.desc}
                    </p>
                  </div>
                  <span
                    className="badge flex-shrink-0 capitalize"
                    style={{
                      background: event.status === 'done' ? 'rgba(34,197,94,0.1)' : event.status === 'active' ? 'rgba(79,109,255,0.1)' : 'var(--bg-secondary)',
                      color: statusColor[event.status],
                    }}
                  >
                    {event.status}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Section>
  )
}

/* ─── FAQ Section ─────────────────────────────────────────── */
function FAQSection() {
  const faqs = [
    { q: 'What programming languages can I use?', a: 'Easy and Intermediate rounds require no coding — they are MCQ and code-fill. The Hard round accepts Python 3 only.' },
    { q: 'Can I go back to a previous round?', a: 'No. Once a round is submitted, it is permanently locked. There is no way to re-access it.' },
    { q: 'What happens if I accidentally switch tabs?', a: 'You receive a warning (1/3). At 3 warnings, your exam is automatically submitted with whatever answers you have entered.' },
    { q: 'Will I see my score during the exam?', a: 'No. Scores are not displayed during the exam. Results are published after all participants have submitted.' },
    { q: 'What if I face a technical issue?', a: 'Contact a proctor immediately. Do not close the browser window — your session state is preserved on the server.' },
    { q: 'Are the questions the same for everyone?', a: 'No. Questions are randomly assigned from a pool. Every student gets a unique combination to minimize cheating.' },
  ]

  return (
    <Section
      id="faqs"
      className="relative"
      style={{ background: 'var(--bg-secondary)' }}
    >
      <div className="container-narrow px-4">
        <SectionTitle
          eyebrow="FAQs"
          title="Frequently Asked Questions"
          subtitle="Still have questions? Reach out to the Tech Spark Club team."
        />

        <motion.div variants={stagger} className="space-y-3">
          {faqs.map((faq, i) => (
            <FAQItem key={i} question={faq.q} answer={faq.a} />
          ))}
        </motion.div>
      </div>
    </Section>
  )
}

function FAQItem({ question, answer }) {
  return (
    <motion.details
      variants={fadeUp}
      className="card group"
      style={{ cursor: 'pointer' }}
    >
      <summary
        className="flex items-center justify-between p-5 font-medium text-sm list-none"
        style={{ color: 'var(--text-primary)' }}
      >
        {question}
        <span
          className="ml-4 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 group-open:rotate-180"
          style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}
        >
          <ChevronDown size={14} />
        </span>
      </summary>
      <div className="px-5 pb-5">
        <div className="h-px mb-4" style={{ background: 'var(--border)' }} />
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{answer}</p>
      </div>
    </motion.details>
  )
}

/* ─── Main HomePage ─────────────────────────────────────────── */
export function HomePage() {
  useEffect(() => {
    document.body.style.overflow = 'unset'
    document.body.style.overflowY = 'auto'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  return (
    <div style={{ background: 'var(--bg-primary)' }}>
      <HeroSection />
      <AboutSection />
      <RulesSection />
      <TimelineSection />
      <FAQSection />
    </div>
  )
}

export default HomePage
