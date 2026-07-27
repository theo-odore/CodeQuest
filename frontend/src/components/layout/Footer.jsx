import { Link } from 'react-router-dom'
import { Mail, Heart } from 'lucide-react'
import { ROUTES } from '@constants/routes'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer
      id="contact"
      className="relative mt-20 border-t"
      style={{
        background: 'var(--bg-secondary)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="container-wide px-4 md:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">

          {/* Brand */}
          <div className="md:col-span-2">
            <Link to={ROUTES.HOME} className="flex items-center mb-4">
              <span
                className="font-display font-bold text-xl tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                Code<span style={{ color: 'var(--accent-primary)' }}>Quest</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed max-w-sm" style={{ color: 'var(--text-muted)' }}>
              A premier coding competition platform organized by the Tech Spark Club.
              Challenge yourself. Compete with the best. Rise to the top.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <SocialLink href="mailto:techspark@paruluniversity.ac.in" icon={<Mail size={16} />} label="Email" />
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Platform</h3>
            <ul className="space-y-2.5">
              {['Home', 'About', 'Rules', 'Timeline', 'FAQs'].map((item) => (
                <li key={item}>
                  <a
                    href={`#${item.toLowerCase()}`}
                    className="text-sm transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'}
                    onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Contact</h3>
            <ul className="space-y-2.5">
              <li className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Tech Spark Club
              </li>
              <li className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Department of Computer Science
              </li>
              <li>
                <a
                  href="mailto:techspark@paruluniversity.ac.in"
                  className="text-sm transition-colors"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  techspark@paruluniversity.ac.in
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-12 pt-8 border-t"
          style={{ borderColor: 'var(--border)' }}
        >
          <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
            © {year} Tech Spark Club. All rights reserved.
          </p>
          <p className="text-xs flex items-center gap-1" style={{ color: 'var(--text-faint)' }}>
            Built with <Heart size={12} fill="currentColor" style={{ color: 'var(--danger)' }} /> by Tech Spark Club
          </p>
        </div>
      </div>
    </footer>
  )
}

function SocialLink({ href, icon, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        color: 'var(--text-muted)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--accent-primary)'
        e.currentTarget.style.color = 'var(--accent-primary)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.color = 'var(--text-muted)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {icon}
    </a>
  )
}

export default Footer
