import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'

export function ConfettiEffect({ trigger = false }) {
  const firedRef = useRef(false)

  useEffect(() => {
    if (trigger && !firedRef.current) {
      firedRef.current = true

      // First burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4F6DFF', '#5FA8A5', '#22C55E', '#F59E0B', '#4ADE80'],
      })

      // Side bursts
      setTimeout(() => {
        confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0 } })
        confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1 } })
      }, 200)

      setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 100,
          origin: { y: 0.5 },
          gravity: 0.8,
        })
      }, 500)
    }
  }, [trigger])

  return null
}

export default ConfettiEffect
