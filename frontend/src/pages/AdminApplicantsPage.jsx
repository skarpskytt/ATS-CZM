import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

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

function AdminApplicantsPage() {
  const navigate = useNavigate()
  const [token, setToken] = useState(() => localStorage.getItem('ats_token') || '')
  const [user, setUser] = useState(null)
  const [applicants, setApplicants] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [positionFilter, setPositionFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [positions, setPositions] = useState([])
  const [positionsLoading, setPositionsLoading] = useState(false)
  const [sort, setSort] = useState('created_at')
  const [direction, setDirection] = useState('desc')

  const handleSort = (field) => {
    if (sort === field) {
      setDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSort(field)
      setDirection('asc')
    }
    setPage(1)
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

  const loadPositions = async (activeToken) => {
    setPositionsLoading(true)
    try {
      const response = await fetch(`${apiBase}/api/positions`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      })

      if (!response.ok) {
        throw new Error('Failed to load positions')
      }

      const payload = await response.json()
      setPositions(payload.data || [])
    } finally {
      setPositionsLoading(false)
    }
  }

  const loadApplicants = async (activeToken, filters = {}) => {
    setLoading(true)
    setError(null)
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
      setPage(payload.meta?.current_page || 1)
      setLastPage(payload.meta?.last_page || 1)
      setTotal(payload.meta?.total || 0)
    } catch (err) {
      setError('Unable to load applicants.')
    } finally {
      setLoading(false)
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
        loadPositions(token)
      })
      .catch(() => {
        setToken('')
        localStorage.removeItem('ats_token')
        setUser(null)
      })
  }, [token])

  useEffect(() => {
    setPage(1)
  }, [searchTerm, statusFilter, positionFilter, startDate, endDate])

  useEffect(() => {
    if (!token) {
      return
    }

    const timer = setTimeout(() => {
      loadApplicants(token, {
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        position: positionFilter || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        sort,
        direction,
        page: page || 1,
      })
    }, 300)

    return () => clearTimeout(timer)
  }, [token, searchTerm, statusFilter, positionFilter, startDate, endDate, sort, direction, page])

  const formatStatus = (value) => value.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  return (
    <section className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-topbar-inner">
          <div className="admin-brand">
            <p className="admin-kicker">CZARK MAK CORPORATION</p>
            <span className="admin-brand-name">Applicants</span>
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
            {token ? (
              <>
                <div className="admin-avatar" aria-hidden="true">
                  {(user?.name || 'User').slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <p className="admin-name">{user?.name || 'User'}</p>
                  <p className="admin-role">{user?.role || 'recruiter'}</p>
                </div>
              </>
            ) : (
              <p className="admin-role">Sign in to continue</p>
            )}
          </div>
        </div>
      </header>

      <div className="admin-content">
      <div className="admin-card">
        <div className="admin-card-head">
          <div>
            <h2>All applicants</h2>
            <p>Search, filter, and export your applicant data.</p>
          </div>
          <div className="admin-table-total">Total: {total}</div>
        </div>

        <div className="admin-table-filters">
          <label>
            <span>Search</span>
            <input
              className="input input-bordered"
              type="search"
              placeholder="Name, email, position"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
          <label>
            <span>Status</span>
            <select
              className="select select-bordered"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">All statuses</option>
              {statusOptions.map((option) => (
                <option key={`status-${option}`} value={option}>
                  {formatStatus(option)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Position</span>
            <select
              className="select select-bordered"
              value={positionFilter}
              onChange={(event) => setPositionFilter(event.target.value)}
              disabled={positionsLoading}
            >
              <option value="">All positions</option>
              {positions.map((position) => (
                <option key={position.id} value={position.title}>
                  {position.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>From</span>
            <input
              className="input input-bordered"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </label>
          <label>
            <span>To</span>
            <input
              className="input input-bordered"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </label>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              setSearchTerm('')
              setStatusFilter('')
              setPositionFilter('')
              setStartDate('')
              setEndDate('')
            }}
          >
            Clear filters
          </button>
        </div>

        {error ? <div className="admin-alert error">{error}</div> : null}

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>
                  <button type="button" className="admin-th-sort" onClick={() => handleSort('last_name')}>
                    Name {sort === 'last_name' ? (direction === 'asc' ? '▲' : '▼') : <span className="sort-icon">↕</span>}
                  </button>
                </th>
                <th>Position</th>
                <th>
                  <button type="button" className="admin-th-sort" onClick={() => handleSort('status')}>
                    Status {sort === 'status' ? (direction === 'asc' ? '▲' : '▼') : <span className="sort-icon">↕</span>}
                  </button>
                </th>
                <th>Email</th>
                <th>Contact</th>
                <th>
                  <button type="button" className="admin-th-sort" onClick={() => handleSort('created_at')}>
                    Submitted {sort === 'created_at' ? (direction === 'asc' ? '▲' : '▼') : <span className="sort-icon">↕</span>}
                  </button>
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="admin-table-empty">Loading applicants...</td>
                </tr>
              ) : applicants.length ? (
                applicants.map((applicant) => (
                  <tr key={applicant.id}>
                    <td>
                      <div className="admin-table-name">
                        <strong>
                          {applicant.first_name} {applicant.last_name}
                        </strong>
                      </div>
                    </td>
                    <td>{applicant.position_applied_for}</td>
                    <td>
                      <span className={`admin-chip ${applicant.status}`}>
                        {formatStatus(applicant.status)}
                      </span>
                    </td>
                    <td>{applicant.email_address}</td>
                    <td>{applicant.contact_number}</td>
                    <td>{new Date(applicant.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-xs btn-outline"
                        onClick={() => navigate(`/admin?applicant=${applicant.id}`)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="admin-table-empty">No applicants found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-table-footer">
          <span>
            Page {page} of {lastPage}
          </span>
          <div className="admin-table-actions">
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => setPage((previous) => Math.max(1, previous - 1))}
              disabled={page <= 1}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => setPage((previous) => Math.min(lastPage, previous + 1))}
              disabled={page >= lastPage}
            >
              Next
            </button>
          </div>
        </div>
      </div>
      </div>
    </section>
  )
}

export default AdminApplicantsPage
