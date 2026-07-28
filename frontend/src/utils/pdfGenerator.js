/**
 * Utility for generating and downloading 100% valid PDF Certificate files
 */

export function downloadCertificatePDF(certData = {}) {
  const nameStr = certData.userName || certData.studentName || certData.name || certData.user?.name || 'Arjun Sharma'
  const eventStr = certData.eventName || certData.event || certData.eventTitle || certData.title || 'CampusConnect Event'
  const codeStr = certData.certificate_number || certData.verifyCode || certData.id || certData.verify_code || 'CC-2024-8901'
  const dateStr = certData.issueDate || certData.issue_date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const position = certData.position || certData.achievement || certData.type || 'Participation & Achievement'

  const sanitize = (str) => String(str).replace(/[\\()]/g, '\\$&')

  const contentStream = `
q
0.09 0.24 0.82 RG
4 w
20 20 752 572 re S
1.5 w
26 26 740 560 re S
0.09 0.24 0.82 rg
BT
/F1 26 Tf
210 520 Td
(CAMPUS CONNECT CERTIFICATE) Tj
ET
0.4 0.4 0.4 rg
BT
/F2 13 Tf
290 475 Td
(THIS IS PROUDLY PRESENTED TO) Tj
ET
0.09 0.24 0.82 rg
BT
/F1 24 Tf
230 425 Td
(${sanitize(nameStr)}) Tj
ET
0.3 0.3 0.3 rg
BT
/F2 12 Tf
200 375 Td
(For successful completion & achievement in) Tj
ET
0.1 0.1 0.1 rg
BT
/F1 18 Tf
210 335 Td
(${sanitize(eventStr)}) Tj
ET
0.3 0.3 0.3 rg
BT
/F2 11 Tf
250 295 Td
(Role / Position: ${sanitize(position)}) Tj
ET
0.4 0.4 0.4 rg
BT
/F2 10 Tf
100 220 Td
(Issue Date: ${sanitize(dateStr)}) Tj
ET
BT
/F2 10 Tf
480 220 Td
(Verification ID: ${sanitize(codeStr)}) Tj
ET
0.09 0.24 0.82 RG
1 w
100 170 m 240 170 l S
480 170 m 620 170 l S
0.4 0.4 0.4 rg
BT
/F2 9 Tf
125 155 Td
(Authorized Signatory) Tj
ET
BT
/F2 9 Tf
505 155 Td
(CampusConnect Official Seal) Tj
ET
Q
`.trim()

  const pdfParts = []
  const header = `%PDF-1.4\n`
  pdfParts.push(header)
  let offset = header.length

  const obj1 = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`
  const offset1 = offset
  pdfParts.push(obj1)
  offset += obj1.length

  const obj2 = `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`
  const offset2 = offset
  pdfParts.push(obj2)
  offset += obj2.length

  const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 792 612] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n`
  const offset3 = offset
  pdfParts.push(obj3)
  offset += obj3.length

  const obj4 = `4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n`
  const offset4 = offset
  pdfParts.push(obj4)
  offset += obj4.length

  const obj5 = `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`
  const offset5 = offset
  pdfParts.push(obj5)
  offset += obj5.length

  const streamLen = Uint8Array.from(contentStream, c => c.charCodeAt(0)).length
  const obj6 = `6 0 obj\n<< /Length ${streamLen} >>\nstream\n${contentStream}\nendstream\nendobj\n`
  const offset6 = offset
  pdfParts.push(obj6)
  offset += obj6.length

  const startXref = offset
  const pad = (n) => String(n).padStart(10, '0')
  const xref = `xref\n0 7\n0000000000 65535 f \n${pad(offset1)} 00000 n \n${pad(offset2)} 00000 n \n${pad(offset3)} 00000 n \n${pad(offset4)} 00000 n \n${pad(offset5)} 00000 n \n${pad(offset6)} 00000 n \n`
  pdfParts.push(xref)

  const trailer = `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF`
  pdfParts.push(trailer)

  const fullPdfString = pdfParts.join('')
  const buffer = Uint8Array.from(fullPdfString, c => c.charCodeAt(0))
  const blob = new Blob([buffer], { type: 'application/pdf' })

  const link = document.createElement('a')
  const blobUrl = URL.createObjectURL(blob)
  link.href = blobUrl
  const filename = `Certificate-${codeStr}.pdf`
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(blobUrl), 2000)

  return blobUrl
}
