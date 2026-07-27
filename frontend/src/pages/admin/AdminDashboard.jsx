import { motion } from 'framer-motion'
import { Users, CheckCircle, Clock, Trophy, TrendingUp, Zap, AlertTriangle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { SkeletonCard } from '@components/ui/Skeleton'
import { adminService } from '@services/admin.service'
import { ProgressBar } from '@components/ui/ProgressBar'
import { ROUTES } from '@constants/routes'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }
const stagger = { show: { transition: { staggerChildren: 0.08 } } }

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <motion.div variants={fadeUp} className="stat-card">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</span>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${color}15`, color }}
        >
          <Icon size={18} />
        </div>
      </div>
      <p className="stat-number">{value ?? '—'}</p>
      {sub && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </motion.div>
  )
}

const CHART_COLORS = ['#4F6DFF', '#22C55E', '#F59E0B', '#EF4444', '#5FA8A5']

export function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminService.getDashboard().then((r) => r.data),
    refetchInterval: 30000, // Refresh every 30s
  })

  const d = data || {}
  const stats = d.stats || d

  const totalParticipants = stats.total_participants ?? 0
  const activeParticipants = stats.active_participants ?? stats.active ?? 0
  const completedParticipants = stats.completed_participants ?? stats.completed_all ?? 0
  const totalQuestions = stats.total_questions ?? 65

  const roundDist = [
    { name: 'Not Started', value: d.not_started || Math.max(0, totalParticipants - activeParticipants - completedParticipants) },
    { name: 'Active (In Progress)', value: activeParticipants },
    { name: 'Completed All', value: completedParticipants },
  ]

  const violationData = [
    { name: '0', count: d.violations_0 || 0 },
    { name: '1', count: d.violations_1 || 0 },
    { name: '2', count: d.violations_2 || 0 },
    { name: '3+', count: d.violations_3plus || 0 },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display, var(--font-sans))' }}
        >
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Live overview of the Code Quest competition
        </p>
      </div>

      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-8">
        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            [0,1,2,3].map((i) => <SkeletonCard key={i} className="h-32" />)
          ) : (
            <>
              <StatCard icon={Users}       label="Total Participants" value={totalParticipants} color="var(--accent-primary)" />
              <StatCard icon={Zap}         label="Currently Active"   value={activeParticipants} color="var(--accent-secondary)" />
              <StatCard icon={CheckCircle} label="Completed"          value={completedParticipants} color="var(--success)" sub="Submitted exam" />
              <StatCard icon={Trophy}      label="Total Questions"    value={totalQuestions} color="var(--warning)" sub="Official Question Bank" />
            </>
          )}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Round distribution */}
          <div className="card p-6">
            <h2 className="font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>
              Round Completion Distribution
            </h2>
            {isLoading ? (
              <div className="h-48 skeleton rounded-xl" />
            ) : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={160}>
                  <PieChart>
                    <Pie data={roundDist} cx="50%" cy="50%" outerRadius={64} dataKey="value">
                      {roundDist.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {roundDist.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ background: CHART_COLORS[i] }}
                      />
                      <span style={{ color: 'var(--text-muted)' }}>{item.name}</span>
                      <span className="ml-auto font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Violations bar chart */}
          <div className="card p-6">
            <h2 className="font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>
              Violations per Participant
            </h2>
            {isLoading ? (
              <div className="h-48 skeleton rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={violationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                    label={{ value: 'Violations', position: 'insideBottom', offset: -4, fill: 'var(--text-muted)', fontSize: 11 }}
                  />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <Bar dataKey="count" fill="var(--accent-primary)" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Exam live toggle card */}
        <motion.div variants={fadeUp} className="card p-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Exam Status</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Control whether students can access the exam
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: d.is_exam_live ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                color: d.is_exam_live ? 'var(--success)' : 'var(--danger)',
                border: `1px solid ${d.is_exam_live ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'currentColor' }} />
              {d.is_exam_live ? 'LIVE' : 'CLOSED'}
            </span>
            <a
              href={ROUTES.ADMIN.SETTINGS}
              className="text-sm font-medium"
              style={{ color: 'var(--accent-primary)' }}
            >
              Manage in Settings →
            </a>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default AdminDashboard
