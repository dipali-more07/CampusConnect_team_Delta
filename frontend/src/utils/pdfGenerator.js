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

  // 3. Logo Shield with Laurels
  const cx = W / 2;
  let y = 110;

  ctx.save();
  const shieldX = cx - 180;
  const shieldY = y - 20;

  // Laurel branches
  const drawLaurel = (sx, sy, flip) => {
    ctx.save();
    ctx.translate(sx, sy);
    if (flip) ctx.scale(-1, 1);
    ctx.strokeStyle = goldGrad;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 30);
    ctx.quadraticCurveTo(-40, 10, -25, -35);
    ctx.stroke();
    // Leaves
    ctx.fillStyle = goldGrad;
    for(let i=0; i<5; i++) {
      ctx.beginPath();
      ctx.ellipse(-12 - i*4, 5 - i*11, 7, 4, Math.PI/4 - i*0.15, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.restore();
  };
  drawLaurel(shieldX - 30, shieldY, false);
  drawLaurel(shieldX + 30, shieldY, true);

  // Split Shield (Left Gold, Right Navy)
  ctx.beginPath();
  ctx.moveTo(shieldX, shieldY);
  ctx.lineTo(shieldX, shieldY + 35);
  ctx.bezierCurveTo(shieldX, shieldY + 45, shieldX - 20, shieldY + 35, shieldX - 20, shieldY + 20);
  ctx.lineTo(shieldX - 20, shieldY);
  ctx.closePath();
  ctx.fillStyle = goldGrad;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(shieldX, shieldY);
  ctx.lineTo(shieldX, shieldY + 35);
  ctx.bezierCurveTo(shieldX, shieldY + 45, shieldX + 20, shieldY + 35, shieldX + 20, shieldY + 20);
  ctx.lineTo(shieldX + 20, shieldY);
  ctx.closePath();
  ctx.fillStyle = navy;
  ctx.fill();

  // Shield Border
  ctx.beginPath();
  ctx.moveTo(shieldX, shieldY);
  ctx.bezierCurveTo(shieldX + 20, shieldY, shieldX + 20, shieldY + 20, shieldX + 20, shieldY + 30);
  ctx.bezierCurveTo(shieldX + 20, shieldY + 40, shieldX, shieldY + 50, shieldX, shieldY + 50);
  ctx.bezierCurveTo(shieldX, shieldY + 50, shieldX - 20, shieldY + 40, shieldX - 20, shieldY + 30);
  ctx.bezierCurveTo(shieldX - 20, shieldY + 20, shieldX - 20, shieldY, shieldX, shieldY);
  ctx.closePath();
  ctx.strokeStyle = goldGrad;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Inner C
  ctx.font = 'bold 26px ' + FONT_SERIF;
  ctx.textAlign = 'center';
  ctx.fillStyle = paper;
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 4;
  ctx.fillText('C', shieldX, shieldY + 26);
  ctx.shadowColor = 'transparent';

  // CAMPUSCONNECT Text
  ctx.font = 'bold 30px ' + FONT_SERIF;
  ctx.textAlign = 'left';
  ctx.fillStyle = navy;
  const campusWidth = ctx.measureText('CAMPUS').width;
  ctx.fillText('CAMPUS', shieldX + 45, shieldY + 28);
  ctx.fillStyle = goldDark;
  ctx.fillText('CONNECT', shieldX + 45 + campusWidth, shieldY + 28);
  ctx.restore();

  y += 90;

  // 4. CERTIFICATE OF MERIT (Engravers MT font)
  let titleFontSize = 50;
  ctx.font = `bold ${titleFontSize}px ${FONT_ENGRAVERS}`;
  const titleText = (tmpl.title || 'CERTIFICATE OF MERIT').toUpperCase();
  
  // Dynamically reduce font size if title is too wide to prevent horizontal squishing
  while (ctx.measureText(titleText).width > (W - 160) && titleFontSize > 26) {
    titleFontSize -= 2;
    ctx.font = `bold ${titleFontSize}px ${FONT_ENGRAVERS}`;
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = navy;
  ctx.strokeStyle = goldGrad;
  ctx.lineWidth = 1;
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 5;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 3;
  
  ctx.fillText(titleText, cx, y);
  ctx.strokeText(titleText, cx, y);
  ctx.shadowColor = 'transparent';
  
  y += 50;

  // 5. Awarded To
  ctx.font = 'italic 20px ' + FONT_SERIF;
  ctx.fillStyle = '#111';
  ctx.fillText('Awarded To', cx, y);
  
  y += 85;

  // 6. Name (Old English Text MT / Blackletter)
  const nameStr = certData.userName || certData.studentName || certData.name || 'Alex Rivera';
  ctx.font = '85px ' + FONT_BLACKLETTER;
  ctx.fillStyle = goldGrad;
  ctx.strokeStyle = goldDark;
  ctx.lineWidth = 1;
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 4;
  ctx.fillText(nameStr, cx, y);
  ctx.strokeText(nameStr, cx, y);
  ctx.shadowColor = 'transparent';

  // Thin line below name
  ctx.beginPath();
  ctx.moveTo(cx - 300, y + 15);
  ctx.lineTo(cx + 300, y + 15);
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();

  y += 65;

  // 7. Body text
  ctx.font = '19px ' + FONT_SERIF;
  ctx.fillStyle = '#000';
  ctx.fillText('In Recognition of Outstanding Achievement, Creativity, and Active Participation in the', cx, y);
  
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

  // 10. Signatures
  const sigLineY = footerY + 10;
  const drawSig = (xPos, cursiveName, printedName, role) => {
    ctx.save();
    ctx.font = 'italic 30px "Brush Script MT", "Cedarville Cursive", cursive';
    ctx.fillStyle = '#0a192f'; // ink color
    ctx.textAlign = 'center';
    ctx.fillText(cursiveName, xPos, sigLineY - 25, 180);

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(xPos - 85, sigLineY - 5);
    ctx.lineTo(xPos + 85, sigLineY - 5);
    ctx.stroke();

    ctx.font = 'bold 14px ' + FONT_SERIF;
    ctx.fillStyle = '#000';
    ctx.fillText(printedName, xPos, sigLineY + 15);

    ctx.font = '13px ' + FONT_SERIF;
    ctx.fillStyle = '#444';
    ctx.fillText(role, xPos, sigLineY + 32);
    ctx.restore();
  };

  const venueName = certData.venue || 'Event Venue';
  drawSig(W - 250, '', venueName, '');

  // Certificate ID
  const codeStr = certData.certificate_number || certData.verifyCode || certData.certCode || certData.id || 'CERT-2026-9842';
  ctx.font = '14px ' + FONT_SERIF;
  ctx.fillStyle = '#333';
  ctx.textAlign = 'right';
  ctx.fillText(`Certificate ID: ${codeStr}`, W - 150, footerY + 55);

  return canvas.toDataURL('image/jpeg', 0.95);
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
