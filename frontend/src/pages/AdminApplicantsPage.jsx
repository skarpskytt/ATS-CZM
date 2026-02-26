import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AdminLayout from '../components/AdminLayout'

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

const formatStatus = (value) =>
  value.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

const getInitials = (first, last) =>
  `${first?.slice(0, 1) ?? ''}${last?.slice(0, 1) ?? ''}`.toUpperCase()

function AdminApplicantsPage() {
  const navigate = useNavigate()
  const { token, user } = useAuth()

  const [applicants, setApplicants]       = useState([])
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState(null)
  const [searchTerm, setSearchTerm]       = useState('')
  const [statusFilter, setStatusFilter]   = useState('')
  const [positionFilter, setPositionFilter] = useState('')
  const [startDate, setStartDate]         = useState('')
  const [endDate, setEndDate]             = useState('')
  const [page, setPage]                   = useState(1)
  const [lastPage, setLastPage]           = useState(1)
  const [total, setTotal]                 = useState(0)
  const [positions, setPositions]         = useState([])
  const [sort, setSort]                   = useState('created_at')
  const [direction, setDirection]         = useState('desc')
  const [updatingId, setUpdatingId]       = useState(null)

  const activeFilterCount = [searchTerm, statusFilter, positionFilter, startDate, endDate].filter(Boolean).length

  const handleSort = (field) => {
    if (sort === field) {
      setDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSort(field)
      setDirection('asc')
    }
    setPage(1)
  }

  const loadPositions = async (activeToken) => {
    try {
      const response = await fetch(`${apiBase}/api/positions`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      })
      if (!response.ok) return
      const payload = await response.json()
      setPositions(payload.data || [])
    } catch (_) {}
  }

  const loadApplicants = async (activeToken, filters = {}) => {
    setLoading(true)
    setError(null)
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== '')
      )
      const params = new URLSearchParams(cleanFilters)
      const response = await fetch(`${apiBase}/api/applicants?${params.toString()}`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      })
      if (!response.ok) throw new Error()
      const payload = await response.json()
      setApplicants(payload.data || [])
      setPage(payload.meta?.current_page ?? payload.current_page ?? 1)
      setLastPage(payload.meta?.last_page ?? payload.last_page ?? 1)
      setTotal(payload.meta?.total ?? payload.total ?? 0)
    } catch (_) {
      setError('Unable to load applicants.')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (applicantId, newStatus, event) => {
    event.stopPropagation()
    setUpdatingId(applicantId)
    try {
      const response = await fetch(`${apiBase}/api/applicants/${applicantId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!response.ok) throw new Error()
      setApplicants((prev) =>
        prev.map((a) => (a.id === applicantId ? { ...a, status: newStatus } : a))
      )
    } catch (_) {
      setError('Failed to update status.')
    } finally {
      setUpdatingId(null)
    }
  }

  const exportPDF = () => {
    const win = window.open('', '_blank')
    const rows = applicants.map((a) => `
      <tr>
        <td>${a.first_name} ${a.last_name}</td>
        <td>${a.email_address}</td>
        <td>${a.contact_number ?? ''}</td>
        <td>${a.position_applied_for ?? ''}</td>
        <td>${formatStatus(a.status)}</td>
        <td>${new Date(a.created_at).toLocaleDateString()}</td>
      </tr>`).join('')
    win.document.write(`<!DOCTYPE html><html><head><title>Applicants – Page ${page}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 2rem; color: #111; }
        h2 { margin-bottom: 0.25rem; }
        p { margin-bottom: 1.5rem; color: #555; font-size: 0.85rem; }
        table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
        th { text-align: left; padding: 0.5rem 0.75rem; border-bottom: 2px solid #0f3d2e; color: #0f3d2e; }
        td { padding: 0.5rem 0.75rem; border-bottom: 1px solid #ddd; }
        tr:nth-child(even) td { background: #f9f9f9; }
        @media print { body { padding: 0; } }
      </style></head><body>
      <h2>Applicants</h2>
      <p>Page ${page} of ${lastPage} &nbsp;·&nbsp; ${total} total &nbsp;·&nbsp; Exported ${new Date().toLocaleString()}</p>
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>Contact</th><th>Position</th><th>Status</th><th>Submitted</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <script>window.onload = () => { window.print(); }<\/script>
      </body></html>`)
    win.document.close()
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('')
    setPositionFilter('')
    setStartDate('')
    setEndDate('')
  }

  useEffect(() => {
    if (!token) return
    loadPositions(token)
  }, [token])

  useEffect(() => {
    setPage(1)
  }, [searchTerm, statusFilter, positionFilter, startDate, endDate])

  useEffect(() => {
    if (!token) return
    const timer = setTimeout(() => {
      loadApplicants(token, {
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        position: positionFilter || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        sort,
        direction,
        page,
      })
    }, 300)
    return () => clearTimeout(timer)
  }, [token, searchTerm, statusFilter, positionFilter, startDate, endDate, sort, direction, page])

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const firstItem = total === 0 ? 0 : (page - 1) * 20 + 1
  const lastItem  = Math.min(page * 20, total)

  return (
    <AdminLayout pageTitle="Applicants">
      <div className="admin-welcome">
        <div className="admin-welcome-text">
          <h2>{getGreeting()}, {user?.name?.split(' ')[0] || 'there'} 👋</h2>
          <p>You have <strong>{total}</strong> applicant{total !== 1 ? 's' : ''} in the system.</p>
        </div>
        <span className="admin-welcome-date">{todayLabel}</span>
      </div>

      <div className="admin-card">
        <div className="admin-card-head">
          <div>
            <h2>All applicants</h2>
            <p>
              {total > 0
                ? `Showing ${firstItem}–${lastItem} of ${total} applicant${total !== 1 ? 's' : ''}`
                : 'No applicants found'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            {activeFilterCount > 0 && (
              <button type="button" className="btn btn-sm btn-ghost" onClick={clearFilters}>
                Clear {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''}  ✕
              </button>
            )}
            <button type="button" className="btn btn-outline btn-sm" onClick={exportPDF} disabled={!applicants.length}>
              ↓ Export PDF
            </button>
          </div>
        </div>

        <div className="admin-table-filters">
          <label>
            <span>Search</span>
            <input
              className="input input-bordered"
              type="search"
              placeholder="Name, email, position"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </label>
          <label>
            <span>Status</span>
            <select className="select select-bordered" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All statuses</option>
              {statusOptions.map((o) => <option key={o} value={o}>{formatStatus(o)}</option>)}
            </select>
          </label>
          <label>
            <span>Position</span>
            <select className="select select-bordered" value={positionFilter} onChange={(e) => setPositionFilter(e.target.value)}>
              <option value="">All positions</option>
              {positions.map((p) => <option key={p.id} value={p.title}>{p.title}</option>)}
            </select>
          </label>
          <label>
            <span>From</span>
            <input className="input input-bordered" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>
          <label>
            <span>To</span>
            <input className="input input-bordered" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </label>
        </div>

        {error ? <div className="admin-alert error">{error}</div> : null}

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
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
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={`skel-${i}`} style={{ opacity: 1 - i * 0.08 }}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j}>
                        <div style={{
                          height: '14px', borderRadius: '6px',
                          background: 'linear-gradient(90deg, rgba(200,164,65,0.08) 25%, rgba(200,164,65,0.18) 50%, rgba(200,164,65,0.08) 75%)',
                          backgroundSize: '800px 100%',
                          animation: 'shimmer 1.4s ease-in-out infinite',
                          animationDelay: `${i * 0.07}s`,
                          width: j === 0 ? '32px' : j === 1 ? '120px' : '80px',
                        }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : applicants.length ? (
                applicants.map((applicant) => (
                  <tr
                    key={applicant.id}
                    className="admin-table-row-clickable"
                    onClick={() => navigate(`/admin?applicant=${applicant.id}`)}
                  >
                    <td>
                      <div className="admin-table-avatar">
                        {getInitials(applicant.first_name, applicant.last_name)}
                      </div>
                    </td>
                    <td>
                      <div className="admin-table-name">
                        <strong>{applicant.first_name} {applicant.last_name}</strong>
                        <span className="admin-table-email">{applicant.email_address}</span>
                      </div>
                    </td>
                    <td>{applicant.position_applied_for}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <select
                        className={`admin-status-select admin-chip ${applicant.status}`}
                        value={applicant.status}
                        disabled={updatingId === applicant.id}
                        onChange={(e) => handleStatusChange(applicant.id, e.target.value, e)}
                      >
                        {statusOptions.map((o) => <option key={o} value={o}>{formatStatus(o)}</option>)}
                      </select>
                    </td>
                    <td>{applicant.email_address}</td>
                    <td>{applicant.contact_number}</td>
                    <td>{new Date(applicant.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7}>
                    <div className="admin-empty-state">
                      <div className="admin-empty-icon">🔍</div>
                      <p>No applicants found</p>
                      <span>Try adjusting your filters or search term.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-table-footer">
          <span>{total > 0 ? `${firstItem}–${lastItem} of ${total}` : '0 results'}</span>
          <div className="admin-table-actions">
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              ← Previous
            </button>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              Page {page} of {lastPage}
            </span>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              disabled={page >= lastPage}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminApplicantsPage

