/**
 * analyticsExport.js
 * Comprehensive export utilities for PDF, Excel, and CSV reports on the Analytics page.
 * PDF is directly downloaded as a .pdf file without opening browser print dialog.
 */

// Helper to draw rounded rectangle on Canvas
function drawRoundRect(ctx, x, y, w, h, r, fillStyle, strokeStyle, lineWidth = 1) {
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
  if (fillStyle) {
    ctx.fillStyle = fillStyle
    ctx.fill()
  }
  if (strokeStyle) {
    ctx.lineWidth = lineWidth
    ctx.strokeStyle = strokeStyle
    ctx.stroke()
  }
  ctx.restore()
}

// Convert canvas to valid PDF binary buffer and trigger download
function downloadCanvasAsPdf(canvas, filename) {
  const dataUrl = canvas.toDataURL('image/jpeg', 0.95)
  const base64 = dataUrl.split(',')[1]
  const imgBinary = atob(base64)
  const byteCount = imgBinary.length

  const W = canvas.width
  const H = canvas.height

  // A4 standard points (portrait)
  const PW = 595.28
  const PH = Math.round((H / W) * PW * 100) / 100

  const enc = s => new TextEncoder().encode(s)
  const imgBytes = new Uint8Array(imgBinary.length)
  for (let i = 0; i < imgBinary.length; i++) {
    imgBytes[i] = imgBinary.codePointAt(i)
  }

  const parts = []
  let trueOff = 0
  const trueOffsets = {}

  const pushPart = (buf) => { parts.push(buf); trueOff += buf.length }
  const pushText = (s, objNum) => {
    if (objNum !== undefined) trueOffsets[objNum] = trueOff
    pushPart(enc(s))
  }

  const hdr = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'
  const content = `q\n${PW} 0 0 ${PH} 0 0 cm\n/Im1 Do\nQ`
  const imgHdr = `5 0 obj\n<< /Type /XObject /Subtype /Image /Width ${W} /Height ${H} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${byteCount} >>\nstream\n`
  const imgFtr = `\nendstream\nendobj\n`

  pushText(hdr)
  pushText(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`, 1)
  pushText(`2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`, 2)
  pushText(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /XObject << /Im1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n`, 3)
  pushText(`4 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`, 4)
  pushText(imgHdr, 5)
  pushPart(imgBytes)
  pushText(imgFtr)

  const pad = n => String(n).padStart(10, '0')
  const trueStartXref = trueOff
  const xrefStr = `xref\n0 6\n0000000000 65535 f \n${pad(trueOffsets[1])} 00000 n \n${pad(trueOffsets[2])} 00000 n \n${pad(trueOffsets[3])} 00000 n \n${pad(trueOffsets[4])} 00000 n \n${pad(trueOffsets[5])} 00000 n \n`
  pushText(xrefStr)
  pushText(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${trueStartXref}\n%%EOF`)

  const totalLen = parts.reduce((s, p) => s + p.length, 0)
  const final = new Uint8Array(totalLen)
  let pos = 0
  for (const p of parts) {
    final.set(p, pos)
    pos += p.length
  }

  const blob = new Blob([final], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

/* ──────────────────────────────────────────────────────────────────────────
   1. PDF DIRECT DOWNLOAD (Rendered on High-Res Canvas -> PDF File)
────────────────────────────────────────────────────────────────────────── */
export function exportAnalyticsToPdf({
  stats = [],
  trendData = [],
  categories = [],
  depts = [],
  radarData = [],
  activeTab = 'event'
}) {
  const W = 1200
  const H = 1680

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // Background
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, W, H)

  // Top Accent Bar
  const grad = ctx.createLinearGradient(0, 0, W, 0)
  grad.addColorStop(0, '#615FFF')
  grad.addColorStop(0.5, '#7C3AED')
  grad.addColorStop(1, '#00BC7D')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, 10)

  // Header Area
  const dateStr = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })

  ctx.fillStyle = '#615FFF'
  ctx.font = 'bold 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('CampusConnect', 48, 64)

  ctx.fillStyle = '#0F172A'
  ctx.font = '800 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('Analytics & Performance Report', 48, 98)

  ctx.fillStyle = '#64748B'
  ctx.font = '500 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('Comprehensive dashboard metrics, participation & trend insights', 48, 122)

  // Right Header Meta
  ctx.textAlign = 'right'
  ctx.fillStyle = '#334155'
  ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText(`Generated: ${dateStr}`, W - 48, 68)

  ctx.fillStyle = '#64748B'
  ctx.font = '500 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText(`Scope: ${activeTab === 'event' ? 'Event Analytics' : 'Department Analytics'}`, W - 48, 92)
  ctx.textAlign = 'left'

  // Header separator line
  ctx.strokeStyle = '#E2E8F0'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(48, 144)
  ctx.lineTo(W - 48, 144)
  ctx.stroke()

  // ── SECTION 1: EXECUTIVE KPI SUMMARY ──
  ctx.fillStyle = '#0F172A'
  ctx.font = '800 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('1. EXECUTIVE SUMMARY KPIS', 48, 180)

  const cardW = 345
  const cardH = 92
  const startY = 200

  stats.slice(0, 6).forEach((s, idx) => {
    const col = idx % 3
    const row = Math.floor(idx / 3)
    const x = 48 + col * (cardW + 34)
    const y = startY + row * (cardH + 16)

    // Card Box
    drawRoundRect(ctx, x, y, cardW, cardH, 10, '#F8FAFC', '#E2E8F0', 1.5)

    // Title
    ctx.fillStyle = '#64748B'
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText((s.title || s.label || 'METRIC').toUpperCase(), x + 16, y + 26)

    // Value
    ctx.fillStyle = s.color || '#0F172A'
    ctx.font = '800 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText(String(s.value || '0'), x + 16, y + 56)

    // Subtext / Trend
    ctx.fillStyle = '#059669'
    ctx.font = '600 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ctx.fillText(String(s.sub || s.change || ''), x + 16, y + 78)
  })

  // ── SECTION 2 & 3: MONTHLY TRENDS & DEPARTMENT DISTRIBUTION ──
  const sec2Y = 440
  const halfW = 530

  // Left Title
  ctx.fillStyle = '#0F172A'
  ctx.font = '800 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('2. MONTHLY PERFORMANCE TRENDS', 48, sec2Y)

  // Right Title
  ctx.fillText('3. DEPARTMENT DISTRIBUTION', 48 + halfW + 44, sec2Y)

  // Draw Left Table (Monthly Trends)
  const drawTable = (startX, startTableY, width, headers, rows) => {
    const rowH = 34
    // Header row
    drawRoundRect(ctx, startX, startTableY, width, rowH, 6, '#F1F5F9', '#CBD5E1', 1)
    ctx.fillStyle = '#334155'
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

    headers.forEach((h, i) => {
      const posX = i === 0 ? startX + 16 : startX + width - 16
      ctx.textAlign = i === 0 ? 'left' : 'right'
      ctx.fillText(h, posX, startTableY + 22)
    })
    ctx.textAlign = 'left'

    // Data rows
    rows.forEach((r, idx) => {
      const curY = startTableY + (idx + 1) * rowH
      const bg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'
      drawRoundRect(ctx, startX, curY, width, rowH, 0, bg, '#E2E8F0', 1)

      ctx.fillStyle = '#1E293B'
      ctx.font = '500 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ctx.fillText(String(r[0] || '-'), startX + 16, curY + 22)

      ctx.textAlign = 'right'
      ctx.fillStyle = '#0F172A'
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ctx.fillText(String(r[1] || '0'), startX + width - 16, curY + 22)
      ctx.textAlign = 'left'
    })
  }

  const trendRows = trendData.slice(0, 8).map(t => [t.month || t.name || '', t.value ?? t.count ?? '0'])
  drawTable(48, sec2Y + 16, halfW, ['Month', 'Trend Score / Value'], trendRows)

  const deptRows = depts.slice(0, 8).map(d => [d.dept || d.name || '', `${d.percentage ?? 0}%`])
  drawTable(48 + halfW + 44, sec2Y + 16, halfW, ['Department Name', 'Participation Share'], deptRows)

  // ── SECTION 4 & 5: CATEGORIES BREAKDOWN & ENGAGEMENT RADAR ──
  const sec3Y = 820

  ctx.fillStyle = '#0F172A'
  ctx.font = '800 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('4. EVENT CATEGORIES BREAKDOWN', 48, sec3Y)
  ctx.fillText('5. ENGAGEMENT RADAR METRICS', 48 + halfW + 44, sec3Y)

  // Custom 3-column table for categories
  const draw3ColTable = (startX, startTableY, width, headers, rows) => {
    const rowH = 34
    drawRoundRect(ctx, startX, startTableY, width, rowH, 6, '#F1F5F9', '#CBD5E1', 1)
    ctx.fillStyle = '#334155'
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'

    ctx.fillText(headers[0], startX + 16, startTableY + 22)
    ctx.textAlign = 'center'
    ctx.fillText(headers[1], startX + width * 0.55, startTableY + 22)
    ctx.textAlign = 'right'
    ctx.fillText(headers[2], startX + width - 16, startTableY + 22)
    ctx.textAlign = 'left'

    rows.forEach((r, idx) => {
      const curY = startTableY + (idx + 1) * rowH
      const bg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'
      drawRoundRect(ctx, startX, curY, width, rowH, 0, bg, '#E2E8F0', 1)

      ctx.fillStyle = '#1E293B'
      ctx.font = '500 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ctx.fillText(String(r[0] || '-'), startX + 16, curY + 22)

      ctx.textAlign = 'center'
      ctx.fillStyle = '#615FFF'
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ctx.fillText(String(r[1] ?? '0'), startX + width * 0.55, curY + 22)

      ctx.textAlign = 'right'
      ctx.fillStyle = '#00BC7D'
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ctx.fillText(String(r[2] ?? '0'), startX + width - 16, curY + 22)
      ctx.textAlign = 'left'
    })
  }

  const catRows = categories.slice(0, 8).map(c => [
    c.name || c.month || '',
    c.events ?? c.workshops ?? 0,
    c.registrations ?? c.seminars ?? 0
  ])
  draw3ColTable(48, sec3Y + 16, halfW, ['Category', 'Events', 'Registrations'], catRows)

  const radarRows = radarData.slice(0, 8).map(r => [r.axis || r.subject || '', `${r.value ?? 0} / 100`])
  drawTable(48 + halfW + 44, sec3Y + 16, halfW, ['Dimension / Metric', 'Score'], radarRows)

  // ── FOOTER ──
  ctx.strokeStyle = '#E2E8F0'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(48, H - 70)
  ctx.lineTo(W - 48, H - 70)
  ctx.stroke()

  ctx.fillStyle = '#94A3B8'
  ctx.font = '500 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillText('CampusConnect Analytics Report • Confidential & Proprietary', 48, H - 42)

  ctx.textAlign = 'right'
  ctx.fillText(`Generated on ${new Date().toLocaleDateString()}`, W - 48, H - 42)
  ctx.textAlign = 'left'

  // Convert & Download
  const filename = `CampusConnect_Analytics_Report_${new Date().toISOString().split('T')[0]}.pdf`
  downloadCanvasAsPdf(canvas, filename)
}

/* ──────────────────────────────────────────────────────────────────────────
   2. EXCEL WORKBOOK EXPORT (.xls)
────────────────────────────────────────────────────────────────────────── */
export function exportAnalyticsToExcel({
  stats = [],
  trendData = [],
  categories = [],
  depts = [],
  radarData = [],
  activeTab = 'event'
}) {
  const dateStr = new Date().toLocaleString()

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Calibri, Arial, sans-serif; padding: 20px; }
        .title { color: #615FFF; font-size: 18px; font-weight: bold; }
        .sub-header { font-size: 12px; color: #64748b; margin-bottom: 20px; }
        .section-title { background-color: #f1f5f9; color: #0f172a; font-weight: bold; font-size: 13px; padding: 8px; border-bottom: 2px solid #615FFF; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 25px; }
        th { background-color: #f8fafc; color: #334155; font-weight: bold; border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
        td { border: 1px solid #e2e8f0; padding: 8px 12px; font-size: 13px; color: #1e293b; }
        .num { text-align: right; }
      </style>
    </head>
    <body>
      <div class="title">CampusConnect - Analytics & Performance Report</div>
      <p class="sub-header">Generated on: ${dateStr} | Scope: ${activeTab === 'event' ? 'Event Analytics' : 'Department Analytics'}</p>

      <h3 class="section-title">1. Executive Summary KPIs</h3>
      <table>
        <thead>
          <tr>
            <th>KPI / Metric</th>
            <th>Value</th>
            <th>Trend / Details</th>
          </tr>
        </thead>
        <tbody>
          ${stats.map(s => `
            <tr>
              <td><strong>${s.title || s.label || ''}</strong></td>
              <td class="num"><strong>${s.value || ''}</strong></td>
              <td>${s.sub || s.change || ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h3 class="section-title">2. Monthly Performance Trends</h3>
      <table>
        <thead>
          <tr>
            <th>Month</th>
            <th class="num">Trend Value</th>
          </tr>
        </thead>
        <tbody>
          ${trendData.map(t => `
            <tr>
              <td>${t.month || t.name || ''}</td>
              <td class="num">${t.value ?? t.count ?? ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h3 class="section-title">3. Event Categories Breakdown</h3>
      <table>
        <thead>
          <tr>
            <th>Category / Month</th>
            <th class="num">Events / Workshops</th>
            <th class="num">Registrations / Seminars</th>
          </tr>
        </thead>
        <tbody>
          ${categories.map(c => `
            <tr>
              <td>${c.name || c.month || ''}</td>
              <td class="num">${c.events ?? c.workshops ?? 0}</td>
              <td class="num">${c.registrations ?? c.seminars ?? 0}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h3 class="section-title">4. Department Distribution</h3>
      <table>
        <thead>
          <tr>
            <th>Department</th>
            <th class="num">Percentage (%)</th>
            <th class="num">Participants Count</th>
          </tr>
        </thead>
        <tbody>
          ${depts.map(d => `
            <tr>
              <td>${d.dept || d.name || ''}</td>
              <td class="num">${d.percentage ?? 0}%</td>
              <td class="num">${d.count ?? '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h3 class="section-title">5. Engagement Radar Scores</h3>
      <table>
        <thead>
          <tr>
            <th>Metric / Dimension</th>
            <th class="num">Score (0 - 100)</th>
          </tr>
        </thead>
        <tbody>
          ${radarData.map(r => `
            <tr>
              <td>${r.axis || r.subject || ''}</td>
              <td class="num">${r.value ?? ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `CampusConnect_Analytics_Report_${new Date().toISOString().split('T')[0]}.xls`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/* ──────────────────────────────────────────────────────────────────────────
   3. CSV REPORT EXPORT (.csv)
────────────────────────────────────────────────────────────────────────── */
export function exportAnalyticsToCsv({
  stats = [],
  trendData = [],
  categories = [],
  depts = [],
  radarData = [],
  activeTab = 'event'
}) {
  const dateStr = new Date().toLocaleString()
  const lines = [
    `"CAMPUSCONNECT ANALYTICS REPORT"`,
    `"Generated at:","${dateStr}"`,
    `"Active View:","${activeTab === 'event' ? 'Event Analytics' : 'Department Analytics'}"`,
    ``,
    `"--- 1. EXECUTIVE KPI SUMMARY ---"`,
    `"Metric","Value","Details"`,
    ...stats.map(s => `"${s.title || s.label || ''}","${s.value || ''}","${s.sub || s.change || ''}"`),
    ``,
    `"--- 2. MONTHLY PERFORMANCE TRENDS ---"`,
    `"Month","Value"`,
    ...trendData.map(t => `"${t.month || t.name || ''}","${t.value ?? t.count ?? ''}"`),
    ``,
    `"--- 3. EVENT CATEGORIES BREAKDOWN ---"`,
    `"Category / Month","Events / Workshops","Registrations / Seminars"`,
    ...categories.map(c => `"${c.name || c.month || ''}","${c.events ?? c.workshops ?? 0}","${c.registrations ?? c.seminars ?? 0}"`),
    ``,
    `"--- 4. DEPARTMENT DISTRIBUTION ---"`,
    `"Department","Percentage (%)","Count"`,
    ...depts.map(d => `"${d.dept || d.name || ''}","${d.percentage ?? 0}%","${d.count ?? ''}"`),
    ``,
    `"--- 5. ENGAGEMENT METRICS ---"`,
    `"Metric / Axis","Score (out of 100)"`,
    ...radarData.map(r => `"${r.axis || r.subject || ''}","${r.value ?? ''}"`)
  ]

  const csvContent = '\uFEFF' + lines.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `CampusConnect_Analytics_Report_${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
