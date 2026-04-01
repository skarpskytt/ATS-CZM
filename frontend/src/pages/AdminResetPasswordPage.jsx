import { useMemo, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { apiBase } from '../utils/apiBase'

const extractError = async (response) => {
  try {
    const payload = await response.json()
    if (payload?.message) return payload.message
    if (payload?.errors) {
      const firstKey = Object.keys(payload.errors)[0]
      if (firstKey) return payload.errors[firstKey][0]
    }
  } catch { return null }
  return 'Unable to complete the request. Please try again.'
}

function getStrength(pw) {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score
}

function StrengthBar({ password }) {
  const score = getStrength(password)
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['', '#e53e3e', '#d97706', '#2563eb', '#16a34a']
  if (!password) return null
  return (
    <div className="rp-strength">
      <div className="rp-strength-bars">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="rp-strength-bar" style={{ background: i <= score ? colors[score] : '#e2e8f0' }} />
        ))}
      </div>
      <span className="rp-strength-label" style={{ color: colors[score] }}>{labels[score]}</span>
    </div>
  )
}

function AdminResetPasswordPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const query = useMemo(() => new URLSearchParams(location.search), [location.search])
  const token = query.get('token') || ''
  const email = query.get('email') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!token || !email) { setError('Reset link is missing required details.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    if (getStrength(password) < 2) { setError('Password is too weak. Add uppercase letters, numbers or symbols.'); return }
    setLoading(true)
    try {
      const response = await fetch(`${apiBase}/api/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, password, password_confirmation: confirmPassword }),
      })
      if (!response.ok) { setError(await extractError(response)); return }
      setDone(true)
      setTimeout(() => navigate('/admin/login'), 3000)
    } catch { setError('Unable to reset password. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <div className="rp-shell">
      {/* Left visual panel */}
      <div className="rp-visual">
        <div className="rp-orb rp-orb-1" />
        <div className="rp-orb rp-orb-2" />
        <div className="rp-visual-content">
          <div className="rp-logo-wrap">
            <img src="/logoczark.png" alt="Czark Mak" className="rp-logo" />
          </div>
          <h2 className="rp-visual-title">Secure your account</h2>
          <p className="rp-visual-sub">Choose a strong password to protect your ATS account.</p>
          <ul className="rp-tips">
            <li><span className="rp-tip-icon">✓</span> At least 8 characters</li>
            <li><span className="rp-tip-icon">✓</span> One uppercase letter</li>
            <li><span className="rp-tip-icon">✓</span> One number</li>
            <li><span className="rp-tip-icon">✓</span> One special character</li>
          </ul>
        </div>
      </div>

      {/* Right form panel */}
      <div className="rp-form-panel">
        <div className="rp-form-wrap">
          {done ? (
            <div className="rp-success-state">
              <div className="rp-success-icon-wrapper">
                <div className="rp-success-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
              </div>
              <h2 className="rp-success-title">Password Updated!</h2>
              <p className="rp-success-text">
                Your password has been changed successfully.<br />Redirecting you to sign in...
              </p>
              <div className="rp-redirect-bar"><div className="rp-redirect-fill" /></div>
              <NavLink to="/admin/login" className="rp-back-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                </svg>
                Go to Sign In
              </NavLink>
            </div>
          ) : (
            <>
              <div className="rp-form-header">
                <div className="rp-form-icon-wrapper">
                  <div className="rp-form-icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                </div>
                <h1 className="rp-form-title">Reset Password</h1>
                <p className="rp-form-sub">Setting new password for <strong>{email || 'your account'}</strong></p>
              </div>

              <form onSubmit={handleSubmit} className="rp-form">
                {/* New password */}
                <div className="rp-field">
                  <label className="rp-label" htmlFor="rp-password">
                    New Password
                    <span className="rp-required">*</span>
                  </label>
                  <div className="rp-input-wrap">
                    <svg className="rp-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <input
                      id="rp-password"
                      className="rp-input"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                    />
                    <button type="button" className="rp-eye-btn" onClick={() => setShowPassword(p => !p)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                  <StrengthBar password={password} />
                </div>

                {/* Confirm password */}
                <div className="rp-field">
                  <label className="rp-label" htmlFor="rp-confirm">
                    Confirm Password
                    <span className="rp-required">*</span>
                  </label>
                  <div className="rp-input-wrap">
                    <svg className="rp-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <input
                      id="rp-confirm"
                      className={`rp-input ${
                        confirmPassword && confirmPassword !== password ? 'rp-input-mismatch'
                        : confirmPassword && confirmPassword === password ? 'rp-input-match' : ''
                      }`}
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      required
                    />
                    <button type="button" className="rp-eye-btn" onClick={() => setShowConfirm(p => !p)} aria-label={showConfirm ? 'Hide password' : 'Show password'}>
                      {showConfirm ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== password && (
                    <span className="rp-match-hint rp-match-hint--err">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      Passwords do not match
                    </span>
                  )}
                  {confirmPassword && confirmPassword === password && (
                    <span className="rp-match-hint rp-match-hint--ok">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Passwords match
                    </span>
                  )}
                </div>

                {error && (
                  <div className="rp-alert rp-alert-error" role="alert">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {error}
                  </div>
                )}

                <button type="submit" className="rp-submit" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="rp-spinner" aria-hidden="true" />
                      Updating password...
                    </>
                  ) : (
                    <>
                      Update Password
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                      </svg>
                    </>
                  )}
                </button>

                <NavLink to="/admin/login" className="rp-back-link">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>
                  </svg>
                  Back to Sign In
                </NavLink>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminResetPasswordPage
