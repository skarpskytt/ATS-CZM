import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import AdminLayout from '../components/AdminLayout'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from 'recharts'

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const STATUS_META = {
  new:                 { label: 'New',                  color: '#3b82f6' },
  reviewed:            { label: 'Reviewed',             color: '#f59e0b' },
  shortlisted:         { label: 'Shortlisted',          color: '#8b5cf6' },
  interview_scheduled: { label: 'Interview Scheduled',  color: '#06b6d4' },
  offer_extended:      { label: 'Offer Extended',       color: '#10b981' },
  hired:               { label: 'Hired',                color: '#0f3d2e' },
  rejected:            { label: 'Rejected',             color: '#ef4444' },
  withdrawn:           { label: 'Withdrawn',            color: '#6b7280' },
}

const PERIOD_OPTIONS = [
  { label: 'All Time', value: 0 },
  { label: '12 Months', value: 365 },
  { label: '90 Days',   value: 90 },
  { label: '30 Days',   value: 30 },
]

const tooltipStyle = {
  borderRadius: '10px',
  border: '1px solid rgba(200,164,65,0.25)',
  fontSize: '0.82rem',
  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
}

function KpiCard({ icon, label, value, sub, bg, color }) {
  return (
    <div className="admin-kpi-card">
      <div className="admin-kpi-icon" style={{ background: bg, color }}>{icon}</div>
      <div className="admin-kpi-body">
        <span>{label}</span>
        <strong>{value}</strong>
        {sub && <small>{sub}</small>}
      </div>
    </div>
  )
}

function ChartCard({ title, subtitle, children, loading, empty, emptyIcon = '📊', emptyText = 'No data yet' }) {
  return (
    <div className="admin-card admin-chart-card">
      <div className="admin-card-head">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {loading
        ? <div className="admin-chart-skeleton" />
        : empty
          ? (
            <div className="admin-empty-state">
              <div className="admin-empty-icon">{emptyIcon}</div>
              <p>{emptyText}</p>
            </div>
          )
          : children}
    </div>
  )
}

function AdminAnalyticsPage() {
  const { token, user } = useAuth()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [period, setPeriod]       = useState(0)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const qs  = period > 0 ? `?days=${period}` : ''
      const res = await fetch(`${apiBase}/api/dashboard/overview${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      setDashboard(await res.json())
    } catch {
      setError('Unable to load analytics data.')
    } finally {
      setLoading(false)
    }
  }, [token, period])

  useEffect(() => { load() }, [load])

  const getGreeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const fmt = (n) => (n ?? 0).toLocaleString()
  const total = dashboard?.total_applicants ?? 0

  const pipelineData = Object.entries(STATUS_META).map(([key, meta]) => ({
    name: meta.label,
    value: dashboard?.by_status?.find((s) => s.status === key)?.total ?? 0,
    color: meta.color,
  })).filter((d) => d.value > 0)

  return (
    <AdminLayout pageTitle="Analytics">
      {/* Header */}
      <div className="admin-welcome">
        <div className="admin-welcome-text">
          <h2>{getGreeting()}, {user?.name?.split(' ')[0] || 'there'} 👋</h2>
          <p>Here's a snapshot of your recruiting pipeline.</p>
        </div>
        <span className="admin-welcome-date">{todayLabel}</span>
      </div>

      {error && <div className="admin-card"><div className="admin-alert error">{error}</div></div>}

      {/* Period filter */}
      <div className="analytics-period-bar">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className={`analytics-period-btn${period === opt.value ? ' active' : ''}`}
            onClick={() => setPeriod(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* KPI row */}
      <div className="admin-kpi-row">
        <KpiCard icon="👥" label="Total Applicants"
          value={loading ? '—' : fmt(total)}
          sub={loading ? '' : `${dashboard?.recent_count ?? 0} in last 30 days`}
          bg="rgba(15,61,46,0.1)" color="#0f3d2e" />
        <KpiCard icon="⏳" label="In Pipeline"
          value={loading ? '—' : fmt(
            (dashboard?.by_status ?? [])
              .filter(s => !['hired','rejected','withdrawn'].includes(s.status))
              .reduce((sum, s) => sum + s.total, 0)
          )}
          sub="Active candidates"
          bg="rgba(74,127,191,0.12)" color="#2d5f8a" />
        <KpiCard icon="✅" label="Total Hired"
          value={loading ? '—' : fmt(dashboard?.by_status?.find(s => s.status === 'hired')?.total ?? 0)}
          sub={loading ? '' : `${dashboard?.hire_rate ?? 0}% hire rate`}
          bg="rgba(45,122,58,0.12)" color="#2d7a3a" />
        <KpiCard icon="❌" label="Rejected"
          value={loading ? '—' : fmt(dashboard?.by_status?.find(s => s.status === 'rejected')?.total ?? 0)}
          sub={loading ? '' : `${dashboard?.rejection_rate ?? 0}% rejection rate`}
          bg="rgba(185,64,64,0.1)" color="#b94040" />
      </div>

      {/* Monthly Trend — full width */}
      <ChartCard
        title="Monthly Applications"
        subtitle="New applications received each month over the last 12 months."
        loading={loading}
        empty={!loading && !(dashboard?.monthly_trend?.length)}
        emptyText="No trend data yet"
      >
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={dashboard?.monthly_trend ?? []} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#0f3d2e" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#0f3d2e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(200,164,65,0.15)" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#4b5a51' }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#4b5a51' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, 'Applications']} />
            <Area type="monotone" dataKey="total" stroke="#0f3d2e" strokeWidth={2.5}
              fill="url(#trendGrad)" dot={{ r: 3, fill: '#0f3d2e', strokeWidth: 0 }} activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Row 2: Pipeline donut + Top positions */}
      <div className="admin-charts-row">
        <ChartCard title="Pipeline Breakdown" subtitle="Applicant distribution by current status."
          loading={loading} empty={!loading && !pipelineData.length} emptyText="No status data yet">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pipelineData} cx="50%" cy="50%"
                innerRadius={70} outerRadius={110} paddingAngle={3} dataKey="value">
                {pipelineData.map((d, i) => <Cell key={i} fill={d.color} stroke="none" />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [v + ' applicants', n]} />
              <Legend iconType="circle" iconSize={8}
                formatter={(v) => <span style={{ fontSize: '0.78rem', color: '#4b5a51' }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top Positions" subtitle="Ranked by number of applications received."
          loading={loading} empty={!loading && !(dashboard?.by_position?.length)} emptyText="No position data yet">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart layout="vertical"
              data={(dashboard?.by_position ?? []).slice(0, 8).map((p) => ({
                name: p.position_applied_for.length > 28 ? p.position_applied_for.slice(0, 26) + '…' : p.position_applied_for,
                total: p.total,
              }))}
              margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(200,164,65,0.15)" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#4b5a51' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11, fill: '#0f2c20' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v + ' applicants', 'Applications']} />
              <Bar dataKey="total" radius={[0, 6, 6, 0]} fill="#0f3d2e" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 3: Application Sources — full width */}
      <ChartCard title="Application Sources" subtitle="Where applicants heard about the opening."
        loading={loading} empty={!loading && !(dashboard?.by_source?.length)} emptyText="No source data yet">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart layout="vertical"
            data={(dashboard?.by_source ?? []).map((s) => ({
              name: s.vacancy_source || 'Unknown',
              total: s.total,
            }))}
            margin={{ top: 0, right: 32, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(200,164,65,0.15)" />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#4b5a51' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11, fill: '#0f2c20' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v + ' applicants', 'Source']} />
            <Bar dataKey="total" radius={[0, 6, 6, 0]} fill="#c8a441" maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </AdminLayout>
  )
}


export default AdminAnalyticsPage
