import { useEffect, useCallback } from 'react'
import { useExamStore } from '@store/examStore'
import { examService } from '@services/exam.service'
import { VIOLATION_TYPES, MAX_VIOLATIONS } from '@constants/exam.constants'
import toast from 'react-hot-toast'

/**
 * Exam security hook.
 * Detects tab switch, window blur, fullscreen exit, copy attempt.
 * Logs violations and auto-submits at threshold.
 */
export function useExamSecurity({ onAutoSubmit, enabled = true, maxViolations = MAX_VIOLATIONS }) {
  const { addViolation, violationCount } = useExamStore()

  const handleViolation = useCallback(async (type) => {
    if (!enabled) return

    addViolation(type)
    const newCount = useExamStore.getState().violationCount

    try {
      await examService.logViolation({ type, warning_number: newCount })
    } catch (_) {}

    if (newCount >= maxViolations) {
      toast.error('⚠️ Maximum warnings exceeded. Exam auto-submitted.', { duration: 5000 })
      onAutoSubmit?.()
    } else {
      toast.error(
        `⚠️ Warning ${newCount}/${maxViolations} — ${getViolationMessage(type)}`,
        { duration: 4000, id: 'violation-toast' }
      )
    }
  }, [enabled, addViolation, maxViolations, onAutoSubmit])

  // Tab visibility change
  useEffect(() => {
    if (!enabled) return
    const handleVisibility = () => {
      if (document.hidden) handleViolation(VIOLATION_TYPES.TAB_SWITCH)
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [enabled, handleViolation])

  // Window blur
  useEffect(() => {
    if (!enabled) return
    const handleBlur = () => handleViolation(VIOLATION_TYPES.WINDOW_BLUR)
    window.addEventListener('blur', handleBlur)
    return () => window.removeEventListener('blur', handleBlur)
  }, [enabled, handleViolation])

  // Fullscreen exit
  useEffect(() => {
    if (!enabled) return
    const handleFullscreen = () => {
      if (!document.fullscreenElement) handleViolation(VIOLATION_TYPES.FULLSCREEN_EXIT)
    }
    document.addEventListener('fullscreenchange', handleFullscreen)
    return () => document.removeEventListener('fullscreenchange', handleFullscreen)
  }, [enabled, handleViolation])

  // Copy/paste attempt
  useEffect(() => {
    if (!enabled) return
    const handleCopy = (e) => {
      e.preventDefault()
      handleViolation(VIOLATION_TYPES.COPY_ATTEMPT)
    }
    const handlePaste = (e) => e.preventDefault()
    document.addEventListener('copy', handleCopy)
    document.addEventListener('cut', handleCopy)
    document.addEventListener('paste', handlePaste)
    return () => {
      document.removeEventListener('copy', handleCopy)
      document.removeEventListener('cut', handleCopy)
      document.removeEventListener('paste', handlePaste)
    }
  }, [enabled, handleViolation])

  // Right-click disable
  useEffect(() => {
    if (!enabled) return
    const block = (e) => e.preventDefault()
    document.addEventListener('contextmenu', block)
    return () => document.removeEventListener('contextmenu', block)
  }, [enabled])

  // F12 / DevTools keyboard shortcuts
  useEffect(() => {
    if (!enabled) return
    const handleKey = (e) => {
      const blocked = [
        e.key === 'F12',
        e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key),
        e.ctrlKey && e.key === 'U',
        e.ctrlKey && e.key === 'c',
        e.ctrlKey && e.key === 'v',
      ]
      if (blocked.some(Boolean)) {
        e.preventDefault()
        if (e.key === 'F12' || (e.ctrlKey && e.shiftKey)) {
          handleViolation(VIOLATION_TYPES.DEVTOOLS)
        }
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [enabled, handleViolation])

  return { violationCount }
}

function getViolationMessage(type) {
  const messages = {
    [VIOLATION_TYPES.TAB_SWITCH]: 'Do not switch tabs during the exam.',
    [VIOLATION_TYPES.WINDOW_BLUR]: 'Stay on the exam window.',
    [VIOLATION_TYPES.FULLSCREEN_EXIT]: 'Please stay in fullscreen mode.',
    [VIOLATION_TYPES.COPY_ATTEMPT]: 'Copy/paste is not allowed.',
    [VIOLATION_TYPES.DEVTOOLS]: 'Developer tools are not allowed.',
  }
  return messages[type] || 'Suspicious activity detected.'
}
