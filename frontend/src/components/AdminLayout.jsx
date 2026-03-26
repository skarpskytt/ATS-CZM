          // ...existing code...

import { useState } from 'react'
import { useEffect, useState as useStateReact } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useRole } from '../context/AuthContext'

export default function AdminLayout({ children, pageTitle }) {
  const { user, logout } = useAuth()
  const { isAdmin, canViewAnalytics, canManagePositions, canManageUsers } = useRole()

  const ROLE_LABELS = { admin: 'Administrator', hr_manager: 'HR Manager', hr_supervisor: 'HR Supervisor', recruiter: 'Recruiter' }

  const [navOpen, setNavOpen] = useState(false)

  // Detect mobile for nav rendering
  const [isMobile, setIsMobile] = useStateReact(window.innerWidth <= 600)
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 600)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <section className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-topbar-inner">
          <div className="admin-brand">
            <img src="/logoczark.png" alt="Czark Mak" className="admin-brand-logo" />
            <div>
              <p className="admin-kicker">CZARK MAK CORPORATION</p>
              <span className="admin-brand-name">{pageTitle}</span>
            </div>
          </div>
          <button
            className={`admin-burger${navOpen ? ' is-open' : ''}`}
            aria-label="Open navigation menu"
            aria-expanded={navOpen}
            onClick={() => setNavOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
          {/* Overlay for mobile nav */}
          {navOpen && <div className="admin-nav-overlay" onClick={() => setNavOpen(false)} />}
          {/* Nav: desktop or mobile */}
          {isMobile ? (
            <nav className={`admin-nav${navOpen ? ' is-open' : ''}`}>
              <div className="admin-nav-header">
                <img src="/logoczark.png" alt="Czark Mak" className="admin-nav-logo" />
                <div className="admin-nav-title">CZARK MAK CORPORATION</div>
                <div className="admin-nav-avatar">
                  {(user?.name || 'U').slice(0, 1).toUpperCase()}
                </div>
                <div className="admin-nav-username">{user?.name || 'User'}</div>
                <div className="admin-nav-role">{ROLE_LABELS[user?.role] ?? user?.role ?? 'Staff'}</div>
              </div>
              <NavLink to="/admin" end className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => setNavOpen(false)}>
                Dashboard
              </NavLink>
              {canViewAnalytics && (
                <NavLink to="/admin/analytics" className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => setNavOpen(false)}>
                  Analytics
                </NavLink>
              )}
              <NavLink to="/admin/applicants" className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => setNavOpen(false)}>
                Applicants
              </NavLink>
              {canManagePositions && (
                <NavLink to="/admin/positions" className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => setNavOpen(false)}>
                  Positions
                </NavLink>
              )}
              {canManageUsers && (
                <NavLink to="/admin/users" className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => setNavOpen(false)}>
                  Users
                </NavLink>
              )}
              {isAdmin && (
                <NavLink to="/admin/audit-logs" className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => setNavOpen(false)}>
                  Audit Logs
                </NavLink>
              )}
              <button
                type="button"
                className="admin-nav-logout"
                onClick={() => { setNavOpen(false); logout(); }}
              >
                Logout
              </button>
            </nav>
          ) : (
            <nav className={`admin-nav${navOpen ? ' is-open' : ''}`}>
              <div className="admin-nav-profile">
                <div className="admin-avatar admin-avatar-lg" aria-hidden="true">
                  {(user?.name || 'U').slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="admin-name">{user?.name || 'User'}</p>
                  <p className="admin-role">{ROLE_LABELS[user?.role] ?? user?.role ?? 'Staff'}</p>
                </div>
              </div>
              <NavLink to="/admin" end className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => setNavOpen(false)}>
                Dashboard
              </NavLink>
              {canViewAnalytics && (
                <NavLink to="/admin/analytics" className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => setNavOpen(false)}>
                  Analytics
                </NavLink>
              )}
              <NavLink to="/admin/applicants" className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => setNavOpen(false)}>
                Applicants
              </NavLink>
              {canManagePositions && (
                <NavLink to="/admin/positions" className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => setNavOpen(false)}>
                  Positions
                </NavLink>
              )}
              {canManageUsers && (
                <NavLink to="/admin/users" className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => setNavOpen(false)}>
                  Users
                </NavLink>
              )}
              {isAdmin && (
                <NavLink to="/admin/audit-logs" className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => setNavOpen(false)}>
                  Audit Logs
                </NavLink>
              )}
              <button
                type="button"
                className="admin-nav-logout"
                onClick={() => { setNavOpen(false); logout(); }}
              >
                Logout
              </button>
            </nav>
          )}
          <div className="admin-profile">
            <div className="admin-avatar" aria-hidden="true">
              {(user?.name || 'U').slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p className="admin-name">{user?.name || 'User'}</p>
              <p className="admin-role">{ROLE_LABELS[user?.role] ?? user?.role ?? 'Staff'}</p>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline admin-logout-btn"
              onClick={logout}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className={navOpen ? "admin-content admin-blur" : "admin-content"}>
        {children}
      </div>

      <footer className={navOpen ? "admin-footer admin-blur" : "admin-footer"}>
        <p>© {new Date().getFullYear()} Czark Mak Corporation · ATS v2.0 · Internal use only</p>
      </footer>
    </section>
  )
}
