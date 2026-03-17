import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useRole } from '../context/AuthContext'
import AdminLayout from '../components/AdminLayout'

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const statusOptions = [
  'new',
  'reviewed',
  'shortlisted',
  'interview_scheduled',
  'offer_extended',
  'hired',
  'rejected',
  'withdrawn',
]

const formatStatus = (value) => {
  return value.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

const SHORT_STATUS = {
  new:                  'New',
  reviewed:             'Reviewed',
  shortlisted:          'Shortlist',
  interview_scheduled:  'Interview',
  offer_extended:       'Offer',
  hired:                'Hired',
  rejected:             'Rejected',
  withdrawn:            'Withdrawn',
}
const shortStatus = (v) => SHORT_STATUS[v] ?? formatStatus(v)

const toName = (str) => str ? str.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : ''

const getInitials = (first, last) =>
  `${first?.slice(0, 1) ?? ''}${last?.slice(0, 1) ?? ''}`.toUpperCase()

const avatarPalettes = [
  { background: 'linear-gradient(135deg,#0f3d2e,#1a6644)', color: '#c8a441' },
  { background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', color: '#bfdbfe' },
  { background: 'linear-gradient(135deg,#7c2d12,#c2410c)', color: '#fed7aa' },
  { background: 'linear-gradient(135deg,#4a044e,#86198f)', color: '#f5d0fe' },
  { background: 'linear-gradient(135deg,#0f4c4c,#0d9488)', color: '#99f6e4' },
  { background: 'linear-gradient(135deg,#78350f,#d97706)', color: '#fef3c7' },
]
const getAvatarColor = (firstName = '', lastName = '') => {
  const str = `${firstName}${lastName}`
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) | 0
  return avatarPalettes[Math.abs(hash) % avatarPalettes.length]
}

const timeAgo = (dateStr) => {
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function AdminApplicantsPage() {
  const navigate = useNavigate()
  const { token, user } = useAuth()
  const { canEdit, canDelete } = useRole()

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
  const [perPage, setPerPage]             = useState(20)
  const [deleteTarget, setDeleteTarget]   = useState(null)   // { id, name }
  const [deleting, setDeleting]           = useState(false)
  const [selectedIds, setSelectedIds]     = useState([])
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkDeleting, setBulkDeleting]   = useState(false)
  const [openDropdownId, setOpenDropdownId] = useState(null)
  const [dropdownPos, setDropdownPos]       = useState({ top: 0, left: 0, above: false })

  // Advanced filters
  const [showAdvanced, setShowAdvanced]       = useState(false)
  const [genderFilter, setGenderFilter]       = useState('')
  const [educationFilter, setEducationFilter] = useState('')
  const [vacancyFilter, setVacancyFilter]     = useState('')
  const [locationFilter, setLocationFilter]   = useState('')
  const [salaryMin, setSalaryMin]             = useState('')
  const [salaryMax, setSalaryMax]             = useState('')
  const [experienceMin, setExperienceMin]     = useState('')
  const [experienceMax, setExperienceMax]     = useState('')

  const advancedFilterCount = [genderFilter, educationFilter, vacancyFilter, locationFilter, salaryMin, salaryMax, experienceMin, experienceMax].filter(Boolean).length
  const activeFilterCount = [searchTerm, statusFilter, positionFilter, startDate, endDate].filter(Boolean).length + advancedFilterCount

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
      const response = await fetch(`${apiBase}/api/positions/all`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      })
      if (!response.ok) return
      const payload = await response.json()
      setPositions(Array.isArray(payload) ? payload : (payload.data || []))
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

  useEffect(() => {
    if (!openDropdownId) return
    const close = () => setOpenDropdownId(null)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [openDropdownId])

  const toggleDropdown = (e, applicantId) => {
    e.stopPropagation()
    if (openDropdownId === applicantId) { setOpenDropdownId(null); return }
    const rect = e.currentTarget.getBoundingClientRect()
    const showAbove = rect.bottom + 340 > window.innerHeight
    setDropdownPos({
      top:    showAbove ? null : rect.bottom + 6,
      bottom: showAbove ? window.innerHeight - rect.top + 6 : null,
      left:   Math.min(rect.left, window.innerWidth - 210),
      above:  showAbove,
    })
    setOpenDropdownId(applicantId)
  }

  const handleStatusChange = async (applicantId, newStatus, event) => {
    event.stopPropagation()
    if (!canEdit) return
    setOpenDropdownId(null)
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

  const handleDelete = (applicant, e) => {
    e.stopPropagation()
    setDeleteTarget({ id: applicant.id, name: `${toName(applicant.first_name)} ${toName(applicant.last_name)}` })
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`${apiBase}/api/applicants/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      setApplicants((prev) => prev.filter((a) => a.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch {
      setError('Failed to delete applicant.')
    } finally {
      setDeleting(false)
    }
  }

  const toggleSelect = (id, e) => {
    e.stopPropagation()
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === applicants.length && applicants.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(applicants.map((a) => a.id))
    }
  }

  const confirmBulkDelete = async () => {
    if (!selectedIds.length) return
    setBulkDeleting(true)
    try {
      const res = await fetch(`${apiBase}/api/applicants`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedIds }),
      })
      if (!res.ok) throw new Error()
      setApplicants((prev) => prev.filter((a) => !selectedIds.includes(a.id)))
      setSelectedIds([])
      setShowBulkModal(false)
    } catch {
      setError('Failed to delete selected applicants.')
    } finally {
      setBulkDeleting(false)
    }
  }

  const exportPDF = () => {
    const win = window.open('', '_blank')
    const rows = applicants.map((a) => `
      <tr>
        <td>${toName(a.first_name)} ${toName(a.last_name)}</td>
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
    setGenderFilter('')
    setEducationFilter('')
    setVacancyFilter('')
    setLocationFilter('')
    setSalaryMin('')
    setSalaryMax('')
    setExperienceMin('')
    setExperienceMax('')
  }

  useEffect(() => {
    if (!token) return
    loadPositions(token)
  }, [token])

  useEffect(() => {
    setPage(1)
    setSelectedIds([])
  }, [searchTerm, statusFilter, positionFilter, startDate, endDate, genderFilter, educationFilter, vacancyFilter, locationFilter, salaryMin, salaryMax, experienceMin, experienceMax, perPage])

  useEffect(() => {
    if (!token) return
    const timer = setTimeout(() => {
      loadApplicants(token, {
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        position: positionFilter || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        gender: genderFilter || undefined,
        education: educationFilter || undefined,
        vacancy_source: vacancyFilter || undefined,
        location: locationFilter || undefined,
        salary_min: salaryMin || undefined,
        salary_max: salaryMax || undefined,
        experience_min: experienceMin || undefined,
        experience_max: experienceMax || undefined,
        sort,
        direction,
        page,
        per_page: perPage,
      })
    }, 300)
    return () => clearTimeout(timer)
  }, [token, searchTerm, statusFilter, positionFilter, startDate, endDate, genderFilter, educationFilter, vacancyFilter, locationFilter, salaryMin, salaryMax, experienceMin, experienceMax, sort, direction, page, perPage])

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const firstItem = total === 0 ? 0 : (page - 1) * perPage + 1
  const lastItem  = Math.min(page * perPage, total)

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
          <label style={{ flex: '2 1 200px' }}>
            <span>Search</span>
            <input
              className="input input-bordered"
              type="search"
              placeholder="Name, email, phone, position, address"
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
          <button
            type="button"
            className={`adv-filter-toggle ${showAdvanced ? 'active' : ''}`}
            onClick={() => setShowAdvanced((v) => !v)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/></svg>
            Filters{advancedFilterCount > 0 ? ` (${advancedFilterCount})` : ''}
            <span className={`adv-filter-chevron ${showAdvanced ? 'open' : ''}`}>▾</span>
          </button>
        </div>

        {/* ── Advanced filter panel ── */}
        {showAdvanced && (
          <div className="adv-filter-panel">
            <div className="adv-filter-grid">
              <label>
                <span>Gender</span>
                <select className="select select-bordered" value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
                  <option value="">Any</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </label>
              <label>
                <span>Education</span>
                <select className="select select-bordered" value={educationFilter} onChange={(e) => setEducationFilter(e.target.value)}>
                  <option value="">Any</option>
                  <option>Elementary</option>
                  <option>High School</option>
                  <option>Senior High</option>
                  <option>Vocational</option>
                  <option>College</option>
                  <option>Post Grad</option>
                </select>
              </label>
              <label>
                <span>Vacancy source</span>
                <select className="select select-bordered" value={vacancyFilter} onChange={(e) => setVacancyFilter(e.target.value)}>
                  <option value="">Any</option>
                  <option>JobStreet</option>
                  <option>LinkedIn</option>
                  <option>Indeed</option>
                  <option>Kalibrr</option>
                  <option>Facebook / Social Media</option>
                  <option>Company Website</option>
                  <option>Referral from Employee</option>
                  <option>Job Fair</option>
                  <option>Walk-in</option>
                  <option>Other</option>
                </select>
              </label>
              <label>
                <span>Work location</span>
                <input
                  className="input input-bordered"
                  type="text"
                  placeholder="e.g. Makati"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                />
              </label>
              <label>
                <span>Min salary (₱)</span>
                <input
                  className="input input-bordered"
                  type="number"
                  min="0"
                  placeholder="e.g. 20000"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                />
              </label>
              <label>
                <span>Max salary (₱)</span>
                <input
                  className="input input-bordered"
                  type="number"
                  min="0"
                  placeholder="e.g. 80000"
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(e.target.value)}
                />
              </label>
              <label>
                <span>Min experience (yrs)</span>
                <input
                  className="input input-bordered"
                  type="number"
                  min="0"
                  placeholder="e.g. 2"
                  value={experienceMin}
                  onChange={(e) => setExperienceMin(e.target.value)}
                />
              </label>
              <label>
                <span>Max experience (yrs)</span>
                <input
                  className="input input-bordered"
                  type="number"
                  min="0"
                  placeholder="e.g. 10"
                  value={experienceMax}
                  onChange={(e) => setExperienceMax(e.target.value)}
                />
              </label>
              <label>
                <span>Sort by</span>
                <select className="select select-bordered" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1) }}>
                  <option value="created_at">Date submitted</option>
                  <option value="last_name">Last name</option>
                  <option value="first_name">First name</option>
                  <option value="status">Status</option>
                  <option value="expected_salary">Expected salary</option>
                  <option value="total_work_experience_years">Experience</option>
                </select>
              </label>
              <label>
                <span>Order</span>
                <select className="select select-bordered" value={direction} onChange={(e) => { setDirection(e.target.value); setPage(1) }}>
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </label>
              <label>
                <span>Per page</span>
                <select className="select select-bordered" value={perPage} onChange={(e) => setPerPage(Number(e.target.value))}>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </label>
            </div>
            {advancedFilterCount > 0 && (
              <button type="button" className="adv-filter-clear" onClick={clearFilters}>
                Clear all filters ✕
              </button>
            )}
          </div>
        )}

        {error ? <div className="admin-alert error">{error}</div> : null}

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                {canDelete && (
                  <th style={{ width: '36px' }}>
                    <input
                      type="checkbox"
                      className="bulk-checkbox"
                      checked={applicants.length > 0 && selectedIds.length === applicants.length}
                      ref={(el) => { if (el) el.indeterminate = selectedIds.length > 0 && selectedIds.length < applicants.length }}
                      onChange={toggleSelectAll}
                      title="Select all on this page"
                    />
                  </th>
                )}
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
                <th className="col-email">Email</th>
                <th className="col-contact">Contact</th>
                <th>
                  <button type="button" className="admin-th-sort" onClick={() => handleSort('created_at')}>
                    Submitted {sort === 'created_at' ? (direction === 'asc' ? '▲' : '▼') : <span className="sort-icon">↕</span>}
                  </button>
                </th>
                {canDelete && <th>Actions</th>}
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
                    className={`admin-table-row-clickable${selectedIds.includes(applicant.id) ? ' row-selected' : ''}`}
                    onClick={() => navigate(`/admin?applicant=${applicant.id}`)}
                  >
                    {canDelete && (
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="bulk-checkbox"
                          checked={selectedIds.includes(applicant.id)}
                          onChange={(e) => toggleSelect(applicant.id, e)}
                        />
                      </td>
                    )}
                    <td>
                      <div className="admin-table-avatar" style={getAvatarColor(applicant.first_name, applicant.last_name)}>
                        {getInitials(applicant.first_name, applicant.last_name)}
                      </div>
                    </td>
                    <td>
                      <div className="admin-table-name">
                        <strong>{toName(applicant.first_name)} {toName(applicant.last_name)}</strong>
                        <span className="admin-table-email">{applicant.email_address}</span>
                      </div>
                    </td>
                    <td>{applicant.position_applied_for}</td>
                    <td onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
                      <button
                        type="button"
                        className={`status-chip-wrap status-${applicant.status}${updatingId === applicant.id ? ' status-chip-saving' : ''}${!canEdit ? ' status-chip-readonly' : ''}${openDropdownId === applicant.id ? ' status-chip-open' : ''}`}
                        onClick={(e) => canEdit && !updatingId && toggleDropdown(e, applicant.id)}
                        disabled={!canEdit || !!updatingId}
                      >
                        {updatingId === applicant.id ? (
                          <><span className="status-spinner" /><span className="status-chip-saving-label">Saving…</span></>
                        ) : (
                          <>
                            <span className="status-dot" />
                            <span>{shortStatus(applicant.status)}</span>
                            {canEdit && <svg className={`status-chip-chevron${openDropdownId === applicant.id ? ' open' : ''}`} width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>}
                          </>
                        )}
                      </button>
                    </td>
                    <td className="col-email">{applicant.email_address}</td>
                    <td className="col-contact">{applicant.contact_number}</td>
                    <td title={new Date(applicant.created_at).toLocaleString()}>{timeAgo(applicant.created_at)}</td>
                    {canDelete && (
                      <td onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="tbl-delete-btn"
                          onClick={(e) => handleDelete(applicant, e)}
                          title="Delete applicant"
                          aria-label="Delete applicant"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={canDelete ? 9 : 8}>
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
      {/* ── Status dropdown (rendered outside table to avoid overflow clipping) ── */}
      {openDropdownId && (() => {
        const activeApplicant = applicants.find((a) => a.id === openDropdownId)
        if (!activeApplicant) return null
        return (
          <div
            className={`status-dropdown${dropdownPos.above ? ' above' : ''}`}
            style={{
              top:    dropdownPos.top    != null ? dropdownPos.top    : 'auto',
              bottom: dropdownPos.bottom != null ? dropdownPos.bottom : 'auto',
              left:   dropdownPos.left,
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="status-dropdown-header">Set status</div>
            {statusOptions.map((o) => (
              <button
                key={o}
                type="button"
                className={`status-dropdown-option status-dd-${o}${activeApplicant.status === o ? ' active' : ''}`}
                onClick={(e) => { e.stopPropagation(); handleStatusChange(activeApplicant.id, o, e) }}
              >
                <span className="status-dropdown-dot" />
                <span>{formatStatus(o)}</span>
                {activeApplicant.status === o && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto', flexShrink: 0, opacity: 0.7 }}><polyline points="20 6 9 17 4 12"/></svg>
                )}
              </button>
            ))}
          </div>
        )
      })()}
      {/* ── Bulk action bar ── */}
      {canDelete && selectedIds.length > 0 && (
        <div className="bulk-action-bar">
          <span className="bulk-action-count">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            {selectedIds.length} selected
          </span>
          <div className="bulk-action-btns">
            <button type="button" className="bulk-action-clear" onClick={() => setSelectedIds([])}>
              Deselect all
            </button>
            <button type="button" className="bulk-action-delete" onClick={() => setShowBulkModal(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              Delete {selectedIds.length} applicant{selectedIds.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}
      {/* ── Delete confirmation modal ── */}
      {deleteTarget && (
        <div className="del-modal-backdrop" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="del-modal" onClick={(e) => e.stopPropagation()}>
            <div className="del-modal-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </div>
            <h3 className="del-modal-title">Delete applicant?</h3>
            <p className="del-modal-body">
              <strong>{deleteTarget.name}</strong> will be permanently removed from the system. This action cannot be undone.
            </p>
            <div className="del-modal-actions">
              <button
                type="button"
                className="del-modal-cancel"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="del-modal-confirm"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <><span className="login-spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />Deleting…</>
                ) : (
                  <>Delete applicant</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Bulk delete confirmation modal ── */}
      {showBulkModal && (
        <div className="del-modal-backdrop" onClick={() => !bulkDeleting && setShowBulkModal(false)}>
          <div className="del-modal" onClick={(e) => e.stopPropagation()}>
            <div className="del-modal-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </div>
            <h3 className="del-modal-title">Delete {selectedIds.length} applicant{selectedIds.length !== 1 ? 's' : ''}?</h3>
            <p className="del-modal-body">
              <strong>{selectedIds.length} applicant{selectedIds.length !== 1 ? 's' : ''}</strong> will be permanently removed from the system, including their CVs and notes. This cannot be undone.
            </p>
            <div className="del-modal-actions">
              <button
                type="button"
                className="del-modal-cancel"
                onClick={() => setShowBulkModal(false)}
                disabled={bulkDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="del-modal-confirm"
                onClick={confirmBulkDelete}
                disabled={bulkDeleting}
              >
                {bulkDeleting ? (
                  <><span className="login-spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />Deleting…</>
                ) : (
                  <>Delete {selectedIds.length} applicant{selectedIds.length !== 1 ? 's' : ''}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminApplicantsPage

