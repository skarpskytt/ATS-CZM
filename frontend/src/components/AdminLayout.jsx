import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminLayout({ children, pageTitle }) {
  const { user, logout } = useAuth()

  return (
    <section className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-topbar-inner">
          <div className="admin-brand">
            <p className="admin-kicker">CZARK MAK CORPORATION</p>
            <span className="admin-brand-name">{pageTitle}</span>
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
            <div className="admin-avatar" aria-hidden="true">
              {(user?.name || 'U').slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p className="admin-name">{user?.name || 'User'}</p>
              <p className="admin-role">{user?.role || 'recruiter'}</p>
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

      <div className="admin-content">
        {children}
      </div>
    </section>
  )
}
