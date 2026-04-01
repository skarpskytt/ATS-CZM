import { useState } from 'react'
import { NavLink } from 'react-router-dom'
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

function AdminForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const response = await fetch(`${apiBase}/api/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!response.ok) { setError(await extractError(response)); return }
      setSent(true)
    } catch { setError('Unable to send reset link. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <div className="fp-shell">
      {/* Left visual panel */}
      <div className="fp-visual">
        <div className="fp-orb fp-orb-1" />
        <div className="fp-orb fp-orb-2" />
        <div className="fp-visual-content">
          <div className="fp-logo-wrap">
            <img src="/logoczark.png" alt="Czark Mak" className="fp-logo" />
          </div>
          <h2 className="fp-visual-title">Forgot your password?</h2>
          <p className="fp-visual-sub">No worries — enter your email and we'll send you a secure reset link right away.</p>
          <ul className="fp-tips">
            <li><span className="fp-tip-icon">📧</span> Check your inbox after submitting</li>
            <li><span className="fp-tip-icon">⏱</span> Link expires after 60 minutes</li>
            <li><span className="fp-tip-icon">🔒</span> Only works once per request</li>
            <li><span className="fp-tip-icon">🔍</span> Check spam folder if not received</li>
          </ul>
        </div>
      </div>

      {/* Right form panel */}
      <div className="fp-form-panel">
        <div className="fp-form-wrap">
          {sent ? (
            <div className="fp-success-state">
              <div className="fp-success-icon-wrapper">
                <div className="fp-success-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
              </div>
              <h2 className="fp-success-title">Check your inbox!</h2>
              <p className="fp-success-text">
                We sent a password reset link to <strong>{email}</strong>.<br />
                It may take a minute to arrive — check your spam folder too.
              </p>
              <div className="fp-resend-wrap">
                <span className="fp-resend-hint">Didn't get the email?</span>
                <button
                  type="button"
                  className="fp-resend-btn"
                  onClick={() => { setSent(false); setError(null) }}
                >
                  Try again
                </button>
              </div>
              <NavLink to="/admin/login" className="fp-back-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>
                </svg>
                Back to Sign In
              </NavLink>
            </div>
          ) : (
            <>
              <div className="fp-form-header">
                <div className="fp-form-icon-wrapper">
                  <div className="fp-form-icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                    </svg>
                  </div>
                </div>
                <h1 className="fp-form-title">Reset Password</h1>
                <p className="fp-form-sub">Enter your account email and we'll send you a reset link.</p>
              </div>

              <form onSubmit={handleSubmit} className="fp-form">
                <div className="fp-field">
                  <label className="fp-label" htmlFor="fp-email">
                    Email address
                    <span className="fp-required">*</span>
                  </label>
                  <div className="fp-input-wrap">
                    <svg className="fp-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                    </svg>
                    <input
                      id="fp-email"
                      className="fp-input"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@czarkmak.com"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {error && (
                  <div className="fp-alert fp-alert-error" role="alert">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {error}
                  </div>
                )}

                <button type="submit" className="fp-submit" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="fp-spinner" aria-hidden="true" />
                      Sending link...
                    </>
                  ) : (
                    <>
                      Send Reset Link
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                      </svg>
                    </>
                  )}
                </button>

                <NavLink to="/admin/login" className="fp-back-link">
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

export default AdminForgotPasswordPage
