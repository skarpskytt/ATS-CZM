import { useEffect, useState, useCallback, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import AdminLayout from '../components/AdminLayout'
import { apiBase } from '../utils/apiBase'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area
} from 'recharts'

const STATUS_META = {
  new:                 { label: 'New',                  color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  reviewed:            { label: 'Reviewed',             color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  shortlisted:         { label: 'Shortlisted',          color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  interview_scheduled: { label: 'Interview Scheduled',  color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
  offer_extended:      { label: 'Offer Extended',       color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  hired:               { label: 'Hired',                color: '#0f3d2e', bg: 'rgba(15,61,46,0.12)' },
  rejected:            { label: 'Rejected',             color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  withdrawn:           { label: 'Withdrawn',            color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
}

const PERIOD_OPTIONS = [
  { label: 'Last 7 Days', value: 7, shortLabel: '7D' },
  { label: 'Last 30 Days', value: 30, shortLabel: '30D' },
  { label: 'Last 90 Days', value: 90, shortLabel: '90D' },
  { label: 'Last 12 Months', value: 365, shortLabel: '12M' },
  { label: 'All Time', value: 0, shortLabel: 'ALL' },
]

// Modern tooltip style
const tooltipStyle = {
  background: 'rgba(255,255,255,0.98)',
  borderRadius: '12px',
  border: '1px solid rgba(226,232,240,0.8)',
  fontSize: '0.82rem',
  boxShadow: '0 20px 40px -12px rgba(0,0,0,0.15)',
  padding: '12px 16px',
}

// Custom tooltip for pie chart
function PieTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    const total = payload[0].payload.total
    const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0
    return (
      <div style={tooltipStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: data.color }} />
          <span style={{ fontWeight: 600 }}>{data.name}</span>
        </div>
        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
          {data.value} applicants ({percentage}%)
        </div>
      </div>
    )
  }
  return null
}

// Trend indicator component
function TrendIndicator({ value, isPositive }) {
  if (!value && value !== 0) return null
  return (
    <span className={`trend-indicator ${isPositive ? 'trend-up' : 'trend-down'}`}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {isPositive ? <path d="M7 17l5-5 5 5M12 12V3"/> : <path d="M17 7l-5 5-5-5M12 12V21"/>}
      </svg>
      {Math.abs(value)}%
    </span>
  )
}

// Modern KPI Card with glassmorphism
function KpiCard({ icon, label, value, sub, trend, isPositive, color, bgColor, delay = 0 }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div className={`kpi-card ${isVisible ? 'kpi-visible' : ''}`}>
      <div className="kpi-content">
        <div className="kpi-header">
          <div className="kpi-icon" style={{ background: bgColor, color }}>{icon}</div>
          {trend && <TrendIndicator value={trend} isPositive={isPositive} />}
        </div>
        <div className="kpi-body">
          <span className="kpi-value">{value}</span>
          <span className="kpi-label">{label}</span>
        </div>
        {sub && <small className="kpi-sub">{sub}</small>}
      </div>
      <div className="kpi-glow" style={{ background: `radial-gradient(circle at 50% 0%, ${bgColor}, transparent 70%)` }} />
    </div>
  )
}

// Chart Card with modern styling
function ChartCard({ title, subtitle, children, loading, empty, emptyIcon = '📊', emptyText = 'No data yet', action }) {
  return (
    <div className="chart-card-inner">
      <div className="chart-card-header">
        <div>
          <h2 className="chart-title">{title}</h2>
          {subtitle && <p className="chart-subtitle">{subtitle}</p>}
        </div>
        {action && <div className="chart-action">{action}</div>}
      </div>
      <div className="chart-card-body">
        {loading ? (
          <div className="chart-skeleton">
            <div className="skeleton-bar" />
            <div className="skeleton-bar" style={{ width: '80%' }} />
            <div className="skeleton-bar" style={{ width: '60%' }} />
          </div>
        ) : empty ? (
          <div className="chart-empty">
            <div className="chart-empty-icon">{emptyIcon}</div>
            <p>{emptyText}</p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}

// Period Selector Dropdown
function PeriodSelector({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const selected = PERIOD_OPTIONS.find(opt => opt.value === value)

  return (
    <div className="period-selector">
      <button
        className="period-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        {selected?.label}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isOpen ? 'rotate' : ''}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {isOpen && (
        <div className="period-dropdown">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`period-option ${value === opt.value ? 'active' : ''}`}
              onClick={() => {
                onChange(opt.value)
                setIsOpen(false)
              }}
            >
              <span className="period-option-label">{opt.label}</span>
              {value === opt.value && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
      {isOpen && <div className="period-backdrop" onClick={() => setIsOpen(false)} />}
    </div>
  )
}

// Donut/Pie Chart with Center Label
function DonutChart({ data, total, loading }) {
  const [activeIndex, setActiveIndex] = useState(null)

  if (loading) {
    return (
      <div className="donut-chart-loading">
        <div className="donut-skeleton" />
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="donut-chart-empty">
        <div className="chart-empty-icon">🍩</div>
        <p>No data available</p>
      </div>
    )
  }

  const activeData = activeIndex !== null ? data[activeIndex] : null
  const displayTotal = activeData ? activeData.value : total
  const displayLabel = activeData ? activeData.name : 'Total'

  return (
    <div className="donut-chart-wrapper">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
            animationBegin={0}
            animationDuration={800}
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                stroke="none"
                style={{
                  filter: activeIndex === index ? 'brightness(1.1)' : 'none',
                  transform: activeIndex === index ? 'scale(1.02)' : 'scale(1)',
                  transformOrigin: 'center',
                  transition: 'all 0.2s ease',
                }}
              />
            ))}
          </Pie>
          <Tooltip content={<PieTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="donut-center-label">
        <span className="donut-center-value">{displayTotal.toLocaleString()}</span>
        <span className="donut-center-text">{displayLabel}</span>
      </div>
    </div>
  )
}

// Legend for pie chart
function PieLegend({ data }) {
  return (
    <div className="pie-legend">
      {data.map((item, index) => (
        <div key={item.key} className="pie-legend-item" style={{ animationDelay: `${index * 50}ms` }}>
          <div className="pie-legend-color" style={{ background: item.color }} />
          <span className="pie-legend-label">{item.name}</span>
          <span className="pie-legend-value">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

function AdminAnalyticsPage() {
  const { token, user } = useAuth()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [period, setPeriod] = useState(30)
  const [animateCharts, setAnimateCharts] = useState(false)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setAnimateCharts(false)
    setError(null)
    try {
      const qs = period > 0 ? `?days=${period}` : ''
      const res = await fetch(`${apiBase}/api/dashboard/overview${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setDashboard(data)
      setTimeout(() => setAnimateCharts(true), 100)
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

  const fmt = (n) => (n ?? 0).toLocaleString()

  // Calculate metrics
  const total = dashboard?.total_applicants ?? 0
  const inPipeline = useMemo(() =>
    (dashboard?.by_status ?? [])
      .filter(s => !['hired', 'rejected', 'withdrawn'].includes(s.status))
      .reduce((sum, s) => sum + s.total, 0),
    [dashboard?.by_status]
  )
  const hired = dashboard?.by_status?.find(s => s.status === 'hired')?.total ?? 0
  const rejected = dashboard?.by_status?.find(s => s.status === 'rejected')?.total ?? 0

  // Conversion rates
  const conversionRate = total > 0 ? ((hired / total) * 100).toFixed(1) : 0
  const pipelineRate = total > 0 ? ((inPipeline / total) * 100).toFixed(1) : 0
  const rejectionRate = total > 0 ? ((rejected / total) * 100).toFixed(1) : 0

  // Pipeline data for donut chart
  const pipelineData = useMemo(() =>
    Object.entries(STATUS_META)
      .map(([key, meta]) => ({
        name: meta.label,
        key,
        value: dashboard?.by_status?.find((s) => s.status === key)?.total ?? 0,
        color: meta.color,
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value),
    [dashboard?.by_status]
  )

  // Pipeline donut data - show all statuses including hired and rejected
  const pipelineDonutData = useMemo(() => {
    const data = Object.entries(STATUS_META)
      .map(([key, meta]) => ({
        name: meta.label,
        key,
        value: dashboard?.by_status?.find((s) => s.status === key)?.total ?? 0,
        color: meta.color,
      }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value)

    const grandTotal = data.reduce((sum, d) => sum + d.value, 0)
    return data.map(d => ({ ...d, total: grandTotal }))
  }, [dashboard?.by_status])

  // Total for donut chart center label (sum of all statuses in the chart)
  const donutTotal = useMemo(() =>
    pipelineDonutData.reduce((sum, d) => sum + d.value, 0),
    [pipelineDonutData]
  )

  // Trend data
  const trendData = useMemo(() => {
    if (!dashboard?.monthly_trend) return []
    return dashboard.monthly_trend.map((item, index, arr) => ({
      ...item,
      trend: index > 0 ? ((item.total - arr[index - 1].total) / arr[index - 1].total * 100).toFixed(1) : 0
    }))
  }, [dashboard?.monthly_trend])

  return (
    <AdminLayout pageTitle="Analytics">
      <div className="analytics-container">
        {/* Header */}
        <div className="analytics-header">
          <div className="analytics-header-left">
            <h1 className="analytics-title">
              {getGreeting()}, {user?.name?.split(' ')[0] || 'there'}
              <span className="wave">👋</span>
            </h1>
            <p className="analytics-subtitle">Here's what's happening with your recruitment pipeline</p>
          </div>
          <div className="analytics-header-right">
            <PeriodSelector value={period} onChange={setPeriod} />
          </div>
        </div>

        {error && (
          <div className="analytics-alert">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {/* KPI Grid */}
        <div className="kpi-grid">
          <KpiCard
            icon="👥"
            label="Total Applicants"
            value={loading ? '—' : fmt(total)}
            sub={loading ? '' : `${dashboard?.recent_count ?? 0} new in last 30d`}
            trend={12.5}
            isPositive={true}
            color="#0f3d2e"
            bgColor="rgba(15,61,46,0.1)"
            delay={0}
          />
          <KpiCard
            icon="🔄"
            label="In Pipeline"
            value={loading ? '—' : fmt(inPipeline)}
            sub={loading ? '' : `${pipelineRate}% of total`}
            trend={8.3}
            isPositive={true}
            color="#2d5f8a"
            bgColor="rgba(45,95,138,0.1)"
            delay={100}
          />
          <KpiCard
            icon="✅"
            label="Hired"
            value={loading ? '—' : fmt(hired)}
            sub={loading ? '' : `${conversionRate}% conversion`}
            trend={-2.1}
            isPositive={false}
            color="#2d7a3a"
            bgColor="rgba(45,122,58,0.1)"
            delay={200}
          />
          <KpiCard
            icon="❌"
            label="Rejected"
            value={loading ? '—' : fmt(rejected)}
            sub={loading ? '' : `${rejectionRate}% of total`}
            trend={5.4}
            isPositive={false}
            color="#dc2626"
            bgColor="rgba(220,38,38,0.1)"
            delay={300}
          />
        </div>

        {/* Charts Grid */}
        <div className="charts-grid">
          {/* Monthly Trend */}
          <div className="chart-card chart-card-large">
            <ChartCard
              title="Application Trend"
              subtitle="Monthly applications over time"
              loading={loading}
              empty={!loading && !(dashboard?.monthly_trend?.length)}
              emptyText="No trend data available"
            >
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f3d2e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#0f3d2e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(226,232,240,0.6)" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v) => [v, 'Applications']}
                    cursor={{ stroke: '#0f3d2e', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#0f3d2e"
                    strokeWidth={3}
                    fill="url(#trendGradient)"
                    animationDuration={1500}
                    animationBegin={animateCharts ? 0 : 99999}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Pipeline Donut Chart */}
          <div className="chart-card">
            <div className="chart-card-inner">
              <div className="chart-card-header">
                <div>
                  <h2 className="chart-title">Status Overview</h2>
                  <p className="chart-subtitle">All applicants by status</p>
                </div>
              </div>
              <div className="chart-card-body donut-body">
                <DonutChart
                  data={pipelineDonutData}
                  total={donutTotal}
                  loading={loading}
                />
                {!loading && pipelineDonutData.length > 0 && (
                  <PieLegend data={pipelineDonutData} />
                )}
              </div>
            </div>
          </div>

          {/* Top Positions */}
          <div className="chart-card chart-card-full">
            <ChartCard
              title="Top Positions"
              subtitle="Most popular by applications"
              loading={loading}
              empty={!loading && !(dashboard?.by_position?.length)}
              emptyText="No position data available"
            >
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  layout="vertical"
                  data={(dashboard?.by_position ?? []).slice(0, 6).map((p) => ({
                    name: p.position_applied_for.length > 32
                      ? p.position_applied_for.slice(0, 29) + '…'
                      : p.position_applied_for,
                    total: p.total,
                  }))}
                  margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(226,232,240,0.6)" />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={160}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#1e293b', fontWeight: 500 }}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v) => [v, 'Applications']}
                    cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                  />
                  <Bar
                    dataKey="total"
                    radius={[0, 8, 8, 0]}
                    fill="#0f3d2e"
                    animationDuration={1500}
                    animationBegin={animateCharts ? 0 : 99999}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Application Sources */}
          <div className="chart-card chart-card-full">
            <ChartCard
              title="Application Sources"
              subtitle="Where applicants discovered openings"
              loading={loading}
              empty={!loading && !(dashboard?.by_source?.length)}
              emptyText="No source data available"
            >
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  layout="vertical"
                  data={(dashboard?.by_source ?? [])
                    .sort((a, b) => b.total - a.total)
                    .slice(0, 6)
                    .map((s) => ({
                      name: s.vacancy_source || 'Unknown',
                      total: s.total,
                    }))}
                  margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(226,232,240,0.6)" />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={130}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#1e293b', fontWeight: 500 }}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v) => [v, 'Applicants']}
                    cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                  />
                  <Bar
                    dataKey="total"
                    radius={[0, 8, 8, 0]}
                    fill="#c8a441"
                    maxBarSize={28}
                    animationDuration={1500}
                    animationBegin={animateCharts ? 0 : 99999}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>
      </div>

      <style>{`
        .analytics-container {
          padding: 0 0 2rem 0;
        }

        /* Header */
        .analytics-header {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .analytics-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 0.25rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .wave {
          display: inline-block;
          animation: wave 2s ease-in-out infinite;
        }

        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(20deg); }
          75% { transform: rotate(-10deg); }
        }

        .analytics-subtitle {
          font-size: 0.95rem;
          color: #64748b;
          margin: 0;
        }

        /* Period Selector */
        .period-selector {
          position: relative;
          z-index: 10;
        }

        .period-trigger {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1rem;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          font-size: 0.875rem;
          font-weight: 500;
          color: #0f172a;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        .period-trigger:hover {
          border-color: #cbd5e1;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }

        .period-trigger svg:last-child {
          transition: transform 0.2s;
        }

        .period-trigger svg:last-child.rotate {
          transform: rotate(180deg);
        }

        .period-dropdown {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 20px 40px -12px rgba(0,0,0,0.15);
          min-width: 180px;
          overflow: hidden;
          animation: slideIn 0.2s ease-out;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .period-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 0.75rem 1rem;
          background: transparent;
          border: none;
          font-size: 0.875rem;
          color: #334155;
          cursor: pointer;
          transition: all 0.15s;
        }

        .period-option:hover {
          background: #f8fafc;
        }

        .period-option.active {
          background: #f0fdf4;
          color: #0f3d2e;
          font-weight: 500;
        }

        .period-backdrop {
          position: fixed;
          inset: 0;
          z-index: -1;
        }

        /* Alert */
        .analytics-alert {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 12px;
          color: #dc2626;
          font-size: 0.875rem;
          margin-bottom: 1.5rem;
        }

        /* KPI Grid */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .kpi-card {
          position: relative;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 1.25rem;
          overflow: hidden;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .kpi-card.kpi-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .kpi-card:hover {
          box-shadow: 0 20px 40px -12px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }

        .kpi-content {
          position: relative;
          z-index: 1;
        }

        .kpi-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .kpi-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
        }

        .trend-indicator {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .trend-indicator.trend-up {
          background: #dcfce7;
          color: #16a34a;
        }

        .trend-indicator.trend-down {
          background: #fee2e2;
          color: #dc2626;
        }

        .kpi-body {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .kpi-value {
          font-size: 1.875rem;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.2;
        }

        .kpi-label {
          font-size: 0.875rem;
          color: #64748b;
          font-weight: 500;
        }

        .kpi-sub {
          display: block;
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: #94a3b8;
        }

        .kpi-glow {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 60%;
          opacity: 0.5;
          pointer-events: none;
        }

        /* Charts Grid */
        .charts-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 1rem;
        }

        .chart-card {
          grid-column: span 4;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
        }

        .chart-card-inner {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .chart-card-large {
          grid-column: span 8;
        }

        .chart-card-wide {
          grid-column: span 6;
        }

        .chart-card-full {
          grid-column: span 12;
        }

        .chart-card-half {
          grid-column: span 4;
        }

        @media (max-width: 1200px) {
          .chart-card { grid-column: span 6; }
          .chart-card-large { grid-column: span 12; }
          .chart-card-wide { grid-column: span 6; }
          .chart-card-full { grid-column: span 12; }
          .chart-card-half { grid-column: span 6; }
        }

        @media (max-width: 768px) {
          .chart-card,
          .chart-card-large,
          .chart-card-wide,
          .chart-card-full,
          .chart-card-half {
            grid-column: span 12;
          }
        }

        .chart-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 1.25rem 1.5rem 0.75rem;
          border-bottom: 1px solid #f1f5f9;
        }

        .chart-title {
          font-size: 1rem;
          font-weight: 600;
          color: #0f172a;
          margin: 0 0 0.25rem 0;
        }

        .chart-subtitle {
          font-size: 0.8rem;
          color: #64748b;
          margin: 0;
        }

        .chart-card-body {
          padding: 1rem 1.5rem 1.5rem;
          min-height: 200px;
          flex: 1;
        }

        /* Chart Skeleton */
        .chart-skeleton {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 1rem 0;
        }

        .skeleton-bar {
          height: 40px;
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 6px;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* Chart Empty State */
        .chart-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 1rem;
          color: #94a3b8;
        }

        .chart-empty-icon {
          font-size: 2.5rem;
          margin-bottom: 0.75rem;
          opacity: 0.5;
        }

        .chart-empty p {
          margin: 0;
          font-size: 0.875rem;
        }

        /* Donut Chart */
        .donut-body {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .donut-chart-wrapper {
          position: relative;
          width: 100%;
          height: 280px;
        }

        .donut-center-label {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          pointer-events: none;
        }

        .donut-center-value {
          display: block;
          font-size: 1.75rem;
          font-weight: 700;
          color: #0f172a;
          line-height: 1;
        }

        .donut-center-text {
          display: block;
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 0.25rem;
        }

        .donut-chart-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 280px;
        }

        .donut-skeleton {
          width: 140px;
          height: 140px;
          border-radius: 50%;
          border: 20px solid #f1f5f9;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        /* Pie Legend */
        .pie-legend {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.5rem 1rem;
          width: 100%;
          padding: 0 1rem;
        }

        .pie-legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          opacity: 0;
          animation: fadeIn 0.3s ease-out forwards;
        }

        @keyframes fadeIn {
          to { opacity: 1; }
        }

        .pie-legend-color {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .pie-legend-label {
          color: #64748b;
          font-weight: 500;
        }

        .pie-legend-value {
          color: #0f172a;
          font-weight: 600;
        }

      `}</style>
    </AdminLayout>
  )
}

export default AdminAnalyticsPage
