import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const PDFDocument = require('pdfkit');

const C = {
  bg: '#0a0a0a',
  panel: '#141416',
  panelAlt: '#18181b',
  stroke: '#27272a',
  text: '#fafafa',
  muted: '#d4d4d8',
  soft: '#a1a1aa',
  faint: '#71717a',
  accent: '#ffffff',
  green: '#86efac',
  amber: '#fbbf24',
  red: '#f87171',
};

const PAGE_W = 595.28;
const MARGIN = 32;
const CONTENT_W = PAGE_W - MARGIN * 2;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function safeText(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function safeArray(value, fallback = []) {
  return Array.isArray(value) && value.length ? value : fallback;
}

function levelColor(level) {
  return {
    Advanced: C.green,
    Strong: C.accent,
    Developing: C.amber,
    Emerging: C.red,
  }[level] || C.soft;
}

function roundedPanel(doc, x, y, w, h, fill = C.panel, stroke = C.stroke, radius = 16) {
  doc.save();
  doc.roundedRect(x, y, w, h, radius).fill(fill);
  if (stroke) {
    doc.roundedRect(x, y, w, h, radius).lineWidth(1).strokeColor(stroke).stroke();
  }
  doc.restore();
}

function measure(doc, text, width, size = 10, font = 'Helvetica') {
  doc.font(font).fontSize(size);
  return doc.heightOfString(String(text || ''), { width, lineGap: 2, align: 'left' });
}

function writeText(doc, text, x, y, options = {}) {
  const {
    width = CONTENT_W,
    size = 10,
    font = 'Helvetica',
    color = C.muted,
    lineGap = 2,
    align = 'left',
  } = options;
  doc.font(font).fontSize(size).fillColor(color).text(String(text || ''), x, y, {
    width,
    lineGap,
    align,
  });
  return doc.y;
}

function writeLabel(doc, text, x, y, color = C.faint) {
  doc.font('Helvetica-Bold').fontSize(8).fillColor(color).text(String(text || '').toUpperCase(), x, y, {
    lineBreak: false,
  });
}

function drawDivider(doc, y) {
  doc.save().rect(MARGIN, y, CONTENT_W, 1).fill(C.stroke).restore();
  return y + 18;
}

function drawProgressBar(doc, x, y, width, score, color) {
  const filled = clamp((score / 100) * width, 6, width);
  doc.save();
  doc.roundedRect(x, y, width, 8, 4).fill(C.stroke);
  doc.roundedRect(x, y, filled, 8, 4).fill(color);
  doc.restore();
}

function drawChipRow(doc, items, x, y, maxWidth) {
  let chipX = x;
  let chipY = y;
  for (const item of items) {
    const label = safeText(item);
    if (!label) continue;
    const chipW = doc.font('Helvetica').fontSize(8).widthOfString(label) + 18;
    if (chipX + chipW > x + maxWidth) {
      chipX = x;
      chipY += 22;
    }
    doc.save();
    doc.roundedRect(chipX, chipY, chipW, 18, 9).fill('#101012');
    doc.roundedRect(chipX, chipY, chipW, 18, 9).lineWidth(0.8).strokeColor(C.stroke).stroke();
    doc.restore();
    doc.font('Helvetica').fontSize(8).fillColor(C.soft).text(label, chipX + 9, chipY + 5, { lineBreak: false });
    chipX += chipW + 8;
  }
  return chipY + 18;
}

function drawBulletList(doc, items, x, y, width, options = {}) {
  const {
    bullet = '•',
    size = 9,
    color = C.muted,
    gap = 6,
    bulletColor = C.soft,
  } = options;

  let cursorY = y;
  for (const item of items) {
    const line = safeText(item);
    if (!line) continue;
    doc.font('Helvetica-Bold').fontSize(size).fillColor(bulletColor).text(bullet, x, cursorY + 1, { lineBreak: false });
    const bottom = writeText(doc, line, x + 12, cursorY, {
      width: width - 12,
      size,
      color,
      lineGap: 2,
    });
    cursorY = bottom + gap;
  }
  return cursorY;
}

function sectionHeader(doc, eyebrow, title, subtitle, y) {
  writeLabel(doc, eyebrow, MARGIN, y);
  let cursorY = y + 12;
  cursorY = writeText(doc, title, MARGIN, cursorY, {
    size: 18,
    font: 'Helvetica-Bold',
    color: C.text,
    lineGap: 1,
  });
  if (subtitle) {
    cursorY = writeText(doc, subtitle, MARGIN, cursorY + 4, {
      size: 9.5,
      color: C.soft,
      lineGap: 2,
    });
  }
  return cursorY + 12;
}

function estimateHeight(analysis) {
  const competencies = safeArray(analysis.competencies, []);
  const topGrowthAreas = safeArray(analysis.topGrowthAreas, []);
  const blindSpots = safeArray(analysis.blindSpots, []);
  const strengthLevers = safeArray(analysis.strengthLevers, []);
  const stakeholderPlaybook = safeArray(analysis.stakeholderPlaybook, []);
  const firstWeekPlan = safeArray(analysis.firstWeekPlan, []);
  const kpis = safeArray(analysis.kpis, []);

  const textLoad = [
    safeText(analysis.executiveSummary),
    safeText(analysis.communicationScript),
    safeText(analysis.ninetyDayOutcome),
    ...competencies.map((c) => safeText(c.deepDive)),
    ...topGrowthAreas.map((g) => safeText(g.description)),
  ].join(' ');

  return clamp(
    5200
      + competencies.length * 170
      + topGrowthAreas.length * 220
      + blindSpots.length * 42
      + strengthLevers.length * 42
      + stakeholderPlaybook.length * 56
      + firstWeekPlan.length * 60
      + kpis.length * 48
      + textLoad.length * 0.7,
    7000,
    13500
  );
}

export function generatePdfBuffer(analysis) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const pageHeight = estimateHeight(analysis);
    const doc = new PDFDocument({
      size: [PAGE_W, pageHeight],
      margin: 0,
      bufferPages: false,
      autoFirstPage: true,
    });

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const competencies = safeArray(analysis.competencies, []);
    const sorted = [...competencies].sort((a, b) => b.score - a.score);
    const strongest = sorted[0] || { name: 'Execution', score: 0, level: 'Developing' };
    const weakest = sorted[sorted.length - 1] || { name: 'Strategy', score: 0, level: 'Developing' };
    const blindSpots = safeArray(analysis.blindSpots, []);
    const strengthLevers = safeArray(analysis.strengthLevers, []);
    const topGrowthAreas = safeArray(analysis.topGrowthAreas, []);
    const stakeholderPlaybook = safeArray(analysis.stakeholderPlaybook, []);
    const firstWeekPlan = safeArray(analysis.firstWeekPlan, []);
    const kpis = safeArray(analysis.kpis, []);
    const dailyCadence = safeArray(analysis.operatingCadence?.daily, []);
    const weeklyCadence = safeArray(analysis.operatingCadence?.weekly, []);
    const monthlyCadence = safeArray(analysis.operatingCadence?.monthly, []);
    const roadmapCards = [
      analysis.roadmap?.month1,
      analysis.roadmap?.month2,
      analysis.roadmap?.month3,
    ].filter(Boolean);
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    doc.rect(0, 0, PAGE_W, pageHeight).fill(C.bg);

    let y = 34;

    // Hero
    roundedPanel(doc, MARGIN, y, CONTENT_W, 244, C.panelAlt, C.stroke, 20);
    writeLabel(doc, 'Careera · Leadership Intelligence', MARGIN + 22, y + 22, C.soft);
    writeText(doc, 'Leadership Readiness Report', MARGIN + 22, y + 42, {
      width: CONTENT_W * 0.56,
      size: 28,
      font: 'Helvetica-Bold',
      color: C.text,
      lineGap: 0,
    });
    writeText(doc, safeText(analysis.leadershipStage, 'Leadership Growth Report'), MARGIN + 22, y + 112, {
      width: CONTENT_W * 0.56,
      size: 11,
      color: C.soft,
    });
    writeText(doc, safeText(analysis.executiveSummary, '').slice(0, 240), MARGIN + 22, y + 142, {
      width: CONTENT_W * 0.56,
      size: 10,
      color: C.muted,
      lineGap: 2,
    });

    const scoreCx = PAGE_W - MARGIN - 92;
    const scoreCy = y + 98;
    doc.save();
    doc.circle(scoreCx, scoreCy, 56).fill('#111114');
    doc.circle(scoreCx, scoreCy, 56).lineWidth(2).strokeColor(C.stroke).stroke();
    doc.circle(scoreCx, scoreCy, 56).lineWidth(6).strokeColor('#232326').stroke();
    doc.arc(scoreCx, scoreCy, 56, -90, -90 + (clamp(analysis.leadershipScore, 0, 100) / 100) * 360).lineWidth(6).strokeColor(C.green).stroke();
    doc.restore();
    doc.font('Helvetica-Bold').fontSize(30).fillColor(C.text).text(String(analysis.leadershipScore || 0), scoreCx - 28, scoreCy - 16, {
      width: 56,
      align: 'center',
      lineBreak: false,
    });
    doc.font('Helvetica').fontSize(9).fillColor(C.soft).text('/100', scoreCx - 28, scoreCy + 16, {
      width: 56,
      align: 'center',
      lineBreak: false,
    });

    const metaY = y + 206;
    const metaW = (CONTENT_W - 24) / 3;
    [
      { label: 'Date', value: date },
      { label: 'Archetype', value: safeText(analysis.archetype?.name, 'Leadership Builder') },
      { label: 'Priority Gap', value: safeText(weakest.name, 'Influence') },
    ].forEach((item, index) => {
      const cardX = MARGIN + 22 + index * (metaW + 12);
      roundedPanel(doc, cardX, metaY, metaW, 24, '#111114', C.stroke, 10);
      writeLabel(doc, item.label, cardX + 10, metaY + 6);
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(C.text).text(item.value, cardX + 10, metaY + 14, {
        width: metaW - 20,
        lineBreak: false,
      });
    });

    y += 272;

    // Key insight strip
    roundedPanel(doc, MARGIN, y, CONTENT_W, 54, '#101012', C.stroke, 16);
    writeLabel(doc, 'Key Insight', MARGIN + 18, y + 12);
    writeText(doc, `"${safeText(analysis.keyInsight, 'Your next growth step is to build scale through other people, not through more personal effort.')}"`, MARGIN + 18, y + 24, {
      width: CONTENT_W - 36,
      size: 11,
      font: 'Helvetica-Bold',
      color: C.green,
      lineGap: 1,
    });
    y += 76;

    // Snapshot
    y = sectionHeader(doc, 'Executive Summary', 'Where You Stand Today', 'A compact view of your strongest assets, immediate focus areas, and overall trajectory.', y);
    const summaryText = safeText(
      analysis.executiveSummary,
      'This report translates your assessment into a leadership operating system: where you already create leverage, where you are still over-indexing on personal execution, and which moves will raise your visibility and scale over the next 90 days.'
    );
    const summaryH = measure(doc, summaryText, CONTENT_W - 36, 10.5) + 44;
    roundedPanel(doc, MARGIN, y, CONTENT_W, summaryH, C.panel, C.stroke, 18);
    writeText(doc, summaryText, MARGIN + 18, y + 18, {
      width: CONTENT_W - 36,
      size: 10.5,
      color: C.muted,
      lineGap: 3,
    });
    y += summaryH + 16;

    const miniW = (CONTENT_W - 24) / 3;
    [
      { label: 'Top Strength', value: strongest.name, sub: `${strongest.score}/100 · ${strongest.level}` },
      { label: 'Focus Area', value: weakest.name, sub: `${weakest.score}/100 · ${weakest.level}` },
      { label: 'Archetype', value: safeText(analysis.archetype?.name, 'The Scaling Builder'), sub: safeText(analysis.leadershipStage, '') },
    ].forEach((item, index) => {
      const x = MARGIN + index * (miniW + 12);
      roundedPanel(doc, x, y, miniW, 64, '#101012', C.stroke, 14);
      writeLabel(doc, item.label, x + 14, y + 12);
      writeText(doc, item.value, x + 14, y + 24, {
        width: miniW - 28,
        size: 12,
        font: 'Helvetica-Bold',
        color: C.text,
      });
      writeText(doc, item.sub, x + 14, y + 44, {
        width: miniW - 28,
        size: 8.5,
        color: C.soft,
      });
    });
    y += 88;

    y = drawDivider(doc, y);

    // Competency snapshot
    y = sectionHeader(doc, 'Competency Analysis', 'Competency Snapshot', 'Your six leadership dimensions shown as a continuous score profile.', y);
    let competencyPanelH = 26;
    for (const comp of competencies) {
      competencyPanelH += 36 + measure(doc, safeText(comp.deepDive), CONTENT_W - 160, 8.5);
    }
    roundedPanel(doc, MARGIN, y, CONTENT_W, competencyPanelH, C.panel, C.stroke, 18);
    let innerY = y + 18;
    for (const comp of competencies) {
      const color = levelColor(comp.level);
      writeText(doc, comp.name, MARGIN + 18, innerY, {
        width: 180,
        size: 10,
        font: 'Helvetica-Bold',
        color: C.text,
      });
      writeText(doc, `${comp.score}/100 · ${safeText(comp.level)}`, PAGE_W - MARGIN - 96, innerY, {
        width: 78,
        size: 8.5,
        align: 'right',
        color,
      });
      drawProgressBar(doc, MARGIN + 18, innerY + 16, CONTENT_W - 36, comp.score, color);
      innerY = writeText(doc, safeText(comp.deepDive), MARGIN + 18, innerY + 28, {
        width: CONTENT_W - 36,
        size: 8.5,
        color: C.soft,
        lineGap: 1.5,
      }) + 10;
    }
    y += competencyPanelH + 16;

    // Deep dives
    y = sectionHeader(doc, 'Deep Dive', 'Per-Competency Guidance', 'Each competency includes a practical development interpretation and an action bias.', y);
    for (const comp of competencies) {
      const actions = comp.score >= 80
        ? ['Use this as a coaching asset for your team.', 'Translate this strength into visible cross-functional impact.']
        : ['Design one repeatable weekly habit around this skill.', 'Ask for targeted feedback after the next relevant situation.'];
      const compText = safeText(comp.deepDive) || `At the ${safeText(comp.level, 'Developing')} level, this capability is real but not yet consistently leveraged.`;
      const cardH = 84 + measure(doc, compText, CONTENT_W - 170, 9) + actions.length * 16;
      roundedPanel(doc, MARGIN, y, CONTENT_W, cardH, '#101012', C.stroke, 16);
      doc.save();
      doc.circle(MARGIN + 34, y + 34, 18).lineWidth(3).strokeColor(levelColor(comp.level)).stroke();
      doc.restore();
      doc.font('Helvetica-Bold').fontSize(12).fillColor(C.text).text(String(comp.score || 0), MARGIN + 19, y + 27, {
        width: 30,
        align: 'center',
        lineBreak: false,
      });
      writeText(doc, comp.name, MARGIN + 68, y + 18, {
        width: CONTENT_W - 150,
        size: 11,
        font: 'Helvetica-Bold',
        color: C.text,
      });
      writeText(doc, safeText(comp.level), MARGIN + 68, y + 34, {
        width: 120,
        size: 8.5,
        color: levelColor(comp.level),
      });
      let cardY = writeText(doc, compText, MARGIN + 68, y + 48, {
        width: CONTENT_W - 86,
        size: 9,
        color: C.soft,
        lineGap: 2,
      }) + 8;
      cardY = drawBulletList(doc, actions, MARGIN + 68, cardY, CONTENT_W - 86, {
        bullet: '→',
        size: 8.5,
        color: C.muted,
        bulletColor: C.green,
        gap: 4,
      });
      y += cardH + 14;
    }

    y = drawDivider(doc, y);

    // Archetype
    y = sectionHeader(doc, 'Archetype', safeText(analysis.archetype?.name, 'The Scaling Builder'), safeText(analysis.archetype?.description), y);
    const traitBottom = y + 12;
    const traits = safeArray(analysis.archetype?.traits, ['Builder mindset', 'Execution discipline', 'High ownership']);
    const traitsEndY = drawChipRow(doc, traits, MARGIN, traitBottom, CONTENT_W);
    y = traitsEndY + 18;

    const colW = (CONTENT_W - 16) / 2;
    const leftItems = blindSpots.length ? blindSpots : [
      'Over-indexing on personal execution when team ownership would create more leverage.',
      'Translating status updates into strategic narratives only after being asked.',
      'Stepping in early before others fully own the outcome.',
    ];
    const rightItems = strengthLevers.length ? strengthLevers : [
      'Operational discipline that can become a scalable team rhythm.',
      'High standards that can be turned into coaching expectations.',
      'A strong instinct for building systems, not just solving tasks.',
    ];
    const leftH = 42 + leftItems.reduce((sum, item) => sum + measure(doc, item, colW - 32, 8.5) + 8, 0);
    const rightH = 42 + rightItems.reduce((sum, item) => sum + measure(doc, item, colW - 32, 8.5) + 8, 0);
    const insightH = Math.max(leftH, rightH);
    roundedPanel(doc, MARGIN, y, colW, insightH, C.panel, C.stroke, 16);
    roundedPanel(doc, MARGIN + colW + 16, y, colW, insightH, C.panel, C.stroke, 16);
    writeLabel(doc, 'Blind Spots', MARGIN + 16, y + 14, C.red);
    writeLabel(doc, 'Strength Levers', MARGIN + colW + 32, y + 14, C.green);
    drawBulletList(doc, leftItems, MARGIN + 16, y + 28, colW - 32, {
      bullet: '•',
      size: 8.5,
      color: C.soft,
      bulletColor: C.red,
      gap: 5,
    });
    drawBulletList(doc, rightItems, MARGIN + colW + 32, y + 28, colW - 32, {
      bullet: '•',
      size: 8.5,
      color: C.soft,
      bulletColor: C.green,
      gap: 5,
    });
    y += insightH + 18;

    // Growth areas
    y = sectionHeader(doc, 'Priority Moves', 'Top Growth Areas', 'These are the upgrades most likely to change how your leadership is perceived and experienced.', y);
    for (let i = 0; i < topGrowthAreas.length; i += 1) {
      const area = topGrowthAreas[i];
      const steps = safeArray(area.actionSteps, []);
      const blockH = 74 + measure(doc, safeText(area.description), CONTENT_W - 64, 9.5) + steps.reduce((sum, step) => sum + measure(doc, step, CONTENT_W - 76, 8.5) + 6, 0);
      roundedPanel(doc, MARGIN, y, CONTENT_W, blockH, C.panel, C.stroke, 16);
      doc.save();
      doc.roundedRect(MARGIN + 16, y + 16, 24, 24, 8).fill('#0f172a');
      doc.restore();
      doc.font('Helvetica-Bold').fontSize(12).fillColor(C.text).text(String(i + 1), MARGIN + 16, y + 22, { width: 24, align: 'center', lineBreak: false });
      writeText(doc, safeText(area.title, `Growth Area ${i + 1}`), MARGIN + 52, y + 16, {
        width: CONTENT_W - 68,
        size: 12,
        font: 'Helvetica-Bold',
        color: C.text,
      });
      let gy = writeText(doc, safeText(area.description), MARGIN + 52, y + 34, {
        width: CONTENT_W - 68,
        size: 9.5,
        color: C.muted,
        lineGap: 2,
      }) + 8;
      gy = drawBulletList(doc, steps, MARGIN + 52, gy, CONTENT_W - 68, {
        bullet: '→',
        size: 8.5,
        color: C.soft,
        bulletColor: C.green,
        gap: 4,
      });
      y += blockH + 14;
    }

    y = drawDivider(doc, y);

    // Roadmap
    y = sectionHeader(doc, 'Roadmap', '90-Day Leadership Plan', 'A sequenced operating plan across three months so progress compounds instead of scattering.', y);
    for (const [index, data] of roadmapCards.entries()) {
      const actions = safeArray(data.actions, []);
      const cardH = 74 + actions.reduce((sum, item) => sum + measure(doc, item, CONTENT_W - 80, 8.5) + 6, 0);
      roundedPanel(doc, MARGIN, y, CONTENT_W, cardH, '#101012', C.stroke, 16);
      writeLabel(doc, `Month ${index + 1} · ${safeText(data.theme, 'Focus')}`, MARGIN + 18, y + 16, C.green);
      writeText(doc, safeText(data.title, `Month ${index + 1}`), MARGIN + 18, y + 28, {
        width: CONTENT_W - 36,
        size: 12,
        font: 'Helvetica-Bold',
        color: C.text,
      });
      drawBulletList(doc, actions, MARGIN + 18, y + 48, CONTENT_W - 36, {
        bullet: '•',
        size: 8.5,
        color: C.soft,
        bulletColor: C.accent,
        gap: 4,
      });
      y += cardH + 14;
    }

    // Cadence + metrics
    y = sectionHeader(doc, 'Operating System', 'Cadence and Scorecards', 'The routines and metrics that will tell you whether leadership growth is actually showing up in your behaviour.', y);
    const cadenceItems = [
      `Daily: ${dailyCadence.join(' · ')}`,
      `Weekly: ${weeklyCadence.join(' · ')}`,
      `Monthly: ${monthlyCadence.join(' · ')}`,
    ];
    const cadenceH = 44 + cadenceItems.reduce((sum, item) => sum + measure(doc, item, CONTENT_W - 32, 8.5) + 6, 0);
    roundedPanel(doc, MARGIN, y, CONTENT_W, cadenceH, C.panel, C.stroke, 16);
    writeLabel(doc, 'Operating Cadence', MARGIN + 16, y + 14, C.green);
    drawBulletList(doc, cadenceItems, MARGIN + 16, y + 28, CONTENT_W - 32, {
      bullet: '•',
      size: 8.5,
      color: C.soft,
      bulletColor: C.green,
      gap: 4,
    });
    y += cadenceH + 14;

    const kpiHeight = 40 + kpis.length * 22;
    roundedPanel(doc, MARGIN, y, CONTENT_W, kpiHeight, C.panel, C.stroke, 16);
    writeLabel(doc, 'Weekly KPIs', MARGIN + 16, y + 14, C.green);
    let kpiY = y + 30;
    for (let i = 0; i < kpis.length; i += 1) {
      const score = 52 + ((i * 11) % 40);
      writeText(doc, safeText(kpis[i]), MARGIN + 16, kpiY, {
        width: CONTENT_W - 120,
        size: 8.5,
        color: C.soft,
      });
      drawProgressBar(doc, PAGE_W - MARGIN - 92, kpiY + 3, 76, score, i % 2 === 0 ? C.green : C.accent);
      kpiY += 22;
    }
    y += kpiHeight + 18;

    // Stakeholders and sprint
    y = sectionHeader(doc, 'Execution Layer', 'Stakeholder Playbook and First 7 Days', 'Use these as immediate execution tools rather than inspirational reading.', y);
    const stakeholderH = 46 + stakeholderPlaybook.reduce((sum, item) => sum + measure(doc, item, CONTENT_W - 32, 8.5) + 6, 0);
    roundedPanel(doc, MARGIN, y, CONTENT_W, stakeholderH, C.panel, C.stroke, 16);
    writeLabel(doc, 'Stakeholder Playbook', MARGIN + 16, y + 14, C.green);
    drawBulletList(doc, stakeholderPlaybook, MARGIN + 16, y + 28, CONTENT_W - 32, {
      bullet: '→',
      size: 8.5,
      color: C.soft,
      bulletColor: C.accent,
      gap: 4,
    });
    y += stakeholderH + 14;

    const sprintH = 46 + firstWeekPlan.reduce((sum, item) => sum + measure(doc, item, CONTENT_W - 40, 8.5) + 8, 0);
    roundedPanel(doc, MARGIN, y, CONTENT_W, sprintH, '#101012', C.stroke, 16);
    writeLabel(doc, 'First 7-Day Sprint', MARGIN + 16, y + 14, C.green);
    let sprintY = y + 30;
    firstWeekPlan.forEach((item, index) => {
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(C.text).text(`Day ${index + 1}`, MARGIN + 16, sprintY, {
        lineBreak: false,
      });
      sprintY = writeText(doc, safeText(item), MARGIN + 54, sprintY, {
        width: CONTENT_W - 70,
        size: 8.5,
        color: C.soft,
      }) + 6;
    });
    y += sprintH + 18;

    // Close
    y = sectionHeader(doc, 'Close-Out', 'Communication Script and 90-Day Outcome', 'A final narrative layer you can reuse immediately with your manager and senior stakeholders.', y);
    const scriptH = measure(doc, safeText(analysis.communicationScript), CONTENT_W - 36, 9.5) + 52;
    roundedPanel(doc, MARGIN, y, CONTENT_W, scriptH, C.panel, C.stroke, 16);
    writeLabel(doc, 'Executive Update Template', MARGIN + 18, y + 14, C.green);
    writeText(doc, safeText(analysis.communicationScript), MARGIN + 18, y + 30, {
      width: CONTENT_W - 36,
      size: 9.5,
      color: C.muted,
      lineGap: 3,
    });
    y += scriptH + 14;

    const outcomeText = safeText(analysis.ninetyDayOutcome, 'Consistent execution of this plan should shift your role from problem-solver to force multiplier.');
    const outcomeH = measure(doc, outcomeText, CONTENT_W - 36, 9.5) + 52;
    roundedPanel(doc, MARGIN, y, CONTENT_W, outcomeH, '#101012', C.stroke, 16);
    writeLabel(doc, 'Projected 90-Day Outcome', MARGIN + 18, y + 14, C.green);
    writeText(doc, outcomeText, MARGIN + 18, y + 30, {
      width: CONTENT_W - 36,
      size: 9.5,
      color: C.muted,
      lineGap: 3,
    });
    y += outcomeH + 18;

    doc.save();
    doc.rect(MARGIN, y, CONTENT_W, 1).fill(C.stroke);
    doc.restore();
    writeText(doc, `CAREERA · Leadership Report · ${date}`, MARGIN, y + 10, {
      width: CONTENT_W,
      size: 8,
      color: C.faint,
      align: 'center',
    });

    doc.end();
  });
}
