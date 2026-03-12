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

function panel(doc, x, y, w, h, fill = C.panel, strokeColor = C.stroke, radius = 14) {
  rPanel(doc, x, y, w, h, fill, strokeColor, radius);
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

function formatDate(dateValue) {
  if (typeof dateValue === 'string' && dateValue.trim()) return dateValue.trim();
  return new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function shortStageLabel(stage) {
  const value = safeText(stage, 'Scaling Manager');
  return value.split('→')[0].trim();
}

function nextStageFor(stage) {
  const lower = safeText(stage).toLowerCase();
  if (lower.includes('individual')) return 'New Manager';
  if (lower.includes('new manager')) return 'Scaling Manager';
  if (lower.includes('scaling')) return 'Senior Leader';
  if (lower.includes('senior') || lower.includes('strategic')) return 'Executive Leader';
  if (lower.includes('executive') || lower.includes('vp') || lower.includes('director')) return 'Enterprise Leader';
  return 'Senior Leader';
}

function benchmarkBand(score) {
  if (score >= 86) return 'High';
  if (score >= 74) return 'Medium-High';
  if (score >= 62) return 'Medium';
  return 'Emerging';
}

function derivePeerAverage(score, index) {
  return clamp(score + [-4, 3, -5, -2, -1, 2][index % 6], 55, 88);
}

function drawOrbitalCluster(doc, cx, cy, scale = 1) {
  doc.save();
  doc.circle(cx, cy, 72 * scale).lineWidth(0.8).strokeOpacity(0.15).strokeColor(C.green).stroke();
  doc.circle(cx, cy, 46 * scale).lineWidth(0.6).strokeOpacity(0.12).strokeColor(C.blue).stroke();
  doc.circle(cx + 8 * scale, cy - 6 * scale, 22 * scale).fillOpacity(0.05).fill(C.green);
  doc.circle(cx + 8 * scale, cy - 6 * scale, 6 * scale).fill(C.green);
  doc.circle(cx - 36 * scale, cy + 20 * scale, 4 * scale).fillOpacity(0.8).fill(C.blue);
  doc.circle(cx + 42 * scale, cy + 12 * scale, 3 * scale).fillOpacity(0.8).fill(C.purple);
  doc.moveTo(cx - 36 * scale, cy + 20 * scale).lineTo(cx + 8 * scale, cy - 6 * scale).lineWidth(0.6).strokeOpacity(0.18).strokeColor(C.blue).stroke();
  doc.moveTo(cx + 42 * scale, cy + 12 * scale).lineTo(cx + 8 * scale, cy - 6 * scale).lineWidth(0.6).strokeOpacity(0.18).strokeColor(C.green).stroke();
  doc.restore();
}

function pageHeader(doc, pageNo, title, subtitle, y) {
  return sectionHeader(doc, `Page ${String(pageNo).padStart(2, '0')}`, title, subtitle, y);
}

function drawBenchmarkRows(doc, x, y, width, items) {
  const rowH = 28;
  const dimW = width * 0.42;
  const youW = width * 0.27;
  const peerW = width - dimW - youW;

  panel(doc, x, y, width, 30 + items.length * rowH, C.panel, C.stroke, 12);
  writeLabel(doc, 'Dimension', x + 14, y + 12);
  writeLabel(doc, 'You', x + dimW + 10, y + 12);
  writeLabel(doc, 'Peer Average', x + dimW + youW + 8, y + 12);

  let rowY = y + 28;
  items.forEach((item, index) => {
    if (index > 0) {
      doc.save().rect(x + 12, rowY - 4, width - 24, 0.5).fill(C.strokeSoft).restore();
    }
    writeText(doc, item.name, x + 14, rowY + 4, {
      width: dimW - 20,
      size: 8.5,
      font: 'Helvetica-Bold',
      color: C.text,
    });
    writeText(doc, item.youLabel, x + dimW + 10, rowY + 4, {
      width: youW - 14,
      size: 8.5,
      color: C.muted,
    });
    writeText(doc, item.peerLabel, x + dimW + youW + 8, rowY + 4, {
      width: peerW - 18,
      size: 8.5,
      color: C.soft,
    });
    rowY += rowH;
  });

  return y + 30 + items.length * rowH;
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
  const defaultCompetencies = [
    { name: 'Strategic Thinking', score: 72, level: 'Developing', deepDive: 'You can see the next move clearly, but the next horizon still needs more deliberate airtime in your calendar and communication.' },
    { name: 'Delegation & Empowerment', score: 65, level: 'Emerging', deepDive: 'You delegate tasks, but the ownership of outcomes still tends to flow back toward you under pressure.' },
    { name: 'Coaching & Feedback', score: 81, level: 'Strong', deepDive: 'You set standards well and can develop others when you slow down enough to coach instead of solve.' },
    { name: 'Influence & Stakeholder Alignment', score: 68, level: 'Developing', deepDive: 'You are credible operationally, but senior alignment improves when you lead with context and business impact.' },
    { name: 'Execution & Accountability', score: 89, level: 'Advanced', deepDive: 'Execution is the strongest trust signal in your profile. People rely on you because outcomes move when you are involved.' },
    { name: 'Emotional Intelligence', score: 76, level: 'Strong', deepDive: 'You read teams well and create stability. The next upgrade is using that awareness more intentionally in difficult conversations.' },
  ];

  const competencies = safeArray(analysis.competencies, defaultCompetencies).slice(0, 6);
  const sorted = [...competencies].sort((a, b) => b.score - a.score);
  const strongest = sorted[0] || defaultCompetencies[4];
  const weakest = sorted[sorted.length - 1] || defaultCompetencies[1];
  const secondWeakest = sorted[sorted.length - 2] || defaultCompetencies[0];

  const topGrowthAreas = safeArray(analysis.topGrowthAreas, [
    {
      title: 'Delegation Depth',
      description: 'You delegate tasks, but not always the ownership of outcomes. The next step is transferring the result, not just the work.',
      actionSteps: [
        'Move from "Here is what to do" to "Here is the result we must own."',
        'Define decision rights before handoff, not after escalation.',
        'Review outcomes without reclaiming the task.',
      ],
    },
    {
      title: 'Strategic Communication',
      description: 'Your communication is precise but operational. Senior leadership responds better to narrative framing tied to business context.',
      actionSteps: [
        'Use the structure: Vision -> Context -> Action -> Impact.',
        'Lead updates with why it matters, not what happened.',
        'Translate progress into enterprise-level consequence.',
      ],
    },
    {
      title: 'Scaling Systems Thinking',
      description: 'You optimise inside your team well. The next leap is designing loops that improve work across teams, not just within them.',
      actionSteps: [
        'Identify one recurring friction point across functions.',
        'Replace heroics with an operating mechanism.',
        'Make the process visible enough that others can run it too.',
      ],
    },
  ]).slice(0, 3);

  const blindSpots = safeArray(analysis.blindSpots, [
    'May default to doing instead of designing.',
    'High standards can limit team autonomy.',
    'Strategic storytelling may be underutilised.',
  ]);

  const strengthLevers = safeArray(analysis.strengthLevers, [
    'Drives results through structure.',
    'Clear performance expectations.',
    'Comfortable with accountability.',
    'KPI-oriented mindset.',
  ]);

  const roadmap = analysis.roadmap || {};
  const roadmapCards = [roadmap.month1, roadmap.month2, roadmap.month3].filter(Boolean).length
    ? [roadmap.month1, roadmap.month2, roadmap.month3].filter(Boolean)
    : [
        {
          theme: 'Month 1',
          title: 'Shift from Doer to Designer',
          actions: [
            'Audit all tasks you personally execute.',
            'Redesign 1:1 structure toward coaching.',
            'Create 3 team-level ownership KPIs.',
          ],
        },
        {
          theme: 'Month 2',
          title: 'Strengthen Influence',
          actions: [
            'Practice executive narrative framing.',
            'Align quarterly goals with business outcomes.',
            'Conduct 2 stakeholder alignment sessions.',
          ],
        },
        {
          theme: 'Month 3',
          title: 'Multiply Impact',
          actions: [
            'Create successor roadmap for 1 direct report.',
            'Build scalable performance system.',
            'Document leadership philosophy.',
          ],
        },
      ];

  const stakeholderPlay = safeArray(analysis.stakeholderPlaybook, [
    'Your manager: send a weekly three-line update focused on business impact, not task completion.',
    'Peers: run one alignment conversation per month before priorities drift into conflict.',
    'Your team: coach for ownership first, then inspect outcomes rather than activity.',
    'Senior stakeholders: connect progress to risk reduction, speed, or revenue relevance.',
  ]);

  const firstWeekPlan = safeArray(analysis.firstWeekPlan, [
    'Audit every recurring responsibility that still depends on you.',
    'Convert your next 1:1 into a coaching conversation, not a status review.',
    'Write one strategic narrative update for your manager.',
    'Name one decision a team member can own this week.',
    'Map your top three stakeholders and their expectations.',
    'Create a Friday reflection on leverage versus personal effort.',
    'Share your 90-day growth intent with your team.',
  ]);

  const kpis = safeArray(analysis.kpis, [
    'Delegation ratio: work owned by team vs. you',
    'Team decisions made without escalation',
    'Proactive stakeholder updates sent',
    'Cross-functional friction points removed',
    'Development conversations completed',
    'Strategic priorities actively advanced',
  ]);
  const leadingIndicators = safeArray(analysis.metricsDashboard?.leadingIndicators, [
    'Delegate at least 2 recurring decisions with explicit owners by week 2',
    'Reserve 3 hours per week for strategic thinking and cross-functional preparation',
    'Send 1 executive-style update per week with context, decision, and impact',
    'Run 2 coaching-focused 1:1s per week instead of status-only conversations',
    'Raise stakeholder confidence pulse to 4/5 over the next month',
  ]);
  const laggingIndicators = safeArray(analysis.metricsDashboard?.laggingIndicators, [
    'Reduce direct tactical involvement by 20% within 30 days',
    'Improve team ownership of recurring workflows in at least 3 areas within 45 days',
    'Secure positive feedback from 2 senior stakeholders on strategic clarity within 60 days',
    'Document a repeatable team operating model and escalation path within 75 days',
    'Step away from one workflow for a day without quality dropping by day 90',
  ]);
  const riskRegister = safeArray(analysis.riskRegister, [
    { risk: 'Delegation remains task-based instead of ownership-based', impact: 'High', mitigation: 'Define outcome, decision rights, and escalation path before handoff.', owner: 'You + direct report' },
    { risk: 'Stakeholders still see the team as operational not strategic', impact: 'High', mitigation: 'Lead updates with business context and impact instead of task lists.', owner: 'You' },
    { risk: 'Tactical work crowds out leadership leverage time', impact: 'Medium', mitigation: 'Protect one recurring strategic block and redesign low-value meetings.', owner: 'You' },
    { risk: 'High standards unintentionally reduce autonomy', impact: 'Medium', mitigation: 'Make decision boundaries explicit and reward independent judgment publicly.', owner: 'You + team leads' },
  ]);
  const talentPlan = analysis.talentPlan || {};
  const accelerateItems = safeArray(talentPlan.accelerate, [
    'People already showing reliable judgment under ambiguity',
    'Team members ready for fuller ownership with one level more coaching',
    'Behaviors that turn execution wins into system improvements',
    'Cross-functional collaborators who can become influence partners',
  ]);
  const stabilizeItems = safeArray(talentPlan.stabilize, [
    'Individuals who still need tighter decision boundaries',
    'Behaviors that create rework because expectations stay implied',
    'Meetings where accountability is unclear after the conversation ends',
    'Workflows that still depend too heavily on your review',
  ]);
  const delegateItems = safeArray(talentPlan.delegate, [
    'Recurring status collection and routine follow-up tasks',
    'One operational workflow that a high-potential report can fully own',
    'Preparation work for leadership updates once the structure is defined',
    'Low-complexity decisions bounded by clear rules',
  ]);
  const meetingBlueprint = analysis.meetingBlueprint || {};
  const benchmarkNarrative = safeText(
    analysis.benchmarkNarrative,
    'Relative to peers, execution and accountability are likely to stand out as strengths, but the next edge comes from deeper delegation, sharper strategic framing, and more visible cross-functional influence. That combination is what separates respected senior leaders from simply dependable managers.'
  );
  const evolutionNarrative = safeText(
    analysis.evolutionNarrative,
    'The move from scaling manager to senior strategic leader is not mainly about working harder. It is about changing what only you can own: direction, trade-offs, system design, talent decisions, and stakeholder confidence. Growth happens when capacity is freed from direct execution and reinvested into leverage.'
  );
  const finalReflectionText = safeText(
    analysis.finalReflection,
    'The leaders who earn durable respect are not the ones who become indispensable through effort. They become respected because they build clarity, raise standards, develop stronger operators around them, and make difficult decisions legible to others. Use this report to redesign your operating system until your impact compounds even when you are not personally holding every thread.'
  );

  const dailyCadence = safeArray(analysis.operatingCadence?.daily, [
    '15-minute priorities check',
    'One coaching touchpoint',
    'Clear blockers instead of solving them yourself',
  ]);
  const weeklyCadence = safeArray(analysis.operatingCadence?.weekly, [
    'Team sync with ownership review',
    'Stakeholder narrative update',
    'Leadership reflection block',
  ]);
  const monthlyCadence = safeArray(analysis.operatingCadence?.monthly, [
    'Strategy review with manager',
    'Cross-functional alignment session',
    'System redesign check-in',
  ]);

  const immediateWins = safeArray(analysis.decisionMatrix?.immediateWins, [
    'Reshape 1:1 agendas',
    'Delegate one recurring process',
    'Sharpen weekly updates',
    'Clarify decision ownership',
  ]);
  const strategicBets = safeArray(analysis.decisionMatrix?.strategicBets, [
    'Build delegation framework',
    'Upgrade stakeholder influence',
    'Design successor pathway',
    'Create cross-team leverage loop',
  ]);

  const personName = safeText(
    analysis.personName || analysis.fullName || analysis.name,
    'Marina Nikitchuk'
  );
  const assessmentDate = formatDate(analysis.assessmentDate || '17 February 2026');
  const score = clamp(analysis.leadershipScore || 78, 0, 100);
  const stageBase = safeText(analysis.leadershipStage, 'Scaling Manager');
  const stageDisplay = stageBase.includes('→') ? stageBase : `${stageBase} → ${nextStageFor(stageBase)}`;
  const archetypeName = safeText(analysis.archetype?.name, 'The Scaling Builder');
  const archetypeDescription = safeText(
    analysis.archetype?.description,
    'A performance-driven builder who creates order, accountability, and momentum. The next evolution is moving from personal throughput to scalable leadership leverage.'
  );
  const plateauRisk = safeText(
    analysis.plateauRisk,
    'Burnout or becoming the best IC-manager instead of evolving into an enterprise leader.'
  );
  const summaryText = safeText(
    analysis.executiveSummary,
    'You are a performance-driven leader with strong ownership and execution capabilities. Your next evolution requires shifting from operator to multiplier: increasing strategic leverage, delegation depth, and cross-functional influence.'
  );
  const keyInsight = safeText(
    analysis.keyInsight,
    'The difference between a strong manager and a respected leader is leverage.'
  );
  const scriptText = safeText(
    analysis.communicationScript,
    'This quarter I am shifting from direct execution toward scalable leadership leverage. The focus is stronger delegation, sharper strategic communication, and better cross-functional alignment so the team can deliver with more autonomy and visibility.'
  );
  const outcomeText = safeText(
    analysis.ninetyDayOutcome,
    'If you execute this plan consistently, your role will shift from dependable operator to respected force multiplier. Your team will rely less on your constant involvement, and senior stakeholders will experience you as more strategic, more influential, and more scalable.'
  );

  const strategicComp = competencies.find((item) => /strateg/i.test(item.name)) || weakest;
  const delegationComp = competencies.find((item) => /deleg|empower|team/i.test(item.name)) || secondWeakest;
  const influenceComp = competencies.find((item) => /influ|stakeholder/i.test(item.name)) || secondWeakest;
  const growthHeadline = `${delegationComp.name} + ${strategicComp.name}`;

  const snapshotBullets = [
    'Strong operational leadership',
    'High accountability and performance orientation',
    `${delegationComp.name} requires refinement`,
    influenceComp.score < 75 ? 'Influence across senior stakeholders can deepen' : `${influenceComp.name} can become more visible at senior level`,
  ];

  const benchmarkItems = competencies.map((item, index) => ({
    name: item.name,
    youScore: item.score,
    peerScore: derivePeerAverage(item.score, index),
    youLabel: benchmarkBand(item.score),
    peerLabel: benchmarkBand(derivePeerAverage(item.score, index)),
  }));

  const stageCards = [
    {
      name: 'Individual Contributor',
      shift: 'Prove personal capability and delivery reliability.',
    },
    {
      name: 'New Manager',
      shift: 'Move from doing the work to directing the work.',
    },
    {
      name: 'Scaling Manager',
      shift: 'Create repeatability, coaching, and clear operating systems.',
    },
    {
      name: 'Strategic Leader',
      shift: 'Shape direction across functions and influence without authority.',
    },
    {
      name: 'Executive Leader',
      shift: 'Allocate attention, capital, and leadership energy at enterprise level.',
    },
  ];

  const stageStr = stageDisplay.toLowerCase();
  let currentStep = 3;
  if (stageStr.includes('individual')) currentStep = 1;
  else if (stageStr.includes('new manager')) currentStep = 2;
  else if (stageStr.includes('scaling')) currentStep = 3;
  else if (stageStr.includes('strategic') || stageStr.includes('senior')) currentStep = 4;
  else if (stageStr.includes('executive') || stageStr.includes('vp') || stageStr.includes('director')) currentStep = 5;

  let y = 40;

  // Cover page
  const coverH = 368;
  panel(doc, MARGIN, y, CONTENT_W, coverH, C.panelAlt, C.stroke, 22);
  doc.save().circle(PAGE_W - MARGIN - 102, y + 118, 92).fillOpacity(0.035).fill(C.green).restore();
  doc.save().circle(MARGIN + 86, y + 64, 42).fillOpacity(0.025).fill(C.blue).restore();
  writeLabel(doc, 'CAREERA · LEADERSHIP INTELLIGENCE', MARGIN + 24, y + 22, C.faint);
  doc.save().rect(MARGIN + 24, y + 32, 28, 1).fill(C.green).restore();
  writeText(doc, 'From Manager to\nRespected Leader', MARGIN + 24, y + 46, {
    width: CONTENT_W * 0.58,
    size: 28,
    font: 'Helvetica-Bold',
    color: C.text,
    lineGap: 1,
  });
  writeText(doc, 'Your Personalised Leadership Growth Report', MARGIN + 24, y + 118, {
    width: CONTENT_W * 0.58,
    size: 11,
    color: C.soft,
  });
  writeText(doc, `For: ${personName}`, MARGIN + 24, y + 158, {
    width: 220,
    size: 10,
    color: C.muted,
    font: 'Helvetica-Bold',
  });
  writeText(doc, `Assessment Date: ${assessmentDate}`, MARGIN + 24, y + 178, {
    width: 220,
    size: 9.5,
    color: C.soft,
  });
  writeText(doc, `Leadership Stage: ${stageDisplay}`, MARGIN + 24, y + 196, {
    width: 260,
    size: 9.5,
    color: C.soft,
  });
  const coverQuote = `"${keyInsight}"`;
  const coverQuoteH = measure(doc, coverQuote, CONTENT_W * 0.48, 10.5, 'Helvetica-Bold') + 28;
  panel(doc, MARGIN + 24, y + 228, CONTENT_W * 0.48, coverQuoteH, '#0c140c', '#86efac44', 14);
  writeLabel(doc, 'Mission Brief', MARGIN + 40, y + 242, C.green);
  writeText(doc, coverQuote, MARGIN + 40, y + 256, {
    width: CONTENT_W * 0.48 - 32,
    size: 10.5,
    color: C.green,
    font: 'Helvetica-Bold',
    lineGap: 2,
  });
  drawOrbitalCluster(doc, PAGE_W - MARGIN - 104, y + 124, 1);
  drawArcGauge(doc, PAGE_W - MARGIN - 104, y + 124, 42, score, C.green, 6);
  doc.font('Helvetica-Bold').fontSize(24).fillColor(C.text).text(String(score), PAGE_W - MARGIN - 126, y + 110, {
    width: 44,
    align: 'center',
    lineBreak: false,
  });
  writeLabel(doc, 'Readiness Score', PAGE_W - MARGIN - 138, y + 176, C.faint);
  const coverMetaY = y + coverH - 54;
  const coverMetaW = (CONTENT_W - 36) / 3;
  [
    { label: 'Current Stage', value: shortStageLabel(stageDisplay) },
    { label: 'Target Shift', value: nextStageFor(stageDisplay) },
    { label: 'Archetype', value: archetypeName },
  ].forEach((item, index) => {
    const x = MARGIN + 18 + index * (coverMetaW + 9);
    panel(doc, x, coverMetaY, coverMetaW, 34, '#0e0e11', C.strokeSoft, 10);
    writeLabel(doc, item.label, x + 10, coverMetaY + 8);
    writeText(doc, item.value, x + 10, coverMetaY + 18, {
      width: coverMetaW - 18,
      size: 8.5,
      color: C.text,
      font: 'Helvetica-Bold',
    });
  });
  y += coverH + 28;

  // Page 2
  y = pageHeader(doc, 2, 'Executive Summary', 'A concise reading of your readiness, strengths, and immediate leverage points.', y);
  const leftCardW = 176;
  const rightCardW = CONTENT_W - leftCardW - 14;
  const summaryParagraphH = measure(doc, summaryText, rightCardW - 28, 9.5) + 32;
  const snapshotListH = snapshotBullets.reduce((sum, item) => sum + measure(doc, item, rightCardW - 34, 8.5) + 6, 0);
  const rightCardH = Math.max(164, summaryParagraphH + snapshotListH + 28);
  const scoreCardH = rightCardH;
  panel(doc, MARGIN, y, leftCardW, scoreCardH, C.panel, C.stroke, 16);
  drawArcGauge(doc, MARGIN + leftCardW / 2, y + 70, 34, score, C.green, 6);
  doc.font('Helvetica-Bold').fontSize(26).fillColor(C.text).text(String(score), MARGIN + leftCardW / 2 - 24, y + 57, {
    width: 48,
    align: 'center',
    lineBreak: false,
  });
  writeLabel(doc, 'Your Leadership Readiness Score', MARGIN + 18, y + 118, C.green);
  writeText(doc, `${score} / 100`, MARGIN + 18, y + 132, {
    width: leftCardW - 36,
    size: 16,
    font: 'Helvetica-Bold',
    color: C.text,
    align: 'center',
  });
  panel(doc, MARGIN + leftCardW + 14, y, rightCardW, rightCardH, C.panel, C.stroke, 16);
  writeLabel(doc, 'Snapshot Overview', MARGIN + leftCardW + 32, y + 16, C.faint);
  let snapY = y + 30;
  snapY = drawBulletList(doc, snapshotBullets.map((item, index) => `${index < 2 ? 'Strong:' : 'Focus:'} ${item}`), MARGIN + leftCardW + 32, snapY, rightCardW - 40, {
    bullet: '•',
    size: 8.5,
    color: C.muted,
    bulletColor: C.green,
    gap: 4,
  });
  writeText(doc, summaryText, MARGIN + leftCardW + 32, snapY + 6, {
    width: rightCardW - 40,
    size: 9.5,
    color: C.soft,
    lineGap: 2.5,
  });
  y += Math.max(scoreCardH, rightCardH) + 14;

  const statW = (CONTENT_W - 24) / 3;
  [
    { label: 'Top Strength', value: strongest.name, sub: `${strongest.score}/100 · ${strongest.level}` },
    { label: 'Growth Edge', value: weakest.name, sub: `${weakest.score}/100 · ${weakest.level}` },
    { label: 'Archetype', value: archetypeName, sub: shortStageLabel(stageDisplay) },
  ].forEach((item, index) => {
    const x = MARGIN + index * (statW + 12);
    panel(doc, x, y, statW, 72, '#0f0f12', C.strokeSoft, 12);
    writeLabel(doc, item.label, x + 14, y + 12);
    writeText(doc, item.value, x + 14, y + 26, {
      width: statW - 28,
      size: 10.5,
      font: 'Helvetica-Bold',
      color: C.text,
    });
    writeText(doc, item.sub, x + 14, y + 48, {
      width: statW - 28,
      size: 8,
      color: C.soft,
    });
  });
  y += 92;
  y = drawDivider(doc, y);

  // Page 3
  y = pageHeader(doc, 3, 'Leadership Competency Breakdown', 'Visual profile across the six dimensions that matter most at your next level.', y);
  const radarPanelW = CONTENT_W * 0.46;
  const barsPanelW = CONTENT_W - radarPanelW - 14;
  const radarPanelH = 250;
  panel(doc, MARGIN, y, radarPanelW, radarPanelH, C.panel, C.stroke, 16);
  drawRadarChart(doc, MARGIN + radarPanelW / 2, y + 118, 88, competencies);
  writeLabel(doc, 'Radar View', MARGIN + 16, y + 16, C.green);
  panel(doc, MARGIN + radarPanelW + 14, y, barsPanelW, radarPanelH, C.panel, C.stroke, 16);
  writeLabel(doc, 'Competency Scoreboard', MARGIN + radarPanelW + 30, y + 16, C.faint);
  let rowY = y + 30;
  competencies.forEach((item, index) => {
    const color = levelColor(item.level);
    writeText(doc, item.name, MARGIN + radarPanelW + 30, rowY, {
      width: barsPanelW - 92,
      size: 8.5,
      font: 'Helvetica-Bold',
      color: C.text,
    });
    writeText(doc, `${item.score}`, MARGIN + radarPanelW + barsPanelW - 46, rowY, {
      width: 24,
      size: 8.5,
      font: 'Helvetica-Bold',
      color,
      align: 'right',
    });
    rowY += 13;
    drawProgressBar(doc, MARGIN + radarPanelW + 30, rowY, barsPanelW - 58, item.score, color, 5);
    rowY += 9;
    writeText(doc, item.level, MARGIN + radarPanelW + 30, rowY, {
      width: barsPanelW - 80,
      size: 7,
      color: C.faint,
    });
    rowY += index === competencies.length - 1 ? 10 : 12;
  });
  y += radarPanelH + 14;

  const growthH = 54;
  panel(doc, MARGIN, y, CONTENT_W, growthH, '#0c140c', '#86efac44', 14);
  writeLabel(doc, 'Highest Leverage Growth Area', MARGIN + 18, y + 12, C.green);
  writeText(doc, growthHeadline, MARGIN + 18, y + 24, {
    width: CONTENT_W - 36,
    size: 12,
    font: 'Helvetica-Bold',
    color: C.green,
  });
  y += growthH + 14;

  const miniW = (CONTENT_W - 20) / 3;
  competencies.slice(0, 6).forEach((item, index) => {
    const cardX = MARGIN + (index % 3) * (miniW + 10);
    const cardY = y + Math.floor(index / 3) * 94;
    const color = levelColor(item.level);
    panel(doc, cardX, cardY, miniW, 82, '#0f0f12', C.strokeSoft, 12);
    drawArcGauge(doc, cardX + 30, cardY + 40, 18, item.score, color, 4);
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(C.text).text(String(item.score), cardX + 20, cardY + 34, {
      width: 20,
      align: 'center',
      lineBreak: false,
    });
    writeText(doc, item.name, cardX + 56, cardY + 18, {
      width: miniW - 66,
      size: 8,
      font: 'Helvetica-Bold',
      color: C.text,
    });
    writeText(doc, item.level, cardX + 56, cardY + 46, {
      width: miniW - 66,
      size: 7.5,
      color,
    });
  });
  y += 192;
  y = drawDivider(doc, y);

  // Page 4
  y = pageHeader(doc, 4, 'Your Leadership Archetype', archetypeName, y);
  const chipEnd = drawChipRow(doc, safeArray(analysis.archetype?.traits, [
    'Structure builder',
    'Execution-led',
    'High accountability',
    'Performance standards',
  ]), MARGIN, y, CONTENT_W);
  y = chipEnd + 10;
  const archetypeTextH = measure(doc, archetypeDescription, CONTENT_W - 36, 10) + 34;
  panel(doc, MARGIN, y, CONTENT_W, archetypeTextH, C.panel, C.stroke, 14);
  writeText(doc, archetypeDescription, MARGIN + 18, y + 16, {
    width: CONTENT_W - 36,
    size: 10,
    color: C.muted,
    lineGap: 2.5,
  });
  y += archetypeTextH + 14;

  const colW = (CONTENT_W - 14) / 2;
  const strengthsHeight = 44 + strengthLevers.slice(0, 4).reduce((sum, item) => sum + measure(doc, item, colW - 28, 8.5) + 6, 0);
  const blindHeight = 44 + blindSpots.slice(0, 4).reduce((sum, item) => sum + measure(doc, item, colW - 28, 8.5) + 6, 0);
  const twoColH = Math.max(strengthsHeight, blindHeight);
  panel(doc, MARGIN, y, colW, twoColH, '#0d100d', C.stroke, 14);
  panel(doc, MARGIN + colW + 14, y, colW, twoColH, '#100d0d', C.stroke, 14);
  writeLabel(doc, 'Strengths', MARGIN + 16, y + 14, C.green);
  writeLabel(doc, 'Blind Spots', MARGIN + colW + 30, y + 14, C.red);
  drawBulletList(doc, strengthLevers.slice(0, 4), MARGIN + 16, y + 28, colW - 28, {
    bullet: '•',
    size: 8.5,
    color: C.soft,
    bulletColor: C.green,
    gap: 5,
  });
  drawBulletList(doc, blindSpots.slice(0, 4), MARGIN + colW + 30, y + 28, colW - 28, {
    bullet: '•',
    size: 8.5,
    color: C.soft,
    bulletColor: C.red,
    gap: 5,
  });
  y += twoColH + 14;

  const riskH = measure(doc, plateauRisk, CONTENT_W - 36, 10) + 38;
  panel(doc, MARGIN, y, CONTENT_W, riskH, '#13110b', '#fbbf2440', 14);
  writeLabel(doc, 'Typical Plateau Risk', MARGIN + 18, y + 14, C.amber);
  writeText(doc, plateauRisk, MARGIN + 18, y + 28, {
    width: CONTENT_W - 36,
    size: 10,
    color: C.muted,
    lineGap: 2,
  });
  y += riskH + 18;
  y = drawDivider(doc, y);

  // Page 5
  y = pageHeader(doc, 5, 'Your Top 3 Growth Gaps', 'Three shifts that move you from reliable manager to respected leader.', y);
  topGrowthAreas.forEach((area, index) => {
    const upgradeMove = safeArray(area.actionSteps, [])[0] || 'Upgrade the operating model, not just the output.';
    const description = safeText(area.description);
    const cardH = 72 + measure(doc, description, CONTENT_W - 98, 9.5) + measure(doc, upgradeMove, CONTENT_W - 110, 8.5) + 10;
    panel(doc, MARGIN, y, CONTENT_W, cardH, C.panel, C.stroke, 14);
    panel(doc, MARGIN + 14, y + 14, 36, 36, '#0f1a14', C.green, 10);
    doc.font('Helvetica-Bold').fontSize(15).fillColor(C.green).text(String(index + 1), MARGIN + 14, y + 23, {
      width: 36,
      align: 'center',
      lineBreak: false,
    });
    writeText(doc, area.title, MARGIN + 62, y + 14, {
      width: CONTENT_W - 80,
      size: 12,
      font: 'Helvetica-Bold',
      color: C.text,
    });
    const descEnd = writeText(doc, description, MARGIN + 62, y + 32, {
      width: CONTENT_W - 80,
      size: 9.5,
      color: C.muted,
      lineGap: 2.2,
    });
    writeLabel(doc, 'Upgrade Move', MARGIN + 62, descEnd + 6, C.green);
    writeText(doc, upgradeMove, MARGIN + 62, descEnd + 18, {
      width: CONTENT_W - 92,
      size: 8.5,
      color: C.soft,
      font: 'Helvetica-Bold',
    });
    y += cardH + 12;
  });

  const matrixH = 240;
  const matrixLeftW = CONTENT_W * 0.5 - 8;
  const matrixRightW = CONTENT_W - matrixLeftW - 14;
  panel(doc, MARGIN, y, matrixLeftW, matrixH, C.panel, C.stroke, 14);
  writeLabel(doc, 'Priority Matrix', MARGIN + 16, y + 14, C.faint);
  drawPriorityMatrix(doc, MARGIN + 16, y + 30, matrixLeftW - 32, immediateWins, strategicBets);
  panel(doc, MARGIN + matrixLeftW + 14, y, matrixRightW, matrixH, C.panel, C.stroke, 14);
  writeLabel(doc, 'Scale Moves', MARGIN + matrixLeftW + 30, y + 14, C.green);
  drawBulletList(doc, [
    'Do now: delegation mechanics and clearer leadership communication.',
    'Plan next: scalable systems and successor development.',
    'Avoid: replacing process gaps with personal heroics.',
    'Measure progress through ownership, influence, and repeatability.',
  ], MARGIN + matrixLeftW + 30, y + 32, matrixRightW - 44, {
    bullet: '•',
    size: 8.5,
    color: C.soft,
    bulletColor: C.green,
    gap: 8,
  });
  y += matrixH + 18;
  y = drawDivider(doc, y);

  // Pages 6-7
  y = pageHeader(doc, 6, '90-Day Leadership Roadmap', 'Three months to move from operator mindset to leadership leverage.', y);
  const tlEndY = drawTimeline(doc, MARGIN, y, CONTENT_W, roadmapCards.map((item) => safeText(item.theme, 'Focus')));
  y = tlEndY + 18;
  roadmapCards.forEach((card, index) => {
    const actions = safeArray(card.actions, []);
    const cardH = 64 + actions.reduce((sum, item) => sum + measure(doc, item, CONTENT_W - 90, 8.5) + 4, 0);
    panel(doc, MARGIN, y, CONTENT_W, cardH, '#0f0f12', C.stroke, 14);
    panel(doc, MARGIN + 16, y + 16, 42, 42, '#141418', C.strokeSoft, 12);
    writeLabel(doc, `M${index + 1}`, MARGIN + 16, y + 20, C.green);
    doc.font('Helvetica-Bold').fontSize(15).fillColor(C.text).text(String(index + 1), MARGIN + 16, y + 31, {
      width: 42,
      align: 'center',
      lineBreak: false,
    });
    writeLabel(doc, card.theme, MARGIN + 72, y + 16, C.green);
    writeText(doc, card.title, MARGIN + 72, y + 28, {
      width: CONTENT_W - 90,
      size: 11.5,
      font: 'Helvetica-Bold',
      color: C.text,
    });
    drawBulletList(doc, actions, MARGIN + 72, y + 48, CONTENT_W - 90, {
      bullet: '•',
      size: 8.5,
      color: C.soft,
      bulletColor: C.accent,
      gap: 4,
    });
    y += cardH + 12;
  });

  const markersW = (CONTENT_W - 24) / 3;
  [
    { label: 'Month 1 Markers', value: 'Less direct execution, more visible coaching.' },
    { label: 'Month 2 Markers', value: 'Sharper stakeholder confidence and better context-setting.' },
    { label: 'Month 3 Markers', value: 'Systems keep moving even when you are not the operator.' },
  ].forEach((item, index) => {
    const x = MARGIN + index * (markersW + 12);
    panel(doc, x, y, markersW, 84, '#0d100d', C.strokeSoft, 12);
    writeLabel(doc, item.label, x + 14, y + 14, C.green);
    writeText(doc, item.value, x + 14, y + 28, {
      width: markersW - 24,
      size: 8.5,
      color: C.soft,
      lineGap: 2,
    });
  });
  y += 102;
  y = drawDivider(doc, y);

  // Page 8
  y = pageHeader(doc, 8, 'Benchmark Comparison', 'How you compare to leaders operating at a similar stage of scope and complexity.', y);
  const benchmarkEndY = drawBenchmarkRows(doc, MARGIN, y, CONTENT_W, benchmarkItems);
  y = benchmarkEndY + 14;
  const comparePanelH = 34 + benchmarkItems.length * 24;
  panel(doc, MARGIN, y, CONTENT_W, comparePanelH, C.panel, C.stroke, 14);
  writeLabel(doc, 'Comparison Bars', MARGIN + 16, y + 14, C.faint);
  let compareY = y + 28;
  benchmarkItems.forEach((item, index) => {
    const color = levelColor(competencies[index]?.level);
    writeText(doc, item.name, MARGIN + 16, compareY, {
      width: 150,
      size: 8,
      font: 'Helvetica-Bold',
      color: C.text,
    });
    drawProgressBar(doc, MARGIN + 176, compareY + 3, 132, item.youScore, color, 5);
    drawProgressBar(doc, MARGIN + 328, compareY + 3, 132, item.peerScore, C.soft, 5);
    writeText(doc, `${item.youScore}`, MARGIN + 314, compareY, { width: 22, size: 7.5, color, align: 'right' });
    writeText(doc, `${item.peerScore}`, MARGIN + 466, compareY, { width: 22, size: 7.5, color: C.soft, align: 'right' });
    compareY += 24;
  });
  y += comparePanelH + 12;
  const compareSummary = `${strongest.name} is outperforming peer averages, while ${delegationComp.name.toLowerCase()} is the clearest place to close the gap with more senior leaders.`;
  const compareSummaryH = measure(doc, compareSummary, CONTENT_W - 36, 9.5) + 34;
  panel(doc, MARGIN, y, CONTENT_W, compareSummaryH, '#0c140c', '#86efac44', 14);
  writeText(doc, compareSummary, MARGIN + 18, y + 16, {
    width: CONTENT_W - 36,
    size: 9.5,
    color: C.green,
    font: 'Helvetica-Bold',
    lineGap: 2,
  });
  y += compareSummaryH + 18;
  const benchmarkNarrativeH = measure(doc, benchmarkNarrative, CONTENT_W - 36, 9.2) + 36;
  panel(doc, MARGIN, y, CONTENT_W, benchmarkNarrativeH, C.panel, C.stroke, 14);
  writeLabel(doc, 'Benchmark Interpretation', MARGIN + 18, y + 14, C.faint);
  writeText(doc, benchmarkNarrative, MARGIN + 18, y + 28, {
    width: CONTENT_W - 36,
    size: 9.2,
    color: C.soft,
    lineGap: 2.3,
  });
  y += benchmarkNarrativeH + 18;
  y = drawDivider(doc, y);

  // Page 9
  y = pageHeader(doc, 9, 'Leadership Evolution Path', 'The mindset shifts required as you move from competent manager to trusted strategic leader.', y);
  const stairPanelH = 188;
  panel(doc, MARGIN, y, CONTENT_W, stairPanelH, C.panel, C.stroke, 16);
  drawEvolutionSteps(doc, MARGIN + 18, y + 18, CONTENT_W - 36, 112, stageCards.map((item) => item.name), currentStep);
  let stageInfoY = y + 142;
  const stageW = (CONTENT_W - 36) / 5;
  stageCards.forEach((item, index) => {
    writeLabel(doc, item.name, MARGIN + 10 + index * stageW, stageInfoY, index + 1 === currentStep ? C.green : C.faint);
    writeText(doc, item.shift, MARGIN + 10 + index * stageW, stageInfoY + 12, {
      width: stageW - 8,
      size: 6.8,
      color: index + 1 === currentStep ? C.soft : C.faint,
      lineGap: 1.5,
    });
  });
  y += stairPanelH + 16;
  const shiftText = `You are here: ${shortStageLabel(stageDisplay)}. The next meaningful shift is moving from reliable personal throughput to scalable influence, systems, and leadership leverage.`;
  const shiftH = measure(doc, shiftText, CONTENT_W - 36, 9.5) + 34;
  panel(doc, MARGIN, y, CONTENT_W, shiftH, '#0f1014', C.strokeSoft, 14);
  writeText(doc, shiftText, MARGIN + 18, y + 16, {
    width: CONTENT_W - 36,
    size: 9.5,
    color: C.soft,
    lineGap: 2.4,
  });
  y += shiftH + 18;
  const evolutionNarrativeH = measure(doc, evolutionNarrative, CONTENT_W - 36, 9.2) + 36;
  panel(doc, MARGIN, y, CONTENT_W, evolutionNarrativeH, C.panel, C.stroke, 14);
  writeLabel(doc, 'Stage Shift Narrative', MARGIN + 18, y + 14, C.faint);
  writeText(doc, evolutionNarrative, MARGIN + 18, y + 28, {
    width: CONTENT_W - 36,
    size: 9.2,
    color: C.soft,
    lineGap: 2.3,
  });
  y += evolutionNarrativeH + 18;
  y = drawDivider(doc, y);

  // Page 10
  y = pageHeader(doc, 10, 'Final Reflection & Call to Action', 'Respect compounds when your leadership creates leverage beyond your own effort.', y);
  const ctaHeroH = 96;
  panel(doc, MARGIN, y, CONTENT_W, ctaHeroH, '#0c140c', '#86efac44', 16);
  writeLabel(doc, 'Your Next Leadership Move', MARGIN + 20, y + 16, C.green);
  writeText(doc, 'The difference between a strong manager and a respected leader is leverage.', MARGIN + 20, y + 30, {
    width: CONTENT_W - 40,
    size: 16,
    font: 'Helvetica-Bold',
    color: C.green,
    lineGap: 1,
  });
  y += ctaHeroH + 14;

  const ctaW = (CONTENT_W - 24) / 3;
  [
    { label: 'Join leadership cohort', value: 'Build accountability and practice with a peer group.' },
    { label: 'Book 1:1 diagnostic session', value: 'Translate this report into a sharper leadership plan.' },
    { label: 'Start advanced delegation module', value: 'Upgrade ownership transfer, not just task assignment.' },
  ].forEach((item, index) => {
    const x = MARGIN + index * (ctaW + 12);
    panel(doc, x, y, ctaW, 92, C.panel, C.stroke, 14);
    writeLabel(doc, `Action ${index + 1}`, x + 14, y + 14, C.green);
    writeText(doc, item.label, x + 14, y + 28, {
      width: ctaW - 28,
      size: 9.5,
      font: 'Helvetica-Bold',
      color: C.text,
      lineGap: 2,
    });
    writeText(doc, item.value, x + 14, y + 56, {
      width: ctaW - 28,
      size: 7.8,
      color: C.soft,
      lineGap: 2,
    });
  });
  y += 110;

  const scriptH = measure(doc, scriptText, CONTENT_W - 36, 9.5) + 40;
  panel(doc, MARGIN, y, CONTENT_W, scriptH, C.panel, C.stroke, 14);
  writeLabel(doc, 'Leadership Reflection', MARGIN + 18, y + 14, C.faint);
  writeText(doc, scriptText, MARGIN + 18, y + 28, {
    width: CONTENT_W - 36,
    size: 9.5,
    color: C.muted,
    lineGap: 2.4,
  });
  y += scriptH + 16;
  const finalReflectionH = measure(doc, finalReflectionText, CONTENT_W - 36, 9.4) + 38;
  panel(doc, MARGIN, y, CONTENT_W, finalReflectionH, '#0f1014', C.strokeSoft, 14);
  writeLabel(doc, 'Final Reflection', MARGIN + 18, y + 14, C.faint);
  writeText(doc, finalReflectionText, MARGIN + 18, y + 28, {
    width: CONTENT_W - 36,
    size: 9.4,
    color: C.soft,
    lineGap: 2.3,
  });
  y += finalReflectionH + 18;

  // Page 11
  y = pageHeader(doc, 11, 'Mission Control Dashboard', 'Operating rhythms and scorecards that keep your growth visible after the assessment.', y);
  const cadenceW = (CONTENT_W - 24) / 3;
  const cadenceGroups = [
    { label: 'Daily', items: dailyCadence },
    { label: 'Weekly', items: weeklyCadence },
    { label: 'Monthly', items: monthlyCadence },
  ];
  const cadenceH = Math.max(...cadenceGroups.map((group) => 42 + group.items.reduce((sum, item) => sum + measure(doc, item, cadenceW - 28, 8.5) + 6, 0)));
  cadenceGroups.forEach((group, index) => {
    const x = MARGIN + index * (cadenceW + 12);
    panel(doc, x, y, cadenceW, cadenceH, C.panel, C.stroke, 14);
    writeLabel(doc, group.label, x + 14, y + 14, C.green);
    drawBulletList(doc, group.items, x + 14, y + 28, cadenceW - 28, {
      bullet: '•',
      size: 8.5,
      color: C.soft,
      bulletColor: C.green,
      gap: 5,
    });
  });
  y += cadenceH + 16;

  const dashboardH = 178;
  const dashboardLeftW = CONTENT_W * 0.46;
  const dashboardRightW = CONTENT_W - dashboardLeftW - 14;
  panel(doc, MARGIN, y, dashboardLeftW, dashboardH, C.panel, C.stroke, 14);
  writeLabel(doc, 'Weekly KPIs', MARGIN + 16, y + 14, C.faint);
  let kpiY = y + 30;
  kpis.slice(0, 6).forEach((item, index) => {
    const color = [C.green, C.blue, C.amber, C.purple, C.green, C.blue][index % 6];
    const kpiScore = clamp(44 + (index * 11 % 46), 0, 100);
    writeText(doc, item, MARGIN + 16, kpiY, {
      width: dashboardLeftW - 120,
      size: 8,
      color: C.soft,
    });
    drawProgressBar(doc, MARGIN + dashboardLeftW - 88, kpiY + 4, 64, kpiScore, color, 5);
    writeText(doc, `${kpiScore}%`, MARGIN + dashboardLeftW - 20, kpiY, {
      width: 18,
      size: 7,
      color,
      align: 'right',
    });
    kpiY += 24;
  });
  panel(doc, MARGIN + dashboardLeftW + 14, y, dashboardRightW, dashboardH, C.panel, C.stroke, 14);
  writeLabel(doc, 'Momentum Index', MARGIN + dashboardLeftW + 30, y + 14, C.faint);
  drawKpiBarChart(doc, MARGIN + dashboardLeftW + 30, y + 34, dashboardRightW - 52, 92, competencies.map((item) => item.name));
  writeText(doc, 'Use this dashboard weekly. It turns growth from a motivational concept into an operating system.', MARGIN + dashboardLeftW + 30, y + 136, {
    width: dashboardRightW - 44,
    size: 8.5,
    color: C.soft,
    lineGap: 2,
  });
  y += dashboardH + 18;
  const indicatorColW = (CONTENT_W - 14) / 2;
  const leadingH = 42 + leadingIndicators.reduce((sum, item) => sum + measure(doc, item, indicatorColW - 28, 8.2) + 6, 0);
  const laggingH = 42 + laggingIndicators.reduce((sum, item) => sum + measure(doc, item, indicatorColW - 28, 8.2) + 6, 0);
  const indicatorsH = Math.max(leadingH, laggingH);
  panel(doc, MARGIN, y, indicatorColW, indicatorsH, '#0d100d', C.stroke, 14);
  panel(doc, MARGIN + indicatorColW + 14, y, indicatorColW, indicatorsH, '#101014', C.stroke, 14);
  writeLabel(doc, 'Leading Indicators', MARGIN + 16, y + 14, C.green);
  writeLabel(doc, 'Lagging Indicators', MARGIN + indicatorColW + 30, y + 14, C.blue);
  drawBulletList(doc, leadingIndicators, MARGIN + 16, y + 28, indicatorColW - 28, {
    bullet: '•',
    size: 8.2,
    color: C.soft,
    bulletColor: C.green,
    gap: 5,
  });
  drawBulletList(doc, laggingIndicators, MARGIN + indicatorColW + 30, y + 28, indicatorColW - 28, {
    bullet: '•',
    size: 8.2,
    color: C.soft,
    bulletColor: C.blue,
    gap: 5,
  });
  y += indicatorsH + 18;
  y = drawDivider(doc, y);

  // Page 12
  y = pageHeader(doc, 12, 'Stakeholder Influence Map & 7-Day Launch Sequence', 'Who to influence first and what to do in the first week to shift behaviour fast.', y);
  const stakeholderH = 42 + stakeholderPlay.reduce((sum, item) => sum + measure(doc, item, CONTENT_W - 36, 8.5) + 6, 0);
  panel(doc, MARGIN, y, CONTENT_W, stakeholderH, C.panel, C.stroke, 14);
  writeLabel(doc, 'Stakeholder Influence Map', MARGIN + 16, y + 14, C.green);
  drawBulletList(doc, stakeholderPlay, MARGIN + 16, y + 28, CONTENT_W - 32, {
    bullet: '→',
    size: 8.5,
    color: C.soft,
    bulletColor: C.accent,
    gap: 5,
  });
  y += stakeholderH + 16;

  const days = firstWeekPlan.slice(0, 7);
  const dayW = (CONTENT_W - 18) / 4;
  const topRowCount = Math.min(days.length, 4);
  for (let i = 0; i < topRowCount; i += 1) {
    const x = MARGIN + i * (dayW + 6);
    panel(doc, x, y, dayW, 98, '#0f0f12', C.strokeSoft, 12);
    doc.save().rect(x, y, dayW, 3).fill(C.green).restore();
    writeLabel(doc, `Day ${i + 1}`, x + 10, y + 10, C.green);
    writeText(doc, days[i], x + 10, y + 24, {
      width: dayW - 18,
      size: 7.5,
      color: C.soft,
      lineGap: 2,
    });
  }
  y += 108;
  const bottomRowCount = Math.max(0, days.length - 4);
  if (bottomRowCount > 0) {
    const bottomW = (CONTENT_W - (bottomRowCount - 1) * 6) / bottomRowCount;
    for (let i = 0; i < bottomRowCount; i += 1) {
      const x = MARGIN + i * (bottomW + 6);
      panel(doc, x, y, bottomW, 96, '#0f0f12', C.strokeSoft, 12);
      doc.save().rect(x, y, bottomW, 3).fill(C.blue).restore();
      writeLabel(doc, `Day ${i + 5}`, x + 10, y + 10, C.blue);
      writeText(doc, days[i + 4], x + 10, y + 24, {
        width: bottomW - 18,
        size: 7.5,
        color: C.soft,
        lineGap: 2,
      });
    }
    y += 106;
  }
  y += 10;
  y = drawDivider(doc, y);

  // Page 13
  y = pageHeader(doc, 13, 'Leadership Signals to Watch', 'The behavioural evidence that tells you this report is becoming reality.', y);
  const signalCards = [
    {
      title: 'Respect Signal 01',
      body: 'Your team asks better questions instead of waiting for direct answers because ownership is becoming clearer.',
    },
    {
      title: 'Respect Signal 02',
      body: 'Stakeholders describe your updates as strategic, not just operational.',
    },
    {
      title: 'Respect Signal 03',
      body: 'You spend less time rescuing projects and more time improving the system around them.',
    },
    {
      title: 'Respect Signal 04',
      body: 'You can step out of the work for a day and momentum does not collapse.',
    },
  ];
  const signalW = (CONTENT_W - 12) / 2;
  signalCards.forEach((item, index) => {
    const x = MARGIN + (index % 2) * (signalW + 12);
    const cardY = y + Math.floor(index / 2) * 98;
    panel(doc, x, cardY, signalW, 86, C.panel, C.stroke, 14);
    writeLabel(doc, item.title, x + 14, cardY + 14, index % 2 === 0 ? C.green : C.blue);
    writeText(doc, item.body, x + 14, cardY + 28, {
      width: signalW - 28,
      size: 8.5,
      color: C.soft,
      lineGap: 2.2,
    });
  });
  y += 204;

  const finalPrompt = 'Use this report as an operating document, not a one-time read. Revisit it weekly, score your behaviour honestly, and update the system around you until leverage becomes the default.';
  const finalPromptH = measure(doc, finalPrompt, CONTENT_W - 36, 10) + 38;
  panel(doc, MARGIN, y, CONTENT_W, finalPromptH, '#0c140c', '#86efac44', 14);
  writeLabel(doc, 'Final Prompt', MARGIN + 18, y + 14, C.green);
  writeText(doc, finalPrompt, MARGIN + 18, y + 28, {
    width: CONTENT_W - 36,
    size: 10,
    color: C.green,
    font: 'Helvetica-Bold',
    lineGap: 2.4,
  });
  y += finalPromptH + 18;

  const outcomeH = measure(doc, outcomeText, CONTENT_W - 36, 9.5) + 40;
  panel(doc, MARGIN, y, CONTENT_W, outcomeH, C.panel, C.stroke, 14);
  writeLabel(doc, 'Projected 90-Day Outcome', MARGIN + 18, y + 14, C.faint);
  writeText(doc, outcomeText, MARGIN + 18, y + 28, {
    width: CONTENT_W - 36,
    size: 9.5,
    color: C.muted,
    lineGap: 2.4,
  });
  y += outcomeH + 24;

  // Page 14
  y = pageHeader(doc, 14, 'Risk Register & Mitigation Plan', 'The likely failure modes that could slow your progression and how to counter them early.', y);
  const riskHeights = riskRegister.map((item) => 56 + measure(doc, safeText(item.risk), CONTENT_W - 112, 8.8) + measure(doc, safeText(item.mitigation), CONTENT_W - 112, 8.4) + 6);
  riskRegister.forEach((item, index) => {
    const riskH = riskHeights[index];
    const impactColor = item.impact === 'High' ? C.red : item.impact === 'Low' ? C.blue : C.amber;
    panel(doc, MARGIN, y, CONTENT_W, riskH, C.panel, C.stroke, 14);
    panel(doc, MARGIN + 14, y + 14, 58, 28, '#101014', impactColor, 10);
    writeLabel(doc, item.impact || 'Medium', MARGIN + 27, y + 22, impactColor);
    writeLabel(doc, `Owner: ${safeText(item.owner, 'You')}`, PAGE_W - MARGIN - 108, y + 18, C.faint);
    writeText(doc, safeText(item.risk), MARGIN + 86, y + 16, {
      width: CONTENT_W - 100,
      size: 8.8,
      font: 'Helvetica-Bold',
      color: C.text,
      lineGap: 2,
    });
    writeLabel(doc, 'Mitigation', MARGIN + 86, y + 36, C.green);
    writeText(doc, safeText(item.mitigation), MARGIN + 86, y + 48, {
      width: CONTENT_W - 100,
      size: 8.4,
      color: C.soft,
      lineGap: 2,
    });
    y += riskH + 12;
  });
  y = drawDivider(doc, y);

  // Page 15
  y = pageHeader(doc, 15, 'Talent Leverage Plan', 'Where to accelerate, stabilize, and delegate so your role grows through people rather than around them.', y);
  const talentColW = (CONTENT_W - 24) / 3;
  const talentCols = [
    { label: 'Accelerate', items: accelerateItems, color: C.green, fill: '#0d100d' },
    { label: 'Stabilize', items: stabilizeItems, color: C.amber, fill: '#13110b' },
    { label: 'Delegate', items: delegateItems, color: C.blue, fill: '#101014' },
  ];
  const talentH = Math.max(...talentCols.map((col) => 42 + col.items.reduce((sum, item) => sum + measure(doc, item, talentColW - 28, 8.2) + 6, 0)));
  talentCols.forEach((col, index) => {
    const x = MARGIN + index * (talentColW + 12);
    panel(doc, x, y, talentColW, talentH, col.fill, C.stroke, 14);
    writeLabel(doc, col.label, x + 14, y + 14, col.color);
    drawBulletList(doc, col.items, x + 14, y + 28, talentColW - 28, {
      bullet: '•',
      size: 8.2,
      color: C.soft,
      bulletColor: col.color,
      gap: 5,
    });
  });
  y += talentH + 18;
  y = drawDivider(doc, y);

  // Page 16
  y = pageHeader(doc, 16, 'Meeting Blueprints', 'Meeting structures that reinforce leverage, alignment, and strategic visibility.', y);
  const meetingCards = [
    {
      label: 'Team',
      color: C.green,
      purpose: safeText(meetingBlueprint.team?.purpose, 'Create clarity on ownership, priorities, and blockers without turning the meeting into a status recital.'),
      cadence: safeText(meetingBlueprint.team?.cadence, 'Weekly'),
      agenda: safeArray(meetingBlueprint.team?.agenda, ['Review top priorities and ownership shifts', 'Surface blockers and decision needs', 'Coach one capability that matters this week', 'Confirm next actions and owners']),
    },
    {
      label: 'Leadership',
      color: C.blue,
      purpose: safeText(meetingBlueprint.leadership?.purpose, 'Translate team progress into strategic signal, resourcing needs, and business impact for leaders above you.'),
      cadence: safeText(meetingBlueprint.leadership?.cadence, 'Bi-weekly'),
      agenda: safeArray(meetingBlueprint.leadership?.agenda, ['Context: what shifted and why it matters', 'Decisions made and trade-offs taken', 'Risks, support needed, and business impact', 'Forward view for the next 2-4 weeks']),
    },
    {
      label: 'Stakeholder',
      color: C.purple,
      purpose: safeText(meetingBlueprint.stakeholder?.purpose, 'Preserve alignment, reduce surprises, and maintain trust across functions that influence your team’s outcomes.'),
      cadence: safeText(meetingBlueprint.stakeholder?.cadence, 'Monthly'),
      agenda: safeArray(meetingBlueprint.stakeholder?.agenda, ['Review shared priorities and dependencies', 'Clarify ownership across boundaries', 'Resolve one emerging friction point', 'Align on next actions and communication rhythm']),
    },
  ];
  meetingCards.forEach((card) => {
    const cardH = 64 + measure(doc, card.purpose, CONTENT_W - 42, 8.5) + card.agenda.reduce((sum, item) => sum + measure(doc, item, CONTENT_W - 54, 8.2) + 4, 0);
    panel(doc, MARGIN, y, CONTENT_W, cardH, C.panel, C.stroke, 14);
    writeLabel(doc, `${card.label} Meeting`, MARGIN + 18, y + 14, card.color);
    writeText(doc, `Cadence: ${card.cadence}`, PAGE_W - MARGIN - 120, y + 14, {
      width: 102,
      size: 8,
      color: C.soft,
      align: 'right',
    });
    const purposeEnd = writeText(doc, card.purpose, MARGIN + 18, y + 28, {
      width: CONTENT_W - 36,
      size: 8.5,
      color: C.soft,
      lineGap: 2,
    });
    writeLabel(doc, 'Agenda', MARGIN + 18, purposeEnd + 4, card.color);
    drawBulletList(doc, card.agenda, MARGIN + 18, purposeEnd + 16, CONTENT_W - 36, {
      bullet: '•',
      size: 8.2,
      color: C.muted,
      bulletColor: card.color,
      gap: 4,
    });
    y += cardH + 12;
  });

  doc.save().rect(MARGIN, y, CONTENT_W, 0.75).fill(C.stroke).restore();
  y += 10;
  doc.font('Helvetica').fontSize(7.5).fillColor(C.faint).text(`CAREERA · Leadership Growth Report · ${assessmentDate} · Confidential`, MARGIN, y, {
    width: CONTENT_W,
    align: 'center',
    lineBreak: false,
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
