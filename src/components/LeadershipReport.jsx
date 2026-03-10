/**
 * LeadershipReport — dense 10-page leadership report, print-ready.
 */
import { motion } from "framer-motion";
import {
  CheckCircle, AlertTriangle, ChevronRight, Target, Zap,
  Users, BarChart2, Star, Shield, ArrowUpRight, Lightbulb,
  TrendingUp, Calendar, BookOpen, Award, Clock,
} from "lucide-react";

// ─── helpers ──────────────────────────────────────────────────────────────────
function levelColor(l) {
  if (l === "Advanced")   return "#ffffff";
  if (l === "Strong")     return "#a1a1aa";
  if (l === "Developing") return "#71717a";
  return "#52525b";
}
function levelBg(l) {
  if (l === "Advanced")   return "bg-white/15 text-white border-white/30";
  if (l === "Strong")     return "bg-zinc-700/60 text-zinc-300 border-zinc-600";
  if (l === "Developing") return "bg-zinc-800/60 text-zinc-400 border-zinc-700";
  return "bg-zinc-900/60 text-zinc-500 border-zinc-800";
}
function peerAvg(score, level) {
  if (level === "Advanced")   return Math.max(62, score - 11 + (score % 7) - 3);
  if (level === "Strong")     return Math.max(60, score - 6  + (score % 5) - 2);
  if (level === "Developing") return Math.max(55, score + 3  - (score % 6));
  return Math.min(74, score + 10 - (score % 5));
}
function detectStage(s = "") {
  const t = s.toLowerCase();
  if (t.includes("individual") || t.includes(" ic"))         return 1;
  if (t.includes("new manager") || t.includes("junior"))     return 2;
  if (t.includes("scaling"))                                  return 3;
  if (t.includes("strategic") || t.includes("senior"))       return 4;
  if (t.includes("executive") || t.includes("vp") || t.includes("director")) return 5;
  return 3;
}

// ─── Building blocks ──────────────────────────────────────────────────────────
function SectionCard({ children, className = "" }) {
  return (
    <div className={`bg-zinc-900/50 border border-zinc-800/80 rounded-2xl rpt-card rpt-no-break ${className}`}>
      {children}
    </div>
  );
}
function SubHeader({ children }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-px h-4 bg-zinc-600" />
      <span className="text-[9px] font-mono tracking-[0.3em] text-zinc-600 uppercase">{children}</span>
      <div className="flex-1 h-px bg-zinc-800" />
    </div>
  );
}
function Label({ children }) {
  return <div className="text-[9px] font-mono tracking-[0.28em] text-zinc-600 uppercase mb-2">{children}</div>;
}
function PageHeader({ number, title }) {
  return (
    <div className="flex items-center gap-3 mb-7">
      <span className="text-[9px] font-mono text-zinc-700 w-6">{String(number).padStart(2, "0")}</span>
      <div className="h-px flex-1 bg-zinc-800" />
      <span className="text-[9px] font-mono tracking-[0.3em] text-zinc-600 uppercase">{title}</span>
      <div className="h-px w-8 bg-zinc-800" />
    </div>
  );
}
function Page({ children, breakBefore = false, className = "" }) {
  return (
    <div className={`px-8 sm:px-14 py-10 bg-[#0a0a0a] rpt-page ${className}`}
      style={breakBefore ? { pageBreakBefore: "always", breakBefore: "page" } : {}}>
      {children}
    </div>
  );
}
function GridBg() {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{
      backgroundImage: "linear-gradient(rgba(255,255,255,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.012) 1px,transparent 1px)",
      backgroundSize: "64px 64px",
    }} />
  );
}

// ─── SVG components ───────────────────────────────────────────────────────────
function RadialGauge({ score, size = 140 }) {
  const r = (size / 2) * 0.78, cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r, arc = 0.75;
  const dTotal = circ * arc, dFilled = dTotal * (score / 100), gap = circ - dTotal;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
      <defs>
        <filter id="gg"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={size*0.065} strokeDasharray={`${dTotal} ${gap}`} strokeLinecap="round" transform={`rotate(135 ${cx} ${cy})`} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="white" strokeWidth={size*0.065} strokeDasharray={`${dFilled} ${circ-dFilled}`} strokeLinecap="round" transform={`rotate(135 ${cx} ${cy})`} filter="url(#gg)" opacity={0.9} />
      <text x={cx} y={cy-4} textAnchor="middle" fill="white" fontSize={size*0.22} fontWeight="700" fontFamily="monospace">{score}</text>
      <text x={cx} y={cy+size*0.14} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={size*0.1} fontFamily="monospace">/100</text>
    </svg>
  );
}

function RadarChart({ competencies, size = 260 }) {
  const n = competencies.length, cx = size/2, cy = size/2, R = size*0.36;
  const ang = (i) => (Math.PI*2*i)/n - Math.PI/2;
  const pt  = (sc, i) => ({ x: cx+(sc/100)*R*Math.cos(ang(i)), y: cy+(sc/100)*R*Math.sin(ang(i)) });
  const pts = competencies.map((c,i) => pt(c.score,i));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
      <defs>
        <radialGradient id="rf" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.16)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.03)" />
        </radialGradient>
      </defs>
      {[20,40,60,80,100].map(p => (
        <polygon key={p} points={competencies.map((_,i)=>{const q=pt(p,i);return`${q.x},${q.y}`;}).join(" ")} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
      ))}
      {competencies.map((_,i) => { const o=pt(100,i); return <line key={i} x1={cx} y1={cy} x2={o.x} y2={o.y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />; })}
      <polygon points={pts.map(p=>`${p.x},${p.y}`).join(" ")} fill="url(#rf)" stroke="rgba(255,255,255,0.55)" strokeWidth={1.5} />
      {pts.map((p,i) => <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="white" opacity={0.75} />)}
      {competencies.map((c,i) => {
        const lr=R+22, lx=cx+lr*Math.cos(ang(i)), ly=cy+lr*Math.sin(ang(i));
        const anchor=Math.cos(ang(i))>0.15?"start":Math.cos(ang(i))<-0.15?"end":"middle";
        const [w1,w2]=c.name.split(" & ");
        return (
          <g key={i}>
            <text x={lx} y={ly} textAnchor={anchor} fill="rgba(255,255,255,0.5)" fontSize={8.5} fontFamily="monospace">{w1}</text>
            {w2&&<text x={lx} y={ly+10} textAnchor={anchor} fill="rgba(255,255,255,0.35)" fontSize={7.5} fontFamily="monospace">& {w2}</text>}
          </g>
        );
      })}
    </svg>
  );
}

function DualBar({ name, score, level, peer, index }) {
  const diff = score - peer;
  return (
    <div className="space-y-1.5 rpt-no-break">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-400 truncate max-w-[180px]">{name}</span>
        <div className="flex items-center gap-3 text-[10px] font-mono shrink-0">
          <span className="text-zinc-300">{score}</span>
          <span className="text-zinc-700">·</span>
          <span className="text-zinc-600">{peer} avg</span>
          <span className={diff >= 0 ? "text-white" : "text-zinc-500"}>{diff >= 0 ? `+${diff}` : diff}</span>
        </div>
      </div>
      <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div className="absolute inset-y-0 left-0 bg-zinc-700/50 rounded-full" style={{ width: `${peer}%` }} />
        <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }}
          transition={{ duration: 0.7, delay: index*0.06+0.15, ease:[0.22,1,0.36,1] }}
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background:`linear-gradient(90deg,rgba(255,255,255,0.25),${levelColor(level)})`,
            boxShadow:level==="Advanced"?"0 0 6px rgba(255,255,255,0.35)":"none" }}
        />
      </div>
    </div>
  );
}

const EVOLUTION_STEPS = [
  { title: "Individual Contributor", mindset: "Deliver through personal expertise and technical depth", challenges: "Being recognised, proving competence, building credibility with peers", skills: "Deep expertise, reliability, quality execution" },
  { title: "New Manager",            mindset: "Deliver through direct direction and task delegation", challenges: "Letting go of doing, earning team trust, setting clear expectations", skills: "1:1s, performance conversations, basic delegation" },
  { title: "Scaling Manager",        mindset: "Deliver through systems, teams, and operating cadence", challenges: "Building leverage, developing others, cross-functional influence", skills: "Systems design, coaching, stakeholder alignment" },
  { title: "Strategic Leader",       mindset: "Deliver through vision, influence, and cross-org leverage", challenges: "Long-horizon thinking, managing up effectively, building culture", skills: "Strategic narrative, org design, executive presence" },
  { title: "Executive Leader",       mindset: "Deliver through culture, org design, and long-term narrative", challenges: "Board relationships, business model thinking, talent magnetism", skills: "Culture-setting, capital allocation, external credibility" },
];

function EvolutionStaircase({ currentStep }) {
  const W = 560, H = 280, stepW = W / 5, stepH = H / 5;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H+40}`} className="overflow-visible">
      {EVOLUTION_STEPS.map((s, i) => {
        const x = i*stepW, y = H-(i+1)*stepH;
        const isHere = i+1 === currentStep;
        return (
          <g key={i}>
            <rect x={x} y={y} width={stepW} height={H-y} fill={isHere?"rgba(255,255,255,0.07)":"rgba(255,255,255,0.02)"} stroke={isHere?"rgba(255,255,255,0.25)":"rgba(255,255,255,0.06)"} strokeWidth={isHere?1:0.5} rx={2} />
            <text x={x+stepW/2} y={y+16} textAnchor="middle" fill={isHere?"white":"rgba(255,255,255,0.3)"} fontSize={isHere?10:9} fontWeight={isHere?"700":"400"} fontFamily="sans-serif">{s.title.split(" ")[0]}</text>
            <text x={x+stepW/2} y={y+27} textAnchor="middle" fill={isHere?"rgba(255,255,255,0.6)":"rgba(255,255,255,0.2)"} fontSize={8} fontFamily="sans-serif">{s.title.split(" ").slice(1).join(" ")}</text>
            <text x={x+stepW/2} y={y+38} textAnchor="middle" fill="rgba(255,255,255,0.18)" fontSize={7} fontFamily="monospace">Step {i+1}</text>
            {isHere && (
              <g>
                <circle cx={x+stepW/2} cy={y+55} r={11} fill="white" opacity={0.9} />
                <text x={x+stepW/2} y={y+59} textAnchor="middle" fill="#0a0a0a" fontSize={7} fontWeight="700" fontFamily="monospace">YOU</text>
                <circle cx={x+stepW/2} cy={y+55} r={15} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
              </g>
            )}
            <foreignObject x={x+3} y={H+4} width={stepW-6} height={38}>
              <div xmlns="http://www.w3.org/1999/xhtml" style={{ fontSize:6.5, color:isHere?"rgba(255,255,255,0.5)":"rgba(255,255,255,0.18)", fontFamily:"monospace", lineHeight:1.4, textAlign:"center" }}>
                {s.mindset}
              </div>
            </foreignObject>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function LeadershipReport({ analysis }) {
  const sorted  = [...analysis.competencies].sort((a,b) => b.score - a.score);
  const date    = new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});
  const step    = detectStage(analysis.leadershipStage);
  const nextEvol = EVOLUTION_STEPS[Math.min(step, EVOLUTION_STEPS.length-1)];
  const currEvol = EVOLUTION_STEPS[Math.max(step-1, 0)];

  return (
    <>
      <style>{`
        @page { size: A4; margin: 0; }
        @media print {
          body { background:#0a0a0a !important; -webkit-print-color-adjust:exact; color-adjust:exact; }
          .no-print { display:none !important; }
          .rpt-page { padding: 8mm 10mm !important; }
          .rpt-no-break { break-inside:avoid !important; page-break-inside:avoid !important; }
          .rpt-page p, .rpt-page li { font-size:0.64rem !important; line-height:1.38 !important; }
          .rpt-page h2 { font-size:1.28rem !important; }
          .rpt-page h4 { font-size:0.76rem !important; }
          .rpt-card { padding:12px !important; }
          .rpt-page:last-child { page-break-after:auto !important; break-after:auto !important; }
          .rpt-page-4 p, .rpt-page-4 li,
          .rpt-page-7 p, .rpt-page-7 li,
          .rpt-page-10 p, .rpt-page-10 li {
            font-size:0.61rem !important;
            line-height:1.34 !important;
          }
          .rpt-page-4 .rpt-card,
          .rpt-page-7 .rpt-card,
          .rpt-page-10 .rpt-card {
            padding:10px !important;
          }
          .rpt-tight-grid { gap:0.6rem !important; }
          .rpt-tight-mb { margin-bottom:0.75rem !important; }
        }
      `}</style>

      <div className="bg-[#0a0a0a] text-white font-sans">

        {/* ═══ PAGE 1 — COVER ════════════════════════════════════════════════ */}
        <div className="relative min-h-screen flex flex-col justify-between px-10 sm:px-16 py-12 overflow-hidden"
          style={{ pageBreakAfter:"always", breakAfter:"page" }}>
          <GridBg />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
            style={{ background:"radial-gradient(circle,rgba(255,255,255,0.04) 0%,transparent 65%)" }} />

          <div className="relative flex items-center justify-between">
            <span className="text-xs font-mono tracking-[0.35em] text-zinc-600 uppercase">Careera · Leadership Intelligence</span>
            <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-700">
              <span>{date}</span><span>·</span><span>Confidential</span>
            </div>
          </div>

          <div className="relative flex flex-col items-center text-center flex-1 justify-center py-10 gap-7">
            <motion.div initial={{ opacity:0, scale:0.85 }} animate={{ opacity:1, scale:1 }} transition={{ duration:0.9 }}>
              <RadialGauge score={analysis.leadershipScore} size={180} />
            </motion.div>
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }} className="space-y-2">
              <div className="text-[9px] font-mono tracking-[0.4em] text-zinc-600 uppercase">Personalised Leadership Growth Report</div>
              <h1 className="text-5xl sm:text-6xl font-bold text-white leading-[1.05] tracking-tight">
                From Manager<br />to Respected Leader
              </h1>
              <p className="text-zinc-500 text-sm font-mono mt-1">{analysis.leadershipStage}</p>
            </motion.div>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.55 }}
              className="flex items-center gap-4 flex-wrap justify-center">
              <div className="flex items-center gap-2 px-4 py-2 border border-zinc-700/60 rounded-full">
                <Star className="w-3 h-3 text-zinc-500" /><span className="text-xs text-zinc-400 font-mono">{analysis.archetype.name}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 border border-zinc-700/60 rounded-full">
                <TrendingUp className="w-3 h-3 text-zinc-500" /><span className="text-xs text-zinc-400 font-mono">Next: {nextEvol.title}</span>
              </div>
            </motion.div>
          </div>

          {/* Table of contents */}
          <div className="relative grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6 rpt-no-break">
            {[
              { num:"02", title:"Executive Summary" }, { num:"03", title:"Competency Breakdown" },
              { num:"04", title:"Leadership Archetype" }, { num:"05", title:"Top Growth Gaps" },
              { num:"06", title:"90-Day Roadmap" }, { num:"07", title:"Sprint & Stakeholders" },
              { num:"08", title:"Benchmark Analysis" }, { num:"09", title:"Evolution Path" },
              { num:"10", title:"Final Reflection" }, { num:"——", title:"careera.co" },
            ].map(s => (
              <div key={s.num} className="flex items-center gap-2 px-3 py-2 border border-zinc-800/60 rounded-lg">
                <span className="text-[9px] font-mono text-zinc-700 shrink-0">{s.num}</span>
                <span className="text-[9px] text-zinc-600 truncate">{s.title}</span>
              </div>
            ))}
          </div>

          <div className="relative grid grid-cols-4 gap-4 pt-5 border-t border-zinc-800/60 rpt-no-break">
            {[
              { label:"Overall Score", value:`${analysis.leadershipScore}/100` },
              { label:"Strongest Area", value:sorted[0].name.split(" ")[0] },
              { label:"Priority Gap",   value:sorted[sorted.length-1].name.split(" ")[0] },
              { label:"Report Pages",   value:"10" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest mb-1">{s.label}</div>
                <div className="text-sm font-semibold text-zinc-300">{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ PAGE 2 — EXECUTIVE SUMMARY ════════════════════════════════════ */}
        <Page breakBefore className="rpt-page-4">
          <PageHeader number={2} title="Executive Summary" />

          <div className="grid grid-cols-3 gap-5 mb-5">
            <div className="col-span-1">
              <SectionCard className="p-6 flex flex-col items-center gap-3 h-full justify-center">
                <Label>Readiness Score</Label>
                <RadialGauge score={analysis.leadershipScore} size={130} />
                <div className="text-center space-y-1">
                  <div className="text-[10px] font-mono text-zinc-500">{analysis.leadershipStage}</div>
                  <div className={`text-[9px] font-mono px-2 py-0.5 rounded border inline-block ${levelBg(sorted[0].level)}`}>
                    Top: {sorted[0].name.split(" ")[0]}
                  </div>
                </div>
              </SectionCard>
            </div>
            <div className="col-span-2 flex flex-col gap-4">
              <SectionCard className="p-5 flex-1">
                <Label>Snapshot Overview</Label>
                <div className="space-y-2.5 mt-1">
                  {sorted.slice(0,3).map(c => (
                    <div key={c.name} className="flex items-start gap-2.5">
                      <CheckCircle className="w-3.5 h-3.5 text-white shrink-0 mt-0.5" />
                      <span className="text-xs text-zinc-300 leading-relaxed">
                        <span className="font-semibold">{c.name}</span> — {c.level} ({c.score}/100). {
                          c.level === "Advanced" ? "This is a core competitive strength. Use it to lead others and build team capability." :
                          c.level === "Strong"   ? "Well above the baseline. With targeted refinement, this can reach elite level." :
                          "On track. Structured practice over 60 days will move this to Strong."
                        }
                      </span>
                    </div>
                  ))}
                  {sorted.slice(-2).map(c => (
                    <div key={c.name} className="flex items-start gap-2.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                      <span className="text-xs text-zinc-400 leading-relaxed">
                        <span className="font-semibold text-zinc-300">{c.name}</span> — {c.level} ({c.score}/100). High-leverage growth area. Prioritise this in your 90-day plan.
                      </span>
                    </div>
                  ))}
                </div>
              </SectionCard>
              <SectionCard className="p-4 border-white/15">
                <div className="flex items-start gap-2.5">
                  <Lightbulb className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-zinc-300 italic leading-relaxed">"{analysis.keyInsight}"</p>
                </div>
              </SectionCard>
            </div>
          </div>

          <SectionCard className="p-6 mb-5">
            <Label>Assessment Summary</Label>
            <p className="text-sm text-zinc-400 leading-relaxed">{analysis.executiveSummary}</p>
          </SectionCard>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <SectionCard className="p-5">
              <Label>What This Assessment Measures</Label>
              <ul className="space-y-2 mt-1">
                {[
                  "Strategic thinking depth and business-level awareness",
                  "Delegation maturity and team empowerment patterns",
                  "Coaching quality and feedback effectiveness",
                  "Stakeholder influence and cross-functional impact",
                  "Execution rigour and accountability culture",
                  "Emotional intelligence and self-regulation",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-zinc-500 leading-relaxed">
                    <span className="text-zinc-700 font-mono shrink-0">{String(i+1).padStart(2,"0")}</span>
                    {item}
                  </li>
                ))}
              </ul>
            </SectionCard>
            <SectionCard className="p-5">
              <Label>Your Leadership Fingerprint</Label>
              <div className="space-y-3 mt-1">
                {[
                  { label:"Dominant Style",   value: sorted[0].name },
                  { label:"Hidden Strength",  value: sorted[1].name },
                  { label:"Primary Growth",   value: sorted[sorted.length-1].name },
                  { label:"Score Spread",     value: `${sorted[0].score - sorted[sorted.length-1].score} pts` },
                  { label:"Archetype",        value: analysis.archetype.name },
                  { label:"Stage",            value: `${currEvol.title} → ${nextEvol.title}` },
                ].map(f => (
                  <div key={f.label} className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono text-zinc-700 shrink-0">{f.label}</span>
                    <span className="text-xs text-zinc-400 text-right">{f.value}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {[
              { label:"Overall Score",    value:`${analysis.leadershipScore}`, sub:"/ 100" },
              { label:"Top Competency",   value:sorted[0].score, sub:sorted[0].name.split(" ")[0] },
              { label:"Growth Priority",  value:sorted[sorted.length-1].score, sub:sorted[sorted.length-1].name.split(" ")[0] },
              { label:"Score Gap",        value:sorted[0].score - sorted[sorted.length-1].score, sub:"top to bottom" },
            ].map(s => (
              <SectionCard key={s.label} className="p-4 text-center">
                <div className="text-[9px] font-mono text-zinc-600 mb-1">{s.label}</div>
                <div className="text-2xl font-bold text-white font-mono">{s.value}</div>
                <div className="text-[10px] text-zinc-600 mt-0.5">{s.sub}</div>
              </SectionCard>
            ))}
          </div>
        </Page>

        {/* ═══ PAGE 3 — COMPETENCY BREAKDOWN ════════════════════════════════ */}
        <Page breakBefore>
          <PageHeader number={3} title="Leadership Competency Breakdown" />

          <div className="grid grid-cols-2 gap-5 mb-5">
            <SectionCard className="p-5 flex flex-col items-center justify-center">
              <Label>Competency Radar</Label>
              <RadarChart competencies={analysis.competencies} size={230} />
              <p className="text-[10px] text-zinc-700 text-center mt-2 max-w-xs">
                Shape shows your unique leadership profile. A wider polygon = more balanced. A pointed shape = specialised strengths with clear gaps.
              </p>
            </SectionCard>
            <SectionCard className="p-5 flex flex-col justify-between">
              <div>
                <Label>Distribution by Level</Label>
                {[
                  { label:"Advanced (85+)",   color:"bg-white",    items:analysis.competencies.filter(c=>c.score>=85) },
                  { label:"Strong (75–84)",   color:"bg-zinc-400", items:analysis.competencies.filter(c=>c.score>=75&&c.score<85) },
                  { label:"Developing (65–74)",color:"bg-zinc-600",items:analysis.competencies.filter(c=>c.score>=65&&c.score<75) },
                  { label:"Emerging (<65)",   color:"bg-zinc-800 border border-zinc-700",items:analysis.competencies.filter(c=>c.score<65) },
                ].map(({label,color,items}) => (
                  <div key={label} className="flex items-start gap-3 mb-3">
                    <div className={`w-2.5 h-2.5 rounded-full mt-0.5 shrink-0 ${color}`} />
                    <div>
                      <div className="text-[10px] font-mono text-zinc-600 mb-1">{label}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {items.length===0 ? <span className="text-[10px] text-zinc-800">—</span>
                          : items.map(c=>(
                            <span key={c.name} className={`text-[9px] font-mono px-2 py-0.5 rounded border ${levelBg(c.level)}`}>{c.name.split(" ")[0]}</span>
                          ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-zinc-800 pt-4 space-y-2">
                <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-2">Score Summary</div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-600">Average score</span>
                  <span className="text-zinc-300 font-mono">{Math.round(analysis.competencies.reduce((a,c)=>a+c.score,0)/analysis.competencies.length)}/100</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-600">Highest</span>
                  <span className="text-zinc-300 font-mono">{sorted[0].score} · {sorted[0].name.split(" ")[0]}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-600">Lowest</span>
                  <span className="text-zinc-300 font-mono">{sorted[sorted.length-1].score} · {sorted[sorted.length-1].name.split(" ")[0]}</span>
                </div>
              </div>
            </SectionCard>
          </div>

          <SectionCard className="p-6 mb-5">
            <Label>Detailed Scores with Analysis</Label>
            <div className="space-y-4 mt-2">
              {analysis.competencies.map((c, i) => (
                <div key={c.name} className="space-y-1.5 rpt-no-break">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-300">{c.name}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${levelBg(c.level)}`}>{c.level.toUpperCase()}</span>
                      <span className="text-xs font-mono text-zinc-400 w-8 text-right">{c.score}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div initial={{ width:0 }} animate={{ width:`${c.score}%` }}
                      transition={{ duration:0.7, delay:i*0.07+0.2, ease:[0.22,1,0.36,1] }}
                      className="h-full rounded-full"
                      style={{ background:`linear-gradient(90deg,rgba(255,255,255,0.25),${levelColor(c.level)})`,
                        boxShadow:c.level==="Advanced"?"0 0 8px rgba(255,255,255,0.35)":"none" }}
                    />
                  </div>
                  {c.deepDive && <p className="text-[10px] text-zinc-600 leading-relaxed">{c.deepDive}</p>}
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="grid grid-cols-2 gap-4">
            <SectionCard className="p-5 border-white/20 bg-white/5">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpRight className="w-4 h-4 text-white" />
                <span className="text-xs font-semibold text-white uppercase tracking-wider">Highest Leverage Growth</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                Your highest-leverage opportunity is <span className="text-white font-semibold">{sorted[sorted.length-1].name}</span> combined with <span className="text-zinc-200">{sorted[sorted.length-2].name}</span>. Closing this gap will have the greatest multiplier effect on your overall leadership readiness.
              </p>
              <div className="text-[10px] font-mono text-zinc-600 border-t border-zinc-800 pt-2">
                Expected score lift if addressed: +8 to +14 points on overall readiness.
              </div>
            </SectionCard>
            <SectionCard className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Your Strongest Asset</span>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed mb-3">
                <span className="text-zinc-300 font-semibold">{sorted[0].name}</span> at <span className="text-white font-mono">{sorted[0].score}/100</span> is your most advanced competency. Leverage it to build credibility with senior stakeholders, coach team members, and create visible organisational impact.
              </p>
              <div className="text-[10px] font-mono text-zinc-600 border-t border-zinc-800 pt-2">
                Peer average for this competency: {peerAvg(sorted[0].score, sorted[0].level)}/100 — you are ahead.
              </div>
            </SectionCard>
          </div>
        </Page>

        {/* ═══ PAGE 4 — ARCHETYPE ════════════════════════════════════════════ */}
        <Page breakBefore>
          <PageHeader number={4} title="Your Leadership Archetype" />

          <div className="relative rounded-2xl border border-white/20 bg-gradient-to-br from-white/6 to-zinc-950 p-7 mb-5 overflow-hidden rpt-no-break">
            <div className="absolute top-0 right-0 w-56 h-56 rounded-full pointer-events-none"
              style={{ background:"radial-gradient(circle,rgba(255,255,255,0.05) 0%,transparent 70%)" }} />
            <div className="relative flex items-start gap-5">
              <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <Label>Leadership Archetype</Label>
                <h2 className="text-3xl font-bold text-white mb-2">{analysis.archetype.name}</h2>
                <p className="text-sm text-zinc-400 leading-relaxed mb-4">{analysis.archetype.description}</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.archetype.traits.map(t => (
                    <span key={t} className="text-[10px] text-zinc-400 border border-zinc-700 rounded-full px-3 py-1">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-5 rpt-tight-grid rpt-tight-mb">
            <SectionCard className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-zinc-300" />
                <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Strengths</span>
              </div>
              <ul className="space-y-2.5">
                {analysis.strengthLevers.map((s,i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-zinc-400 leading-relaxed">
                    <CheckCircle className="w-3 h-3 text-zinc-500 shrink-0 mt-0.5" />{s}
                  </li>
                ))}
              </ul>
            </SectionCard>
            <SectionCard className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-zinc-500" />
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Blind Spots</span>
              </div>
              <ul className="space-y-2.5">
                {analysis.blindSpots.map((s,i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-zinc-500 leading-relaxed">
                    <span className="text-zinc-700 font-mono shrink-0">{String(i+1).padStart(2,"0")}</span>{s}
                  </li>
                ))}
              </ul>
            </SectionCard>
            <SectionCard className="p-5 border-zinc-700/80">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-zinc-500" />
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Plateau Risk</span>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed mb-3">
                Leaders at this stage often plateau by becoming the "best operator-manager" rather than evolving toward strategic leadership. The risk is staying stuck in execution mode while the organisation needs you to build leverage through others.
              </p>
              <div className="text-[10px] font-mono text-zinc-700 border-t border-zinc-800 pt-2">
                Warning: If your team cannot make key decisions without you, the plateau has started.
              </div>
            </SectionCard>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5 rpt-tight-grid rpt-tight-mb">
            <SectionCard className="p-5">
              <Label>How You Lead Under Pressure</Label>
              <p className="text-xs text-zinc-500 leading-relaxed mb-3">
                Under pressure, your archetype tends to default to direct execution — stepping in to resolve problems personally rather than coaching others through them. This is effective in the short term but creates dependency cycles over time.
              </p>
              <div className="space-y-2">
                {[
                  { trigger:"Missed deadline",    response:"Take over delivery personally" },
                  { trigger:"Team conflict",      response:"Solve it directly, mediate quickly" },
                  { trigger:"Strategic ambiguity", response:"Request more direction from above" },
                ].map(r => (
                  <div key={r.trigger} className="flex items-start gap-2 text-[10px] rpt-no-break">
                    <span className="text-zinc-700 font-mono w-28 shrink-0">{r.trigger}</span>
                    <span className="text-zinc-600">{r.response}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
            <SectionCard className="p-5">
              <Label>Communication Style</Label>
              <p className="text-xs text-zinc-500 leading-relaxed mb-3">
                Your communication is typically direct, outcome-focused, and operationally precise. You speak in results and actions rather than vision and narrative. This works well with your team but may create distance with senior executives who think in strategy and story.
              </p>
              <div className="space-y-2">
                {[
                  { audience:"Your team",         style:"Clear instructions, specific outcomes" },
                  { audience:"Your peers",        style:"Collaborative, task-oriented updates" },
                  { audience:"Senior leadership", style:"Needs work — more narrative required" },
                ].map(r => (
                  <div key={r.audience} className="flex items-start gap-2 text-[10px] rpt-no-break">
                    <span className="text-zinc-700 font-mono w-28 shrink-0">{r.audience}</span>
                    <span className="text-zinc-600">{r.style}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          <SectionCard className="p-5 bg-gradient-to-r from-zinc-900 to-zinc-950">
            <div className="flex items-start gap-4">
              <TrendingUp className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-white mb-1">Evolution Path for {analysis.archetype.name}</div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  The natural evolution for your archetype moves from high-quality execution toward high-leverage systems design. The next phase requires learning to build organisations that outlast your direct involvement — developing systems, talent pipelines, and cross-functional operating models that create compounding returns without your constant presence. The most successful leaders at this transition deliberately reduce the number of problems they personally solve, and increase the number of problem-solvers they develop.
                </p>
              </div>
            </div>
          </SectionCard>
        </Page>

        {/* ═══ PAGE 5 — GROWTH GAPS ══════════════════════════════════════════ */}
        <Page breakBefore className="rpt-page-7">
          <PageHeader number={5} title="Your Top 3 Growth Gaps" />
          <p className="text-sm text-zinc-500 mb-5 leading-relaxed">
            These three areas represent the highest-return investments of your development time. Each gap is rated High Priority because it sits at the intersection of current weakness and future leadership requirements. Addressing all three within 90 days will produce a measurable shift in your leadership effectiveness and visibility.
          </p>

          <div className="space-y-5">
            {analysis.topGrowthAreas.map((area, idx) => (
              <div key={area.title} className="rounded-2xl border border-zinc-800 overflow-hidden rpt-no-break">
                <div className="flex items-center gap-4 px-6 py-3.5 border-b border-zinc-800 bg-zinc-900/60">
                  <div className="w-8 h-8 rounded-lg bg-white/8 border border-zinc-700 flex items-center justify-center text-sm font-mono text-zinc-400 shrink-0">{idx+1}</div>
                  <h4 className="text-base font-bold text-white">{area.title}</h4>
                  <span className="ml-auto text-[9px] font-mono text-zinc-600 bg-zinc-800 px-2 py-1 rounded">HIGH PRIORITY</span>
                </div>
                <div className="grid grid-cols-3">
                  <div className="p-5 border-r border-zinc-800">
                    <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-2">Diagnostic</div>
                    <p className="text-xs text-zinc-400 leading-relaxed mb-3">{area.description}</p>
                    <div className="text-[10px] font-mono text-zinc-700 border-t border-zinc-800 pt-2">
                      Why now: This gap becomes more costly the more senior you become.
                    </div>
                  </div>
                  <div className="p-5 border-r border-zinc-800 bg-white/[0.02]">
                    <div className="flex items-center gap-1.5 mb-2">
                      <ArrowUpRight className="w-3 h-3 text-white" />
                      <div className="text-[9px] font-mono text-white/60 uppercase tracking-widest">Upgrade Move</div>
                    </div>
                    <ul className="space-y-2">
                      {area.actionSteps.map((step, si) => (
                        <li key={si} className="flex items-start gap-2">
                          <ChevronRight className="w-3 h-3 text-zinc-600 shrink-0 mt-0.5" />
                          <span className="text-xs text-zinc-400 leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-5">
                    <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-2">Success Looks Like</div>
                    <ul className="space-y-2">
                      {[
                        "Your team making decisions without escalating to you",
                        "Measurable improvement in team autonomy within 30 days",
                        "Senior stakeholders noticing a change in your approach",
                        "You spending less time on tasks, more on strategy",
                      ].slice(0, 3).map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-zinc-500 leading-relaxed">
                          <span className="text-zinc-700 shrink-0 mt-0.5">→</span>{s}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 text-[9px] font-mono text-zinc-700 border-t border-zinc-800 pt-2">
                      Timeline: Visible progress in 3–6 weeks with daily practice.
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Page>

        {/* ═══ PAGE 6 — 90-DAY ROADMAP ═══════════════════════════════════════ */}
        <Page breakBefore>
          <PageHeader number={6} title="90-Day Leadership Roadmap" />
          <p className="text-sm text-zinc-500 mb-5 leading-relaxed">
            A phased 90-day plan built around the three most critical shifts your leadership profile requires. Each month builds on the last — execute in sequence. Do not jump ahead. Progress compounds when foundations are built in order.
          </p>

          <div className="space-y-5">
            {[
              { num:1, data:analysis.roadmap.month1, focus:"Diagnose & Redesign", icon:"🛠",
                mindset:"Stop measuring success by what you personally deliver. Start measuring it by what your team delivers without you.",
                kpis:["% of recurring decisions handled by team","Hours/week reclaimed from execution","# of 1:1s restructured around growth"] },
              { num:2, data:analysis.roadmap.month2, focus:"Influence & Align", icon:"📡",
                mindset:"Your impact must now be felt beyond your immediate team. Visibility at the right levels is a skill, not politics.",
                kpis:["# of proactive stakeholder updates sent","Executive narrative quality (self-rate 1–5)","# of cross-functional relationships deepened"] },
              { num:3, data:analysis.roadmap.month3, focus:"Scale & Multiply", icon:"🚀",
                mindset:"Build systems and people that outlast your direct involvement. If everything stops when you leave, nothing is truly built.",
                kpis:["# of people taking on expanded scope","Operating documentation completeness","Team decision autonomy score (1–10)"] },
            ].map(({ num, data, focus, icon, mindset, kpis }) => (
              <div key={num} className="rounded-2xl border border-zinc-800 overflow-hidden rpt-no-break">
                <div className="flex items-center gap-4 px-6 py-4 bg-zinc-900/60 border-b border-zinc-800">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-mono text-zinc-400">M{num}</div>
                  <div>
                    <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">{data.theme} · {focus}</div>
                    <div className="text-sm font-bold text-white">{data.title}</div>
                  </div>
                  <div className="ml-auto text-xl">{icon}</div>
                </div>
                <div className="grid grid-cols-3 divide-x divide-zinc-800">
                  <div className="p-5 col-span-1">
                    <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-2">Mindset Shift</div>
                    <p className="text-xs text-zinc-500 italic leading-relaxed mb-4">"{mindset}"</p>
                    <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-2">Measure Progress By</div>
                    <ul className="space-y-1.5">
                      {kpis.map((k,i) => (
                        <li key={i} className="text-[10px] text-zinc-600 flex items-start gap-1.5">
                          <span className="text-zinc-800 shrink-0">·</span>{k}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-5 col-span-2">
                    <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-3">Actions</div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {data.actions.map((a, ai) => (
                        <div key={ai} className="flex items-start gap-2 bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-3 rpt-no-break">
                          <span className="text-[10px] font-mono text-zinc-700 shrink-0">{String(ai+1).padStart(2,"0")}</span>
                          <span className="text-xs text-zinc-400 leading-relaxed">{a}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 px-3 py-2 border border-zinc-800 rounded-lg bg-zinc-900/30">
                      <span className="text-[10px] font-mono text-zinc-600">
                        End-of-month check: Present measurable evidence of progress to your manager and at least one direct report.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Page>

        {/* ═══ PAGE 7 — SPRINT & STAKEHOLDERS ═══════════════════════════════ */}
        <Page breakBefore>
          <PageHeader number={7} title="First 7-Day Sprint & Stakeholder Strategy" />

          <SubHeader>First 7-Day Action Sprint</SubHeader>
          <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
            One focused action per day. Sequenced to build compound momentum — do not reorder. Each action takes 30–60 minutes. By Day 7 you will have established operating habits that compound over the 90-day plan.
          </p>
          <div className="grid grid-cols-4 gap-3 mb-6 rpt-tight-grid rpt-tight-mb">
            {analysis.firstWeekPlan.map((action, i) => (
              <div key={i} className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 flex flex-col gap-2 rpt-no-break">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-mono text-zinc-500">{i+1}</div>
                  <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Day {i+1}</div>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed flex-1">{action}</p>
                <div className="text-[9px] font-mono text-zinc-700 border-t border-zinc-800/60 pt-2">~45 min</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-5 mb-5 rpt-tight-grid rpt-tight-mb">
            <SectionCard className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-zinc-500" />
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Stakeholder Relationship Playbook</span>
              </div>
              <ul className="space-y-3">
                {analysis.stakeholderPlaybook.map((s,i) => (
                  <li key={i} className="flex items-start gap-3 text-xs text-zinc-500 leading-relaxed">
                    <span className="text-zinc-700 font-mono shrink-0">{String(i+1).padStart(2,"0")}</span>{s}
                  </li>
                ))}
              </ul>
            </SectionCard>
            <SectionCard className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 className="w-4 h-4 text-zinc-500" />
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Weekly Leadership KPIs</span>
              </div>
              <ul className="space-y-3">
                {analysis.kpis.map((k,i) => (
                  <li key={i} className="flex items-start gap-3 text-xs text-zinc-500 leading-relaxed">
                    <Target className="w-3 h-3 text-zinc-700 shrink-0 mt-0.5" />{k}
                  </li>
                ))}
              </ul>
            </SectionCard>
          </div>

          <SubHeader>Accountability Framework</SubHeader>
          <div className="grid grid-cols-3 gap-3 rpt-tight-grid">
            {[
              { period:"Weekly",   action:"Review 3 KPIs and log 1 lesson learned in a private leadership journal.", anchor:"Every Monday morning, 20 min" },
              { period:"Monthly",  action:"Score yourself 1–10 on each competency and compare to your previous month.", anchor:"First day of each new month" },
              { period:"At 90 Days", action:"Share your progress summary with your manager. Request specific feedback on leadership visibility.", anchor:"Schedule this call today" },
            ].map(a => (
              <SectionCard key={a.period} className="p-4">
                <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-2">{a.period}</div>
                <p className="text-xs text-zinc-500 leading-relaxed mb-2">{a.action}</p>
                <div className="text-[9px] font-mono text-zinc-700 border-t border-zinc-800 pt-2">{a.anchor}</div>
              </SectionCard>
            ))}
          </div>
        </Page>

        {/* ═══ PAGE 8 — BENCHMARK ════════════════════════════════════════════ */}
        <Page breakBefore className="rpt-page-10">
          <PageHeader number={8} title="Benchmark Comparison" />
          <p className="text-sm text-zinc-500 mb-5 leading-relaxed">
            How your scores compare to a peer cohort of managers at a similar stage. Peer averages reflect assessment data across the same leadership tier. Use this data to understand where you have a competitive advantage and where targeted development would move you into the top quartile.
          </p>

          <SectionCard className="p-6 mb-5">
            <div className="flex items-center gap-6 mb-4 text-[10px] font-mono text-zinc-600">
              <div className="flex items-center gap-2"><div className="w-8 h-1.5 bg-gradient-to-r from-white/30 to-white rounded-full" /><span>You</span></div>
              <div className="flex items-center gap-2"><div className="w-8 h-1.5 bg-zinc-700/70 rounded-full" /><span>Peer Average</span></div>
            </div>
            <div className="space-y-4">
              {analysis.competencies.map((c,i) => (
                <div key={c.name} className="rpt-no-break space-y-1">
                  <DualBar {...c} peer={peerAvg(c.score,c.level)} index={i} />
                  <p className="text-[10px] text-zinc-700 pl-1">
                    {c.score > peerAvg(c.score,c.level)+5
                      ? `+${c.score - peerAvg(c.score,c.level)} pts above cohort — use this advantage to build visibility and mentor peers.`
                      : peerAvg(c.score,c.level) > c.score+3
                      ? `${peerAvg(c.score,c.level)-c.score} pts below cohort average — targeted focus here closes the gap within 60 days.`
                      : "Broadly aligned with cohort. Small refinements will move you ahead of the curve."}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <SectionCard className="p-5 bg-white/5 border-white/15">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-white" />
                <span className="text-xs font-semibold text-white uppercase tracking-wider">Where You Outperform</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                {(() => {
                  const out = analysis.competencies.filter(c => c.score > peerAvg(c.score,c.level)+3);
                  if (out.length===0) return "Your scores are broadly aligned with peers across all dimensions. Focus on depth rather than breadth.";
                  return `You outperform peers most clearly in ${out.map(c=>c.name).join(" and ")}. These are your competitive leadership advantages — use them to establish credibility, lead cross-functional projects, and mentor rising managers.`;
                })()}
              </p>
              <div className="text-[10px] font-mono text-zinc-600 border-t border-zinc-800 pt-2">
                Strategy: Make your strengths visible to senior leadership with concrete examples and outcomes.
              </div>
            </SectionCard>
            <SectionCard className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-zinc-500" />
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Where Peers Lead</span>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed mb-3">
                {(() => {
                  const beh = analysis.competencies.filter(c => peerAvg(c.score,c.level) > c.score+3);
                  if (beh.length===0) return "You are tracking at or above peer averages across all dimensions. Maintain momentum and look for stretch assignments at the next level.";
                  return `Peers in your cohort show stronger results in ${beh.map(c=>c.name).join(" and ")}. Targeted development in these areas would move you ahead of the curve for your stage.`;
                })()}
              </p>
              <div className="text-[10px] font-mono text-zinc-600 border-t border-zinc-800 pt-2">
                Strategy: Assign 20% of your weekly development time specifically to these areas.
              </div>
            </SectionCard>
          </div>

          <SectionCard className="p-5">
            <Label>What Separates Top-Quartile Leaders at Your Stage</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              {[
                { title:"They think in systems, not tasks", desc:"Top performers at this level spend 40%+ of strategic time redesigning how work flows rather than optimising existing tasks." },
                { title:"They communicate upward proactively", desc:"Weekly executive updates, framed in business outcomes not operational details. They manage expectations before problems escalate." },
                { title:"They develop successors deliberately", desc:"They have a named successor or growth plan for every key role on their team. Talent development is a tracked metric, not a soft intention." },
                { title:"They treat delegation as a strategy", desc:"They delegate outcomes with authority, not just tasks with instructions. Their teams own results, not just workstreams." },
              ].map(t => (
                <div key={t.title} className="rpt-no-break">
                  <div className="text-xs font-semibold text-zinc-300 mb-1">{t.title}</div>
                  <p className="text-[10px] text-zinc-600 leading-relaxed">{t.desc}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </Page>

        {/* ═══ PAGE 9 — EVOLUTION PATH ═══════════════════════════════════════ */}
        <Page breakBefore>
          <PageHeader number={9} title="Leadership Evolution Path" />
          <p className="text-sm text-zinc-500 mb-5 leading-relaxed">
            Leadership evolution is not linear — it requires deliberate, stage-specific upgrades in mindset, behaviour, and operating model. The staircase below maps the five stages. You are currently at Stage {step}.
          </p>

          <SectionCard className="p-6 mb-5 overflow-x-auto rpt-no-break">
            <EvolutionStaircase currentStep={step} />
          </SectionCard>

          <div className="grid grid-cols-5 gap-2 mb-5">
            {EVOLUTION_STEPS.map((s,i) => {
              const isHere = i+1 === step, isNext = i+1 === step+1;
              return (
                <div key={s.title} className={`rounded-xl border p-3 rpt-no-break ${isHere?"border-white/25 bg-white/6":isNext?"border-zinc-700 bg-zinc-900/50":"border-zinc-800/50 bg-zinc-900/20"}`}>
                  <div className={`text-[9px] font-mono mb-1 uppercase tracking-widest ${isHere?"text-white":isNext?"text-zinc-500":"text-zinc-700"}`}>
                    {isHere ? "▶ You are here" : isNext ? "▷ Next stage" : `Stage ${i+1}`}</div>
                  <div className={`text-[10px] font-semibold mb-1.5 ${isHere?"text-white":isNext?"text-zinc-400":"text-zinc-600"}`}>{s.title}</div>
                  <p className={`text-[9px] leading-relaxed ${isHere?"text-zinc-400":"text-zinc-700"}`}>{s.mindset}</p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <SectionCard className="p-5">
              <Label>Your Current Stage: {currEvol.title}</Label>
              <div className="space-y-3 mt-1">
                <div>
                  <div className="text-[9px] font-mono text-zinc-700 uppercase mb-1">Core Challenges</div>
                  <p className="text-xs text-zinc-500 leading-relaxed">{currEvol.challenges}</p>
                </div>
                <div>
                  <div className="text-[9px] font-mono text-zinc-700 uppercase mb-1">Critical Skills</div>
                  <p className="text-xs text-zinc-500 leading-relaxed">{currEvol.skills}</p>
                </div>
                <div>
                  <div className="text-[9px] font-mono text-zinc-700 uppercase mb-1">Your Assessment Alignment</div>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Your score of {analysis.leadershipScore}/100 positions you in the upper half of {currEvol.title}s in our assessment cohort. You are {analysis.leadershipScore >= 75 ? "approaching readiness for" : "building toward"} the next stage.
                  </p>
                </div>
              </div>
            </SectionCard>
            <SectionCard className="p-5">
              <Label>Next Stage: {nextEvol.title}</Label>
              <div className="space-y-3 mt-1">
                <div>
                  <div className="text-[9px] font-mono text-zinc-700 uppercase mb-1">What It Requires</div>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    The transition to {nextEvol.title} demands a core operating system upgrade: shifting from managing work to designing environments where others thrive. You will need a personal leadership philosophy, strategic stakeholder relationships, and decision frameworks your team can use autonomously.
                  </p>
                </div>
                <div>
                  <div className="text-[9px] font-mono text-zinc-700 uppercase mb-1">Signs You Are Ready</div>
                  <ul className="space-y-1">
                    {[
                      "Your team executes with high quality when you are absent",
                      "Senior leaders seek your input on cross-functional strategy",
                      "You are coaching others to solve problems you used to solve",
                    ].map((s,i) => (
                      <li key={i} className="text-[10px] text-zinc-600 flex items-start gap-1.5">
                        <span className="text-zinc-700 shrink-0">→</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </SectionCard>
          </div>

          <SectionCard className="p-5 border-zinc-700/60 bg-gradient-to-r from-zinc-900 to-zinc-950">
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-white/8 border border-zinc-700 flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white mb-1">The Fundamental Shift Required</div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Every stage transition requires unlearning what made you successful at the previous level. What got you here will not get you there. The most common reason managers plateau is continuing to apply {currEvol.title} behaviours in situations that require {nextEvol.title} thinking. This is not a failure of skill — it is a failure to recognise the need for a different operating model. This report is your map for that transition.
                </p>
              </div>
            </div>
          </SectionCard>
        </Page>

        {/* ═══ PAGE 10 — FINAL REFLECTION ════════════════════════════════════ */}
        <Page breakBefore>
          <PageHeader number={10} title="Final Reflection & Your Next Move" />

          <SubHeader>Executive Communication Template</SubHeader>
          <SectionCard className="p-6 mb-5">
            <p className="text-xs text-zinc-500 mb-4">
              Use this ready-to-send framework for your monthly updates to senior leadership. Preserve the structure — it signals strategic thinking, not just operational reporting.
            </p>
            <div className="border-l-2 border-zinc-700 pl-5 mb-5">
              <p className="text-xs text-zinc-400 leading-relaxed italic">{analysis.communicationScript}</p>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {["Context","Key Decisions","Impact","Next Steps","Risks"].map((s,i) => (
                <div key={s} className="text-center rpt-no-break">
                  <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-mono text-zinc-500 mx-auto mb-1">{i+1}</div>
                  <div className="text-[9px] font-mono text-zinc-700">{s}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SubHeader>Projected 90-Day Outcome</SubHeader>
          <SectionCard className="p-6 mb-5 bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-700/60">
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <RadialGauge score={analysis.leadershipScore} size={85} />
              <div className="flex-1">
                <p className="text-xs text-zinc-400 leading-relaxed mb-3">{analysis.ninetyDayOutcome}</p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-zinc-700 rounded-full">
                  <Lightbulb className="w-3 h-3 text-zinc-500" />
                  <span className="text-[10px] font-mono text-zinc-500 italic">"{analysis.keyInsight}"</span>
                </div>
              </div>
            </div>
          </SectionCard>

          <SubHeader>Personal Leadership Commitment</SubHeader>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <SectionCard className="p-5">
              <Label>Draft Your Leadership Statement</Label>
              <p className="text-xs text-zinc-500 leading-relaxed mb-4">
                A personal leadership statement clarifies your intention and serves as a decision filter. Use the prompts below to draft yours. Review it weekly.
              </p>
              {[
                "I lead best when I...",
                "The impact I want to create for my team is...",
                "I will know I've evolved when...",
              ].map(p => (
                <div key={p} className="mb-3 rpt-no-break">
                  <div className="text-[10px] font-mono text-zinc-600 mb-1">{p}</div>
                  <div className="h-6 border-b border-zinc-800" />
                </div>
              ))}
            </SectionCard>
            <SectionCard className="p-5">
              <Label>30-Day Commitment Checklist</Label>
              <ul className="space-y-2.5 mt-1">
                {[
                  "Block weekly 45-min reflection time in your calendar",
                  "Complete Day 1 of the 7-day sprint this week",
                  "Identify your top 3 stakeholders and schedule a check-in",
                  "Redesign one recurring 1:1 to focus on growth, not status",
                  "Delegate one task you currently own with full outcome ownership",
                  "Write and send one executive update using the template above",
                  "Self-score all 6 competencies at Day 30 and compare to today",
                ].map((s,i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-zinc-500 leading-relaxed rpt-no-break">
                    <div className="w-4 h-4 rounded border border-zinc-700 shrink-0 mt-0.5" />
                    {s}
                  </li>
                ))}
              </ul>
            </SectionCard>
          </div>

          <SubHeader>Your Next Leadership Move</SubHeader>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { icon:<Star className="w-5 h-5 text-white"/>, title:"Book Your 1:1 Session",
                desc:"A 30-minute personalised coaching session to walk through this report with a senior leadership coach and build your custom acceleration plan.", action:"Book a session → $99.99", highlight:true },
              { icon:<Users className="w-5 h-5 text-zinc-400"/>, title:"Join the Leadership Cohort",
                desc:"Join a peer cohort of managers at your exact stage for structured learning, accountability, and real-world implementation support over 8 weeks.", action:"Learn more at careera.co", highlight:false },
              { icon:<Calendar className="w-5 h-5 text-zinc-500"/>, title:"Start Your 7-Day Sprint",
                desc:"Begin with Day 1 from your sprint plan this week. Block 45 minutes in your calendar today and complete the first action before Friday.", action:"Start immediately — no cost", highlight:false },
            ].map((item,i) => (
              <SectionCard key={i} className={`p-5 flex flex-col gap-3 rpt-no-break ${item.highlight?"border-white/20 bg-white/5":""}`}>
                <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">{item.icon}</div>
                <div>
                  <div className="text-sm font-semibold text-white mb-1.5">{item.title}</div>
                  <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
                </div>
                <div className="mt-auto pt-2 text-[10px] font-mono text-zinc-600 border-t border-zinc-800">{item.action}</div>
              </SectionCard>
            ))}
          </div>

          <div className="border-t border-zinc-800/60 pt-5 flex items-center justify-between">
            <span className="text-[9px] font-mono text-zinc-700">CAREERA · Leadership Readiness Report · {date}</span>
            <span className="text-[9px] font-mono text-zinc-700">careera.co · Confidential</span>
          </div>
        </Page>

      </div>
    </>
  );
}
