const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_USE_MOCK === true
const API_BASE = import.meta.env.VITE_API_BASE_URL

import defaultCertificates from '../data/certificates.json'

function authHeaders() {
  const token = sessionStorage.getItem('cc_token')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}

function parseJSON(res) {
  return res.json().catch(() => ({}))
}

/* ── MOCK STORAGE ──────────────────────────────────────────────── */
const MOCK_CERTS_KEY = 'campus_connect_mock_certificates'

function getMockCerts() {
  const local = localStorage.getItem(MOCK_CERTS_KEY)
  if (local) { try { return JSON.parse(local) } catch {} }
  localStorage.setItem(MOCK_CERTS_KEY, JSON.stringify(defaultCertificates))
  return [...defaultCertificates]
}

function saveMockCerts(certs) {
  localStorage.setItem(MOCK_CERTS_KEY, JSON.stringify(certs))
}

/* ── MOCK FUNCTIONS ────────────────────────────────────────────── */
async function mockFetchAll() {
  await new Promise(r => setTimeout(r, 300))
  const certs = getMockCerts()
  const total = certs.length
  const pending = certs.filter(c => c.status === 'Pending').length
  const generatedSent = certs.filter(c => c.status === 'Generated' || c.status === 'Sent').length
  return {
    success: true,
    certificates: certs,
    stats: {
      total,
      pending,
      generatedSent,
    }
  }
}

async function mockGenerate(ids) {
  await new Promise(r => setTimeout(r, 600))
  const certs = getMockCerts()
  const updated = certs.map(c =>
    ids.includes(c.id) && c.status === 'Pending'
      ? { ...c, status: 'Generated', issuedDate: new Date().toISOString().split('T')[0] }
      : c
  )
  saveMockCerts(updated)
  return { success: true, updated: ids.length, message: `${ids.length} certificate(s) generated.` }
}

async function mockBulkGenerate(eventId) {
  await new Promise(r => setTimeout(r, 800))
  const certs = getMockCerts()
  let count = 0
  const updated = certs.map(c => {
    const match = (!eventId || eventId === 'ALL' || c.eventId === eventId) && c.status === 'Pending'
    if (match) { count++; return { ...c, status: 'Generated', issuedDate: new Date().toISOString().split('T')[0] } }
    return c
  })
  saveMockCerts(updated)
  return { success: true, generated: count, message: `Bulk generated ${count} certificate(s).` }
}

async function mockSend(ids) {
  await new Promise(r => setTimeout(r, 500))
  const certs = getMockCerts()
  const updated = certs.map(c =>
    ids.includes(c.id) && c.status === 'Generated'
      ? { ...c, status: 'Sent' }
      : c
  )
  saveMockCerts(updated)
  return { success: true, sent: ids.length, message: `${ids.length} certificate(s) sent via email.` }
}

async function mockRevoke(id) {
  await new Promise(r => setTimeout(r, 400))
  const certs = getMockCerts()
  const idx = certs.findIndex(c => c.id === id)
  if (idx === -1) return { success: false, message: 'Certificate not found.' }
  certs[idx].status = 'Pending'
  saveMockCerts(certs)
  return { success: true, message: 'Certificate revoked successfully.' }
}

async function mockVerify(verifyCode) {
  await new Promise(r => setTimeout(r, 350))
  const certs = getMockCerts()
  const cert = certs.find(c => c.verifyCode === verifyCode)
  if (!cert) return { success: false, valid: false, message: 'Certificate not found or invalid.' }
  return { success: true, valid: true, certificate: cert }
}

/* ── REAL API FUNCTIONS ────────────────────────────────────────── */
async function apiFetchAll() {
  try {
    const res = await fetch(`${API_BASE}/certificates`, { headers: authHeaders() })
    const data = await parseJSON(res)
    if (!res.ok) return { success: false, message: data.message || 'Failed to fetch certificates.' }
    return { success: true, certificates: data.certificates || [], stats: data.stats || {} }
  } catch (err) {
    console.error('[certificatesService] fetchAll error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

async function apiGenerate(ids) {
  try {
    const res = await fetch(`${API_BASE}/certificates/generate`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ ids }),
    })
    const data = await parseJSON(res)
    if (!res.ok) return { success: false, message: data.message || 'Failed to generate certificates.' }
    return { success: true, updated: data.updated, message: data.message }
  } catch (err) {
    console.error('[certificatesService] generate error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

async function apiBulkGenerate(eventId) {
  try {
    const res = await fetch(`${API_BASE}/certificates/bulk-generate`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ eventId }),
    })
    const data = await parseJSON(res)
    if (!res.ok) return { success: false, message: data.message || 'Failed to bulk generate.' }
    return { success: true, generated: data.generated, message: data.message }
  } catch (err) {
    console.error('[certificatesService] bulkGenerate error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

async function apiSend(ids) {
  try {
    const res = await fetch(`${API_BASE}/certificates/send`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ ids }),
    })
    const data = await parseJSON(res)
    if (!res.ok) return { success: false, message: data.message || 'Failed to send certificates.' }
    return { success: true, sent: data.sent, message: data.message }
  } catch (err) {
    console.error('[certificatesService] send error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

async function apiRevoke(id) {
  try {
    const res = await fetch(`${API_BASE}/certificates/${id}/revoke`, {
      method: 'PUT',
      headers: authHeaders(),
    })
    const data = await parseJSON(res)
    if (!res.ok) return { success: false, message: data.message || 'Failed to revoke certificate.' }
    return { success: true, message: data.message }
  } catch (err) {
    console.error('[certificatesService] revoke error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

async function apiVerify(verifyCode) {
  try {
    const res = await fetch(`${API_BASE}/certificates/verify/${verifyCode}`, { headers: authHeaders() })
    const data = await parseJSON(res)
    if (!res.ok) return { success: false, valid: false, message: data.message || 'Verification failed.' }
    return { success: true, valid: data.valid, certificate: data.certificate }
  } catch (err) {
    console.error('[certificatesService] verify error:', err)
    return { success: false, message: 'Server unreachable.' }
  }
}

/* ── SERVICE EXPORT ────────────────────────────────────────────── */
const certificatesService = {
  fetchAll: () =>
    USE_MOCK ? mockFetchAll() : apiFetchAll(),

  generate: (ids) =>
    USE_MOCK ? mockGenerate(ids) : apiGenerate(ids),

  bulkGenerate: (eventId) =>
    USE_MOCK ? mockBulkGenerate(eventId) : apiBulkGenerate(eventId),

  send: (ids) =>
    USE_MOCK ? mockSend(ids) : apiSend(ids),

  revoke: (id) =>
    USE_MOCK ? mockRevoke(id) : apiRevoke(id),

  verify: (verifyCode) =>
    USE_MOCK ? mockVerify(verifyCode) : apiVerify(verifyCode),
}

export default certificatesService
