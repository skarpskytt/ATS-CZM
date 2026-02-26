import { BrowserRouter, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
import ApplyPage from './pages/ApplyPage'
import AdminPage from './pages/AdminPage'
import AdminApplicantsPage from './pages/AdminApplicantsPage'
import AdminAnalyticsPage from './pages/AdminAnalyticsPage'
import AdminForgotPasswordPage from './pages/AdminForgotPasswordPage'
import AdminResetPasswordPage from './pages/AdminResetPasswordPage'

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

function AppContent() {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')
  const hideNav = isAdminRoute || location.pathname === '/apply'
  const isApplyPage = location.pathname === '/apply'

  return (
    <div className={`page ${isApplyPage ? 'page-apply' : ''} ${isAdminRoute ? 'page-admin' : ''}`}>
      {!hideNav && (
        <nav className="navbar bg-base-100 shadow-sm">
          <div className="flex-1">
            <NavLink to="/apply" className="btn btn-ghost text-xl">
              CZARK MAK CORPORATION
            </NavLink>
          </div>
          <div className="flex-none">
            <ul className="menu menu-horizontal px-1">
              <li>
                <NavLink to="/apply" className={({ isActive }) => (isActive ? 'active' : '')}>
                  Apply
                </NavLink>
              </li>
              <li>
                <details>
                  <summary>Admin</summary>
                  <ul className="bg-base-100 rounded-t-none p-2">
                    <li>
                      <NavLink to="/admin" className={({ isActive }) => (isActive ? 'active' : '')}>
                        Dashboard
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/admin/applicants" className={({ isActive }) => (isActive ? 'active' : '')}>
                        Applicants
                      </NavLink>
                    </li>
                  </ul>
                </details>
              </li>
            </ul>
          </div>
        </nav>
      )}

      <Routes>
        <Route path="/" element={<Navigate to="/apply" replace />} />
        <Route path="/apply" element={<ApplyPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
        <Route path="/admin/forgot-password" element={<AdminForgotPasswordPage />} />
        <Route path="/admin/reset-password" element={<AdminResetPasswordPage />} />
        <Route path="/admin/applicants" element={<AdminApplicantsPage />} />
        <Route path="*" element={<Navigate to="/apply" replace />} />
      </Routes>
    </div>
  )
}

export default App
