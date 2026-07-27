/**
 * Format seconds to HH:MM:SS
 */
export function formatTime(totalSeconds) {
  if (totalSeconds < 0) return '00:00:00'
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':')
}

/**
 * Format seconds to minutes:seconds (MM:SS)
 */
export function formatShortTime(totalSeconds) {
  if (totalSeconds < 0) return '00:00'
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * Format a Date object to a readable string
 */
export function formatDate(date) {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

/**
 * Calculate elapsed time in seconds between two Date strings
 */
export function elapsedSeconds(start, end) {
  return Math.floor((new Date(end) - new Date(start)) / 1000)
}
