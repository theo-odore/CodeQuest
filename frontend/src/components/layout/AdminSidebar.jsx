import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, FileCode2, Trophy, BarChart2,
  Settings, Code2, LogOut, ChevronRight, Menu, X
} from 'lucide-react'
import { LampToggle } from '@components/lamp/LampToggle'
import { useAuth } from '@hooks/useAuth'
import { ROUTES } from '@constants/routes'
import { cn } from '@utils/cn'

const NAV_ITEMS = [
  { label: 'Dashboard',    href: ROUTES.ADMIN.DASHBOARD,     icon: LayoutDashboard },
  { label: 'Participants', href: ROUTES.ADMIN.PARTICIPANTS,  icon: Users },
  { label: 'Questions',    href: ROUTES.ADMIN.QUESTIONS,     icon: FileCode2 },
  { label: 'Leaderboard', href: ROUTES.ADMIN.LEADERBOARD,   icon: Trophy },
  { label: 'Analytics',   href: ROUTES.ADMIN.ANALYTICS,     icon: BarChart2 },
  { label: 'Settings',    href: ROUTES.ADMIN.SETTINGS,      icon: Settings },
]

function SidebarContent({ currentPath, onNav }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <Link to={ROUTES.ADMIN.DASHBOARD} className="flex items-center" onClick={onNav}>
          <div>
            <p
              className="font-bold text-sm leading-none"
              style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display, var(--font-sans))' }}
            >
              Code<span style={{ color: 'var(--accent-primary)' }}>Quest</span>
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Admin Panel</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = currentPath === href || (href !== ROUTES.ADMIN.DASHBOARD && currentPath.startsWith(href))
          return (
            <Link
              key={href}
              to={href}
              onClick={onNav}
              className={cn('sidebar-link', isActive && 'active')}
            >
              <Icon size={17} />
              <span>{label}</span>
              {isActive && <ChevronRight size={14} className="ml-auto opacity-40" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t space-y-1" style={{ borderColor: 'var(--border)' }}>
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
          style={{ background: 'var(--bg-secondary)' }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: 'var(--accent-primary)', color: '#fff' }}
          >
            {user?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {user?.name || 'Admin'}
            </p>
            <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
              {user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate(ROUTES.LOGIN) }}
          className="sidebar-link w-full"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )
}

export function AdminLayout({ children }) {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex flex-col w-60 flex-shrink-0 border-r"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border)',
        }}
      >
        <SidebarContent currentPath={location.pathname} />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className="relative z-10 flex flex-col w-60 flex-shrink-0"
            style={{ background: 'var(--bg-card)' }}
          >
            <SidebarContent
              currentPath={location.pathname}
              onNav={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header
          className="flex-shrink-0 flex items-center justify-between px-4 md:px-6 h-14 border-b"
          style={{
            background: 'var(--bg-card)',
            borderColor: 'var(--border)',
          }}
        >
          <button
            className="lg:hidden p-2 rounded-lg"
            style={{ color: 'var(--text-muted)' }}
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={20} />
          </button>

          <div className="hidden lg:block" />

          <div className="flex items-center gap-4">
            <LampToggle />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
