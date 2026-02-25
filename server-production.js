import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import axios from 'axios';
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

const GAMMA_API_KEY = process.env.GAMMA_API_KEY;
const GAMMA_API_BASE = 'https://public-api.gamma.app/v1.0';

function parseAiJson(content) {
  if (!content) return null;
  const stripped = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
  try {
    return JSON.parse(stripped);
  } catch {
    return null;
  }
}

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
    'Influence & Stakeholder Mgmt',
    'Execution & Accountability',
    'Emotional Intelligence',
  ];

  const fallbackCompetencies = competencyNames.map((name, idx) => {
    const score = 64 + ((seed + idx * 17) % 31);
    const level = score >= 85 ? 'Advanced' : score >= 75 ? 'Strong' : score >= 65 ? 'Developing' : 'Emerging';
    return { name, score, level, deepDive: '' };
  });

  const competencies = Array.isArray(raw?.competencies) && raw.competencies.length >= 4
    ? raw.competencies.slice(0, 6).map((c, idx) => {
      const score = Number(c?.score);
      const safe = Number.isFinite(score) ? Math.max(55, Math.min(95, Math.round(score))) : fallbackCompetencies[idx].score;
      return {
        name: c?.name || fallbackCompetencies[idx].name,
        score: safe,
        level: c?.level || fallbackCompetencies[idx].level,
        deepDive: c?.deepDive || '',
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
    leadershipStage: sanitize(raw?.leadershipStage, 'Scaling Manager → Strategic Leader'),
    executiveSummary: sanitize(
      raw?.executiveSummary,
      'Your profile shows strong execution and ownership, with the next leap requiring more leverage through systems, delegation, and strategic communication. You are close to the next leadership tier, but your daily operating model still absorbs too much tactical load. The transition from high-performing manager to strategic leader requires a deliberate shift in how you allocate time, how you measure success, and how you create impact through others rather than through personal output.'
    ),
    archetype: {
      name: sanitize(raw?.archetype?.name, 'The Scaling Builder'),
      description: sanitize(raw?.archetype?.description, 'You are a leader who thrives on building — teams, products, and processes. Your instinct is to create, not just manage. The challenge ahead is learning to build through others, establishing systems that scale your impact beyond your personal bandwidth.'),
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
        description: sanitize(a?.description, 'Build a repeatable system, define clearer expectations, and measure outcomes with weekly leading indicators.'),
        actionSteps: Array.isArray(a?.actionSteps) && a.actionSteps.length
          ? a.actionSteps.slice(0, 4).map(s => sanitize(s, '')).filter(Boolean)
          : ['Define clear success metrics', 'Create a weekly tracking mechanism', 'Schedule accountability check-ins'],
      }))
      : [
        { title: 'Delegation Depth', description: 'Move from task delegation to ownership delegation with clear decision rights, milestones, and success criteria.', actionSteps: ['Map all recurring tasks you handle personally', 'Identify 3 tasks to delegate with full ownership', 'Create decision-rights framework for each delegated area'] },
        { title: 'Strategic Communication', description: 'Translate team execution into business impact using concise executive narratives and clearer prioritization trade-offs.', actionSteps: ['Draft weekly executive updates using context-decision-impact format', 'Practice elevator pitch for team value proposition', 'Build stakeholder communication calendar'] },
        { title: 'Systems Thinking', description: 'Replace heroics with operating rhythms: planning cadence, escalation rules, and accountability loops.', actionSteps: ['Document your team operating model on one page', 'Define escalation thresholds and response protocols', 'Create a team decision log for transparency'] },
      ],
    roadmap: {
      month1: {
        title: sanitize(raw?.roadmap?.month1?.title, 'Stabilize Your Operating System'),
        theme: sanitize(raw?.roadmap?.month1?.theme, 'Foundation & Awareness'),
        actions: Array.isArray(raw?.roadmap?.month1?.actions) && raw.roadmap.month1.actions.length
          ? raw.roadmap.month1.actions.slice(0, 5).map((a) => sanitize(a, '')).filter(Boolean)
          : ['Audit your calendar and reclaim at least 4 hours/week from low-leverage work', 'Redesign 1:1s around growth, not status updates', 'Create a delegation map for the next 30 days', 'Define your top 3 leadership priorities for the quarter'],
      },
      month2: {
        title: sanitize(raw?.roadmap?.month2?.title, 'Expand Strategic Influence'),
        theme: sanitize(raw?.roadmap?.month2?.theme, 'Strategic Expansion'),
        actions: Array.isArray(raw?.roadmap?.month2?.actions) && raw.roadmap.month2.actions.length
          ? raw.roadmap.month2.actions.slice(0, 5).map((a) => sanitize(a, '')).filter(Boolean)
          : ['Build stakeholder map with communication cadence and decision expectations', 'Run one strategic review that ties team metrics to company outcomes', 'Practice executive updates using context → decision → impact structure', 'Initiate one cross-functional collaboration'],
      },
      month3: {
        title: sanitize(raw?.roadmap?.month3?.title, 'Scale Through People'),
        theme: sanitize(raw?.roadmap?.month3?.theme, 'Multiplication & Legacy'),
        actions: Array.isArray(raw?.roadmap?.month3?.actions) && raw.roadmap.month3.actions.length
          ? raw.roadmap.month3.actions.slice(0, 5).map((a) => sanitize(a, '')).filter(Boolean)
          : ['Launch succession plans for key responsibilities', 'Promote ownership culture with role scorecards and weekly retros', 'Codify your team operating playbook for repeatability', 'Measure leadership impact through team autonomy metrics'],
      },
    },
    keyInsight: sanitize(
      raw?.keyInsight,
      'Your next level will come from leverage, not effort: scale your impact through systems, clarity, and people ownership.'
    ),
    blindSpots: Array.isArray(raw?.blindSpots) && raw.blindSpots.length
      ? raw.blindSpots.slice(0, 5).map((s) => sanitize(s, '')).filter(Boolean)
      : [
        'You may be over-indexing on execution quality at the cost of strategic airtime.',
        'Escalations can become person-dependent when decision rights are not explicit.',
        'High standards may unintentionally reduce delegation depth if outcomes are not clearly framed.',
        'Stakeholder updates may be too operational and not tied tightly enough to business outcomes.',
        'Team members may be waiting for your approval on decisions they could own.',
      ],
    strengthLevers: Array.isArray(raw?.strengthLevers) && raw.strengthLevers.length
      ? raw.strengthLevers.slice(0, 5).map((s) => sanitize(s, '')).filter(Boolean)
      : [
        'Use your accountability mindset to build a consistent team operating cadence.',
        'Turn execution discipline into measurable team-level KPIs and decision dashboards.',
        'Translate team wins into leadership narratives for executives and cross-functional peers.',
        'Apply coaching consistency to raise autonomy and reduce tactical dependency.',
        'Leverage your builder instinct to create scalable processes others can own.',
      ],
    stakeholderPlaybook: Array.isArray(raw?.stakeholderPlaybook) && raw.stakeholderPlaybook.length
      ? raw.stakeholderPlaybook.slice(0, 5).map((s) => sanitize(s, '')).filter(Boolean)
      : [
        'Weekly: direct manager update with risks, decisions needed, and business impact.',
        'Bi-weekly: cross-functional sync to align priorities and unblock dependencies.',
        'Monthly: executive narrative highlighting outcomes vs. strategy goals.',
        'Quarterly: strategic review with skip-level to demonstrate readiness.',
        'Ad-hoc: escalation protocol with clear trigger thresholds and ownership.',
      ],
    kpis: Array.isArray(raw?.kpis) && raw.kpis.length
      ? raw.kpis.slice(0, 6).map((s) => sanitize(s, '')).filter(Boolean)
      : [
        'Percent of decisions delegated with clear owner and deadline',
        'On-time delivery rate for committed team outcomes',
        '1:1 completion rate and growth-action follow-through',
        'Stakeholder confidence pulse (1-5) after weekly updates',
        'Share of calendar spent on strategy vs. tactical execution',
        'Number of team members taking on expanded responsibilities',
      ],
    communicationScript: sanitize(
      raw?.communicationScript,
      'This month we shifted from reactive execution to clearer operating rhythms. We delegated two core workflows with defined ownership and saw faster decision cycles. Risks are now tracked with explicit thresholds and response owners. Our team velocity improved by focusing on fewer, higher-impact initiatives. Over the next four weeks, our focus is to increase cross-functional predictability, improve stakeholder visibility, and protect strategic time so the team can scale without leadership bottlenecks.'
    ),
    ninetyDayOutcome: sanitize(
      raw?.ninetyDayOutcome,
      'If you execute this plan consistently, your team will depend less on your direct intervention, your strategic visibility with senior leadership will increase measurably, and your readiness for the next leadership level will become demonstrable through concrete outcomes — not just effort. You will have a documented operating system, clear delegation framework, and a reputation as someone who develops people and delivers results simultaneously.'
    ),
    firstWeekPlan: Array.isArray(raw?.firstWeekPlan) && raw.firstWeekPlan.length
      ? raw.firstWeekPlan.slice(0, 7).map(s => sanitize(s, '')).filter(Boolean)
      : [
        'Block 90 minutes to define top 3 leadership priorities for this quarter',
        'Redesign one recurring meeting to focus on outcomes, not status',
        'Delegate one recurring task with explicit ownership criteria',
        'Send a stakeholder update with context → decision → impact format',
        'Run one coaching-focused 1:1 centered on capability growth',
        'Create a simple KPI dashboard with 3 leading indicators',
        'Close the week with a 20-minute reflection: what only you can do next week',
      ],
    competencies,
  };
}

async function generateAnalysis(questionAnswers) {
  if (!process.env.OPENAI_API_KEY) return null;

  const prompt = [
    'You are an elite leadership coach preparing a premium, in-depth leadership readiness report.',
    'Return STRICT JSON only (no markdown, no prose outside JSON).',
    'Never use placeholders, generic filler, or vague advice.',
    'Every piece of advice must be specific, actionable, and tied to the user answers below.',
    'Write as if you are being paid $5000 for this report — make every word count.',
    '',
    'Required JSON shape:',
    '{',
    '  "leadershipScore": number 55-95,',
    '  "leadershipStage": "concise stage label like Tactical Manager → Strategic Leader",',
    '  "executiveSummary": "200-300 words, specific to their answers, no generic coaching language",',
    '  "competencies": [',
    '    {"name":"Strategic Thinking","score":number 55-95,"level":"Emerging|Developing|Strong|Advanced","deepDive":"80-120 words analyzing THIS person\'s strategic thinking based on their answers"},',
    '    {"name":"Delegation & Empowerment","score":number,"level":"...","deepDive":"80-120 words"},',
    '    {"name":"Coaching & Feedback","score":number,"level":"...","deepDive":"80-120 words"},',
    '    {"name":"Influence & Stakeholder Mgmt","score":number,"level":"...","deepDive":"80-120 words"},',
    '    {"name":"Execution & Accountability","score":number,"level":"...","deepDive":"80-120 words"},',
    '    {"name":"Emotional Intelligence","score":number,"level":"...","deepDive":"80-120 words"}',
    '  ],',
    '  "archetype": {"name":"The ...","description":"60-100 words describing this archetype","traits":["6 specific traits"]},',
    '  "topGrowthAreas":[',
    '    {"title":"...","description":"60-100 words","actionSteps":["4 specific steps"]},',
    '    {"title":"...","description":"60-100 words","actionSteps":["4 specific steps"]},',
    '    {"title":"...","description":"60-100 words","actionSteps":["4 specific steps"]}',
    '  ],',
    '  "blindSpots":["5 specific blind spots with behavioral evidence from answers"],',
    '  "strengthLevers":["5 practical levers to exploit immediately"],',
    '  "stakeholderPlaybook":["5 specific relationship-management actions with cadences"],',
    '  "kpis":["6 measurable weekly leadership KPIs with target numbers"],',
    '  "communicationScript":"150-200 words: a sample monthly update to executive stakeholders written in first person",',
    '  "roadmap": {',
    '    "month1":{"title":"...","theme":"short theme","actions":["5 concrete actions with deadlines"]},',
    '    "month2":{"title":"...","theme":"short theme","actions":["5 concrete actions with deadlines"]},',
    '    "month3":{"title":"...","theme":"short theme","actions":["5 concrete actions with deadlines"]}',
    '  },',
    '  "keyInsight":"1 powerful sentence that reframes how they should think about leadership",',
    '  "ninetyDayOutcome":"100-150 words describing specific, measurable outcomes if plan is executed",',
    '  "firstWeekPlan":["7 daily actions for the first week, one per day, specific and actionable"]',
    '}',
    '',
    'User answers:',
    JSON.stringify(questionAnswers, null, 2),
  ].join('\n');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0.5,
    response_format: { type: 'json_object' },
    max_tokens: 4096,
    messages: [
      { role: 'system', content: 'You generate premium leadership coaching report data. Be specific, personal, and actionable. Never be generic.' },
      { role: 'user', content: prompt },
    ],
  });

  return parseAiJson(completion.choices?.[0]?.message?.content || '');
}

async function findDarkTheme() {
  if (!GAMMA_API_KEY) return null;
  try {
    const response = await axios.get(`${GAMMA_API_BASE}/themes`, {
      params: { query: 'dark', limit: 10 },
      headers: { 'X-API-KEY': GAMMA_API_KEY },
      timeout: 10000,
    });
    const themes = response.data?.data || [];
    const standardDark = themes.find(t => /standard.*dark/i.test(t.name));
    return standardDark?.id || themes[0]?.id || null;
  } catch (err) {
    console.error('Failed to fetch dark themes:', err.message);
    return null;
  }
}

function buildGammaInputText(analysis) {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const sorted = [...analysis.competencies].sort((a, b) => b.score - a.score);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  const cards = [];

  cards.push(`# CAREERA
## Leadership Readiness Report

Your Personalized Path from Manager to Respected Leader

**Assessment Date:** ${date}
**Leadership Stage:** ${analysis.leadershipStage}
**Overall Score:** ${analysis.leadershipScore}/100

> "Leadership is not a title change. It is an operating system change — from personal output to multiplied impact."`);

  cards.push(`# Executive Summary
## Your Leadership Profile at a Glance

**Overall Leadership Score: ${analysis.leadershipScore}/100**
**Current Stage: ${analysis.leadershipStage}**
**Leadership Archetype: ${analysis.archetype.name}**

${analysis.executiveSummary}

**Strongest Competency:** ${strongest.name} (${strongest.score}/100)
**Biggest Growth Opportunity:** ${weakest.name} (${weakest.score}/100)`);

  cards.push(`# Competency Overview
## Your Leadership Scoring Breakdown

${analysis.competencies.map(c => `**${c.name}** — ${c.score}/100 (${c.level})`).join('\n\n')}

Your strongest area is **${strongest.name}** and your primary growth opportunity is in **${weakest.name}**. The gap between your top and bottom scores is ${strongest.score - weakest.score} points — ${strongest.score - weakest.score > 20 ? 'indicating clear priorities for focused development' : 'showing a well-rounded profile with room for targeted growth'}.`);

  analysis.competencies.forEach(c => {
    const deepDive = c.deepDive || `At the ${c.level} level, you demonstrate foundational capability in ${c.name.toLowerCase()}. To advance, focus on building repeatable systems and measurable outcomes in this area. Seek feedback from peers and stakeholders, and track your progress weekly against specific behavioral indicators.`;
    cards.push(`# ${c.name}
## Score: ${c.score}/100 — ${c.level}

${deepDive}

**What ${c.level} means:**
${c.level === 'Advanced' ? 'You consistently demonstrate excellence in this area. Focus on teaching and scaling this skill across your team.' : c.level === 'Strong' ? 'You show solid capability here. The next step is making this skill visible to senior leadership and mentoring others.' : c.level === 'Developing' ? 'You have a foundation to build on. Prioritize deliberate practice and seek stretch assignments in this domain.' : 'This is your biggest growth opportunity. Start with small, consistent actions and build confidence through quick wins.'}`);
  });

  cards.push(`# Your Leadership Archetype
## ${analysis.archetype.name}

${analysis.archetype.description}

**Your Core Traits:**
${analysis.archetype.traits.map(t => `- ${t}`).join('\n')}

Understanding your archetype helps you leverage your natural strengths while being aware of your default patterns that may limit growth at the next level.`);

  analysis.topGrowthAreas.forEach((area, idx) => {
    cards.push(`# Growth Area ${idx + 1}: ${area.title}
## Priority Development Focus

${area.description}

**Action Steps:**
${area.actionSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`);
  });

  cards.push(`# Blind Spots to Address
## What You Might Be Missing

These are patterns in your responses that suggest areas where your self-perception may not match how others experience your leadership:

${analysis.blindSpots.map((s, i) => `**${i + 1}.** ${s}`).join('\n\n')}

> Awareness of blind spots is the first step. The next step is asking for direct feedback from your team and peers on these specific areas.`);

  cards.push(`# Your Strength Levers
## Maximize What You Already Do Well

Instead of only fixing weaknesses, these are concrete ways to amplify your existing strengths for outsized impact:

${analysis.strengthLevers.map((s, i) => `**${i + 1}.** ${s}`).join('\n\n')}`);

  cards.push(`# Stakeholder Playbook
## Build Strategic Relationships That Accelerate Your Career

${analysis.stakeholderPlaybook.map(s => `- ${s}`).join('\n')}

**Pro Tip:** Map your top 5 stakeholders on a 2x2 matrix of Influence (high/low) × Alignment (high/low). Invest most energy in high-influence, low-alignment relationships — that is where the leverage is.`);

  const months = [
    { ...analysis.roadmap.month1, num: 1 },
    { ...analysis.roadmap.month2, num: 2 },
    { ...analysis.roadmap.month3, num: 3 },
  ];
  months.forEach(m => {
    cards.push(`# Month ${m.num}: ${m.title}
## 90-Day Roadmap — ${m.theme}

**Focus Actions:**
${m.actions.map((a, i) => `${i + 1}. ${a}`).join('\n')}

**Success Criteria:** By the end of month ${m.num}, you should be able to demonstrate measurable progress on each of these actions to your manager or mentor.`);
  });

  cards.push(`# Weekly Leadership KPIs
## Track Your Progress Every Week

These are the leading indicators that predict leadership growth. Track them weekly:

${analysis.kpis.map((k, i) => `**${i + 1}.** ${k}`).join('\n\n')}

> Create a simple spreadsheet or dashboard to track these weekly. Review trends monthly. Share progress with your manager to build visibility.`);

  cards.push(`# Executive Communication Script
## Ready-to-Use Stakeholder Update Template

Use this as a template for your monthly updates to senior leadership:

---

${analysis.communicationScript}

---

**Structure to follow:** Context → Key Decisions → Impact → Next Steps → Risks`);

  cards.push(`# Your First 7 Days
## Action Sprint to Build Momentum

Start your transformation this week with one focused action per day:

${analysis.firstWeekPlan.map((s, i) => `**Day ${i + 1}:** ${s}`).join('\n\n')}`);

  cards.push(`# Projected 90-Day Outcome
## What Success Looks Like

${analysis.ninetyDayOutcome}

---

> **Key Insight:** ${analysis.keyInsight}`);

  cards.push(`# What's Next?
## Your Leadership Transformation Starts Now

**Three steps to accelerate your growth:**

1. **Review this report** — identify your top 3 action items and put them in your calendar this week
2. **Book your strategy call** — get personalized coaching guidance from a leadership expert at Careera
3. **Start your 90-day plan** — turn these insights into measurable results that get you promoted

---

Visit **careera.co** to book your leadership coaching call.

> "The best time to invest in your leadership was yesterday. The second best time is today."`);

  return cards.join('\n---\n');
}

async function createGammaGeneration(inputText, themeId) {
  const body = {
    inputText,
    textMode: 'preserve',
    format: 'presentation',
    numCards: 22,
    exportAs: 'pdf',
    additionalInstructions: 'Use a dark, premium design with dark backgrounds and light text throughout. Include relevant visual elements, icons, charts, and diagrams on every card. Make each card visually rich with clear hierarchy. Use bold section headers, clean typography, and professional spacing. The report should feel like a $500 executive coaching deliverable. Add visual separators, accent colors, and layout variety across cards.',
    textOptions: {
      amount: 'extensive',
      tone: 'professional, empowering, strategic, direct',
      audience: 'managers and aspiring leaders pursuing career advancement',
      language: 'en',
    },
    imageOptions: {
      source: 'aiGenerated',
      style: 'dark themed, minimal professional illustrations, abstract geometric patterns representing leadership and growth, cosmic/space-inspired accents with dark backgrounds, clean modern design',
    },
    cardOptions: {
      dimensions: '16x9',
      headerFooter: {
        bottomRight: { type: 'cardNumber' },
        topRight: { type: 'text', value: 'CAREERA' },
        hideFromFirstCard: true,
        hideFromLastCard: true,
      },
    },
    sharingOptions: {
      externalAccess: 'view',
    },
  };

  if (themeId) {
    body.themeId = themeId;
  }

  const response = await axios.post(`${GAMMA_API_BASE}/generations`, body, {
    headers: {
      'X-API-KEY': GAMMA_API_KEY,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  return response.data;
}

async function pollGammaGeneration(generationId, maxWaitMs = 300000) {
  const startTime = Date.now();
  const pollInterval = 5000;

  while (Date.now() - startTime < maxWaitMs) {
    try {
      const response = await axios.get(`${GAMMA_API_BASE}/generations/${generationId}`, {
        headers: { 'X-API-KEY': GAMMA_API_KEY },
        timeout: 15000,
      });

      const data = response.data;
      console.log('Gamma poll:', data.status, JSON.stringify(data).substring(0, 200));

      if (data.status === 'completed') return data;

      if (data.status === 'failed') {
        const errMsg = data.error?.message || 'Gamma generation failed';
        throw new Error(errMsg);
      }
    } catch (err) {
      if (err.message.includes('Gamma generation failed')) throw err;
      console.error('Gamma poll error (retrying):', err.message);
    }

    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  throw new Error('Gamma generation timed out after 5 minutes');
}

app.post('/api/generate-report', async (req, res) => {
  req.setTimeout(360000);
  res.setTimeout(360000);

  try {
    if (!GAMMA_API_KEY) {
      return res.status(500).json({ success: false, error: 'GAMMA_API_KEY is not configured' });
    }

    const { answers = {}, variant } = req.body || {};
    const questionAnswers = Object.entries(answers).map(([questionId, answer]) => ({
      questionId,
      answer: String(answer || ''),
    }));
    const seed = hashString(JSON.stringify(questionAnswers));

    console.log('Step 1/4: Generating AI analysis...');
    let aiRaw = null;
    try {
      aiRaw = await generateAnalysis(questionAnswers);
    } catch (e) {
      console.error('AI analysis failed, using fallback:', e.message);
    }
    const analysis = normalizeAnalysis(aiRaw, seed);

    console.log('Step 2/4: Finding dark theme...');
    const darkThemeId = await findDarkTheme();
    console.log('Dark theme ID:', darkThemeId || 'none found, using additionalInstructions');

    console.log('Step 3/4: Creating Gamma generation...');
    const inputText = buildGammaInputText(analysis);
    const generation = await createGammaGeneration(inputText, darkThemeId);
    const generationId = generation.generationId;
    console.log('Gamma generation created:', generationId);

    console.log('Step 4/4: Polling for completion...');
    const result = await pollGammaGeneration(generationId);
    console.log('Gamma generation complete. Full response:', JSON.stringify(result));

    const gammaUrl = result.gammaUrl || result.gamma_url || result.url || null;
    const exportUrl = result.exportUrl || result.export_url || result.fileUrl || result.file_url || result.pdfUrl || result.pdf_url || result.file?.url || null;

    res.json({
      success: true,
      gammaUrl,
      exportUrl,
      generationId,
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

app.get(/^\/(?!api\/)(?!.*\.).*/, (req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
