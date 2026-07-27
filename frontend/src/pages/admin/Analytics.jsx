import { useQuery } from '@tanstack/react-query'
import { adminService } from '@services/admin.service'
import { SkeletonCard } from '@components/ui/Skeleton'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, Legend
} from 'recharts'

const TOOLTIP_STYLE = {
  contentStyle: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: '8px', color: 'var(--text-primary)', fontSize: '12px',
  },
}

function ChartCard({ title, sub, children, loading }) {
  return (
    <div className="card p-6">
      <h2 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      {sub && <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
      {loading ? <div className="skeleton h-48 rounded-xl" /> : <>{children}</>}
    </div>
  )
}

export function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => adminService.getAnalytics().then((r) => r.data),
  })

  const d = data || {}

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display, var(--font-sans))' }}>
          Analytics
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Deep insights into competition performance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Average score per round */}
        <ChartCard title="Average Score per Round" sub="Comparison across all 3 rounds" loading={isLoading}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[
              { name: 'Easy',         avg: d.avg_easy_score         || 0 },
              { name: 'Intermediate', avg: d.avg_intermediate_score || 0 },
              { name: 'Hard',         avg: d.avg_hard_score         || 0 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="avg" name="Avg Score" fill="var(--accent-primary)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Submission timeline */}
        <ChartCard title="Submission Timeline" sub="Cumulative submissions over time" loading={isLoading}>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={d.submission_timeline || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="count" name="Submissions"
                stroke="var(--accent-secondary)" fill="rgba(95,168,165,0.15)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Most incorrect questions */}
        <ChartCard title="Most Incorrect Questions (Easy)" sub="Questions with highest wrong answer rate" loading={isLoading}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={(d.hardest_questions || []).slice(0, 8)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis dataKey="title" type="category" width={120}
                tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="wrong_pct" name="Wrong %" fill="var(--danger)" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Completion time distribution */}
        <ChartCard title="Completion Time Distribution" sub="How long participants took to finish" loading={isLoading}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={d.time_distribution || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="bucket" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="count" name="Participants" fill="var(--accent-secondary)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Score distribution */}
        <ChartCard title="Score Distribution" sub="Spread of total scores" loading={isLoading}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={d.score_distribution || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="bucket" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="count" name="Participants" fill="var(--warning)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Violation stats */}
        <ChartCard title="Violation Breakdown" sub="Types of violations detected" loading={isLoading}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[
              { name: 'Tab Switch',    count: d.violation_tab_switch   || 0 },
              { name: 'Window Blur',   count: d.violation_window_blur  || 0 },
              { name: 'Fullscreen',    count: d.violation_fullscreen   || 0 },
              { name: 'Copy/Paste',    count: d.violation_copy         || 0 },
              { name: 'DevTools',      count: d.violation_devtools     || 0 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="count" name="Violations" fill="var(--warning)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}

export default AnalyticsPage
