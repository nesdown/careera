// reportPdf.js — Careera Premium Leadership Report Generator
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const PDFDocument = require('pdfkit');

const C = {
  black: '#0a0a0a', white: '#ffffff', green: '#22c55e',
  zinc900: '#18181b', zinc700: '#3f3f46', zinc500: '#71717a',
  zinc200: '#e4e4e7', zinc100: '#f4f4f5', zinc50: '#fafafa',
};

const PAGE_W = 595.28, PAGE_H = 841.89, MARGIN = 48, INNER_W = 595.28 - 48 * 2, FOOTER_H = 32, TOTAL_PAGES = 13;

function roundRect(doc, x, y, w, h, r, fill) {
  doc.save().roundedRect(x, y, w, h, r).fill(fill).restore();
}

function pageHeader(doc, label) {
  doc.save().rect(0, 0, PAGE_W, 44).fill(C.black).restore();
  doc.save().rect(0, 44, PAGE_W, 3).fill(C.green).restore();
  doc.font('Helvetica-Bold').fontSize(11).fillColor(C.white).text('CAREERA', MARGIN, 15, { lineBreak: false });
  if (label) doc.font('Helvetica').fontSize(9).fillColor(C.green).text(label.toUpperCase(), MARGIN + 80, 17, { lineBreak: false });
}

function pageFooter(doc, pageNum, total) {
  const y = PAGE_H - FOOTER_H;
  doc.save().rect(0, y, PAGE_W, 1).fill(C.zinc200).restore();
  doc.font('Helvetica').fontSize(8).fillColor(C.zinc500)
     .text('Confidential — Prepared by Careera', MARGIN, y + 10, { lineBreak: false })
     .text(`${pageNum} / ${total}`, 0, y + 10, { align: 'right', width: PAGE_W - MARGIN });
}

function sectionTitle(doc, text, y) {
  doc.font('Helvetica-Bold').fontSize(14).fillColor(C.zinc900).text(text, MARGIN, y);
  const tw = Math.min(doc.widthOfString(text) + 12, INNER_W);
  doc.save().rect(MARGIN, y + 18, tw, 3).fill(C.green).restore();
  return y + 28;
}

function bodyText(doc, text, x, y, opts = {}) {
  doc.font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
     .fontSize(opts.size || 10).fillColor(opts.color || C.zinc700)
     .text(text, x, y, { width: opts.width || INNER_W, lineBreak: true, align: 'left' });
  return doc.y + (opts.gap !== undefined ? opts.gap : 6);
}

function scoreBar(doc, x, y, score, maxW) {
  const h = 8, r = 4, filled = Math.round((score / 100) * maxW);
  roundRect(doc, x, y, maxW, h, r, C.zinc200);
  if (filled > 0) {
    const fc = score >= 80 ? C.green : score >= 65 ? '#86efac' : '#fbbf24';
    roundRect(doc, x, y, Math.max(filled, r * 2), h, r, fc);
  }
}

function levelColor(level) {
  return { Advanced: C.green, Strong: '#86efac', Developing: '#fbbf24', Emerging: '#f87171' }[level] || C.zinc500;
}

function divider(doc, y) {
  doc.save().rect(MARGIN, y, INNER_W, 1).fill(C.zinc200).restore();
  return y + 12;
}

function ensureSpace(doc, y, needed) {
  if (y + needed > PAGE_H - FOOTER_H - 20) { doc.addPage(); return 64; }
  return y;
}

export function generatePdfBuffer(analysis) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true });
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const sorted = [...analysis.competencies].sort((a, b) => b.score - a.score);
    const strongest = sorted[0], weakest = sorted[sorted.length - 1];

    // PAGE 1: Cover
    doc.rect(0, 0, PAGE_W, PAGE_H).fill(C.black);
    doc.rect(0, 0, PAGE_W, 6).fill(C.green);
    doc.font('Helvetica-Bold').fontSize(16).fillColor(C.white).text('CAREERA', MARGIN, 36);
    doc.font('Helvetica').fontSize(10).fillColor(C.green).text('LEADERSHIP INTELLIGENCE', MARGIN, 56);
    doc.font('Helvetica-Bold').fontSize(34).fillColor(C.white).text('Leadership\nReadiness\nReport', MARGIN, PAGE_H / 2 - 80);
    const cx = PAGE_W - MARGIN - 90, cy = PAGE_H / 2 - 60;
    roundRect(doc, cx - 50, cy - 50, 100, 100, 50, C.zinc900);
    doc.save().roundedRect(cx - 50, cy - 50, 100, 100, 50).lineWidth(2).strokeColor(C.green).stroke().restore();
    doc.font('Helvetica-Bold').fontSize(36).fillColor(C.green).text(`${analysis.leadershipScore}`, cx - 40, cy - 20, { width: 80, align: 'center', lineBreak: false });
    doc.font('Helvetica').fontSize(9).fillColor(C.zinc500).text('/ 100', cx - 40, cy + 18, { width: 80, align: 'center', lineBreak: false });
    const metaY = PAGE_H - 140;
    doc.save().rect(MARGIN, metaY, INNER_W, 1).fill(C.zinc700).restore();
    doc.font('Helvetica').fontSize(9).fillColor(C.zinc500)
       .text('DATE', MARGIN, metaY + 12, { lineBreak: false })
       .text('STAGE', MARGIN + 180, metaY + 12, { lineBreak: false })
       .text('ARCHETYPE', MARGIN + 380, metaY + 12, { lineBreak: false });
    doc.font('Helvetica-Bold').fontSize(10).fillColor(C.white)
       .text(date, MARGIN, metaY + 26, { lineBreak: false })
       .text(analysis.leadershipStage, MARGIN + 180, metaY + 26, { lineBreak: false, width: 180 })
       .text(analysis.archetype.name, MARGIN + 380, metaY + 26, { lineBreak: false, width: 150 });

    // PAGE 2: Executive Summary
    doc.addPage();
    pageHeader(doc, 'Executive Summary');
    let y = 70;
    y = sectionTitle(doc, 'Executive Summary', y);
    y += 8;

    roundRect(doc, MARGIN, y, INNER_W, 64, 8, C.zinc100);
    doc.font('Helvetica-Bold').fontSize(28).fillColor(C.green).text(`${analysis.leadershipScore}`, MARGIN + 18, y + 10, { lineBreak: false });
    doc.font('Helvetica').fontSize(10).fillColor(C.zinc500).text('/ 100', MARGIN + 62, y + 22, { lineBreak: false });
    doc.font('Helvetica-Bold').fontSize(11).fillColor(C.zinc900).text(analysis.leadershipStage, MARGIN + 100, y + 12);
    doc.font('Helvetica').fontSize(9).fillColor(C.zinc500).text(`Strongest: ${strongest.name} (${strongest.score})  ·  Focus: ${weakest.name} (${weakest.score})`, MARGIN + 100, y + 28);
    doc.font('Helvetica').fontSize(9).fillColor(C.green).text(`Archetype: ${analysis.archetype.name}`, MARGIN + 100, y + 44);
    y += 80;

    y = bodyText(doc, analysis.executiveSummary, MARGIN, y, { size: 10.5, gap: 10 });
    y = divider(doc, y + 4);
    y = sectionTitle(doc, 'Key Insight', y);
    y += 8;
    roundRect(doc, MARGIN, y, INNER_W, 52, 6, C.zinc900);
    doc.font('Helvetica-Bold').fontSize(12).fillColor(C.green).text(`"${analysis.keyInsight}"`, MARGIN + 16, y + 12, { width: INNER_W - 32, align: 'center' });
    y += 68;
    y = divider(doc, y + 4);
    y = sectionTitle(doc, '90-Day Projected Outcome', y);
    y += 8;
    bodyText(doc, analysis.ninetyDayOutcome, MARGIN, y, { size: 10.5 });
    pageFooter(doc, 2, TOTAL_PAGES);

    // PAGE 3: Competency Scores
    doc.addPage();
    pageHeader(doc, 'Competency Analysis');
    y = 70;
    y = sectionTitle(doc, 'Leadership Competency Scores', y);
    y += 12;

    for (const comp of analysis.competencies) {
      y = ensureSpace(doc, y, 56);
      roundRect(doc, MARGIN, y, INNER_W, 52, 6, C.zinc50);
      doc.save().roundedRect(MARGIN, y, INNER_W, 52, 6).lineWidth(0.5).strokeColor(C.zinc200).stroke().restore();
      const lc = levelColor(comp.level);
      doc.font('Helvetica-Bold').fontSize(11).fillColor(C.zinc900).text(comp.name, MARGIN + 14, y + 10, { lineBreak: false });
      roundRect(doc, MARGIN + 14, y + 28, doc.font('Helvetica-Bold').fontSize(8).widthOfString(comp.level.toUpperCase()) + 16, 16, 4, lc + '33');
      doc.font('Helvetica-Bold').fontSize(8).fillColor(lc).text(comp.level.toUpperCase(), MARGIN + 22, y + 32, { lineBreak: false });
      const barX = PAGE_W / 2 - 20, barW = INNER_W / 2 - 14;
      doc.font('Helvetica-Bold').fontSize(18).fillColor(lc).text(`${comp.score}`, barX + barW + 8, y + 14, { lineBreak: false });
      scoreBar(doc, barX, y + 20, comp.score, barW);
      y += 62;
    }

    y = divider(doc, y + 8);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(C.zinc500).text('SCORE KEY:', MARGIN, y);
    let tx = MARGIN + 80;
    for (const t of [{l:'Advanced (85+)',c:C.green},{l:'Strong (75–84)',c:'#86efac'},{l:'Developing (65–74)',c:'#fbbf24'},{l:'Emerging (<65)',c:'#f87171'}]) {
      roundRect(doc, tx, y - 1, 8, 8, 2, t.c);
      doc.font('Helvetica').fontSize(9).fillColor(C.zinc700).text(t.l, tx + 12, y, { lineBreak: false });
      tx += 130;
    }
    pageFooter(doc, 3, TOTAL_PAGES);

    // PAGES 4-5: Deep Dives
    for (let pass = 0; pass < 2; pass++) {
      doc.addPage();
      pageHeader(doc, 'Competency Deep Dives');
      y = 70;
      if (pass === 0) y = sectionTitle(doc, 'Competency Deep Dives', y);
      y += 8;

      const slice = pass === 0 ? analysis.competencies.slice(0, 3) : analysis.competencies.slice(3);
      for (const comp of slice) {
        y = ensureSpace(doc, y, 100);
        roundRect(doc, MARGIN, y, INNER_W, 16, 0, C.zinc900);
        roundRect(doc, MARGIN, y, 4, 16, 0, levelColor(comp.level));
        doc.font('Helvetica-Bold').fontSize(10).fillColor(C.white).text(comp.name, MARGIN + 12, y + 3, { lineBreak: false });
        doc.font('Helvetica').fontSize(9).fillColor(C.green).text(`${comp.score}/100 · ${comp.level}`, MARGIN + 12, y + 3, { align: 'right', width: INNER_W - 24, lineBreak: false });
        y += 24;
        const dd = comp.deepDive || `At the ${comp.level} level, your performance in ${comp.name} reflects solid capability with targeted growth opportunities.`;
        y = bodyText(doc, dd, MARGIN, y, { size: 10, gap: 4 });
        const adv = { Advanced: '→ Role model. Scale this skill across your team.', Strong: '→ Make it visible to senior leadership. Mentor others.', Developing: '→ Deliberate practice. Seek feedback after each interaction.', Emerging: '→ One habit change per week. Consistency over intensity.' };
        y = bodyText(doc, adv[comp.level] || '', MARGIN, y, { size: 9, color: C.green, gap: 14 });
        y = divider(doc, y);
      }

      if (pass === 1) {
        // Archetype on page 5
        y = ensureSpace(doc, y, 140);
        y = sectionTitle(doc, `Your Archetype: ${analysis.archetype.name}`, y);
        y += 8;
        y = bodyText(doc, analysis.archetype.description, MARGIN, y, { size: 10.5, gap: 10 });
        doc.font('Helvetica-Bold').fontSize(9).fillColor(C.zinc500).text('CORE TRAITS', MARGIN, y);
        y += 14;
        let chipX = MARGIN;
        for (const trait of analysis.archetype.traits) {
          const cw = doc.font('Helvetica').fontSize(8).widthOfString(trait) + 20;
          if (chipX + cw > PAGE_W - MARGIN) { chipX = MARGIN; y += 22; }
          roundRect(doc, chipX, y, cw, 18, 9, C.zinc900);
          doc.font('Helvetica').fontSize(8).fillColor(C.green).text(trait, chipX + 10, y + 5, { lineBreak: false });
          chipX += cw + 8;
        }
      }

      pageFooter(doc, 4 + pass, TOTAL_PAGES);
    }

    // PAGE 6: Blind Spots + Growth Areas
    doc.addPage();
    pageHeader(doc, 'Self-Awareness');
    y = 70;
    const colW = (INNER_W - 20) / 2;

    doc.font('Helvetica-Bold').fontSize(13).fillColor(C.zinc900).text('Blind Spots', MARGIN, y);
    doc.save().rect(MARGIN, y + 16, 40, 3).fill('#f87171').restore();
    doc.font('Helvetica-Bold').fontSize(13).fillColor(C.zinc900).text('Strength Levers', MARGIN + colW + 20, y);
    doc.save().rect(MARGIN + colW + 20, y + 16, 56, 3).fill(C.green).restore();
    y += 28;

    let leftY = y, rightY = y;
    for (let i = 0; i < Math.max(analysis.blindSpots.length, analysis.strengthLevers.length); i++) {
      if (analysis.blindSpots[i]) {
        roundRect(doc, MARGIN, leftY, colW, 2, 0, '#fff7f7');
        doc.save().roundedRect(MARGIN, leftY, colW, 2, 0).lineWidth(0.5).strokeColor('#fee2e2').stroke().restore();
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#ef4444').text(`${i + 1}`, MARGIN + 8, leftY + 7, { lineBreak: false });
        doc.font('Helvetica').fontSize(9).fillColor(C.zinc700).text(analysis.blindSpots[i], MARGIN + 22, leftY + 6, { width: colW - 30 });
        leftY = doc.y + 8;
      }
      if (analysis.strengthLevers[i]) {
        roundRect(doc, MARGIN + colW + 20, rightY, colW, 2, 0, '#f0fdf4');
        doc.save().roundedRect(MARGIN + colW + 20, rightY, colW, 2, 0).lineWidth(0.5).strokeColor('#dcfce7').stroke().restore();
        doc.font('Helvetica-Bold').fontSize(9).fillColor(C.green).text(`${i + 1}`, MARGIN + colW + 28, rightY + 7, { lineBreak: false });
        doc.font('Helvetica').fontSize(9).fillColor(C.zinc700).text(analysis.strengthLevers[i], MARGIN + colW + 42, rightY + 6, { width: colW - 30 });
        rightY = doc.y + 8;
      }
    }

    y = Math.max(leftY, rightY) + 12;
    y = divider(doc, y);
    y = sectionTitle(doc, 'Priority Growth Areas', y);
    y += 8;

    for (let i = 0; i < analysis.topGrowthAreas.length; i++) {
      const area = analysis.topGrowthAreas[i];
      y = ensureSpace(doc, y, 80);
      roundRect(doc, MARGIN, y, 24, 24, 4, C.green);
      doc.font('Helvetica-Bold').fontSize(12).fillColor(C.white).text(`${i + 1}`, MARGIN, y + 6, { width: 24, align: 'center', lineBreak: false });
      doc.font('Helvetica-Bold').fontSize(11).fillColor(C.zinc900).text(area.title, MARGIN + 32, y + 5);
      y = doc.y + 4;
      y = bodyText(doc, area.description, MARGIN + 32, y, { size: 9.5, gap: 4, width: INNER_W - 32 });
      for (const step of area.actionSteps) {
        y = ensureSpace(doc, y, 18);
        doc.font('Helvetica').fontSize(9).fillColor(C.zinc500).text('→', MARGIN + 32, y, { lineBreak: false });
        doc.font('Helvetica').fontSize(9).fillColor(C.zinc700).text(step, MARGIN + 46, y, { width: INNER_W - 46 });
        y = doc.y + 4;
      }
      y += 8;
    }
    pageFooter(doc, 6, TOTAL_PAGES);

    // PAGE 7: Stakeholder + KPIs
    doc.addPage();
    pageHeader(doc, 'Stakeholder Strategy');
    y = 70;
    y = sectionTitle(doc, 'Stakeholder Management Playbook', y);
    y += 8;

    for (let i = 0; i < analysis.stakeholderPlaybook.length; i++) {
      y = ensureSpace(doc, y, 40);
      roundRect(doc, MARGIN, y, INNER_W, 2, 0, C.zinc50);
      doc.save().roundedRect(MARGIN, y, INNER_W, 2, 0).lineWidth(0.5).strokeColor(C.zinc200).stroke().restore();
      roundRect(doc, MARGIN, y, 4, 2, 0, C.green);
      doc.font('Helvetica-Bold').fontSize(10).fillColor(C.green).text(`${i + 1}.`, MARGIN + 12, y + 8, { lineBreak: false });
      doc.font('Helvetica').fontSize(10).fillColor(C.zinc700).text(analysis.stakeholderPlaybook[i], MARGIN + 28, y + 8, { width: INNER_W - 36 });
      y = doc.y + 10;
    }

    y = divider(doc, y + 8);
    y = sectionTitle(doc, 'Weekly Leadership KPIs', y);
    y += 8;

    const kpiColW = (INNER_W - 16) / 2;
    let kpiBaseY = y;
    for (let i = 0; i < analysis.kpis.length; i++) {
      const isRight = i % 2 === 1;
      const kX = isRight ? MARGIN + kpiColW + 16 : MARGIN;
      const kY = kpiBaseY;
      roundRect(doc, kX, kY, kpiColW, 44, 6, C.zinc50);
      doc.save().roundedRect(kX, kY, kpiColW, 44, 6).lineWidth(0.5).strokeColor(C.zinc200).stroke().restore();
      doc.font('Helvetica-Bold').fontSize(9).fillColor(C.green).text(`KPI ${i + 1}`, kX + 10, kY + 8, { lineBreak: false });
      doc.font('Helvetica').fontSize(9).fillColor(C.zinc700).text(analysis.kpis[i], kX + 10, kY + 22, { width: kpiColW - 20 });
      if (isRight) kpiBaseY += 54;
    }
    pageFooter(doc, 7, TOTAL_PAGES);

    // PAGE 8: Operating Cadence & Metrics
    doc.addPage();
    pageHeader(doc, 'Operating System');
    y = 70;
    y = sectionTitle(doc, 'Your Operating Cadence', y);
    y += 8;

    const cadenceSections = [
      { title: 'Daily Operating Rituals', items: analysis.operatingCadence.daily, accent: C.green },
      { title: 'Weekly Operating Rhythm', items: analysis.operatingCadence.weekly, accent: '#86efac' },
      { title: 'Monthly Strategic Reviews', items: analysis.operatingCadence.monthly, accent: '#34d399' },
    ];

    cadenceSections.forEach((block) => {
      y = ensureSpace(doc, y, 90);
      roundRect(doc, MARGIN, y, INNER_W, 54, 10, C.zinc50);
      doc.save().roundedRect(MARGIN, y, INNER_W, 54, 10).stroke(C.zinc200).lineWidth(0.5).stroke().restore();
      doc.font('Helvetica-Bold').fontSize(11).fillColor(block.accent).text(block.title, MARGIN + 18, y + 10);
      const list = block.items || [];
      doc.font('Helvetica').fontSize(9.5).fillColor(C.zinc700)
        .text(list[0] || '', MARGIN + 18, y + 30, { width: INNER_W - 36 });
      if (list[1]) doc.text(list[1], MARGIN + 18, doc.y + 4, { width: INNER_W - 36 });
      if (list[2]) doc.text(list[2], MARGIN + 18, doc.y + 4, { width: INNER_W - 36 });
      y = doc.y + 12;
    });

    y = divider(doc, y);
    y = sectionTitle(doc, 'Leadership Metrics Dashboard', y);
    y += 8;

    const metricsPairs = [
      { label: 'Leading Indicators', values: analysis.metricsDashboard.leadingIndicators, color: C.green },
      { label: 'Lagging Indicators', values: analysis.metricsDashboard.laggingIndicators, color: '#fde047' },
    ];

    metricsPairs.forEach((set) => {
      y = ensureSpace(doc, y, 80);
      doc.font('Helvetica-Bold').fontSize(11).fillColor(set.color).text(set.label.toUpperCase(), MARGIN, y);
      y += 6;
      set.values.forEach((metric) => {
        y = ensureSpace(doc, y, 24);
        roundRect(doc, MARGIN, y, INNER_W, 36, 6, C.zinc900);
        roundRect(doc, MARGIN, y, 4, 36, 0, set.color);
        doc.font('Helvetica').fontSize(9.5).fillColor(C.white).text(metric, MARGIN + 14, y + 10, { width: INNER_W - 28 });
        y += 42;
      });
      y += 6;
    });

    pageFooter(doc, 8, TOTAL_PAGES);

    // PAGE 9: Decision Matrix & Risks
    doc.addPage();
    pageHeader(doc, 'Strategic Decisions');
    y = 70;
    y = sectionTitle(doc, 'Decision Matrix', y);
    y += 8;

    const matrixCols = [
      { title: 'Immediate Wins (next 14 days)', items: analysis.decisionMatrix.immediateWins, color: C.green },
      { title: 'Strategic Bets (next 90 days)', items: analysis.decisionMatrix.strategicBets, color: '#fbbf24' },
    ];

    matrixCols.forEach((col, idx) => {
      const colX = idx === 0 ? MARGIN : MARGIN + INNER_W / 2 + 12;
      const colW = INNER_W / 2 - 12;
      roundRect(doc, colX, y, colW, 40, 8, C.zinc900);
      doc.font('Helvetica-Bold').fontSize(11).fillColor(col.color).text(col.title, colX + 14, y + 12, { width: colW - 28 });
      let innerY = y + 54;
      col.items.forEach((item, itemIdx) => {
        roundRect(doc, colX, innerY, colW, 32, 6, C.zinc50);
        doc.font('Helvetica').fontSize(9).fillColor(C.zinc700).text(`${itemIdx + 1}. ${item}`, colX + 12, innerY + 9, { width: colW - 24 });
        innerY += 38;
      });
    });

    y += 54 + Math.max(matrixCols[0].items.length, matrixCols[1].items.length) * 38 + 6;
    y = divider(doc, y);
    y = sectionTitle(doc, 'Risk Register', y);
    y += 8;

    analysis.riskRegister.forEach((risk) => {
      y = ensureSpace(doc, y, 70);
      roundRect(doc, MARGIN, y, INNER_W, 60, 8, '#1c1917');
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#f87171').text(risk.risk, MARGIN + 16, y + 10, { width: INNER_W - 32 });
      doc.font('Helvetica').fontSize(9).fillColor(C.zinc500).text(`Impact: ${risk.impact}  •  Owner: ${risk.owner}`, MARGIN + 16, y + 26);
      doc.font('Helvetica').fontSize(9.5).fillColor(C.zinc200).text(risk.mitigation, MARGIN + 16, y + 38, { width: INNER_W - 32 });
      y += 72;
    });

    pageFooter(doc, 9, TOTAL_PAGES);

    // PAGE 10: Talent Plan & Meeting Blueprint
    doc.addPage();
    pageHeader(doc, 'People Systems');
    y = 70;
    y = sectionTitle(doc, 'Talent Acceleration Plan', y);
    y += 8;

    const talentBuckets = [
      { label: 'Accelerate', items: analysis.talentPlan.accelerate, accent: C.green },
      { label: 'Stabilize', items: analysis.talentPlan.stabilize, accent: '#fbbf24' },
      { label: 'Delegate', items: analysis.talentPlan.delegate, accent: '#a855f7' },
    ];

    talentBuckets.forEach((bucket) => {
      y = ensureSpace(doc, y, 90);
      doc.font('Helvetica-Bold').fontSize(11).fillColor(bucket.accent).text(bucket.label.toUpperCase(), MARGIN, y);
      y += 6;
      bucket.items.forEach((item) => {
        roundRect(doc, MARGIN, y, INNER_W, 32, 6, C.zinc50);
        doc.font('Helvetica').fontSize(9).fillColor(C.zinc700).text(item, MARGIN + 12, y + 9, { width: INNER_W - 24 });
        y += 38;
      });
      y += 4;
    });

    y = divider(doc, y);
    y = sectionTitle(doc, 'Meeting Blueprint', y);
    y += 8;

    const meetingBlocks = [
      { title: 'Team Sync', data: analysis.meetingBlueprint.team, color: C.green },
      { title: 'Leadership Update', data: analysis.meetingBlueprint.leadership, color: '#fbbf24' },
      { title: 'Stakeholder Forum', data: analysis.meetingBlueprint.stakeholder, color: '#38bdf8' },
    ];

    meetingBlocks.forEach((meeting) => {
      y = ensureSpace(doc, y, 110);
      roundRect(doc, MARGIN, y, INNER_W, 90, 10, C.zinc900);
      roundRect(doc, MARGIN, y, 6, 90, 10, meeting.color);
      doc.font('Helvetica-Bold').fontSize(11).fillColor(meeting.color).text(meeting.title, MARGIN + 14, y + 10);
      doc.font('Helvetica').fontSize(9).fillColor(C.zinc500)
        .text(`Purpose: ${meeting.data.purpose}`, MARGIN + 14, y + 28, { width: INNER_W - 28 });
      doc.font('Helvetica').fontSize(9).fillColor(C.zinc500)
        .text(`Cadence: ${meeting.data.cadence}`, MARGIN + 14, doc.y + 6, { width: INNER_W - 28 });
      doc.font('Helvetica').fontSize(9).fillColor(C.zinc300)
        .text('Agenda:', MARGIN + 14, doc.y + 8);
      meeting.data.agenda.forEach((line) => {
        doc.font('Helvetica').fontSize(9).fillColor(C.zinc100)
          .text(`• ${line}`, MARGIN + 26, doc.y + 4, { width: INNER_W - 40 });
      });
      y = doc.y + 12;
    });

    pageFooter(doc, 10, TOTAL_PAGES);

    // PAGE 11: 90-Day Roadmap
    doc.addPage();
    pageHeader(doc, '90-Day Roadmap');
    y = 70;
    y = sectionTitle(doc, '90-Day Leadership Roadmap', y);
    y += 10;

    for (const [idx, m] of [analysis.roadmap.month1, analysis.roadmap.month2, analysis.roadmap.month3].entries()) {
      const mc = [C.green, '#86efac', '#fbbf24'][idx];
      y = ensureSpace(doc, y, 120);
      roundRect(doc, MARGIN, y, INNER_W, 36, 6, C.zinc900);
      roundRect(doc, MARGIN, y, 6, 36, 6, mc);
      doc.font('Helvetica-Bold').fontSize(12).fillColor(mc).text(`MONTH ${idx + 1}`, MARGIN + 16, y + 6, { lineBreak: false });
      doc.font('Helvetica-Bold').fontSize(14).fillColor(C.white).text(m.title, MARGIN + 100, y + 4, { lineBreak: false });
      doc.font('Helvetica').fontSize(9).fillColor(C.zinc500).text(m.theme, MARGIN + 100, y + 22, { lineBreak: false });
      y += 44;
      for (let j = 0; j < m.actions.length; j++) {
        y = ensureSpace(doc, y, 22);
        roundRect(doc, MARGIN + 6, y, 20, 20, 10, mc + '33');
        doc.font('Helvetica-Bold').fontSize(9).fillColor(mc).text(`${j + 1}`, MARGIN + 6, y + 6, { width: 20, align: 'center', lineBreak: false });
        doc.font('Helvetica').fontSize(9.5).fillColor(C.zinc700).text(m.actions[j], MARGIN + 30, y + 6, { width: INNER_W - 30 });
        y = doc.y + 6;
      }
      y += 14;
    }
    pageFooter(doc, 11, TOTAL_PAGES);

    // PAGE 12: First 7 Days
    doc.addPage();
    pageHeader(doc, 'First 7 Days');
    y = 70;
    y = sectionTitle(doc, 'First 7-Day Action Sprint', y);
    y += 8;
    bodyText(doc, 'One focused action per day. Build the habit before you build the system.', MARGIN, y, { size: 10, color: C.zinc500, gap: 16 });
    y = doc.y + 8;

    const dayClrs = [C.green, '#86efac', '#34d399', '#6ee7b7', '#a7f3d0', C.green, '#86efac'];
    for (let i = 0; i < (analysis.firstWeekPlan || []).length; i++) {
      y = ensureSpace(doc, y, 62);
      const dc = dayClrs[i] || C.green;
      roundRect(doc, MARGIN, y, INNER_W, 54, 6, C.zinc50);
      doc.save().roundedRect(MARGIN, y, INNER_W, 54, 6).lineWidth(0.5).strokeColor(C.zinc200).stroke().restore();
      roundRect(doc, MARGIN, y, INNER_W, 18, 0, C.zinc900);
      roundRect(doc, MARGIN, y, 6, 18, 0, dc);
      doc.font('Helvetica-Bold').fontSize(9).fillColor(dc).text(`DAY ${i + 1}`, MARGIN + 14, y + 5, { lineBreak: false });
      doc.font('Helvetica').fontSize(10).fillColor(C.zinc700).text(analysis.firstWeekPlan[i], MARGIN + 14, y + 24, { width: INNER_W - 28 });
      y += 62;
    }
    pageFooter(doc, 12, TOTAL_PAGES);

    // PAGE 13: Communication + CTA
    doc.addPage();
    pageHeader(doc, 'Communication & Next Steps');
    y = 70;
    y = sectionTitle(doc, 'Executive Communication Template', y);
    y += 8;
    bodyText(doc, 'Use this ready-to-send template for monthly updates to senior leadership:', MARGIN, y, { size: 9, color: C.zinc500, gap: 8 });
    y = doc.y + 8;

    roundRect(doc, MARGIN, y, INNER_W, 4, 4, C.zinc100);
    doc.save().roundedRect(MARGIN, y, INNER_W, 4, 4).lineWidth(0.5).strokeColor(C.zinc200).stroke().restore();
    roundRect(doc, MARGIN, y, 4, 4, 0, C.green);
    doc.font('Helvetica').fontSize(9.5).fillColor(C.zinc700).text(analysis.communicationScript || '', MARGIN + 16, y + 12, { width: INNER_W - 32 });
    y = doc.y + 16;

    y = divider(doc, y);
    y = sectionTitle(doc, 'What Happens Next?', y);
    y += 8;

    for (const [i, s] of [
      'Review this report. Identify your top 3 action items and block time in your calendar this week.',
      'Start Day 1 of your 7-Day Sprint today. Small consistent actions compound faster than bursts.',
      'Book your Career Boost Call at careera.cc — get personalized coaching from a leadership expert.',
    ].entries()) {
      y = ensureSpace(doc, y, 48);
      roundRect(doc, MARGIN, y, 28, 28, 14, C.green);
      doc.font('Helvetica-Bold').fontSize(14).fillColor(C.white).text(`${i + 1}`, MARGIN, y + 6, { width: 28, align: 'center', lineBreak: false });
      doc.font('Helvetica').fontSize(10).fillColor(C.zinc700).text(s, MARGIN + 38, y + 7, { width: INNER_W - 38 });
      y = doc.y + 14;
    }

    // Black footer
    const fY = PAGE_H - 90;
    roundRect(doc, 0, fY, PAGE_W, 90, 0, C.black);
    doc.save().rect(0, fY, PAGE_W, 3).fill(C.green).restore();
    doc.font('Helvetica-Bold').fontSize(13).fillColor(C.white).text('careera.cc', 0, fY + 20, { align: 'center', width: PAGE_W });
    doc.font('Helvetica').fontSize(10).fillColor(C.zinc500).text('Your leadership transformation starts today.', 0, fY + 40, { align: 'center', width: PAGE_W });

    pageFooter(doc, 13, TOTAL_PAGES);

    doc.end();
  });
}
