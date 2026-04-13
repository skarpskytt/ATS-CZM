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
            <nav className={`admin-nav admin-nav-mobile-modern${navOpen ? ' is-open' : ''}`}> 
              <button className="admin-nav-mobile-close" aria-label="Close navigation" onClick={() => setNavOpen(false)}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
              <div className="admin-nav-mobile-modern-profile">
                <div className="admin-nav-mobile-modern-avatar">
                  {(user?.name || 'U').slice(0, 1).toUpperCase()}
                </div>
                <div className="admin-nav-mobile-modern-info">
                  <div className="admin-nav-mobile-modern-username">{user?.name || 'User'}</div>
                  <div className="admin-nav-mobile-modern-role">{ROLE_LABELS[user?.role] ?? user?.role ?? 'Staff'}</div>
                </div>
              </div>
              <div className="admin-nav-mobile-modern-list">
                <NavLink to="/admin" end className={({ isActive }) => 'admin-nav-mobile-modern-link' + (isActive ? ' active' : '')} onClick={() => setNavOpen(false)}>
                  <span className="admin-nav-mobile-modern-icon">{/* Dashboard */}
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="13" width="7" height="8"/><rect x="14" y="3" width="7" height="18"/></svg>
                  </span> Dashboard
                </NavLink>
                {canViewAnalytics && (
                  <NavLink to="/admin/analytics" className={({ isActive }) => 'admin-nav-mobile-modern-link' + (isActive ? ' active' : '')} onClick={() => setNavOpen(false)}>
                    <span className="admin-nav-mobile-modern-icon">{/* Analytics */}
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="12" width="4" height="8"/><rect x="9" y="8" width="4" height="12"/><rect x="15" y="4" width="4" height="16"/></svg>
                    </span> Analytics
                  </NavLink>
                )}
                <NavLink to="/admin/applicants" className={({ isActive }) => 'admin-nav-mobile-modern-link' + (isActive ? ' active' : '')} onClick={() => setNavOpen(false)}>
                  <span className="admin-nav-mobile-modern-icon">{/* Applicants */}
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a7.5 7.5 0 0 1 13 0"/></svg>
                  </span> Applicants
                </NavLink>
                {canManagePositions && (
                  <NavLink to="/admin/positions" className={({ isActive }) => 'admin-nav-mobile-modern-link' + (isActive ? ' active' : '')} onClick={() => setNavOpen(false)}>
                    <span className="admin-nav-mobile-modern-icon">{/* Positions */}
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M16 3v4"/><path d="M8 3v4"/></svg>
                    </span> Positions
                  </NavLink>
                )}
                {canManageUsers && (
                  <NavLink to="/admin/users" className={({ isActive }) => 'admin-nav-mobile-modern-link' + (isActive ? ' active' : '')} onClick={() => setNavOpen(false)}>
                    <span className="admin-nav-mobile-modern-icon">{/* Users */}
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="7" r="4"/><circle cx="17" cy="7" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M15 21a7 7 0 0 1 14 0"/></svg>
                    </span> Users
                  </NavLink>
                )}
                {isAdmin && (
                  <NavLink to="/admin/audit-logs" className={({ isActive }) => 'admin-nav-mobile-modern-link' + (isActive ? ' active' : '')} onClick={() => setNavOpen(false)}>
                    <span className="admin-nav-mobile-modern-icon">{/* Audit Logs */}
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>
                    </span> Audit Logs
                  </NavLink>
                )}
              </div>
              <div className="admin-nav-mobile-modern-divider" />
              <button
                type="button"
                className="admin-nav-mobile-modern-logout"
                onClick={() => { setNavOpen(false); logout(); }}
              >
                <span className="admin-nav-mobile-modern-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                </span> Logout
              </button>
              <div className="admin-nav-mobile-modern-footer">v2.0 · CZARK MAK</div>
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
        <p>© {new Date().getFullYear()} Czark Mak Corporation · ATS</p>
      </footer>
    </section>
  )
}
