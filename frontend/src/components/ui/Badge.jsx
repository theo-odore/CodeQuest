import { cn } from '@utils/cn'

const variants = {
  primary: 'badge-primary',
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  muted: 'badge-muted',
}

export function Badge({ children, variant = 'muted', className, dot = false, ...props }) {
  return (
    <span className={cn(variants[variant], className)} {...props}>
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: dot === true ? 'currentColor' : dot,
          }}
        />
      )}
      {children}
    </span>
  )
}

export default Badge
