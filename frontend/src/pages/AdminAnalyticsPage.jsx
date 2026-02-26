import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

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
