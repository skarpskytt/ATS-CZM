import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export default function AdminLoginPage() {
  const { token, login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // Already logged in — go straight to dashboard
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
        const msg =
          payload?.errors
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
    <div className="admin-auth-shell">
      <div className="admin-auth-visual">
        <div className="admin-auth-orb" />
        <div className="admin-auth-orb is-secondary" />
        <div className="admin-auth-grid" />
      </div>

      <form className="admin-auth-form" onSubmit={handleSubmit}>
        <div className="admin-auth-brand">
          <div className="admin-auth-logo">CZM</div>
          <div>
            <p className="admin-auth-company">CZARK MAK CORPORATION</p>
            <h2 className="admin-auth-heading">Admin Portal</h2>
          </div>
        </div>

        <label className="admin-label">
          <span>Email</span>
          <input
            className="input input-bordered input-lg w-full"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            autoFocus
          />
        </label>

        <label className="admin-label">
          <span>Password</span>
          <div className="admin-password-field">
            <input
              className="input input-bordered input-lg w-full"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="admin-toggle"
              onClick={() => setShowPassword((p) => !p)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </label>

        <a className="admin-link" href="/admin/forgot-password">
          Forgot password?
        </a>

        <button type="submit" className="btn btn-lg apply-submit w-full" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        {error ? <span className="admin-alert error">{error}</span> : null}
      </form>
    </div>
  )
}
