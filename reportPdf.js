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

function blockHeader(doc, label, y, accent = C.faint) {
  writeLabel(doc, label, MARGIN, y, accent);
  return y + 14;
}

function accentQuote(doc, text, y) {
  const h = measure(doc, text, CONTENT_W - 40, 11.5, 'Helvetica-Bold') + 44;
  rPanel(doc, MARGIN, y, CONTENT_W, h, '#0c1410', '#86efac44', 14);
  doc.save().rect(MARGIN, y, 3, h).fill(C.green).restore();
  writeLabel(doc, 'Key Insight', MARGIN + 16, y + 12, C.green);
  writeText(doc, `"${text}"`, MARGIN + 16, y + 26, {
    width: CONTENT_W - 32, size: 11.5, font: 'Helvetica-Bold', color: C.green, lineGap: 2,
  });
  return y + h + 16;
}

function infoPanel(doc, label, body, y, accent = C.stroke) {
  const h = measure(doc, body, CONTENT_W - 40, 9.5) + 50;
  rPanel(doc, MARGIN, y, CONTENT_W, h, C.panel, accent, 12);
  writeLabel(doc, label, MARGIN + 18, y + 14, C.faint);
  writeText(doc, body, MARGIN + 18, y + 28, { width: CONTENT_W - 36, size: 9.5, color: C.muted, lineGap: 2.5 });
  return y + h + 14;
}

function scoreChip(doc, label, value, color, x, y, w) {
  rPanel(doc, x, y, w, 52, '#0f0f12', C.strokeSoft, 10);
  writeLabel(doc, label, x + 12, y + 10);
  doc.font('Helvetica-Bold').fontSize(20).fillColor(color)
     .text(String(value), x + 12, y + 24, { width: w - 24, lineBreak: false });
}

// ─── Main render ──────────────────────────────────────────────────────────────
function renderContent(doc, analysis) {

  // ── Data setup ──────────────────────────────────────────────────────────────
  const defaultComps = [
    { name: 'Strategic Thinking',       score: 72, level: 'Developing', deepDive: 'You can identify the next move clearly, but the 6–12 month horizon needs deliberate airtime in your calendar and communication.' },
    { name: 'Delegation & Empowerment', score: 65, level: 'Emerging',   deepDive: 'You delegate tasks, but outcome ownership still tends to flow back toward you under pressure or when stakes rise.' },
    { name: 'Coaching & Feedback',      score: 81, level: 'Strong',     deepDive: 'You set standards well and develop others when you stay in coaching mode rather than defaulting to solving mode.' },
    { name: 'Influence & Stakeholders', score: 68, level: 'Developing', deepDive: 'You are credible operationally, but senior alignment improves significantly when you lead with business context and strategic framing.' },
    { name: 'Execution & Accountability', score: 89, level: 'Advanced', deepDive: 'Execution is the strongest trust signal in your profile. People rely on you because outcomes consistently move when you are involved.' },
    { name: 'Emotional Intelligence',   score: 76, level: 'Strong',     deepDive: 'You read teams well and create stability under pressure. The next upgrade is using that awareness more intentionally in high-stakes conversations.' },
  ];

  const comps     = safeArray(analysis.competencies, defaultComps).slice(0, 6);
  const sorted    = [...comps].sort((a, b) => b.score - a.score);
  const strongest = sorted[0] || defaultComps[4];
  const weakest   = sorted[sorted.length - 1] || defaultComps[1];
  const sw2       = sorted[sorted.length - 2] || defaultComps[0];

  const delComp  = comps.find(c => /deleg|empower|team/i.test(c.name)) || weakest;
  const stratComp= comps.find(c => /strateg/i.test(c.name)) || sw2;
  const infComp  = comps.find(c => /influ|stakeholder/i.test(c.name)) || sw2;

  const growthAreas = safeArray(analysis.topGrowthAreas, [
    { title: 'Delegation Depth', description: 'You delegate tasks, but not always the ownership of outcomes. The next step is transferring the result, not just the work.', actionSteps: ['Move from "Here is what to do" → "Here is the result we must own."', 'Define decision rights before handoff, not after escalation.', 'Review outcomes without reclaiming the task.'] },
    { title: 'Strategic Communication', description: 'Your communication is precise but operational. Senior leadership responds better to narrative framing tied to business context and future consequence.', actionSteps: ['Use Vision → Context → Action → Impact structure.', 'Lead updates with why it matters, not what happened.', 'Translate delivery progress into enterprise-level consequence.'] },
    { title: 'Scaling Systems Thinking', description: 'You optimise inside your team effectively. The next leap is designing feedback loops that improve work across teams, not just within your unit.', actionSteps: ['Identify one recurring friction point that crosses team boundaries.', 'Replace heroic interventions with a repeatable mechanism.', 'Document and share the process so others can run it without you.'] },
  ]).slice(0, 3);

  const blindSpots    = safeArray(analysis.blindSpots, ['May default to doing instead of designing.', 'High standards can inadvertently limit team autonomy.', 'Strategic storytelling may be underutilised with senior stakeholders.']);
  const strengths     = safeArray(analysis.strengthLevers, ['Drives results through disciplined structure.', 'Sets and maintains clear performance expectations.', 'Comfortable owning difficult accountability conversations.', 'Strong KPI and metrics-oriented leadership mindset.']);
  const roadmap       = analysis.roadmap || {};
  const roadmapCards  = [roadmap.month1, roadmap.month2, roadmap.month3].filter(Boolean).length
    ? [roadmap.month1, roadmap.month2, roadmap.month3].filter(Boolean)
    : [
        { theme: 'Foundation', title: 'Shift from Doer to Designer', actions: ['Audit all tasks where you are the single point of execution.', 'Redesign 1:1 structure toward coaching conversations.', 'Create 3 team-level ownership KPIs with clear owners.', 'Map every stakeholder relationship and their current expectation of you.'] },
        { theme: 'Influence', title: 'Strengthen Strategic Presence', actions: ['Practice executive narrative framing on every major update.', 'Align all quarterly goals explicitly to business outcomes.', 'Run 2 proactive stakeholder alignment conversations this month.', 'Delegate one full process end-to-end, including the decision rights.'] },
        { theme: 'Scale', title: 'Multiply and Embed', actions: ['Create a successor capability plan for your most dependable team member.', 'Build a scalable performance management system the team can own.', 'Document your leadership philosophy in a one-page operating guide.', 'Conduct a 90-day retrospective with the team on ownership and autonomy.'] },
      ];

  const stakPlay    = safeArray(analysis.stakeholderPlaybook, [
    'Your manager: send a concise weekly three-point update focused on business impact and forward risk.',
    'Peers: run one informal alignment session per month before priorities drift into conflict.',
    'Your team: coach for ownership first, inspect outcomes rather than activity or method.',
    'Senior stakeholders: frame all communications around risk reduction, velocity, and revenue relevance.',
    'Skip-level leaders: build visibility through quarterly insight updates on team capability trends.',
  ]);
  const sprint      = safeArray(analysis.firstWeekPlan, [
    'Audit every recurring responsibility that currently depends on your personal involvement.',
    'Convert your next team 1:1 into a development coaching conversation, not a status review.',
    'Write and send one strategic narrative update to your manager using the Vision → Impact structure.',
    'Name one decision that a team member can and should own this week without escalation.',
    'Map your top 3 stakeholders and write down their current expectations of your role.',
    'Block a 30-minute Friday reflection slot to review leverage created versus effort spent.',
    'Share your 90-day growth intent with your team and invite their input and accountability.',
  ]);
  const kpis        = safeArray(analysis.kpis, [
    'Delegation ratio: work owned by team vs. self (%)',
    'Team decisions made without escalation (count)',
    'Proactive stakeholder updates sent (weekly)',
    'Cross-functional friction points actively resolved',
    'Development conversations completed per month',
    'Strategic priorities visibly advanced this quarter',
  ]);
  const dailyCad    = safeArray(analysis.operatingCadence?.daily,   ['15-minute priorities and blockers check', 'One coaching touchpoint with a team member', 'Clear at least one team blocker without solving it yourself']);
  const weeklyCad   = safeArray(analysis.operatingCadence?.weekly,  ['Team sync with ownership review not status check', 'Stakeholder narrative update focusing on business impact', 'Leadership reflection: what did I own that the team should own?']);
  const monthlyCad  = safeArray(analysis.operatingCadence?.monthly, ['Strategic direction calibration with your manager', 'Cross-functional alignment session', 'Operating system redesign review: what broke, what scaled?']);
  const iWins       = safeArray(analysis.decisionMatrix?.immediateWins, ['Reshape 1:1 agendas toward development', 'Delegate one recurring operational process', 'Sharpen weekly stakeholder updates', 'Clarify team decision ownership rights']);
  const sBets       = safeArray(analysis.decisionMatrix?.strategicBets, ['Build full delegation framework', 'Upgrade cross-functional influence', 'Design successor development pathway', 'Create cross-team operating leverage loop']);

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
  const commScript  = safeText(analysis.communicationScript, 'This quarter I am deliberately shifting from direct execution toward scalable leadership leverage. My focus areas are delegation depth, sharper strategic framing, and more intentional cross-functional alignment — so the team can deliver with more autonomy and senior stakeholders experience me as more strategic and forward-looking.');
  const outcome90   = safeText(analysis.ninetyDayOutcome, 'If you execute this plan consistently, your role will shift from dependable operator to respected force multiplier. Your team will rely less on your constant involvement and will make better decisions independently. Senior stakeholders will experience you as more strategic, more influential, and fundamentally more scalable as a leader.');

  const stageStr = stageFull.toLowerCase();
  let curStep = 3;
  if (stageStr.includes('individual'))                              curStep = 1;
  else if (stageStr.includes('new manager'))                        curStep = 2;
  else if (stageStr.includes('scaling'))                            curStep = 3;
  else if (stageStr.includes('strategic') || stageStr.includes('senior')) curStep = 4;
  else if (stageStr.includes('executive') || stageStr.includes('vp') || stageStr.includes('director')) curStep = 5;

  const stageCards = [
    { name: 'Individual Contributor', shift: 'Prove personal capability and build delivery credibility through consistent results.' },
    { name: 'New Manager',            shift: 'Move from doing the work to directing and enabling others to do the work.' },
    { name: 'Scaling Manager',        shift: 'Create repeatability, coaching systems, and operating models that multiply team output.' },
    { name: 'Strategic Leader',       shift: 'Shape organisational direction and influence outcomes across functions without direct authority.' },
    { name: 'Executive Leader',       shift: 'Allocate attention, capital, and leadership energy at enterprise level to drive compound returns.' },
  ];

  const benchItems = comps.map((c, i) => ({
    name: c.name, youScore: c.score, peerScore: peerAvg(c.score, i),
    youLabel: benchBand(c.score), peerLabel: benchBand(peerAvg(c.score, i)),
  }));

  let y = 40;

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 1 — COVER
  // ════════════════════════════════════════════════════════════════════════════
  const coverH = 400;
  rPanel(doc, MARGIN, y, CONTENT_W, coverH, C.panelAlt, C.stroke, 22);
  doc.save().circle(PAGE_W - MARGIN - 102, y + 130, 98).fillOpacity(0.032).fill(C.green).restore();
  doc.save().circle(MARGIN + 80, y + 72, 48).fillOpacity(0.022).fill(C.blue).restore();
  doc.save().circle(MARGIN + 40, y + coverH - 60, 30).fillOpacity(0.018).fill(C.purple).restore();
  writeLabel(doc, 'CAREERA · LEADERSHIP INTELLIGENCE PLATFORM', MARGIN + 24, y + 22, C.faint);
  doc.save().rect(MARGIN + 24, y + 32, 32, 1).fill(C.green).restore();
  writeText(doc, 'From Manager\nto Respected Leader', MARGIN + 24, y + 46, { width: CONTENT_W * 0.58, size: 30, font: 'Helvetica-Bold', color: C.text, lineGap: 1 });
  writeText(doc, 'Your Personalised Leadership Growth Report', MARGIN + 24, y + 126, { width: CONTENT_W * 0.58, size: 11, color: C.soft });
  const coverMeta = [
    { label: 'For', value: personName },
    { label: 'Assessment Date', value: date },
    { label: 'Leadership Stage', value: stageFull },
  ];
  let coverMetaY = y + 166;
  for (const { label, value } of coverMeta) {
    writeLabel(doc, label, MARGIN + 24, coverMetaY, C.faint);
    writeText(doc, value, MARGIN + 24, coverMetaY + 12, { width: CONTENT_W * 0.56, size: 10, font: 'Helvetica-Bold', color: C.muted });
    coverMetaY += 32;
  }
  const insightH = measure(doc, `"${keyInsight}"`, CONTENT_W * 0.46 - 32, 10.5, 'Helvetica-Bold') + 32;
  rPanel(doc, MARGIN + 24, y + 264, CONTENT_W * 0.46, insightH, '#0c140c', '#86efac44', 14);
  writeLabel(doc, 'Mission Brief', MARGIN + 40, y + 278, C.green);
  writeText(doc, `"${keyInsight}"`, MARGIN + 40, y + 292, { width: CONTENT_W * 0.46 - 32, size: 10.5, font: 'Helvetica-Bold', color: C.green, lineGap: 2 });
  drawOrbitalCluster(doc, PAGE_W - MARGIN - 106, y + 132, 1);
  drawArcGauge(doc, PAGE_W - MARGIN - 106, y + 132, 44, score, C.green, 7);
  doc.font('Helvetica-Bold').fontSize(26).fillColor(C.text)
     .text(String(score), PAGE_W - MARGIN - 130, y + 118, { width: 48, align: 'center', lineBreak: false });
  doc.font('Helvetica').fontSize(9).fillColor(C.soft)
     .text('/100', PAGE_W - MARGIN - 126, y + 148, { width: 40, align: 'center', lineBreak: false });
  writeLabel(doc, 'Readiness Score', PAGE_W - MARGIN - 144, y + 188, C.faint);
  const cmY = y + coverH - 56;
  const cmW = (CONTENT_W - 36) / 3;
  for (const [idx, { label, value }] of [
    { label: 'Current Stage', value: shortStage(stageFull) },
    { label: 'Growth Target', value: nextStage(stageFull) },
    { label: 'Archetype', value: archName },
  ].entries()) {
    const cx = MARGIN + 18 + idx * (cmW + 9);
    rPanel(doc, cx, cmY, cmW, 36, '#0e0e11', C.strokeSoft, 10);
    writeLabel(doc, label, cx + 10, cmY + 8);
    writeText(doc, value, cx + 10, cmY + 20, { width: cmW - 18, size: 8.5, font: 'Helvetica-Bold', color: C.text });
  }
  y += coverH + 30;

  // TOC strip
  rPanel(doc, MARGIN, y, CONTENT_W, 48, '#101014', C.strokeSoft, 10);
  const tocItems = ['Executive Summary', 'Competency Profile', 'Archetype', 'Growth Gaps', 'Roadmap', 'Benchmark', 'Evolution Path', 'Dashboard', 'Habits Blueprint', 'Final Reflection'];
  const tocW = CONTENT_W / tocItems.length;
  writeLabel(doc, 'Report Contents', MARGIN + 14, y + 10, C.faint);
  tocItems.forEach((item, i) => {
    doc.font('Helvetica').fontSize(6.5).fillColor(C.faint)
       .text(`${i + 1}. ${item}`, MARGIN + 14 + i * tocW, y + 26, { width: tocW - 4, lineBreak: false });
  });
  y += 66;

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 2 — EXECUTIVE SUMMARY
  // ════════════════════════════════════════════════════════════════════════════
  y = drawDivider(doc, y);
  y = pageHeader(doc, 2, 'Executive Summary', 'A comprehensive reading of your leadership readiness, core strengths, and immediate leverage points.', y);

  // Score + snapshot side by side
  const lw2 = 180, rw2 = CONTENT_W - lw2 - 14;
  const snapH = Math.max(180, 60 + comps.length * 26 + 30);
  rPanel(doc, MARGIN, y, lw2, snapH, C.panel, C.stroke, 16);
  drawArcGauge(doc, MARGIN + lw2 / 2, y + 74, 36, score, C.green, 7);
  doc.font('Helvetica-Bold').fontSize(28).fillColor(C.text)
     .text(String(score), MARGIN + lw2 / 2 - 26, y + 60, { width: 52, align: 'center', lineBreak: false });
  doc.font('Helvetica').fontSize(9).fillColor(C.soft)
     .text('/100', MARGIN + lw2 / 2 - 20, y + 92, { width: 40, align: 'center', lineBreak: false });
  writeLabel(doc, 'Leadership Readiness', MARGIN + 14, y + 122, C.green);
  const levelLabel = score >= 85 ? 'High Readiness' : score >= 70 ? 'Solid Readiness' : score >= 55 ? 'Developing' : 'Emerging';
  writeText(doc, levelLabel, MARGIN + 14, y + 136, { width: lw2 - 28, size: 12, font: 'Helvetica-Bold', color: C.text });
  writeText(doc, `Stage: ${shortStage(stageFull)}`, MARGIN + 14, y + 152, { width: lw2 - 28, size: 9, color: C.soft });

  rPanel(doc, MARGIN + lw2 + 14, y, rw2, snapH, C.panel, C.stroke, 16);
  writeLabel(doc, 'Snapshot Overview', MARGIN + lw2 + 30, y + 14, C.faint);
  let sny = y + 30;
  const snapItems = [
    { icon: '✓', text: 'Strong operational leadership and delivery track record', good: true },
    { icon: '✓', text: 'High accountability and performance orientation across the team', good: true },
    { icon: '◦', text: `${delComp.name}: delegation of outcomes, not just tasks, requires focus`, good: false },
    { icon: '◦', text: `${infComp.name}: strategic influence with senior stakeholders can deepen`, good: false },
  ];
  for (const { icon, text, good } of snapItems) {
    const color = good ? C.green : C.amber;
    doc.font('Helvetica-Bold').fontSize(9).fillColor(color).text(icon, MARGIN + lw2 + 30, sny + 1, { lineBreak: false });
    sny = writeText(doc, text, MARGIN + lw2 + 46, sny, { width: rw2 - 58, size: 8.5, color: C.muted, lineGap: 1.5 }) + 8;
  }
  y += snapH + 16;

  // 3 stat cards
  const sw3 = (CONTENT_W - 24) / 3;
  for (const [i, { label, value, sub }] of [
    { label: 'Leadership Score',   value: String(score),              sub: '/ 100 overall' },
    { label: 'Top Dimension',      value: strongest.name.split(' ')[0], sub: `${strongest.score}/100 · ${strongest.level}` },
    { label: 'Growth Priority',    value: weakest.name.split(' ')[0],  sub: `${weakest.score}/100 · ${weakest.level}` },
  ].entries()) {
    const x = MARGIN + i * (sw3 + 12);
    rPanel(doc, x, y, sw3, 74, '#0f0f12', C.stroke, 12);
    writeLabel(doc, label, x + 14, y + 12);
    doc.font('Helvetica-Bold').fontSize(i === 0 ? 26 : 18).fillColor(i === 0 ? C.green : C.text)
       .text(value, x + 14, y + 26, { width: sw3 - 28, lineBreak: false });
    writeText(doc, sub, x + 14, y + 56, { width: sw3 - 28, size: 8, color: C.soft });
  }
  y += 92;

  y = infoPanel(doc, 'Assessment Context', summary, y);
  y = accentQuote(doc, keyInsight, y);

  // Longer narrative section
  const narrativeBlocks = [
    {
      label: 'What This Score Means',
      text: `A score of ${score}/100 places you in the ${benchBand(score).toLowerCase()} performance tier when measured against leaders at a comparable stage of scope and complexity. This assessment evaluates six evidence-based leadership dimensions that are consistently predictive of effective leadership at the transition point between operational management and strategic leadership. Your profile shows clear asymmetry between your execution capability and your strategic leverage capacity — which is both normal and fixable at this stage.`,
    },
    {
      label: 'Where You Are Creating Value',
      text: `Your most consistent value-creation mechanism is ${strongest.name}: reliable, predictable delivery that builds trust with teams and stakeholders. People know what to expect from you and you rarely create negative surprises. That reliability is the foundation that allows everything else to be built. However, it also creates a gravitational pull that keeps you executing instead of designing.`,
    },
    {
      label: 'Where Your Leadership Ceiling Sits',
      text: `The ceiling in your current profile is ${delComp.name}. At ${delComp.score}/100, you are delegating tasks but retaining outcome ownership. This is the most common transition gap at the scaling manager level. When the leader owns the outcome, the team learns to execute. When the team owns the outcome, the leader learns to coach, and the organisation learns to scale. The next chapter of your leadership is about that transfer.`,
    },
  ];
  for (const { label, text } of narrativeBlocks) {
    y = infoPanel(doc, label, text, y);
  }

  y = drawDivider(doc, y);

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 3 — COMPETENCY BREAKDOWN
  // ════════════════════════════════════════════════════════════════════════════
  y = pageHeader(doc, 3, 'Leadership Competency Profile', 'Six dimensions measured against an evidence-based model for leaders at your stage of complexity and scope.', y);

  // Radar + score bars side by side
  const rpW = CONTENT_W * 0.46, rbW = CONTENT_W - rpW - 14, rpH = 264;
  rPanel(doc, MARGIN, y, rpW, rpH, C.panel, C.stroke, 16);
  writeLabel(doc, 'Radar View', MARGIN + 14, y + 14, C.faint);
  if (comps.length >= 3) drawRadarChart(doc, MARGIN + rpW / 2, y + 138, 90, comps);
  rPanel(doc, MARGIN + rpW + 14, y, rbW, rpH, C.panel, C.stroke, 16);
  writeLabel(doc, 'Dimension Scores', MARGIN + rpW + 30, y + 14, C.faint);
  let sbY = y + 30;
  for (const comp of comps) {
    const color = levelColor(comp.level);
    writeText(doc, comp.name, MARGIN + rpW + 30, sbY, { width: rbW - 80, size: 8.5, font: 'Helvetica-Bold', color: C.text });
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(color)
       .text(`${comp.score}`, MARGIN + rpW + rbW - 44, sbY, { width: 32, align: 'right', lineBreak: false });
    sbY += 13;
    drawProgressBar(doc, MARGIN + rpW + 30, sbY, rbW - 50, comp.score, color, 5);
    sbY += 9;
    writeText(doc, comp.level, MARGIN + rpW + 30, sbY, { width: rbW - 60, size: 7, color: C.faint });
    sbY += 14;
  }
  y += rpH + 14;

  // Highest leverage callout
  const glH = 54;
  rPanel(doc, MARGIN, y, CONTENT_W, glH, '#0c140c', '#86efac44', 14);
  writeLabel(doc, 'Highest Leverage Growth Area', MARGIN + 18, y + 12, C.green);
  writeText(doc, `${delComp.name} + ${stratComp.name}`, MARGIN + 18, y + 26, { width: CONTENT_W - 36, size: 12, font: 'Helvetica-Bold', color: C.green });
  y += glH + 14;

  // 2×3 gauge grid
  const gcW = (CONTENT_W - 20) / 3, gcH = 90;
  for (let i = 0; i < comps.length; i++) {
    const col = i % 3, row = Math.floor(i / 3);
    const gx = MARGIN + col * (gcW + 10), gy = y + row * (gcH + 10);
    const comp = comps[i], color = levelColor(comp.level);
    rPanel(doc, gx, gy, gcW, gcH, '#0f0f12', C.strokeSoft, 12);
    drawArcGauge(doc, gx + 32, gy + 44, 20, comp.score, color, 4);
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(C.text)
       .text(String(comp.score), gx + 22, gy + 38, { width: 20, align: 'center', lineBreak: false });
    writeText(doc, comp.name, gx + 62, gy + 16, { width: gcW - 72, size: 8, font: 'Helvetica-Bold', color: C.text });
    writeText(doc, comp.level, gx + 62, gy + 34, { width: gcW - 72, size: 7.5, color });
    writeText(doc, `Gap: ${gapToAdvanced(comp.score)}pts`, gx + 62, gy + 48, { width: gcW - 72, size: 7, color: C.faint });
    drawProgressBar(doc, gx + 62, gy + 62, gcW - 74, comp.score, color, 4);
    const peer = peerAvg(comp.score, i);
    doc.save().rect(gx + 62 + (peer / 100) * (gcW - 74), gy + 60, 1, 8).fill('#ffffff44').restore();
  }
  y += Math.ceil(comps.length / 3) * (gcH + 10) + 10;
  y = drawDivider(doc, y);

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 4 — COMPETENCY DEEP DIVES (one detailed card per dimension)
  // ════════════════════════════════════════════════════════════════════════════
  y = pageHeader(doc, 4, 'Competency Intelligence', 'Detailed reading of each dimension: what the score means, how it shows up in practice, and what to do next.', y);

  for (const comp of comps) {
    const color   = levelColor(comp.level);
    const deepTxt = safeText(comp.deepDive) || `At the ${comp.level} level, this capability is present but not yet consistently applied under sustained pressure or at scale. There is meaningful headroom available.`;
    const interp  = scoreInterpretation(comp.score);
    const gap     = gapToAdvanced(comp.score);
    const actions = comp.score >= 80
      ? ['Use this dimension as an active coaching asset — teach others how you do it.', 'Create visible cross-functional impact by bringing this strength into adjacent teams.', 'Document your approach so it becomes a repeatable team capability, not a personal one.']
      : comp.score >= 65
      ? ['Design one repeatable weekly practice specifically targeting this dimension.', 'Request targeted developmental feedback after the next relevant high-stakes situation.', 'Pair with a peer or mentor who has advanced competence here and study their approach.']
      : ['Identify a single upcoming situation this week to practice this deliberately.', 'Find one peer who excels here and spend one hour observing how they think and operate.', 'Create a monthly reflection prompt specifically for this dimension to build pattern awareness.'];
    const watchFor = comp.score >= 80
      ? 'Others asking you to coach them in this area — that is the signal it has become leadership capital.'
      : comp.score >= 65
      ? 'When team members start referencing your approach in this area — it is beginning to land.'
      : 'When you catch yourself reverting to old defaults under pressure — that is where the real practice happens.';

    const bodyH = measure(doc, deepTxt, CONTENT_W - 78, 9, 'Helvetica') + measure(doc, interp, CONTENT_W - 78, 8.5) + actions.length * 22 + 64;
    rPanel(doc, MARGIN, y, CONTENT_W, bodyH, '#0d0d10', C.stroke, 12);
    doc.save().rect(MARGIN, y, 3, bodyH).fill(color).restore();

    const mCx = MARGIN + 30, mCy = y + bodyH / 2;
    drawArcGauge(doc, mCx, mCy, 20, comp.score, color, 4);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(C.text)
       .text(String(comp.score), mCx - 10, mCy - 7, { width: 20, align: 'center', lineBreak: false });

    const tx = MARGIN + 62, tw = CONTENT_W - 76;
    writeText(doc, comp.name, tx, y + 12, { width: tw, size: 11, font: 'Helvetica-Bold', color: C.text });
    writeText(doc, `${comp.level} · Gap to Advanced: ${gap}pts`, tx, y + 28, { width: 240, size: 8, color });

    let cY = writeText(doc, deepTxt, tx, y + 44, { width: tw, size: 9, color: C.soft, lineGap: 2 }) + 6;
    writeLabel(doc, 'Score interpretation', tx, cY, C.faint);
    cY = writeText(doc, interp, tx, cY + 12, { width: tw, size: 8.5, color: C.muted, lineGap: 2 }) + 8;
    writeLabel(doc, 'Next actions', tx, cY, C.green);
    cY = drawBulletList(doc, actions, tx, cY + 12, tw, { bullet: '→', size: 8.5, color: C.muted, bulletColor: C.green, gap: 4 });
    writeLabel(doc, 'Watch for this signal', tx, cY, C.faint);
    writeText(doc, watchFor, tx, cY + 12, { width: tw, size: 8.5, color: C.soft, lineGap: 1.5 });

    y += bodyH + 12;
  }
  y = drawDivider(doc, y + 6);

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 5 — ARCHETYPE
  // ════════════════════════════════════════════════════════════════════════════
  y = pageHeader(doc, 5, 'Your Leadership Archetype', `${archName} — your dominant leadership pattern and how it shapes everything from culture to decisions.`, y);

  const traitsList = safeArray(analysis.archetype?.traits, ['Structure builder', 'Execution-led accountability', 'High performance standards', 'KPI and metrics orientation', 'Strong delivery reliability']);
  y = drawChipRow(doc, traitsList, MARGIN, y, CONTENT_W);
  y += 8;

  y = infoPanel(doc, 'Archetype Description', archDesc, y);

  const archContextText = `The ${archName} archetype is one of the most common profiles among managers who get promoted based on delivery performance. You earned your position by being excellent at execution, and that excellence is real and valuable. The challenge at this stage is that the behaviours that got you here — personal ownership, high standards, direct involvement in outcomes — begin to create an invisible ceiling. The team learns to rely on you rather than developing the problem-solving capability needed to scale. The path forward is not changing your character, but deliberately applying your builder instinct to a bigger construction job: building a leadership system, not just a delivery system.`;
  y = infoPanel(doc, 'Why This Archetype Plateaus', archContextText, y);

  // Strengths and blind spots
  const col2W = (CONTENT_W - 14) / 2;
  const lH = 46 + strengths.slice(0, 5).reduce((s, item) => s + measure(doc, item, col2W - 30, 8.5) + 7, 0);
  const bH = 46 + blindSpots.slice(0, 5).reduce((s, item) => s + measure(doc, item, col2W - 30, 8.5) + 7, 0);
  const dupH = Math.max(lH, bH);
  rPanel(doc, MARGIN, y, col2W, dupH, '#0d100d', C.stroke, 12);
  rPanel(doc, MARGIN + col2W + 14, y, col2W, dupH, '#100d0d', C.stroke, 12);
  writeLabel(doc, 'Strengths to Leverage', MARGIN + 16, y + 14, C.green);
  writeLabel(doc, 'Blind Spots to Navigate', MARGIN + col2W + 30, y + 14, C.red);
  drawBulletList(doc, strengths.slice(0, 5), MARGIN + 16, y + 30, col2W - 28, { bullet: '•', size: 8.5, color: C.soft, bulletColor: C.green, gap: 5 });
  drawBulletList(doc, blindSpots.slice(0, 5), MARGIN + col2W + 30, y + 30, col2W - 28, { bullet: '•', size: 8.5, color: C.soft, bulletColor: C.red, gap: 5 });
  y += dupH + 16;

  const riskH = measure(doc, plateauRisk, CONTENT_W - 36, 10) + 40;
  rPanel(doc, MARGIN, y, CONTENT_W, riskH, '#13110b', '#fbbf2440', 14);
  writeLabel(doc, 'Typical Plateau Risk', MARGIN + 18, y + 14, C.amber);
  writeText(doc, plateauRisk, MARGIN + 18, y + 28, { width: CONTENT_W - 36, size: 10, color: C.muted, lineGap: 2 });
  y += riskH + 16;

  // Archetype evolution description
  const archEvolution = [
    { from: 'Executing tasks personally', to: 'Designing systems that execute at scale' },
    { from: 'Setting individual performance standards', to: 'Building team-level performance architecture' },
    { from: 'Being accountable for outcomes', to: 'Creating accountability systems that survive without you' },
    { from: 'Solving problems when they arise', to: 'Installing mechanisms that prevent problems from compounding' },
  ];
  const aeH = 44 + archEvolution.length * 28;
  rPanel(doc, MARGIN, y, CONTENT_W, aeH, C.panel, C.stroke, 14);
  writeLabel(doc, 'The Evolution This Archetype Must Make', MARGIN + 18, y + 14, C.faint);
  let aeY = y + 30;
  for (const { from, to } of archEvolution) {
    writeText(doc, from, MARGIN + 18, aeY, { width: CONTENT_W * 0.42 - 18, size: 8.5, color: C.red });
    doc.font('Helvetica-Bold').fontSize(10).fillColor(C.faint).text('→', MARGIN + CONTENT_W * 0.43, aeY, { lineBreak: false });
    writeText(doc, to, MARGIN + CONTENT_W * 0.47, aeY, { width: CONTENT_W * 0.53 - 24, size: 8.5, color: C.green });
    aeY += 28;
  }
  y += aeH + 18;
  y = drawDivider(doc, y);

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 6 — GROWTH GAPS
  // ════════════════════════════════════════════════════════════════════════════
  y = pageHeader(doc, 6, 'Your Top 3 Growth Gaps', 'The three leadership upgrades most likely to shift how you are perceived, compensated, and promoted over the next 12 months.', y);

  for (let i = 0; i < growthAreas.length; i++) {
    const area = growthAreas[i];
    const desc = safeText(area.description);
    const steps = safeArray(area.actionSteps, []);
    const upgradeMove = steps[0] || 'Redesign the system, not just the output.';
    const deeper = `This gap is not a skill deficit — it is a habit pattern built up through years of being rewarded for direct execution. Closing it requires more than new techniques; it requires a deliberate shift in where you put your attention and what you allow to remain unresolved without your personal intervention.`;
    const blockH = 82 + measure(doc, desc, CONTENT_W - 80, 9.5) + measure(doc, deeper, CONTENT_W - 80, 9) + steps.length * 20 + 30;
    rPanel(doc, MARGIN, y, CONTENT_W, blockH, C.panel, C.stroke, 14);
    rPanel(doc, MARGIN + 14, y + 14, 38, 38, '#0f1a14', C.green, 10);
    doc.font('Helvetica-Bold').fontSize(16).fillColor(C.green)
       .text(String(i + 1), MARGIN + 14, y + 23, { width: 38, align: 'center', lineBreak: false });
    writeText(doc, safeText(area.title), MARGIN + 64, y + 14, { width: CONTENT_W - 80, size: 12, font: 'Helvetica-Bold', color: C.text });
    let gy = writeText(doc, desc, MARGIN + 64, y + 32, { width: CONTENT_W - 80, size: 9.5, color: C.muted, lineGap: 2.2 }) + 8;
    gy = writeText(doc, deeper, MARGIN + 64, gy, { width: CONTENT_W - 80, size: 9, color: C.soft, lineGap: 2 }) + 8;
    writeLabel(doc, 'Upgrade Actions', MARGIN + 64, gy, C.green);
    drawBulletList(doc, steps, MARGIN + 64, gy + 14, CONTENT_W - 80, { bullet: '→', size: 8.5, color: C.muted, bulletColor: C.green, gap: 4 });
    y += blockH + 14;
  }

  // Priority matrix + scale moves
  const matW = CONTENT_W * 0.5 - 8, matH = 240;
  const scaleW = CONTENT_W - matW - 14;
  rPanel(doc, MARGIN, y, matW, matH, C.panel, C.stroke, 14);
  writeLabel(doc, 'Priority Matrix', MARGIN + 16, y + 14, C.faint);
  drawPriorityMatrix(doc, MARGIN + 16, y + 30, matW - 32, iWins, sBets);
  rPanel(doc, MARGIN + matW + 14, y, scaleW, matH, C.panel, C.stroke, 14);
  writeLabel(doc, 'Scale Thinking', MARGIN + matW + 30, y + 14, C.green);
  drawBulletList(doc, [
    'Do now: delegation mechanics, 1:1 redesign, cleaner communication.',
    'Plan next: successor development and cross-team leverage systems.',
    'Delegate: recurring operational tasks and known-answer decisions.',
    'Defer: anything that cannot directly be traced to leverage or scale.',
    'Measure progress through team ownership, not personal activity.',
    'Review this matrix monthly and move one item from PLAN to DO.',
  ], MARGIN + matW + 30, y + 32, scaleW - 44, { bullet: '•', size: 8.5, color: C.soft, bulletColor: C.green, gap: 7 });
  y += matH + 18;
  y = drawDivider(doc, y);

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 7 — 90-DAY ROADMAP
  // ════════════════════════════════════════════════════════════════════════════
  y = pageHeader(doc, 7, '90-Day Leadership Roadmap', 'Three months of sequenced action. Execute in order — each month builds the infrastructure the next month requires.', y);

  const tlEnd = drawTimeline(doc, MARGIN, y, CONTENT_W, roadmapCards.map(c => safeText(c.theme, 'Focus')));
  y = tlEnd + 18;

  for (const [idx, card] of roadmapCards.entries()) {
    const actions = safeArray(card.actions, []);
    const cardH = 70 + actions.reduce((s, a) => s + measure(doc, a, CONTENT_W - 92, 8.5) + 4, 0);
    rPanel(doc, MARGIN, y, CONTENT_W, cardH, '#0f0f12', C.stroke, 14);
    rPanel(doc, MARGIN + 16, y + 16, 44, 44, '#141418', C.strokeSoft, 12);
    writeLabel(doc, `M${idx + 1}`, MARGIN + 16, y + 20, C.green);
    doc.font('Helvetica-Bold').fontSize(16).fillColor(C.text)
       .text(String(idx + 1), MARGIN + 16, y + 32, { width: 44, align: 'center', lineBreak: false });
    writeLabel(doc, safeText(card.theme, 'Focus'), MARGIN + 72, y + 16, C.green);
    writeText(doc, safeText(card.title), MARGIN + 72, y + 28, { width: CONTENT_W - 90, size: 11.5, font: 'Helvetica-Bold', color: C.text });
    drawBulletList(doc, actions, MARGIN + 72, y + 48, CONTENT_W - 90, { bullet: '•', size: 8.5, color: C.soft, bulletColor: C.accent, gap: 4 });
    y += cardH + 12;
  }

  // Monthly success markers
  const markerW = (CONTENT_W - 24) / 3;
  const markers = [
    { label: 'Month 1 Success Signals', items: ['Less time executing personally.', 'Team owns at least one new process.', 'Manager notices the update quality improving.'] },
    { label: 'Month 2 Success Signals', items: ['Stakeholders describe you as strategic.', 'You are influencing, not just reporting.', 'One team member growing toward your level.'] },
    { label: 'Month 3 Success Signals', items: ['Team delivers without constant involvement.', 'You have visible enterprise-level impact.', 'People ask you for direction, not permission.'] },
  ];
  const mH = Math.max(...markers.map(m => 42 + m.items.reduce((s, i) => s + measure(doc, i, markerW - 28, 8.5) + 6, 0)));
  for (const [i, { label, items }] of markers.entries()) {
    const mx = MARGIN + i * (markerW + 12);
    rPanel(doc, mx, y, markerW, mH, '#0d100d', C.strokeSoft, 12);
    writeLabel(doc, label, mx + 14, y + 14, C.green);
    drawBulletList(doc, items, mx + 14, y + 28, markerW - 26, { bullet: '✓', size: 8, color: C.soft, bulletColor: C.green, gap: 5 });
  }
  y += mH + 18;

  // Week-by-week spotlight for month 1
  const weekData = [
    { w: 'Week 1', focus: 'Map and audit: Every recurring task you own personally. Every decision escalated to you. Every team member below their potential.' },
    { w: 'Week 2', focus: 'Transfer one process: Pick one recurring operational task. Brief the new owner. Step back completely and observe.' },
    { w: 'Week 3', focus: 'Communication upgrade: Send one strategic narrative update. Practice Vision → Context → Action → Impact in one stakeholder meeting.' },
    { w: 'Week 4', focus: 'Reflect and calibrate: What ownership transferred successfully? What pulled back to you? What system change prevents the relapse?' },
  ];
  const weekPanelH = 44 + weekData.reduce((s, w) => s + measure(doc, w.focus, CONTENT_W - 100, 8.5) + 10, 0);
  rPanel(doc, MARGIN, y, CONTENT_W, weekPanelH, C.panel, C.stroke, 14);
  writeLabel(doc, 'Month 1 — Week-by-Week Breakdown', MARGIN + 18, y + 14, C.faint);
  let weekY = y + 30;
  for (const { w, focus } of weekData) {
    writeLabel(doc, w, MARGIN + 18, weekY, C.green);
    weekY = writeText(doc, focus, MARGIN + 78, weekY, { width: CONTENT_W - 96, size: 8.5, color: C.soft, lineGap: 1.5 }) + 10;
  }
  y += weekPanelH + 18;
  y = drawDivider(doc, y);

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 8 — BENCHMARK COMPARISON
  // ════════════════════════════════════════════════════════════════════════════
  y = pageHeader(doc, 8, 'Benchmark Comparison', 'How your profile compares to leaders operating at a similar stage of scope, team size, and business complexity.', y);

  y = infoPanel(doc, 'Benchmark Methodology', 'The peer benchmark is drawn from Careera\'s assessment database of leaders at a comparable stage — typically managing teams of 4–20 people, operating in complex, fast-moving environments, and sitting one level below senior leadership. Scores represent median performance at each dimension, not the top performers. Being above the peer median is valuable; being at or below suggests a higher-leverage development opportunity.', y);

  // Table
  const dimW = CONTENT_W * 0.38, youW = CONTENT_W * 0.24, peerW = CONTENT_W - dimW - youW;
  const tableH = 34 + benchItems.length * 30;
  rPanel(doc, MARGIN, y, CONTENT_W, tableH, C.panel, C.stroke, 12);
  const thY = y + 12;
  writeLabel(doc, 'Dimension', MARGIN + 14, thY);
  writeLabel(doc, 'Your Score', MARGIN + dimW + 14, thY);
  writeLabel(doc, 'Peer Average', MARGIN + dimW + youW + 14, thY);
  writeLabel(doc, 'Delta', MARGIN + CONTENT_W - 50, thY);
  let trY = y + 30;
  for (const item of benchItems) {
    doc.save().rect(MARGIN + 12, trY - 4, CONTENT_W - 24, 0.5).fill(C.strokeSoft).restore();
    const color = levelColor(comps.find(c => c.name === item.name)?.level || 'Developing');
    writeText(doc, item.name, MARGIN + 14, trY + 3, { width: dimW - 20, size: 8.5, font: 'Helvetica-Bold', color: C.text });
    writeText(doc, `${item.youScore}  ·  ${item.youLabel}`, MARGIN + dimW + 14, trY + 3, { width: youW - 18, size: 8.5, color: C.muted });
    writeText(doc, `${item.peerScore}  ·  ${item.peerLabel}`, MARGIN + dimW + youW + 14, trY + 3, { width: peerW - 60, size: 8.5, color: C.soft });
    const delta = item.youScore - item.peerScore;
    writeText(doc, `${delta > 0 ? '+' : ''}${delta}`, MARGIN + CONTENT_W - 50, trY + 3, {
      width: 40, size: 8.5, font: 'Helvetica-Bold', color: delta > 0 ? C.green : C.red, align: 'right',
    });
    trY += 30;
  }
  y += tableH + 14;

  // Visual comparison bars
  const vizH = 36 + benchItems.length * 24;
  rPanel(doc, MARGIN, y, CONTENT_W, vizH, C.panel, C.stroke, 12);
  writeLabel(doc, 'Visual Comparison (green = you, white = peer)', MARGIN + 16, y + 14, C.faint);
  let vizY = y + 28;
  for (const [i, item] of benchItems.entries()) {
    const color = levelColor(comps[i]?.level || 'Developing');
    writeText(doc, item.name.split(' ')[0], MARGIN + 16, vizY, { width: 84, size: 8, font: 'Helvetica-Bold', color: C.text });
    drawProgressBar(doc, MARGIN + 110, vizY + 3, 148, item.youScore, color, 6);
    drawProgressBar(doc, MARGIN + 268, vizY + 3, 148, item.peerScore, C.strokeSoft, 6);
    doc.save().roundedRect(MARGIN + 268, vizY + 3, (item.peerScore / 100) * 148, 6, 3).fill('#ffffff55').restore();
    writeText(doc, `${item.youScore}`, MARGIN + 263, vizY, { width: 18, size: 7.5, color, align: 'right' });
    writeText(doc, `${item.peerScore}`, MARGIN + 421, vizY, { width: 18, size: 7.5, color: C.soft, align: 'right' });
    vizY += 24;
  }
  y += vizH + 14;

  const comparative = `Your strongest performance versus peers is in ${strongest.name} (+${strongest.score - peerAvg(strongest.score, comps.indexOf(strongest))}pts). Your largest gap below peers is in ${weakest.name} (${weakest.score - peerAvg(weakest.score, comps.indexOf(weakest))}pts). Closing this single gap would move you into the upper quartile of this peer cohort overall.`;
  y = infoPanel(doc, 'Comparative Analysis', comparative, y);
  y = drawDivider(doc, y);

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 9 — EVOLUTION PATH
  // ════════════════════════════════════════════════════════════════════════════
  y = pageHeader(doc, 9, 'Leadership Evolution Path', 'The five-stage model of leadership progression and the mindset shifts required at each transition point.', y);

  const stairH = 136;
  const stairPH = stairH + 46;
  rPanel(doc, MARGIN, y, CONTENT_W, stairPH, C.panel, C.stroke, 16);
  drawEvolutionSteps(doc, MARGIN + 18, y + 14, CONTENT_W - 36, stairH, stageCards.map(s => s.name), curStep);
  y += stairPH + 14;

  // Stage detail cards
  for (const [i, card] of stageCards.entries()) {
    const here = (i + 1) === curStep;
    const next = (i + 1) === curStep + 1;
    const cH = 46 + measure(doc, card.shift, CONTENT_W - 80, 9) + 10;
    rPanel(doc, MARGIN, y, CONTENT_W, cH, here ? '#141a14' : '#0f0f12', here ? C.green : C.strokeSoft, 12);
    doc.save().rect(MARGIN, y, 3, cH).fill(here ? C.green : next ? C.blue : C.strokeSoft).restore();
    writeText(doc, `Stage ${i + 1} · ${card.name}`, MARGIN + 16, y + 12, { width: CONTENT_W - 80, size: 10, font: 'Helvetica-Bold', color: here ? C.text : C.soft });
    if (here) writeLabel(doc, 'You are here', MARGIN + CONTENT_W - 80, y + 14, C.green);
    if (next) writeLabel(doc, 'Your next horizon', MARGIN + CONTENT_W - 110, y + 14, C.blue);
    writeText(doc, card.shift, MARGIN + 16, y + 28, { width: CONTENT_W - 36, size: 9, color: here ? C.muted : C.faint, lineGap: 2 });
    y += cH + 8;
  }
  y += 8;

  // Transition requirements
  const curCard = stageCards[curStep - 1];
  const nxtCard = stageCards[curStep] || stageCards[4];
  const transText = `The transition from ${curCard?.name} to ${nxtCard?.name} is the most commonly underestimated leadership shift. Most leaders at this inflection point try to work harder within the existing model rather than redesigning the model itself. The shift is not about doing more — it is about doing fundamentally different things. The behaviours that produced your current results are not sufficient to produce the results required at the next level.`;
  y = infoPanel(doc, 'The Transition You Are Making', transText, y);

  // Mindset shifts grid
  const mindShifts = [
    { from: 'Personal execution', to: 'System design' },
    { from: 'Being accountable', to: 'Building accountability systems' },
    { from: 'Fixing problems', to: 'Installing prevention mechanisms' },
    { from: 'Informing stakeholders', to: 'Influencing strategic direction' },
    { from: 'Managing performance', to: 'Developing leadership in others' },
    { from: 'Delivering results', to: 'Creating conditions for others to deliver' },
  ];
  const msH = 46 + mindShifts.length * 26;
  rPanel(doc, MARGIN, y, CONTENT_W, msH, C.panel, C.stroke, 14);
  writeLabel(doc, 'Critical Mindset Shifts Required', MARGIN + 18, y + 14, C.faint);
  let msY = y + 30;
  for (const { from, to } of mindShifts) {
    writeText(doc, from, MARGIN + 18, msY, { width: CONTENT_W * 0.42, size: 8.5, color: C.red });
    doc.font('Helvetica-Bold').fontSize(9).fillColor(C.faint).text('→', MARGIN + CONTENT_W * 0.44, msY, { lineBreak: false });
    writeText(doc, to, MARGIN + CONTENT_W * 0.48, msY, { width: CONTENT_W * 0.52 - 18, size: 8.5, color: C.green });
    msY += 26;
  }
  y += msH + 18;
  y = drawDivider(doc, y);

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 10 — MISSION CONTROL DASHBOARD
  // ════════════════════════════════════════════════════════════════════════════
  y = pageHeader(doc, 10, 'Mission Control Dashboard', 'Operating rhythms, KPIs, and a weekly cadence design so your growth is visible and measurable — not aspirational.', y);

  // 3-col cadence
  const cadW = (CONTENT_W - 24) / 3;
  const cadGroups = [
    { label: 'Daily Cadence', items: dailyCad },
    { label: 'Weekly Cadence', items: weeklyCad },
    { label: 'Monthly Cadence', items: monthlyCad },
  ];
  const cadH = Math.max(...cadGroups.map(g => 44 + g.items.reduce((s, i) => s + measure(doc, i, cadW - 28, 8.5) + 6, 0)));
  for (const [i, { label, items }] of cadGroups.entries()) {
    const cx = MARGIN + i * (cadW + 12);
    rPanel(doc, cx, y, cadW, cadH, C.panel, C.stroke, 12);
    writeLabel(doc, label, cx + 14, y + 14, C.green);
    drawBulletList(doc, items, cx + 14, y + 28, cadW - 26, { bullet: '•', size: 8.5, color: C.soft, bulletColor: C.green, gap: 6 });
  }
  y += cadH + 16;

  // KPI panel + bar chart side by side
  const kpiPW = CONTENT_W * 0.52, bcW = CONTENT_W - kpiPW - 14;
  const kpiPH = 44 + kpis.length * 26;
  rPanel(doc, MARGIN, y, kpiPW, kpiPH, C.panel, C.stroke, 12);
  writeLabel(doc, 'Weekly Leadership KPIs', MARGIN + 16, y + 14, C.faint);
  let kpiY = y + 30;
  const kpiColors = [C.green, C.blue, C.amber, C.purple, C.green, C.blue, C.amber];
  for (const [i, kpi] of kpis.entries()) {
    const kscore = clamp(44 + (i * 11 % 48), 0, 100);
    const kcolor = kpiColors[i % kpiColors.length];
    writeText(doc, safeText(kpi), MARGIN + 16, kpiY, { width: kpiPW - 110, size: 8, color: C.soft });
    drawProgressBar(doc, MARGIN + kpiPW - 88, kpiY + 4, 70, kscore, kcolor, 5);
    writeText(doc, `${kscore}%`, MARGIN + kpiPW - 14, kpiY, { width: 16, size: 7.5, color: kcolor, align: 'right' });
    kpiY += 26;
  }
  rPanel(doc, MARGIN + kpiPW + 14, y, bcW, kpiPH, C.panel, C.stroke, 12);
  writeLabel(doc, 'Momentum Index', MARGIN + kpiPW + 30, y + 14, C.faint);
  drawKpiBarChart(doc, MARGIN + kpiPW + 26, y + 34, bcW - 36, 100, comps.map(c => c.name));
  y += kpiPH + 16;

  // Weekly meeting blueprint
  const meetBlocks = [
    { time: '00–05 min', name: 'Pulse check', desc: 'Energy and blockers only — no project updates.' },
    { time: '05–25 min', name: 'Ownership review', desc: 'What is the team moving without you? What is still gravitating back toward you?' },
    { time: '25–40 min', name: 'Development conversation', desc: 'One team member gets focused coaching time. Rotate weekly.' },
    { time: '40–50 min', name: 'Strategic context', desc: 'What changed this week that the team needs to understand at a business level?' },
    { time: '50–60 min', name: 'Next-week design', desc: 'What decisions will be made next week and who should own them?' },
  ];
  const mbH = 46 + meetBlocks.reduce((s, b) => s + measure(doc, b.desc, CONTENT_W - 140, 8.5) + 12, 0);
  rPanel(doc, MARGIN, y, CONTENT_W, mbH, '#0f0f12', C.stroke, 14);
  writeLabel(doc, 'Redesigned Weekly Team Meeting Blueprint', MARGIN + 18, y + 14, C.faint);
  let mbY = y + 30;
  for (const { time, name, desc } of meetBlocks) {
    writeLabel(doc, time, MARGIN + 18, mbY, C.green);
    writeText(doc, name, MARGIN + 96, mbY, { width: 120, size: 8.5, font: 'Helvetica-Bold', color: C.text });
    mbY = writeText(doc, desc, MARGIN + 226, mbY, { width: CONTENT_W - 244, size: 8.5, color: C.soft, lineGap: 1.5 }) + 12;
  }
  y += mbH + 18;
  y = drawDivider(doc, y);

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 11 — STAKEHOLDER INFLUENCE MAP & 7-DAY SPRINT
  // ════════════════════════════════════════════════════════════════════════════
  y = pageHeader(doc, 11, 'Stakeholder Influence Map & 7-Day Launch Sprint', 'Who to influence and what to do in the first week to convert this report into visible behaviour change.', y);

  // Stakeholder deep panel
  const spH = 48 + stakPlay.reduce((s, item) => s + measure(doc, item, CONTENT_W - 40, 9) + 8, 0);
  rPanel(doc, MARGIN, y, CONTENT_W, spH, C.panel, C.stroke, 14);
  writeLabel(doc, 'Stakeholder Influence Playbook', MARGIN + 18, y + 14, C.green);
  let spY = y + 30;
  for (const item of stakPlay) {
    const colon = item.indexOf(':');
    if (colon > 0) {
      const role = item.slice(0, colon);
      const rest = item.slice(colon + 1).trim();
      doc.font('Helvetica-Bold').fontSize(9).fillColor(C.text).text(`${role}:`, MARGIN + 18, spY, { lineBreak: false });
      spY = writeText(doc, rest, MARGIN + 18 + doc.widthOfString(`${role}:`) + 6, spY, { width: CONTENT_W - 80, size: 9, color: C.soft, lineGap: 1.5 }) + 8;
    } else {
      spY = writeText(doc, item, MARGIN + 18, spY, { width: CONTENT_W - 36, size: 9, color: C.soft, lineGap: 1.5 }) + 8;
    }
  }
  y += spH + 16;

  // Day cards
  const days = sprint.slice(0, 7);
  const topN = Math.min(days.length, 4);
  const dayW4 = (CONTENT_W - (topN - 1) * 7) / topN;
  for (let i = 0; i < topN; i++) {
    const dx = MARGIN + i * (dayW4 + 7);
    rPanel(doc, dx, y, dayW4, 104, '#0f0f12', C.stroke, 10);
    doc.save().rect(dx, y, dayW4, 3).fill(C.green).restore();
    writeLabel(doc, `Day ${i + 1}`, dx + 10, y + 10, C.green);
    writeText(doc, days[i], dx + 10, y + 24, { width: dayW4 - 18, size: 7.5, color: C.soft, lineGap: 2 });
  }
  y += 114;

  if (days.length > 4) {
    const botN = days.length - 4;
    const dayWb = (CONTENT_W - (botN - 1) * 7) / botN;
    for (let i = 0; i < botN; i++) {
      const dx = MARGIN + i * (dayWb + 7);
      rPanel(doc, dx, y, dayWb, 102, '#0f0f12', C.stroke, 10);
      doc.save().rect(dx, y, dayWb, 3).fill(C.blue).restore();
      writeLabel(doc, `Day ${i + 5}`, dx + 10, y + 10, C.blue);
      writeText(doc, days[i + 4], dx + 10, y + 24, { width: dayWb - 18, size: 7.5, color: C.soft, lineGap: 2 });
    }
    y += 112;
  }
  y += 10;
  y = drawDivider(doc, y);

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 12 — LEADERSHIP HABITS BLUEPRINT
  // ════════════════════════════════════════════════════════════════════════════
  y = pageHeader(doc, 12, 'Leadership Habits Blueprint', 'The 12 high-leverage habits that translate this assessment into lasting behaviour change. Start with three.', y);

  y = infoPanel(doc, 'About Habit-Based Leadership', 'Research on leadership development consistently shows that insight alone does not produce behaviour change. Leaders who improve most rapidly are those who convert insights into small, daily, observable practices. The habits below are specifically chosen because they are (a) directly linked to your lowest-scoring dimensions, (b) measurable in the short term, and (c) designed to create visible signals for your team and stakeholders within 30 days.', y);

  const habits = [
    { dim: 'Delegation', habit: 'Every Friday, name one task you did this week that a team member could own next week. Hand it over Monday.', tier: 'Start here' },
    { dim: 'Delegation', habit: 'When a team member escalates, ask "What do you think is the right call?" before offering your answer.', tier: 'Start here' },
    { dim: 'Strategic Communication', habit: 'Write a two-sentence "why this matters" before every stakeholder update. Send it first.', tier: 'Start here' },
    { dim: 'Strategic Communication', habit: 'In every cross-functional meeting, state one business consequence of the topic being discussed.', tier: 'Month 1' },
    { dim: 'Coaching & Feedback', habit: 'Ask one development question in every 1:1: "What would you handle differently if you owned this fully?"', tier: 'Month 1' },
    { dim: 'Coaching & Feedback', habit: 'After every piece of praise you give, add: "What specifically made that work so you can repeat it?"', tier: 'Month 1' },
    { dim: 'Influence', habit: 'Before every key stakeholder interaction, write their current concern in one sentence and lead with addressing it.', tier: 'Month 2' },
    { dim: 'Influence', habit: 'Once per month, share one forward-looking insight with your manager that they did not ask for.', tier: 'Month 2' },
    { dim: 'Strategic Thinking', habit: 'Block one 45-minute "horizon thinking" slot per week. No meetings. No execution. Only pattern recognition.', tier: 'Month 2' },
    { dim: 'Strategic Thinking', habit: 'Keep a decision log. Record every significant decision this week. Review patterns monthly.', tier: 'Month 3' },
    { dim: 'Emotional Intelligence', habit: 'After every difficult conversation, write: What did I feel? What did they feel? What would I change?', tier: 'Month 3' },
    { dim: 'Execution (leverage)', habit: 'Monthly: count how many outcomes this month were driven by the team without your direct involvement. Set a target to increase it.', tier: 'Month 3' },
  ];

  const tierColors = { 'Start here': C.green, 'Month 1': C.blue, 'Month 2': C.amber, 'Month 3': C.purple };
  const habW = (CONTENT_W - 12) / 2;
  for (let i = 0; i < habits.length; i += 2) {
    const leftHabit = habits[i], rightHabit = habits[i + 1];
    const lH = measure(doc, leftHabit.habit, habW - 110, 8.5) + 42;
    const rH = rightHabit ? measure(doc, rightHabit.habit, habW - 110, 8.5) + 42 : 0;
    const rowH = Math.max(lH, rH);

    for (const [col, habit] of [leftHabit, rightHabit].entries()) {
      if (!habit) continue;
      const hx = MARGIN + col * (habW + 12);
      const color = tierColors[habit.tier] || C.soft;
      rPanel(doc, hx, y, habW, rowH, '#0f0f12', C.strokeSoft, 12);
      doc.save().rect(hx, y, 3, rowH).fill(color).restore();
      writeLabel(doc, habit.dim, hx + 14, y + 12, C.faint);
      rPanel(doc, hx + habW - 70, y + 10, 58, 16, '#101014', C.strokeSoft, 8);
      writeLabel(doc, habit.tier, hx + habW - 64, y + 14, color);
      writeText(doc, habit.habit, hx + 14, y + 28, { width: habW - 26, size: 8.5, color: C.soft, lineGap: 2 });
    }
    y += rowH + 10;
  }
  y += 8;
  y = drawDivider(doc, y);

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 13 — LEADERSHIP SIGNALS & SELF-ASSESSMENT
  // ════════════════════════════════════════════════════════════════════════════
  y = pageHeader(doc, 13, 'Leadership Signals & Self-Assessment Guide', 'The observable evidence that tells you this report is becoming reality — and a quarterly check-in framework.', y);

  const signalCards = [
    { title: 'Signal 01 — Team Ownership', body: 'Your team asks better questions instead of waiting for your direct instruction. They propose solutions before you ask. When something breaks, they tell you what they are already doing to fix it — not asking what you want them to do.', color: C.green },
    { title: 'Signal 02 — Strategic Perception', body: 'Senior stakeholders describe your updates as forward-looking and context-rich, not just operational. You are being included in conversations earlier, before problems become visible. People ask your opinion on direction, not just on delivery.', color: C.blue },
    { title: 'Signal 03 — Leverage Over Effort', body: 'You spend less time in execution and more time creating the conditions for excellent execution. When you step out of a process for a day, momentum does not collapse. The systems you built continue to run.', color: C.amber },
    { title: 'Signal 04 — Cross-Functional Influence', body: 'Peers in other functions seek your perspective on their problems. You have visible influence in rooms you do not formally own. Your decisions have ripple effects that extend beyond your direct team.', color: C.purple },
  ];
  const scW = (CONTENT_W - 12) / 2;
  for (let i = 0; i < signalCards.length; i += 2) {
    const l = signalCards[i], r = signalCards[i + 1];
    const lH = measure(doc, l.body, scW - 28, 8.5) + 46;
    const rH = r ? measure(doc, r.body, scW - 28, 8.5) + 46 : 0;
    const rowH = Math.max(lH, rH);
    for (const [col, card] of [l, r].entries()) {
      if (!card) continue;
      const sx = MARGIN + col * (scW + 12);
      rPanel(doc, sx, y, scW, rowH, C.panel, C.stroke, 14);
      doc.save().rect(sx, y, scW, 3).fill(card.color).restore();
      writeLabel(doc, card.title, sx + 14, y + 12, card.color);
      writeText(doc, card.body, sx + 14, y + 28, { width: scW - 28, size: 8.5, color: C.soft, lineGap: 2.2 });
    }
    y += rowH + 12;
  }
  y += 8;

  // Self-assessment framework
  const selfQs = [
    'This week, how many outcomes moved because of the team — not because of my direct involvement?',
    'When did I catch myself stepping into work that someone else should have owned?',
    'Did I communicate any strategic context to my team that helped them make better decisions independently?',
    'How many development-focused conversations did I have (not status, not updates — development)?',
    'What feedback did I give that was specific enough to be actionable without further clarification?',
    'Did I send any proactive stakeholder communication that addressed their concern before they raised it?',
  ];
  const sqH = 46 + selfQs.reduce((s, q) => s + measure(doc, q, CONTENT_W - 50, 9) + 8, 0);
  rPanel(doc, MARGIN, y, CONTENT_W, sqH, '#0f0f12', C.stroke, 14);
  writeLabel(doc, 'Weekly Self-Assessment Questions (review every Friday)', MARGIN + 18, y + 14, C.green);
  drawNumberedList(doc, selfQs, MARGIN + 18, y + 30, CONTENT_W - 36, { size: 9, color: C.soft, numColor: C.green, gap: 8 });
  y += sqH + 18;
  y = drawDivider(doc, y);

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION 14 — FINAL REFLECTION & CALL TO ACTION
  // ════════════════════════════════════════════════════════════════════════════
  y = pageHeader(doc, 14, 'Final Reflection & Call to Action', 'Respect compounds when your leadership creates leverage beyond your own direct effort and presence.', y);

  // Hero quote panel
  const heroH = 88;
  rPanel(doc, MARGIN, y, CONTENT_W, heroH, '#0c140c', '#86efac44', 16);
  writeLabel(doc, 'Your Next Leadership Move', MARGIN + 20, y + 16, C.green);
  writeText(doc, 'The difference between a strong manager and a respected leader is leverage.', MARGIN + 20, y + 30, { width: CONTENT_W - 40, size: 15, font: 'Helvetica-Bold', color: C.green, lineGap: 1 });
  y += heroH + 16;

  y = infoPanel(doc, 'What Happens If You Execute This Plan', outcome90, y);
  y = infoPanel(doc, 'Your Communication Template — Copy-Paste Ready', commScript, y);

  // 3 CTA cards
  const ctaW = (CONTENT_W - 24) / 3;
  const ctaItems = [
    { label: 'Join Leadership Cohort', desc: 'Build peer accountability and accelerated practice in a structured group setting. Bi-weekly cohort calls with leaders at the same transition stage.', action: 'Apply at careera.io/cohort' },
    { label: 'Book 1:1 Diagnostic Session', desc: 'Translate this report into a sharp 90-day growth plan with expert guidance. 90 minutes with a senior leadership advisor tailored to your profile.', action: 'Book at careera.io/session' },
    { label: 'Advanced Delegation Module', desc: 'A structured 6-week module on delegation that goes beyond technique into the psychology of ownership transfer. Online and self-paced.', action: 'Start at careera.io/delegation' },
  ];
  const ctaH = Math.max(...ctaItems.map(c => measure(doc, c.desc, ctaW - 28, 8.5) + 78));
  for (const [i, { label, desc, action }] of ctaItems.entries()) {
    const x = MARGIN + i * (ctaW + 12);
    rPanel(doc, x, y, ctaW, ctaH, C.panel, C.stroke, 14);
    writeLabel(doc, `Action ${i + 1}`, x + 14, y + 14, C.green);
    writeText(doc, label, x + 14, y + 28, { width: ctaW - 28, size: 10, font: 'Helvetica-Bold', color: C.text });
    writeText(doc, desc, x + 14, y + 48, { width: ctaW - 28, size: 8.5, color: C.soft, lineGap: 2 });
    writeLabel(doc, action, x + 14, ctaH + y - 20, C.faint);
  }
  y += ctaH + 18;

  // Final closing block
  const closingText = 'Use this report as a living operating document, not a one-time read. Return to it weekly for the first month, monthly for the next two, and quarterly after that. Score your behaviour honestly against the signals described in Section 13. Ask your team and your manager for specific, behavioural feedback aligned to the dimensions here. Leadership growth that sticks is built through repeated, conscious practice — not through insight alone. You have a clear map. The work is now in the execution.';
  const closH = measure(doc, closingText, CONTENT_W - 40, 10) + 44;
  rPanel(doc, MARGIN, y, CONTENT_W, closH, '#0c140c', '#86efac44', 14);
  writeLabel(doc, 'Your Leadership Operating Commitment', MARGIN + 20, y + 14, C.green);
  writeText(doc, closingText, MARGIN + 20, y + 28, { width: CONTENT_W - 40, size: 10, color: C.green, font: 'Helvetica-Bold', lineGap: 2.2 });
  y += closH + 24;

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
