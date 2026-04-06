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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0f3d2e'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '360px',
        padding: '32px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img src="/logoczark.png" alt="Czark Mak Corporation" style={{ width: '60px', height: '60px', marginBottom: '16px', display: 'block', marginLeft: 'auto', marginRight: 'auto' }} />
          <h1 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 4px 0' }}>Forgot Password?</h1>
          <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>Enter your email to receive a reset link</p>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 16px',
              backgroundColor: '#dcfce7',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Check your inbox</h2>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
              We sent a reset link to <strong>{email}</strong>
            </p>
            <button
              type="button"
              onClick={() => { setSent(false); setError(null) }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#fff',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                marginBottom: '16px'
              }}
            >
              Try again
            </button>
            <div>
              <NavLink to="/admin/login" style={{ fontSize: '14px', color: '#2563eb', textDecoration: 'none' }}>
                ← Back to Sign In
              </NavLink>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                padding: '12px',
                backgroundColor: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                color: '#dc2626',
                fontSize: '14px',
                marginBottom: '16px'
              }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                autoFocus
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: loading ? '#9ca3af' : '#0f3d2e',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '16px'
              }}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <div style={{ textAlign: 'center' }}>
              <NavLink to="/admin/login" style={{ fontSize: '14px', color: '#166534', textDecoration: 'none' }}>
                ← Back to Sign In
              </NavLink>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default AdminForgotPasswordPage
