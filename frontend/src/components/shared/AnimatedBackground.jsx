import { useEffect, useRef } from 'react'
import { useThemeStore } from '@store/themeStore'

/**
 * AnimatedBackground — subtle animated floating particles on top of a CSS dot grid.
 * Optimized for performance by using CSS for the static grid and Canvas only for particles.
 */
export function AnimatedBackground({ className = '', style = {} }) {
  const canvasRef = useRef(null)
  const { theme } = useThemeStore()
  const animRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true }) // Optimize canvas

    const isDark = theme === 'dark'
    const particleColor = isDark ? 'rgba(110,231,183,0.4)' : 'rgba(79,109,255,0.3)'

    let W = canvas.offsetWidth
    let H = canvas.offsetHeight

    // Resize canvas
    const resize = () => {
      W = canvas.offsetWidth
      H = canvas.offsetHeight
      canvas.width = W * window.devicePixelRatio
      canvas.height = H * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resize()

    // Floating particles
    const particles = Array.from({ length: 25 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 2 + 1,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.5 + 0.2,
    }))

    let time = 0

    const draw = () => {
      ctx.clearRect(0, 0, W, H)

      // Draw particles
      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = W
        if (p.x > W) p.x = 0
        if (p.y < 0) p.y = H
        if (p.y > H) p.y = 0

        ctx.globalAlpha = p.opacity * (0.7 + Math.sin(time * 0.02 + p.x) * 0.3)
        ctx.fillStyle = particleColor
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.globalAlpha = 1

      time++
      animRef.current = requestAnimationFrame(draw)
    }

    draw()

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)

    return () => {
      cancelAnimationFrame(animRef.current)
      resizeObserver.disconnect()
    }
  }, [theme])

  // Use CSS for the dot grid for 60fps performance
  const dotColor = theme === 'dark' ? 'rgba(110,231,183,0.1)' : 'rgba(79,109,255,0.08)'
  const bgImage = `radial-gradient(${dotColor} 1px, transparent 1px)`

  return (
    <div
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{
        ...style,
        backgroundImage: bgImage,
        backgroundSize: '30px 30px',
      }}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
    </div>
  )
}

export default AnimatedBackground
