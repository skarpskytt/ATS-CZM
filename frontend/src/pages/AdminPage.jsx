import { useEffect, useState } from 'react'
import { NavLink, useSearchParams } from 'react-router-dom'

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const statusOptions = [
  'submitted',
  'under_review',
  'shortlisted',
  'interview_scheduled',
  'offer_extended',
  'hired',
  'rejected',
  'withdrawn',
]

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

function AdminPage() {
  const [searchParams] = useSearchParams()
  const [token, setToken] = useState(() => localStorage.getItem('ats_token') || '')
  const [user, setUser] = useState(null)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [adminMessage, setAdminMessage] = useState(null)
  const [adminError, setAdminError] = useState(null)
  const [loadingApplicants, setLoadingApplicants] = useState(false)
  const [applicants, setApplicants] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [notes, setNotes] = useState([])
  const [notesLoading, setNotesLoading] = useState(false)
  const [notesError, setNotesError] = useState(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [noteSaving, setNoteSaving] = useState(false)

  const handleLoginChange = (event) => {
    const { name, value } = event.target
    setLoginForm((previous) => ({ ...previous, [name]: value }))
  }

  const loadUser = async (activeToken) => {
    const response = await fetch(`${apiBase}/api/me`, {
      headers: { Authorization: `Bearer ${activeToken}` },
    })

    if (!response.ok) {
      throw new Error('Unauthorized')
    }

    return response.json()
  }

  const loadApplicants = async (activeToken, filters = {}, preferredId = null) => {
    setLoadingApplicants(true)
    try {
      const params = new URLSearchParams(filters)
      const queryString = params.toString()
      const response = await fetch(`${apiBase}/api/applicants${queryString ? `?${queryString}` : ''}`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      })

      if (!response.ok) {
        throw new Error('Failed to load applicants')
      }

      const payload = await response.json()
      setApplicants(payload.data || [])
      setSelectedId(preferredId || payload.data?.[0]?.id || null)
    } finally {
      setLoadingApplicants(false)
    }
  }

  const loadNotes = async (activeToken, applicantId) => {
    if (!applicantId) {
      setNotes([])
      return
    }

    setNotesLoading(true)
    setNotesError(null)
    try {
      const response = await fetch(`${apiBase}/api/applicants/${applicantId}/notes`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      })

      if (!response.ok) {
        throw new Error('Failed to load notes')
      }

      const payload = await response.json()
      setNotes(payload || [])
    } catch (err) {
      setNotesError('Unable to load notes.')
    } finally {
      setNotesLoading(false)
    }
  }

  useEffect(() => {
    if (!token) {
      setUser(null)
      return
    }

    loadUser(token)
      .then((profile) => {
        setUser(profile)
        const urlApplicantId = searchParams.get('applicant') ? Number(searchParams.get('applicant')) : null
        return loadApplicants(token, {}, urlApplicantId)
      })
      .catch(() => {
        setToken('')
        localStorage.removeItem('ats_token')
        setUser(null)
      })
  }, [token])

  useEffect(() => {
    document.body.classList.toggle('no-scroll', !token)
    return () => document.body.classList.remove('no-scroll')
  }, [token])

  useEffect(() => {
    if (!token) {
      return
    }

    const timer = setTimeout(() => {
      loadApplicants(token, {
        search: searchTerm || undefined,
        status: statusFilter || undefined,
      })
    }, 300)

    return () => clearTimeout(timer)
  }, [token, searchTerm, statusFilter])

  useEffect(() => {
    if (!token || !selectedId) {
      setNotes([])
      return
    }

    loadNotes(token, selectedId)
  }, [token, selectedId])

  const handleNoteSubmit = async (event) => {
    event.preventDefault()
    if (!noteDraft.trim() || !selectedId) {
      return
    }

    setNoteSaving(true)
    setNotesError(null)

    try {
      const response = await fetch(`${apiBase}/api/applicants/${selectedId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ note: noteDraft.trim() }),
      })

      if (!response.ok) {
        throw new Error('Failed to save note')
      }

      const payload = await response.json()
      setNotes((previous) => [payload, ...previous])
      setNoteDraft('')
    } catch (err) {
      setNotesError('Unable to save note.')
    } finally {
      setNoteSaving(false)
    }
  }

  const formatStatus = (value) => value.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  const handleLogin = async (event) => {
    event.preventDefault()
    setAdminMessage(null)
    setAdminError(null)

    try {
      const response = await fetch(`${apiBase}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      })

      if (!response.ok) {
        const errorMessage = await extractError(response)
        setAdminError(errorMessage)
        return
      }

      const payload = await response.json()
      setToken(payload.token)
      localStorage.setItem('ats_token', payload.token)
      setAdminMessage('Welcome back!')
      setLoginForm({ email: '', password: '' })
    } catch (err) {
      setAdminError('Unable to login. Please try again.')
    }
  }

  const handleLogout = async () => {
    if (!token) {
      return
    }

    await fetch(`${apiBase}/api/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })

    setToken('')
    setUser(null)
    localStorage.removeItem('ats_token')
  }

  const handleStatusSave = async (applicantId, status) => {
    setAdminMessage(null)
    setAdminError(null)

    try {
      const response = await fetch(`${apiBase}/api/applicants/${applicantId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        const errorMessage = await extractError(response)
        setAdminError(errorMessage)
        return
      }

      const updated = await response.json()
      setApplicants((previous) =>
        previous.map((item) => (item.id === updated.id ? updated : item))
      )
      setAdminMessage('Status updated.')
    } catch (err) {
      setAdminError('Unable to update status. Please try again.')
    }
  }

  const selectedApplicant = applicants.find((item) => item.id === selectedId)

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <section className="admin-shell">
      {token ? (
        <header className="admin-topbar">
          <div className="admin-topbar-inner">
            <div className="admin-brand">
              <p className="admin-kicker">CZARK MAK CORPORATION</p>
              <span className="admin-brand-name">Dashboard</span>
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
                {(user?.name || 'User').slice(0, 1).toUpperCase()}
              </div>
              <div>
                <p className="admin-name">{user?.name || 'User'}</p>
                <p className="admin-role">{user?.role || 'recruiter'}</p>
              </div>
              <button type="button" className="btn btn-sm btn-outline admin-logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </header>
      ) : null}

      {!token ? (
        <div className="admin-auth-shell">
          <div className="admin-auth-visual">
            <div className="admin-auth-orb" />
            <div className="admin-auth-orb is-secondary" />
            <div className="admin-auth-grid" />
          </div>
          <form className="admin-auth-form" onSubmit={handleLogin}>
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
                value={loginForm.email}
                onChange={handleLoginChange}
                required
              />
            </label>
            <label className="admin-label">
              <span>Password</span>
              <div className="admin-password-field">
                <input
                  className="input input-bordered input-lg w-full"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={loginForm.password}
                  onChange={handleLoginChange}
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
            <a className="admin-link" href="/admin/forgot-password">
              Forgot password?
            </a>
            <button type="submit" className="btn btn-lg apply-submit w-full">Sign in</button>
            {adminMessage ? <span className="admin-alert success">{adminMessage}</span> : null}
            {adminError ? <span className="admin-alert error">{adminError}</span> : null}
          </form>
        </div>
      ) : (
        <div className="admin-content">
          <div className="admin-welcome">
            <div className="admin-welcome-text">
              <h2>{getGreeting()}, {user?.name?.split(' ')[0] || 'there'} 👋</h2>
              <p>Here's the applicant pipeline. Select someone to view their details.</p>
            </div>
            <span className="admin-welcome-date">{todayLabel}</span>
          </div>
          <div className="admin-card">
            <div className="admin-card-head">
              <div>
                <h2>Applicants</h2>
                <p>{applicants.length} applicant{applicants.length !== 1 ? 's' : ''} · Signed in as {user?.name || 'User'} ({user?.role || 'recruiter'})</p>
              </div>
              <NavLink to="/admin/applicants" className="btn btn-outline">
                View full table
              </NavLink>
            </div>
            <div className="admin-layout">
            <aside className="admin-panel admin-sidebar">
              <div className="admin-panel-head">
                <h4>Pipeline</h4>
                {loadingApplicants ? <span>Loading...</span> : <span>{applicants.length} applicants</span>}
              </div>
              <div className="admin-filters">
                <input
                  className="input input-bordered"
                  type="search"
                  placeholder="Search name, email, role"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
                <select
                  className="select select-bordered"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="">All statuses</option>
                  {statusOptions.map((option) => (
                    <option key={`filter-${option}`} value={option}>
                      {formatStatus(option)}
                    </option>
                  ))}
                </select>
              </div>
              <ul className="admin-list">
                {loadingApplicants ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <li key={`skel-${i}`}>
                      <div className="admin-list-skeleton" style={{ animationDelay: `${i * 0.07}s` }}>
                        <div className="admin-list-skel-line" style={{ width: '65%' }} />
                        <div className="admin-list-skel-line" style={{ width: '45%', height: '10px', marginTop: '6px' }} />
                      </div>
                    </li>
                  ))
                ) : applicants.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`admin-list-item ${item.id === selectedId ? 'active' : ''}`}
                      onClick={() => setSelectedId(item.id)}
                    >
                      <div className="admin-list-avatar" aria-hidden="true">
                        {item.first_name?.slice(0, 1)}{item.last_name?.slice(0, 1)}
                      </div>
                      <div className="admin-list-info">
                        <strong>{item.first_name} {item.last_name}</strong>
                        <span>{item.position_applied_for}</span>
                      </div>
                      <span className={`admin-chip ${item.status}`}>{formatStatus(item.status)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </aside>
            <section className="admin-panel admin-detail">
              {selectedApplicant ? (
                <div>
                  <div className="admin-detail-head">
                    <div className="admin-detail-identity">
                      <div className="admin-detail-avatar" aria-hidden="true">
                        {selectedApplicant.first_name?.slice(0, 1)}{selectedApplicant.last_name?.slice(0, 1)}
                      </div>
                      <div>
                        <h3>{selectedApplicant.first_name} {selectedApplicant.last_name}</h3>
                        <p>{selectedApplicant.position_applied_for}</p>
                        <span className={`admin-chip ${selectedApplicant.status}`}>
                          {formatStatus(selectedApplicant.status)}
                        </span>
                      </div>
                    </div>
                    <div className="admin-status">
                      <label className="admin-status-label">Update status</label>
                      <select
                        className="select select-bordered"
                        value={selectedApplicant.status}
                        onChange={(event) => {
                          const value = event.target.value
                          setApplicants((previous) =>
                            previous.map((item) =>
                              item.id === selectedApplicant.id ? { ...item, status: value } : item
                            )
                          )
                        }}
                      >
                        {statusOptions.map((option) => (
                          <option key={option} value={option}>
                            {formatStatus(option)}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn btn-sm apply-submit"
                        onClick={() => handleStatusSave(selectedApplicant.id, selectedApplicant.status)}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                  <div className="admin-detail-grid">
                    <div className="admin-detail-section">
                      <h4 className="admin-detail-section-title">📬 Contact</h4>
                      <dl className="admin-field-list">
                        <div className="admin-field">
                          <dt>Email</dt>
                          <dd>{selectedApplicant.email_address}</dd>
                        </div>
                        <div className="admin-field">
                          <dt>Phone</dt>
                          <dd>{selectedApplicant.contact_number}</dd>
                        </div>
                        <div className="admin-field">
                          <dt>Address</dt>
                          <dd>{selectedApplicant.permanent_address}</dd>
                        </div>
                        <div className="admin-field">
                          <dt>Gender</dt>
                          <dd>{selectedApplicant.gender || 'N/A'}</dd>
                        </div>
                        <div className="admin-field">
                          <dt>Civil Status</dt>
                          <dd>{selectedApplicant.civil_status || 'N/A'}</dd>
                        </div>
                      </dl>
                    </div>
                    <div className="admin-detail-section">
                      <h4 className="admin-detail-section-title">🎓 Education</h4>
                      <dl className="admin-field-list">
                        <div className="admin-field">
                          <dt>Highest Level</dt>
                          <dd>{selectedApplicant.highest_education_level}</dd>
                        </div>
                        <div className="admin-field">
                          <dt>Course</dt>
                          <dd>{selectedApplicant.bachelors_degree_course || 'N/A'}</dd>
                        </div>
                        <div className="admin-field">
                          <dt>School</dt>
                          <dd>{selectedApplicant.last_school_attended}</dd>
                        </div>
                        <div className="admin-field">
                          <dt>Year Graduated</dt>
                          <dd>{selectedApplicant.year_graduated || 'N/A'}</dd>
                        </div>
                      </dl>
                    </div>
                    <div className="admin-detail-section">
                      <h4 className="admin-detail-section-title">💼 Professional</h4>
                      <dl className="admin-field-list">
                        <div className="admin-field">
                          <dt>Experience</dt>
                          <dd>{selectedApplicant.total_work_experience_years || 'N/A'} yrs</dd>
                        </div>
                        <div className="admin-field">
                          <dt>Expected Salary</dt>
                          <dd>{selectedApplicant.expected_salary ? `₱${Number(selectedApplicant.expected_salary).toLocaleString()}` : 'N/A'}</dd>
                        </div>
                        <div className="admin-field">
                          <dt>Preferred Location</dt>
                          <dd>{selectedApplicant.preferred_work_location}</dd>
                        </div>
                        <div className="admin-field">
                          <dt>PRC License</dt>
                          <dd>{selectedApplicant.prc_license || 'N/A'}</dd>
                        </div>
                        <div className="admin-field">
                          <dt>Vacancy Source</dt>
                          <dd>{selectedApplicant.vacancy_source || 'N/A'}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                  <div className="admin-notes">
                    <div className="admin-notes-head">
                      <h4>📝 HR Notes</h4>
                      {notesLoading ? <span className="admin-notes-loading">Loading...</span> : null}
                    </div>
                    <form className="admin-note-form" onSubmit={handleNoteSubmit}>
                      <textarea
                        className="textarea textarea-bordered"
                        placeholder="Add a note for recruiters..."
                        value={noteDraft}
                        onChange={(event) => setNoteDraft(event.target.value)}
                        rows={3}
                      />
                      <button type="submit" className="btn btn-sm apply-submit" disabled={noteSaving}>
                        {noteSaving ? 'Saving...' : 'Add note'}
                      </button>
                    </form>
                    {notesError ? <div className="admin-alert error">{notesError}</div> : null}
                    {notes.length ? (
                      <ul className="admin-note-list">
                        {notes.map((note) => (
                          <li key={note.id}>
                            <p>{note.note}</p>
                            <div className="admin-note-meta">
                              <span>✍️ {note.user?.name || 'Recruiter'}</span>
                              <span>{new Date(note.created_at).toLocaleString()}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : !notesLoading ? (
                      <div className="admin-empty-state" style={{ padding: '1.5rem 0' }}>
                        <div className="admin-empty-icon">📋</div>
                        <p>No notes yet</p>
                        <span>Add a note above to start tracking this applicant.</span>
                      </div>
                    ) : null}
                  </div>
                  <div className="admin-detail-footer">
                    {selectedApplicant.cv_path ? (
                      <a
                        className="admin-cv-btn"
                        href={`${apiBase}/storage/${selectedApplicant.cv_path}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        📄 View CV
                      </a>
                    ) : (
                      <span className="admin-cv-missing">No CV uploaded</span>
                    )}
                    <span className="admin-submitted-date">
                      Submitted {new Date(selectedApplicant.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  {adminMessage ? <span className="admin-alert success">{adminMessage}</span> : null}
                  {adminError ? <span className="admin-alert error">{adminError}</span> : null}
                </div>
              ) : (
                <div className="admin-empty-state">
                  <div className="admin-empty-icon">👈</div>
                  <p>No applicant selected</p>
                  <span>Pick someone from the pipeline to view their details.</span>
                </div>
              )}
            </section>
          </div>
        </div>
        </div>
      )}
    </section>
  )
}

export default AdminPage
