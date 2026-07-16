const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const API_BASE = import.meta.env.VITE_API_BASE_URL
import { fetchWithAuth } from '../utils/apiClient'

import defaultResults from '../data/results.json'
import defaultEvents from '../data/events.json'

function authHeaders() {
  const token = sessionStorage.getItem('cc_token') || sessionStorage.getItem('token') || ''
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

async function mockFetchResultsByEvent(eventId) {
  await new Promise(r => setTimeout(r, 300))
  const results = getMockResults()
  const events = getMockEvents()

  const eventResults = results.filter(r => r.eventId === eventId)
  const enriched = eventResults.map(res => {
    const ev = events.find(e => e.id === res.eventId)
    return {
      ...res,
      eventName: ev ? ev.name : res.eventName || 'Unknown Event'
    }
  })

  return { success: true, results: enriched }
}

/* ── REAL API ────────────────────────────────────────────────── */
async function apiFetchResults() {
  try {
    const res = await fetchWithAuth(`${API_BASE}/results`, { method: 'GET' })
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

async function apiFetchResultsByEvent(eventId) {
  try {
    const res = await fetchWithAuth(`${API_BASE}/results/event/${eventId}`, { method: 'GET' })
    const data = await parseJSON(res)
    if (!res.ok) {
      return { success: false, message: data.message || 'Failed to fetch event results.' }
    }
    return { success: true, results: data.results || data.data || data || [] }
  } catch (err) {
    console.error('[resultsService] fetchResultsByEvent error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

/* ── REAL API DECLARE ────────────────────────────────────────── */
async function apiDeclareResult(payload) {
  try {
    const res = await fetchWithAuth(`${API_BASE}/results/declare`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { success: false, message: data.message || data.detail || 'Failed to declare result.' }
    }
    return { success: true, result: data.data || data.result || data }
  } catch (err) {
    console.error('[resultsService] declareResult error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

async function mockDeclareResult(payload) {
  await new Promise(r => setTimeout(r, 300))
  const results = getMockResults()
  const newResult = {
    id: `RES${String(results.length + 1).padStart(3, '0')}`,
    eventId: payload.event_id,
    participantId: payload.participant_id || null,
    teamId: payload.team_id || null,
    type: payload.team_id ? 'Team' : 'Solo',
    rank: payload.rank,
    score: payload.score ?? '',
    resultTitle: `${payload.rank === 1 ? '1st' : payload.rank === 2 ? '2nd' : payload.rank === 3 ? '3rd' : payload.rank + 'th'} Rank`,
    date: new Date().toISOString().split('T')[0],
  }
  results.push(newResult)
  saveMockResults(results)
  return { success: true, result: newResult }
}

const resultsService = {
  fetchAll: () =>
    USE_MOCK ? mockFetchResults() : apiFetchResults(),

  fetchByEventId: (eventId) =>
    USE_MOCK ? mockFetchResultsByEvent(eventId) : apiFetchResultsByEvent(eventId),

  create: (payload) =>
    USE_MOCK ? mockCreateResult(payload) : apiCreateResult(payload),

  declare: (payload) =>
    USE_MOCK ? mockDeclareResult(payload) : apiDeclareResult(payload),

  update: (id, payload) =>
    USE_MOCK ? mockUpdateResult(id, payload) : apiUpdateResult(id, payload),

  delete: (id) =>
    USE_MOCK ? mockDeleteResult(id) : apiDeleteResult(id),
}

export default resultsService
