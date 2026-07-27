import { useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Clock, AlertTriangle, Medal } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { SkeletonTable } from '@components/ui/Skeleton'
import { adminService } from '@services/admin.service'
import { formatTime } from '@utils/formatTime'

function RankBadge({ rank }) {
  if (rank === 1) return <span className="text-xl">🥇</span>
  if (rank === 2) return <span className="text-xl">🥈</span>
  if (rank === 3) return <span className="text-xl">🥉</span>
  return (
    <span
      className="font-mono text-sm font-bold"
      style={{ color: 'var(--text-muted)' }}
    >
      #{rank}
    </span>
  )
}

export function LeaderboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-leaderboard'],
    queryFn: () => adminService.getLeaderboard().then((r) => r.data),
    refetchInterval: 10000, // Refresh every 10s
  })

  const participants = data?.leaderboard || []

  return (
    <div>
      <div className="mb-8">
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display, var(--font-sans))' }}
        >
          Leaderboard
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Ranked by: Score → Time → Fewest Violations
        </p>
      </div>

      {/* Top 3 podium */}
      {!isLoading && participants.length >= 3 && (
        <div className="flex items-end justify-center gap-4 mb-10">
          {[1, 0, 2].map((idx) => {
            const p = participants[idx]
            if (!p) return null
            const heights = { 0: 'h-32', 1: 'h-24', 2: 'h-20' }
            const rankNum = idx + 1
            const podiumH = heights[idx]

            return (
              <motion.div
                key={p._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex flex-col items-center gap-2"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{
                    background: idx === 0 ? 'rgba(245,158,11,0.15)' : idx === 1 ? 'rgba(148,163,184,0.15)' : 'rgba(180,83,9,0.15)',
                    border: `2px solid ${idx === 0 ? '#F59E0B' : idx === 1 ? '#94A3B8' : '#B45309'}`,
                  }}
                >
                  {p.name?.charAt(0)?.toUpperCase()}
                </div>
                <p className="text-xs font-semibold text-center" style={{ color: 'var(--text-primary)' }}>
                  {p.name}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.total_score} pts</p>
                <div
                  className={`w-20 ${podiumH} rounded-t-lg flex items-center justify-center text-2xl`}
                  style={{
                    background: idx === 0 ? 'rgba(245,158,11,0.12)' : idx === 1 ? 'rgba(148,163,184,0.1)' : 'rgba(180,83,9,0.1)',
                    border: `1px solid ${idx === 0 ? 'rgba(245,158,11,0.3)' : idx === 1 ? 'rgba(148,163,184,0.3)' : 'rgba(180,83,9,0.3)'}`,
                  }}
                >
                  {rankNum === 1 ? '🥇' : rankNum === 2 ? '🥈' : '🥉'}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Full table */}
      {isLoading ? (
        <SkeletonTable rows={10} cols={7} />
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Name</th>
                <th>Enrollment</th>
                <th>Easy</th>
                <th>Intermediate</th>
                <th>Hard</th>
                <th><span className="flex items-center gap-1"><Trophy size={13} /> Total</span></th>
                <th><span className="flex items-center gap-1"><Clock size={13} /> Time</span></th>
                <th><span className="flex items-center gap-1"><AlertTriangle size={13} /> Violations</span></th>
              </tr>
            </thead>
            <tbody>
              {participants.map((p, i) => (
                <motion.tr
                  key={p._id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  style={{
                    background: i < 3 ? (
                      i === 0 ? 'rgba(245,158,11,0.04)' :
                      i === 1 ? 'rgba(148,163,184,0.04)' :
                      'rgba(180,83,9,0.04)'
                    ) : 'transparent',
                  }}
                >
                  <td><RankBadge rank={i + 1} /></td>
                  <td>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {p.name}
                    </span>
                  </td>
                  <td>
                    <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                      {p.enrollment_number}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{p.easy_score ?? '—'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{p.intermediate_score ?? '—'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{p.hard_score ?? '—'}</td>
                  <td>
                    <span
                      className="font-bold text-base"
                      style={{
                        color: i === 0 ? '#F59E0B' : i === 1 ? '#94A3B8' : i === 2 ? '#B45309' : 'var(--text-primary)',
                      }}
                    >
                      {p.total_score ?? '—'}
                    </span>
                  </td>
                  <td className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                    {p.total_time ? formatTime(p.total_time) : '—'}
                  </td>
                  <td>
                    {p.violations_count > 0 ? (
                      <span style={{ color: 'var(--warning)' }}>⚠️ {p.violations_count}</span>
                    ) : (
                      <span style={{ color: 'var(--success)' }}>✓</span>
                    )}
                  </td>
                </motion.tr>
              ))}
              {participants.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                    No submissions yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default LeaderboardPage
