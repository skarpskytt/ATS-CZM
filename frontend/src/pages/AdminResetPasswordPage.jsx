import { useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

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

function AdminResetPasswordPage() {
  const location = useLocation()
  const query = useMemo(() => new URLSearchParams(location.search), [location.search])
  const token = query.get('token') || ''
  const email = query.get('email') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage(null)
    setError(null)

    if (!token || !email) {
      setError('Reset link is missing required details.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${apiBase}/api/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          email,
          password,
          password_confirmation: confirmPassword,
        }),
      })

      if (!response.ok) {
        const errorMessage = await extractError(response)
        setError(errorMessage)
        return
      }

      const payload = await response.json()
      setMessage(payload.message || 'Password updated. You can sign in now.')
    } catch (err) {
      setError('Unable to reset password. Please try again.')
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
            <h1 className="admin-auth-title">Choose a new password</h1>
            <p className="admin-auth-text">Set a fresh password for {email || 'your account'}.</p>
          </div>
          <label className="admin-label">
            <span>New password</span>
            <div className="admin-password-field">
              <input
                className="input input-bordered input-lg w-full"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                type="button"
                className="admin-toggle"
                onClick={() => setShowPassword((previous) => !previous)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>
          <label className="admin-label">
            <span>Confirm password</span>
            <div className="admin-password-field">
              <input
                className="input input-bordered input-lg w-full"
                type={showConfirm ? 'text' : 'password'}
                name="password_confirmation"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
              <button
                type="button"
                className="admin-toggle"
                onClick={() => setShowConfirm((previous) => !previous)}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>
          <button type="submit" className="btn btn-lg apply-submit w-full" disabled={loading}>
            {loading ? 'Updating...' : 'Update password'}
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

export default AdminResetPasswordPage
