import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const STATUS_META = {
  submitted:            { icon: '📥', label: 'Submitted' },
  under_review:         { icon: '🔍', label: 'Under Review' },
  shortlisted:          { icon: '⭐', label: 'Shortlisted' },
  interview_scheduled:  { icon: '📅', label: 'Interview Scheduled' },
  offer_extended:       { icon: '📋', label: 'Offer Extended' },
  hired:                { icon: '✅', label: 'Hired' },
  rejected:             { icon: '❌', label: 'Rejected' },
  withdrawn:            { icon: '↩️', label: 'Withdrawn' },
}

function AdminAnalyticsPage() {
  const navigate = useNavigate()
  const [token] = useState(() => localStorage.getItem('ats_token') || '')
  const [user, setUser] = useState(null)
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!token) { navigate('/admin'); return }

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [userRes, dashRes] = await Promise.all([
          fetch(`${apiBase}/api/me`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${apiBase}/api/dashboard/overview`, { headers: { Authorization: `Bearer ${token}` } }),
        ])
        if (!userRes.ok) { navigate('/admin'); return }
        if (!dashRes.ok) throw new Error('Failed to load analytics')
        const [userData, dashData] = await Promise.all([userRes.json(), dashRes.json()])
        setUser(userData)
        setDashboard(dashData)
      } catch (err) {
        setError('Unable to load analytics data.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  const maxPositionCount = Math.max(...(dashboard?.by_position || []).map((p) => p.total), 1)

  return (
    <section className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-topbar-inner">
          <div className="admin-brand">
            <p className="admin-kicker">CZARK MAK CORPORATION</p>
            <span className="admin-brand-name">Analytics</span>
          </div>
          <nav className="admin-nav">
            <NavLink to="/admin" end className={({ isActive }) => (isActive ? 'active' : '')}>Dashboard</NavLink>
            <NavLink to="/admin/analytics" className={({ isActive }) => (isActive ? 'active' : '')}>Analytics</NavLink>
            <NavLink to="/admin/applicants" className={({ isActive }) => (isActive ? 'active' : '')}>Applicants</NavLink>
          </nav>
          <div className="admin-profile">
            {user ? (
              <>
                <div className="admin-avatar" aria-hidden="true">{(user.name || 'U').slice(0, 1).toUpperCase()}</div>
                <div>
                  <p className="admin-name">{user.name}</p>
                  <p className="admin-role">{user.role}</p>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </header>

      <div className="admin-content">
        {loading ? (
          <div className="admin-card">
            <div className="admin-card-head">
              <div><h2>Analytics Overview</h2><p>Loading data...</p></div>
            </div>
            <div className="admin-metric-grid">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="admin-metric-card skeleton" style={{ animationDelay: `${i * 0.06}s` }} />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="admin-card">
            <div className="admin-alert error">{error}</div>
          </div>
        ) : (
          <>
            {/* Summary row */}
            <div className="admin-card">
              <div className="admin-card-head">
                <div>
                  <h2>Analytics Overview</h2>
                  <p>Applicant pipeline metrics and position breakdown.</p>
                </div>
              </div>

              <p className="admin-section-label">Summary</p>
              <div className="admin-metric-grid" style={{ marginBottom: '2rem' }}>
                <div className="admin-metric-card">
                  <span className="metric-icon">👥</span>
                  <span>Total Applicants</span>
                  <strong>{dashboard?.total_applicants ?? 0}</strong>
                </div>
                <div className="admin-metric-card">
                  <span className="metric-icon">🗓️</span>
                  <span>Last 30 Days</span>
                  <strong>{dashboard?.recent_count ?? 0}</strong>
                </div>
              </div>

              <p className="admin-section-label">Pipeline Breakdown</p>
              <div className="admin-metric-grid">
                {(dashboard?.by_status || []).map((item) => {
                  const meta = STATUS_META[item.status] || { icon: '•', label: item.status }
                  return (
                    <div key={item.status} className="admin-metric-card">
                      <span className="metric-icon">{meta.icon}</span>
                      <span>{meta.label}</span>
                      <strong>{item.total}</strong>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Positions breakdown */}
            <div className="admin-card">
              <div className="admin-card-head">
                <div>
                  <h2>Top Positions Applied For</h2>
                  <p>Ranked by number of applications received.</p>
                </div>
              </div>
              {(dashboard?.by_position || []).length ? (
                <div className="admin-metric-list" style={{ border: 'none', padding: 0, background: 'transparent' }}>
                  <ul>
                    {(dashboard?.by_position || []).slice(0, 10).map((item, index) => {
                      const pct = Math.round((item.total / maxPositionCount) * 100)
                      return (
                        <li key={`pos-${item.position_applied_for}`} style={{ animationDelay: `${index * 0.07}s` }}>
                          <div className="pos-row">
                            <span>{item.position_applied_for}</span>
                            <strong>{item.total} applicant{item.total !== 1 ? 's' : ''}</strong>
                          </div>
                          <div className="pos-track">
                            <div className="pos-fill" style={{ '--bar-width': `${pct}%`, animationDelay: `${index * 0.07 + 0.3}s` }} />
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ) : (
                <div className="admin-empty-state">
                  <div className="admin-empty-icon">📊</div>
                  <p>No position data yet</p>
                  <span>Positions will appear once applicants start submitting.</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

export default AdminAnalyticsPage


const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function AdminAnalyticsPage() {
  const navigate = useNavigate()
  const [token] = useState(() => localStorage.getItem('ats_token') || '')
  const [user, setUser] = useState(null)
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const formatStatus = (value) =>
    value.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  useEffect(() => {
    if (!token) {
      navigate('/admin')
      return
    }

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [userRes, dashRes] = await Promise.all([
          fetch(`${apiBase}/api/me`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${apiBase}/api/dashboard/overview`, { headers: { Authorization: `Bearer ${token}` } }),
        ])

        if (!userRes.ok) {
          navigate('/admin')
          return
        }

        if (!dashRes.ok) {
          throw new Error('Failed to load analytics')
        }

        const [userData, dashData] = await Promise.all([userRes.json(), dashRes.json()])
        setUser(userData)
        setDashboard(dashData)
      } catch (err) {
        setError('Unable to load analytics data.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [token])

  return (
    <section className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-topbar-inner">
          <div className="admin-brand">
            <p className="admin-kicker">CZARK MAK CORPORATION</p>
            <span className="admin-brand-name">Analytics</span>
          </div>
          <nav className="admin-nav">
            <NavLink to="/admin" end className={({ isActive }) => (isActive ? 'active' : '')}>
              Dashboard
            </NavLink>
            <NavLink to="/admin/analytics" className={({ isActive }) => (isActive ? 'active' : '')}>
              Analytics
            </NavLink>
            <NavLink to="/admin/applicants" className={({ isActive }) => (isActive ? 'active' : '')}>
              Applicants
            </NavLink>
          </nav>
          <div className="admin-profile">
            {user ? (
              <>
                <div className="admin-avatar" aria-hidden="true">
                  {(user.name || 'U').slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="admin-name">{user.name}</p>
                  <p className="admin-role">{user.role}</p>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </header>

      <div className="admin-content">
        <div className="admin-card">
          <div className="admin-card-head">
            <div>
              <h2>Analytics Overview</h2>
              <p>Applicant pipeline metrics and position breakdown.</p>
            </div>
          </div>

          {loading ? (
            <div className="admin-metric-grid">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={`skeleton-${index}`} className="admin-metric-card skeleton" />
              ))}
            </div>
          ) : error ? (
            <div className="admin-alert error">{error}</div>
          ) : (
            <div className="admin-metrics">
              <div className="admin-metric-grid">
                <div className="admin-metric-card">
                  <span>Total Applicants</span>
                  <strong>{dashboard?.total_applicants || 0}</strong>
                </div>
                <div className="admin-metric-card">
                  <span>Last 30 Days</span>
                  <strong>{dashboard?.recent_count || 0}</strong>
                </div>
                {(dashboard?.by_status || []).map((item) => (
                  <div key={item.status} className="admin-metric-card">
                    <span>{formatStatus(item.status)}</span>
                    <strong>{item.total}</strong>
                  </div>
                ))}
              </div>
              <div className="admin-metric-list">
                <h4>Top Positions Applied For</h4>
                {(dashboard?.by_position || []).length ? (
                  <ul>
                    {(dashboard?.by_position || []).slice(0, 10).map((item) => (
                      <li key={`pos-${item.position_applied_for}`}>
                        <span>{item.position_applied_for}</span>
                        <strong>{item.total}</strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="admin-empty">No position data yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default AdminAnalyticsPage
