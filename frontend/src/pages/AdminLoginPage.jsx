import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiBase } from '../utils/apiBase'

const HERO_IMAGE = null
const SHOW_VISUAL_PANEL = true

const FEATURES = [
  { icon: '📋', label: 'Applicant Tracking',  desc: 'Monitor every candidate through the full hiring pipeline.' },
  { icon: '💬', label: 'Smart Notes',          desc: 'Attach reviewers notes to any applicant record instantly.' },
  { icon: '📊', label: 'Live Analytics',       desc: 'Real-time dashboards across positions and statuses.' },
  { icon: '🔔', label: 'Email Alerts',         desc: 'Auto-notify candidates when their status changes.' },
]

export default function AdminLoginPage() {
  const { token, login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm]               = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]             = useState(null)
  const [loading, setLoading]         = useState(false)

  if (token) return <Navigate to="/admin" replace />

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        const msg = payload?.errors
          ? Object.values(payload.errors).flat()[0]
          : payload?.message || 'Invalid credentials.'
        setError(msg)
        return
      }
      const payload = await res.json()
      login(payload.token)
      navigate('/admin', { replace: true })
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`login-shell${!SHOW_VISUAL_PANEL ? ' login-shell--centered' : ''}`}>

      {/* ── LEFT — visual / hero panel ── */}
      {SHOW_VISUAL_PANEL && (
        <div className="login-visual">
          <div className="login-visual-orb orb-a" />
          <div className="login-visual-orb orb-b" />
          <div className="login-visual-orb orb-c" />
          <div className="login-visual-grid" />

          <div className="login-visual-inner">
            {/* ── Brand mark ── */}
            <div className="login-vis-brand">
              <div className="login-vis-logo">
                <img src="/logoczark.png" alt="Czark Mak Corporation" className="login-vis-logo-img" />
              </div>
              <div>
                <p className="login-vis-company">CZARK MAK CORPORATION</p>
                <p className="login-vis-tagline">Applicant Tracking System</p>
              </div>
            </div>

            {/* ── Hero image / GIF placeholder ── */}
            <div className="login-vis-media">
              {HERO_IMAGE ? (
                <img src={HERO_IMAGE} alt="ATS illustration" className="login-vis-img" />
              ) : (
                <div className="login-vis-placeholder">
                  <span>🏢</span>
                  <p>Add your image or GIF here</p>
                  <small>Set the HERO_IMAGE constant at the top of this file</small>
                </div>
              )}
            </div>

            {/* ── Feature cards ── */}
            <ul className="login-feature-list">
              {FEATURES.map((f) => (
                <li key={f.label} className="login-feature-item">
                  <span className="login-feature-icon">{f.icon}</span>
                  <div>
                    <strong>{f.label}</strong>
                    <p>{f.desc}</p>
                  </div>
                </li>
              ))}
            </ul>

            {/* ── Bottom note ── */}
            <p className="login-vis-note">
              Secure access · Admin only · v2.0
            </p>
          </div>
        </div>
      )}

      {/* ── RIGHT — login form ── */}
      <div className="login-form-side">
        <form className="login-form" onSubmit={handleSubmit} noValidate>

          {/* Brand (shown when visual panel is hidden) */}
          {!SHOW_VISUAL_PANEL && (
            <div className="admin-auth-brand" style={{ marginBottom: '1.5rem' }}>
              <div className="admin-auth-logo">
                <img src="/logoczark.png" alt="Czark Mak Corporation" className="login-vis-logo-img" />
              </div>
              <div>
                <p className="admin-auth-company">CZARK MAK CORPORATION</p>
                <h2 className="admin-auth-heading">Admin Portal</h2>
              </div>
            </div>
          )}

          <div className="login-form-card">

          {/* Heading */}
          <div className="login-form-head">
            <div className="login-form-avatar">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(247,243,234,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <h1 className="login-form-title">Welcome back</h1>
            <p className="login-form-sub">Sign in to the admin portal to continue.</p>
          </div>

          <div className="login-form-divider" />

          {/* Error banner */}
          {error && (
            <div className="login-error" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Email */}
          <div className="login-field">
            <label className="login-field-label" htmlFor="lf-email">Email address</label>
            <div className="login-input-wrap">
              <svg className="login-input-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
              <input
                id="lf-email"
                className="login-input"
                type="email"
                name="email"
                placeholder="admin@company.com"
                value={form.email}
                onChange={handleChange}
                required
                autoFocus
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="login-field">
            <div className="login-field-row">
              <label className="login-field-label" htmlFor="lf-password">Password</label>
              <a className="login-forgot" href="/admin/forgot-password">Forgot password?</a>
            </div>
            <div className="login-input-wrap">
              <svg className="login-input-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                id="lf-password"
                className="login-input"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-eye-btn"
                onClick={() => setShowPassword((p) => !p)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="login-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="login-spinner" aria-hidden="true" />
                Signing in…
              </>
            ) : (
              <>
                Sign in
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </>
            )}
          </button>

          <p className="login-form-footer">
            Protected area — authorised personnel only.
          </p>

          </div>{/* end .login-form-card */}
        </form>
      </div>
    </div>
  )
}
