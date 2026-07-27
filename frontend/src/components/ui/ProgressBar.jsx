import { motion } from 'framer-motion'
import { cn } from '@utils/cn'

export function ProgressBar({ value = 0, max = 100, label, showPercent = false, color, className }) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {(label || showPercent) && (
        <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
          {label && <span>{label}</span>}
          {showPercent && <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{Math.round(percentage)}%</span>}
        </div>
      )}
      <div className="progress-bar">
        <motion.div
          className="progress-fill"
          style={{
            background: color || 'var(--accent-primary)',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
    </div>
  )
}

/**
 * Step progress — shows discrete numbered steps
 */
export function StepProgress({ steps, currentStep, className }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {steps.map((step, i) => {
        const status = i < currentStep ? 'done' : i === currentStep ? 'active' : 'pending'
        return (
          <div key={i} className="flex items-center gap-2">
            <motion.div
              className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold"
              style={{
                background: status === 'done'
                  ? 'var(--success)'
                  : status === 'active'
                  ? 'var(--accent-primary)'
                  : 'var(--bg-secondary)',
                color: status === 'pending' ? 'var(--text-muted)' : '#fff',
                border: `2px solid ${status === 'active' ? 'var(--accent-primary)' : 'transparent'}`,
              }}
              animate={status === 'active' ? { scale: [1, 1.08, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            >
              {status === 'done' ? '✓' : i + 1}
            </motion.div>
            <span
              className="text-xs font-medium hidden sm:block"
              style={{
                color: status === 'pending' ? 'var(--text-faint)' : 'var(--text-primary)',
              }}
            >
              {step}
            </span>
            {i < steps.length - 1 && (
              <div
                className="w-8 h-px mx-1"
                style={{ background: i < currentStep ? 'var(--success)' : 'var(--border)' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default ProgressBar
