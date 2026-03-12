import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const PDFDocument = require('pdfkit');

// ─── Color Palette — matches the site's space theme ──────────────────────────
const C = {
  bg:         '#0a0a0a',
  panel:      '#111114',
  panelAlt:   '#141418',
  stroke:     '#27272a',
  strokeSoft: '#1f1f23',
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
function clamp(v, lo, hi)  { return Math.max(lo, Math.min(hi, v)); }
function safeText(v, fb = '') { return typeof v === 'string' && v.trim() ? v.trim() : fb; }
function safeArray(v, fb = []) { return Array.isArray(v) && v.length ? v : fb; }
function deg2rad(d) { return (d * Math.PI) / 180; }

function levelColor(level) {
  return { Advanced: C.green, Strong: C.accent, Developing: C.amber, Emerging: C.red }[level] || C.soft;
}

// Deterministic pseudo-random so star positions are identical across both passes
function seededRand(seed) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

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
    doc.moveTo(gx, 0).lineTo(gx, totalH)
       .lineWidth(0.4).strokeOpacity(0.025).strokeColor('#ffffff').stroke();
  }
  for (let gy = 0; gy <= totalH; gy += GRID_STEP) {
    doc.moveTo(0, gy).lineTo(PAGE_W, gy)
       .lineWidth(0.4).strokeOpacity(0.025).strokeColor('#ffffff').stroke();
  }
  doc.restore();
}

function drawStars(doc, totalH) {
  const rand = seededRand(0xca4ee3);
  for (let i = 0; i < 140; i++) {
    const sx  = rand() * PAGE_W;
    const sy  = rand() * totalH;
    const big = rand() < 0.07;
    const med = rand() < 0.25;
    const sz  = big ? 1.8 : med ? 1.1 : 0.5;
    const op  = 0.04 + rand() * (big ? 0.18 : med ? 0.12 : 0.08);
    doc.save().fillOpacity(op).circle(sx, sy, sz).fill('#ffffff').restore();
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
  const {
    width = CONTENT_W, size = 10, font = 'Helvetica',
    color = C.muted, lineGap = 2, align = 'left',
  } = opts;
  doc.font(font).fontSize(size).fillColor(color)
     .text(String(text || ''), x, y, { width, lineGap, align });
  return doc.y;
}

function drawDivider(doc, y) {
  doc.save().rect(MARGIN, y, CONTENT_W, 0.75).fill(C.stroke).restore();
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
    doc.font('Helvetica-Bold').fontSize(size).fillColor(bulletColor)
       .text(bullet, x, cy + 1, { lineBreak: false });
    const bottom = writeText(doc, line, x + 12, cy, { width: width - 12, size, color, lineGap: 1.5 });
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
    if (cx + cw > x + maxW) { cx = x; cy += 24; }
    rPanel(doc, cx, cy, cw, 20, '#101014', C.stroke, 10);
    doc.font('Helvetica').fontSize(8).fillColor(C.green).text(label, cx + 10, cy + 6, { lineBreak: false });
    cx += cw + 8;
  }
  return cy + 24;
}

// ─── Chart: Radar polygon ─────────────────────────────────────────────────────
function drawRadarChart(doc, cx, cy, r, competencies) {
  const n = competencies.length;
  if (n < 3) return;
  const ang  = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt   = (score, i) => ({
    x: cx + (score / 100) * r * Math.cos(ang(i)),
    y: cy + (score / 100) * r * Math.sin(ang(i)),
  });

  // Grid rings
  for (const pct of [25, 50, 75, 100]) {
    const ring = competencies.map((_, i) => pt(pct, i));
    doc.save();
    doc.moveTo(ring[0].x, ring[0].y);
    for (let i = 1; i < ring.length; i++) doc.lineTo(ring[i].x, ring[i].y);
    doc.closePath().lineWidth(0.5).strokeColor(pct === 100 ? C.stroke : C.strokeSoft).stroke();
    doc.restore();
    doc.font('Helvetica').fontSize(5.5).fillColor(C.faint)
       .text(String(pct), cx - 6, cy - (pct / 100) * r - 8, {
         lineBreak: false, width: 12, align: 'center',
       });
  }

  // Spokes
  for (let i = 0; i < n; i++) {
    const outer = pt(100, i);
    doc.save().moveTo(cx, cy).lineTo(outer.x, outer.y)
       .lineWidth(0.5).strokeColor(C.strokeSoft).stroke().restore();
  }

  // Filled area
  const pts = competencies.map((c, i) => pt(c.score, i));
  doc.save();
  doc.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) doc.lineTo(pts[i].x, pts[i].y);
  doc.closePath().fillOpacity(0.14).fill(C.green);
  doc.restore();

  // Outline
  doc.save();
  doc.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) doc.lineTo(pts[i].x, pts[i].y);
  doc.closePath().lineWidth(1.5).strokeOpacity(0.75).strokeColor(C.green).stroke();
  doc.restore();

  // Dots
  for (const p of pts) {
    doc.save().circle(p.x, p.y, 3).fill(C.green).restore();
  }

  // Labels
  for (let i = 0; i < n; i++) {
    const labR = r + 22;
    const lx   = cx + labR * Math.cos(ang(i));
    const ly   = cy + labR * Math.sin(ang(i));
    const name = competencies[i].name.split(' ')[0];
    doc.font('Helvetica').fontSize(7).fillColor(C.soft)
       .text(name, lx - 24, ly - 5, { width: 48, align: 'center' });
  }
}

// ─── Chart: Score arc gauge ───────────────────────────────────────────────────
function drawArcGauge(doc, cx, cy, r, score, color, lw = 5) {
  // Glow halo
  doc.save().circle(cx, cy, r + 6).fillOpacity(0.04).fill(color).restore();
  // Track ring
  doc.save().circle(cx, cy, r).lineWidth(lw).strokeColor(C.strokeSoft).stroke().restore();
  // Score arc
  if (score > 0.5) {
    const startA = -Math.PI / 2;
    const sweep  = (Math.min(score, 99.9) / 100) * 2 * Math.PI;
    doc.save()
       .arc(cx, cy, r, startA, startA + sweep)
       .lineWidth(lw).strokeColor(color).stroke()
       .restore();
  }
}

// ─── Chart: Evolution staircase ───────────────────────────────────────────────
function drawEvolutionSteps(doc, x, y, w, h, stages, currentStep) {
  const n     = stages.length;
  const stepW = (w - (n - 1) * 4) / n;

  for (let i = 0; i < n; i++) {
    const stepH  = Math.round(((i + 1) / n) * h);
    const sx     = x + i * (stepW + 4);
    const sy     = y + h - stepH;
    const isHere = (i + 1) === currentStep;
    const isNext = (i + 1) === currentStep + 1;

    rPanel(doc, sx, sy, stepW, stepH,
      isHere ? '#141a14' : '#0d0d10',
      isHere ? C.green : isNext ? C.strokeSoft : C.strokeSoft,
      6,
    );

    // Step label
    doc.font('Helvetica').fontSize(6.5)
       .fillColor(isHere ? C.text : C.faint)
       .text(stages[i], sx + 4, sy + 8, { width: stepW - 8, lineBreak: false });

    // "YOU" marker on current step
    if (isHere) {
      const dotY = sy + stepH - 22;
      doc.save().circle(sx + stepW / 2, dotY, 10).fill(C.green).restore();
      doc.font('Helvetica-Bold').fontSize(5).fillColor(C.bg)
         .text('YOU', sx + stepW / 2 - 10, dotY - 4, {
           width: 20, align: 'center', lineBreak: false,
         });
    }

    // Number at bottom
    doc.font('Helvetica').fontSize(6).fillColor(C.faint)
       .text(String(i + 1), sx, y + h + 6, { width: stepW, align: 'center', lineBreak: false });
  }
}

// ─── Chart: Timeline strip ────────────────────────────────────────────────────
function drawTimeline(doc, x, y, w, labels) {
  const n    = labels.length;
  const segW = w / (n + 1);
  const lineY = y + 14;

  doc.save().rect(x, lineY, w, 1).fill(C.stroke).restore();

  for (let i = 0; i < n; i++) {
    const dotX = x + (i + 1) * segW;
    doc.save()
       .circle(dotX, lineY, 7).fill(C.panel)
       .circle(dotX, lineY, 7).lineWidth(1).strokeColor(i === 0 ? C.green : C.stroke).stroke()
       .restore();
    if (i === 0) doc.save().circle(dotX, lineY, 3).fill(C.green).restore();

    writeLabel(doc, `M${i + 1}`, dotX - 10, lineY + 11, i === 0 ? C.green : C.faint);
    doc.font('Helvetica').fontSize(6.5).fillColor(i === 0 ? C.soft : C.faint)
       .text(safeText(labels[i]).slice(0, 18), dotX - segW * 0.42, lineY + 22, {
         width: segW * 0.84, align: 'center',
       });
  }
  return lineY + 48;
}

// ─── Chart: Priority matrix ───────────────────────────────────────────────────
function drawPriorityMatrix(doc, x, y, size, wins, bets) {
  const half = size / 2;

  // Quadrant fills
  doc.save();
  doc.rect(x,        y,        half, half).fill('#0d150d');
  doc.rect(x + half, y,        half, half).fill('#13130c');
  doc.rect(x,        y + half, half, half).fill('#0e0e10');
  doc.rect(x + half, y + half, half, half).fill('#0e0e10');
  doc.restore();

  // Border
  doc.save().rect(x, y, size, size).lineWidth(0.75).strokeColor(C.stroke).stroke().restore();
  // Dividers
  doc.save()
     .moveTo(x, y + half).lineTo(x + size, y + half)
     .lineWidth(0.5).strokeColor(C.stroke).stroke()
     .restore();
  doc.save()
     .moveTo(x + half, y).lineTo(x + half, y + size)
     .lineWidth(0.5).strokeColor(C.stroke).stroke()
     .restore();

  // Quadrant labels
  const qLabels = [
    { text: 'DO NOW',   qx: x,        qy: y,        color: C.green },
    { text: 'PLAN',     qx: x + half, qy: y,        color: C.amber },
    { text: 'DELEGATE', qx: x,        qy: y + half, color: C.faint },
    { text: 'DEFER',    qx: x + half, qy: y + half, color: C.faint },
  ];
  for (const ql of qLabels) {
    doc.font('Helvetica-Bold').fontSize(6.5).fillColor(ql.color)
       .text(ql.text, ql.qx + 6, ql.qy + 6, { lineBreak: false });
  }

  // Axis labels
  doc.font('Helvetica').fontSize(6).fillColor(C.faint)
     .text('LOW EFFORT', x + 4, y + size + 5, { lineBreak: false })
     .text('HIGH EFFORT', x + size - 55, y + size + 5, { lineBreak: false });

  // Items: wins → DO NOW (top-left), bets → PLAN (top-right)
  const plotDots = (items, qx, qy, color) => {
    for (let i = 0; i < Math.min(items.length, 4); i++) {
      const col = i % 2, row = Math.floor(i / 2);
      const dx  = qx + 8 + col * (half * 0.5 - 4);
      const dy  = qy + 20 + row * 22;
      doc.save().circle(dx, dy, 3).fill(color).restore();
      const label = safeText(items[i]).slice(0, 18);
      doc.font('Helvetica').fontSize(5.5).fillColor(color)
         .text(label, dx + 6, dy - 3, { lineBreak: false, width: half * 0.5 - 12 });
    }
  };
  plotDots(wins, x,        y, C.green);
  plotDots(bets, x + half, y, C.amber);
}

// ─── Chart: KPI bar chart ─────────────────────────────────────────────────────
function drawKpiBarChart(doc, x, y, w, h, kpis) {
  const n    = Math.min(kpis.length, 6);
  const barW = (w - (n - 1) * 8) / n;
  const rand = seededRand(0x4b7a);
  const colors = [C.green, C.blue, C.amber, C.purple, C.green, C.blue];

  for (let i = 0; i < n; i++) {
    const bx    = x + i * (barW + 8);
    const score = 42 + Math.round(rand() * 50);
    const bh    = Math.round((score / 100) * h);
    const color = colors[i % colors.length];

    // Background bar
    doc.save().roundedRect(bx, y, barW, h, 4).fill(C.strokeSoft).restore();
    // Filled bar (bottom-up)
    doc.save().roundedRect(bx, y + h - bh, barW, bh, 4).fill(color).restore();

    // Score label above bar
    doc.font('Helvetica-Bold').fontSize(7).fillColor(color)
       .text(`${score}%`, bx, y + h - bh - 12, { width: barW, align: 'center', lineBreak: false });

    // KPI label below
    const label = safeText(kpis[i]).split(' ').slice(0, 2).join(' ');
    doc.font('Helvetica').fontSize(6).fillColor(C.faint)
       .text(label, bx - 2, y + h + 5, { width: barW + 4, align: 'center' });
  }
}

// ─── Section header ───────────────────────────────────────────────────────────
function sectionHeader(doc, eyebrow, title, subtitle, y) {
  // Eyebrow line
  writeLabel(doc, eyebrow, MARGIN, y, C.faint);
  doc.save().rect(MARGIN, y + 11, 24, 1).fill(C.green).restore();
  let cy = y + 16;
  cy = writeText(doc, title, MARGIN, cy, {
    size: 20, font: 'Helvetica-Bold', color: C.text, lineGap: 0,
  });
  if (subtitle) {
    cy = writeText(doc, subtitle, MARGIN, cy + 3, { size: 9.5, color: C.soft, lineGap: 1.5 });
  }
  return cy + 14;
}

// ─── Main render function (called twice: probe + real) ────────────────────────
function renderContent(doc, analysis) {
  const competencies    = safeArray(analysis.competencies, []);
  const sorted          = [...competencies].sort((a, b) => b.score - a.score);
  const strongest       = sorted[0]               || { name: 'Execution',  score: 78, level: 'Strong' };
  const weakest         = sorted[sorted.length-1] || { name: 'Strategy',   score: 54, level: 'Developing' };
  const blindSpots      = safeArray(analysis.blindSpots, []);
  const strengthLevers  = safeArray(analysis.strengthLevers, []);
  const topGrowthAreas  = safeArray(analysis.topGrowthAreas, []);
  const stakeholderPlay = safeArray(analysis.stakeholderPlaybook, []);
  const firstWeekPlan   = safeArray(analysis.firstWeekPlan, []);
  const kpis            = safeArray(analysis.kpis, []);
  const roadmap         = analysis.roadmap || {};
  const roadmapCards    = [roadmap.month1, roadmap.month2, roadmap.month3].filter(Boolean);
  const dailyCadence    = safeArray(analysis.operatingCadence?.daily, []);
  const weeklyCadence   = safeArray(analysis.operatingCadence?.weekly, []);
  const monthlyCadence  = safeArray(analysis.operatingCadence?.monthly, []);
  const immediateWins   = safeArray(analysis.decisionMatrix?.immediateWins, [
    'Streamline 1:1 cadence', 'Create OKR clarity', 'Delegate one recurring task', 'Quick stakeholder win',
  ]);
  const strategicBets   = safeArray(analysis.decisionMatrix?.strategicBets, [
    'Delegation framework', 'Cross-functional coalition', 'Team development plan', 'Influence strategy',
  ]);

  const date           = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const stageStr       = safeText(analysis.leadershipStage, '').toLowerCase();
  const STAGES         = ['Individual', 'New Mgr', 'Scaling', 'Strategic', 'Executive'];
  let   currentStep    = 3;
  if      (stageStr.includes('individual') || stageStr.includes(' ic'))   currentStep = 1;
  else if (stageStr.includes('new manager') || stageStr.includes('junior')) currentStep = 2;
  else if (stageStr.includes('scaling'))                                    currentStep = 3;
  else if (stageStr.includes('strategic') || stageStr.includes('senior'))  currentStep = 4;
  else if (stageStr.includes('executive') || stageStr.includes('vp') || stageStr.includes('director')) currentStep = 5;

  let y = 40;

  // ────────────────────────────────────────────────────────────────────────────
  // HERO SECTION
  // ────────────────────────────────────────────────────────────────────────────
  const heroH = 256;
  rPanel(doc, MARGIN, y, CONTENT_W, heroH, C.panelAlt, C.stroke, 20);

  // Green glow behind score gauge
  doc.save().circle(PAGE_W - MARGIN - 82, y + 108, 82).fillOpacity(0.04).fill(C.green).restore();

  writeLabel(doc, 'CAREERA · LEADERSHIP INTELLIGENCE', MARGIN + 22, y + 18, C.faint);
  doc.save().rect(MARGIN + 22, y + 28, 28, 1).fill(C.green).restore();

  writeText(doc, 'Leadership\nReadiness Report', MARGIN + 22, y + 38, {
    width: CONTENT_W * 0.55, size: 25, font: 'Helvetica-Bold', color: C.text, lineGap: 1,
  });
  writeText(doc, safeText(analysis.leadershipStage, 'Leadership Growth Assessment'),
    MARGIN + 22, y + 106, { width: CONTENT_W * 0.55, size: 10, color: C.soft });
  writeText(doc, safeText(analysis.executiveSummary, '').slice(0, 180),
    MARGIN + 22, y + 124, { width: CONTENT_W * 0.55, size: 8.5, color: C.faint, lineGap: 2 });

  // Score gauge (right side)
  const gCx = PAGE_W - MARGIN - 80;
  const gCy = y + 110;
  const gR  = 52;
  drawArcGauge(doc, gCx, gCy, gR, clamp(analysis.leadershipScore || 0, 0, 100), C.green, 6);
  doc.font('Helvetica-Bold').fontSize(28).fillColor(C.text)
     .text(String(analysis.leadershipScore || 0), gCx - 28, gCy - 18, {
       width: 56, align: 'center', lineBreak: false,
     });
  doc.font('Helvetica').fontSize(8.5).fillColor(C.soft)
     .text('/100', gCx - 20, gCy + 12, { width: 40, align: 'center', lineBreak: false });
  writeLabel(doc, 'Overall Score', gCx - 28, gCy + gR + 10, C.faint);

  // Meta row
  const metaY = y + heroH - 42;
  doc.save().rect(MARGIN + 16, metaY - 8, CONTENT_W - 32, 0.5).fill(C.stroke).restore();
  const metaW = (CONTENT_W - 32) / 4;
  [
    { label: 'Date',       value: date.split(',')[0] },
    { label: 'Stage',      value: safeText(analysis.leadershipStage, 'Scaling').split(' ').slice(0, 2).join(' ') },
    { label: 'Archetype',  value: safeText(analysis.archetype?.name, 'The Builder').split(' ').slice(-1)[0] },
    { label: 'Top Dim.',   value: `${strongest.name.split(' ')[0]} ${strongest.score}/100` },
  ].forEach(({ label, value }, i) => {
    const mx = MARGIN + 16 + i * metaW;
    writeLabel(doc, label, mx, metaY, C.faint);
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(C.muted)
       .text(value, mx, metaY + 11, { width: metaW - 6, lineBreak: false });
  });

  y += heroH + 16;

  // ────────────────────────────────────────────────────────────────────────────
  // KEY INSIGHT BANNER
  // ────────────────────────────────────────────────────────────────────────────
  const insightStr = `"${safeText(analysis.keyInsight, 'Your next growth step is to build scale through other people, not through more personal effort.')}"`;
  const insightH   = measure(doc, insightStr, CONTENT_W - 40, 11.5, 'Helvetica-Bold') + 42;
  rPanel(doc, MARGIN, y, CONTENT_W, insightH, '#0c1410', '#86efac44', 14);
  doc.save().rect(MARGIN, y, 3, insightH).fill(C.green).restore();
  writeLabel(doc, 'Key Insight', MARGIN + 16, y + 12, C.green);
  writeText(doc, insightStr, MARGIN + 16, y + 26, {
    width: CONTENT_W - 32, size: 11.5, font: 'Helvetica-Bold', color: C.green, lineGap: 2,
  });
  y += insightH + 22;

  // ────────────────────────────────────────────────────────────────────────────
  // EXECUTIVE SUMMARY
  // ────────────────────────────────────────────────────────────────────────────
  y = sectionHeader(doc, 'Executive Summary', 'Where You Stand Today',
    'A precise reading of your current strengths, gaps, and growth leverage across six leadership dimensions.', y);

  // 3 stat mini-cards
  const statW = (CONTENT_W - 24) / 3;
  [
    { label: 'Leadership Score',  value: String(analysis.leadershipScore || 0), sub: '/ 100',            big: true,  color: C.green },
    { label: 'Top Strength',      value: strongest.name.split(' ')[0],          sub: `${strongest.score}/100`, big: false, color: C.text  },
    { label: 'Priority Gap',      value: weakest.name.split(' ')[0],            sub: `${weakest.score}/100`,   big: false, color: C.amber },
  ].forEach(({ label, value, sub, big, color }, i) => {
    const sx = MARGIN + i * (statW + 12);
    rPanel(doc, sx, y, statW, 76, '#0d0d10', C.stroke, 12);
    writeLabel(doc, label, sx + 14, y + 12, C.faint);
    doc.font('Helvetica-Bold').fontSize(big ? 28 : 20).fillColor(color)
       .text(value, sx + 14, y + 26, { width: statW - 28, lineBreak: false });
    writeText(doc, sub, sx + 14, y + 58, { width: statW - 28, size: 8, color: C.faint });
  });
  y += 92;

  const summaryText = safeText(analysis.executiveSummary, 'This report translates your assessment into a leadership operating system: where you already create leverage, where you are still over-indexing on personal execution, and which moves will raise your visibility and scale over the next 90 days.');
  const summaryH = measure(doc, summaryText, CONTENT_W - 36, 10.5) + 36;
  rPanel(doc, MARGIN, y, CONTENT_W, summaryH, C.panel, C.stroke, 14);
  writeText(doc, summaryText, MARGIN + 18, y + 16, { width: CONTENT_W - 36, size: 10.5, color: C.muted, lineGap: 3 });
  y += summaryH + 22;

  y = drawDivider(doc, y);

  // ────────────────────────────────────────────────────────────────────────────
  // COMPETENCY PROFILE — radar + score bars (side by side)
  // ────────────────────────────────────────────────────────────────────────────
  y = sectionHeader(doc, 'Competency Analysis', 'Leadership Competency Profile',
    'Six leadership dimensions measured against an evidence-based model for managers at your stage.', y);

  const radarR  = 96;
  const radarCx = MARGIN + radarR + 30;
  const radarCy = y + radarR + 22;
  const radarPH = radarR * 2 + 60;
  const leftPW  = CONTENT_W * 0.5 - 8;
  const rightX  = MARGIN + CONTENT_W * 0.5 + 8;
  const rightW  = CONTENT_W * 0.5 - 8;

  rPanel(doc, MARGIN, y, leftPW, radarPH, C.panel, C.stroke, 14);
  if (competencies.length >= 3) {
    drawRadarChart(doc, radarCx, radarCy, radarR, competencies);
  }

  // Score bars (right panel)
  rPanel(doc, rightX, y, rightW, radarPH, C.panel, C.stroke, 14);
  let scoreY = y + 14;
  writeLabel(doc, 'Dimension Scores', rightX + 14, scoreY, C.faint);
  scoreY += 14;
  for (const comp of competencies) {
    const color = levelColor(comp.level);
    writeText(doc, comp.name, rightX + 14, scoreY, { width: rightW - 60, size: 8.5, font: 'Helvetica-Bold', color: C.text });
    doc.font('Helvetica-Bold').fontSize(8).fillColor(color)
       .text(`${comp.score}`, rightX + rightW - 42, scoreY, { width: 36, align: 'right', lineBreak: false });
    scoreY += 13;
    drawProgressBar(doc, rightX + 14, scoreY, rightW - 28, comp.score, color, 5);
    scoreY += 9;
    doc.font('Helvetica').fontSize(7).fillColor(C.faint).text(safeText(comp.level), rightX + 14, scoreY, { lineBreak: false });
    scoreY += 13;
  }

  y += radarPH + 20;

  // ────────────────────────────────────────────────────────────────────────────
  // COMPETENCY GAUGE GRID (6 small ring gauges, 2 rows × 3 cols)
  // ────────────────────────────────────────────────────────────────────────────
  const gaugeCardH = 112;
  const gaugeCardW = (CONTENT_W - 2 * 10) / 3;

  for (let i = 0; i < competencies.length; i++) {
    const col   = i % 3;
    const row   = Math.floor(i / 3);
    const gx    = MARGIN + col * (gaugeCardW + 10);
    const gy    = y + row * (gaugeCardH + 10);
    const comp  = competencies[i];
    const color = levelColor(comp.level);

    rPanel(doc, gx, gy, gaugeCardW, gaugeCardH, '#0d0d10', C.strokeSoft, 12);

    const sgCx = gx + gaugeCardW * 0.38;
    const sgCy = gy + gaugeCardH * 0.5;
    const sgR  = 28;

    drawArcGauge(doc, sgCx, sgCy, sgR, comp.score, color, 5);
    doc.font('Helvetica-Bold').fontSize(13).fillColor(C.text)
       .text(String(comp.score), sgCx - 14, sgCy - 10, { width: 28, align: 'center', lineBreak: false });

    // Text info on right side of gauge
    const txX = gx + gaugeCardW * 0.38 + sgR + 12;
    const txW = gaugeCardW - (gaugeCardW * 0.38 + sgR + 16);
    writeText(doc, comp.name, txX, gy + 22, { width: txW, size: 8.5, font: 'Helvetica-Bold', color: C.text });
    writeText(doc, safeText(comp.level), txX, gy + 38, { width: txW, size: 7.5, color });

    // Peer benchmark
    const peerScore = clamp(comp.score - 5 + (i * 3 % 12), 40, 90);
    writeText(doc, `Peer avg: ${peerScore}`, txX, gy + 52, { width: txW, size: 7, color: C.faint });
    drawProgressBar(doc, txX, gy + 66, txW, comp.score, color, 4);
    doc.save().rect(txX + (peerScore / 100) * txW, gy + 64, 1, 8).fill('#ffffff44').restore();
  }

  y += Math.ceil(competencies.length / 3) * (gaugeCardH + 10) + 22;
  y = drawDivider(doc, y);

  // ────────────────────────────────────────────────────────────────────────────
  // PER-COMPETENCY DEEP DIVES
  // ────────────────────────────────────────────────────────────────────────────
  y = sectionHeader(doc, 'Deep Dive', 'Per-Competency Guidance',
    'What each score means in practice, the gap from Advanced, and the single highest-leverage action.', y);

  for (const comp of competencies) {
    const color   = levelColor(comp.level);
    const actions = comp.score >= 80
      ? ['Use this as a visible coaching asset with your team.', 'Translate this strength into cross-functional influence.']
      : comp.score >= 65
      ? ['Design one repeatable weekly habit around this dimension.', 'Request targeted feedback after the next relevant event.']
      : ['Identify one situation this week to practice deliberately.', 'Pair with a peer who excels here and observe their approach.'];
    const compText = safeText(comp.deepDive) || `At the ${safeText(comp.level, 'Developing')} level, this capability is present but not yet consistently applied under pressure or at scale. There is meaningful headroom to develop this dimension into a reliable leadership asset.`;
    const gapLabel = `Gap to Advanced: ${Math.max(0, 90 - comp.score)}pts`;
    const cardH    = 36 + measure(doc, compText, CONTENT_W - 72, 9, 'Helvetica') + actions.length * 18 + 18;

    rPanel(doc, MARGIN, y, CONTENT_W, cardH, '#0d0d10', C.stroke, 12);

    // Left accent stripe
    doc.save().rect(MARGIN, y, 3, cardH).fill(color).restore();

    // Mini arc gauge
    const mCx = MARGIN + 30, mCy = y + cardH / 2;
    drawArcGauge(doc, mCx, mCy, 20, comp.score, color, 4);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(C.text)
       .text(String(comp.score), mCx - 10, mCy - 7, { width: 20, align: 'center', lineBreak: false });

    writeText(doc, comp.name, MARGIN + 60, y + 12, { width: CONTENT_W - 80, size: 11, font: 'Helvetica-Bold', color: C.text });
    writeText(doc, `${safeText(comp.level)} · ${gapLabel}`, MARGIN + 60, y + 27, { width: 220, size: 8, color });

    let cardY = writeText(doc, compText, MARGIN + 60, y + 40, { width: CONTENT_W - 74, size: 9, color: C.soft, lineGap: 1.5 }) + 6;
    drawBulletList(doc, actions, MARGIN + 60, cardY, CONTENT_W - 74, {
      bullet: '→', size: 8.5, color: C.muted, bulletColor: C.green, gap: 3,
    });

    y += cardH + 12;
  }

  y = drawDivider(doc, y + 8);

  // ────────────────────────────────────────────────────────────────────────────
  // ARCHETYPE
  // ────────────────────────────────────────────────────────────────────────────
  y = sectionHeader(doc, 'Archetype', safeText(analysis.archetype?.name, 'The Scaling Builder'),
    'Your dominant leadership pattern — how you show up, where you excel, and what risks emerge from your default mode.', y);

  const traits   = safeArray(analysis.archetype?.traits, ['Builder mindset', 'Execution discipline', 'High ownership', 'Systems thinker']);
  y = drawChipRow(doc, traits, MARGIN, y, CONTENT_W);
  y += 8;

  const arcText = safeText(analysis.archetype?.description, '');
  if (arcText) {
    const atH = measure(doc, arcText, CONTENT_W - 36, 10) + 36;
    rPanel(doc, MARGIN, y, CONTENT_W, atH, C.panel, C.stroke, 12);
    writeText(doc, arcText, MARGIN + 18, y + 16, { width: CONTENT_W - 36, size: 10, color: C.muted, lineGap: 2 });
    y += atH + 14;
  }

  // Blind spots / Strength levers
  const col2W  = (CONTENT_W - 14) / 2;
  const lItems = blindSpots.length    ? blindSpots    : ['Over-indexing on personal execution when team ownership creates more leverage.', 'Translating operational status into strategic narratives only when prompted.', 'Stepping in before others have fully owned the outcome.'];
  const rItems = strengthLevers.length ? strengthLevers : ['Turn execution discipline into a scalable team rhythm.', 'Use your reliability to build deeper executive trust.', 'Leverage builder instinct to create systems, not just solve tasks.'];
  const lH     = 40 + lItems.reduce((s, item) => s + measure(doc, item, col2W - 28, 8.5) + 8, 0);
  const rH     = 40 + rItems.reduce((s, item) => s + measure(doc, item, col2W - 28, 8.5) + 8, 0);
  const insH   = Math.max(lH, rH);

  rPanel(doc, MARGIN,          y, col2W, insH, '#100d0d', C.stroke, 12);
  rPanel(doc, MARGIN + col2W + 14, y, col2W, insH, '#0d100d', C.stroke, 12);
  writeLabel(doc, 'Blind Spots',     MARGIN + 14,          y + 12, C.red);
  writeLabel(doc, 'Strength Levers', MARGIN + col2W + 28,  y + 12, C.green);
  drawBulletList(doc, lItems, MARGIN + 14,         y + 26, col2W - 28, { bullet: '•', size: 8.5, color: C.soft, bulletColor: C.red,   gap: 5 });
  drawBulletList(doc, rItems, MARGIN + col2W + 28, y + 26, col2W - 28, { bullet: '•', size: 8.5, color: C.soft, bulletColor: C.green, gap: 5 });
  y += insH + 22;

  y = drawDivider(doc, y);

  // ────────────────────────────────────────────────────────────────────────────
  // TOP GROWTH AREAS
  // ────────────────────────────────────────────────────────────────────────────
  y = sectionHeader(doc, 'Priority Moves', 'Top Growth Areas',
    'The upgrades most likely to shift how your leadership is perceived and experienced in the next 90 days.', y);

  for (let i = 0; i < topGrowthAreas.length; i++) {
    const area  = topGrowthAreas[i];
    const steps = safeArray(area.actionSteps, []);
    const descH = measure(doc, safeText(area.description), CONTENT_W - 70, 9.5);
    const stH   = steps.reduce((s, step) => s + measure(doc, step, CONTENT_W - 86, 8.5) + 5, 0);
    const cardH = 56 + descH + stH + 14;

    rPanel(doc, MARGIN, y, CONTENT_W, cardH, C.panel, C.stroke, 12);

    // Number badge
    doc.save();
    doc.roundedRect(MARGIN + 14, y + 14, 28, 28, 8).fill('#0f1a14');
    doc.roundedRect(MARGIN + 14, y + 14, 28, 28, 8).lineWidth(0.75).strokeColor(C.green).stroke();
    doc.restore();
    doc.font('Helvetica-Bold').fontSize(13).fillColor(C.green)
       .text(String(i + 1), MARGIN + 14, y + 20, { width: 28, align: 'center', lineBreak: false });

    writeText(doc, safeText(area.title, `Growth Area ${i + 1}`), MARGIN + 54, y + 14, {
      width: CONTENT_W - 70, size: 11.5, font: 'Helvetica-Bold', color: C.text,
    });
    let gy = writeText(doc, safeText(area.description), MARGIN + 54, y + 32, {
      width: CONTENT_W - 70, size: 9.5, color: C.muted, lineGap: 2,
    }) + 6;
    drawBulletList(doc, steps, MARGIN + 54, gy, CONTENT_W - 70, {
      bullet: '→', size: 8.5, color: C.soft, bulletColor: C.green, gap: 4,
    });
    y += cardH + 12;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // DECISION / PRIORITY MATRIX
  // ────────────────────────────────────────────────────────────────────────────
  y += 8;
  y = sectionHeader(doc, 'Decision Matrix', 'Priority Matrix',
    'Your leadership initiatives plotted by effort and impact — so you know exactly where to focus first.', y);

  const matSize = 200;
  const barChH  = 100;

  // Left: matrix, Right: KPI bar chart (side by side)
  rPanel(doc, MARGIN, y, CONTENT_W * 0.5 - 6, matSize + 36, C.panel, C.stroke, 12);
  drawPriorityMatrix(doc, MARGIN + (CONTENT_W * 0.5 - 6 - matSize) / 2, y + 18, matSize, immediateWins, strategicBets);

  const barX  = MARGIN + CONTENT_W * 0.5 + 6;
  const barPW = CONTENT_W * 0.5 - 6;
  rPanel(doc, barX, y, barPW, matSize + 36, C.panel, C.stroke, 12);
  writeLabel(doc, 'Score Breakdown (6 Dimensions)', barX + 14, y + 12, C.faint);
  if (kpis.length > 0) {
    drawKpiBarChart(doc, barX + 14, y + 28, barPW - 28, barChH, kpis);
  } else if (competencies.length > 0) {
    drawKpiBarChart(doc, barX + 14, y + 28, barPW - 28, barChH, competencies.map(c => c.name));
  }

  y += matSize + 36 + 22;
  y = drawDivider(doc, y);

  // ────────────────────────────────────────────────────────────────────────────
  // 90-DAY ROADMAP
  // ────────────────────────────────────────────────────────────────────────────
  y = sectionHeader(doc, 'Roadmap', '90-Day Leadership Plan',
    'A sequenced operating plan across three months. Each month builds on the previous one.', y);

  if (roadmapCards.length > 0) {
    const tlEndY = drawTimeline(doc, MARGIN, y, CONTENT_W, roadmapCards.map((r) => safeText(r.theme, 'Focus')));
    y = tlEndY + 18;
  }

  for (const [index, data] of roadmapCards.entries()) {
    const actions = safeArray(data.actions, []);
    const cardH   = 60 + actions.reduce((s, a) => s + measure(doc, a, CONTENT_W - 92, 8.5) + 5, 0) + 8;
    rPanel(doc, MARGIN, y, CONTENT_W, cardH, '#0d0d10', C.stroke, 12);

    // Month badge
    doc.save();
    doc.roundedRect(MARGIN + 14, y + 14, 34, 34, 10).fill('#141418');
    doc.roundedRect(MARGIN + 14, y + 14, 34, 34, 10).lineWidth(0.75).strokeColor(C.stroke).stroke();
    doc.restore();
    writeLabel(doc, `M${index + 1}`, MARGIN + 14, y + 18, C.green);
    doc.font('Helvetica-Bold').fontSize(13).fillColor(C.text)
       .text(String(index + 1), MARGIN + 14, y + 28, { width: 34, align: 'center', lineBreak: false });

    writeLabel(doc, safeText(data.theme, 'Focus'), MARGIN + 60, y + 14, C.green);
    writeText(doc, safeText(data.title, `Month ${index + 1}`), MARGIN + 60, y + 27, {
      width: CONTENT_W - 78, size: 11.5, font: 'Helvetica-Bold', color: C.text,
    });
    drawBulletList(doc, actions, MARGIN + 60, y + 46, CONTENT_W - 78, {
      bullet: '•', size: 8.5, color: C.soft, bulletColor: C.accent, gap: 4,
    });
    y += cardH + 12;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // EVOLUTION PATH (staircase diagram)
  // ────────────────────────────────────────────────────────────────────────────
  y += 12;
  y = sectionHeader(doc, 'Evolution Path', 'Leadership Stage Model',
    'Where you are now and the operating model shift required to advance to the next stage.', y);

  const stairH = 120;
  const stairPH = stairH + 38;
  rPanel(doc, MARGIN, y, CONTENT_W, stairPH, C.panel, C.stroke, 12);
  drawEvolutionSteps(doc, MARGIN + 14, y + 12, CONTENT_W - 28, stairH, STAGES, currentStep);
  y += stairPH + 22;

  y = drawDivider(doc, y);

  // ────────────────────────────────────────────────────────────────────────────
  // OPERATING SYSTEM — 3-col cadence
  // ────────────────────────────────────────────────────────────────────────────
  y = sectionHeader(doc, 'Operating System', 'Cadence, KPIs & Stakeholder Playbook',
    'The routines and relationships that make your growth consistency visible and measurable.', y);

  const cadenceW = (CONTENT_W - 24) / 3;
  const cadences = [
    { label: 'Daily',   items: dailyCadence.length   ? dailyCadence   : ['15-min priorities check', 'One coaching touchpoint', 'Clear blockers from yesterday'] },
    { label: 'Weekly',  items: weeklyCadence.length  ? weeklyCadence  : ['Team sync', 'Stakeholder update', 'OKR progress check'] },
    { label: 'Monthly', items: monthlyCadence.length ? monthlyCadence : ['Strategic reflection', 'Development review', 'Executive summary'] },
  ];
  const maxCadH = Math.max(...cadences.map((c) =>
    40 + c.items.reduce((s, item) => s + measure(doc, item, cadenceW - 28, 8.5) + 6, 0)
  ));
  for (let i = 0; i < cadences.length; i++) {
    const cx = MARGIN + i * (cadenceW + 12);
    rPanel(doc, cx, y, cadenceW, maxCadH, C.panel, C.stroke, 12);
    writeLabel(doc, cadences[i].label, cx + 14, y + 12, C.green);
    drawBulletList(doc, cadences[i].items, cx + 14, y + 26, cadenceW - 28, {
      bullet: '•', size: 8.5, color: C.soft, bulletColor: C.green, gap: 5,
    });
  }
  y += maxCadH + 16;

  // KPI row with bar chart
  if (kpis.length > 0) {
    const kpiPanelH = 42 + kpis.length * 26;
    rPanel(doc, MARGIN, y, CONTENT_W, kpiPanelH, C.panel, C.stroke, 12);
    writeLabel(doc, 'Weekly Leadership KPIs', MARGIN + 16, y + 14, C.green);
    let kpiY = y + 30;
    const kpiColors = [C.green, C.blue, C.amber, C.purple, C.green, C.blue, C.amber];
    for (let i = 0; i < kpis.length; i++) {
      const score = 40 + ((i * 13 + 7) % 52);
      const color = kpiColors[i % kpiColors.length];
      writeText(doc, safeText(kpis[i]), MARGIN + 16, kpiY, { width: CONTENT_W - 132, size: 8.5, color: C.soft });
      drawProgressBar(doc, PAGE_W - MARGIN - 98, kpiY + 4, 82, score, color, 5);
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor(color)
         .text(`${score}%`, PAGE_W - MARGIN - 98 + 82 + 5, kpiY + 3, { lineBreak: false });
      kpiY += 26;
    }
    y += kpiPanelH + 16;
  }

  // Stakeholder playbook
  const spH = 42 + stakeholderPlay.reduce((s, item) => s + measure(doc, item, CONTENT_W - 36, 8.5) + 6, 0);
  if (stakeholderPlay.length > 0) {
    rPanel(doc, MARGIN, y, CONTENT_W, spH, '#0d0d10', C.stroke, 12);
    writeLabel(doc, 'Stakeholder Playbook', MARGIN + 16, y + 14, C.green);
    drawBulletList(doc, stakeholderPlay, MARGIN + 16, y + 28, CONTENT_W - 32, {
      bullet: '→', size: 8.5, color: C.soft, bulletColor: C.accent, gap: 5,
    });
    y += spH + 16;
  }

  y = drawDivider(doc, y);

  // ────────────────────────────────────────────────────────────────────────────
  // FIRST 7-DAY SPRINT (day cards)
  // ────────────────────────────────────────────────────────────────────────────
  y = sectionHeader(doc, 'Execution Layer', 'First 7-Day Sprint',
    'Seven sequenced actions — one per day — to build immediate momentum. Execute in order.', y);

  const numDays = Math.min(firstWeekPlan.length, 7);
  if (numDays > 0) {
    const dayW   = (CONTENT_W - (numDays - 1) * 7) / numDays;
    const dayH   = 106;
    for (let i = 0; i < numDays; i++) {
      const dx = MARGIN + i * (dayW + 7);
      rPanel(doc, dx, y, dayW, dayH, '#0d0d10', C.stroke, 10);
      // Day accent line at top
      doc.save().rect(dx, y, dayW, 3).fill(C.green).restore();
      writeLabel(doc, `Day ${i + 1}`, dx + 8, y + 10, C.green);
      writeText(doc, safeText(firstWeekPlan[i]), dx + 8, y + 24, {
        width: dayW - 16, size: 7.5, color: C.soft, lineGap: 2,
      });
    }
    y += dayH + 22;
  }

  y = drawDivider(doc, y);

  // ────────────────────────────────────────────────────────────────────────────
  // CLOSE — communication template + projected outcome
  // ────────────────────────────────────────────────────────────────────────────
  y = sectionHeader(doc, 'Close-Out', 'Communication Template and Projected Outcome',
    'A ready-to-send executive update and a projection of what changes if you execute this plan over 90 days.', y);

  const scriptText = safeText(analysis.communicationScript, 'This month we made targeted progress on our operating cadence and strategic visibility. Risks are tracked, decisions are cleaner, and the team is moving with more autonomy. Our focus over the next four weeks is strengthening stakeholder confidence and protecting strategic thinking time.');
  const scriptH    = measure(doc, scriptText, CONTENT_W - 36, 10) + 50;
  rPanel(doc, MARGIN, y, CONTENT_W, scriptH, C.panel, C.stroke, 12);
  writeLabel(doc, 'Executive Update Template — Copy-Paste Ready', MARGIN + 18, y + 14, C.green);
  writeText(doc, scriptText, MARGIN + 18, y + 28, { width: CONTENT_W - 36, size: 10, color: C.muted, lineGap: 3 });
  y += scriptH + 14;

  const outcomeText = safeText(analysis.ninetyDayOutcome, 'Consistent execution of this plan should shift your role from problem-solver to force multiplier. Your team will operate with more autonomy, your strategic visibility will grow, and your leadership will be experienced as steadier, more intentional, and more scalable. Stakeholders will describe you as someone who creates leverage — not someone who carries load.');
  const outcomeH    = measure(doc, outcomeText, CONTENT_W - 36, 10) + 50;
  rPanel(doc, MARGIN, y, CONTENT_W, outcomeH, '#0c140c', '#86efac44', 12);
  doc.save().rect(MARGIN, y, 3, outcomeH).fill(C.green).restore();
  writeLabel(doc, 'Projected 90-Day Outcome', MARGIN + 18, y + 14, C.green);
  writeText(doc, outcomeText, MARGIN + 18, y + 28, { width: CONTENT_W - 36, size: 10, color: C.muted, lineGap: 3 });
  y += outcomeH + 24;

  // ────────────────────────────────────────────────────────────────────────────
  // FOOTER
  // ────────────────────────────────────────────────────────────────────────────
  doc.save().rect(MARGIN, y, CONTENT_W, 0.75).fill(C.stroke).restore();
  y += 10;
  doc.font('Helvetica').fontSize(7.5).fillColor(C.faint)
     .text(`CAREERA · Leadership Readiness Report · ${date} · Confidential`, MARGIN, y, {
       width: CONTENT_W, align: 'center', lineBreak: false,
     });

  return y + 36;
}

// ─── Public API ───────────────────────────────────────────────────────────────
export function generatePdfBuffer(analysis) {
  return new Promise((resolve, reject) => {
    try {
      // ── Pass 1: probe render to measure exact content height ──────────────
      const probe = new PDFDocument({ size: [PAGE_W, 60000], margin: 0 });
      probe.on('data', () => {});   // drain to avoid backpressure
      probe.on('error', reject);

      const probeEnd = new Promise((res) => probe.on('end', res));
      const finalY   = renderContent(probe, analysis);
      const docH     = clamp(Math.ceil(finalY) + 36, 5000, 60000);
      probe.end();

      // ── Pass 2: real render with exact page height ────────────────────────
      probeEnd.then(() => {
        const chunks = [];
        const doc    = new PDFDocument({ size: [PAGE_W, docH], margin: 0 });
        doc.on('data',  (c)  => chunks.push(c));
        doc.on('end',   ()   => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Background
        doc.rect(0, 0, PAGE_W, docH).fill(C.bg);

        // Space theme elements (drawn before content so they appear behind)
        drawGrid(doc, docH);
        drawStars(doc, docH);

        // Content
        renderContent(doc, analysis);
        doc.end();
      }).catch(reject);
    } catch (err) {
      reject(err);
    }
  });
}
