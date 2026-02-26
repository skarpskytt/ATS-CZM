import { useState } from 'react'
import { NavLink } from 'react-router-dom'

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const extractError = async (response) => {
  try {
    const payload = await response.json()
    if (payload?.message) {
      return payload.message
    }
    if (payload?.errors) {
      const firstKey = Object.keys(payload.errors)[0]
      if (firstKey) {
        return payload.errors[firstKey][0]
      }
    }
  } catch (err) {
    return null
  }

  return 'Unable to complete the request. Please try again.'
}

function AdminForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage(null)
    setError(null)
    setLoading(true)

    try {
      const response = await fetch(`${apiBase}/api/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const errorMessage = await extractError(response)
        setError(errorMessage)
        return
      }

      const payload = await response.json()
      setMessage(payload.message || 'If the address exists, a reset link has been sent.')
    } catch (err) {
      setError('Unable to send reset link. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="admin-shell">
      <div className="admin-auth-shell">
        <div className="admin-auth-visual">
          <div className="admin-auth-orb" />
          <div className="admin-auth-orb is-secondary" />
          <div className="admin-auth-grid" />
        </div>
        <form className="admin-auth-form" onSubmit={handleSubmit}>
          <div className="admin-auth-copy">
            <h1 className="admin-auth-title">Reset your password</h1>
            <p className="admin-auth-text">We will email you a secure link to choose a new password.</p>
          </div>
          <label className="admin-label">
            <span>Email</span>
            <input
              className="input input-bordered input-lg w-full"
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <button type="submit" className="btn btn-lg apply-submit w-full" disabled={loading}>
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
          <NavLink to="/admin" className="admin-link">
            Back to sign in
          </NavLink>
          {message ? <span className="admin-alert success">{message}</span> : null}
          {error ? <span className="admin-alert error">{error}</span> : null}
        </form>
      </div>
    </section>
  )
}

export default AdminForgotPasswordPage
