import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Countdown timer hook.
 * @param {number} initialSeconds - Starting seconds
 * @param {Function} onExpire - Callback when timer hits 0
 */
export function useTimer(initialSeconds, onExpire) {
  const [seconds, setSeconds] = useState(initialSeconds)
  const [isRunning, setIsRunning] = useState(true)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!isRunning) return

    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          setIsRunning(false)
          onExpire?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(intervalRef.current)
  }, [isRunning, onExpire])

  const pause = useCallback(() => {
    clearInterval(intervalRef.current)
    setIsRunning(false)
  }, [])

  const resume = useCallback(() => setIsRunning(true), [])

  const reset = useCallback((newSeconds) => {
    clearInterval(intervalRef.current)
    setSeconds(newSeconds ?? initialSeconds)
    setIsRunning(true)
  }, [initialSeconds])

  return { seconds, isRunning, pause, resume, reset }
}

/**
 * Stopwatch — counts up.
 */
export function useStopwatch() {
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef(Date.now())
  const intervalRef = useRef(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000))
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [])

  const reset = () => {
    startRef.current = Date.now()
    setElapsed(0)
  }

  return { elapsed, reset }
}
