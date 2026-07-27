import { useRef, useEffect, useCallback } from 'react'
import { gsap } from 'gsap'
import { useThemeStore } from '@store/themeStore'

/**
 * LampToggle — GSAP Physics Classroom Lamp
 *
 * Hangs from navbar. User clicks the string to toggle theme.
 * Lamp swings with realistic damping physics.
 * Light fades in/out as theme changes.
 */
export function LampToggle() {
  const { theme, toggleTheme } = useThemeStore()
  const isDark = theme === 'dark'

  const lampRef = useRef(null)
  const cordRef = useRef(null)
  const glowRef = useRef(null)
  const isAnimating = useRef(false)
  const swingTl = useRef(null)

  // Initialize idle swing for dark mode
  useEffect(() => {
    if (swingTl.current) swingTl.current.kill()

    if (isDark && lampRef.current) {
      swingTl.current = gsap.to(lampRef.current, {
        rotation: 1.5,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        transformOrigin: 'top center',
      })
    }

    return () => swingTl.current?.kill()
  }, [isDark])

  const handleToggle = useCallback(() => {
    if (isAnimating.current) return
    isAnimating.current = true

    // Kill idle swing
    swingTl.current?.kill()

    const lamp = lampRef.current
    const cord = cordRef.current
    const glow = glowRef.current
    if (!lamp || !cord) return

    // Pull animation — string pull then release
    const tl = gsap.timeline({
      onComplete: () => {
        isAnimating.current = false
        // Start idle swing in dark mode
        if (!isDark) { // We just switched TO dark
          swingTl.current = gsap.to(lamp, {
            rotation: 1.5,
            duration: 3,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            transformOrigin: 'top center',
          })
        }
      }
    })

    // Cord pull effect
    tl.to(cord, {
      scaleY: 1.25,
      duration: 0.15,
      ease: 'power2.in',
    })
    .to(cord, {
      scaleY: 1,
      duration: 0.2,
      ease: 'elastic.out(1, 0.5)',
    })

    // Lamp swing physics
    tl.to(lamp, {
      rotation: isDark ? 15 : -15,
      duration: 0.25,
      ease: 'power2.inOut',
      transformOrigin: 'top center',
    }, '-=0.35')
    .to(lamp, {
      rotation: 0,
      duration: 2,
      ease: 'elastic.out(1.2, 0.2)',
    })

    // Theme switch at midpoint of swing
    tl.call(() => {
      toggleTheme()
    }, null, 0.35)

    // Glow pulse on switch
    if (glow) {
      tl.fromTo(glow,
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1.2, duration: 0.2, ease: 'power2.out' },
        0.35
      )
      .to(glow, {
        opacity: isDark ? 0.4 : 0,
        scale: 1,
        duration: 0.4,
        ease: 'power2.in',
      })
    }
  }, [isDark, toggleTheme])

  return (
    <div className="flex flex-col items-center select-none" style={{ marginTop: '-4px' }}>
      {/* Mount bar */}
      <div
        className="w-6 h-1 rounded-full"
        style={{ background: 'var(--border-strong)' }}
      />

      {/* Lamp assembly — rotates as unit */}
      <div
        ref={lampRef}
        className="flex flex-col items-center cursor-pointer"
        style={{ transformOrigin: 'top center' }}
        onClick={handleToggle}
        role="switch"
        aria-checked={isDark}
        aria-label="Toggle theme — pull lamp string"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleToggle() }}
      >
        {/* Cord */}
        <div
          ref={cordRef}
          className="w-px origin-top"
          style={{
            height: '28px',
            background: 'var(--lamp-cord)',
            transformOrigin: 'top center',
          }}
        />

        {/* Pull string knot */}
        <div
          className="w-2 h-2 rounded-full mb-px"
          style={{ background: 'var(--lamp-cord)' }}
        />

        {/* Lamp shade */}
        <div
          className="relative flex items-center justify-center transition-all duration-400"
          style={{
            width: '36px',
            height: '28px',
            background: `linear-gradient(160deg, var(--lamp-body) 0%, ${isDark ? '#111111' : '#E2E8F0'} 100%)`,
            clipPath: 'polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)',
            boxShadow: isDark
              ? '0 4px 16px rgba(59,130,246,0.3)'
              : '0 2px 8px rgba(0,0,0,0.12)',
          }}
        >
          {/* Bulb icon */}
          <span
            className="text-base transition-all duration-300"
            style={{
              filter: isDark ? 'drop-shadow(0 0 6px rgba(59,130,246,0.8))' : 'none',
            }}
          >
            {isDark ? '🔆' : '💡'}
          </span>
        </div>

        {/* Lamp glow bloom */}
        {isDark && (
          <div
            ref={glowRef}
            className="pointer-events-none"
            style={{
              width: '60px',
              height: '40px',
              marginTop: '-8px',
              background: 'radial-gradient(ellipse, rgba(59,130,246,0.35) 0%, transparent 70%)',
              opacity: 0.4,
              filter: 'blur(6px)',
            }}
          />
        )}
        {!isDark && <div ref={glowRef} style={{ height: '1px' }} />}
      </div>

      {/* Label */}
      <span
        className="text-[9px] font-medium mt-1 tracking-wider uppercase"
        style={{ color: 'var(--text-faint)' }}
      >
        {isDark ? 'Dark' : 'Light'}
      </span>
    </div>
  )
}

export default LampToggle
