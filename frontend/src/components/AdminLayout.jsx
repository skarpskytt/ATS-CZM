import { useEffect, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useRole } from '../context/AuthContext'
import { apiBase } from '../utils/apiBase'

export default function AdminLayout({ children, pageTitle }) {
  const { user, token, logout } = useAuth()
  const { isAdmin, canViewAnalytics, canManagePositions, canManageUsers } = useRole()

  const ROLE_LABELS = { admin: 'Administrator', hr_manager: 'HR Manager', hr_supervisor: 'HR Supervisor', recruiter: 'Recruiter' }

  const [navOpen, setNavOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifLoading, setNotifLoading] = useState(false)
  const [notifError, setNotifError] = useState(null)
  const [notifPayload, setNotifPayload] = useState({ unread_count: 0, unread: [], recent: [] })

  // Detect mobile/tablet for nav rendering
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900)
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 900)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const close = (e) => {
      const target = e.target
      if (!(target instanceof Node)) return
      if (!document.querySelector('.admin-topbar')?.contains(target)) {
        setProfileOpen(false)
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const fetchNotifications = async () => {
    if (!token) return
    setNotifLoading(true)
    setNotifError(null)
    try {
      const res = await fetch(`${apiBase}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      const payload = await res.json()
      setNotifPayload(payload)
    } catch {
      setNotifError('Unable to load notifications.')
    } finally {
      setNotifLoading(false)
    }
  }

  useEffect(() => {
    if (!token) return
    fetchNotifications()
  }, [token])

  const notifications = useMemo(() => {
    // Prefer unread first, then recent.
    const map = new Map()
    for (const n of (notifPayload.unread || [])) map.set(n.id, n)
    for (const n of (notifPayload.recent || [])) map.set(n.id, n)
    return Array.from(map.values()).slice(0, 20)
  }, [notifPayload])

  const formatNotifText = (n) => {
    const data = n?.data || {}
    if (data.kind === 'applicant_submitted') {
      return `New application: ${data.name || 'Applicant'} · ${data.position || '—'}`
    }
    return 'New notification'
  }

  const markNotifRead = async (id) => {
    if (!token) return
    try {
      await fetch(`${apiBase}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      setNotifPayload((prev) => ({
        ...prev,
        unread_count: Math.max(0, (prev.unread_count ?? 0) - 1),
        unread: (prev.unread || []).filter((x) => x.id !== id),
        recent: (prev.recent || []).map((x) => (x.id === id ? { ...x, read_at: new Date().toISOString() } : x)),
      }))
    } catch (_) {}
  }

  const markAllRead = async () => {
    if (!token) return
    try {
      await fetch(`${apiBase}/api/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      setNotifPayload((prev) => ({
        ...prev,
        unread_count: 0,
        unread: [],
        recent: (prev.recent || []).map((x) => ({ ...x, read_at: x.read_at ?? new Date().toISOString() })),
      }))
    } catch (_) {}
  }

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
            <div className="admin-topbar-actions">
              <div className="admin-menu">
                <button
                  type="button"
                  className="admin-icon-btn"
                  aria-label="Notifications"
                  onClick={() => {
                    setNotifOpen((v) => !v)
                    setProfileOpen(false)
                    if (!notifOpen) fetchNotifications()
                  }}
                >
                  <span className="admin-icon-btn-inner">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                    {(notifPayload.unread_count ?? 0) > 0 && (
                      <span className="admin-badge">
                        {Math.min(99, notifPayload.unread_count)}
                      </span>
                    )}
                  </span>
                </button>
                {notifOpen && (
                  <div
                    className="admin-dropdown"
                  >
                    <div className="admin-dropdown-head">
                      <strong>Notifications</strong>
                      <button type="button" className="admin-dropdown-action" onClick={markAllRead} disabled={notifLoading || (notifPayload.unread_count ?? 0) === 0}>
                        Mark all read
                      </button>
                    </div>
                    <div className="admin-dropdown-divider" />
                    {notifLoading ? (
                      <div className="admin-dropdown-state">Loading…</div>
                    ) : notifError ? (
                      <div className="admin-dropdown-state admin-dropdown-state-error">{notifError}</div>
                    ) : notifications.length ? (
                      <div className="admin-dropdown-list">
                        {notifications.map((n) => (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => { markNotifRead(n.id) }}
                            className={`admin-dropdown-item${n.read_at ? '' : ' is-unread'}`}
                          >
                            <div className="admin-dropdown-item-title">{formatNotifText(n)}</div>
                            <div className="admin-dropdown-item-meta">
                              {n?.created_at ? new Date(n.created_at).toLocaleString() : ''}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="admin-dropdown-state">No notifications yet.</div>
                    )}
                  </div>
                )}
              </div>

              <div className="admin-menu">
                <button
                  type="button"
                  className="admin-profile-trigger"
                  onClick={() => {
                    setProfileOpen((v) => !v)
                    setNotifOpen(false)
                  }}
                  aria-label="User menu"
                >
                  <div className="admin-avatar" aria-hidden="true">
                    {(user?.name || 'U').slice(0, 1).toUpperCase()}
                  </div>
                  <div className="admin-profile-text">
                    <p className="admin-name">{user?.name || 'User'}</p>
                    <p className="admin-role">{ROLE_LABELS[user?.role] ?? user?.role ?? 'Staff'}</p>
                  </div>
                  <svg className="admin-profile-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {profileOpen && (
                  <div
                    className="admin-dropdown admin-dropdown--narrow"
                  >
                    <button
                      type="button"
                      onClick={logout}
                      className="admin-dropdown-item admin-dropdown-item--danger"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
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
