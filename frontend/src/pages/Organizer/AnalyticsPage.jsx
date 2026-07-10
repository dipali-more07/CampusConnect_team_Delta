import { useState, useEffect } from 'react'
import {
  FileText,
  FileSpreadsheet,
  Download,
  Loader2,
} from 'lucide-react'
import analyticsService from '../../services/analyticsService'
import { BRAND as DEFAULT_BRAND } from '../../data/dashboardData'

// Sub-components
import AnalyticsStats from '../../components/admin/adminAnalytics/AnalyticsStats'
import AnalyticsTrendChart from '../../components/admin/adminAnalytics/AnalyticsTrendChart'
import AnalyticsRadarChart from '../../components/admin/adminAnalytics/AnalyticsRadarChart'
import AnalyticsCategoriesChart from '../../components/admin/adminAnalytics/AnalyticsCategoriesChart'
import AnalyticsDeptChart from '../../components/admin/adminAnalytics/AnalyticsDeptChart'

export default function AnalyticsPage({ tokens }) {
  const { dark } = tokens
  const BRAND = tokens?.brand || DEFAULT_BRAND
  
  const [activeTab, setActiveTab] = useState('event')
  const [stats, setStats] = useState([])
  const [trendData, setTrendData] = useState([])
  const [radarData, setRadarData] = useState([])
  const [categories, setCategories] = useState([])
  const [depts, setDepts] = useState([])
  const [hoveredDept, setHoveredDept] = useState(null)

  const [loading, setLoading] = useState(true)
  const [trendLoading, setTrendLoading] = useState(false)

  // ── styles based on tokens ──
  const card = { background: tokens.card, borderColor: tokens.border, boxShadow: tokens.shadow }
  const label = { color: tokens.txtSec }
  const inp = { background: tokens.inputBg, borderColor: tokens.border, color: tokens.txtPri }

  const loadData = async () => {
    setLoading(true)
    const [statsRes, radarRes, catRes, deptRes] = await Promise.all([
      analyticsService.fetchStats(),
      analyticsService.fetchRadarData(),
      analyticsService.fetchCategories(),
      analyticsService.fetchDeptDistribution()
    ])

    if (statsRes.success) setStats(statsRes.stats)
    if (radarRes.success) setRadarData(radarRes.radar)
    if (catRes.success) setCategories(catRes.categories)
    if (deptRes.success) setDepts(deptRes.depts)
    setLoading(false)
  }

  const loadTrend = async (tab) => {
    setTrendLoading(true)
    const res = await analyticsService.fetchMonthlyTrend(tab)
    if (res.success) setTrendData(res.trend)
    setTrendLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadTrend(activeTab)
  }, [activeTab])

  // ── CSV Export ──
  const handleExport = (type) => {
    let headers = ''
    let rows = []
    let filename = `analytics_report_${activeTab}`

    if (activeTab === 'event') {
      headers = 'Category,Count,Percentage\n'
      rows = categories.map(c => `"${c.name}",${c.count},${c.percentage}%`)
    } else {
      headers = 'Department,Count,Percentage\n'
      rows = depts.map(d => `"${d.dept}",${d.count},${d.percentage}%`)
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + headers + rows.join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `${filename}.${type === 'csv' ? 'csv' : type === 'excel' ? 'xls' : 'txt'}`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="p-6 space-y-6">
      
      {/* ── HEADER ROW ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold text-slate-900 dark:text-slate-100 m-0 tracking-tight">Analytics</h1>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1">Advanced insights and performance metrics</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold border cursor-pointer transition-all"
            style={inp}
          >
            <FileText size={13} className="text-red-500" /> PDF
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold border cursor-pointer transition-all"
            style={inp}
          >
            <FileSpreadsheet size={13} className="text-emerald-500" /> Excel
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold border cursor-pointer transition-all"
            style={inp}
          >
            <Download size={13} style={{ color: BRAND }} /> CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-[400px] flex items-center justify-center">
          <Loader2 className="animate-spin text-slate-400" size={32} />
        </div>
      ) : (
        <>
          {/* ── STATS ROW (6 Cards) ── */}
          <AnalyticsStats stats={stats} cardStyle={card} label={label} />

          {/* ── CHARTS ROW 1 ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            
            {/* Left Card: Monthly Trend */}
            <AnalyticsTrendChart
              trendLoading={trendLoading}
              trendData={trendData}
              dark={dark}
              label={label}
              cardStyle={card}
            />

            {/* Right Card: Engagement Radar */}
            <AnalyticsRadarChart
              radarData={radarData}
              dark={dark}
              BRAND={BRAND}
              cardStyle={card}
            />

          </div>

          {/* ── CHARTS ROW 2 ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left: Event Categories Breakdown */}
            <AnalyticsCategoriesChart
              categories={categories}
              dark={dark}
              label={label}
              cardStyle={card}
            />

            {/* Right: Department Distribution */}
            <AnalyticsDeptChart
              depts={depts}
              hoveredDept={hoveredDept}
              setHoveredDept={setHoveredDept}
              tokens={tokens}
              cardStyle={card}
            />

          </div>
        </>
      )}

    </div>
  )
}
