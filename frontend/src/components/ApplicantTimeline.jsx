import { useEffect, useState } from 'react'

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const getStatusColors = (description) => {
  const desc = description?.toLowerCase() || ''
  if (desc.includes('reviewed')) return { marker: '#3b82f6', label: '#1e40af', bg: '#eff6ff', badge: '#dbeafe' }
  if (desc.includes('shortlist')) return { marker: '#10b981', label: '#065f46', bg: '#f0fdf4', badge: '#dcfce7' }
  if (desc.includes('interview')) return { marker: '#f59e0b', label: '#92400e', bg: '#fffbeb', badge: '#fef3c7' }
  if (desc.includes('offer')) return { marker: '#c8a441', label: '#78350f', bg: '#fffef0', badge: '#fef08a' }
  if (desc.includes('hired')) return { marker: '#22c55e', label: '#166534', bg: '#f0fdf4', badge: '#86efac' }
  if (desc.includes('rejected')) return { marker: '#ef4444', label: '#7f1d1d', bg: '#fef2f2', badge: '#fecaca' }
  return { marker: '#9ca3af', label: '#374151', bg: '#f9fafb', badge: '#e5e7eb' }
}

const getStatusLabel = (description) => {
  const desc = description?.toLowerCase() || ''
  if (desc.includes('reviewed')) return 'Application Reviewed'
  if (desc.includes('shortlist')) return 'Shortlisted'
  if (desc.includes('interview')) return 'Interview Scheduled'
  if (desc.includes('offer')) return 'Offer Extended'
  if (desc.includes('hired')) return 'Applicant Hired'
  if (desc.includes('rejected')) return 'Application Rejected'
  return 'Status Update'
}

const formatDescription = (description) => {
  // Remove underscores and format properly
  return description
    ?.replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim() || 'Status Updated'
}

function ApplicantTimeline({ applicantId, token }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!applicantId || !token) return

    const loadTimeline = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`${apiBase}/api/applicants/${applicantId}/timeline`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) throw new Error('Failed to load timeline')

        const payload = await response.json()
        setEvents(Array.isArray(payload) ? payload : [])
      } catch (err) {
        setError('Unable to load applicant timeline')
      } finally {
        setLoading(false)
      }
    }

    loadTimeline()
  }, [applicantId, token])

  if (loading) {
    return (
      <div className="avm-card avm-timeline-card">
        <div className="avm-card-head">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
          Pipeline Timeline
        </div>
        <div className="avm-loading-mini">
          <span className="login-spinner" />
          <span>Loading timeline…</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="avm-card avm-timeline-card">
        <div className="avm-card-head">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          Pipeline Timeline
        </div>
        <div className="avm-empty">{error}</div>
      </div>
    )
  }

  return (
    <div className="avm-card avm-timeline-card">
      <div className="avm-card-head">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        Pipeline Timeline
        {events.length > 0 && <span className="avm-notes-count">{events.length}</span>}
      </div>

      {events.length ? (
        <div className="avm-timeline-v2">
          {events.map((event, index) => {
            const isLast = index === events.length - 1
            const colors = getStatusColors(event.description)
            const label = getStatusLabel(event.description)
            const displayDesc = formatDescription(event.description)

            return (
              <div key={event.id} className="avm-timeline-item-v2">
                <div className="avm-timeline-left-v2">
                  <div className="avm-timeline-marker-v2" style={{ backgroundColor: colors.marker }}>
                  </div>
                  {!isLast && <div className="avm-timeline-line-v2" style={{ backgroundColor: colors.marker }} />}
                </div>

                <div className="avm-timeline-right-v2">
                  <div className="avm-timeline-box-v2" style={{ backgroundColor: colors.bg, borderLeftColor: colors.marker }}>
                    <div className="avm-timeline-badge-v2" style={{ backgroundColor: colors.badge, color: colors.label }}>
                      {label}
                    </div>

                    <p className="avm-timeline-desc-v2" style={{ color: colors.label }}>
                      {displayDesc}
                    </p>

                    <div className="avm-timeline-meta-v2">
                      <div className="avm-timeline-meta-item-v2">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        <span style={{ color: colors.label, fontWeight: 600 }}>{event.recruiter_name}</span>
                      </div>
                      <div className="avm-timeline-meta-item-v2">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        <span style={{ color: colors.label }}>{event.created_at_formatted}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="avm-empty">No timeline events recorded yet.</div>
      )}
    </div>
  )
}

export default ApplicantTimeline
