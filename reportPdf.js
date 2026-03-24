import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const PDFDocument = require('pdfkit');

// ─── Palette (matches site's #0a0a0a space theme) ─────────────────────────────
const C = {
  bg:         '#09090b',
  panel:      '#111114',
  panelAlt:   '#15151a',
  stroke:     '#27272a',
  strokeSoft: '#1c1c20',
  text:       '#fafafa',
  muted:      '#d4d4d8',
  soft:       '#a1a1aa',
  faint:      '#71717a',
  accent:     '#ffffff',
  green:      '#86efac',
  amber:      '#fbbf24',
  red:        '#f87171',
  blue:       '#93c5fd',
  purple:     '#c4b5fd',
};

const PAGE_W    = 595.28;
const MARGIN    = 36;
const CONTENT_W = PAGE_W - MARGIN * 2;
const GRID_STEP = 64;

// ─── Utilities ────────────────────────────────────────────────────────────────
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const safeText  = (v, fb = '') => (typeof v === 'string' && v.trim() ? v.trim() : fb);
const safeArray = (v, fb = []) => (Array.isArray(v) && v.length ? v : fb);

function levelColor(level) {
  return { Advanced: C.green, Strong: C.accent, Developing: C.amber, Emerging: C.red }[level] || C.soft;
}

function seededRand(seed) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

function formatDate(v) {
  if (typeof v === 'string' && v.trim()) return v.trim();
  return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function shortStage(stage) { return safeText(stage, 'Scaling Manager').split('→')[0].trim(); }

function nextStage(stage) {
  const l = safeText(stage).toLowerCase();
  if (l.includes('individual')) return 'New Manager';
  if (l.includes('new manager')) return 'Scaling Manager';
  if (l.includes('scaling')) return 'Senior Leader';
  if (l.includes('senior') || l.includes('strategic')) return 'Executive Leader';
  if (l.includes('executive') || l.includes('vp') || l.includes('director')) return 'Enterprise Leader';
  return 'Senior Leader';
}

function benchBand(s) {
  if (s >= 86) return 'High';
  if (s >= 74) return 'Medium-High';
  if (s >= 62) return 'Medium';
  return 'Emerging';
}

function peerAvg(score, i) { return clamp(score + [-4, 3, -5, -2, -1, 2][i % 6], 52, 91); }

function scoreInterpretation(score) {
  if (score >= 85) return 'Operating at a high level. Primary goal is to amplify this strength across the team.';
  if (score >= 75) return 'Performing solidly. A focused 90-day effort will sharpen this into a clear differentiator.';
  if (score >= 65) return 'Showing early competence. Deliberate practice and targeted feedback will accelerate progress.';
  if (score >= 55) return 'At an emerging stage. Structured development actions will build real momentum here.';
  return 'Foundational work needed. This gap is limiting overall leadership reach and team autonomy.';
}

function gapToAdvanced(score) { return Math.max(0, 90 - score); }

// ─── Drawing Primitives ───────────────────────────────────────────────────────
function rPanel(doc, x, y, w, h, fill = C.panel, strokeColor = C.stroke, r = 14) {
  doc.save();
  doc.roundedRect(x, y, w, h, r).fill(fill);
  if (strokeColor) doc.roundedRect(x, y, w, h, r).lineWidth(0.75).strokeColor(strokeColor).stroke();
  doc.restore();
}

function drawGrid(doc, totalH) {
  doc.save();
  for (let gx = 0; gx <= PAGE_W; gx += GRID_STEP) {
    doc.moveTo(gx, 0).lineTo(gx, totalH).lineWidth(0.4).strokeOpacity(0.025).strokeColor('#ffffff').stroke();
  }
  for (let gy = 0; gy <= totalH; gy += GRID_STEP) {
    doc.moveTo(0, gy).lineTo(PAGE_W, gy).lineWidth(0.4).strokeOpacity(0.025).strokeColor('#ffffff').stroke();
  }
  doc.restore();
}

function drawStars(doc, totalH) {
  const r = seededRand(0xca4ee3);
  for (let i = 0; i < 190; i++) {
    const x = r() * PAGE_W, y = r() * totalH;
    const big = r() < 0.06, med = r() < 0.22;
    const sz = big ? 1.8 : med ? 1.05 : 0.45;
    const op = 0.035 + r() * (big ? 0.16 : med ? 0.1 : 0.06);
    doc.save().fillOpacity(op).circle(x, y, sz).fill('#ffffff').restore();
  }
}

function writeLabel(doc, text, x, y, color = C.faint) {
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(color)
     .text(String(text || '').toUpperCase(), x, y, { lineBreak: false, characterSpacing: 0.6 });
}

function measure(doc, text, width, size = 10, font = 'Helvetica') {
  doc.font(font).fontSize(size);
  return doc.heightOfString(String(text || ''), { width, lineGap: 2 });
}

function writeText(doc, text, x, y, opts = {}) {
  const { width = CONTENT_W, size = 10, font = 'Helvetica', color = C.muted, lineGap = 2, align = 'left' } = opts;
  doc.font(font).fontSize(size).fillColor(color).text(String(text || ''), x, y, { width, lineGap, align });
  return doc.y;
}

function fitLine(doc, text, width, size = 10, font = 'Helvetica') {
  const input = safeText(text);
  if (!input) return '';
  doc.font(font).fontSize(size);
  if (doc.widthOfString(input) <= width) return input;
  const ellipsis = '...';
  let out = input;
  while (out.length > 0 && doc.widthOfString(out + ellipsis) > width) out = out.slice(0, -1);
  return out ? `${out}${ellipsis}` : ellipsis;
}

function writeSingleLine(doc, text, x, y, opts = {}) {
  const { width = CONTENT_W, size = 10, font = 'Helvetica', color = C.muted, align = 'left' } = opts;
  const line = fitLine(doc, text, width, size, font);
  doc.font(font).fontSize(size).fillColor(color).text(line, x, y, { width, align, lineBreak: false });
  return y;
}

function drawDivider(doc, y, color = C.stroke) {
  doc.save().rect(MARGIN, y, CONTENT_W, 0.75).fill(color).restore();
  return y + 22;
}

function drawProgressBar(doc, x, y, w, score, color, h = 6) {
  const filled = clamp((score / 100) * w, h, w);
  doc.save();
  doc.roundedRect(x, y, w, h, h / 2).fill(C.strokeSoft);
  doc.roundedRect(x, y, filled, h, h / 2).fill(color);
  doc.restore();
}

function drawBulletList(doc, items, x, y, width, opts = {}) {
  const { bullet = '•', size = 9, color = C.muted, gap = 6, bulletColor = C.soft } = opts;
  let cy = y;
  for (const item of items) {
    const line = safeText(item);
    if (!line) continue;
    doc.font('Helvetica-Bold').fontSize(size).fillColor(bulletColor).text(bullet, x, cy + 1, { lineBreak: false });
    const bottom = writeText(doc, line, x + 12, cy, { width: width - 12, size, color, lineGap: 1.5 });
    cy = bottom + gap;
  }
  return cy;
}

function drawNumberedList(doc, items, x, y, width, opts = {}) {
  const { size = 9, color = C.muted, gap = 6, numColor = C.green } = opts;
  let cy = y;
  for (let i = 0; i < items.length; i++) {
    const line = safeText(items[i]);
    if (!line) continue;
    doc.font('Helvetica-Bold').fontSize(size).fillColor(numColor).text(`${i + 1}.`, x, cy + 1, { lineBreak: false });
    const bottom = writeText(doc, line, x + 16, cy, { width: width - 16, size, color, lineGap: 1.5 });
    cy = bottom + gap;
  }
  return cy;
}

function drawChipRow(doc, items, x, y, maxW) {
  let cx = x, cy = y;
  for (const item of items) {
    const label = safeText(item);
    if (!label) continue;
    const cw = doc.font('Helvetica').fontSize(8).widthOfString(label) + 20;
    if (cx + cw > x + maxW) { cx = x; cy += 26; }
    rPanel(doc, cx, cy, cw, 20, '#101014', C.stroke, 10);
    doc.font('Helvetica').fontSize(8).fillColor(C.green).text(label, cx + 10, cy + 6, { lineBreak: false });
    cx += cw + 8;
  }
  return cy + 26;
}

// ─── Charts ───────────────────────────────────────────────────────────────────
function drawArcGauge(doc, cx, cy, r, score, color, lw = 5) {
  doc.save().circle(cx, cy, r + 6).fillOpacity(0.045).fill(color).restore();
  doc.save().circle(cx, cy, r).lineWidth(lw).strokeColor(C.strokeSoft).stroke().restore();
  if (score > 0.5) {
    const a0 = -Math.PI / 2;
    const sweep = (Math.min(score, 99.9) / 100) * Math.PI * 2;
    doc.save().arc(cx, cy, r, a0, a0 + sweep).lineWidth(lw).strokeColor(color).stroke().restore();
  }
}

function drawRadarChart(doc, cx, cy, r, competencies) {
  const n = competencies.length;
  if (n < 3) return;
  const ang = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt  = (score, i) => ({
    x: cx + (score / 100) * r * Math.cos(ang(i)),
    y: cy + (score / 100) * r * Math.sin(ang(i)),
  });

  for (const pct of [25, 50, 75, 100]) {
    const ring = competencies.map((_, i) => pt(pct, i));
    doc.save();
    doc.moveTo(ring[0].x, ring[0].y);
    for (let i = 1; i < ring.length; i++) doc.lineTo(ring[i].x, ring[i].y);
    doc.closePath().lineWidth(0.5).strokeColor(pct === 100 ? C.stroke : C.strokeSoft).stroke();
    doc.restore();
    doc.font('Helvetica').fontSize(5.5).fillColor(C.faint)
       .text(String(pct), cx - 6, cy - (pct / 100) * r - 8, { lineBreak: false, width: 12, align: 'center' });
  }
  for (let i = 0; i < n; i++) {
    const outer = pt(100, i);
    doc.save().moveTo(cx, cy).lineTo(outer.x, outer.y).lineWidth(0.5).strokeColor(C.strokeSoft).stroke().restore();
  }
  const pts = competencies.map((c, i) => pt(c.score, i));
  doc.save(); doc.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) doc.lineTo(pts[i].x, pts[i].y);
  doc.closePath().fillOpacity(0.14).fill(C.green); doc.restore();
  doc.save(); doc.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) doc.lineTo(pts[i].x, pts[i].y);
  doc.closePath().lineWidth(1.5).strokeOpacity(0.75).strokeColor(C.green).stroke(); doc.restore();
  for (const p of pts) doc.save().circle(p.x, p.y, 3).fill(C.green).restore();
  for (let i = 0; i < n; i++) {
    const labR = r + 24;
    const lx = cx + labR * Math.cos(ang(i)), ly = cy + labR * Math.sin(ang(i));
    doc.font('Helvetica').fontSize(7).fillColor(C.soft)
       .text(competencies[i].name.split(' ')[0], lx - 24, ly - 5, { width: 48, align: 'center' });
  }
}

function drawEvolutionSteps(doc, x, y, w, h, stages, current) {
  const n = stages.length;
  const sw = (w - (n - 1) * 4) / n;
  for (let i = 0; i < n; i++) {
    const sh = Math.round(((i + 1) / n) * h);
    const sx = x + i * (sw + 4), sy = y + h - sh;
    const here = (i + 1) === current;
    rPanel(doc, sx, sy, sw, sh, here ? '#141a14' : '#0d0d10', here ? C.green : C.strokeSoft, 6);
    doc.font('Helvetica').fontSize(6.5).fillColor(here ? C.text : C.faint)
       .text(stages[i], sx + 4, sy + 8, { width: sw - 8, lineBreak: false });
    if (here) {
      const dy = sy + sh - 22;
      doc.save().circle(sx + sw / 2, dy, 10).fill(C.green).restore();
      doc.font('Helvetica-Bold').fontSize(5).fillColor(C.bg)
         .text('YOU', sx + sw / 2 - 10, dy - 4, { width: 20, align: 'center', lineBreak: false });
    }
    doc.font('Helvetica').fontSize(6).fillColor(C.faint)
       .text(String(i + 1), sx, y + h + 6, { width: sw, align: 'center', lineBreak: false });
  }
}

function drawTimeline(doc, x, y, w, labels) {
  const n = labels.length;
  const segW = w / (n + 1);
  const lineY = y + 14;
  doc.save().rect(x, lineY, w, 1).fill(C.stroke).restore();
  for (let i = 0; i < n; i++) {
    const dotX = x + (i + 1) * segW;
    doc.save().circle(dotX, lineY, 7).fill(C.panel)
       .circle(dotX, lineY, 7).lineWidth(1).strokeColor(i === 0 ? C.green : C.stroke).stroke().restore();
    if (i === 0) doc.save().circle(dotX, lineY, 3).fill(C.green).restore();
    writeLabel(doc, `M${i + 1}`, dotX - 10, lineY + 11, i === 0 ? C.green : C.faint);
    doc.font('Helvetica').fontSize(6.5).fillColor(i === 0 ? C.soft : C.faint)
       .text(safeText(labels[i]).slice(0, 18), dotX - segW * 0.42, lineY + 22, { width: segW * 0.84, align: 'center' });
  }
  return lineY + 48;
}

function drawPriorityMatrix(doc, x, y, sz, wins, bets) {
  const half = sz / 2;
  doc.save();
  doc.rect(x, y, half, half).fill('#0d150d');
  doc.rect(x + half, y, half, half).fill('#13130c');
  doc.rect(x, y + half, half, half).fill('#0e0e10');
  doc.rect(x + half, y + half, half, half).fill('#0e0e10');
  doc.restore();
  doc.save().rect(x, y, sz, sz).lineWidth(0.75).strokeColor(C.stroke).stroke().restore();
  doc.save().moveTo(x, y + half).lineTo(x + sz, y + half).lineWidth(0.5).strokeColor(C.stroke).stroke().restore();
  doc.save().moveTo(x + half, y).lineTo(x + half, y + sz).lineWidth(0.5).strokeColor(C.stroke).stroke().restore();
  for (const { text: t, qx, qy, color } of [
    { text: 'DO NOW', qx: x, qy: y, color: C.green },
    { text: 'PLAN', qx: x + half, qy: y, color: C.amber },
    { text: 'DELEGATE', qx: x, qy: y + half, color: C.faint },
    { text: 'DEFER', qx: x + half, qy: y + half, color: C.faint },
  ]) doc.font('Helvetica-Bold').fontSize(6.5).fillColor(color).text(t, qx + 6, qy + 6, { lineBreak: false });
  doc.font('Helvetica').fontSize(6).fillColor(C.faint)
     .text('LOW EFFORT', x + 4, y + sz + 5, { lineBreak: false })
     .text('HIGH EFFORT', x + sz - 55, y + sz + 5, { lineBreak: false });
  const plotDots = (items, qx, qy, color) => {
    for (let i = 0; i < Math.min(items.length, 4); i++) {
      const col = i % 2, row = Math.floor(i / 2);
      const dx = qx + 8 + col * (half * 0.5 - 4);
      const dy = qy + 20 + row * 22;
      doc.save().circle(dx, dy, 3).fill(color).restore();
      doc.font('Helvetica').fontSize(5.5).fillColor(color)
         .text(safeText(items[i]).slice(0, 18), dx + 6, dy - 3, { lineBreak: false, width: half * 0.5 - 12 });
    }
  };
  plotDots(wins, x, y, C.green);
  plotDots(bets, x + half, y, C.amber);
}

function drawKpiBarChart(doc, x, y, w, h, labels) {
  const n = Math.min(labels.length, 6);
  if (n === 0) return;
  const barW = (w - (n - 1) * 8) / n;
  const rand = seededRand(0x4b7a);
  const colors = [C.green, C.blue, C.amber, C.purple, C.green, C.blue];
  for (let i = 0; i < n; i++) {
    const bx = x + i * (barW + 8);
    const score = 42 + Math.round(rand() * 50);
    const bh = Math.round((score / 100) * h);
    const color = colors[i % colors.length];
    doc.save().roundedRect(bx, y, barW, h, 4).fill(C.strokeSoft).restore();
    doc.save().roundedRect(bx, y + h - bh, barW, bh, 4).fill(color).restore();
    doc.font('Helvetica-Bold').fontSize(7).fillColor(color)
       .text(`${score}%`, bx, y + h - bh - 12, { width: barW, align: 'center', lineBreak: false });
    doc.font('Helvetica').fontSize(6).fillColor(C.faint)
       .text(safeText(labels[i]).split(' ').slice(0, 2).join(' '), bx - 2, y + h + 5, { width: barW + 4, align: 'center' });
  }
}

// ─── Chart: grouped horizontal comparison bar (you vs peer) ──────────────────
function drawGroupedBar(doc, x, y, label, youScore, peerScore, barW, youColor) {
  const ROW = 18;
  writeSingleLine(doc, label, x, y + 2, { width: 130, size: 7.5, font: 'Helvetica-Bold', color: C.text });
  // you bar
  doc.save().roundedRect(x + 134, y, barW, 7, 3).fill(C.strokeSoft).restore();
  doc.save().roundedRect(x + 134, y, (youScore / 100) * barW, 7, 3).fill(youColor).restore();
  // peer bar
  doc.save().roundedRect(x + 134, y + 9, barW, 7, 3).fill(C.strokeSoft).restore();
  doc.save().roundedRect(x + 134, y + 9, (peerScore / 100) * barW, 7, 3).fill('#ffffff30').restore();
  // score labels
  doc.font('Helvetica-Bold').fontSize(7).fillColor(youColor)
     .text(`${youScore}`, x + 134 + barW + 5, y, { lineBreak: false });
  doc.font('Helvetica').fontSize(7).fillColor(C.faint)
     .text(`${peerScore}`, x + 134 + barW + 5, y + 9, { lineBreak: false });
  return y + ROW + 4;
}

// ─── Chart: visual score dial (large, decorative) ──────────────────────────
function drawScoreDial(doc, cx, cy, r, score, color) {
  // Outer glow
  doc.save().circle(cx, cy, r + 10).fillOpacity(0.03).fill(color).restore();
  doc.save().circle(cx, cy, r + 5).fillOpacity(0.05).fill(color).restore();
  // Track
  doc.save().circle(cx, cy, r).lineWidth(8).strokeColor(C.strokeSoft).stroke().restore();
  // Arc
  if (score > 0) {
    const a0 = -Math.PI / 2;
    const sweep = (Math.min(score, 99.9) / 100) * Math.PI * 2;
    doc.save().arc(cx, cy, r, a0, a0 + sweep).lineWidth(8).strokeColor(color).stroke().restore();
  }
  // Inner ring decoration
  doc.save().circle(cx, cy, r - 14).lineWidth(0.5).strokeColor(C.strokeSoft).stroke().restore();
  // Score text
  doc.font('Helvetica-Bold').fontSize(r * 0.55).fillColor(C.text)
     .text(String(score), cx - r * 0.5, cy - r * 0.32, { width: r, align: 'center', lineBreak: false });
  doc.font('Helvetica').fontSize(8).fillColor(C.soft)
     .text('/ 100', cx - r * 0.5, cy + r * 0.14, { width: r, align: 'center', lineBreak: false });
}

// ─── Chart: mini score pill row ───────────────────────────────────────────────
function drawScorePillRow(doc, x, y, competencies, maxW) {
  const pillW = (maxW - (competencies.length - 1) * 6) / competencies.length;
  for (let i = 0; i < competencies.length; i++) {
    const comp = competencies[i];
    const color = levelColor(comp.level);
    const px = x + i * (pillW + 6);
    rPanel(doc, px, y, pillW, 46, '#0f0f12', C.strokeSoft, 8);
    // mini arc
    const gx = px + pillW / 2, gy = y + 22;
    drawArcGauge(doc, gx, gy, 10, comp.score, color, 3);
    doc.font('Helvetica-Bold').fontSize(8).fillColor(C.text)
       .text(String(comp.score), gx - 8, gy - 5, { width: 16, align: 'center', lineBreak: false });
    writeText(doc, comp.name.split(' ')[0], px + 4, y + 34, { width: pillW - 8, size: 6, color, align: 'center' });
  }
  return y + 46 + 8;
}

// ─── Chart: visual roadmap connector ─────────────────────────────────────────
function drawRoadmapFlow(doc, x, y, w, months) {
  const n = months.length;
  const segW = (w - (n - 1) * 4) / n;
  for (let i = 0; i < n; i++) {
    const bx = x + i * (segW + 4);
    const color = i === 0 ? C.green : i === 1 ? C.blue : C.purple;
    rPanel(doc, bx, y, segW, 28, '#0f0f12', color, 8);
    writeLabel(doc, `Month ${i + 1}`, bx + 10, y + 7, color);
    writeSingleLine(doc, safeText(months[i]).slice(0, 26), bx + 10, y + 17, { width: segW - 18, size: 7.5, color: C.text });
    if (i < n - 1) {
      const arrowX = bx + segW + 1;
      doc.save().moveTo(arrowX, y + 14).lineTo(arrowX + 3, y + 14).lineWidth(1).strokeColor(C.stroke).stroke().restore();
    }
  }
  return y + 28 + 8;
}

// ─── Chart: visual gap bars (growth priority) ────────────────────────────────
function drawGapBar(doc, x, y, w, score, color, label) {
  const filled = (score / 100) * w;
  const gap = ((90 - Math.min(score, 90)) / 100) * w;
  doc.save().roundedRect(x, y, w, 10, 5).fill(C.strokeSoft).restore();
  doc.save().roundedRect(x, y, filled, 10, 5).fill(color).restore();
  if (score < 90) {
    doc.save().roundedRect(x + filled, y, gap, 10, 0).fillOpacity(0.2).fill(C.red).restore();
  }
  // threshold marker at 90
  const thX = x + (90 / 100) * w;
  doc.save().rect(thX, y - 2, 1, 14).fill(C.faint).restore();
  doc.font('Helvetica').fontSize(6).fillColor(C.faint).text('90', thX + 2, y + 2, { lineBreak: false });
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(color)
     .text(`${score}/100`, x, y + 13, { width: 50, lineBreak: false });
  if (label) {
    doc.font('Helvetica').fontSize(7).fillColor(C.faint)
       .text(label, x + w - 60, y + 13, { width: 60, align: 'right', lineBreak: false });
  }
  return y + 28;
}

function drawOrbitalCluster(doc, cx, cy, s = 1) {
  doc.save();
  doc.circle(cx, cy, 72 * s).lineWidth(0.8).strokeOpacity(0.15).strokeColor(C.green).stroke();
  doc.circle(cx, cy, 46 * s).lineWidth(0.6).strokeOpacity(0.12).strokeColor(C.blue).stroke();
  doc.circle(cx + 8 * s, cy - 6 * s, 22 * s).fillOpacity(0.05).fill(C.green);
  doc.circle(cx + 8 * s, cy - 6 * s, 6 * s).fill(C.green);
  doc.circle(cx - 36 * s, cy + 20 * s, 4 * s).fillOpacity(0.8).fill(C.blue);
  doc.circle(cx + 42 * s, cy + 12 * s, 3 * s).fillOpacity(0.8).fill(C.purple);
  doc.moveTo(cx - 36 * s, cy + 20 * s).lineTo(cx + 8 * s, cy - 6 * s)
     .lineWidth(0.6).strokeOpacity(0.18).strokeColor(C.blue).stroke();
  doc.moveTo(cx + 42 * s, cy + 12 * s).lineTo(cx + 8 * s, cy - 6 * s)
     .lineWidth(0.6).strokeOpacity(0.18).strokeColor(C.green).stroke();
  doc.restore();
}

// ─── Layout constants — used identically in measure() AND writeText() ──────────
// This prevents the #1 cause of overlaps: measuring at width W but rendering at W±N.
const IP   = 18;                   // inner horizontal padding inside a full-width panel
const IW   = CONTENT_W - IP * 2;  // text width inside full-width panels
const GAP  = 16;                   // standard vertical gap between panels
const HBUF = 28;                   // extra height buffer on every estimated panel

// ─── Layout helpers ───────────────────────────────────────────────────────────
function sectionHeader(doc, eyebrow, title, subtitle, y) {
  writeLabel(doc, eyebrow, MARGIN, y, C.faint);
  doc.save().rect(MARGIN, y + 11, 24, 1).fill(C.green).restore();
  let cy = y + 16;
  cy = writeText(doc, title, MARGIN, cy, { size: 20, font: 'Helvetica-Bold', color: C.text, lineGap: 0 });
  if (subtitle) cy = writeText(doc, subtitle, MARGIN, cy + 3, { size: 9.5, color: C.soft, lineGap: 1.5 });
  return cy + 14;
}

function pageHeader(doc, num, title, sub, y) {
  return sectionHeader(doc, `Page ${String(num).padStart(2, '0')}`, title, sub, y);
}

// safeY: after rendering content inside a panel, advance past the LARGER of
// (estimated panel bottom) vs (actual doc.y after rendering). This is the core
// fix that prevents overlap when text wraps more than the estimate expected.
function safeY(panelY, panelH, docY, gap = GAP) {
  return Math.max(panelY + panelH, docY) + gap;
}

function accentQuote(doc, text, y) {
  const bodyW = IW;
  const h = measure(doc, `"${text}"`, bodyW, 11, 'Helvetica-Bold') + 52 + HBUF;
  rPanel(doc, MARGIN, y, CONTENT_W, h, '#0c1410', '#27272a', 14);
  doc.save().rect(MARGIN, y, 3, h).fill(C.green).restore();
  writeLabel(doc, 'Key Insight', MARGIN + IP, y + 14, C.green);
  writeText(doc, `"${text}"`, MARGIN + IP, y + 30, {
    width: bodyW, size: 11, font: 'Helvetica-Bold', color: C.green, lineGap: 2.5,
  });
  return safeY(y, h, doc.y);
}

function infoPanel(doc, label, body, y) {
  const bodyW = IW;
  const h = measure(doc, body, bodyW, 9.5) + 48 + HBUF;
  rPanel(doc, MARGIN, y, CONTENT_W, h, C.panel, C.stroke, 14);
  writeLabel(doc, label, MARGIN + IP, y + 14, C.faint);
  writeText(doc, body, MARGIN + IP, y + 30, { width: bodyW, size: 9.5, color: C.muted, lineGap: 2.5 });
  return safeY(y, h, doc.y);
}

// ─── Main render (two-pass: called once for probe, once for real) ──────────────
function renderContent(doc, analysis) {

  // ── Data ─────────────────────────────────────────────────────────────────────
  const defaultComps = [
    { name: 'Strategic Thinking',         score: 72, level: 'Developing', deepDive: 'You can identify the next move clearly, but the 6–12 month horizon needs deliberate airtime in your calendar and communication.' },
    { name: 'Delegation & Empowerment',   score: 65, level: 'Emerging',   deepDive: 'You delegate tasks, but outcome ownership tends to flow back toward you under pressure or when stakes rise.' },
    { name: 'Coaching & Feedback',        score: 81, level: 'Strong',     deepDive: 'You set standards well and develop others when you stay in coaching mode rather than solving mode.' },
    { name: 'Influence & Stakeholders',   score: 68, level: 'Developing', deepDive: 'You are credible operationally, but senior alignment improves when you lead with business context and strategic framing.' },
    { name: 'Execution & Accountability', score: 89, level: 'Advanced',   deepDive: 'Execution is the strongest trust signal in your profile. Outcomes move consistently when you are involved.' },
    { name: 'Emotional Intelligence',     score: 76, level: 'Strong',     deepDive: 'You read teams well and create stability. The next upgrade is using that awareness in high-stakes conversations.' },
  ];

  const comps    = safeArray(analysis.competencies, defaultComps).slice(0, 6);
  const sorted   = [...comps].sort((a, b) => b.score - a.score);
  const strongest = sorted[0] || defaultComps[4];
  const weakest   = sorted[sorted.length - 1] || defaultComps[1];
  const sw2       = sorted[sorted.length - 2] || defaultComps[0];
  const delComp   = comps.find(c => /deleg|empower|team/i.test(c.name)) || weakest;
  const stratComp = comps.find(c => /strateg/i.test(c.name)) || sw2;
  const infComp   = comps.find(c => /influ|stakeholder/i.test(c.name)) || sw2;

  const growthAreas = safeArray(analysis.topGrowthAreas, [
    { title: 'Delegation Depth',        description: 'You delegate tasks, but not always the ownership of outcomes. The next step is transferring the result, not just the work.',          actionSteps: ['Move from "Here is what to do" to "Here is the result we must own."', 'Define decision rights before handoff, not after escalation.', 'Review outcomes without reclaiming the task.'] },
    { title: 'Strategic Communication', description: 'Your communication is precise but operational. Senior leadership responds better to narrative framing tied to business context.',     actionSteps: ['Use Vision → Context → Action → Impact structure.', 'Lead updates with why it matters, not what happened.', 'Translate delivery progress into enterprise-level consequence.'] },
    { title: 'Scaling Systems',         description: 'You optimise inside your team effectively. The next leap is designing feedback loops that improve work across teams, not just within your unit.', actionSteps: ['Identify one recurring friction point that crosses team boundaries.', 'Replace heroic interventions with a repeatable mechanism.', 'Document the process so others can run it without you.'] },
  ]).slice(0, 3);

  const blindSpots  = safeArray(analysis.blindSpots,       ['May default to doing instead of designing.', 'High standards can inadvertently limit team autonomy.', 'Strategic storytelling may be underutilised.']);
  const strengths   = safeArray(analysis.strengthLevers,   ['Drives results through disciplined structure.', 'Sets and maintains clear performance expectations.', 'Comfortable owning difficult accountability conversations.', 'Strong KPI and metrics-oriented mindset.']);
  const stakPlay    = safeArray(analysis.stakeholderPlaybook, ['Manager: weekly three-point update on business impact and forward risk.', 'Peers: one informal alignment session per month before priorities drift.', 'Team: coach for ownership first, inspect outcomes rather than activity.', 'Senior stakeholders: connect communications to risk reduction and velocity.', 'Skip-level leaders: quarterly insight updates on team capability trends.']);
  const sprint      = safeArray(analysis.firstWeekPlan,    ['Audit every recurring responsibility that currently depends on your personal involvement.', 'Convert your next team 1:1 into a development coaching conversation, not a status review.', 'Write and send one strategic narrative update to your manager.', 'Name one decision a team member can own this week without escalation.', 'Map your top 3 stakeholders and their current expectations of your role.', 'Block a Friday reflection slot to review leverage created vs effort spent.', 'Share your 90-day growth intent with your team.']);
  const kpis        = safeArray(analysis.kpis,             ['Delegation ratio: work owned by team vs. self (%)', 'Team decisions made without escalation (count)', 'Proactive stakeholder updates sent (weekly)', 'Cross-functional friction points resolved', 'Development conversations completed per month', 'Strategic priorities visibly advanced this quarter']);
  const dailyCad    = safeArray(analysis.operatingCadence?.daily,   ['15-minute priorities and blockers check', 'One coaching touchpoint with a team member', 'Clear at least one team blocker without solving it yourself']);
  const weeklyCad   = safeArray(analysis.operatingCadence?.weekly,  ['Team sync with ownership review', 'Stakeholder narrative update on business impact', 'Leadership reflection: what did I own that the team should own?']);
  const monthlyCad  = safeArray(analysis.operatingCadence?.monthly, ['Strategic direction calibration with your manager', 'Cross-functional alignment session', 'Operating system redesign: what broke, what scaled?']);
  const iWins       = safeArray(analysis.decisionMatrix?.immediateWins, ['Reshape 1:1 agendas toward development', 'Delegate one recurring process', 'Sharpen weekly stakeholder updates', 'Clarify team decision ownership rights']);
  const sBets       = safeArray(analysis.decisionMatrix?.strategicBets, ['Build full delegation framework', 'Upgrade cross-functional influence', 'Design successor development pathway', 'Create cross-team operating leverage loop']);

  const roadmap      = analysis.roadmap || {};
  const roadmapCards = [roadmap.month1, roadmap.month2, roadmap.month3].filter(Boolean).length
    ? [roadmap.month1, roadmap.month2, roadmap.month3].filter(Boolean)
    : [
        { theme: 'Foundation', title: 'Shift from Doer to Designer',   actions: ['Audit all tasks where you are the single point of execution.', 'Redesign 1:1 structure toward coaching conversations.', 'Create 3 team-level ownership KPIs with clear owners.', 'Map every stakeholder relationship and their expectations.'] },
        { theme: 'Influence',  title: 'Strengthen Strategic Presence', actions: ['Practice executive narrative framing on every major update.', 'Align all quarterly goals explicitly to business outcomes.', 'Run 2 proactive stakeholder alignment conversations this month.', 'Delegate one full process end-to-end, including decision rights.'] },
        { theme: 'Scale',      title: 'Multiply and Embed',            actions: ['Create a successor capability plan for your most dependable team member.', 'Build a scalable performance management system the team can own.', 'Document your leadership philosophy in a one-page operating guide.', 'Conduct a 90-day retrospective on ownership and autonomy.'] },
      ];

  const personName  = safeText(analysis.personName || analysis.fullName || analysis.name, 'Leadership Professional');
  const date        = formatDate(analysis.assessmentDate);
  const score       = clamp(analysis.leadershipScore || 78, 0, 100);
  const stageBase   = safeText(analysis.leadershipStage, 'Scaling Manager');
  const stageFull   = stageBase.includes('→') ? stageBase : `${stageBase} → ${nextStage(stageBase)}`;
  const archName    = safeText(analysis.archetype?.name, 'The Scaling Builder');
  const archDesc    = safeText(analysis.archetype?.description, 'A performance-driven builder who creates order, accountability, and momentum through structure. The next evolution requires shifting from personal throughput to scalable leadership leverage across functions and levels.');
  const plateauRisk = safeText(analysis.plateauRisk, 'Burnout or becoming the best individual-contributor manager in the room instead of evolving into an enterprise-level strategic leader.');
  const summary     = safeText(analysis.executiveSummary, 'You are a performance-driven leader with strong ownership and execution capabilities. Your next evolution requires shifting from operator to multiplier — increasing strategic leverage, delegation depth, and cross-functional influence so your impact extends well beyond your direct effort and presence.');
  const keyInsight  = safeText(analysis.keyInsight, 'The difference between a strong manager and a respected leader is leverage. Leverage means your impact outlasts your presence in the room.');
  const commScript  = safeText(analysis.communicationScript, 'This quarter I am deliberately shifting from direct execution toward scalable leadership leverage. My focus areas are delegation depth, sharper strategic framing, and more intentional cross-functional alignment — so the team delivers with more autonomy and senior stakeholders experience me as more strategic.');
  const outcome90   = safeText(analysis.ninetyDayOutcome, 'If you execute this plan consistently, your role will shift from dependable operator to respected force multiplier. Your team will rely less on your constant involvement and will make better decisions independently. Senior stakeholders will experience you as more strategic, more influential, and fundamentally more scalable as a leader.');
  const biggestGap = gapToAdvanced(weakest.score);

  const decisionRules = [
    `If a decision is reversible and impact is below medium, delegate with clear guardrails and review the outcome asynchronously.`,
    `If a decision affects two or more teams, lead with business context first, then ask owners to propose options before you choose.`,
    `If the issue appears for the second time in 30 days, do not solve the incident only — design a prevention mechanism.`,
    `If a stakeholder asks for urgent output, clarify consequence, owner, and deadline in one message before work starts.`,
    `If your calendar has less than 15% strategic time this week, proactively remove or delegate one operational commitment.`,
  ];

  const weeklyReviewPrompts = [
    `What did I personally do this week that should become a team-owned system by next month?`,
    `Which stakeholder now has more confidence in my strategic judgment, and what specific behaviour created that trust?`,
    `Where did I over-instruct instead of coaching ownership, and how will I correct it next week?`,
    `Which recurring friction pattern did I design out instead of firefighting again?`,
    `What evidence shows my team made higher-quality decisions without my intervention?`,
  ];

  const riskRegister = [
    {
      risk: 'Delegation rollback during high-pressure weeks',
      signal: 'Critical tasks quietly come back to you',
      mitigation: 'Freeze ownership map; review handoffs twice weekly; coach decision quality instead of retaking work.',
    },
    {
      risk: 'Strategic communication remains operational',
      signal: 'Updates describe activity but not consequence',
      mitigation: 'Apply Vision -> Context -> Action -> Impact format in every senior update for 6 weeks.',
    },
    {
      risk: 'Cross-functional influence plateaus',
      signal: 'Peers align late; priorities drift',
      mitigation: 'Run two pre-alignment sessions before each major milestone and document decisions publicly.',
    },
    {
      risk: 'Team autonomy grows unevenly',
      signal: 'One or two people own most decisions',
      mitigation: 'Rotate ownership zones monthly; set explicit decision rights for each role.',
    },
  ];

  const sixMonthOutcomes = [
    {
      phase: 'Months 1-2',
      focus: 'Stabilise ownership transfer',
      outcomes: [
        'At least 25% more team-owned decisions without escalation.',
        '1:1 conversations shift from status to development in >70% of sessions.',
        'Stakeholder updates become predictable, concise, and context-led.',
      ],
    },
    {
      phase: 'Months 3-4',
      focus: 'Scale strategic influence',
      outcomes: [
        'Peers involve you earlier in planning discussions.',
        'Cross-team dependencies are mapped and reviewed in a recurring cadence.',
        'You spend visibly less time in direct execution and more in systems design.',
      ],
    },
    {
      phase: 'Months 5-6',
      focus: 'Embed leader-multiplier system',
      outcomes: [
        'A successor candidate is running one critical workflow independently.',
        'Team health, output, and decision quality remain stable during your absence.',
        'Senior leadership sees you as a scaling leader ready for broader scope.',
      ],
    },
  ];

  const stageStr = stageFull.toLowerCase();
  let curStep = 3;
  if (stageStr.includes('individual'))                                    curStep = 1;
  else if (stageStr.includes('new manager'))                              curStep = 2;
  else if (stageStr.includes('scaling'))                                  curStep = 3;
  else if (stageStr.includes('strategic') || stageStr.includes('senior')) curStep = 4;
  else if (stageStr.includes('executive') || stageStr.includes('vp') || stageStr.includes('director')) curStep = 5;

  const stageCards = [
    { name: 'Individual Contributor', shift: 'Prove personal capability and build delivery credibility through consistent results.' },
    { name: 'New Manager',            shift: 'Move from doing the work to directing and enabling others to do the work.' },
    { name: 'Scaling Manager',        shift: 'Create repeatability, coaching systems, and operating models that multiply team output.' },
    { name: 'Strategic Leader',       shift: 'Shape organisational direction and influence outcomes across functions without direct authority.' },
    { name: 'Executive Leader',       shift: 'Allocate attention, capital, and leadership energy at enterprise level to drive compound returns.' },
  ];

  const benchItems = comps.map((c, i) => ({ name: c.name, youScore: c.score, peerScore: peerAvg(c.score, i), youLabel: benchBand(c.score), peerLabel: benchBand(peerAvg(c.score, i)) }));

  let y = 40;

  // ════════════════════════════════════════════════════════════════════════════
  // COVER PAGE
  // ════════════════════════════════════════════════════════════════════════════
  const coverH = 388;
  rPanel(doc, MARGIN, y, CONTENT_W, coverH, C.panelAlt, C.stroke, 20);
  doc.save().circle(PAGE_W - MARGIN - 104, y + 130, 96).fillOpacity(0.03).fill(C.green).restore();
  doc.save().circle(MARGIN + 76, y + 68, 44).fillOpacity(0.02).fill(C.blue).restore();
  writeLabel(doc, 'CAREERA · LEADERSHIP INTELLIGENCE', MARGIN + 22, y + 20, C.faint);
  doc.save().rect(MARGIN + 22, y + 30, 28, 1).fill(C.green).restore();
  writeText(doc, 'From Manager\nto Respected Leader', MARGIN + 22, y + 44, { width: CONTENT_W * 0.56, size: 28, font: 'Helvetica-Bold', color: C.text, lineGap: 2 });
  writeText(doc, 'Your Personalised Leadership Growth Report', MARGIN + 22, y + 118, { width: CONTENT_W * 0.56, size: 10.5, color: C.soft });

  let cmY = y + 152;
  for (const { label, value } of [{ label: 'For', value: personName }, { label: 'Assessment Date', value: date }, { label: 'Leadership Stage', value: stageFull }]) {
    writeLabel(doc, label, MARGIN + 22, cmY, C.faint);
    writeText(doc, value, MARGIN + 22, cmY + 11, { width: CONTENT_W * 0.55, size: 9.5, font: 'Helvetica-Bold', color: C.muted });
    cmY += 28;
  }

  const ciW = CONTENT_W * 0.47, ciH = measure(doc, `"${keyInsight}"`, ciW - 28, 10, 'Helvetica-Bold') + 44 + HBUF;
  rPanel(doc, MARGIN + 22, y + 248, ciW, ciH, '#0c140c', '#27272a', 12);
  writeLabel(doc, 'Mission Brief', MARGIN + 38, y + 262, C.green);
  writeText(doc, `"${keyInsight}"`, MARGIN + 38, y + 276, { width: ciW - 32, size: 10, font: 'Helvetica-Bold', color: C.green, lineGap: 2 });

  const gCx = PAGE_W - MARGIN - 104, gCy = y + 134;
  drawOrbitalCluster(doc, gCx, gCy, 1);
  drawArcGauge(doc, gCx, gCy, 44, score, C.green, 7);
  doc.font('Helvetica-Bold').fontSize(26).fillColor(C.text).text(String(score), gCx - 26, gCy - 17, { width: 52, align: 'center', lineBreak: false });
  doc.font('Helvetica').fontSize(9).fillColor(C.soft).text('/100', gCx - 22, gCy + 12, { width: 44, align: 'center', lineBreak: false });
  writeLabel(doc, 'Readiness Score', gCx - 44, gCy + 58, C.faint);

  const metaY = y + coverH - 52, metaW = (CONTENT_W - 30) / 3;
  doc.save().rect(MARGIN + 14, metaY - 6, CONTENT_W - 28, 0.5).fill(C.stroke).restore();
  for (const [idx, { label, value }] of [{ label: 'Stage', value: shortStage(stageFull) }, { label: 'Target', value: nextStage(stageFull) }, { label: 'Archetype', value: archName }].entries()) {
    const mx = MARGIN + 14 + idx * (metaW + 10);
    writeLabel(doc, label, mx, metaY, C.faint);
    writeText(doc, value, mx, metaY + 12, { width: metaW - 6, size: 8.5, font: 'Helvetica-Bold', color: C.muted });
  }
  y += coverH + 24;

  // TOC strip
  const tocItems = ['Exec Summary', 'Competency Profile', 'Deep Dives', 'Archetype', 'Growth Gaps', 'Roadmap', 'Benchmark', 'Evolution Path', 'Dashboard', 'Habits', 'Signals', 'Reflection'];
  const tocItemW = CONTENT_W / tocItems.length;
  rPanel(doc, MARGIN, y, CONTENT_W, 40, '#0f0f12', C.strokeSoft, 10);
  writeLabel(doc, 'Contents', MARGIN + 12, y + 10, C.faint);
  tocItems.forEach((item, i) => {
    doc.font('Helvetica').fontSize(6.5).fillColor(C.faint)
       .text(`${i + 1}. ${item}`, MARGIN + 12 + i * tocItemW, y + 24, { width: tocItemW - 4, lineBreak: false });
  });
  y = safeY(y, 40, doc.y, 24);

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 2 — EXECUTIVE SUMMARY
  // ════════════════════════════════════════════════════════════════════════════
  doc.save().rect(MARGIN, y, CONTENT_W, 0.75).fill(C.stroke).restore();
  y += 22;
  y = pageHeader(doc, 2, 'Executive Summary', 'A precise reading of your leadership readiness, core strengths, and immediate leverage points.', y);

  // Score card + snapshot (fixed left width, right height scales to content)
  const lw = 168, rw = CONTENT_W - lw - 14;
  const snapBullets = [
    'Strong: Operational leadership and delivery track record.',
    'Strong: High accountability and performance orientation.',
    `Focus: ${delComp.name} — delegation of outcomes, not just tasks.`,
    `Focus: ${infComp.name} — strategic influence with senior stakeholders.`,
  ];
  const snapH = 62 + snapBullets.reduce((s, t) => s + measure(doc, t, rw - 50, 8.5) + 7, 0)
              + measure(doc, summary, rw - 28, 9.5) + 18 + HBUF;
  const scoreCardH = Math.max(170, snapH);

  rPanel(doc, MARGIN, y, lw, scoreCardH, C.panel, C.stroke, 14);
  drawArcGauge(doc, MARGIN + lw / 2, y + 74, 34, score, C.green, 7);
  doc.font('Helvetica-Bold').fontSize(28).fillColor(C.text)
     .text(String(score), MARGIN + lw / 2 - 26, y + 61, { width: 52, align: 'center', lineBreak: false });
  doc.font('Helvetica').fontSize(8.5).fillColor(C.soft)
     .text('/100', MARGIN + lw / 2 - 18, y + 93, { width: 36, align: 'center', lineBreak: false });
  writeLabel(doc, 'Leadership Readiness', MARGIN + 14, y + 124, C.green);
  const lvl = score >= 85 ? 'High Readiness' : score >= 70 ? 'Solid Readiness' : 'Developing';
  writeText(doc, lvl, MARGIN + 14, y + 137, { width: lw - 28, size: 11.5, font: 'Helvetica-Bold', color: C.text });
  writeText(doc, `Stage: ${shortStage(stageFull)}`, MARGIN + 14, y + 154, { width: lw - 28, size: 8.5, color: C.soft });

  rPanel(doc, MARGIN + lw + 14, y, rw, scoreCardH, C.panel, C.stroke, 14);
  writeLabel(doc, 'Snapshot Overview', MARGIN + lw + 28, y + 14, C.faint);
  let sny = y + 30;
  for (const [idx, text] of snapBullets.entries()) {
    const col = idx < 2 ? C.green : C.amber;
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(col).text('•', MARGIN + lw + 28, sny + 1, { lineBreak: false });
    sny = writeText(doc, text, MARGIN + lw + 40, sny, { width: rw - 52, size: 8.5, color: C.muted, lineGap: 1.5 }) + 7;
  }
  sny += 6;
  writeText(doc, summary, MARGIN + lw + 28, sny, { width: rw - 40, size: 9.5, color: C.soft, lineGap: 2.4 });

  y = safeY(y, scoreCardH, doc.y);

  // Visual stat row — large score dial + two metric cards
  const dialSz = 140;
  rPanel(doc, MARGIN, y, dialSz, dialSz, C.panel, C.stroke, 14);
  drawScoreDial(doc, MARGIN + dialSz / 2, y + dialSz / 2 - 4, 48, score, C.green);
  writeLabel(doc, 'Readiness Score', MARGIN + 14, y + dialSz - 22, C.faint);

  const metricW = (CONTENT_W - dialSz - 14 - 12) / 2;
  for (const [i, { label, value, sub, color }] of [
    { label: 'Top Strength',    value: strongest.name.split(' ')[0], sub: `${strongest.score}/100 · ${strongest.level}`, color: C.green },
    { label: 'Growth Priority', value: weakest.name.split(' ')[0],   sub: `${weakest.score}/100 · ${weakest.level}`,   color: C.amber },
  ].entries()) {
    const x = MARGIN + dialSz + 14 + i * (metricW + 12);
    rPanel(doc, x, y, metricW, dialSz, '#0f0f12', C.strokeSoft, 12);
    writeLabel(doc, label, x + 14, y + 14, C.faint);
    doc.font('Helvetica-Bold').fontSize(17).fillColor(color)
       .text(value, x + 14, y + 30, { width: metricW - 28, lineBreak: false });
    writeText(doc, sub, x + 14, y + 54, { width: metricW - 28, size: 8, color: C.soft });
    // mini arc at bottom of card
    drawArcGauge(doc, x + metricW / 2, y + dialSz - 28, 16, i === 0 ? strongest.score : weakest.score, color, 4);
  }
  y += dialSz + GAP;

  // Competency pill strip — all 6 as tiny visual gauges
  y = drawScorePillRow(doc, MARGIN, y, comps, CONTENT_W);

  y = infoPanel(doc, 'Assessment Context', summary, y);
  y = accentQuote(doc, keyInsight, y);

  for (const { label, text } of [
    { label: 'What This Score Means', text: `A score of ${score}/100 places you in the ${benchBand(score).toLowerCase()} performance tier when measured against leaders at a comparable stage. This assessment evaluates six evidence-based leadership dimensions that are consistently predictive of effective leadership at the transition between operational management and strategic leadership. Your profile shows clear asymmetry between your execution capability and your strategic leverage capacity — which is both normal and fixable at this stage.` },
    { label: 'Where You Create Most Value', text: `Your most consistent value-creation mechanism is ${strongest.name}: reliable, predictable delivery that builds trust with teams and stakeholders. People know what to expect from you and you rarely create negative surprises. That reliability is the foundation that allows everything else to be built. However, it also creates a gravitational pull that keeps you executing instead of designing.` },
    { label: 'Where Your Ceiling Sits', text: `The ceiling in your current profile is ${delComp.name} at ${delComp.score}/100. You are delegating tasks but retaining outcome ownership. When the leader owns the outcome, the team learns to execute. When the team owns the outcome, the leader learns to coach — and the organisation learns to scale. The next chapter of your leadership is about that transfer.` },
  ]) {
    y = infoPanel(doc, label, text, y);
  }

  doc.save().rect(MARGIN, y, CONTENT_W, 0.75).fill(C.stroke).restore();
  y += 22;

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 3 — COMPETENCY PROFILE
  // ════════════════════════════════════════════════════════════════════════════
  y = pageHeader(doc, 3, 'Leadership Competency Profile', 'Six dimensions measured against an evidence-based model for leaders at your stage.', y);

  // Radar + bars — fixed 264px
  const rpH = 264, rpW = CONTENT_W * 0.46, rbW = CONTENT_W - rpW - 14;
  rPanel(doc, MARGIN, y, rpW, rpH, C.panel, C.stroke, 14);
  writeLabel(doc, 'Radar View', MARGIN + 14, y + 14, C.faint);
  if (comps.length >= 3) drawRadarChart(doc, MARGIN + rpW / 2, y + 140, 86, comps);

  rPanel(doc, MARGIN + rpW + 14, y, rbW, rpH, C.panel, C.stroke, 14);
  writeLabel(doc, 'Dimension Scores', MARGIN + rpW + 28, y + 14, C.faint);
  let sbY = y + 30;
  for (const comp of comps) {
    const color = levelColor(comp.level);
    writeText(doc, comp.name, MARGIN + rpW + 28, sbY, { width: rbW - 74, size: 8.5, font: 'Helvetica-Bold', color: C.text });
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(color)
       .text(`${comp.score}`, MARGIN + rpW + rbW - 38, sbY, { width: 30, align: 'right', lineBreak: false });
    sbY += 13;
    drawProgressBar(doc, MARGIN + rpW + 28, sbY, rbW - 46, comp.score, color, 5);
    sbY += 9;
    writeText(doc, comp.level, MARGIN + rpW + 28, sbY, { width: rbW - 60, size: 7, color: C.faint });
    sbY += 14;
  }
  y += rpH + GAP;

  // Growth headline with visual gap indicator
  const glH = 72;
  rPanel(doc, MARGIN, y, CONTENT_W, glH, '#0c140c', '#27272a', 12);
  doc.save().rect(MARGIN, y, 3, glH).fill(C.green).restore();
  writeLabel(doc, 'Highest Leverage Growth Area', MARGIN + IP, y + 12, C.green);
  writeSingleLine(doc, `${delComp.name} + ${stratComp.name}`, MARGIN + IP, y + 26, { width: IW * 0.6, size: 11, font: 'Helvetica-Bold', color: C.green });
  // Visual gap bar on right side of this banner
  drawGapBar(doc, MARGIN + IW * 0.65, y + 18, IW * 0.35, delComp.score, C.green, `${gapToAdvanced(delComp.score)}pts to Advanced`);
  y += glH + GAP;

  // 2×3 gauge grid — fixed 90px per card
  const gcW = (CONTENT_W - 20) / 3, gcH = 90;
  for (let i = 0; i < comps.length; i++) {
    const col = i % 3, row = Math.floor(i / 3);
    const gx = MARGIN + col * (gcW + 10), gy = y + row * (gcH + 10);
    const comp = comps[i], color = levelColor(comp.level);
    rPanel(doc, gx, gy, gcW, gcH, '#0f0f12', C.strokeSoft, 12);
    const agCx = gx + 30, agCy = gy + gcH / 2;
    drawArcGauge(doc, agCx, agCy, 20, comp.score, color, 4);
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(C.text)
       .text(String(comp.score), agCx - 10, agCy - 7, { width: 20, align: 'center', lineBreak: false });
    const txX = gx + 60, txW = gcW - 68;
    writeSingleLine(doc, comp.name, txX, gy + 14, { width: txW, size: 8, font: 'Helvetica-Bold', color: C.text });
    writeSingleLine(doc, comp.level, txX, gy + 30, { width: txW, size: 7.5, color });
    writeSingleLine(doc, `Gap: ${gapToAdvanced(comp.score)}pts`, txX, gy + 44, { width: txW, size: 7, color: C.faint });
    drawProgressBar(doc, txX, gy + 58, txW, comp.score, color, 4);
    doc.save().rect(txX + (peerAvg(comp.score, i) / 100) * txW, gy + 56, 1, 8).fill('#ffffff44').restore();
  }
  y += Math.ceil(comps.length / 3) * (gcH + 10) - 10 + GAP;
  y = Math.max(y, doc.y + 8);
  y = infoPanel(
    doc,
    'How To Read This Profile',
    'Do not interpret this profile as a verdict on capability; interpret it as a map of where leverage will be highest. High scores represent strengths to codify and scale through others. Mid-range scores represent the next zone of growth where small behaviour shifts create visible performance gains. Lower scores represent structural bottlenecks where your current habits consume leadership bandwidth. The fastest progression comes from focusing on one gap at a time while protecting your top strength as an anchor.',
    y
  );
  doc.save().rect(MARGIN, y, CONTENT_W, 0.75).fill(C.stroke).restore();
  y += 22;

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 4 — COMPETENCY DEEP DIVES
  // ════════════════════════════════════════════════════════════════════════════
  y = pageHeader(doc, 4, 'Competency Intelligence', 'Detailed reading of each dimension: what the score means, how it shows up, and what to do next.', y);

  for (const comp of comps) {
    const color   = levelColor(comp.level);
    const deepTxt = safeText(comp.deepDive) || `At the ${comp.level} level, this capability is present but not yet consistently applied at scale. There is meaningful headroom available.`;
    const interp  = scoreInterpretation(comp.score);
    const actions = comp.score >= 80
      ? ['Use this as an active coaching asset — teach others how you do it.', 'Create visible cross-functional impact by bringing this strength to adjacent teams.', 'Document your approach so it becomes a repeatable team capability.']
      : comp.score >= 65
      ? ['Design one repeatable weekly practice targeting this dimension.', 'Request targeted developmental feedback after the next relevant situation.', 'Pair with a peer who has advanced competence here and observe their approach.']
      : ['Identify a single upcoming situation to practice this deliberately.', 'Find one peer who excels here and observe how they think and operate.', 'Create a monthly reflection prompt specifically for this dimension.'];
    const watchFor = comp.score >= 80
      ? 'Others asking you to coach them here — that is the signal it has become leadership capital.'
      : comp.score >= 65
      ? 'Team members referencing your approach in this area — it is beginning to land.'
      : 'Catching yourself reverting to old defaults under pressure — that is where the real practice happens.';

    const tw = CONTENT_W - 68;  // right panel text width (consistent measure/render)
    const deepH  = measure(doc, deepTxt, tw, 9);
    const interpH = measure(doc, interp, tw, 8.5);
    const actH   = actions.reduce((s, a) => s + measure(doc, a, tw - 12, 8.5) + 5, 0);
    const watchH = measure(doc, watchFor, tw, 8.5);
    const cardH  = 44 + deepH + 14 + interpH + 14 + actH + 14 + watchH + 20 + HBUF;

    rPanel(doc, MARGIN, y, CONTENT_W, cardH, '#0d0d10', C.stroke, 12);
    doc.save().rect(MARGIN, y, 3, cardH).fill(color).restore();

    const mCx = MARGIN + 28, mCy = y + 48;
    drawArcGauge(doc, mCx, mCy, 18, comp.score, color, 4);
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(C.text)
       .text(String(comp.score), mCx - 9, mCy - 6, { width: 18, align: 'center', lineBreak: false });

    const tx = MARGIN + 56;
    writeText(doc, comp.name, tx, y + 12, { width: tw, size: 11, font: 'Helvetica-Bold', color: C.text });
    writeText(doc, `${comp.level} · Gap to Advanced: ${gapToAdvanced(comp.score)}pts`, tx, y + 27, { width: tw, size: 8, color });

    let cy = y + 44;
    cy = writeText(doc, deepTxt, tx, cy, { width: tw, size: 9, color: C.soft, lineGap: 1.8 }) + 10;
    writeLabel(doc, 'Score interpretation', tx, cy, C.faint); cy += 13;
    cy = writeText(doc, interp, tx, cy, { width: tw, size: 8.5, color: C.muted, lineGap: 1.8 }) + 10;
    writeLabel(doc, 'Next actions', tx, cy, C.green); cy += 13;
    cy = drawBulletList(doc, actions, tx, cy, tw, { bullet: '→', size: 8.5, color: C.muted, bulletColor: C.green, gap: 4 }) + 10;
    writeLabel(doc, 'Watch for', tx, cy, C.faint); cy += 13;
    writeText(doc, watchFor, tx, cy, { width: tw, size: 8.5, color: C.soft, lineGap: 1.8 });

    y = safeY(y, cardH, doc.y, 12);
  }

  doc.save().rect(MARGIN, y, CONTENT_W, 0.75).fill(C.stroke).restore();
  y += 22;

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 5 — ARCHETYPE
  // ════════════════════════════════════════════════════════════════════════════
  y = pageHeader(doc, 5, 'Your Leadership Archetype', `${archName} — your dominant leadership pattern and how it shapes culture, decisions, and trust.`, y);

  const traitsList = safeArray(analysis.archetype?.traits, ['Structure builder', 'Execution-led accountability', 'High performance standards', 'KPI and metrics orientation', 'Strong delivery reliability']);
  y = drawChipRow(doc, traitsList, MARGIN, y, CONTENT_W);
  y += 10;

  {
    const h = measure(doc, archDesc, IW, 9.5) + 48 + HBUF;
    rPanel(doc, MARGIN, y, CONTENT_W, h, C.panel, C.stroke, 14);
    writeLabel(doc, 'Archetype Description', MARGIN + IP, y + 14, C.faint);
    writeText(doc, archDesc, MARGIN + IP, y + 30, { width: IW, size: 9.5, color: C.muted, lineGap: 2.5 });
    y = safeY(y, h, doc.y);
  }

  const plateauBody = `The ${archName} archetype is one of the most common profiles among managers promoted based on delivery performance. The challenge at this stage is that the behaviours that got you here — personal ownership, high standards, direct involvement — begin to create an invisible ceiling. The team learns to rely on you rather than developing the problem-solving capability needed to scale. The path forward is not changing your character, but applying your builder instinct to a bigger construction job: building a leadership system, not just a delivery system.`;
  y = infoPanel(doc, 'Why This Archetype Plateaus', plateauBody, y);

  // Strengths and blind spots — side by side
  const col2W = (CONTENT_W - 14) / 2;
  const lItems2 = blindSpots.slice(0, 4), rItems2 = strengths.slice(0, 4);
  const lH2 = 46 + lItems2.reduce((s, t) => s + measure(doc, t, col2W - 28, 8.5) + 7, 0) + HBUF;
  const rH2 = 46 + rItems2.reduce((s, t) => s + measure(doc, t, col2W - 28, 8.5) + 7, 0) + HBUF;
  const panelH2 = Math.max(lH2, rH2);
  rPanel(doc, MARGIN, y, col2W, panelH2, '#0d100d', C.stroke, 12);
  rPanel(doc, MARGIN + col2W + 14, y, col2W, panelH2, '#100d0d', C.stroke, 12);
  writeLabel(doc, 'Strengths to Leverage', MARGIN + 14, y + 14, C.green);
  writeLabel(doc, 'Blind Spots to Navigate', MARGIN + col2W + 28, y + 14, C.red);
  drawBulletList(doc, rItems2, MARGIN + 14, y + 30, col2W - 24, { bullet: '•', size: 8.5, color: C.soft, bulletColor: C.green, gap: 6 });
  drawBulletList(doc, lItems2, MARGIN + col2W + 28, y + 30, col2W - 36, { bullet: '•', size: 8.5, color: C.soft, bulletColor: C.red, gap: 6 });
  y = safeY(y, panelH2, doc.y);

  {
    const h = measure(doc, plateauRisk, IW, 9.5) + 40 + HBUF;
    rPanel(doc, MARGIN, y, CONTENT_W, h, '#13110b', '#27272a', 14);
    writeLabel(doc, 'Typical Plateau Risk', MARGIN + IP, y + 14, C.amber);
    writeText(doc, plateauRisk, MARGIN + IP, y + 30, { width: IW, size: 9.5, color: C.muted, lineGap: 2 });
    y = safeY(y, h, doc.y);
  }

  const aeItems = [
    { from: 'Executing tasks personally',          to: 'Designing systems that execute at scale' },
    { from: 'Setting individual performance bars', to: 'Building team-level performance architecture' },
    { from: 'Being accountable for outcomes',      to: 'Creating accountability systems without you' },
    { from: 'Solving problems when they arise',    to: 'Installing mechanisms that prevent recurrence' },
  ];
  const aeLeftW = CONTENT_W * 0.42 - IP;
  const aeRightW = CONTENT_W * 0.52 - 20;
  const aeRows = aeItems.map(({ from, to }) => ({
    from,
    to,
    rowH: Math.max(measure(doc, from, aeLeftW, 8.5), measure(doc, to, aeRightW, 8.5), 12) + 8,
  }));
  const aeH = 44 + aeRows.reduce((s, r) => s + r.rowH, 0) + HBUF;
  rPanel(doc, MARGIN, y, CONTENT_W, aeH, C.panel, C.stroke, 14);
  writeLabel(doc, 'The Evolution This Archetype Must Make', MARGIN + IP, y + 14, C.faint);
  let aeY = y + 30;
  for (const { from, to, rowH } of aeRows) {
    writeText(doc, from, MARGIN + IP, aeY, { width: aeLeftW, size: 8.5, color: C.red, lineGap: 1.6 });
    doc.font('Helvetica-Bold').fontSize(9).fillColor(C.faint).text('→', MARGIN + CONTENT_W * 0.44, aeY, { lineBreak: false });
    writeText(doc, to, MARGIN + CONTENT_W * 0.48, aeY, { width: aeRightW, size: 8.5, color: C.green, lineGap: 1.6 });
    aeY += rowH;
  }
  y = safeY(y, aeH, doc.y);
  doc.save().rect(MARGIN, y, CONTENT_W, 0.75).fill(C.stroke).restore();
  y += 22;

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 6 — GROWTH GAPS
  // ════════════════════════════════════════════════════════════════════════════
  y = pageHeader(doc, 6, 'Your Top 3 Growth Gaps', 'The three leadership upgrades most likely to shift how you are perceived and promoted over the next 12 months.', y);

  for (let i = 0; i < growthAreas.length; i++) {
    const area  = growthAreas[i];
    const desc  = safeText(area.description);
    const steps = safeArray(area.actionSteps, []);
    const deeper = 'This gap is not a skill deficit — it is a habit pattern built through years of being rewarded for direct execution. Closing it requires a deliberate shift in where you put your attention and what you allow to remain unresolved without your personal intervention.';
    const tw2    = CONTENT_W - 78;
    const descH  = measure(doc, desc, tw2, 9.5);
    const deepH  = measure(doc, deeper, tw2, 9);
    const stepsH = steps.reduce((s, a) => s + measure(doc, a, tw2 - 12, 8.5) + 5, 0);
    const cardH  = 52 + descH + 12 + deepH + 18 + stepsH + HBUF;

    rPanel(doc, MARGIN, y, CONTENT_W, cardH, C.panel, C.stroke, 14);
    rPanel(doc, MARGIN + 14, y + 14, 36, 36, '#0f1a14', C.green, 10);
    doc.font('Helvetica-Bold').fontSize(15).fillColor(C.green)
       .text(String(i + 1), MARGIN + 14, y + 22, { width: 36, align: 'center', lineBreak: false });

    writeText(doc, safeText(area.title), MARGIN + 62, y + 14, { width: CONTENT_W - 78, size: 11.5, font: 'Helvetica-Bold', color: C.text });
    let gy = writeText(doc, desc, MARGIN + 62, y + 32, { width: tw2, size: 9.5, color: C.muted, lineGap: 2 }) + 10;
    gy = writeText(doc, deeper, MARGIN + 62, gy, { width: tw2, size: 9, color: C.soft, lineGap: 2 }) + 10;
    writeLabel(doc, 'Upgrade Actions', MARGIN + 62, gy, C.green);
    drawBulletList(doc, steps, MARGIN + 62, gy + 14, tw2, { bullet: '→', size: 8.5, color: C.muted, bulletColor: C.green, gap: 4 });
    y = safeY(y, cardH, doc.y, 12);
  }

  // Priority matrix + scale moves
  const matSz = CONTENT_W * 0.46, matH2 = 226;
  const scW2 = CONTENT_W - matSz - 14;
  const scaleItems2 = ['Do now: delegation mechanics, 1:1 redesign, cleaner communication.', 'Plan next: successor development and cross-team leverage systems.', 'Delegate: recurring operational tasks and known-answer decisions.', 'Defer: anything not directly traceable to leverage or scale.', 'Measure progress through team ownership, not personal activity.', 'Review this matrix monthly — move one item from PLAN to DO.'];
  const scaleH2 = 40 + scaleItems2.reduce((s, t) => s + measure(doc, t, scW2 - 24, 8.5) + 8, 0) + HBUF;
  const twoColH2 = Math.max(matH2, scaleH2);

  rPanel(doc, MARGIN, y, matSz, twoColH2, C.panel, C.stroke, 14);
  writeLabel(doc, 'Priority Matrix', MARGIN + 14, y + 14, C.faint);
  drawPriorityMatrix(doc, MARGIN + 14, y + 30, matSz - 28, iWins, sBets);

  rPanel(doc, MARGIN + matSz + 14, y, scW2, twoColH2, C.panel, C.stroke, 14);
  writeLabel(doc, 'Scale Thinking', MARGIN + matSz + 28, y + 14, C.green);
  drawBulletList(doc, scaleItems2, MARGIN + matSz + 28, y + 30, scW2 - 36, { bullet: '•', size: 8.5, color: C.soft, bulletColor: C.green, gap: 7 });
  y = safeY(y, twoColH2, doc.y);
  doc.save().rect(MARGIN, y, CONTENT_W, 0.75).fill(C.stroke).restore();
  y += 22;

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 7 — 90-DAY ROADMAP
  // ════════════════════════════════════════════════════════════════════════════
  y = pageHeader(doc, 7, '90-Day Leadership Roadmap', 'Three months of sequenced action. Execute in order — each month builds what the next requires.', y);

  // Visual flow connector strip
  y = drawRoadmapFlow(doc, MARGIN, y, CONTENT_W, roadmapCards.map(c => safeText(c.theme, 'Focus')));
  // Classic timeline below
  const tlEnd = drawTimeline(doc, MARGIN, y, CONTENT_W, roadmapCards.map(c => safeText(c.theme, 'Focus')));
  y = tlEnd + 8;

  for (const [idx, card] of roadmapCards.entries()) {
    const actions2 = safeArray(card.actions, []);
    const actH3   = actions2.reduce((s, a) => s + measure(doc, a, CONTENT_W - 92, 8.5) + 5, 0);
    const cardH3  = 60 + actH3 + HBUF;
    rPanel(doc, MARGIN, y, CONTENT_W, cardH3, '#0f0f12', C.stroke, 14);
    rPanel(doc, MARGIN + 14, y + 14, 42, 42, '#141418', C.strokeSoft, 12);
    writeLabel(doc, `M${idx + 1}`, MARGIN + 14, y + 18, C.green);
    doc.font('Helvetica-Bold').fontSize(14).fillColor(C.text)
       .text(String(idx + 1), MARGIN + 14, y + 30, { width: 42, align: 'center', lineBreak: false });
    writeLabel(doc, safeText(card.theme, 'Focus'), MARGIN + 68, y + 14, C.green);
    writeText(doc, safeText(card.title), MARGIN + 68, y + 27, { width: CONTENT_W - 86, size: 11, font: 'Helvetica-Bold', color: C.text });
    drawBulletList(doc, actions2, MARGIN + 68, y + 46, CONTENT_W - 86, { bullet: '•', size: 8.5, color: C.soft, bulletColor: C.accent, gap: 4 });
    y = safeY(y, cardH3, doc.y, 12);
  }

  // Monthly markers
  const mrkW = (CONTENT_W - 24) / 3;
  const mrkData = [
    ['Month 1 Signals', 'Less time executing personally.', 'Team owns at least one new process.', 'Manager notices improving update quality.'],
    ['Month 2 Signals', 'Stakeholders describe you as strategic.', 'You are influencing, not just reporting.', 'One team member growing toward your level.'],
    ['Month 3 Signals', 'Team delivers without constant involvement.', 'You have visible enterprise-level impact.', 'People ask for direction, not permission.'],
  ];
  const mrkH = mrkData.reduce((mx, m) => Math.max(mx, 44 + m.slice(1).reduce((s, t) => s + measure(doc, t, mrkW - 24, 8) + 6, 0) + HBUF), 0);
  for (const [i, [label, ...items]] of mrkData.entries()) {
    const mx = MARGIN + i * (mrkW + 12);
    rPanel(doc, mx, y, mrkW, mrkH, '#0d100d', C.strokeSoft, 12);
    writeLabel(doc, label, mx + 12, y + 14, C.green);
    drawBulletList(doc, items, mx + 12, y + 28, mrkW - 22, { bullet: '✓', size: 8, color: C.soft, bulletColor: C.green, gap: 6 });
  }
  y = safeY(y, mrkH, doc.y);

  // Week-by-week
  const weekData = [
    { w: 'Week 1', focus: 'Map and audit: every recurring task you own, every decision escalated to you, every team member below their potential.' },
    { w: 'Week 2', focus: 'Transfer one process: pick one recurring operational task, brief the new owner, step back completely and observe.' },
    { w: 'Week 3', focus: 'Communication upgrade: send one strategic narrative update. Practice Vision → Context → Action → Impact in one stakeholder meeting.' },
    { w: 'Week 4', focus: 'Reflect and calibrate: what ownership transferred? What pulled back? What system change prevents the relapse?' },
  ];
  const focusW = CONTENT_W - IP - 76;
  const wkH = 44 + weekData.reduce((s, w) => s + measure(doc, w.focus, focusW, 8.5) + 10, 0) + HBUF;
  rPanel(doc, MARGIN, y, CONTENT_W, wkH, C.panel, C.stroke, 14);
  writeLabel(doc, 'Month 1 — Week-by-Week Breakdown', MARGIN + IP, y + 14, C.faint);
  let wkY = y + 30;
  for (const { w, focus } of weekData) {
    writeLabel(doc, w, MARGIN + IP, wkY, C.green);
    wkY = writeText(doc, focus, MARGIN + IP + 58, wkY, { width: focusW, size: 8.5, color: C.soft, lineGap: 1.8 }) + 10;
  }
  y = safeY(y, wkH, doc.y);
  doc.save().rect(MARGIN, y, CONTENT_W, 0.75).fill(C.stroke).restore();
  y += 22;

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 8 — BENCHMARK
  // ════════════════════════════════════════════════════════════════════════════
  y = pageHeader(doc, 8, 'Benchmark Comparison', 'How your profile compares to leaders at a similar stage of scope, team size, and complexity.', y);

  y = infoPanel(doc, 'Benchmark Methodology', 'The peer benchmark is drawn from Careera\'s assessment database of leaders at a comparable stage — typically managing teams of 4–20 people in complex environments, sitting one level below senior leadership. Scores represent median performance, not top performers. Being above the peer median is valuable; being at or below suggests a higher-leverage development opportunity.', y);

  // Table — fixed 28px rows
  const dimW2 = CONTENT_W * 0.38, youW2 = CONTENT_W * 0.24, peerW2 = CONTENT_W - dimW2 - youW2;
  const tableH = 34 + benchItems.length * 28;
  rPanel(doc, MARGIN, y, CONTENT_W, tableH, C.panel, C.stroke, 12);
  writeLabel(doc, 'Dimension', MARGIN + 14, y + 12);
  writeLabel(doc, 'Your Score', MARGIN + dimW2 + 14, y + 12);
  writeLabel(doc, 'Peer Average', MARGIN + dimW2 + youW2 + 14, y + 12);
  writeLabel(doc, 'Delta', MARGIN + CONTENT_W - 44, y + 12);
  let trY = y + 30;
  for (const [idx, item] of benchItems.entries()) {
    if (idx > 0) doc.save().rect(MARGIN + 12, trY - 4, CONTENT_W - 24, 0.5).fill(C.strokeSoft).restore();
    const color = levelColor(comps[idx]?.level || 'Developing');
    writeSingleLine(doc, item.name, MARGIN + 14, trY + 3, { width: dimW2 - 20, size: 8.5, font: 'Helvetica-Bold', color: C.text });
    writeSingleLine(doc, `${item.youScore}  ${item.youLabel}`, MARGIN + dimW2 + 14, trY + 3, { width: youW2 - 14, size: 8.5, color: C.muted });
    writeSingleLine(doc, `${item.peerScore}  ${item.peerLabel}`, MARGIN + dimW2 + youW2 + 14, trY + 3, { width: peerW2 - 50, size: 8.5, color: C.soft });
    const delta = item.youScore - item.peerScore;
    writeSingleLine(doc, `${delta > 0 ? '+' : ''}${delta}`, MARGIN + CONTENT_W - 44, trY + 3, { width: 36, size: 8.5, font: 'Helvetica-Bold', color: delta > 0 ? C.green : C.red, align: 'right' });
    trY += 28;
  }
  y = safeY(y, tableH, doc.y);

  // Grouped bar comparison — you (colored) above peer (white) per dimension
  const vizH = 44 + benchItems.length * 26 + HBUF;
  rPanel(doc, MARGIN, y, CONTENT_W, vizH, C.panel, C.stroke, 12);
  writeLabel(doc, 'Visual Comparison', MARGIN + IP, y + 14, C.faint);
  // Legend
  doc.save().roundedRect(MARGIN + CONTENT_W - 120, y + 11, 10, 6, 3).fill(C.green).restore();
  doc.font('Helvetica').fontSize(6.5).fillColor(C.soft).text('Your score', MARGIN + CONTENT_W - 106, y + 12, { lineBreak: false });
  doc.save().roundedRect(MARGIN + CONTENT_W - 54, y + 11, 10, 6, 3).fillOpacity(0.3).fill(C.accent).restore();
  doc.font('Helvetica').fontSize(6.5).fillColor(C.soft).text('Peer avg', MARGIN + CONTENT_W - 40, y + 12, { lineBreak: false });
  const vizBarW = CONTENT_W - IP * 2 - 150;
  let vizY = y + 28;
  for (const [i, item] of benchItems.entries()) {
    const color = levelColor(comps[i]?.level || 'Developing');
    vizY = drawGroupedBar(doc, MARGIN + IP, vizY, item.name, item.youScore, item.peerScore, vizBarW, color);
  }
  y = safeY(y, vizH, doc.y);

  const comparative = `Your strongest vs peers: ${strongest.name} (+${strongest.score - peerAvg(strongest.score, comps.indexOf(strongest))}pts). Your largest gap: ${weakest.name} (${weakest.score - peerAvg(weakest.score, comps.indexOf(weakest))}pts). Closing this single gap would move you into the upper quartile of this peer cohort overall.`;
  y = infoPanel(doc, 'Comparative Analysis', comparative, y);
  doc.save().rect(MARGIN, y, CONTENT_W, 0.75).fill(C.stroke).restore();
  y += 22;

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 9 — EVOLUTION PATH
  // ════════════════════════════════════════════════════════════════════════════
  y = pageHeader(doc, 9, 'Leadership Evolution Path', 'The five-stage model and the mindset shifts required at each transition point.', y);

  const stairH = 138;
  rPanel(doc, MARGIN, y, CONTENT_W, stairH + 44, C.panel, C.stroke, 14);
  drawEvolutionSteps(doc, MARGIN + 16, y + 12, CONTENT_W - 32, stairH, stageCards.map(s => s.name), curStep);
  y += stairH + 44 + GAP;

  for (const [i, card] of stageCards.entries()) {
    const here = (i + 1) === curStep, next = (i + 1) === curStep + 1;
    const h = measure(doc, card.shift, CONTENT_W - 36, 9) + 40 + HBUF;
    rPanel(doc, MARGIN, y, CONTENT_W, h, here ? '#141a14' : '#0f0f12', here ? C.green : C.strokeSoft, 12);
    doc.save().rect(MARGIN, y, 3, h).fill(here ? C.green : next ? C.blue : C.strokeSoft).restore();
    writeText(doc, `Stage ${i + 1} · ${card.name}`, MARGIN + 14, y + 10, { width: CONTENT_W - 80, size: 9.5, font: 'Helvetica-Bold', color: here ? C.text : C.soft });
    if (here) writeLabel(doc, 'You are here', MARGIN + CONTENT_W - 78, y + 12, C.green);
    if (next) writeLabel(doc, 'Your next horizon', MARGIN + CONTENT_W - 106, y + 12, C.blue);
    writeText(doc, card.shift, MARGIN + 14, y + 26, { width: CONTENT_W - 30, size: 9, color: here ? C.muted : C.faint, lineGap: 2 });
    y = safeY(y, h, doc.y, 8);
  }
      y += 4;

  const transText = `The transition from ${stageCards[curStep - 1]?.name || 'Scaling Manager'} to ${stageCards[curStep]?.name || 'Strategic Leader'} is the most commonly underestimated leadership shift. Most leaders at this inflection point try to work harder within the existing model rather than redesigning the model itself. The shift is not about doing more — it is about doing fundamentally different things.`;
  y = infoPanel(doc, 'The Transition You Are Making', transText, y);

  const msItems = [
    { from: 'Personal execution',       to: 'System design' },
    { from: 'Being accountable',        to: 'Building accountability systems' },
    { from: 'Fixing problems',          to: 'Installing prevention mechanisms' },
    { from: 'Informing stakeholders',   to: 'Influencing strategic direction' },
    { from: 'Managing performance',     to: 'Developing leadership in others' },
    { from: 'Delivering results',       to: 'Creating conditions for others to deliver' },
  ];
  const msLeftW = CONTENT_W * 0.42 - IP;
  const msRightW = CONTENT_W * 0.52 - 20;
  const msRows = msItems.map(({ from, to }) => ({
    from,
    to,
    rowH: Math.max(measure(doc, from, msLeftW, 8.5), measure(doc, to, msRightW, 8.5), 12) + 8,
  }));
  const msH = 44 + msRows.reduce((s, r) => s + r.rowH, 0) + HBUF;
  rPanel(doc, MARGIN, y, CONTENT_W, msH, C.panel, C.stroke, 14);
  writeLabel(doc, 'Critical Mindset Shifts Required', MARGIN + IP, y + 14, C.faint);
  let msY = y + 30;
  for (const { from, to, rowH } of msRows) {
    writeText(doc, from, MARGIN + IP, msY, { width: msLeftW, size: 8.5, color: C.red, lineGap: 1.6 });
    doc.font('Helvetica-Bold').fontSize(9).fillColor(C.faint).text('→', MARGIN + CONTENT_W * 0.44, msY, { lineBreak: false });
    writeText(doc, to, MARGIN + CONTENT_W * 0.48, msY, { width: msRightW, size: 8.5, color: C.green, lineGap: 1.6 });
    msY += rowH;
  }
  y = safeY(y, msH, doc.y);
  doc.save().rect(MARGIN, y, CONTENT_W, 0.75).fill(C.stroke).restore();
  y += 22;

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 10 — DASHBOARD
  // ════════════════════════════════════════════════════════════════════════════
  y = pageHeader(doc, 10, 'Mission Control Dashboard', 'Operating rhythms, KPIs, and meeting design so your growth is visible and measurable.', y);

  // 3-col cadence
  const cadW = (CONTENT_W - 24) / 3;
  const cadGroups = [{ label: 'Daily Cadence', items: dailyCad }, { label: 'Weekly Cadence', items: weeklyCad }, { label: 'Monthly Cadence', items: monthlyCad }];
  const cadH = Math.max(...cadGroups.map(g => 44 + g.items.reduce((s, t) => s + measure(doc, t, cadW - 24, 8.5) + 7, 0))) + HBUF;
  for (const [i, { label, items }] of cadGroups.entries()) {
    const cx = MARGIN + i * (cadW + 12);
    rPanel(doc, cx, y, cadW, cadH, C.panel, C.stroke, 12);
    writeLabel(doc, label, cx + 14, y + 14, C.green);
    drawBulletList(doc, items, cx + 14, y + 28, cadW - 24, { bullet: '•', size: 8.5, color: C.soft, bulletColor: C.green, gap: 6 });
  }
  y = safeY(y, cadH, doc.y);

  // KPI list
  const kpiTextW = CONTENT_W - IP - 116;
  const kpiRows = kpis.map((kpi) => ({
    kpi,
    rowH: Math.max(measure(doc, safeText(kpi), kpiTextW, 8), 10) + 8,
  }));
  const kpiH = 42 + kpiRows.reduce((s, r) => s + r.rowH, 0) + HBUF;
  rPanel(doc, MARGIN, y, CONTENT_W, kpiH, C.panel, C.stroke, 12);
  writeLabel(doc, 'Weekly Leadership KPIs', MARGIN + IP, y + 14, C.faint);
  let kpiYY = y + 30;
  const kpiCols = [C.green, C.blue, C.amber, C.purple, C.green, C.blue, C.amber];
  for (const [i, row] of kpiRows.entries()) {
    const kscore = clamp(44 + (i * 11 % 48), 0, 100);
    const kcolor = kpiCols[i % kpiCols.length];
    const barX = MARGIN + CONTENT_W - 100;
    writeText(doc, safeText(row.kpi), MARGIN + IP, kpiYY, { width: kpiTextW, size: 8, color: C.soft, lineGap: 1.6 });
    drawProgressBar(doc, barX, kpiYY + 4, 72, kscore, kcolor, 5);
    writeSingleLine(doc, `${kscore}%`, barX + 76, kpiYY, { width: 20, size: 7.5, color: kcolor });
    kpiYY += row.rowH;
  }
  y = safeY(y, kpiH, doc.y);

  // Bar chart (fixed 140px)
  rPanel(doc, MARGIN, y, CONTENT_W, 140, C.panel, C.stroke, 12);
  writeLabel(doc, 'Momentum Index — Competency Scores', MARGIN + IP, y + 14, C.faint);
  drawKpiBarChart(doc, MARGIN + IP, y + 30, IW, 76, comps.map(c => c.name));
  y = safeY(y, 140, doc.y);

  // Meeting blueprint
  const meetBlocks = [
    { time: '00–05 min', name: 'Pulse Check',       desc: 'Energy and blockers only — no project updates.' },
    { time: '05–25 min', name: 'Ownership Review',  desc: 'What is the team moving without you? What is still gravitating back toward you?' },
    { time: '25–40 min', name: 'Development Focus', desc: 'One team member gets focused coaching time. Rotate weekly.' },
    { time: '40–50 min', name: 'Strategic Context', desc: 'What changed this week that the team needs to understand at a business level?' },
    { time: '50–60 min', name: 'Next-Week Design',  desc: 'What decisions will be made next week and who should own them?' },
  ];
  const descW = CONTENT_W - IP - 200;
  const mbH = 44 + meetBlocks.reduce((s, b) => s + measure(doc, b.desc, descW, 8.5) + 11, 0) + HBUF;
  rPanel(doc, MARGIN, y, CONTENT_W, mbH, '#0f0f12', C.stroke, 14);
  writeLabel(doc, 'Redesigned Weekly Team Meeting Blueprint', MARGIN + IP, y + 14, C.faint);
  let mbY = y + 30;
  for (const { time, name, desc } of meetBlocks) {
    writeLabel(doc, time, MARGIN + IP, mbY, C.green);
    writeText(doc, name, MARGIN + IP + 72, mbY, { width: 108, size: 8.5, font: 'Helvetica-Bold', color: C.text });
    mbY = writeText(doc, desc, MARGIN + IP + 190, mbY, { width: descW, size: 8.5, color: C.soft, lineGap: 1.8 }) + 11;
  }
  y = safeY(y, mbH, doc.y);
  doc.save().rect(MARGIN, y, CONTENT_W, 0.75).fill(C.stroke).restore();
  y += 22;

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 11 — STAKEHOLDER MAP & 7-DAY SPRINT
  // ════════════════════════════════════════════════════════════════════════════
  y = pageHeader(doc, 11, 'Stakeholder Map & 7-Day Sprint', 'Who to influence first and what to do in the first seven days to convert this report into behaviour change.', y);

  {
    const h = 44 + stakPlay.reduce((s, t) => s + measure(doc, t, IW, 9) + 8, 0) + HBUF;
    rPanel(doc, MARGIN, y, CONTENT_W, h, C.panel, C.stroke, 14);
    writeLabel(doc, 'Stakeholder Influence Playbook', MARGIN + IP, y + 14, C.green);
    let spY = y + 30;
    for (const item of stakPlay) {
      const colon = item.indexOf(':');
      if (colon > 0) {
        const role = item.slice(0, colon);
        const rest = item.slice(colon + 1).trim();
        doc.font('Helvetica-Bold').fontSize(9).fillColor(C.text).text(`${role}:`, MARGIN + IP, spY, { lineBreak: false });
        const labelW = doc.widthOfString(`${role}:`) + 6;
        spY = writeText(doc, rest, MARGIN + IP + labelW, spY, { width: IW - labelW, size: 9, color: C.soft, lineGap: 1.5 }) + 8;
      } else {
        spY = writeText(doc, item, MARGIN + IP, spY, { width: IW, size: 9, color: C.soft, lineGap: 1.5 }) + 8;
      }
    }
    y = safeY(y, h, doc.y);
  }

  // Day cards — fixed 100px
  const days = sprint.slice(0, 7);
  const topN = Math.min(days.length, 4);
  if (topN > 0) {
    const dw4 = (CONTENT_W - (topN - 1) * 7) / topN;
    const topCardBodyH = Math.max(...days.slice(0, topN).map((d) => measure(doc, d, dw4 - 18, 7.5)));
    const topCardH = 34 + topCardBodyH + HBUF;
    for (let i = 0; i < topN; i++) {
      const dx = MARGIN + i * (dw4 + 7);
      rPanel(doc, dx, y, dw4, topCardH, '#0f0f12', C.stroke, 10);
      doc.save().rect(dx, y, dw4, 3).fill(C.green).restore();
      writeLabel(doc, `Day ${i + 1}`, dx + 10, y + 10, C.green);
      writeText(doc, days[i], dx + 10, y + 24, { width: dw4 - 18, size: 7.5, color: C.soft, lineGap: 2 });
    }
    y = safeY(y, topCardH, doc.y);
  }
  if (days.length > 4) {
    const botN = days.length - 4;
    const dwb = (CONTENT_W - (botN - 1) * 7) / botN;
    const botCardBodyH = Math.max(...days.slice(4).map((d) => measure(doc, d, dwb - 18, 7.5)));
    const botCardH = 34 + botCardBodyH + HBUF;
    for (let i = 0; i < botN; i++) {
      const dx = MARGIN + i * (dwb + 7);
      rPanel(doc, dx, y, dwb, botCardH, '#0f0f12', C.stroke, 10);
      doc.save().rect(dx, y, dwb, 3).fill(C.blue).restore();
      writeLabel(doc, `Day ${i + 5}`, dx + 10, y + 10, C.blue);
      writeText(doc, days[i + 4], dx + 10, y + 24, { width: dwb - 18, size: 7.5, color: C.soft, lineGap: 2 });
    }
    y = safeY(y, botCardH, doc.y);
  }
  doc.save().rect(MARGIN, y, CONTENT_W, 0.75).fill(C.stroke).restore();
  y += 22;

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 12 — HABITS BLUEPRINT
  // ════════════════════════════════════════════════════════════════════════════
  y = pageHeader(doc, 12, 'Leadership Habits Blueprint', '12 high-leverage habits that translate this assessment into lasting behaviour change. Start with three.', y);

  y = infoPanel(doc, 'About Habit-Based Leadership', 'Research on leadership development consistently shows that insight alone does not produce behaviour change. Leaders who improve most rapidly are those who convert insights into small, daily, observable practices. The habits below are linked to your lowest-scoring dimensions, measurable short-term, and designed to create visible signals for your team and stakeholders within 30 days.', y);

  const habits = [
    { dim: 'Delegation',            habit: 'Every Friday, name one task you did this week that a team member could own next week. Hand it over Monday.', tier: 'Start here' },
    { dim: 'Delegation',            habit: 'When a team member escalates, ask "What do you think is the right call?" before offering your answer.', tier: 'Start here' },
    { dim: 'Strategic Comms',       habit: 'Write a two-sentence "why this matters" before every stakeholder update. Send it first.', tier: 'Start here' },
    { dim: 'Strategic Comms',       habit: 'In every cross-functional meeting, state one business consequence of the topic being discussed.', tier: 'Month 1' },
    { dim: 'Coaching',              habit: 'Ask one development question in every 1:1: "What would you handle differently if you fully owned this?"', tier: 'Month 1' },
    { dim: 'Coaching',              habit: 'After every piece of praise, add: "What specifically made that work so you can repeat it?"', tier: 'Month 1' },
    { dim: 'Influence',             habit: 'Before every key stakeholder interaction, write their current concern in one sentence. Lead with addressing it.', tier: 'Month 2' },
    { dim: 'Influence',             habit: 'Once per month, share one forward-looking insight with your manager that they did not ask for.', tier: 'Month 2' },
    { dim: 'Strategic Thinking',    habit: 'Block one 45-minute "horizon thinking" slot per week. No meetings, no execution — only pattern recognition.', tier: 'Month 2' },
    { dim: 'Strategic Thinking',    habit: 'Keep a decision log. Record every significant decision this week. Review patterns monthly.', tier: 'Month 3' },
    { dim: 'Emotional Intelligence', habit: 'After every difficult conversation, write: What did I feel? What did they feel? What would I change?', tier: 'Month 3' },
    { dim: 'Execution (leverage)',  habit: 'Monthly: count how many outcomes moved because of the team, not your direct involvement. Set a target to increase it.', tier: 'Month 3' },
  ];
  const tierColors = { 'Start here': C.green, 'Month 1': C.blue, 'Month 2': C.amber, 'Month 3': C.purple };

  for (const habit of habits) {
    const color = tierColors[habit.tier] || C.soft;
    const habitH = measure(doc, habit.habit, IW, 8.5) + 34 + HBUF;
    rPanel(doc, MARGIN, y, CONTENT_W, habitH, '#0f0f12', C.strokeSoft, 10);
    doc.save().rect(MARGIN, y, 3, habitH).fill(color).restore();
    writeLabel(doc, habit.dim, MARGIN + IP, y + 12, C.faint);
    rPanel(doc, MARGIN + CONTENT_W - 74, y + 8, 62, 18, '#101014', C.strokeSoft, 9);
    writeLabel(doc, habit.tier, MARGIN + CONTENT_W - 68, y + 12, color);
    writeText(doc, habit.habit, MARGIN + IP, y + 26, { width: IW, size: 8.5, color: C.soft, lineGap: 2 });
    y = safeY(y, habitH, doc.y, 8);
  }
  doc.save().rect(MARGIN, y, CONTENT_W, 0.75).fill(C.stroke).restore();
  y += 22;

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 13 — SIGNALS & SELF-ASSESSMENT
  // ════════════════════════════════════════════════════════════════════════════
  y = pageHeader(doc, 13, 'Leadership Signals & Self-Assessment Guide', 'Observable evidence that tells you this report is becoming reality — and a weekly reflection framework.', y);

  const signalCards = [
    { title: 'Signal 01 — Team Ownership',        body: 'Your team asks better questions instead of waiting for your direct instruction. They propose solutions before you ask. When something breaks, they tell you what they are already doing to fix it.', color: C.green },
    { title: 'Signal 02 — Strategic Perception',  body: 'Senior stakeholders describe your updates as forward-looking and context-rich. You are included in conversations earlier. People ask your opinion on direction, not just delivery.', color: C.blue },
    { title: 'Signal 03 — Leverage Over Effort',  body: 'You spend less time in execution and more time creating conditions for excellent execution. When you step out of a process for a day, momentum does not collapse.', color: C.amber },
    { title: 'Signal 04 — Cross-Functional Reach', body: 'Peers in other functions seek your perspective on their problems. You have visible influence in rooms you do not formally own. Your decisions have ripple effects beyond your direct team.', color: C.purple },
  ];

  for (const { title, body, color } of signalCards) {
    const h = measure(doc, body, IW, 8.5) + 46 + HBUF;
    rPanel(doc, MARGIN, y, CONTENT_W, h, C.panel, C.stroke, 12);
    doc.save().rect(MARGIN, y, CONTENT_W, 3).fill(color).restore();
    writeLabel(doc, title, MARGIN + IP, y + 12, color);
    writeText(doc, body, MARGIN + IP, y + 28, { width: IW, size: 8.5, color: C.soft, lineGap: 2.2 });
    y = safeY(y, h, doc.y, 10);
  }
  y += 4;

  const selfQs = [
    'This week, how many outcomes moved because of the team — not my direct involvement?',
    'When did I catch myself stepping into work that someone else should have owned?',
    'Did I communicate any strategic context that helped the team make better decisions independently?',
    'How many development-focused conversations did I have (not status — development)?',
    'What feedback did I give that was specific enough to be actionable without further clarification?',
    'Did I send any proactive stakeholder communication that addressed their concern before they raised it?',
  ];
  const sqH = 44 + selfQs.reduce((s, q) => s + measure(doc, q, IW - 16, 9) + 9, 0) + HBUF;
  rPanel(doc, MARGIN, y, CONTENT_W, sqH, '#0f0f12', C.stroke, 14);
  writeLabel(doc, 'Weekly Self-Assessment — Review Every Friday', MARGIN + IP, y + 14, C.green);
  drawNumberedList(doc, selfQs, MARGIN + IP, y + 30, IW, { size: 9, color: C.soft, numColor: C.green, gap: 9 });
  y = safeY(y, sqH, doc.y);
  doc.save().rect(MARGIN, y, CONTENT_W, 0.75).fill(C.stroke).restore();
  y += 22;

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 14 — FINAL REFLECTION (visual, no copy-paste text)
  // ════════════════════════════════════════════════════════════════════════════
  y = pageHeader(doc, 14, 'Your Leadership Growth Summary', 'A visual snapshot of where you are, where you are going, and the single most important shift to make.', y);

  // Large score dial + outcome narrative side by side
  const dialPanelH = 220;
  const dialW = 200, narrativeW = CONTENT_W - dialW - 14;
  rPanel(doc, MARGIN, y, dialW, dialPanelH, C.panel, C.stroke, 16);
  drawScoreDial(doc, MARGIN + dialW / 2, y + 96, 60, score, C.green);
  writeLabel(doc, 'Overall Readiness', MARGIN + 14, y + 170, C.faint);
  writeText(doc, safeText(analysis.leadershipStage, 'Scaling Manager'), MARGIN + 14, y + 184, { width: dialW - 28, size: 8, color: C.soft, align: 'center' });

  rPanel(doc, MARGIN + dialW + 14, y, narrativeW, dialPanelH, C.panel, C.stroke, 16);
  writeLabel(doc, 'What This Means', MARGIN + dialW + 28, y + 14, C.faint);
  writeText(doc, outcome90, MARGIN + dialW + 28, y + 30, { width: narrativeW - 36, size: 9.5, color: C.muted, lineGap: 2.8 });
  y += dialPanelH + GAP;

  // Visual score summary: all 6 dims as filled bars with peer overlay
  const scoreSummaryH = 44 + comps.length * 22 + HBUF;
  rPanel(doc, MARGIN, y, CONTENT_W, scoreSummaryH, C.panel, C.stroke, 14);
  writeLabel(doc, 'Competency Summary — You vs. Peers', MARGIN + IP, y + 14, C.faint);
  // Legend
  doc.save().roundedRect(MARGIN + CONTENT_W - 110, y + 11, 10, 7, 3).fill(C.green).restore();
  doc.font('Helvetica').fontSize(6.5).fillColor(C.soft).text('You', MARGIN + CONTENT_W - 96, y + 13, { lineBreak: false });
  doc.save().roundedRect(MARGIN + CONTENT_W - 74, y + 11, 10, 7, 3).fillOpacity(0.3).fill(C.accent).restore();
  doc.font('Helvetica').fontSize(6.5).fillColor(C.soft).text('Peer avg', MARGIN + CONTENT_W - 60, y + 13, { lineBreak: false });
  const barAvailW = CONTENT_W - IP * 2 - 140;
  let sumY = y + 30;
  for (const [i, comp] of comps.entries()) {
    const color = levelColor(comp.level);
    const peer  = peerAvg(comp.score, i);
    sumY = drawGroupedBar(doc, MARGIN + IP, sumY, comp.name, comp.score, peer, barAvailW, color);
  }
  y = safeY(y, scoreSummaryH, doc.y);

  // Key insight quote — visual treatment
  {
    const quoteText = `"${keyInsight}"`;
    const h = measure(doc, quoteText, IW - 40, 14, 'Helvetica-Bold') + 64 + HBUF;
    rPanel(doc, MARGIN, y, CONTENT_W, h, '#0c140c', '#27272a', 16);
    // Large decorative quote mark
    doc.font('Helvetica-Bold').fontSize(60).fillColor(C.green).fillOpacity(0.12)
       .text('"', MARGIN + IP, y + 4, { lineBreak: false });
    doc.fillOpacity(1);
    writeText(doc, quoteText, MARGIN + IP + 28, y + 24, { width: IW - 40, size: 14, font: 'Helvetica-Bold', color: C.green, lineGap: 3 });
    y = safeY(y, h, doc.y);
  }

  // Growth priority visual: top 3 gaps shown as gap bars
  const gapPanelH = 44 + growthAreas.length * 52 + HBUF;
  rPanel(doc, MARGIN, y, CONTENT_W, gapPanelH, C.panel, C.stroke, 14);
  writeLabel(doc, 'Growth Gap Visual — Score vs. Advanced Threshold (90)', MARGIN + IP, y + 14, C.faint);
  let gpY = y + 30;
  for (const [i, area] of growthAreas.entries()) {
    const relComp = comps.find(c => area.title.toLowerCase().split(' ').some(w => c.name.toLowerCase().includes(w)))
      || weakest;
    const color = [C.green, C.blue, C.amber][i % 3];
    writeText(doc, safeText(area.title), MARGIN + IP, gpY, { width: IW, size: 8.5, font: 'Helvetica-Bold', color: C.text });
    gpY += 14;
    gpY = drawGapBar(doc, MARGIN + IP, gpY, IW, relComp.score, color, `Gap: ${gapToAdvanced(relComp.score)}pts`);
    gpY += 6;
  }
  y = safeY(y, gapPanelH, doc.y);

  // 90-day outcome visual: 3 milestone markers
  const milestoneW = (CONTENT_W - IP * 2 - 24) / 3;
  const milestones = [
    { label: 'Day 30', color: C.green, text: 'Less personal execution. One process handed off completely.' },
    { label: 'Day 60', color: C.blue,  text: 'Stakeholders describe updates as strategic. Influence widening.' },
    { label: 'Day 90', color: C.purple, text: 'Team runs independently. You design systems, not execute tasks.' },
  ];
  const milestoneBodyH = Math.max(...milestones.map((m) => measure(doc, m.text, milestoneW - 18, 7.5)));
  const milestoneCardH = 22 + milestoneBodyH + 8;
  const milestoneH = 42 + milestoneCardH + HBUF;
  rPanel(doc, MARGIN, y, CONTENT_W, milestoneH, '#0f0f12', C.stroke, 14);
  writeLabel(doc, 'Your 90-Day Trajectory', MARGIN + IP, y + 14, C.faint);
  for (const [i, { label, color, text }] of milestones.entries()) {
    const mx = MARGIN + IP + i * (milestoneW + 12);
    rPanel(doc, mx, y + 28, milestoneW, milestoneCardH, '#0d0d10', color, 10);
    writeLabel(doc, label, mx + 10, y + 36, color);
    writeText(doc, text, mx + 10, y + 50, { width: milestoneW - 18, size: 7.5, color: C.soft, lineGap: 1.8 });
  }
  y = safeY(y, milestoneH, doc.y);

  y = infoPanel(
    doc,
    'Execution Discipline For The Next 90 Days',
    'Treat this report as an operating plan, not inspiration. Pick one leadership behaviour per week, define the observable signal that proves it happened, and review progress every Friday. Share one selected metric with your manager or coach to create accountability. If momentum drops, return to the first principle of this report: move ownership down, move context up, and keep your attention on systems rather than heroic interventions.',
    y
  );

  doc.save().rect(MARGIN, y, CONTENT_W, 0.75).fill(C.stroke).restore();
  y += 22;

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 15 — DECISION OPERATING SYSTEM
  // ════════════════════════════════════════════════════════════════════════════
  y = pageHeader(
    doc,
    15,
    'Decision Operating System',
    'Clear rules that preserve speed while increasing team ownership and leadership leverage.',
    y
  );

  y = infoPanel(
    doc,
    'Why Decisions Are The Real Leadership Lever',
    `Promotion to higher leadership levels is rarely blocked by effort or competence. It is blocked by decision architecture. When decisions are unclear, leaders compensate with personal heroics. When decision rights, quality standards, and review rhythms are clear, teams move faster with less supervision. Your current gap to advanced level in ${weakest.name} is ${biggestGap} points; the fastest way to close it is to redesign how decisions are made, not to personally execute more work.`,
    y
  );

  {
    const h = 44 + decisionRules.reduce((s, t) => s + measure(doc, t, IW - 16, 8.8) + 9, 0) + HBUF;
    rPanel(doc, MARGIN, y, CONTENT_W, h, C.panel, C.stroke, 14);
    writeLabel(doc, 'Five Decision Rules To Implement This Week', MARGIN + IP, y + 14, C.green);
    drawNumberedList(doc, decisionRules, MARGIN + IP, y + 30, IW, { size: 8.8, color: C.soft, numColor: C.green, gap: 8 });
    y = safeY(y, h, doc.y);
  }

  y = infoPanel(
    doc,
    'Meeting-Level Application',
    'In team meetings, separate decision topics from update topics. For each decision topic, state: owner, decision due date, risk if delayed, and confidence level. End with one sentence: "What should happen without me between now and next review?" This single sentence builds ownership reflexes and reduces escalation dependency.',
    y
  );

  doc.save().rect(MARGIN, y, CONTENT_W, 0.75).fill(C.stroke).restore();
  y += 22;

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 16 — STAKEHOLDER COMMUNICATION PACK
  // ════════════════════════════════════════════════════════════════════════════
  y = pageHeader(
    doc,
    16,
    'Stakeholder Communication Pack',
    'Ready-to-use communication structures that increase strategic trust and reduce rework.',
    y
  );

  const stakeholderScripts = [
    {
      title: 'To Your Manager',
      script: `This week we improved ownership by transferring [specific area] to [owner]. Result so far: [signal]. Biggest risk: [risk]. Next action I am leading: [action]. Decision needed from you: [decision].`,
    },
    {
      title: 'To Cross-Functional Peers',
      script: `To keep momentum, I want to align early on [topic]. Shared outcome: [outcome]. Dependencies from your side: [dependencies]. Risks if we delay: [risk]. Proposed path: [path].`,
    },
    {
      title: 'To Your Team',
      script: `Our next leadership upgrade is ownership depth. This week each of us will own one decision end-to-end. We will review outcome quality, not activity volume. Support is available; ownership remains with you.`,
    },
  ];

  for (const block of stakeholderScripts) {
    const scriptH = measure(doc, block.script, IW, 8.8) + 54 + HBUF;
    rPanel(doc, MARGIN, y, CONTENT_W, scriptH, '#0f0f12', C.stroke, 14);
    writeLabel(doc, block.title, MARGIN + IP, y + 14, C.blue);
    writeText(doc, block.script, MARGIN + IP, y + 30, { width: IW, size: 8.8, color: C.soft, lineGap: 2.2 });
    y = safeY(y, scriptH, doc.y, 10);
  }

  y = infoPanel(
    doc,
    'Narrative Quality Checklist',
    'Before sending any strategic message, check five items: (1) clear business context, (2) explicit consequence, (3) named owner, (4) timeline and risk, (5) specific ask. If any item is missing, your message will likely trigger clarifying loops and dilute influence.',
    y
  );

  doc.save().rect(MARGIN, y, CONTENT_W, 0.75).fill(C.stroke).restore();
  y += 22;

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 17 — RISK REGISTER & REVIEW RHYTHM
  // ════════════════════════════════════════════════════════════════════════════
  y = pageHeader(
    doc,
    17,
    'Risk Register & Review Rhythm',
    'Prevent common leadership regressions before they slow your growth trajectory.',
    y
  );

  for (const item of riskRegister) {
    const riskBody = `Signal: ${item.signal}\nMitigation: ${item.mitigation}`;
    const h = measure(doc, riskBody, IW, 8.8) + 56 + HBUF;
    rPanel(doc, MARGIN, y, CONTENT_W, h, C.panel, C.stroke, 14);
    writeLabel(doc, item.risk, MARGIN + IP, y + 14, C.red);
    writeText(doc, riskBody, MARGIN + IP, y + 30, { width: IW, size: 8.8, color: C.soft, lineGap: 2.2 });
    y = safeY(y, h, doc.y, 10);
  }

  {
    const h = 44 + weeklyReviewPrompts.reduce((s, t) => s + measure(doc, t, IW - 16, 8.8) + 8, 0) + HBUF;
    rPanel(doc, MARGIN, y, CONTENT_W, h, '#0f0f12', C.stroke, 14);
    writeLabel(doc, 'Friday Review Prompts (15-Minute Ritual)', MARGIN + IP, y + 14, C.green);
    drawNumberedList(doc, weeklyReviewPrompts, MARGIN + IP, y + 30, IW, { size: 8.8, color: C.soft, numColor: C.green, gap: 7 });
    y = safeY(y, h, doc.y);
  }

  doc.save().rect(MARGIN, y, CONTENT_W, 0.75).fill(C.stroke).restore();
  y += 22;

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 18 — 6-MONTH LEADERSHIP EXPANSION PLAN
  // ════════════════════════════════════════════════════════════════════════════
  y = pageHeader(
    doc,
    18,
    '6-Month Leadership Expansion Plan',
    'A longer-horizon progression model so your 90-day gains become a durable leadership identity.',
    y
  );

  y = infoPanel(
    doc,
    'How To Use This Extension',
    'The first 90 days create momentum; months 4-6 create credibility at the next scope level. Use these phases as outcome checkpoints, not task lists. If a phase outcome is not visible externally, treat it as incomplete and hold the phase open until evidence appears.',
    y
  );

  for (const phase of sixMonthOutcomes) {
    const itemsH = phase.outcomes.reduce((s, t) => s + measure(doc, t, IW - 16, 8.7) + 7, 0);
    const h = 56 + itemsH + HBUF;
    rPanel(doc, MARGIN, y, CONTENT_W, h, '#0f0f12', C.stroke, 14);
    writeLabel(doc, phase.phase, MARGIN + IP, y + 14, C.purple);
    writeText(doc, phase.focus, MARGIN + IP, y + 28, { width: IW, size: 10, font: 'Helvetica-Bold', color: C.text });
    drawBulletList(doc, phase.outcomes, MARGIN + IP, y + 44, IW, { bullet: '•', size: 8.7, color: C.soft, bulletColor: C.purple, gap: 6 });
    y = safeY(y, h, doc.y, 10);
  }

  y = accentQuote(
    doc,
    'Leadership maturity is visible when outcomes improve while your direct control decreases. Build systems that outlast your attention.',
    y
  );

  // Footer
  doc.save().rect(MARGIN, y, CONTENT_W, 0.75).fill(C.stroke).restore();
  y += 10;
  doc.font('Helvetica').fontSize(7.5).fillColor(C.faint)
     .text(`CAREERA · Leadership Growth Report · ${date} · Confidential`, MARGIN, y, { width: CONTENT_W, align: 'center', lineBreak: false });

  return y + 36;
}


// ─── Public API (two-pass for exact height) ───────────────────────────────────
export function generatePdfBuffer(analysis) {
  return new Promise((resolve, reject) => {
    try {
      const probe = new PDFDocument({ size: [PAGE_W, 70000], margin: 0 });
      probe.on('data', () => {});
      probe.on('error', reject);
      const probeEnd = new Promise(res => probe.on('end', res));
      const finalY = renderContent(probe, analysis);
      const docH = clamp(Math.ceil(finalY) + 40, 5000, 70000);
      probe.end();

      probeEnd.then(() => {
        const chunks = [];
        const doc = new PDFDocument({ size: [PAGE_W, docH], margin: 0 });
        doc.on('data', c => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        doc.rect(0, 0, PAGE_W, docH).fill(C.bg);
        drawGrid(doc, docH);
        drawStars(doc, docH);
        renderContent(doc, analysis);
    doc.end();
      }).catch(reject);
    } catch (err) {
      reject(err);
    }
  });
}
