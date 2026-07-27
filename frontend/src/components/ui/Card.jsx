import { cn } from '@utils/cn'

export function Card({ children, className, hover = false, glass = false, ...props }) {
  return (
    <div
      className={cn(
        glass ? 'card-glass' : 'card',
        hover && 'card-hover cursor-pointer',
        'theme-transition',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className, ...props }) {
  return (
    <div className={cn('px-6 pt-6 pb-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardBody({ children, className, ...props }) {
  return (
    <div className={cn('px-6 pb-6', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className, ...props }) {
  return (
    <div
      className={cn('px-6 py-4 border-t', className)}
      style={{ borderColor: 'var(--border)' }}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card
