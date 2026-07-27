import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { Save, AlertTriangle } from 'lucide-react'
import Button from '@components/ui/Button'
import Input from '@components/ui/Input'
import Card from '@components/ui/Card'
import { adminService } from '@services/admin.service'

export function SettingsPage() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => adminService.getSettings().then((r) => r.data),
  })

  const [form, setForm] = useState(null)

  // Populate form once data loads
  if (data && !form) setForm(data)

  const mutation = useMutation({
    mutationFn: (settings) => adminService.updateSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-settings'])
      queryClient.invalidateQueries(['admin-dashboard'])
      toast.success('Settings saved!')
    },
    onError: () => toast.error('Failed to save settings'),
  })

  const set = (key) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked
               : e.target.type === 'number' ? Number(e.target.value)
               : e.target.value
    setForm((f) => ({ ...f, [key]: val }))
  }

  if (isLoading || !form) return <div className="animate-pulse space-y-4">{[1,2,3].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display, var(--font-sans))' }}>
          Settings
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Configure exam parameters</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form) }} className="space-y-6">

        {/* Exam status */}
        <Card className="p-6">
          <h2 className="font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>Exam Status</h2>
          <label className="flex items-start gap-4 cursor-pointer">
            <div className="relative mt-0.5">
              <input type="checkbox" className="sr-only" id="exam-live-toggle" checked={form.is_exam_live} onChange={set('is_exam_live')} />
              <div
                className="w-11 h-6 rounded-full transition-all duration-300"
                style={{ background: form.is_exam_live ? 'var(--success)' : 'var(--border-strong)' }}
              >
                <div
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300"
                  style={{ transform: form.is_exam_live ? 'translateX(22px)' : 'translateX(2px)' }}
                />
              </div>
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                {form.is_exam_live ? '🟢 Exam is LIVE' : '🔴 Exam is CLOSED'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Students can only access the exam when it is live.
              </p>
            </div>
          </label>
        </Card>

        {/* Timers */}
        <Card className="p-6">
          <h2 className="font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>Exam Timer (minutes)</h2>
          <div className="max-w-xs">
            <Input type="number" label="Total Duration" id="global-timer" value={60} disabled />
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              The global exam duration is fixed to 60 minutes across all rounds.
            </p>
          </div>
        </Card>

        {/* Question counts */}
        <Card className="p-6">
          <h2 className="font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>Questions per Round</h2>
          <div className="grid grid-cols-3 gap-4">
            <Input type="number" label="Easy" id="easy-count" min={1} max={50}
              value={form.easy_question_count} onChange={set('easy_question_count')} />
            <Input type="number" label="Intermediate" id="inter-count" min={1} max={50}
              value={form.intermediate_question_count} onChange={set('intermediate_question_count')} />
            <Input type="number" label="Hard" id="hard-count" min={1} max={5}
              value={form.hard_question_count} onChange={set('hard_question_count')} />
          </div>
        </Card>

        {/* Violations */}
        <Card className="p-6">
          <h2 className="font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>Security Settings</h2>
          <div className="max-w-xs">
            <Input
              type="number"
              label="Max Violations before Auto-Submit"
              id="max-violations"
              min={1}
              max={10}
              value={form.max_violations}
              onChange={set('max_violations')}
              hint="Students are auto-submitted after this many violations."
            />
          </div>
          <div
            className="mt-4 flex items-start gap-3 p-3 rounded-lg text-xs"
            style={{
              background: 'rgba(245,158,11,0.06)',
              border: '1px solid rgba(245,158,11,0.2)',
              color: 'var(--warning)',
            }}
          >
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
            Changing this mid-exam affects all students currently in the exam.
          </div>
        </Card>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          leftIcon={<Save size={18} />}
          loading={mutation.isPending}
          id="save-settings-btn"
        >
          Save Settings
        </Button>
      </form>
    </div>
  )
}

export default SettingsPage
