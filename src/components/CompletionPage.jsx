import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Calendar, CheckCircle } from "lucide-react";
import { getQuestionnaireVariant } from "../data/questions";
import Navbar from "./Navbar";
import CalendlyModal from "./CalendlyModal";
import LeadershipReport from "./LeadershipReport";

// ─── Console log steps ────────────────────────────────────────────────────────
const STEPS = [
  { id: 0, label: "INITIALIZING ANALYSIS PROTOCOL",         duration: 380 },
  { id: 1, label: "PARSING 12 ASSESSMENT RESPONSES",         duration: 520 },
  { id: 2, label: "MAPPING LEADERSHIP ARCHETYPE",            duration: 640 },
  { id: 3, label: "CROSS-REFERENCING MANAGEMENT PATTERNS",   duration: 700 },
  { id: 4, label: "IDENTIFYING DEVELOPMENT GAPS",            duration: 580 },
  { id: 5, label: "CALIBRATING GROWTH TRAJECTORY",           duration: 620 },
  { id: 6, label: "BUILDING PERSONALISED ACTION FRAMEWORK",  duration: 680 },
  { id: 7, label: "SCORING 5 LEADERSHIP DIMENSIONS",         duration: 540 },
  { id: 8, label: "GENERATING STRATEGIC ROADMAP",            duration: 700 },
  { id: 9, label: "COMPILING 12-PAGE REPORT",                duration: 999 },
];

function Cursor() {
  return (
    <motion.span
      animate={{ opacity: [1, 0] }}
      transition={{ duration: 0.55, repeat: Infinity, repeatType: "reverse" }}
      className="inline-block w-1.5 h-3.5 bg-white align-middle ml-0.5"
    />
  );
}

function ConsoleLine({ label, status, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className="flex items-center justify-between gap-4 py-0.5"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-zinc-600 shrink-0 font-mono text-[10px] sm:text-xs w-5 text-right">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="text-zinc-300 font-mono text-[10px] sm:text-xs tracking-wide truncate">
          &gt; {label}
          {status === "running" && <Cursor />}
        </span>
      </div>
      <div className="shrink-0">
        {status === "done" && (
          <motion.span
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-[10px] font-mono text-white bg-white/10 px-2 py-0.5 rounded"
          >
            DONE
          </motion.span>
        )}
        {status === "running" && (
          <motion.span
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="text-[10px] font-mono text-zinc-400"
          >
            RUN
          </motion.span>
        )}
        {status === "queued" && (
          <span className="text-[10px] font-mono text-zinc-700">···</span>
        )}
      </div>
    </motion.div>
  );
}

// ─── Mission Control console ──────────────────────────────────────────────────
function MissionControlConsole({ onComplete, answers }) {
  const [visibleSteps, setVisibleSteps] = useState([]);
  const [runningStep, setRunningStep]   = useState(-1);
  const [progress, setProgress]         = useState(0);
  const [elapsed, setElapsed]           = useState(0);  // seconds since start
  const elapsedTimer = useRef(null);

  // Refs so the animation effect never needs to re-run when API resolves
  const apiDoneRef    = useRef(false);
  const reportDataRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  const stepTimer     = useRef(null);
  const progressTimer = useRef(null);

  // Keep onComplete ref current
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // Kick off API call once
  useEffect(() => {
    const variant = getQuestionnaireVariant();
    fetch("/api/generate-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers, variant }),
    })
      .then((r) => r.json())
      .then((data) => { reportDataRef.current = data; apiDoneRef.current = true; })
      .catch(() => { apiDoneRef.current = true; });
  }, [answers]); // eslint-disable-line react-hooks/exhaustive-deps

  // Animation loop — runs exactly once
  useEffect(() => {
    let stepIdx = 0;
    // Total time the step animation takes (all steps except the last waiting one)
    const animDuration = STEPS.slice(0, -1).reduce((a, s) => a + s.duration, 0);
    const progStart = Date.now();

    // Two-phase progress:
    //   Phase 1 (0 → animDuration ms):  linear 0 % → 92 %
    //   Phase 2 (waiting for API):       asymptotic crawl 92 % → 99 %
    //   On API complete:                 snap to 100 %
    progressTimer.current = setInterval(() => {
      const elapsed = Date.now() - progStart;
      if (elapsed <= animDuration) {
        // Linear ramp during the step animation
        setProgress(Math.round((elapsed / animDuration) * 92));
      } else {
        // Asymptotic: 99 - 7·e^(-0.03·waitSeconds)
        // Reaches ~93 % after 5 s, ~95 % after 11 s, ~98 % after 30 s — never hits 99 %
        const waitSecs = (elapsed - animDuration) / 1000;
        const extra = 7 * (1 - Math.exp(-0.03 * waitSecs));
        setProgress(Math.min(99, Math.round(92 + extra)));
      }
    }, 100);

    const runStep = () => {
      if (stepIdx >= STEPS.length) return;
      const step = STEPS[stepIdx];
      setVisibleSteps((prev) => [...prev, stepIdx]);
      setRunningStep(stepIdx);

      if (stepIdx === STEPS.length - 1) {
        // Last step: poll until API done, then complete
        const waitForApi = () => {
          if (apiDoneRef.current) {
            clearInterval(progressTimer.current);
            setRunningStep(-1);
            setProgress(100);
            stepTimer.current = setTimeout(() => onCompleteRef.current(reportDataRef.current), 500);
          } else {
            stepTimer.current = setTimeout(waitForApi, 200);
          }
        };
        stepTimer.current = setTimeout(waitForApi, step.duration);
      } else {
        stepTimer.current = setTimeout(() => { stepIdx++; runStep(); }, step.duration);
      }
    };

    // Elapsed seconds counter (for the status line)
    elapsedTimer.current = setInterval(() => {
      setElapsed(s => s + 1);
    }, 1000);

    runStep();
    return () => {
      clearTimeout(stepTimer.current);
      clearInterval(progressTimer.current);
      clearInterval(elapsedTimer.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 pt-24 pb-12">
        <div className="w-full max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-6"
          >
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.4, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-white"
              style={{ boxShadow: "0 0 8px 2px rgba(255,255,255,0.5)" }}
            />
            <span className="text-[10px] sm:text-xs font-mono text-zinc-500 tracking-[0.3em] uppercase">
              Mission Control · Analysis System
            </span>
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.9, repeat: Infinity }}
              className="ml-auto text-[9px] font-mono text-white/40"
            >
              ● LIVE
            </motion.span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative rounded-2xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-sm overflow-hidden"
          >
            <motion.div
              className="absolute left-0 right-0 h-16 pointer-events-none z-10"
              style={{ background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.03), transparent)" }}
              animate={{ top: ["-5%", "105%"] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "linear", repeatDelay: 0.4 }}
            />
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-zinc-800/70">
              <div className="flex gap-1.5">
                {["bg-zinc-700", "bg-zinc-700", "bg-zinc-700"].map((c, i) => (
                  <div key={i} className={`w-2.5 h-2.5 rounded-full ${c}`} />
                ))}
              </div>
              <span className="flex-1 text-center text-[10px] font-mono text-zinc-600 tracking-widest">
                careera@mission-control:~$ ./build-leadership-report.sh
              </span>
            </div>
            <div className="h-[320px] overflow-y-auto p-5 sm:p-6 space-y-1 scrollbar-none">
              {STEPS.map((s, idx) => {
                const isVisible = visibleSteps.includes(idx);
                const status = !isVisible
                  ? "queued"
                  : idx === runningStep
                  ? "running"
                  : "done";
                return isVisible ? (
                  <ConsoleLine key={idx} index={idx} label={s.label} status={status} />
                ) : (
                  <div key={idx} className="flex items-center gap-2 py-0.5 opacity-20">
                    <span className="font-mono text-[10px] sm:text-xs w-5 text-right text-zinc-600">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="font-mono text-[10px] sm:text-xs text-zinc-700 tracking-wide">
                      &gt; {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="px-5 sm:px-6 pb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-zinc-600">ANALYSIS PROGRESS</span>
                <span className="text-[10px] font-mono text-zinc-400">{progress}%</span>
              </div>
              <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-zinc-400 to-white rounded-full"
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.15 }}
                />
              </div>
              <div className="mt-3 text-[9px] font-mono text-zinc-700">
                {progress === 100
                  ? "✓ REPORT COMPILED — READY"
                  : progress >= 92
                  ? `Finalising AI analysis... ${elapsed}s`
                  : `Analysing responses — ${Math.max(0, Math.round(45 - elapsed))}s remaining`}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="grid grid-cols-3 gap-3 mt-4"
          >
            {[
              { label: "RESPONSES", value: "12 / 12" },
              { label: "DIMENSIONS", value: "5" },
              { label: "REPORT SIZE", value: "12 pages" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 px-3 py-2.5 text-center">
                <div className="text-[10px] font-mono text-zinc-600 mb-0.5">{s.label}</div>
                <div className="text-xs sm:text-sm font-mono text-zinc-300">{s.value}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ─── Completion screen (no report preview) ────────────────────────────────────
function ReportReady({ analysis }) {
  const [showCalendly, setShowCalendly] = useState(false);
  const reportContainerRef = useRef(null);

  const handleDownload = useCallback(() => {
    window.print();
  }, []);

  const sorted = [...analysis.competencies].sort((a, b) => b.score - a.score);

  return (
    <>
      {/* Print styles: hide everything on screen except the hidden report */}
      <style>{`
        @media print {
          body { background: #0a0a0a !important; -webkit-print-color-adjust: exact; color-adjust: exact; }
          .screen-only { display: none !important; }
          .print-report { display: block !important; }
        }
        .print-report { display: none; }
      `}</style>

      {/* ── Screen UI (hidden in print) ─────────────────────────────────── */}
      <div className="screen-only min-h-screen bg-[#0a0a0a] flex flex-col relative overflow-hidden">
        {/* HUD grid */}
        <div className="fixed inset-0 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
        {/* Radial glow */}
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="w-[600px] h-[600px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 65%)" }}
          />
        </div>

        <Navbar />

        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pt-24 pb-16">
          <div className="w-full max-w-xl">

            {/* Status indicator */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-2 mb-8"
            >
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-white"
                style={{ boxShadow: "0 0 8px 2px rgba(255,255,255,0.5)" }}
              />
              <span className="text-[10px] font-mono text-zinc-500 tracking-[0.3em] uppercase">
                Mission Control · Report Ready
              </span>
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                className="w-1.5 h-1.5 rounded-full bg-white"
                style={{ boxShadow: "0 0 8px 2px rgba(255,255,255,0.5)" }}
              />
            </motion.div>

            {/* Heading */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center mb-8"
            >
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 leading-tight">
                Your Report Is Ready
              </h1>
              <p className="text-sm text-zinc-500">
                12-page personalised leadership assessment · {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </motion.div>

            {/* Score snapshot */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 mb-6"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono text-zinc-600 tracking-widest uppercase">Report Overview</span>
                <span className="text-xs font-mono text-zinc-400">{analysis.leadershipScore}/100</span>
              </div>
              <div className="space-y-2.5">
                {analysis.competencies.map((c) => (
                  <div key={c.name} className="flex items-center gap-3">
                    <span className="text-[10px] text-zinc-500 w-36 shrink-0 truncate">{c.name}</span>
                    <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${c.score}%` }}
                        transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full bg-gradient-to-r from-zinc-600 to-zinc-300 rounded-full"
                      />
                    </div>
                    <span className="text-[10px] font-mono text-zinc-600 w-6 text-right">{c.score}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* What's inside checklist */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="grid grid-cols-2 gap-2 mb-8"
            >
              {[
                "Executive summary",
                "6 competency scores",
                "Leadership archetype",
                "3 growth areas",
                "90-day roadmap",
                "First 7-day sprint",
                "Stakeholder playbook",
                "Weekly KPIs",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-xs text-zinc-500">
                  <CheckCircle className="w-3 h-3 text-zinc-700 shrink-0" />
                  {item}
                </div>
              ))}
            </motion.div>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {/* Download */}
              <motion.button
                onClick={handleDownload}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center justify-center gap-2.5 bg-white/10 border border-white/20 text-white px-5 py-4 rounded-full font-semibold text-sm hover:bg-white/15 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Download PDF
                <span className="text-zinc-500 text-xs">· $29.99</span>
              </motion.button>

              {/* Book session */}
              <motion.button
                onClick={() => setShowCalendly(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                animate={{
                  boxShadow: [
                    "0 4px 24px rgba(255,255,255,0.05)",
                    "0 4px 44px rgba(255,255,255,0.15)",
                    "0 4px 24px rgba(255,255,255,0.05)",
                  ],
                }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="flex items-center justify-center gap-2.5 bg-white text-black px-5 py-4 rounded-full font-semibold text-sm hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                Book a Session
                <span className="text-black/50 text-xs">· $99.99</span>
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center mt-6"
            >
              <Link to="/" className="text-[10px] font-mono text-zinc-700 hover:text-zinc-500 transition-colors">
                ← Return to home
              </Link>
            </motion.div>

          </div>
        </div>
      </div>

      {/* ── Hidden report rendered only for printing ───────────────────── */}
      <div ref={reportContainerRef} className="print-report">
        <LeadershipReport analysis={analysis} />
      </div>

      <CalendlyModal isOpen={showCalendly} onClose={() => setShowCalendly(false)} />
    </>
  );
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────
export default function CompletionPage({ answers }) {
  const [analysis, setAnalysis] = useState(null);
  const [phase, setPhase] = useState("generating");

  const handleGenerationComplete = useCallback((data) => {
    setAnalysis(data?.analysis ?? null);
    setPhase("ready");
  }, []);

  if (phase === "ready" && analysis) {
    return <ReportReady analysis={analysis} />;
  }

  if (phase === "ready" && !analysis) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6">
        <Navbar />
        <div className="text-center pt-24">
          <p className="text-zinc-500 text-sm mb-4">Report analysis could not be loaded.</p>
          <Link to="/" className="text-white text-sm underline">Return home</Link>
        </div>
      </div>
    );
  }

  return <MissionControlConsole answers={answers} onComplete={handleGenerationComplete} />;
}
