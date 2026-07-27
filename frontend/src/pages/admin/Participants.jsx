import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Eye, ChevronDown, ChevronUp, Download } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Badge } from '@components/ui/Badge'
import { SkeletonTable } from '@components/ui/Skeleton'
import Modal from '@components/ui/Modal'
import Button from '@components/ui/Button'
import { adminService } from '@services/admin.service'
import { formatTime } from '@utils/formatTime'

function StatusBadge({ status }) {
  const map = {
    not_started: { label: 'Not Started', variant: 'muted' },
    in_progress: { label: 'In Progress', variant: 'warning' },
    completed:   { label: 'Completed',   variant: 'success' },
  }
  const s = map[status] || map.not_started
  return <Badge variant={s.variant} dot>{s.label}</Badge>
}

function ViolationBadge({ count }) {
  if (count === 0) return <span style={{ color: 'var(--text-muted)' }}>—</span>
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold"
      style={{
        background: count >= 3 ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
        color: count >= 3 ? 'var(--danger)' : 'var(--warning)',
      }}
    >
      ⚠️ {count}
    </span>
  )
}

function ParticipantDetail({ participantId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['participant', participantId],
    queryFn: () => adminService.getParticipant(participantId).then((r) => r.data),
    enabled: !!participantId,
  })

  if (isLoading) return <div className="space-y-3"><div className="skeleton h-4 rounded" /><div className="skeleton h-4 rounded w-3/4" /></div>
  if (!data) return <p style={{ color: 'var(--text-muted)' }}>No data available.</p>

  return (
    <div className="space-y-6">
      {/* Scores */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Easy Score', value: `${data.easy_score ?? '—'}/10` },
          { label: 'Intermediate', value: `${data.intermediate_score ?? '—'}/10` },
          { label: 'Hard Score', value: `${data.hard_score ?? '—'}/100` },
          { label: 'Total Score', value: data.total_score ?? '—' },
          { label: 'Time Taken', value: data.total_time ? formatTime(data.total_time) : '—' },
          { label: 'Violations', value: data.violations?.length || 0 },
        ].map((s) => (
          <div key={s.label} className="p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            <p className="font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Violations */}
      {data.violations?.length > 0 && (
        <div>
          <p className="label mb-2">Violations Log</p>
          <div className="space-y-2">
            {data.violations.map((v, i) => (
              <div
                key={i}
                className="flex items-center gap-3 text-xs p-2.5 rounded-lg"
                style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}
              >
                <span style={{ color: 'var(--warning)' }}>⚠️ #{v.warning_number}</span>
                <span style={{ color: 'var(--text-muted)' }}>{v.type?.replace(/_/g, ' ')}</span>
                <span className="ml-auto font-mono" style={{ color: 'var(--text-faint)' }}>
                  {new Date(v.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submitted Code */}
      {data.submitted_code && (
        <div>
          <p className="label mb-2">Submitted Code (Hard Round)</p>
          <pre
            className="code-block text-xs overflow-x-auto max-h-64"
            style={{ whiteSpace: 'pre-wrap' }}
          >
            {data.submitted_code}
          </pre>
        </div>
      )}
    </div>
  )
}

export function ParticipantsPage() {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('total_score')
  const [sortDir, setSortDir] = useState('desc')
  const [selectedId, setSelectedId] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-participants', { sortBy, sortDir }],
    queryFn: () => adminService.getParticipants({ sort_by: sortBy, sort_dir: sortDir }).then((r) => r.data),
    refetchInterval: 15000,
  })

  const participants = (data?.participants || []).filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.enrollment_number?.toLowerCase().includes(search.toLowerCase())
  )

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('desc') }
  }

  const SortIcon = ({ col }) => (
    sortBy === col
      ? (sortDir === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />)
      : null
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display, var(--font-sans))' }}
          >
            Participants
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {data?.total || 0} registered participants
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Download size={15} />}
          onClick={() => adminService.getParticipants({ export: true })}
        >
          Export CSV
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          className="input pl-10"
          placeholder="Search by name or enrollment..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          id="participant-search"
        />
      </div>

      {isLoading ? (
        <SkeletonTable rows={8} cols={8} />
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Enrollment</th>
                <th>Terminal</th>
                <th>Status</th>
                <th
                  className="cursor-pointer select-none"
                  onClick={() => toggleSort('easy_score')}
                >
                  <span className="flex items-center gap-1">Easy <SortIcon col="easy_score" /></span>
                </th>
                <th
                  className="cursor-pointer select-none"
                  onClick={() => toggleSort('intermediate_score')}
                >
                  <span className="flex items-center gap-1">Intermediate <SortIcon col="intermediate_score" /></span>
                </th>
                <th
                  className="cursor-pointer select-none"
                  onClick={() => toggleSort('hard_score')}
                >
                  <span className="flex items-center gap-1">Hard <SortIcon col="hard_score" /></span>
                </th>
                <th
                  className="cursor-pointer select-none"
                  onClick={() => toggleSort('total_score')}
                >
                  <span className="flex items-center gap-1">Total <SortIcon col="total_score" /></span>
                </th>
                <th>Time</th>
                <th>Violations</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((p, i) => (
                <tr key={p._id}>
                  <td className="font-mono text-xs" style={{ color: 'var(--text-faint)' }}>{i + 1}</td>
                  <td className="font-medium" style={{ color: 'var(--text-primary)' }}>{p.name}</td>
                  <td className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{p.enrollment_number}</td>
                  <td className="font-mono text-xs font-semibold" style={{ color: 'var(--accent-primary)' }}>{p.terminal_number || 'T-01'}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td style={{ color: 'var(--text-muted)' }}>{p.easy_score ?? '—'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{p.intermediate_score ?? '—'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{p.hard_score ?? '—'}</td>
                  <td className="font-semibold" style={{ color: 'var(--text-primary)' }}>{p.total_score ?? '—'}</td>
                  <td className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                    {p.total_time ? formatTime(p.total_time) : '—'}
                  </td>
                  <td><ViolationBadge count={p.violations_count || 0} /></td>
                  <td>
                    <button
                      onClick={() => setSelectedId(p._id)}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      title="View details"
                    >
                      <Eye size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {participants.length === 0 && (
                <tr>
                  <td colSpan={11} className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                    No participants found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedId}
        onClose={() => setSelectedId(null)}
        title="Participant Details"
        size="lg"
      >
        {selectedId && <ParticipantDetail participantId={selectedId} />}
      </Modal>
    </div>
  )
}

export default ParticipantsPage
