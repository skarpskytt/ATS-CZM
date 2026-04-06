
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../context/AuthContext'
import AdminLayout from '../components/AdminLayout'
import { apiBase } from '../utils/apiBase'


const emptyForm = {
  title: '',
  description: '',
  location: '',
  salary_min: '',
  salary_max: '',
  is_active: true,
}


function AdminPositionsPage() {
  const { token } = useAuth()

  const [positions, setPositions]   = useState([])
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)
  const [page, setPage]             = useState(1)
  const [lastPage, setLastPage]     = useState(1)
  const [total, setTotal]           = useState(0)

  // Modal state
  const [modalOpen, setModalOpen]   = useState(false)
  const [editing, setEditing]       = useState(null) // null = adding new
  const [form, setForm]             = useState(emptyForm)
  const [saving, setSaving]         = useState(false)
  const [formError, setFormError]   = useState(null)

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]         = useState(false)

  // Toggle loading
  const [togglingId, setTogglingId] = useState(null)

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState([])
  const toggleSelect = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }
  const toggleSelectAll = () => {
    if (selectedIds.length === positions.length && positions.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(positions.map((p) => p.id))
    }
  }
  const clearSelection = () => setSelectedIds([])

  // Bulk delete
  const handleBulkDelete = async () => {
    if (!selectedIds.length) return
    if (!window.confirm(`Delete ${selectedIds.length} selected position(s)?`)) return
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/api/positions/bulk`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedIds }),
      })
      if (!res.ok) throw new Error()
      setPositions((prev) => prev.filter((p) => !selectedIds.includes(p.id)))
      setTotal((t) => t - selectedIds.length)
      setSelectedIds([])
    } catch {
      setError('Failed to delete selected positions.')
    } finally {
      setLoading(false)
    }
  }

  // Modal refs for auto-scroll
  const addEditModalRef = useRef(null)
  const deleteModalRef = useRef(null)

  // Auto-scroll to modal when it opens
  useEffect(() => {
    if (modalOpen && addEditModalRef.current) {
      addEditModalRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [modalOpen])

  useEffect(() => {
    if (deleteTarget && deleteModalRef.current) {
      deleteModalRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [deleteTarget])

  const loadPositions = async (p = 1) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${apiBase}/api/positions/admin?page=${p}&per_page=20`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      const payload = await res.json()
      setPositions(payload.data || [])
      setPage(payload.meta?.current_page ?? payload.current_page ?? 1)
      setLastPage(payload.meta?.last_page ?? payload.last_page ?? 1)
      setTotal(payload.meta?.total ?? payload.total ?? 0)
    } catch {
      setError('Failed to load positions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token) return
    loadPositions(page)
  }, [token, page])

  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormError(null)
    setModalOpen(true)
  }

  const openEdit = (position) => {
    setEditing(position)
    setForm({
      title: position.title ?? '',
      description: position.description ?? '',
      location: position.location ?? '',
      salary_min: position.salary_min ?? '',
      salary_max: position.salary_max ?? '',
      is_active: position.is_active ?? true,
    })
    setFormError(null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    setForm(emptyForm)
    setFormError(null)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    try {
      const body = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        location: form.location.trim(),
        salary_min: form.salary_min !== '' ? Number(form.salary_min) : null,
        salary_max: form.salary_max !== '' ? Number(form.salary_max) : null,
        is_active: form.is_active,
      }
      const url    = editing ? `${apiBase}/api/positions/${editing.id}` : `${apiBase}/api/positions`
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        const msg = payload?.message || Object.values(payload?.errors || {})?.[0]?.[0] || 'Failed to save.'
        setFormError(msg)
        return
      }
      const saved = await res.json()
      if (editing) {
        setPositions((prev) => prev.map((p) => (p.id === saved.id ? saved : p)))
      } else {
        setPositions((prev) => [saved, ...prev])
        setTotal((t) => t + 1)
      }
      closeModal()
    } catch {
      setFormError('An unexpected error occurred.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (position) => {
    setTogglingId(position.id)
    try {
      const res = await fetch(`${apiBase}/api/positions/${position.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !position.is_active }),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setPositions((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    } catch {
      setError('Failed to toggle status.')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`${apiBase}/api/positions/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      setPositions((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      setTotal((t) => t - 1)
      setDeleteTarget(null)
    } catch {
      setError('Failed to delete position.')
    } finally {
      setDeleting(false)
    }
  }

  const formatSalary = (min, max) => {
    if (!min && !max) return '—'
    const fmt = (n) => `₱${Number(n).toLocaleString()}`
    if (min && max) return `${fmt(min)} – ${fmt(max)}`
    if (min) return `From ${fmt(min)}`
    return `Up to ${fmt(max)}`
  }

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <AdminLayout pageTitle="Positions">

      {/* ── Welcome ── */}
      <div className="admin-welcome">
        <div className="admin-welcome-text">
          <h2>Positions 📋</h2>
          <p>Manage job openings shown on the application form. Only <strong>active</strong> positions appear to applicants.</p>
        </div>
        <span className="admin-welcome-date">{todayLabel}</span>


      {/* ── Main card ── */}
      <div className="admin-card" style={{ width: '100%' }}>
        <div className="admin-card-head">
          <div>
            <h2>All positions</h2>
            <p>{total} position{total !== 1 ? 's' : ''} total</p>
          </div>
          <button type="button" className="pos-add-btn" onClick={openAdd}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add position
          </button>
        </div>

        {error && <div className="admin-alert error">{error}</div>}

        <div className="admin-table-wrap" style={{ width: '100%', padding: 0, margin: 0 }}>
          <table className="admin-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '36px' }}>
                  <input
                    type="checkbox"
                    className="bulk-checkbox"
                    checked={positions.length > 0 && selectedIds.length === positions.length}
                    ref={(el) => { if (el) el.indeterminate = selectedIds.length > 0 && selectedIds.length < positions.length }}
                    onChange={toggleSelectAll}
                    title="Select all on this page"
                  />
                </th>
                <th>Title</th>
                <th className="pos-col-location">Location</th>
                <th className="pos-col-salary">Salary Range</th>
                <th>Status</th>
                <th style={{ width: '110px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`skel-${i}`} style={{ opacity: 1 - i * 0.12 }}>
                    {[140, 100, 120, 60, 120].map((w, j) => (
                      <td key={j}>
                        <div style={{
                          height: '14px', borderRadius: '6px', width: `${w}px`,
                          background: 'linear-gradient(90deg,rgba(200,164,65,.08) 25%,rgba(200,164,65,.18) 50%,rgba(200,164,65,.08) 75%)',
                          backgroundSize: '800px 100%',
                          animation: `shimmer 1.4s ease-in-out infinite`,
                          animationDelay: `${i * 0.07}s`,
                        }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : positions.length ? (
                positions.map((pos) => (
                  <tr key={pos.id}>
                    <td onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="bulk-checkbox"
                        checked={selectedIds.includes(pos.id)}
                        onChange={() => toggleSelect(pos.id)}
                        title="Select position"
                      />
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f2c20' }}>{pos.title}</div>
                      {pos.description && (
                        <div style={{ fontSize: '0.78rem', color: '#6b7870', marginTop: '2px', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {pos.description}
                        </div>
                      )}
                    </td>
                    <td className="pos-col-location">{pos.location}</td>
                    <td className="pos-col-salary">{formatSalary(pos.salary_min, pos.salary_max)}</td>
                    <td>
                      <button
                        type="button"
                        className={`pos-status-btn ${pos.is_active ? 'pos-active' : 'pos-inactive'}`}
                        disabled={togglingId === pos.id}
                        onClick={() => handleToggleActive(pos)}
                        title={pos.is_active ? 'Click to deactivate' : 'Click to activate'}
                      >
                        <span className="pos-status-dot" />
                        {togglingId === pos.id ? '…' : pos.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="tbl-edit-btn"
                          onClick={() => openEdit(pos)}
                          title="Edit position"
                          aria-label="Edit position"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button
                          type="button"
                          className="tbl-delete-btn"
                          onClick={() => setDeleteTarget(pos)}
                          title="Delete position"
                          aria-label="Delete position"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6}>
                    <div className="admin-empty-state">
                      <div className="admin-empty-icon">📋</div>
                      <p>No positions yet</p>
                      <span>Click "Add position" to create your first job opening.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>



        {/* Pagination */}
        {lastPage > 1 && (
          <div className="admin-table-footer">
            <span>{total} total</span>
            <div className="admin-table-actions">
              <button className="btn btn-sm btn-outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Previous</button>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Page {page} of {lastPage}</span>
              <button className="btn btn-sm btn-outline" disabled={page >= lastPage} onClick={() => setPage((p) => p + 1)}>Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      {modalOpen && createPortal(
        <div ref={addEditModalRef} className="pos-backdrop" onClick={closeModal}>
          <div className="pos-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pos-modal-head">
              <div className="pos-modal-head-icon">
                {editing ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
                )}
              </div>
              <div className="pos-modal-head-text">
                <h3>{editing ? 'Edit Position' : 'Add New Position'}</h3>
                <p>{editing ? 'Update the details for this job opening.' : 'Create a new job opening for applicants.'}</p>
              </div>
              <button type="button" className="pos-close" onClick={closeModal}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="pos-modal-body">
                {formError && <div className="pos-inline pos-inline-err" style={{ marginBottom:'1.25rem' }}>⚠ {formError}</div>}

                <div className="pos-field-row">
                  <div className="pos-field">
                    <label className="pos-label">Job Title <span className="pos-req">*</span></label>
                    <input
                      className="pos-input"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      required
                      placeholder="e.g. Software Engineer"
                      autoFocus
                    />
                  </div>
                  <div className="pos-field">
                    <label className="pos-label">Location <span className="pos-req">*</span></label>
                    <input
                      className="pos-input"
                      name="location"
                      value={form.location}
                      onChange={handleChange}
                      required
                      placeholder="e.g. Manila, Philippines"
                    />
                  </div>
                </div>

                <div className="pos-field">
                  <label className="pos-label">Description</label>
                  <textarea
                    className="pos-input"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Describe the role and responsibilities..."
                    rows={4}
                  />
                </div>

                <div className="pos-field-row">
                  <div className="pos-field">
                    <label className="pos-label">Minimum Salary (₱)</label>
                    <input
                      className="pos-input"
                      name="salary_min"
                      value={form.salary_min}
                      onChange={handleChange}
                      type="number"
                      min="0"
                      placeholder="30000"
                    />
                  </div>
                  <div className="pos-field">
                    <label className="pos-label">Maximum Salary (₱)</label>
                    <input
                      className="pos-input"
                      name="salary_max"
                      value={form.salary_max}
                      onChange={handleChange}
                      type="number"
                      min="0"
                      placeholder="50000"
                    />
                  </div>
                </div>

                <label className="pos-toggle-label">
                  <div className={`pos-toggle ${form.is_active ? 'pos-toggle-on' : ''}`}>
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={form.is_active}
                      onChange={handleChange}
                      style={{ display: 'none' }}
                    />
                    <span className="pos-track"><span className="pos-thumb" /></span>
                  </div>
                  <span style={{ fontWeight: 500, color: '#1f2937' }}>Active (visible to applicants)</span>
                </label>
              </div>

              <div className="pos-modal-foot">
                <button type="button" className="pos-ghost-btn" onClick={closeModal} disabled={saving}>Cancel</button>
                <button type="submit" className="pos-add-btn" disabled={saving}>
                  {saving ? (
                    <><span className="login-spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />Saving…</>
                  ) : (
                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>{editing ? 'Save Changes' : 'Create Position'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      , document.body)}


      {/* ── Delete Confirm Modal ── */}
      {deleteTarget && (
        <div ref={deleteModalRef} className="del-modal-backdrop" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="del-modal" onClick={(e) => e.stopPropagation()}>
            <div className="del-modal-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </div>
            <h3 className="del-modal-title">Delete position?</h3>
            <p className="del-modal-body">
              <strong>{deleteTarget.title}</strong> will be permanently removed. Existing applicants for this position will not be affected.
            </p>
            <div className="del-modal-actions">
              <button type="button" className="del-modal-cancel" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
              <button type="button" className="del-modal-confirm" onClick={handleDelete} disabled={deleting}>
                {deleting ? (
                  <><span className="login-spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />Deleting…</>
                ) : 'Delete position'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk action bar (portal) */}
      {selectedIds.length > 0 && createPortal(
        <div className="bulk-action-bar">
          <span className="bulk-action-count">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            {selectedIds.length} selected
          </span>
          <div className="bulk-action-btns">
            <button type="button" className="bulk-action-clear" onClick={clearSelection}>
              Deselect all
            </button>
            <button type="button" className="bulk-action-delete" onClick={handleBulkDelete}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              Delete {selectedIds.length} position{selectedIds.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>,
        document.body
      )}
    </AdminLayout>
  )
}

export default AdminPositionsPage
