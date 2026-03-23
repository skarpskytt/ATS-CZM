import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth, useRole, PERMISSION_DEFAULTS } from '../context/AuthContext'
import AdminLayout from '../components/AdminLayout'

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const ROLE_OPTIONS = [
  {
    value:       'admin',
    label:       'Administrator',
    desc:        'Full access to everything — users, positions, analytics, all applicant actions.',
    icon:        '👑',
    activeBg:    'rgba(15,61,46,0.12)',
    color:       '#0f3d2e',
    border:      'rgba(15,61,46,0.30)',
  },
  {
    value:       'hr_manager',
    label:       'HR Manager',
    desc:        'Edit applicants, change status, view analytics. No positions or user management.',
    icon:        '🏢',
    activeBg:    'rgba(74,127,191,0.14)',
    color:       '#2d5f8a',
    border:      'rgba(74,127,191,0.35)',
  },
  {
    value:       'hr_supervisor',
    label:       'HR Supervisor',
    desc:        'Same as HR Manager — review applicants, add notes, view analytics.',
    icon:        '🔍',
    activeBg:    'rgba(120,80,180,0.12)',
    color:       '#5b3d99',
    border:      'rgba(120,80,180,0.30)',
  },
  {
    value:       'recruiter',
    label:       'Recruiter',
    desc:        'View applicants and add notes only. No edit, delete, or management access.',
    icon:        '📋',
    activeBg:    'rgba(200,164,65,0.14)',
    color:       '#8a6a16',
    border:      'rgba(200,164,65,0.40)',
  },
]

const ROLE_MAP = Object.fromEntries(ROLE_OPTIONS.map(r => [r.value, r]))

const emptyForm = { name: '', email: '', password: '', role: 'recruiter' }

const AVATAR_PALETTE = ['#0f3d2e','#2d5f8a','#5b3d99','#8a6a16','#1a6e4a','#b45309']
const avatarBg = (name) => AVATAR_PALETTE[(name?.charCodeAt(0) ?? 0) % AVATAR_PALETTE.length]
const initials = (name) => (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

export default function AdminUsersPage() {
  const { token, user: me, permissions: globalPerms, setPermissions: setGlobalPerms } = useAuth()
  const { isAdmin } = useRole()
  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [success, setSuccess]   = useState(null)

  const [modalOpen, setModalOpen]   = useState(false)
  const [editUser, setEditUser]     = useState(null)
  const [form, setForm]             = useState(emptyForm)
  const [saving, setSaving]         = useState(false)
  const [formError, setFormError]   = useState(null)
  const [showPw, setShowPw]         = useState(false)

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]         = useState(false)

  const [localPerms, setLocalPerms]   = useState(null)
  const [permSaving, setPermSaving]   = useState(false)
  const [permSuccess, setPermSuccess] = useState(null)
  const [permError, setPermError]     = useState(null)

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

  const displayPerms = localPerms ?? globalPerms ?? PERMISSION_DEFAULTS

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`${apiBase}/api/users`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error()
      setUsers(await res.json())
    } catch { setError('Failed to load users.') }
    finally  { setLoading(false) }
  }

  useEffect(() => { if (token) load() }, [token])

  const openCreate = () => { setEditUser(null); setForm(emptyForm); setFormError(null); setShowPw(false); setModalOpen(true) }
  const openEdit   = (u) => { setEditUser(u); setForm({ name: u.name, email: u.email, password: '', role: u.role }); setFormError(null); setShowPw(false); setModalOpen(true) }
  const closeModal = () => { setModalOpen(false); setEditUser(null); setFormError(null) }
  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setFormError(null)
    try {
      const body = { ...form }
      if (editUser && !body.password) delete body.password
      const res = await fetch(editUser ? `${apiBase}/api/users/${editUser.id}` : `${apiBase}/api/users`, {
        method:  editUser ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      if (!res.ok) {
        const p = await res.json().catch(() => ({}))
        setFormError(p?.errors ? Object.values(p.errors).flat()[0] : p?.message || 'Save failed.')
        return
      }
      const saved = await res.json()
      setUsers(prev => editUser ? prev.map(u => u.id === saved.id ? saved : u) : [...prev, saved])
      setSuccess(editUser ? 'User updated successfully.' : 'New user created successfully.')
      closeModal()
      setTimeout(() => setSuccess(null), 4000)
    } catch { setFormError('Network error. Please try again.') }
    finally  { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`${apiBase}/api/users/${deleteTarget.id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) { const p = await res.json().catch(() => ({})); setError(p?.message || 'Failed to delete.'); return }
      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id))
      setSuccess('User deleted.'); setTimeout(() => setSuccess(null), 4000)
    } catch { setError('Network error.') }
    finally  { setDeleting(false); setDeleteTarget(null) }
  }

  const savePermissions = async () => {
    if (!localPerms) return
    setPermSaving(true); setPermError(null)
    try {
      const res = await fetch(`${apiBase}/api/settings/permissions`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(localPerms),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Save failed.')
      const saved = await res.json()
      setGlobalPerms(saved); setLocalPerms(null)
      setPermSuccess('Permissions updated.'); setTimeout(() => setPermSuccess(null), 4000)
    } catch (err) { setPermError(err.message) }
    finally { setPermSaving(false) }
  }

  const pwStrength = form.password.length === 0 ? 0 : form.password.length < 8 ? 1 : form.password.length < 12 ? 2 : 3
  const pwColor    = ['transparent','#dc2626','#d97706','#15803d'][pwStrength]
  const pwLabel    = ['','Too short','Good','Strong'][pwStrength]

  return (
    <AdminLayout pageTitle="Users">

      {/* ── Header ── */}
      <div className="um-header">
        <div>
          <h2 className="um-header-title">User Management</h2>
          <p className="um-header-sub">Manage who has access and what they can do.</p>
        </div>
        {isAdmin && (
          <button type="button" className="um-add-btn" onClick={openCreate}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add User
          </button>
        )}
      </div>

      {/* ── Toasts ── */}
      {error   && <div className="um-toast um-toast-error"   onClick={() => setError(null)}>  <span>⚠</span> {error}   <button>✕</button></div>}
      {success && <div className="um-toast um-toast-success" onClick={() => setSuccess(null)}><span>✓</span> {success} <button>✕</button></div>}

      {/* ── Users table ── */}
      <div className="admin-card um-card">
        <div className="um-card-head">
          <div className="um-card-title-wrap">
            <h3 className="um-card-title">System Users</h3>
            <span className="um-badge">{users.length}</span>
          </div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table um-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                {isAdmin && <th style={{ width:'120px' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td><div className="um-sk-row"><div className="um-sk um-sk-avatar" /><div className="um-sk" style={{ width:'120px' }} /></div></td>
                    <td><div className="um-sk" style={{ width:'160px' }} /></td>
                    <td><div className="um-sk" style={{ width:'90px', borderRadius:'999px' }} /></td>
                    <td><div className="um-sk" style={{ width:'80px' }} /></td>
                    {isAdmin && <td><div className="um-sk" style={{ width:'80px' }} /></td>}
                  </tr>
                ))
              ) : users.length ? (
                users.map((u) => {
                  const ro     = ROLE_MAP[u.role] ?? ROLE_MAP.recruiter
                  const isSelf = u.id === me?.id
                  return (
                    <tr key={u.id} className={`um-row ${isSelf ? 'um-self' : ''}`}>
                      <td>
                        <div className="um-user-cell">
                          <div className="um-avatar" style={{ background: avatarBg(u.name) }}>
                            {initials(u.name)}
                          </div>
                          <div className="um-user-meta">
                            <span className="um-user-name">{u.name}</span>
                            {isSelf && <span className="um-you">you</span>}
                          </div>
                        </div>
                      </td>
                      <td className="um-muted">{u.email}</td>
                      <td>
                        <span className="um-role-chip" style={{ background: ro.activeBg, color: ro.color, borderColor: ro.border }}>
                          {ro.icon} {ro.label}
                        </span>
                      </td>
                      <td className="um-muted">
                        {new Date(u.created_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}
                      </td>
                      {isAdmin && (
                        <td>
                          <div className="um-actions">
                            <button className="um-act um-act-edit" onClick={() => openEdit(u)} title="Edit user">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button className="um-act um-act-del" disabled={isSelf} title={isSelf ? 'Cannot delete yourself' : 'Delete user'} onClick={() => setDeleteTarget(u)}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })
              ) : (
                <tr><td colSpan={isAdmin ? 5 : 4}>
                  <div className="admin-empty-state"><div className="admin-empty-icon">👥</div><p>No users yet</p></div>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Permissions matrix ── */}
      <div className="admin-card um-card">
        <div className="um-card-head">
          <div className="um-card-title-wrap">
            <h3 className="um-card-title">Role Permissions</h3>
            <span className="um-badge-outline">{isAdmin ? 'Editable' : 'Read-only'}</span>
          </div>
          {isAdmin && localPerms && (
            <div className="um-perm-btns">
              <button className="um-ghost-btn" onClick={() => { setLocalPerms(null); setPermError(null) }}>Discard</button>
              <button className="um-add-btn" style={{ fontSize:'0.8rem', padding:'7px 16px' }} disabled={permSaving} onClick={savePermissions}>
                {permSaving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        {permError   && <div className="um-inline um-inline-err">{permError}</div>}
        {permSuccess && <div className="um-inline um-inline-ok">{permSuccess}</div>}

        <div className="um-perm-table">
          <div className="um-perm-head">
            <span />
            {ROLE_OPTIONS.map(r => (
              <div key={r.value} className="um-perm-col">
                <span className="um-perm-col-icon">{r.icon}</span>
                <span className="um-perm-col-name">{r.label.replace(' ', '\u00A0')}</span>
              </div>
            ))}
          </div>

          {[
            { key: 'canEdit',            label: 'Edit & Change Status', icon: '✏️' },
            { key: 'canDelete',          label: 'Delete Applicants',    icon: '🗑️' },
            { key: 'canViewAnalytics',   label: 'Analytics Dashboard',  icon: '📊' },
            { key: 'canManagePositions', label: 'Manage Positions',     icon: '📌' },
            { key: 'canManageUsers',     label: 'Manage Users',         icon: '👤' },
          ].map(({ key, label, icon }) => (
            <div key={key} className="um-perm-row">
              <span className="um-perm-feat"><span className="um-perm-feat-icon">{icon}</span>{label}</span>
              {ROLE_OPTIONS.map(({ value: rv }) => {
                const on     = (displayPerms[key] ?? []).includes(rv)
                const locked = rv === 'admin'
                return (
                  <div key={rv} className="um-perm-cell">
                    <label className={`um-toggle ${on ? 'um-toggle-on' : ''} ${locked ? 'um-toggle-locked' : ''}`}
                           title={locked ? 'Admin always has full access' : ''}>
                      <input type="checkbox" checked={on} disabled={locked || !isAdmin}
                        onChange={() => {
                          const base = localPerms ?? { ...displayPerms }
                          const cur  = [...(base[key] ?? [])]
                          setLocalPerms({ ...base, [key]: on ? cur.filter(r => r !== rv) : [...cur, rv] })
                        }}
                      />
                      <span className="um-track"><span className="um-thumb" /></span>
                    </label>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
        {isAdmin && !localPerms && <p className="um-perm-hint">Toggle any switch to begin editing, then Save Changes.</p>}
      </div>

      {/* ── Add / Edit Modal ── */}
      {modalOpen && createPortal(
        <div ref={addEditModalRef} className="um-backdrop" onClick={closeModal}>
          <div className="um-modal" onClick={e => e.stopPropagation()}>

            <div className="um-modal-head">
              <div className="um-modal-head-icon">
                {editUser ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                )}
              </div>
              <div className="um-modal-head-text">
                <h3>{editUser ? `Edit ${editUser.name}` : 'Add New User'}</h3>
                <p>{editUser ? 'Update this account\'s details.' : 'Create a new account for your team.'}</p>
              </div>
              <button className="um-close" onClick={closeModal}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="um-modal-body">
                {formError && <div className="um-inline um-inline-err" style={{ marginBottom:'1.25rem' }}>⚠ {formError}</div>}

                <div className="um-field-row">
                  <div className="um-field">
                    <label className="um-label">Full Name <span className="um-req">*</span></label>
                    <input className="um-input" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Maria Santos" required autoFocus />
                  </div>
                  <div className="um-field">
                    <label className="um-label">Email <span className="um-req">*</span></label>
                    <input className="um-input" type="email" name="email" value={form.email} onChange={handleChange} placeholder="maria@company.com" required />
                  </div>
                </div>

                <div className="um-field">
                  <label className="um-label">
                    {editUser ? 'New Password' : 'Password'} {!editUser && <span className="um-req">*</span>}
                    {editUser && <span className="um-label-hint">— leave blank to keep current</span>}
                  </label>
                  <div className="um-pw-wrap">
                    <input
                      className="um-input"
                      type={showPw ? 'text' : 'password'}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      required={!editUser}
                      minLength={8}
                      placeholder={editUser ? '••••••••' : 'Min. 8 characters'}
                    />
                    <button type="button" className="um-pw-eye" onClick={() => setShowPw(p => !p)} tabIndex={-1}>
                      {showPw ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      )}
                    </button>
                  </div>
                  {form.password.length > 0 && (
                    <div className="um-strength-wrap">
                      <div className="um-strength-bars">
                        {[1,2,3].map(i => (
                          <div key={i} className="um-strength-bar" style={{ background: pwStrength >= i ? pwColor : undefined }} />
                        ))}
                      </div>
                      <span className="um-strength-label" style={{ color: pwColor }}>{pwLabel}</span>
                    </div>
                  )}
                </div>

                <div className="um-field">
                  <label className="um-label">Role <span className="um-req">*</span></label>
                  <div className="um-role-grid">
                    {ROLE_OPTIONS.map(r => (
                      <label
                        key={r.value}
                        className={`um-role-card ${form.role === r.value ? 'active' : ''}`}
                        style={form.role === r.value ? { borderColor: r.border, background: r.activeBg } : {}}
                      >
                        <input type="radio" name="role" value={r.value} checked={form.role === r.value} onChange={handleChange} />
                        <div className="um-role-card-top">
                          <span className="um-role-card-ico">{r.icon}</span>
                          <span className="um-role-card-name" style={form.role === r.value ? { color: r.color, fontWeight: 700 } : {}}>
                            {r.label}
                          </span>
                          {form.role === r.value && <span className="um-role-card-check" style={{ color: r.color }}>✓</span>}
                        </div>
                        <p className="um-role-card-desc">{r.desc}</p>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="um-modal-foot">
                <button type="button" className="um-ghost-btn" onClick={closeModal}>Cancel</button>
                <button type="submit" className="um-add-btn" style={{ minWidth:'130px' }} disabled={saving}>
                  {saving ? 'Saving…' : editUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      , document.body)}

      {/* ── Delete Modal ── */}
      {deleteTarget && createPortal(
        <div ref={deleteModalRef} className="um-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="um-modal um-del-modal" onClick={e => e.stopPropagation()}>
            <div className="um-del-head">
            <div className="um-del-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </div>
              <h3>Delete User?</h3>
              <p>This cannot be undone.</p>
              <button className="um-close" onClick={() => setDeleteTarget(null)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="um-modal-body um-del-body">
              <div className="um-del-preview">
                <div className="um-avatar" style={{ width:'52px', height:'52px', fontSize:'1.1rem', background: avatarBg(deleteTarget.name) }}>
                  {initials(deleteTarget.name)}
                </div>
                <strong>{deleteTarget.name}</strong>
                <span>{deleteTarget.email}</span>
                <span className="um-role-chip" style={{ background: ROLE_MAP[deleteTarget.role]?.activeBg, color: ROLE_MAP[deleteTarget.role]?.color, borderColor: ROLE_MAP[deleteTarget.role]?.border }}>
                  {ROLE_MAP[deleteTarget.role]?.icon} {ROLE_MAP[deleteTarget.role]?.label}
                </span>
              </div>
              <p className="um-del-warn">Deleting this account will immediately revoke their access and remove all active sessions.</p>
            </div>
            <div className="um-modal-foot" style={{ justifyContent:'center' }}>
              <button className="um-ghost-btn" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="um-danger-btn" disabled={deleting} onClick={handleDelete}>
                {deleting ? 'Deleting…' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      , document.body)}

    </AdminLayout>
  )
}