/**
 * Certificate PDF generator using HTML Canvas
 * Renders the certificate using tmpl design settings, then embeds as PDF image.
 */

/**
 * Renders a certificate on an offscreen canvas using tmpl settings.
 * Returns a base64 PNG data URL.
 */
export function renderCertificateCanvas(certData, tmpl) {
  const W = 1122; // A4 landscape px @96dpi * 1.5x
  const H = 794;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // --- Typography Definitions ---
  const FONT_BLACKLETTER = '"Old English Text MT", "Parchment", "Blackletter", serif';
  const FONT_ENGRAVERS = '"Engravers MT", "Algerian", "Copperplate", "Times New Roman", serif';
  const FONT_SERIF = '"Times New Roman", "Georgia", serif';

  // --- Helpers ---
  const goldGrad = ctx.createLinearGradient(0, 0, W, H);
  goldGrad.addColorStop(0, '#D4AF37');
  goldGrad.addColorStop(0.3, '#FFF3A3');
  goldGrad.addColorStop(0.5, '#AA771C');
  goldGrad.addColorStop(0.7, '#FFF3A3');
  goldGrad.addColorStop(1, '#D4AF37');

  const goldDark = ctx.createLinearGradient(0, 0, W, H);
  goldDark.addColorStop(0, '#8A6D2B');
  goldDark.addColorStop(0.5, '#4A3B18');
  goldDark.addColorStop(1, '#8A6D2B');

  const navy = '#0c1b33';
  const paper = '#fbf8f1';

  // 1. Background with vignette
  const bgGrad = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, W);
  bgGrad.addColorStop(0, '#ffffff');
  bgGrad.addColorStop(1, '#f0e6d2');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Subtle paper texture
  ctx.fillStyle = 'rgba(0, 0, 0, 0.015)';
  for (let i = 0; i < 3000; i++) {
    ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
  }

  // 2. Borders
  const m1 = 20; // Outer thin gold
  const m3 = 38; // Thick braided gold
  const m4 = 55; // Inner thin gold

  // Outer thin
  ctx.strokeStyle = goldGrad;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(m1, m1, W - m1 * 2, H - m1 * 2);

  // Thick braided gold (simulated)
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 4;

  ctx.strokeStyle = goldGrad;
  ctx.lineWidth = 14;
  ctx.strokeRect(m3, m3, W - m3 * 2, H - m3 * 2);

  ctx.shadowColor = 'transparent'; // Reset shadow

  ctx.strokeStyle = goldDark;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(m3 - 6, m3 - 6, W - m3 * 2 + 12, H - m3 * 2 + 12);
  ctx.strokeRect(m3 + 6, m3 + 6, W - m3 * 2 - 12, H - m3 * 2 - 12);

  // Inner thin border
  ctx.strokeStyle = goldGrad;
  ctx.lineWidth = 1;
  ctx.strokeRect(m4, m4, W - m4 * 2, H - m4 * 2);

  // Ornate Ribbon Corners (Extremely detailed to match image)
  const drawCornerRibbon = (cx, cy, rotation) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);

    // Erase background behind corner
    ctx.fillStyle = '#f0e6d2';
    ctx.fillRect(-30, -30, 60, 60);

    ctx.strokeStyle = goldGrad;
    ctx.lineCap = 'round';

    // Large Ribbon Sweeps
    ctx.lineWidth = 12;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;

    ctx.beginPath();
    ctx.arc(0, 0, 70, 0, Math.PI / 2);
    ctx.stroke();

    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, 45, 0, Math.PI / 2);
    ctx.stroke();

    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 95, 0, Math.PI / 2);
    ctx.stroke();

    // Corner Crest (Circle with 'C')
    ctx.shadowColor = 'transparent';
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fillStyle = paper;
    ctx.fill();

    ctx.lineWidth = 2.5;
    ctx.strokeStyle = goldGrad;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = 'bold 18px ' + FONT_SERIF;
    ctx.fillStyle = goldDark;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('C', 0, 1);

    ctx.restore();
  };

  drawCornerRibbon(m3, m3, 0); // TL
  drawCornerRibbon(W - m3, m3, Math.PI / 2); // TR
  drawCornerRibbon(W - m3, H - m3, Math.PI); // BR
  drawCornerRibbon(m3, H - m3, -Math.PI / 2); // BL

  // 3. Official Graduation Cap Logo Badge
  const cx = W / 2;
  let y = 105;

  ctx.save();
  ctx.font = 'bold 30px ' + FONT_SERIF;
  const campusW = ctx.measureText('CAMPUS').width;
  const connectW = ctx.measureText('CONNECT').width;
  const iconSize = 46;
  const gap = 12;
  const totalW = iconSize + gap + campusW + connectW;
  const startX = cx - (totalW / 2);
  const iconX = startX;
  const iconY = y - 22;

  // Draw rounded square with vibrant brand color #615FFF
  const radius = 13;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(iconX + radius, iconY);
  ctx.lineTo(iconX + iconSize - radius, iconY);
  ctx.quadraticCurveTo(iconX + iconSize, iconY, iconX + iconSize, iconY + radius);
  ctx.lineTo(iconX + iconSize, iconY + iconSize - radius);
  ctx.quadraticCurveTo(iconX + iconSize, iconY + iconSize, iconX + iconSize - radius, iconY + iconSize);
  ctx.lineTo(iconX + radius, iconY + iconSize);
  ctx.quadraticCurveTo(iconX, iconY + iconSize, iconX, iconY + iconSize - radius);
  ctx.lineTo(iconX, iconY + radius);
  ctx.quadraticCurveTo(iconX, iconY, iconX + radius, iconY);
  ctx.closePath();
  ctx.fillStyle = '#615FFF';
  ctx.shadowColor = 'rgba(97, 95, 255, 0.35)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  ctx.fill();
  ctx.shadowColor = 'transparent';

  // Draw Lucide Graduation Cap Icon
  ctx.save();
  ctx.translate(iconX + 7, iconY + 7);
  ctx.scale(1.33, 1.33);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (typeof Path2D !== 'undefined') {
    const p1 = new Path2D("M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.084a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z");
    const p2 = new Path2D("M6 12.5v3a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-3");
    const p3 = new Path2D("M18 12.5v5a1.5 1.5 0 0 0 3 0v-5");
    ctx.stroke(p1);
    ctx.stroke(p2);
    ctx.stroke(p3);
  } else {
    ctx.beginPath();
    ctx.moveTo(12, 4.5);
    ctx.lineTo(21.4, 9);
    ctx.lineTo(12, 13.5);
    ctx.lineTo(2.6, 9);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(6, 12.5);
    ctx.lineTo(6, 15.5);
    ctx.quadraticCurveTo(6, 18.5, 12, 18.5);
    ctx.quadraticCurveTo(18, 18.5, 18, 15.5);
    ctx.lineTo(18, 12.5);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(18, 12.5);
    ctx.lineTo(18, 17.5);
    ctx.stroke();
  }
  ctx.restore();
  ctx.restore();

  // Draw CAMPUSCONNECT Text
  const textY = y + 11;
  const textX = iconX + iconSize + gap;
  ctx.font = 'bold 30px ' + FONT_SERIF;
  ctx.textAlign = 'left';
  ctx.fillStyle = navy;
  ctx.fillText('CAMPUS', textX, textY);

  ctx.fillStyle = '#615FFF';
  ctx.fillText('CONNECT', textX + campusW, textY);
  ctx.restore();

  y += 90;

  // 4. CERTIFICATE TITLE (Clean bold solid black)
  let titleFontSize = 50;
  ctx.font = `bold ${titleFontSize}px ${FONT_ENGRAVERS}`;
  const titleText = (tmpl.title || 'CERTIFICATE OF MERIT').toUpperCase();

  // Dynamically reduce font size if title is too wide to prevent horizontal squishing
  while (ctx.measureText(titleText).width > (W - 160) && titleFontSize > 26) {
    titleFontSize -= 2;
    ctx.font = `bold ${titleFontSize}px ${FONT_ENGRAVERS}`;
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = '#000000';
  ctx.shadowColor = 'transparent';
  ctx.fillText(titleText, cx, y);

  y += 50;

  // 5. Awarded To
  ctx.font = 'italic 20px ' + FONT_SERIF;
  ctx.fillStyle = '#475569';
  ctx.fillText('Awarded To', cx, y);

  y += 75;

  // 6. Name / Team Heading (Application Theme Style - Modern Bold Typography with Brand Gradient & Polish)
  const teamNameStr = String(certData.teamName || certData.team_name || '');
  const positionStr = String(certData.position || certData.certificate_type || tmpl.title || '').toLowerCase();
  const rankVal = Number(certData.rank || 0);
  const isWinning = rankVal > 0 || positionStr.includes('1st') || positionStr.includes('2nd') || positionStr.includes('3rd') || positionStr.includes('winner') || positionStr.includes('runner') || positionStr.includes('merit') || positionStr.includes('place') || positionStr === '1' || positionStr === '2' || positionStr === '3';
  const isTeamWinning = Boolean(teamNameStr && isWinning);

  // If team is 1st, 2nd, 3rd (winning), main big text is Team Name!
  let mainDisplayName = '';
  if (isTeamWinning) {
    mainDisplayName = teamNameStr.toLowerCase().startsWith('team') ? teamNameStr : `Team: ${teamNameStr}`;
  } else {
    mainDisplayName = String(certData.userName || certData.studentName || certData.name || 'Alex Rivera');
  }

  const FONT_THEME_NAME = '"Manrope", "Outfit", "Plus Jakarta Sans", "Inter", sans-serif';

  let nameFontSize = 68;
  ctx.font = `800 ${nameFontSize}px ${FONT_THEME_NAME}`;
  while (ctx.measureText(mainDisplayName).width > (W - 240) && nameFontSize > 32) {
    nameFontSize -= 2;
    ctx.font = `800 ${nameFontSize}px ${FONT_THEME_NAME}`;
  }

  // Theme brand gradient for student name / team name
  const nameGrad = ctx.createLinearGradient(cx - 200, 0, cx + 200, 0);
  nameGrad.addColorStop(0, '#312e81');
  nameGrad.addColorStop(0.3, '#4338ca');
  nameGrad.addColorStop(0.7, '#615FFF');
  nameGrad.addColorStop(1, '#4f46e5');

  ctx.fillStyle = nameGrad;
  ctx.shadowColor = 'rgba(97, 95, 255, 0.2)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 3;
  ctx.fillText(mainDisplayName, cx, y);
  ctx.shadowColor = 'transparent';

  // Elegant accent line below name with theme gradient
  const lineGrad = ctx.createLinearGradient(cx - 260, 0, cx + 260, 0);
  lineGrad.addColorStop(0, 'rgba(97, 95, 255, 0)');
  lineGrad.addColorStop(0.5, 'rgba(97, 95, 255, 0.45)');
  lineGrad.addColorStop(1, 'rgba(97, 95, 255, 0)');
  ctx.beginPath();
  ctx.moveTo(cx - 260, y + 14);
  ctx.lineTo(cx + 260, y + 14);
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Subtitle / Team Members
  const rawMembers = Array.isArray(certData.members) ? certData.members : (certData.members ? [certData.members] : []);
  const membersList = rawMembers.map(m => typeof m === 'object' ? (m.name || m.studentName || m.full_name || m.email) : String(m)).filter(Boolean);

  if (isTeamWinning) {
    // Show team members below team name
    const membersText = membersList.length > 0
      ? `Team Members: ${membersList.join(', ')}`
      : (certData.userName ? `Team Member: ${certData.userName}` : '');

    if (membersText) {
      ctx.font = 'bold italic 20px ' + FONT_SERIF;
      ctx.fillStyle = '#4338ca';
      ctx.fillText(membersText, cx, y + 42, W - 240);
      y += 25;
    }
  } else if (teamNameStr) {
    ctx.font = 'bold italic 22px ' + FONT_SERIF;
    ctx.fillStyle = '#4338ca';
    ctx.fillText(`(Team: ${teamNameStr})`, cx, y + 42);
    y += 25;
  }

  y += 55;

  // 7. Body text
  ctx.font = '19px ' + FONT_SERIF;
  ctx.fillStyle = '#000';
  let bodyText = '';
  if (isTeamWinning) {
    const posLabel = String(certData.position) === '1' ? '1st Place (Winner)' : String(certData.position) === '2' ? '2nd Place (Runner Up)' : String(certData.position) === '3' ? '3rd Place (Runner Up)' : (certData.position || 'Top Position');
    bodyText = `In Recognition of Outstanding Achievement and Securing ${posLabel} in the`;
  } else if (teamNameStr) {
    bodyText = `In Recognition of Active Team Participation with Team "${teamNameStr}" in`;
  } else {
    bodyText = 'In Recognition of Outstanding Achievement, Creativity, and Active Participation in the';
  }
  ctx.fillText(bodyText, cx, y);

  y += 45;

  // Event Name (Engravers MT font)
  const eventStr = (certData.eventName || certData.event || 'ANNUAL AI & INNOVATION HACKATHON').toUpperCase();
  ctx.font = 'bold 26px ' + FONT_ENGRAVERS;
  ctx.fillStyle = navy;
  ctx.fillText(eventStr, cx, y, W - 200);

  y += 40;

  // Details
  const dateStr = certData.issueDate || certData.issue_date || certData.issuedDate || 'March 16, 2026';
  ctx.font = '17px ' + FONT_SERIF;
  ctx.fillStyle = '#000';
  const eventDateStr = certData.eventDate || dateStr;
  const venueStr = certData.venue || 'the CampusConnect Innovation Center';
  ctx.fillText(`Held on ${eventDateStr}, at ${venueStr}.`, cx, y);

  y += 30;
  ctx.fillText('Demonstrating exceptional skills, teamwork, and innovation', cx, y);
  y += 24;
  ctx.fillText('in developing impactful AI solutions.', cx, y);

  // --- Footer Section ---
  const footerY = 670;

  // 8. Date (Left, above seal)
  const sealX = 220;
  ctx.font = 'bold 16px ' + FONT_SERIF;
  ctx.fillStyle = '#000';
  ctx.textAlign = 'left';
  ctx.fillText(`Date: ${dateStr}`, sealX - 60, footerY - 70);

  // 9. Wax Seal (Enhanced Realism)
  ctx.save();
  const sealGrad = ctx.createRadialGradient(sealX - 15, footerY - 15, 5, sealX, footerY, 50);
  sealGrad.addColorStop(0, '#e63946');
  sealGrad.addColorStop(0.5, '#a9222a');
  sealGrad.addColorStop(0.8, '#70131a');
  sealGrad.addColorStop(1, '#3b060b');

  ctx.fillStyle = sealGrad;
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 15;
  ctx.shadowOffsetY = 8;

  ctx.beginPath();
  const rOuter = 46;
  for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
    const offset = Math.sin(angle * 18) * 4;
    const px = sealX + Math.cos(angle) * (rOuter + offset);
    const py = footerY + Math.sin(angle) * (rOuter + offset);
    if (angle === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  ctx.shadowColor = 'transparent';

  ctx.fillStyle = '#8f141b';
  ctx.beginPath();
  ctx.arc(sealX, footerY, 34, 0, Math.PI * 2);
  ctx.fill();

  // Seal inner text
  ctx.strokeStyle = goldGrad;
  ctx.lineWidth = 1;
  ctx.strokeRect(sealX - 18, footerY - 18, 36, 36);
  ctx.font = 'bold 10px sans-serif';
  ctx.fillStyle = goldGrad;
  ctx.textAlign = 'center';
  ctx.fillText('OFFICIAL', sealX, footerY - 5);
  ctx.fillText('SEAL', sealX, footerY + 12);

  ctx.beginPath();
  ctx.arc(sealX, footerY, 11, 0, Math.PI * 2);
  ctx.stroke();
  ctx.font = 'bold 14px ' + FONT_SERIF;
  ctx.fillText('C', sealX, footerY + 5);
  ctx.restore();

  // 10. Dynamic Event Venue & Certificate ID (Balanced Center-Aligned Right Column)
  const venueName = certData.venue || certData.location || 'Main Campus Auditorium';
  const codeStr = certData.certificate_number || certData.verifyCode || certData.certCode || certData.id || 'CERT-2026-9842';
  const rightColX = W - 230;

  ctx.save();
  ctx.textAlign = 'center';

  // Venue Name
  ctx.font = 'bold 16px ' + FONT_SERIF;
  ctx.fillStyle = '#0f172a';
  ctx.fillText(venueName, rightColX, footerY - 5, 240);

  // Venue Label
  ctx.font = '12px ' + FONT_SERIF;
  ctx.fillStyle = '#64748b';
  ctx.fillText('Event Venue', rightColX, footerY + 14);

  // Certificate ID
  ctx.font = '600 13px ' + FONT_SERIF;
  ctx.fillStyle = '#334155';
  ctx.fillText(`Certificate ID: ${codeStr}`, rightColX, footerY + 46);
  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.95);
}

/** Convert hex color + alpha to rgba() string */
function hexToRgba(hex, alpha = 1) {
  hex = (hex || '#615FFF').replace('#', '')
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('')
  const n = Number.parseInt(hex, 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
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
    org: 'State University',
    title: 'Certificate of Participation',
    subtitle: 'This is to certify that',
    body: 'has successfully participated in',
    footer: 'campusconnect.university.edu/verify',
    gradFrom: '#1a1060',
    gradMid: '#0f0a45',
    gradTo: '#0a0838',
    accentColor: '#615FFF',
    borderStyle: 'none',
    fontFamily: 'Manrope, sans-serif',
    showLogo: true,
    showSignatures: true,
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
    template.title = certTitle || 'Certificate of Merit';
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
  const base64 = imgDataUrl.split(',')[1]
  const byteCount = atob(base64).length

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
  for (let i = 0; i < imgBinary.length; i++) imgBytes[i] = imgBinary.codePointAt(i)

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
  const final = new Uint8Array(totalLen)
  let pos = 0
  for (const p of parts) { final.set(p, pos); pos += p.length }

  const blob = new Blob([final], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)

  // Format filename as: <StudentName>_<CertificateCode>.pdf
  const rawStudent = certData.userName || certData.studentName || certData.student_name || certData.name || certData.user_name || certData.recipient_name || ''
  const cleanStudent = rawStudent.trim().replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s+/g, '_')
  const codeStr = certData.certificate_number || certData.verifyCode || certData.certCode || certData.id || 'CC'
  const fileName = cleanStudent ? `${cleanStudent}_${codeStr}.pdf` : `Certificate_${codeStr}.pdf`

  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 3000)

  return url
}
