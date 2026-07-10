const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const API_BASE = import.meta.env.VITE_API_BASE_URL

import defaultResults from '../data/results.json'
import defaultEvents from '../data/events.json'

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

/* ── MOCK RESULTS ───────────────────────────────────────────── */
const MOCK_RESULTS_KEY = 'campus_connect_mock_results'

function getMockResults() {
  const local = localStorage.getItem(MOCK_RESULTS_KEY)
  if (local) {
    try { return JSON.parse(local) } catch { }
  }
  localStorage.setItem(MOCK_RESULTS_KEY, JSON.stringify(defaultResults))
  return defaultResults
}

function saveMockResults(results) {
  localStorage.setItem(MOCK_RESULTS_KEY, JSON.stringify(results))
}

const MOCK_EVENTS_KEY = 'campus_connect_mock_events'
function getMockEvents() {
  const local = localStorage.getItem(MOCK_EVENTS_KEY)
  if (local) {
    try { return JSON.parse(local) } catch { }
  }
  return defaultEvents
}

async function mockFetchResults() {
  await new Promise(r => setTimeout(r, 300))
  const results = getMockResults()
  const events = getMockEvents()

  const enriched = results.map(res => {
    const ev = events.find(e => e.id === res.eventId)
    return {
      ...res,
      eventName: ev ? ev.name : res.eventName || 'Unknown Event'
    }
  })

  return { success: true, results: enriched }
}

async function mockCreateResult(payload) {
  await new Promise(r => setTimeout(r, 300))
  const results = getMockResults()
  const newResult = {
    id: `RES${String(results.length + 1).padStart(3, '0')}`,
    ...payload
  }
  results.push(newResult)
  saveMockResults(results)
  return { success: true, result: newResult }
}

async function mockUpdateResult(id, payload) {
  await new Promise(r => setTimeout(r, 200))
  const results = getMockResults()
  const idx = results.findIndex(r => r.id === id)
  if (idx === -1) {
    return { success: false, message: 'Result not found.' }
  }
  results[idx] = { ...results[idx], ...payload }
  saveMockResults(results)
  return { success: true, result: results[idx] }
}

async function mockDeleteResult(id) {
  await new Promise(r => setTimeout(r, 200))
  const results = getMockResults()
  const filtered = results.filter(r => r.id !== id)
  if (results.length === filtered.length) {
    return { success: false, message: 'Result not found.' }
  }
  saveMockResults(filtered)
  return { success: true }
}

/* ── REAL API ────────────────────────────────────────────────── */
async function apiFetchResults() {
  try {
    const res = await fetch(`${API_BASE}/results`, {
      headers: authHeaders(),
    })
    const data = await parseJSON(res)
    if (!res.ok) {
      return { success: false, message: data.message || 'Failed to fetch results.' }
    }
    return { success: true, results: data.results || [] }
  } catch (err) {
    console.error('[resultsService] fetchResults error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

async function apiCreateResult(payload) {
  try {
    const res = await fetch(`${API_BASE}/results`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    })
    const data = await parseJSON(res)
    if (!res.ok) {
      return { success: false, message: data.message || 'Failed to create result.' }
    }
    return { success: true, result: data.result }
  } catch (err) {
    console.error('[resultsService] createResult error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

async function apiUpdateResult(id, payload) {
  try {
    const res = await fetch(`${API_BASE}/results/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    })
    const data = await parseJSON(res)
    if (!res.ok) {
      return { success: false, message: data.message || 'Failed to update result.' }
    }
    return { success: true, result: data.result }
  } catch (err) {
    console.error('[resultsService] updateResult error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

async function apiDeleteResult(id) {
  try {
    const res = await fetch(`${API_BASE}/results/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    const data = await parseJSON(res)
    if (!res.ok) {
      return { success: false, message: data.message || 'Failed to delete result.' }
    }
    return { success: true }
  } catch (err) {
    console.error('[resultsService] deleteResult error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

const resultsService = {
  fetchAll: () =>
    USE_MOCK ? mockFetchResults() : apiFetchResults(),

  create: (payload) =>
    USE_MOCK ? mockCreateResult(payload) : apiCreateResult(payload),

  update: (id, payload) =>
    USE_MOCK ? mockUpdateResult(id, payload) : apiUpdateResult(id, payload),

  delete: (id) =>
    USE_MOCK ? mockDeleteResult(id) : apiDeleteResult(id),
}

export default resultsService
