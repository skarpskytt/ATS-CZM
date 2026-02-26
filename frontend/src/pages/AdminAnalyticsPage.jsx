import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import AdminLayout from '../components/AdminLayout'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const STATUS_META = {
  submitted:           { icon: '📥', label: 'Submitted',            color: '#c8a441' },
  under_review:        { icon: '🔍', label: 'Under Review',         color: '#4a7fbf' },
  shortlisted:         { icon: '⭐', label: 'Shortlisted',          color: '#7b5ea7' },
  interview_scheduled: { icon: '📅', label: 'Interview Scheduled',  color: '#2e8b7a' },
  offer_extended:      { icon: '📋', label: 'Offer Extended',       color: '#d4813a' },
  hired:               { icon: '✅', label: 'Hired',                color: '#2d7a3a' },
  rejected:            { icon: '❌', label: 'Rejected',             color: '#b94040' },
  withdrawn:           { icon: '↩️', label: 'Withdrawn',            color: '#888' },
}

function AdminAnalyticsPage() {
  const { token, user } = useAuth()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!token) return
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${apiBase}/api/dashboard/overview`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error()
        setDashboard(await res.json())
      } catch (_) {
        setError('Unable to load analytics data.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const total = dashboard?.total_applicants ?? 0
  const hired = dashboard?.by_status?.find((s) => s.status === 'hired')?.total ?? 0
  const hireRate = total > 0 ? Math.round((hired / total) * 100) : 0

  return (
    <AdminLayout pageTitle="Analytics">
      <div className="admin-welcome">
        <div className="admin-welcome-text">
          <h2>{getGreeting()}, {user?.name?.split(' ')[0] || 'there'} 👋</h2>
          <p>Here's a snapshot of your recruiting pipeline.</p>
        </div>
        <span className="admin-welcome-date">{todayLabel}</span>
      </div>

      {error && (
        <div className="admin-card">
          <div className="admin-alert error">{error}</div>
        </div>
      )}

      {/* Summary KPI row */}
      <div className="admin-kpi-row">
        <div className="admin-kpi-card">
          <div className="admin-kpi-icon" style={{ background: 'rgba(15,61,46,0.1)', color: '#0f3d2e' }}>👥</div>
          <div className="admin-kpi-body">
            <span>Total Applicants</span>
            <strong>{loading ? '—' : total}</strong>
          </div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-icon" style={{ background: 'rgba(74,127,191,0.12)', color: '#2d5f8a' }}>🗓️</div>
          <div className="admin-kpi-body">
            <span>Last 30 Days</span>
            <strong>{loading ? '—' : (dashboard?.recent_count ?? 0)}</strong>
          </div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-icon" style={{ background: 'rgba(45,122,58,0.12)', color: '#2d7a3a' }}>✅</div>
          <div className="admin-kpi-body">
            <span>Total Hired</span>
            <strong>{loading ? '—' : hired}</strong>
          </div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-icon" style={{ background: 'rgba(200,164,65,0.15)', color: '#8a6a16' }}>📈</div>
          <div className="admin-kpi-body">
            <span>Hire Rate</span>
            <strong>{loading ? '—' : `${hireRate}%`}</strong>
          </div>
        </div>
      </div>

      <div className="admin-charts-row">
        {/* Donut chart — pipeline breakdown */}
        <div className="admin-card admin-chart-card">
          <div className="admin-card-head">
            <div>
              <h2>Pipeline Breakdown</h2>
              <p>Applicant distribution by status.</p>
            </div>
          </div>
          {loading ? (
            <div className="admin-chart-skeleton" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(STATUS_META).map(([key, meta]) => ({
                    name: meta.label,
                    value: dashboard?.by_status?.find((s) => s.status === key)?.total ?? 0,
                    color: meta.color,
                  })).filter((d) => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {Object.entries(STATUS_META).map(([key, meta]) => (
                    <Cell key={key} fill={meta.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [value + ' applicants', name]}
                  contentStyle={{ borderRadius: '10px', border: '1px solid rgba(200,164,65,0.25)', fontSize: '0.82rem' }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span style={{ fontSize: '0.78rem', color: '#4b5a51' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Horizontal bar chart — top positions */}
        <div className="admin-card admin-chart-card">
          <div className="admin-card-head">
            <div>
              <h2>Top Positions</h2>
              <p>Ranked by number of applications received.</p>
            </div>
          </div>
          {loading ? (
            <div className="admin-chart-skeleton" />
          ) : (dashboard?.by_position || []).length ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                layout="vertical"
                data={(dashboard.by_position).slice(0, 8).map((p) => ({
                  name: p.position_applied_for.length > 28
                    ? p.position_applied_for.slice(0, 26) + '…'
                    : p.position_applied_for,
                  total: p.total,
                }))}
                margin={{ top: 0, right: 24, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(200,164,65,0.15)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#4b5a51' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11, fill: '#0f2c20' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v) => [v + ' applicants', 'Applications']}
                  contentStyle={{ borderRadius: '10px', border: '1px solid rgba(200,164,65,0.25)', fontSize: '0.82rem' }}
                />
                <Bar dataKey="total" radius={[0, 6, 6, 0]} fill="#0f3d2e" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="admin-empty-state">
              <div className="admin-empty-icon">📊</div>
              <p>No position data yet</p>
              <span>Positions will appear once applicants start submitting.</span>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminAnalyticsPage

