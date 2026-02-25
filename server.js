import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

const distPath = join(__dirname, 'dist');
app.use('/assets', express.static(join(distPath, 'assets'), {
  immutable: true,
  maxAge: '1y',
}));
app.use(express.static(distPath, {
  maxAge: '1h',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    }
  },
}));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const NAPKIN_API_KEY = process.env.NAPKIN_AI_KEY;

function hashString(input = '') {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function normalizeAnalysis(raw, seed) {
  const competencyNames = [
    'Strategic Thinking',
    'Delegation & Empowerment',
    'Coaching & Feedback',
    'Influence & Stakeholder Alignment',
    'Execution & Accountability',
    'Emotional Intelligence',
  ];

  const fallbackCompetencies = competencyNames.map((name, idx) => {
    const score = 64 + ((seed + idx * 17) % 31);
    const level = score >= 85 ? 'Advanced' : score >= 75 ? 'Strong' : score >= 65 ? 'Developing' : 'Emerging';
    return { name, score, level };
  });

  const competencies = Array.isArray(raw?.competencies) && raw.competencies.length >= 4
    ? raw.competencies.slice(0, 6).map((c, idx) => {
      const score = Number(c?.score);
      const safe = Number.isFinite(score) ? Math.max(55, Math.min(95, Math.round(score))) : fallbackCompetencies[idx].score;
      return {
        name: c?.name || fallbackCompetencies[idx].name,
        score: safe,
        level: c?.level || fallbackCompetencies[idx].level,
      };
    })
    : fallbackCompetencies;

  const leadershipScore = Number(raw?.leadershipScore) && Number.isFinite(Number(raw?.leadershipScore))
    ? Math.max(55, Math.min(95, Math.round(Number(raw.leadershipScore))))
    : Math.round(competencies.reduce((sum, c) => sum + c.score, 0) / competencies.length);

  const sanitize = (text, fallback) => {
    if (!text || typeof text !== 'string') return fallback;
    const trimmed = text.trim();
    if (!trimmed || /placeholder|lorem|todo|tbd/i.test(trimmed)) return fallback;
    return trimmed;
  };

  return {
    leadershipScore,
    leadershipStage: sanitize(raw?.leadershipStage, 'Scaling Manager -> Strategic Leader'),
    executiveSummary: sanitize(
      raw?.executiveSummary,
      'Your profile shows strong execution and ownership, with the next leap requiring more leverage through systems, delegation, and strategic communication. You are close to the next leadership tier, but your daily operating model still absorbs too much tactical load.'
    ),
    archetype: {
      name: sanitize(raw?.archetype?.name, 'The Scaling Builder'),
      traits: Array.isArray(raw?.archetype?.traits) && raw.archetype.traits.length
        ? raw.archetype.traits.slice(0, 6).map((t) => sanitize(t, '')).filter(Boolean)
        : [
          'High standards and ownership mindset',
          'Strong delivery under pressure',
          'Reliable at turning ambiguity into execution',
          'Needs to shift from doing to designing',
          'Can unlock major growth by scaling others',
        ],
    },
    topGrowthAreas: Array.isArray(raw?.topGrowthAreas) && raw.topGrowthAreas.length
      ? raw.topGrowthAreas.slice(0, 3).map((a, idx) => ({
        title: sanitize(a?.title, `Growth Area ${idx + 1}`),
        description: sanitize(
          a?.description,
          'Build a repeatable system, define clearer expectations, and measure outcomes with weekly leading indicators.'
        ),
      }))
      : [
        {
          title: 'Delegation Depth',
          description: 'Move from task delegation to ownership delegation with clear decision rights, milestones, and success criteria.',
        },
        {
          title: 'Strategic Communication',
          description: 'Translate team execution into business impact using concise executive narratives and clearer prioritization trade-offs.',
        },
        {
          title: 'Systems Thinking',
          description: 'Replace heroics with operating rhythms: planning cadence, escalation rules, and accountability loops.',
        },
      ],
    roadmap: {
      month1: {
        title: sanitize(raw?.roadmap?.month1?.title, 'Stabilize Your Operating System'),
        actions: Array.isArray(raw?.roadmap?.month1?.actions) && raw.roadmap.month1.actions.length
          ? raw.roadmap.month1.actions.slice(0, 4).map((a) => sanitize(a, '')).filter(Boolean)
          : [
            'Audit your calendar and reclaim at least 4 hours/week from low-leverage work.',
            'Redesign 1:1s around growth, not status updates.',
            'Create a delegation map for the next 30 days.',
          ],
      },
      month2: {
        title: sanitize(raw?.roadmap?.month2?.title, 'Expand Strategic Influence'),
        actions: Array.isArray(raw?.roadmap?.month2?.actions) && raw.roadmap.month2.actions.length
          ? raw.roadmap.month2.actions.slice(0, 4).map((a) => sanitize(a, '')).filter(Boolean)
          : [
            'Build stakeholder map with communication cadence and decision expectations.',
            'Run one strategic review that ties team metrics to company outcomes.',
            'Practice executive updates using context -> decision -> impact structure.',
          ],
      },
      month3: {
        title: sanitize(raw?.roadmap?.month3?.title, 'Scale Through People'),
        actions: Array.isArray(raw?.roadmap?.month3?.actions) && raw.roadmap.month3.actions.length
          ? raw.roadmap.month3.actions.slice(0, 4).map((a) => sanitize(a, '')).filter(Boolean)
          : [
            'Launch succession plans for key responsibilities.',
            'Promote ownership culture with role scorecards and weekly retros.',
            'Codify your team operating playbook for repeatability.',
          ],
      },
    },
    keyInsight: sanitize(
      raw?.keyInsight,
      'Your next level will come from leverage, not effort: scale your impact through systems, clarity, and people ownership.'
    ),
    competencies,
  };
}

function parseAiJson(content) {
  if (!content) return null;
  const stripped = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  try {
    return JSON.parse(stripped);
  } catch {
    return null;
  }
}

async function generateNapkinDiagram(prompt) {
  if (!NAPKIN_API_KEY) return null;
  try {
    const response = await axios.post(
      'https://api.napkin.ai/v1/generate',
      {
        prompt,
        style: 'minimal',
        format: 'png',
      },
      {
        headers: {
          Authorization: `Bearer ${NAPKIN_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 12000,
      }
    );

    const imageUrl = response?.data?.imageUrl || response?.data?.url || response?.data?.data?.imageUrl;
    if (!imageUrl) return null;

    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 12000,
    });
    const base64 = Buffer.from(imageResponse.data).toString('base64');
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error('Napkin generation failed:', error.message);
    return null;
  }
}

async function generateAnalysis(questionAnswers) {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  const prompt = [
    'You are an elite leadership coach preparing a premium, practical leadership report.',
    'Return STRICT JSON only (no markdown, no prose outside JSON).',
    'Never use placeholders, generic filler, or vague advice.',
    'Base conclusions on the user answers below.',
    '',
    'Required JSON shape:',
    '{',
    '  "leadershipScore": number 55-95,',
    '  "leadershipStage": "short stage label",',
    '  "executiveSummary": "100-160 words",',
    '  "competencies": [',
    '    {"name":"Strategic Thinking","score":number,"level":"Emerging|Developing|Strong|Advanced"},',
    '    {"name":"Delegation & Empowerment","score":number,"level":"..."},',
    '    {"name":"Coaching & Feedback","score":number,"level":"..."},',
    '    {"name":"Influence & Stakeholder Alignment","score":number,"level":"..."},',
    '    {"name":"Execution & Accountability","score":number,"level":"..."},',
    '    {"name":"Emotional Intelligence","score":number,"level":"..."}',
    '  ],',
    '  "archetype": {"name":"The ...","traits":["5-6 concise bullet strings"]},',
    '  "topGrowthAreas":[',
    '    {"title":"...","description":"45-80 words"},',
    '    {"title":"...","description":"45-80 words"},',
    '    {"title":"...","description":"45-80 words"}',
    '  ],',
    '  "roadmap": {',
    '    "month1":{"title":"...","actions":["3-4 concrete actions"]},',
    '    "month2":{"title":"...","actions":["3-4 concrete actions"]},',
    '    "month3":{"title":"...","actions":["3-4 concrete actions"]}',
    '  },',
    '  "keyInsight":"1 strong sentence"',
    '}',
    '',
    'User answers:',
    JSON.stringify(questionAnswers, null, 2),
  ].join('\n');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.5,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: 'You generate high-quality coaching report JSON.' },
      { role: 'user', content: prompt },
    ],
  });

  return parseAiJson(completion.choices?.[0]?.message?.content || '');
}

function addWrapped(doc, text, x, y, maxWidth, lineHeight = 6) {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function drawCompetencyBars(doc, competencies, startX, startY, width) {
  let y = startY;
  competencies.forEach((c) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(20, 20, 20);
    doc.text(c.name, startX, y);
    y += 4;
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(245, 245, 245);
    doc.rect(startX, y, width, 5, 'FD');
    doc.setFillColor(20, 20, 20);
    doc.rect(startX, y, Math.max(5, (width * c.score) / 100), 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 20);
    doc.text(`${c.score}`, startX + width + 4, y + 4);
    y += 11;
  });
  return y;
}

function drawTimeline(doc, months, x, y, width) {
  const stepWidth = width / 3;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.8);
  doc.line(x + 10, y + 8, x + width - 10, y + 8);

  months.forEach((m, idx) => {
    const cx = x + stepWidth * idx + stepWidth / 2;
    doc.setFillColor(15, 15, 15);
    doc.circle(cx, y + 8, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`M${idx + 1}`, cx - 4, y + 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const title = doc.splitTextToSize(m.title, stepWidth - 8);
    doc.text(title, x + stepWidth * idx + 2, y + 24);
  });
}

function drawRadarChart(doc, competencies, centerX, centerY, radius = 24) {
  const count = competencies.length;
  if (!count) return;

  // Grid rings
  doc.setDrawColor(220, 220, 220);
  [0.25, 0.5, 0.75, 1].forEach((ratio) => {
    const points = [];
    for (let i = 0; i < count; i += 1) {
      const angle = (-Math.PI / 2) + ((Math.PI * 2) * i) / count;
      points.push({
        x: centerX + Math.cos(angle) * radius * ratio,
        y: centerY + Math.sin(angle) * radius * ratio,
      });
    }
    for (let i = 0; i < points.length; i += 1) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      doc.line(p1.x, p1.y, p2.x, p2.y);
    }
  });

  // Axis lines
  doc.setDrawColor(190, 190, 190);
  for (let i = 0; i < count; i += 1) {
    const angle = (-Math.PI / 2) + ((Math.PI * 2) * i) / count;
    doc.line(centerX, centerY, centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
  }

  // Data polygon
  const dataPoints = competencies.map((c, i) => {
    const angle = (-Math.PI / 2) + ((Math.PI * 2) * i) / count;
    const r = radius * (Math.max(40, Math.min(100, c.score)) / 100);
    return {
      x: centerX + Math.cos(angle) * r,
      y: centerY + Math.sin(angle) * r,
    };
  });
  doc.setDrawColor(20, 20, 20);
  doc.setLineWidth(1.2);
  for (let i = 0; i < dataPoints.length; i += 1) {
    const p1 = dataPoints[i];
    const p2 = dataPoints[(i + 1) % dataPoints.length];
    doc.line(p1.x, p1.y, p2.x, p2.y);
    doc.setFillColor(20, 20, 20);
    doc.circle(p1.x, p1.y, 1.2, 'F');
  }
}

function drawPriorityMatrix(doc, x, y, width, height, labels) {
  const midX = x + width / 2;
  const midY = y + height / 2;
  doc.setDrawColor(190, 190, 190);
  doc.rect(x, y, width, height);
  doc.line(midX, y, midX, y + height);
  doc.line(x, midY, x + width, midY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('HIGH IMPACT', x + 3, y + 6);
  doc.text('LOW IMPACT', x + width - 24, y + 6);
  doc.text('LOW EFFORT', x + 3, y + height - 3);
  doc.text('HIGH EFFORT', x + width - 24, y + height - 3);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const safe = labels.slice(0, 4);
  const quadrants = [
    { tx: x + 3, ty: y + 16 }, // high impact low effort
    { tx: midX + 3, ty: y + 16 }, // low impact low effort
    { tx: x + 3, ty: midY + 12 }, // high impact high effort
    { tx: midX + 3, ty: midY + 12 }, // low impact high effort
  ];
  safe.forEach((label, idx) => {
    const lines = doc.splitTextToSize(label, width / 2 - 6);
    doc.text(lines, quadrants[idx].tx, quadrants[idx].ty);
  });
}

function deriveDeepSections(analysis, questionAnswers) {
  const strengths = [
    `You score highest in ${analysis.competencies.sort((a, b) => b.score - a.score)[0].name}, indicating strong leadership instincts in this domain.`,
    'Your answers suggest a high-ownership mindset and willingness to take accountability for outcomes.',
    'You demonstrate growth intent, which is one of the strongest predictors of manager-to-leader transitions.',
    'You already show pattern-recognition in team dynamics, which supports better coaching decisions.',
  ];

  const risks = [
    `The biggest gap is ${analysis.competencies.sort((a, b) => a.score - b.score)[0].name}; without action, this may slow promotion readiness.`,
    'Current execution load may be crowding out strategic work, reducing leadership leverage.',
    'Stakeholder communication may still be reactive instead of proactively aligned.',
    'Without a repeatable operating cadence, you risk dependency on heroics.',
  ];

  const firstWeekPlan = [
    'Block 90 minutes to define top 3 leadership priorities for this quarter.',
    'Redesign one recurring meeting to focus on outcomes, not status.',
    'Delegate one recurring task with explicit ownership criteria.',
    'Send a stakeholder update with context, decision, and impact format.',
    'Run one coaching-focused 1:1 centered on capability growth.',
    'Create a simple KPI dashboard with 3 leading indicators.',
    'Close the week with a 20-minute reflection: what only you can do next week.',
  ];

  const sampleSignals = questionAnswers.slice(0, 5).map((q) => `Q${q.questionId}: "${q.answer}"`);
  const matrixLabels = [
    analysis.topGrowthAreas[0]?.title || 'Delegation',
    analysis.topGrowthAreas[1]?.title || 'Communication',
    analysis.topGrowthAreas[2]?.title || 'Systems',
    'Stakeholder rhythm',
  ];

  return { strengths, risks, firstWeekPlan, sampleSignals, matrixLabels };
}

app.post('/api/generate-report', async (req, res) => {
  try {
    const { answers = {}, variant } = req.body || {};
    const questionAnswers = Object.entries(answers).map(([questionId, answer]) => ({
      questionId,
      answer: String(answer || ''),
    }));
    const seed = hashString(JSON.stringify(questionAnswers));

    let aiRaw = null;
    try {
      aiRaw = await generateAnalysis(questionAnswers);
    } catch (e) {
      console.error('AI analysis failed, using fallback:', e.message);
    }
    const analysis = normalizeAnalysis(aiRaw, seed);
    const deep = deriveDeepSections(analysis, questionAnswers);

    // Generate diagrams with Napkin (non-blocking fallbacks)
    const [competencyDiagram, roadmapDiagram] = await Promise.all([
      generateNapkinDiagram(
        `Create a clean black-and-white competency chart illustration for these scores: ${analysis.competencies
          .map((c) => `${c.name} ${c.score}`)
          .join(', ')}`
      ),
      generateNapkinDiagram(
        `Create a minimalist timeline roadmap diagram with 3 phases:
        Month 1: ${analysis.roadmap.month1.title}
        Month 2: ${analysis.roadmap.month2.title}
        Month 3: ${analysis.roadmap.month3.title}`
      ),
    ]);

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 16;
    let y = margin;

    const nextPageIfNeeded = (space = 20) => {
      if (y + space > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    };

    // Cover
    doc.setFillColor(10, 10, 10);
    doc.rect(0, 0, pageWidth, 64, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text('CAREERA', margin, 22);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'normal');
    doc.text('Leadership Readiness Report', margin, 30);
    doc.setTextColor(20, 20, 20);
    y = 78;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('From Manager to Respected Leader', margin, y);
    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Assessment date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, y);
    y += 7;
    doc.text(`Variant: ${variant || 'N/A'}`, margin, y);
    y += 7;
    doc.text(`Leadership stage: ${analysis.leadershipStage}`, margin, y);
    y += 16;
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 36, 3, 3, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    y = addWrapped(
      doc,
      'Leadership is not a title change. It is an operating system change — from personal output to multiplied impact.',
      margin + 6,
      y + 10,
      pageWidth - margin * 2 - 12,
      6
    );
    doc.setTextColor(20, 20, 20);

    // Page 2: Summary + visual bars
    doc.addPage();
    y = margin;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.text('Executive Summary', margin, y);
    y += 8;
    doc.setDrawColor(20, 20, 20);
    doc.setLineWidth(0.8);
    doc.line(margin, y, margin + 42, y);
    y += 8;

    doc.setFillColor(15, 15, 15);
    doc.roundedRect(margin, y, 56, 24, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text(String(analysis.leadershipScore), margin + 22, y + 14);
    doc.setFontSize(9);
    doc.text('LEADERSHIP SCORE', margin + 6, y + 21);
    doc.setTextColor(20, 20, 20);

    doc.setFillColor(248, 248, 248);
    doc.roundedRect(margin + 62, y, pageWidth - margin * 2 - 62, 24, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Current Stage', margin + 68, y + 9);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(analysis.leadershipStage, margin + 68, y + 17);
    y += 32;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    y = addWrapped(doc, analysis.executiveSummary, margin, y, pageWidth - margin * 2, 6);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Competency Illustration', margin, y);
    y += 8;
    y = drawCompetencyBars(doc, analysis.competencies, margin, y, 120);
    drawRadarChart(doc, analysis.competencies, pageWidth - 40, 96, 26);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Leadership Radar', pageWidth - 58, 128);
    if (competencyDiagram) {
      try {
        const diagramWidth = 55;
        const diagramHeight = 45;
        const diagramX = pageWidth - margin - diagramWidth;
        const diagramY = Math.max(55, y - 48);
        doc.addImage(competencyDiagram, 'PNG', diagramX, diagramY, diagramWidth, diagramHeight);
      } catch (e) {
        console.error('Could not embed competency diagram:', e.message);
      }
    }

    // Page 3: Archetype + growth areas
    doc.addPage();
    y = margin;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.text(`Your Archetype: ${analysis.archetype.name}`, margin, y);
    y += 10;
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 56, 3, 3, 'F');
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Core Traits', margin + 6, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    analysis.archetype.traits.forEach((trait) => {
      nextPageIfNeeded(8);
      doc.text(`• ${trait}`, margin + 6, y);
      y += 6;
    });

    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('Top 3 Growth Areas', margin, y);
    y += 8;
    analysis.topGrowthAreas.forEach((area, idx) => {
      nextPageIfNeeded(26);
      doc.setFillColor(252, 252, 252);
      doc.setDrawColor(230, 230, 230);
      doc.roundedRect(margin, y, pageWidth - margin * 2, 24, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`${idx + 1}. ${area.title}`, margin + 4, y + 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      addWrapped(doc, area.description, margin + 4, y + 12, pageWidth - margin * 2 - 8, 4.8);
      y += 28;
    });

    y += 3;
    nextPageIfNeeded(40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Where You Are Strongest', margin, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    deep.strengths.forEach((item) => {
      nextPageIfNeeded(8);
      y = addWrapped(doc, `• ${item}`, margin + 2, y, pageWidth - margin * 2 - 2, 5.3);
      y += 1;
    });

    y += 3;
    nextPageIfNeeded(40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Execution Risks to Eliminate', margin, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    deep.risks.forEach((item) => {
      nextPageIfNeeded(8);
      y = addWrapped(doc, `• ${item}`, margin + 2, y, pageWidth - margin * 2 - 2, 5.3);
      y += 1;
    });

    // Page 4: 90-day roadmap diagram + actions
    doc.addPage();
    y = margin;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.text('90-Day Leadership Roadmap', margin, y);
    y += 10;
    const months = [analysis.roadmap.month1, analysis.roadmap.month2, analysis.roadmap.month3];
    drawTimeline(doc, months, margin, y, pageWidth - margin * 2);
    if (roadmapDiagram) {
      try {
        doc.addImage(roadmapDiagram, 'PNG', pageWidth - margin - 58, y + 22, 58, 36);
      } catch (e) {
        console.error('Could not embed roadmap diagram:', e.message);
      }
    }
    y += 40;

    months.forEach((m, idx) => {
      nextPageIfNeeded(36);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`Month ${idx + 1}: ${m.title}`, margin, y);
      y += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      m.actions.forEach((a) => {
        nextPageIfNeeded(6);
        doc.text(`• ${a}`, margin + 2, y);
        y += 5.8;
      });
      y += 5;
    });

    // Page 5: Execution Priority Matrix + First Week Plan
    doc.addPage();
    y = margin;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Execution Priority Matrix', margin, y);
    y += 7;
    drawPriorityMatrix(doc, margin, y, pageWidth - margin * 2, 60, deep.matrixLabels);
    y += 70;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('First 7 Days Action Sprint', margin, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    deep.firstWeekPlan.forEach((step, idx) => {
      nextPageIfNeeded(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`${idx + 1}.`, margin, y);
      doc.setFont('helvetica', 'normal');
      y = addWrapped(doc, step, margin + 8, y, pageWidth - margin * 2 - 8, 5.2);
      y += 1.5;
    });

    // Page 6: Answer signal appendix
    doc.addPage();
    y = margin;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Answer Signals We Detected', margin, y);
    y += 9;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    deep.sampleSignals.forEach((line, idx) => {
      nextPageIfNeeded(12);
      y = addWrapped(doc, `• ${line}`, margin + 2, y, pageWidth - margin * 2 - 2, 5.2);
      y += 1.5;
      if (idx < deep.sampleSignals.length - 1) {
        doc.setDrawColor(235, 235, 235);
        doc.line(margin, y, pageWidth - margin, y);
        y += 4;
      }
    });

    y += 10;
    nextPageIfNeeded(24);
    doc.setFillColor(15, 15, 15);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 20, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bolditalic');
    doc.setFontSize(11);
    const insightY = addWrapped(doc, analysis.keyInsight, margin + 6, y + 8, pageWidth - margin * 2 - 12, 5.5);
    void insightY;
    doc.setTextColor(20, 20, 20);

    // Footer page numbers
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i += 1) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(`Careera Leadership Report · Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
    }

    const pdfBase64 = doc.output('datauristring');
    res.json({
      success: true,
      pdf: pdfBase64,
      filename: `Careera-Leadership-Report-${Date.now()}.pdf`,
      analysis,
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate report',
      details: error.message,
    });
  }
});

// SPA fallback only for app routes (never for files/assets/api)
app.get(/^\/(?!api\/)(?!.*\.).*/, (req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
