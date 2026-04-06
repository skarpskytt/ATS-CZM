import { useEffect, useRef, useState } from 'react'
import { NavLink, useSearchParams } from 'react-router-dom'
import { useAuth, useRole } from '../context/AuthContext'
import AdminLayout from '../components/AdminLayout'
import { apiBase } from '../utils/apiBase'
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
const pipelineStatusOptions = statusOptions.slice(0, 6)
const terminalStatusOptions = statusOptions.slice(6)

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
  const { token, user } = useAuth()
  const { canEdit, canDelete } = useRole()

  const [adminMessage, setAdminMessage] = useState(null)
  const [adminError, setAdminError] = useState(null)
  const [loadingApplicants, setLoadingApplicants] = useState(false)
  const [applicants, setApplicants] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [viewMode, setViewMode] = useState('active')
  const [notes, setNotes] = useState([])
  const [notesLoading, setNotesLoading] = useState(false)
  const [notesError, setNotesError] = useState(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [noteSaving, setNoteSaving] = useState(false)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)

  const [showResume, setShowResume]       = useState(false)
  const [resumeBlobUrl, setResumeBlobUrl] = useState(null)
  const [resumeLoading, setResumeLoading] = useState(false)
  const [resumeError, setResumeError]     = useState(null)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]         = useState(false)
  const [forceTarget, setForceTarget]   = useState(null)
  const [forcing, setForcing]           = useState(false)
  const [statusSaving, setStatusSaving] = useState(false)

  // Modal refs for auto-scroll
  const deleteModalRef = useRef(null)
  const forceModalRef = useRef(null)

  // Auto-scroll to modal when it opens
  useEffect(() => {
    if (deleteTarget && deleteModalRef.current) {
      deleteModalRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [deleteTarget])

  useEffect(() => {
    if (forceTarget && forceModalRef.current) {
      forceModalRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [forceTarget])

  const loadApplicants = async (activeToken, filters = {}, preferredId = null) => {
    setLoadingApplicants(true)
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== '')
      )
      const params = new URLSearchParams(cleanFilters)
      const queryString = params.toString()
      const response = await fetch(`${apiBase}/api/applicants${queryString ? `?${queryString}` : ''}`, {
        headers: { Authorization: `Bearer ${activeToken}` },
      })

      if (!response.ok) {
        throw new Error('Failed to load applicants')
      }

      const payload = await response.json()
      const data = payload.data || []
      setApplicants(data)
      setPage(payload.meta?.current_page ?? payload.current_page ?? 1)
      setLastPage(payload.meta?.last_page ?? payload.last_page ?? 1)
      setTotal(payload.meta?.total ?? payload.total ?? 0)
      setSelectedId((prev) => {
        if (preferredId !== null) return preferredId
        if (prev && data.some((a) => a.id === prev)) return prev
        return data[0]?.id || null
      })
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
      return
    }

    const urlApplicantId = searchParams.get('applicant') ? Number(searchParams.get('applicant')) : null
    loadApplicants(token, {
      per_page: 10,
      archived: viewMode === 'archived' ? 'only' : undefined,
    }, viewMode === 'active' ? urlApplicantId : null)
  }, [token, searchParams, viewMode])

  useEffect(() => {
    if (!token) {
      return
    }

    const timer = setTimeout(() => {
      loadApplicants(token, {
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        archived: viewMode === 'archived' ? 'only' : undefined,
        page,
        per_page: 10,
      })
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, statusFilter, viewMode, page, token])

  useEffect(() => {
    if (!token || !selectedId || viewMode === 'archived') {
      setNotes([])
      return
    }

    loadNotes(token, selectedId)

    // Reset resume viewer whenever a different applicant is selected
    setShowResume(false)
    setResumeError(null)
    if (resumeBlobUrl) {
      URL.revokeObjectURL(resumeBlobUrl)
      setResumeBlobUrl(null)
    }
  }, [token, selectedId, viewMode])

  useEffect(() => {
    if (!adminMessage) return
    const timer = setTimeout(() => setAdminMessage(null), 4000)
    return () => clearTimeout(timer)
  }, [adminMessage])

  useEffect(() => {
    if (!adminError) return
    const timer = setTimeout(() => setAdminError(null), 5000)
    return () => clearTimeout(timer)
  }, [adminError])

  const loadResumeBlobUrl = async () => {
    if (resumeBlobUrl) {
      setShowResume(true)
      return
    }
    setResumeLoading(true)
    setResumeError(null)
    try {
      const response = await fetch(`${apiBase}/api/applicants/${selectedId}/cv`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Could not load resume.')
      const blob = await response.blob()
      const url  = URL.createObjectURL(blob)
      setResumeBlobUrl(url)
      setShowResume(true)
    } catch (err) {
      setResumeError(err.message || 'Failed to load resume.')
    } finally {
      setResumeLoading(false)
    }
  }

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

  const formatStatus = (value) => {
    return value.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }
  const toName = (str) => str ? str.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : ''

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

  const handleDeleteApplicant = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`${apiBase}/api/applicants/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      setApplicants((prev) => {
        const deletedIndex = prev.findIndex((a) => a.id === deleteTarget.id)
        const remaining = prev.filter((a) => a.id !== deleteTarget.id)

        setSelectedId((currentSelected) => {
          if (currentSelected && currentSelected !== deleteTarget.id && remaining.some((a) => a.id === currentSelected)) {
            return currentSelected
          }

          if (remaining.length === 0) {
            return null
          }

          const nearestIndex = Math.min(deletedIndex, remaining.length - 1)
          return remaining[Math.max(nearestIndex, 0)]?.id || null
        })

        return remaining
      })
      setTotal((prev) => prev - 1)
      setDeleteTarget(null)
    } catch {
      setAdminError('Failed to archive applicant.')
    } finally {
      setDeleting(false)
    }
  }

  const handleRestoreApplicant = async (applicantId) => {
    setAdminMessage(null)
    setAdminError(null)
    try {
      const response = await fetch(`${apiBase}/api/applicants/${applicantId}/restore`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error()

      setApplicants((previous) => previous.filter((item) => item.id !== applicantId))
      setSelectedId((current) => (current === applicantId ? null : current))
      setAdminMessage('Applicant restored to active list.')
    } catch (_) {
      setAdminError('Failed to restore applicant.')
    }
  }

  const handleForceDeleteApplicant = async () => {
    if (!forceTarget) return
    setForcing(true)
    setAdminMessage(null)
    setAdminError(null)
    try {
      const response = await fetch(`${apiBase}/api/applicants/${forceTarget.id}/force`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error()

      setApplicants((prev) => {
        const remaining = prev.filter((a) => a.id !== forceTarget.id)
        setSelectedId((current) => {
          if (current && current !== forceTarget.id && remaining.some((a) => a.id === current)) {
            return current
          }
          return remaining[0]?.id || null
        })
        return remaining
      })
      setForceTarget(null)
      setAdminMessage('Applicant permanently deleted.')
    } catch (_) {
      setAdminError('Failed to permanently delete applicant.')
    } finally {
      setForcing(false)
    }
  }

  const handleStatusSave = async (applicantId, status) => {
    setAdminMessage(null)
    setAdminError(null)
    setStatusSaving(true)

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
    } finally {
      setStatusSaving(false)
    }
  }

  const handleDownloadApplicantDetails = () => {
    if (!selectedApplicant) return

    const esc = (value) => String(value ?? 'N/A')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    const fullName = `${toName(selectedApplicant.first_name)} ${toName(selectedApplicant.last_name)}`.trim()
    const notesHtml = notesLoading
      ? '<li class="note">Notes are still loading...</li>'
      : (notes.length
          ? notes.map((note, idx) => `
              <li class="note">
                <div class="note-head">Note ${idx + 1}</div>
                <p>${esc(note.note)}</p>
                <div class="note-meta">By ${esc(note.user?.name || 'Recruiter')} · ${esc(new Date(note.created_at).toLocaleString())}</div>
              </li>
            `).join('')
          : '<li class="note">No HR notes available.</li>')

    const win = window.open('', '_blank')
    if (!win) return

    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Czark Mak Corporation - Applicant Details</title>
  <style>
    :root {
      --cm-green: #0f3d2e;
      --cm-green-soft: #1b5d48;
      --cm-gold: #c8a441;
      --cm-bg: #f7f5ef;
      --cm-ink: #1f2937;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", Tahoma, Arial, sans-serif;
      color: var(--cm-ink);
      background: #fff;
      padding: 28px;
    }
    .sheet {
      border: 2px solid #d1d5db;
      border-radius: 14px;
      overflow: hidden;
    }
    .head {
      background: linear-gradient(120deg, var(--cm-green), var(--cm-green-soft));
      color: #fff;
      padding: 18px 20px;
      border-bottom: 4px solid var(--cm-gold);
    }
    .head h1 {
      margin: 0;
      font-size: 20px;
      letter-spacing: 0.02em;
    }
    .head p {
      margin: 4px 0 0;
      opacity: 0.9;
      font-size: 12px;
    }
    .body { padding: 12px; background: #fff; }
    .hero {
      display: flex;
      justify-content: space-between;
      gap: 14px;
      background: #fff;
      border: 1px solid #d1d5db;
      border-radius: 10px;
      padding: 10px 12px;
      margin-bottom: 8px;
    }
    .hero h2 { margin: 0 0 2px; color: #111827; font-size: 18px; }
    .hero .meta { margin: 0; font-size: 11px; color: #6b7280; }
    .status {
      align-self: flex-start;
      background: #f3f4f6;
      color: #374151;
      border: 1px solid #d1d5db;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      padding: 5px 9px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
      margin-bottom: 8px;
    }
    .card {
      background: #fff;
      border: 1px solid #d1d5db;
      border-radius: 10px;
      padding: 8px 10px;
    }
    .card h3 {
      margin: 0 0 6px;
      color: #374151;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 4px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      margin: 2px 0;
      font-size: 11px;
    }
    .k { color: #6b7280; }
    .v { color: #111827; font-weight: 600; text-align: right; }
    .pro-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
    }
    .pro-grid .row {
      flex-direction: column;
      gap: 2px;
    }
    .pro-grid .v {
      text-align: left;
    }
    .notes {
      background: #fff;
      border: 1px solid #d1d5db;
      border-radius: 10px;
      padding: 8px 10px;
    }
    .notes h3 {
      margin: 0 0 6px;
      color: #374151;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 4px;
    }
    .notes ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 6px;
    }
    .note {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 7px 9px;
      background: #f9fafb;
      font-size: 11px;
    }
    .note-head { font-weight: 700; color: #374151; margin-bottom: 2px; }
    .note p { margin: 0 0 3px; white-space: pre-wrap; }
    .note-meta { color: #6b7280; font-size: 10px; }
    @media print {
      body { padding: 0; }
      .sheet { border-radius: 0; }
      .head {
        background: linear-gradient(120deg, var(--cm-green), var(--cm-green-soft)) !important;
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="head">
      <h1>Czark Mak Corporation</h1>
      <p>Applicant Details Report · Generated ${esc(new Date().toLocaleString())}</p>
    </div>
    <div class="body">
      <div class="hero">
        <div>
          <h2>${esc(fullName || 'Applicant')}</h2>
          <p class="meta">Position: ${esc(selectedApplicant.position_applied_for || 'N/A')}</p>
          <p class="meta">Submitted: ${esc(selectedApplicant.created_at ? new Date(selectedApplicant.created_at).toLocaleString() : 'N/A')}</p>
        </div>
        <div class="status">${esc(formatStatus(selectedApplicant.status))}</div>
      </div>

      <div class="grid">
        <div class="card">
          <h3>Contact</h3>
          <div class="row"><span class="k">Email</span><span class="v">${esc(selectedApplicant.email_address)}</span></div>
          <div class="row"><span class="k">Phone</span><span class="v">${esc(selectedApplicant.contact_number)}</span></div>
          <div class="row"><span class="k">Address</span><span class="v">${esc(selectedApplicant.permanent_address)}</span></div>
          <div class="row"><span class="k">Gender</span><span class="v">${esc(selectedApplicant.gender)}</span></div>
          <div class="row"><span class="k">Civil Status</span><span class="v">${esc(selectedApplicant.civil_status)}</span></div>
          <div class="row"><span class="k">Birthdate</span><span class="v">${esc(selectedApplicant.birthdate ? new Date(selectedApplicant.birthdate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A')}</span></div>
          <div class="row"><span class="k">Age</span><span class="v">${esc(selectedApplicant.age)}</span></div>
        </div>

        <div class="card">
          <h3>Education</h3>
          <div class="row"><span class="k">Highest Level</span><span class="v">${esc(selectedApplicant.highest_education_level)}</span></div>
          <div class="row"><span class="k">Course</span><span class="v">${esc(selectedApplicant.bachelors_degree_course)}</span></div>
          <div class="row"><span class="k">School</span><span class="v">${esc(selectedApplicant.last_school_attended)}</span></div>
          <div class="row"><span class="k">Year Graduated</span><span class="v">${esc(selectedApplicant.year_graduated)}</span></div>
        </div>

        <div class="card" style="grid-column: 1 / -1;">
          <h3>Professional</h3>
          <div class="pro-grid">
            <div class="row"><span class="k">Experience</span><span class="v">${esc(selectedApplicant.total_work_experience_years || 'N/A')} yrs</span></div>
            <div class="row"><span class="k">Expected Salary</span><span class="v">${esc(selectedApplicant.expected_salary ? `PHP ${Number(selectedApplicant.expected_salary).toLocaleString()}` : 'N/A')}</span></div>
            <div class="row"><span class="k">Preferred Location</span><span class="v">${esc(selectedApplicant.preferred_work_location)}</span></div>
            <div class="row"><span class="k">PRC License</span><span class="v">${esc(selectedApplicant.prc_license)}</span></div>
            <div class="row"><span class="k">Vacancy Source</span><span class="v">${esc(selectedApplicant.vacancy_source)}</span></div>
          </div>
        </div>
      </div>

      <div class="notes">
        <h3>HR Notes</h3>
        <ul>${notesHtml}</ul>
      </div>
    </div>
  </div>
  <script>
    window.onload = () => {
      window.print();
    };
  <\/script>
</body>
</html>`)
    win.document.close()
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
    <AdminLayout pageTitle="Dashboard">
      <div className="admin-welcome">
        <div className="admin-welcome-text">
          <h2>{getGreeting()}, {user?.name?.split(' ')[0] || 'there'} 👋</h2>
          <p>
            {viewMode === 'active'
              ? "Here's the active applicant pipeline. Select someone to view details."
              : "You're viewing archived applicants. Restore or permanently delete records here."}
          </p>
        </div>
        <span className="admin-welcome-date">{todayLabel}</span>
      </div>
      <div className={`admin-card admin-card-pipeline admin-card-mode-${viewMode}`}>
        <div className="admin-card-head">
          <div>
            <h2>{viewMode === 'active' ? 'Applicants' : 'Archived Applicants'}</h2>
            <p>{total} {viewMode === 'archived' ? 'archived ' : ''}applicant{total !== 1 ? 's' : ''} · Signed in as {user?.name || 'User'}</p>
            <span className={`admin-mode-pill admin-mode-pill-${viewMode}`}>
              {viewMode === 'archived' ? 'Archive View' : 'Active View'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
            <div className="admin-mode-switch" role="tablist" aria-label="Pipeline mode">
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'active'}
                className={`admin-mode-switch-btn ${viewMode === 'active' ? 'is-active is-active-mode' : ''}`}
                onClick={() => { setPage(1); setSelectedId(null); setViewMode('active') }}
              >
                Active
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'archived'}
                className={`admin-mode-switch-btn ${viewMode === 'archived' ? 'is-active is-archived-mode' : ''}`}
                onClick={() => { setPage(1); setSelectedId(null); setViewMode('archived') }}
              >
                Archived
              </button>
            </div>
            <NavLink to="/admin/applicants" className="btn btn-outline">
              View full table
            </NavLink>
          </div>
        </div>
        {(adminMessage || adminError) ? (
          <div className="admin-toast-stack" aria-live="polite">
            {adminMessage ? <div className="admin-alert success">{adminMessage}</div> : null}
            {adminError ? <div className="admin-alert error">{adminError}</div> : null}
          </div>
        ) : null}
        <div className="admin-layout">
          <aside className="admin-panel admin-sidebar">
            <div className="admin-panel-head">
              <h4>{viewMode === 'active' ? 'Pipeline' : 'Archive'}</h4>
              {loadingApplicants ? <span>Loading...</span> : <span>{total} {viewMode === 'archived' ? 'archived ' : ''}applicants</span>}
            </div>
            <div className="admin-filters">
              <input
                className="input input-bordered"
                type="search"
                placeholder="Search name, email, role"
                value={searchTerm}
                onChange={(event) => { setPage(1); setSearchTerm(event.target.value) }}
              />
              <select
                className="select select-bordered"
                value={statusFilter}
                onChange={(event) => { setPage(1); setStatusFilter(event.target.value) }}
                disabled={viewMode === 'archived'}
              >
                <option value="">All statuses</option>
                <optgroup label="Pipeline">
                  {pipelineStatusOptions.map((option) => (
                    <option key={`filter-${option}`} value={option}>
                      {formatStatus(option)}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="End states">
                  {terminalStatusOptions.map((option) => (
                    <option key={`filter-${option}`} value={option}>
                      {formatStatus(option)}
                    </option>
                  ))}
                </optgroup>
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
              ) : applicants.length === 0 ? (
                <li>
                  <div className="admin-empty-filter-state">
                    <span>🔍</span>
                    <p>No {viewMode === 'archived' ? 'archived' : 'active'} applicants match your filters.</p>
                    <button type="button" onClick={() => { setSearchTerm(''); setStatusFilter('') }}>Clear filters</button>
                  </div>
                </li>
              ) : applicants.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`admin-list-item ${item.id === selectedId ? 'active' : ''}`}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <div className="admin-list-avatar" aria-hidden="true" style={getAvatarColor(item.first_name, item.last_name)}>
                      {item.first_name?.slice(0, 1)}{item.last_name?.slice(0, 1)}
                    </div>
                    <div className="admin-list-info">
                      <strong>{toName(item.first_name)} {toName(item.last_name)}</strong>
                      <span className="admin-list-position">{item.position_applied_for}</span>
                      <span className={`admin-chip ${item.status}`}>{formatStatus(item.status)}</span>
                      <span className="admin-list-date">Applied {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
            <div className="admin-list-pagination">
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ‹
                </button>
                <span>{page} / {lastPage}</span>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  disabled={page >= lastPage}
                  onClick={() => setPage((p) => p + 1)}
                >
                  ›
                </button>
              </div>
          </aside>
          <section className="admin-panel admin-detail">
            {selectedApplicant ? (
              <div>
                <div className="admin-detail-head">
                  <div className="admin-detail-identity">
                    <div className="admin-detail-avatar" aria-hidden="true" style={getAvatarColor(selectedApplicant.first_name, selectedApplicant.last_name)}>
                      {selectedApplicant.first_name?.slice(0, 1)}{selectedApplicant.last_name?.slice(0, 1)}
                    </div>
                    <div>
                      <h3>{toName(selectedApplicant.first_name)} {toName(selectedApplicant.last_name)}</h3>
                      <p>{selectedApplicant.position_applied_for}</p>
                      <span className={`admin-chip ${selectedApplicant.status}`}>
                        {formatStatus(selectedApplicant.status)}
                      </span>
                    </div>
                  </div>
                  <div className="admin-detail-head-actions">
                    {canEdit && (
                      <div className="admin-status">
                        <label className="admin-status-label">Update status</label>
                        <select
                          className="select select-bordered"
                          value={selectedApplicant.status}
                          disabled={viewMode === 'archived'}
                          onChange={(event) => {
                            const value = event.target.value
                            setApplicants((previous) =>
                              previous.map((item) =>
                                item.id === selectedApplicant.id ? { ...item, status: value } : item
                              )
                            )
                          }}
                        >
                          <optgroup label="Pipeline">
                            {pipelineStatusOptions.map((option) => (
                              <option key={option} value={option}>
                                {formatStatus(option)}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="End states">
                            {terminalStatusOptions.map((option) => (
                              <option key={option} value={option}>
                                {formatStatus(option)}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                        <button
                          type="button"
                          className="btn btn-sm apply-submit"
                          disabled={statusSaving || viewMode === 'archived'}
                          onClick={() => handleStatusSave(selectedApplicant.id, selectedApplicant.status)}
                        >
                          {statusSaving ? (<><span className="login-spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />Saving…</>) : 'Save'}
                        </button>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={handleDownloadApplicantDetails}
                      >
                        Download Details
                      </button>
                      {canDelete && (
                        viewMode === 'active' ? (
                          <button
                            type="button"
                            className="btn btn-sm btn-error btn-outline"
                            onClick={() => setDeleteTarget({ id: selectedApplicant.id, name: `${toName(selectedApplicant.first_name)} ${toName(selectedApplicant.last_name)}` })}
                          >
                            Archive Applicant
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline"
                              onClick={() => handleRestoreApplicant(selectedApplicant.id)}
                            >
                              Restore Applicant
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-error"
                              onClick={() => setForceTarget({ id: selectedApplicant.id, name: `${toName(selectedApplicant.first_name)} ${toName(selectedApplicant.last_name)}` })}
                            >
                              Delete Permanently
                            </button>
                          </>
                        )
                      )}
                    </div>
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
                      <div className="admin-field">
                        <dt>Birthdate</dt>
                        <dd>{selectedApplicant.birthdate ? new Date(selectedApplicant.birthdate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}</dd>
                      </div>
                      <div className="admin-field">
                        <dt>Age</dt>
                        <dd>{selectedApplicant.age || 'N/A'}</dd>
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
                {/* ── Resume / CV Viewer ── */}
                <div className="admin-resume-section">
                  <div className="admin-resume-head">
                    <h4 className="admin-detail-section-title" style={{ margin: 0, border: 0, padding: 0 }}>📄 Resume / CV</h4>
                    {selectedApplicant.cv_path ? (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="admin-cv-btn"
                          disabled={resumeLoading}
                          onClick={showResume ? () => setShowResume(false) : loadResumeBlobUrl}
                        >
                          {resumeLoading ? '⏳ Loading…' : showResume ? '▲ Hide Resume' : '👁 View Resume'}
                        </button>
                        <a
                          className="admin-cv-btn admin-cv-btn-outline"
                          href={`${apiBase}/api/applicants/${selectedApplicant.id}/cv`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={async (e) => {
                            // add token to download via a temporary anchor with blob
                            e.preventDefault()
                            try {
                              const res = await fetch(`${apiBase}/api/applicants/${selectedApplicant.id}/cv`, {
                                headers: { Authorization: `Bearer ${token}` },
                              })
                              const blob = await res.blob()
                              const url = URL.createObjectURL(blob)
                              const a = document.createElement('a')
                              a.href = url
                              a.download = `${selectedApplicant.last_name}_${selectedApplicant.first_name}_CV.${selectedApplicant.cv_path.split('.').pop()}`
                              a.click()
                              URL.revokeObjectURL(url)
                            } catch (_) {}
                          }}
                        >
                          ⬇ Download
                        </a>
                      </div>
                    ) : (
                      <span className="admin-cv-missing">No CV uploaded</span>
                    )}
                  </div>
                  {resumeError && <div className="admin-alert error" style={{ marginTop: '0.5rem' }}>{resumeError}</div>}
                  {showResume && resumeBlobUrl && (
                    <div className="admin-resume-viewer">
                      {selectedApplicant.cv_path?.toLowerCase().endsWith('.pdf') ? (
                        <iframe
                          src={resumeBlobUrl}
                          title="Resume Preview"
                          className="admin-resume-iframe"
                        />
                      ) : (
                        <div className="admin-resume-nopreview">
                          <span>Preview not available for .{selectedApplicant.cv_path.split('.').pop().toUpperCase()} files.</span>
                          <span>Use the Download button above to open it.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="admin-notes">
                  <div className="admin-notes-head">
                    <h4>📝 HR Notes</h4>
                    {notesLoading ? <span className="admin-notes-loading">Loading...</span> : null}
                  </div>
                  {viewMode === 'active' ? (
                    <form className="admin-note-form" onSubmit={handleNoteSubmit}>
                      <div className="admin-note-composer">
                        <textarea
                          className="admin-note-textarea"
                          placeholder="Write a note for recruiters…"
                          value={noteDraft}
                          onChange={(event) => setNoteDraft(event.target.value)}
                          rows={3}
                        />
                        <div className="admin-note-composer-footer">
                          <span className="admin-note-composer-hint">
                            {noteDraft.length > 0 ? `${noteDraft.length} characters` : 'Visible to all recruiters'}
                          </span>
                          <button type="submit" className="admin-note-submit" disabled={noteSaving || !noteDraft.trim()}>
                            {noteSaving ? (
                              <><span className="admin-note-spinner" />Saving…</>
                            ) : (
                              <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>Add note</>
                            )}
                          </button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <div className="admin-empty-state" style={{ padding: '1rem 0 1.25rem' }}>
                      <div className="admin-empty-icon">🗄️</div>
                      <p>Notes editing is disabled in archive view.</p>
                    </div>
                  )}
                  {notesError ? <div className="admin-alert error">{notesError}</div> : null}
                  {notes.length ? (
                    <ul className="admin-note-list">
                      {notes.map((note) => (
                        <li key={note.id}>
                          <p>{note.note}</p>
                          <div className="admin-note-meta">
                            <span>✍️ {note.user?.name || 'Recruiter'}</span>
                            <span title={new Date(note.created_at).toLocaleString()}>{timeAgo(note.created_at)}</span>
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
                  <span className="admin-submitted-date">
                    Submitted {new Date(selectedApplicant.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            ) : (
              <div className="admin-empty-state admin-detail-empty-state">
                <div className="admin-empty-icon">👈</div>
                <p>No applicant selected</p>
                <span>Pick someone from the pipeline to view their details.</span>
              </div>
            )}
          </section>
        </div>
      </div>
      {deleteTarget && (
        <div ref={deleteModalRef} className="del-modal-backdrop" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="del-modal" onClick={(e) => e.stopPropagation()}>
            <div className="del-modal-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </div>
            <h3 className="del-modal-title">Archive applicant?</h3>
            <p className="del-modal-body">
              <strong>{deleteTarget.name}</strong> will be moved to archive and hidden from active applicants.
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
                onClick={handleDeleteApplicant}
                disabled={deleting}
              >
                {deleting ? (
                  <><span className="login-spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />Archiving…</>
                ) : (
                  <>Archive applicant</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {forceTarget && (
        <div ref={forceModalRef} className="del-modal-backdrop" onClick={() => !forcing && setForceTarget(null)}>
          <div className="del-modal" onClick={(e) => e.stopPropagation()}>
            <div className="del-modal-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </div>
            <h3 className="del-modal-title">Delete permanently?</h3>
            <p className="del-modal-body">
              <strong>{forceTarget.name}</strong> will be permanently removed from the system, including CV files and notes. This action cannot be undone.
            </p>
            <div className="del-modal-actions">
              <button
                type="button"
                className="del-modal-cancel"
                onClick={() => setForceTarget(null)}
                disabled={forcing}
              >
                Cancel
              </button>
              <button
                type="button"
                className="del-modal-confirm"
                onClick={handleForceDeleteApplicant}
                disabled={forcing}
              >
                {forcing ? (
                  <><span className="login-spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />Deleting…</>
                ) : (
                  <>Delete permanently</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminPage
