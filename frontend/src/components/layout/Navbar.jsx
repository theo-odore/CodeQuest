import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Code2 } from 'lucide-react'
import { LampToggle } from '@components/lamp/LampToggle'
import Button from '@components/ui/Button'
import { ROUTES } from '@constants/routes'

const NAV_LINKS = [
  { label: 'Home', href: '#hero' },
  { label: 'About', href: '#about' },
  { label: 'Rules', href: '#rules' },
  { label: 'Timeline', href: '#timeline' },
  { label: 'FAQs', href: '#faqs' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const isHome = location.pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => setMobileOpen(false), [location])

  const handleAnchorClick = (e, href) => {
    if (!isHome) return
    e.preventDefault()
    const el = document.querySelector(href)
    el?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled ? 'navbar-blur shadow-[0_1px_0_var(--border)]' : 'bg-transparent'
        }`}
        initial={{ y: -64, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="container-wide px-4 md:px-6">
          <div className="flex items-start justify-between h-16">

            {/* Logo */}
            <Link
              to={ROUTES.HOME}
              className="flex items-center pt-4 font-bold text-lg"
              style={{ color: 'var(--text-primary)' }}
            >
              <span className="font-display tracking-tight">
                Code<span style={{ color: 'var(--accent-primary)' }}>Quest</span>
              </span>
            </Link>

            {/* Center — Lamp (overflows above nav on purpose) */}
            <div className="flex flex-col items-center pt-0">
              <LampToggle />
            </div>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1 pt-4">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={isHome ? link.href : ROUTES.HOME + link.href}
                  onClick={(e) => handleAnchorClick(e, link.href)}
                  className="nav-link text-sm"
                >
                  {link.label}
                </a>
              ))}
              <div className="w-px h-5 mx-2" style={{ background: 'var(--border-strong)' }} />
              <Link to={ROUTES.LOGIN}>
                <Button variant="primary" size="sm">
                  Enter Portal
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg mt-3 transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-30 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0"
              style={{ background: 'rgba(0,0,0,0.4)' }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              className="absolute top-0 right-0 w-72 h-full flex flex-col p-6 pt-20"
              style={{
                background: 'var(--bg-card)',
                borderLeft: '1px solid var(--border)',
              }}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <nav className="flex flex-col gap-1">
                {NAV_LINKS.map((link, i) => (
                  <motion.a
                    key={link.label}
                    href={link.href}
                    onClick={(e) => { handleAnchorClick(e, link.href); setMobileOpen(false) }}
                    className="nav-link text-base py-3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    {link.label}
                  </motion.a>
                ))}
              </nav>
              <div className="mt-auto">
                <Link to={ROUTES.LOGIN} onClick={() => setMobileOpen(false)}>
                  <Button variant="primary" className="w-full">
                    Enter Portal
                  </Button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Navbar
