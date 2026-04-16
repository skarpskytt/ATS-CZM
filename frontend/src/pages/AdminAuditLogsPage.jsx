import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import AdminLayout from '../components/AdminLayout'
import { apiBase } from '../utils/apiBase'

const ACTION_META = {
  login:         { label: 'Login',         cls: 'audit-badge-login',   icon: '🔑' },
  logout:        { label: 'Logout',        cls: 'audit-badge-logout',  icon: '🚪' },
  create:        { label: 'Create',        cls: 'audit-badge-create',  icon: '✚' },
  update:        { label: 'Update',        cls: 'audit-badge-update',  icon: '✎' },
  delete:        { label: 'Delete',        cls: 'audit-badge-delete',  icon: '✕' },
  status_change: { label: 'Status Change', cls: 'audit-badge-status',  icon: '↻' },
}

const ENTITY_ICON = {
  applicant: (
    <svg viewBox="0 0 20 20" fill="currentColor" width="11" height="11">
      <path d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-7 9a7 7 0 1 1 14 0H3z"/>
    </svg>
  ),
  position: (
    <svg viewBox="0 0 20 20" fill="currentColor" width="11" height="11">
      <path fillRule="evenodd" d="M6 3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1h2a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2V3zm2 1v1h4V4H8zm-4 3v9h12V7H4zm2 2h8v1.5H6V9zm0 3h5v1.5H6V12z" clipRule="evenodd"/>
    </svg>
  ),
  user: (
    <svg viewBox="0 0 20 20" fill="currentColor" width="11" height="11">
      <path fillRule="evenodd" d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-7 9a7 7 0 1 1 14 0H3z" clipRule="evenodd"/>
    </svg>
  ),
  session: (
    <svg viewBox="0 0 20 20" fill="currentColor" width="11" height="11">
      <path fillRule="evenodd" d="M18 8a6 6 0 0 1-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1 1 18 8zm-6-4a1 1 0 1 0 0 2 2 2 0 0 1 2 2 1 1 0 1 0 2 0 4 4 0 0 0-4-4z" clipRule="evenodd"/>
    </svg>
  ),
}
const ENTITY_LABEL = { applicant: 'Applicant', position: 'Position', user: 'User', session: 'Session' }

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (diff < 60)    return `${diff}s ago`
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

// Build page number array with ellipsis: e.g. [1, '…', 4, 5, 6, '…', 12]
function buildPageButtons(current, last) {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1)
  const pages = new Set([1, last, current, current - 1, current + 1].filter(p => p >= 1 && p <= last))
  const sorted = [...pages].sort((a, b) => a - b)
  const result = []
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('…')
    result.push(sorted[i])
  }
  return result
}

const emptyFilters = { action: '', entity: '', user_name: '', start_date: '', end_date: '' }
const PER_PAGE_OPTIONS = [20, 30, 50, 100]

export default function AdminAuditLogsPage() {
  const { token } = useAuth()

  const [logs, setLogs]       = useState([])
  const [meta, setMeta]       = useState({ current_page: 1, last_page: 1, total: 0 })
  const [filters, setFilters] = useState(emptyFilters)
  const [applied, setApplied] = useState(emptyFilters)
  const [page, setPage]       = useState(1)
  const [perPage, setPerPage] = useState(30)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const load = useCallback((f, p, pp) => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams({ page: p, per_page: pp })
    Object.entries(f).forEach(([k, v]) => { if (v) params.set(k, v) })
    fetch(`${apiBase}/api/audit-logs?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        setLogs(data.data || [])
        setMeta({ current_page: data.current_page, last_page: data.last_page, total: data.total })
      })
      .catch(() => setError('Failed to load audit logs.'))
      .finally(() => setLoading(false))
  }, [token])

  useEffect(() => {
    load(applied, page, perPage)
  }, [load, applied, page, perPage])

  function handleFilter(e) {
    setFilters(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  function applyFilters(e) {
    e.preventDefault()
    setPage(1)
    setApplied({ ...filters })
  }

  function clearFilters() {
    setFilters(emptyFilters)
    setApplied(emptyFilters)
    setPage(1)
  }

  function goToPage(p) {
    if (p < 1 || p > meta.last_page) return
    setPage(p)
  }

  const hasFilter   = Object.values(applied).some(v => v)
  const activeCount = Object.values(applied).filter(v => v).length
  const todayLabel  = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const firstItem   = meta.total === 0 ? 0 : (meta.current_page - 1) * perPage + 1
  const lastItem    = Math.min(meta.current_page * perPage, meta.total)
  const pageButtons = buildPageButtons(meta.current_page, meta.last_page)

  return (
    <AdminLayout pageTitle="Audit Logs">

      {/* ── Page header ── */}
      <div className="admin-welcome">
        <div className="admin-welcome-text">
          <h2>
            Audit Logs
            <span className="audit-head-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </span>
          </h2>
          <p>Complete record of all system actions — logins, changes, and deletions.</p>
        </div>
        <span className="admin-welcome-date">{todayLabel}</span>
      </div>

      {/* ── Action legend chips ── */}
      <div className="audit-legend">
        {Object.entries(ACTION_META).map(([key, val]) => (
          <button
            key={key}
            type="button"
            className={`audit-legend-chip audit-badge ${val.cls}${applied.action === key ? ' audit-legend-chip--active' : ''}`}
            onClick={() => {
              const next = applied.action === key ? '' : key
              const newF = { ...filters, action: next }
              setFilters(newF)
              setPage(1)
              setApplied({ ...newF })
            }}
          >
            <span className="audit-legend-icon">{val.icon}</span>
            {val.label}
          </button>
        ))}
        {hasFilter && (
          <button type="button" className="audit-legend-clear" onClick={clearFilters}>
            Clear {activeCount} filter{activeCount !== 1 ? 's' : ''} ✕
          </button>
        )}
      </div>

      {/* ── Main card ── */}
      <div className="admin-card">

        {/* Card header */}
        <div className="admin-card-head">
          <div>
            <h2>Activity log</h2>
            <p>
              {meta.total > 0
                ? `Showing ${firstItem}–${lastItem} of ${meta.total.toLocaleString()} entr${meta.total !== 1 ? 'ies' : 'y'}`
                : 'No log entries found'}
            </p>
          </div>
          <div className="audit-head-right">
            <label className="audit-perpage-label">
              Rows
              <select
                className="select select-bordered select-sm audit-perpage-select"
                value={perPage}
                onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }}
              >
                {PER_PAGE_OPTIONS.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Filters */}
        <form className="admin-table-filters" onSubmit={applyFilters}>
          <label>
            <span>Action</span>
            <select name="action" value={filters.action} onChange={handleFilter} className="select select-bordered">
              <option value="">All actions</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="status_change">Status Change</option>
            </select>
          </label>
          <label>
            <span>Entity</span>
            <select name="entity" value={filters.entity} onChange={handleFilter} className="select select-bordered">
              <option value="">All entities</option>
              <option value="applicant">Applicant</option>
              <option value="position">Position</option>
              <option value="user">User</option>
              <option value="session">Session</option>
            </select>
          </label>
          <label style={{ flex: '1 1 160px' }}>
            <span>User</span>
            <input
              name="user_name"
              value={filters.user_name}
              onChange={handleFilter}
              placeholder="Filter by name…"
              className="input input-bordered"
            />
          </label>
          <label>
            <span>From</span>
            <input type="date" name="start_date" value={filters.start_date} onChange={handleFilter} className="input input-bordered" />
          </label>
          <label>
            <span>To</span>
            <input type="date" name="end_date" value={filters.end_date} onChange={handleFilter} className="input input-bordered" />
          </label>
          <button type="submit" className="audit-search-btn">
            <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
              <path fillRule="evenodd" d="M8 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM2 8a6 6 0 1 1 10.89 3.476l4.817 4.817a1 1 0 0 1-1.414 1.414l-4.816-4.816A6 6 0 0 1 2 8z" clipRule="evenodd"/>
            </svg>
            Search
          </button>
        </form>

        {error && <div className="admin-alert error">{error}</div>}

        {/* Table */}
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Description</th>
                <th className="audit-col-ip">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={`skel-${i}`} style={{ opacity: 1 - i * 0.1 }}>
                    {[100, 120, 80, 110, 260, 90].map((w, j) => (
                      <td key={j}>
                        <div style={{
                          height: '13px', borderRadius: '5px', width: `${w}px`,
                          background: 'linear-gradient(90deg,rgba(15,61,46,.05) 25%,rgba(15,61,46,.11) 50%,rgba(15,61,46,.05) 75%)',
                          backgroundSize: '800px 100%',
                          animation: 'shimmer 1.4s ease-in-out infinite',
                          animationDelay: `${i * 0.07}s`,
                        }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="admin-empty-state">
                      <div className="admin-empty-icon">📋</div>
                      <p>No log entries found</p>
                      <span>System activity will appear here once actions are performed.</span>
                    </div>
                  </td>
                </tr>
              ) : logs.map(log => {
                const action      = ACTION_META[log.action] || { label: log.action, cls: 'audit-badge-default', icon: '•' }
                const entityLabel = ENTITY_LABEL[log.entity] || log.entity
                const entityIcon  = ENTITY_ICON[log.entity]  || null
                return (
                  <tr key={log.id} className="audit-row">
                    <td className="audit-cell-time">
                      <span className="audit-time-primary">{timeAgo(log.created_at)}</span>
                      <span className="audit-time-secondary">{formatDate(log.created_at)}</span>
                    </td>
                    <td>
                      <div className="audit-user-wrap">
                        <span className="audit-avatar">{(log.user_name || 'S').slice(0, 1).toUpperCase()}</span>
                        <span className="audit-user-name">{log.user_name}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`audit-badge ${action.cls}`}>
                        <span className="audit-badge-icon">{action.icon}</span>
                        {action.label}
                      </span>
                    </td>
                    <td>
                      <div className="audit-entity-wrap">
                        <span className="audit-entity-chip">
                          {entityIcon}
                          {entityLabel}
                        </span>
                        {log.entity_label && (
                          <span className="audit-entity-sub">{log.entity_label}</span>
                        )}
                      </div>
                    </td>
                    <td className="audit-desc">{log.description}</td>
                    <td className="audit-col-ip audit-ip">{log.ip_address || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <div className="audit-pagination-bar">
          <span className="audit-pagination-info">
            {meta.total > 0
              ? `${firstItem}–${lastItem} of ${meta.total.toLocaleString()}`
              : '0 results'}
          </span>

          <div className="audit-pagination-controls">
            {/* First */}
            <button
              type="button"
              className="audit-pg-btn"
              disabled={page <= 1}
              onClick={() => goToPage(1)}
              title="First page"
            >
              «
            </button>

            {/* Prev */}
            <button
              type="button"
              className="audit-pg-btn"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
              title="Previous page"
            >
              ‹
            </button>

            {/* Page numbers */}
            {pageButtons.map((p, i) =>
              p === '…' ? (
                <span key={`ellipsis-${i}`} className="audit-pg-ellipsis">…</span>
              ) : (
                <button
                  key={p}
                  type="button"
                  className={`audit-pg-btn${p === meta.current_page ? ' audit-pg-btn--active' : ''}`}
                  onClick={() => goToPage(p)}
                >
                  {p}
                </button>
              )
            )}

            {/* Next */}
            <button
              type="button"
              className="audit-pg-btn"
              disabled={page >= meta.last_page}
              onClick={() => goToPage(page + 1)}
              title="Next page"
            >
              ›
            </button>

            {/* Last */}
            <button
              type="button"
              className="audit-pg-btn"
              disabled={page >= meta.last_page}
              onClick={() => goToPage(meta.last_page)}
              title="Last page"
            >
              »
            </button>
          </div>
        </div>

      </div>
    </AdminLayout>
  )
}

