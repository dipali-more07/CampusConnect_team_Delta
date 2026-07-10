const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const API_BASE = import.meta.env.VITE_API_BASE_URL

import {
  ANALYTICS_STATS,
  MONTHLY_TREND_DATA,
  RADAR_DATA,
  CATEGORIES_TREND_DATA,
  DEPT_PIE_DATA
} from '../data/analyticsData'

function authHeaders() {
  const token = sessionStorage.getItem('cc_token')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'ngrok-skip-browser-warning': 'true'
  }
}

function parseJSON(res) {
  return res.json().catch(() => ({}))
}

/* ── MOCK HANDLERS ───────────────────────────────────────── */
async function mockFetchStats() {
  await new Promise(r => setTimeout(r, 200))
  return { success: true, stats: ANALYTICS_STATS }
}

async function mockFetchMonthlyTrend(tab) {
  await new Promise(r => setTimeout(r, 200))
  // Variations based on tab if needed, otherwise return base trend
  let data = [...MONTHLY_TREND_DATA]
  if (tab === 'registration') {
    data = data.map(d => ({ ...d, value: Math.round(d.value * 1.2 * 10) / 10 }))
  } else if (tab === 'attendance') {
    data = data.map(d => ({ ...d, value: Math.round(d.value * 0.95 * 10) / 10 }))
  } else if (tab === 'student') {
    data = data.map(d => ({ ...d, value: Math.round(d.value * 1.5 * 10) / 10 }))
  }
  return { success: true, trend: data }
}

async function mockFetchRadarData() {
  await new Promise(r => setTimeout(r, 200))
  return { success: true, radar: RADAR_DATA }
}

async function mockFetchCategories() {
  await new Promise(r => setTimeout(r, 200))
  return { success: true, categories: CATEGORIES_TREND_DATA }
}

async function mockFetchDeptDistribution() {
  await new Promise(r => setTimeout(r, 200))
  return { success: true, depts: DEPT_PIE_DATA }
}

/* ── REAL API HANDLERS ───────────────────────────────────── */
async function apiFetchStats() {
  try {
    const res = await fetch(`${API_BASE}/analytics/stats`, { headers: authHeaders() })
    const data = await parseJSON(res)
    if (!res.ok) return { success: false, message: data.message || 'Failed to fetch stats.' }
    return { success: true, stats: data.stats || [] }
  } catch (err) {
    console.error('[analyticsService] fetchStats error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

async function apiFetchMonthlyTrend(tab) {
  try {
    const res = await fetch(`${API_BASE}/analytics/trend?tab=${tab}`, { headers: authHeaders() })
    const data = await parseJSON(res)
    if (!res.ok) return { success: false, message: data.message || 'Failed to fetch trend.' }
    return { success: true, trend: data.trend || [] }
  } catch (err) {
    console.error('[analyticsService] fetchMonthlyTrend error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

async function apiFetchRadarData() {
  try {
    const res = await fetch(`${API_BASE}/analytics/radar`, { headers: authHeaders() })
    const data = await parseJSON(res)
    if (!res.ok) return { success: false, message: data.message || 'Failed to fetch radar data.' }
    return { success: true, radar: data.radar || [] }
  } catch (err) {
    console.error('[analyticsService] fetchRadarData error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

async function apiFetchCategories() {
  try {
    const res = await fetch(`${API_BASE}/analytics/categories`, { headers: authHeaders() })
    const data = await parseJSON(res)
    if (!res.ok) return { success: false, message: data.message || 'Failed to fetch categories.' }
    return { success: true, categories: data.categories || [] }
  } catch (err) {
    console.error('[analyticsService] fetchCategories error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

async function apiFetchDeptDistribution() {
  try {
    const res = await fetch(`${API_BASE}/analytics/departments`, { headers: authHeaders() })
    const data = await parseJSON(res)
    if (!res.ok) return { success: false, message: data.message || 'Failed to fetch departments.' }
    return { success: true, depts: data.depts || [] }
  } catch (err) {
    console.error('[analyticsService] fetchDeptDistribution error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

const analyticsService = {
  fetchStats: () =>
    USE_MOCK ? mockFetchStats() : apiFetchStats(),

  fetchMonthlyTrend: (tab) =>
    USE_MOCK ? mockFetchMonthlyTrend(tab) : apiFetchMonthlyTrend(tab),

  fetchRadarData: () =>
    USE_MOCK ? mockFetchRadarData() : apiFetchRadarData(),

  fetchCategories: () =>
    USE_MOCK ? mockFetchCategories() : apiFetchCategories(),

  fetchDeptDistribution: () =>
    USE_MOCK ? mockFetchDeptDistribution() : apiFetchDeptDistribution(),
}

export default analyticsService
