/**
 * Certificate PDF generator using HTML Canvas
 * Renders the certificate using tmpl design settings, then embeds as PDF image.
 */

/**
 * Renders a certificate on an offscreen canvas using tmpl settings.
 * Returns a base64 PNG data URL.
 */
function renderCertificateCanvas(certData, tmpl) {
  const W = 1122  // A4 landscape px @96dpi * 1.5x
  const H = 794

  const canvas = document.createElement('canvas')
  canvas.width  = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // ── Background gradient ──
  const grd = ctx.createLinearGradient(0, 0, W, H)
  grd.addColorStop(0,    tmpl.gradFrom  || '#1a1060')
  grd.addColorStop(0.45, tmpl.gradMid   || '#0f0a45')
  grd.addColorStop(1,    tmpl.gradTo    || '#0a0838')
  ctx.fillStyle = grd
  ctx.fillRect(0, 0, W, H)

  // ── Soft decorative blobs ──
  const accent = tmpl.accentColor || '#615FFF'
  const blobGrd1 = ctx.createRadialGradient(-60, -60, 10, -60, -60, 340)
  blobGrd1.addColorStop(0, hexToRgba(accent, 0.28))
  blobGrd1.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = blobGrd1
  ctx.fillRect(0, 0, W, H)

  const blobGrd2 = ctx.createRadialGradient(W + 60, H + 60, 10, W + 60, H + 60, 360)
  blobGrd2.addColorStop(0, 'rgba(0,188,125,0.18)')
  blobGrd2.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = blobGrd2
  ctx.fillRect(0, 0, W, H)

  // ── Border ──
  if (tmpl.borderStyle && tmpl.borderStyle !== 'none') {
    const lw = tmpl.borderStyle === 'thick' ? 5 : tmpl.borderStyle === 'double' ? 2 : 1.5
    const margin = 24
    ctx.strokeStyle = hexToRgba(accent, 0.8)
    ctx.lineWidth = lw
    ctx.strokeRect(margin, margin, W - margin * 2, H - margin * 2)
    if (tmpl.borderStyle === 'double') {
      ctx.strokeRect(margin + 8, margin + 8, W - (margin + 8) * 2, H - (margin + 8) * 2)
    }
  }

  const font = (tmpl.fontFamily || 'Manrope, sans-serif').split(',')[0].trim()
  const cx   = W / 2
  let  y     = 90

  // ── Logo circle ──
  if (tmpl.showLogo) {
    const r = 46
    ctx.save()
    ctx.shadowBlur  = 32
    ctx.shadowColor = hexToRgba(accent, 0.6)
    ctx.beginPath()
    ctx.arc(cx, y + r, r, 0, Math.PI * 2)
    ctx.fillStyle = accent
    ctx.fill()
    ctx.restore()

    // Graduation cap emoji fallback
    ctx.font      = `${r}px serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🎓', cx, y + r)

    y += r * 2 + 22
  }

  // ── Organisation name ──
  ctx.font         = `600 18px "${font}", sans-serif`
  ctx.fillStyle    = 'rgba(255,255,255,0.55)'
  ctx.textAlign    = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.letterSpacing = '4px'
  ctx.fillText((tmpl.org || 'State University').toUpperCase(), cx, y)
  y += 36

  // ── Title ──
  ctx.save()
  ctx.shadowBlur  = 16
  ctx.shadowColor = hexToRgba(accent, 0.4)
  ctx.font        = `800 58px "${font}", sans-serif`
  ctx.fillStyle   = '#ffffff'
  ctx.fillText(tmpl.title || 'Certificate of Participation', cx, y)
  ctx.restore()
  y += 24

  // ── Accent divider ──
  ctx.beginPath()
  ctx.moveTo(cx - 48, y)
  ctx.lineTo(cx + 48, y)
  ctx.strokeStyle = accent
  ctx.lineWidth   = 2.5
  ctx.lineCap     = 'round'
  ctx.stroke()
  y += 30

  // ── Subtitle ──
  ctx.font      = `400 20px "${font}", sans-serif`
  ctx.fillStyle = 'rgba(255,255,255,0.58)'
  ctx.fillText(tmpl.subtitle || 'This is to certify that', cx, y)
  y += 50

  // ── Student Name ──
  const nameStr = certData.userName || certData.studentName || certData.name || 'Student Name'
  ctx.save()
  ctx.font        = `800 52px "${font}", sans-serif`
  ctx.fillStyle   = '#ffffff'
  ctx.shadowBlur  = 8
  ctx.shadowColor = 'rgba(0,0,0,0.35)'
  ctx.fillText(nameStr, cx, y)
  ctx.restore()
  y += 42

  // ── Body text ──
  ctx.font      = `400 20px "${font}", sans-serif`
  ctx.fillStyle = 'rgba(255,255,255,0.58)'
  ctx.fillText(tmpl.body || 'has successfully participated in', cx, y)
  y += 40

  // ── Event name ──
  const eventStr = certData.eventName || certData.event || 'Event Name'
  ctx.font        = `700 34px "${font}", sans-serif`
  ctx.fillStyle   = hexToRgba(accent, 0.9)
  ctx.fillText(eventStr, cx, y)
  y += 50

  // ── Signatures row ──
  if (tmpl.showSignatures) {
    const lineY   = y + 10
    const leftX   = 180
    const midX    = cx
    const rightX  = W - 180
    const lineLen = 100

    ctx.strokeStyle = 'rgba(255,255,255,0.22)'
    ctx.lineWidth   = 1

    const drawSig = (xc, label, value) => {
      ctx.beginPath()
      ctx.moveTo(xc - lineLen / 2, lineY)
      ctx.lineTo(xc + lineLen / 2, lineY)
      ctx.stroke()
      if (value) {
        ctx.font      = `600 16px "${font}", sans-serif`
        ctx.fillStyle = 'rgba(255,255,255,0.75)'
        ctx.fillText(value, xc, lineY - 12)
      }
      ctx.font      = `400 14px "${font}", sans-serif`
      ctx.fillStyle = 'rgba(255,255,255,0.38)'
      ctx.fillText(label, xc, lineY + 20)
    }

    const dateStr = certData.issueDate || certData.issue_date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    drawSig(leftX,  'Event Organizer', '')
    drawSig(midX,   'Date of Issue',   dateStr)
    drawSig(rightX, 'Principal / Dean', '')
  }

  // ── Verify footer ──
  const codeStr = certData.certificate_number || certData.verifyCode || certData.certCode || certData.id || 'CC-2024'
  ctx.font      = `400 13px monospace`
  ctx.fillStyle = 'rgba(255,255,255,0.20)'
  ctx.fillText(`Verify at: ${tmpl.footer || 'campusconnect.university.edu/verify'}/${codeStr}`, cx, H - 28)

  return canvas.toDataURL('image/jpeg', 0.95)
}

/** Convert hex color + alpha to rgba() string */
function hexToRgba(hex, alpha = 1) {
  hex = (hex || '#615FFF').replace('#', '')
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('')
  const n = Number.parseInt(hex, 16)
  const r = (n >> 16) & 255
  const g = (n >> 8)  & 255
  const b = n & 255
  return `rgba(${r},${g},${b},${alpha})`
}

/**
 * Main export — builds a PDF containing the rendered canvas image.
 * @param {object} certData  – certificate record fields
 * @param {object} tmpl      – template design settings (from CertDesignerModal state)
 */
export function downloadCertificatePDF(certData = {}, tmpl = {}) {
  // Default tmpl values if not provided
  const template = {
    org:         'State University',
    title:       'Certificate of Participation',
    subtitle:    'This is to certify that',
    body:        'has successfully participated in',
    footer:      'campusconnect.university.edu/verify',
    gradFrom:    '#1a1060',
    gradMid:     '#0f0a45',
    gradTo:      '#0a0838',
    accentColor: '#615FFF',
    borderStyle: 'none',
    fontFamily:  'Manrope, sans-serif',
    showLogo:        true,
    showSignatures:  true,
    ...tmpl,
  }

  // Override title and body dynamically if this is an achievement/rank certificate
  const position = certData.position || certData.rank || certData.award_type || '';
  const certType = (certData.certificate_type || '').toLowerCase();
  const certTitle = certData.certificate_title || '';
  const rankVal = Number(certData.rank || 0);

  const isAchievement = (certType && certType !== 'participation' && certType !== 'participant') || 
    (position && 
     !position.toLowerCase().includes('participant') && 
     !position.toLowerCase().includes('participation') && 
     !position.toLowerCase().includes('completed') && 
     !position.toLowerCase().includes('n/a'));

  if (isAchievement) {
    template.title = certTitle || 'Certificate of Achievement';
    if (certType === 'winner_1st' || rankVal === 1) {
      template.body = 'has achieved 1st Place (Winner) in';
    } else if (certType === 'runner_up_2nd' || rankVal === 2) {
      template.body = 'has achieved 2nd Place (Runner Up) in';
    } else if (certType === 'runner_up_3rd' || rankVal === 3) {
      template.body = 'has achieved 3rd Place (Runner Up) in';
    } else {
      template.body = `has achieved ${position} in`;
    }
  } else if (certTitle) {
    template.title = certTitle;
  }

  const imgDataUrl = renderCertificateCanvas(certData, template)

  // Strip data:image/jpeg;base64, prefix
  const base64     = imgDataUrl.split(',')[1]
  const byteCount  = atob(base64).length

  // PDF A4 Landscape: 842 x 595 pt
  const PW = 842
  const PH = 595

  const pdfParts = []

  const hdr = '%PDF-1.4\n'
  pdfParts.push(hdr)
  let off = hdr.length

  // Helper to record offset of next object
  const offsets = {}
  const pushObj = (n, str) => {
    offsets[n] = off
    pdfParts.push(str)
    off += str.length
  }

  pushObj(1, `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`)
  pushObj(2, `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`)
  pushObj(3, `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /XObject << /Im1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n`)

  // Content stream: draw image full page
  const content = `q\n${PW} 0 0 ${PH} 0 0 cm\n/Im1 Do\nQ`
  pushObj(4, `4 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`)

  // Image XObject (JPEG)
  const imgHdr = `5 0 obj\n<< /Type /XObject /Subtype /Image /Width 1122 /Height 794 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${byteCount} >>\nstream\n`
  const imgFtr = `\nendstream\nendobj\n`

  offsets[5] = off
  pdfParts.push(imgHdr)
  off += imgHdr.length

  // Convert base64 → binary string and push as blob later
  const imgBinary = atob(base64)
  off += imgBinary.length  // track offset

  pdfParts.push(imgFtr)
  off += imgFtr.length

  // xref
  const startXref = off
  const pad = n => String(n).padStart(10, '0')
  const xref = `xref\n0 6\n0000000000 65535 f \n${pad(offsets[1])} 00000 n \n${pad(offsets[2])} 00000 n \n${pad(offsets[3])} 00000 n \n${pad(offsets[4])} 00000 n \n${pad(offsets[5])} 00000 n \n`
  pdfParts.push(xref)

  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF`
  pdfParts.push(trailer)

  // Build binary blob — mix text parts + binary image
  // Actually we need a different approach: use BlobBuilder-style with typed arrays

  // Build everything as Uint8Arrays, then concat
  const enc = s => new TextEncoder().encode(s)

  // Convert binary JPEG bytes
  const imgBytes = new Uint8Array(imgBinary.length)
  for (let i = 0; i < imgBinary.length; i++) imgBytes[i] = imgBinary.charCodeAt(i)

  // Rebuild offsets properly
  const parts = []
  let trueOff = 0
  const trueOffsets = {}

  const pushPart = (buf) => { parts.push(buf); trueOff += buf.length }
  const pushText = (s, objNum) => {
    if (objNum !== undefined) trueOffsets[objNum] = trueOff
    pushPart(enc(s))
  }

  pushText(hdr)
  pushText(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`, 1)
  pushText(`2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`, 2)
  pushText(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /XObject << /Im1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n`, 3)
  pushText(`4 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`, 4)
  pushText(imgHdr, 5)
  pushPart(imgBytes)
  pushText(imgFtr)

  const trueStartXref = trueOff
  const xrefStr = `xref\n0 6\n0000000000 65535 f \n${pad(trueOffsets[1])} 00000 n \n${pad(trueOffsets[2])} 00000 n \n${pad(trueOffsets[3])} 00000 n \n${pad(trueOffsets[4])} 00000 n \n${pad(trueOffsets[5])} 00000 n \n`
  pushText(xrefStr)
  pushText(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${trueStartXref}\n%%EOF`)

  // Merge all Uint8Arrays
  const totalLen = parts.reduce((s, p) => s + p.length, 0)
  const final    = new Uint8Array(totalLen)
  let pos = 0
  for (const p of parts) { final.set(p, pos); pos += p.length }

  const blob    = new Blob([final], { type: 'application/pdf' })
  const url     = URL.createObjectURL(blob)
  const codeStr = certData.certificate_number || certData.verifyCode || certData.certCode || certData.id || 'CC'
  const a       = document.createElement('a')
  a.href        = url
  a.download    = `Certificate-${codeStr}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 3000)

  return url
}
