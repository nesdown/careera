import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Calendar, CheckCircle } from "lucide-react";
import { getQuestionnaireVariant } from "../data/questions";
import Navbar from "./Navbar";
// CalendlyModal is no longer used here — booking happens on /success after payment

// ─── Console log steps ────────────────────────────────────────────────────────
const STEPS = [
  { id: 0, label: "INITIALIZING ANALYSIS PROTOCOL",         duration: 1040 },
  { id: 1, label: "PARSING 12 ASSESSMENT RESPONSES",        duration: 1400 },
  { id: 2, label: "MAPPING LEADERSHIP ARCHETYPE",           duration: 1640 },
  { id: 3, label: "CROSS-REFERENCING MANAGEMENT PATTERNS",  duration: 1800 },
  { id: 4, label: "IDENTIFYING DEVELOPMENT GAPS",           duration: 1520 },
  { id: 5, label: "CALIBRATING GROWTH TRAJECTORY",          duration: 1640 },
  { id: 6, label: "BUILDING PERSONALISED ACTION FRAMEWORK", duration: 1760 },
  { id: 7, label: "SCORING 5 LEADERSHIP DIMENSIONS",        duration: 1440 },
  { id: 8, label: "GENERATING STRATEGIC ROADMAP",           duration: 1840 },
  { id: 9, label: "COMPILING LONG-FORM PDF REPORT",         duration: 2400 },
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
  const consoleScrollRef = useRef(null);

  // Refs so the animation effect never needs to re-run when API resolves
  const apiDoneRef          = useRef(false);
  const reportDataRef       = useRef(null);
  const onCompleteRef       = useRef(onComplete);
  const stepTimer           = useRef(null);
  const progressTimer       = useRef(null);
  const progressValueRef    = useRef(0);
  const finalStepVisibleRef = useRef(false);
  const hasCompletedRef     = useRef(false);

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
    const progStart = Date.now();
    const PREP_PROGRESS_CAP = 90;
    const CURVE_MS = 17000;

    // Continuously ease progress toward a moving target. This avoids
    // sprinting into the 90s too early and then visibly stalling there.
    progressTimer.current = setInterval(() => {
      const totalElapsed = Date.now() - progStart;
      const isReadyToFinalize = apiDoneRef.current && finalStepVisibleRef.current;
      const target = isReadyToFinalize
        ? 100
        : PREP_PROGRESS_CAP * (1 - Math.exp(-totalElapsed / CURVE_MS));
      const smoothing = isReadyToFinalize ? 0.18 : 0.08;

      progressValueRef.current += (target - progressValueRef.current) * smoothing;

      if (!isReadyToFinalize) {
        progressValueRef.current = Math.min(progressValueRef.current, PREP_PROGRESS_CAP + 0.4);
      }

      const nextProgress = isReadyToFinalize && progressValueRef.current > 99.95
        ? 100
        : progressValueRef.current;

      setProgress(nextProgress);

      if (isReadyToFinalize && nextProgress >= 99.4 && !hasCompletedRef.current) {
        hasCompletedRef.current = true;
        clearInterval(progressTimer.current);
        setRunningStep(-1);
        setTimeout(() => {
          setProgress(100);
          onCompleteRef.current(reportDataRef.current);
        }, 220);
      }
    }, 50);

    const runStep = () => {
      if (stepIdx >= STEPS.length) return;
      const step = STEPS[stepIdx];
      setVisibleSteps((prev) => [...prev, stepIdx]);
      setRunningStep(stepIdx);

      if (stepIdx === STEPS.length - 1) {
        finalStepVisibleRef.current = true;
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

  useEffect(() => {
    const container = consoleScrollRef.current;
    if (!container) return undefined;

    const frame = window.requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [visibleSteps, runningStep]);

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
            <div
              ref={consoleScrollRef}
              className="h-[min(320px,40vh)] overflow-y-auto p-5 sm:p-6 space-y-1 scrollbar-none"
            >
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
                <span className="text-[10px] font-mono text-zinc-400">{Math.round(progress)}%</span>
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
                  : runningStep === STEPS.length - 1
                  ? `Finalising AI analysis... ${elapsed}s`
                  : `Analysing responses and building report... ${elapsed}s`}
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

// ─── Completion screen — analysis preview + Stripe paywall ───────────────────
function ReportReady({ analysis, answers }) {
  const [email, setEmail] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError]     = useState("");

  const handlePurchase = useCallback(async (plan = "report") => {
    setCheckoutLoading(true);
    setCheckoutError("");
    try {
      const variant = getQuestionnaireVariant();
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, variant, email: email.trim(), plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setCheckoutError("Could not start checkout. Please try again.");
      }
    } catch {
      setCheckoutError("Connection error. Please try again.");
    } finally {
      setCheckoutLoading(false);
    }
  }, [answers, email]);

  return (
    <>
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col relative overflow-hidden">
        {/* HUD grid */}
        <div className="fixed inset-0 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
        {/* Radial glow */}
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
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
                Your Analysis Is Complete
              </h1>
              <p className="text-sm text-zinc-500">
                Leadership readiness score · {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </motion.div>

            {/* Score snapshot — free preview */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 mb-5"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono text-zinc-600 tracking-widest uppercase">Score Preview</span>
                <span className="text-base font-bold text-white">{analysis.leadershipScore}<span className="text-zinc-600 text-xs font-normal">/100</span></span>
              </div>
              <div className="space-y-2.5">
                {analysis.competencies.map((c) => (
                  <div key={c.name} className="flex items-center gap-3">
                    <span className="text-[10px] text-zinc-500 w-28 sm:w-36 shrink-0 truncate">{c.name}</span>
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

            {/* What's inside the full report */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-zinc-900/30 border border-zinc-800/60 rounded-2xl p-4 mb-6"
            >
              <p className="text-[10px] font-mono text-zinc-600 tracking-widest uppercase mb-3">What's in your full report</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {[
                  "Executive summary & context",
                  "Competency intelligence cards",
                  "Leadership archetype deep-dive",
                  "Top 3 growth gaps + actions",
                  "90-day month-by-month roadmap",
                  "Benchmark vs. peer leaders",
                  "Evolution path & mindset shifts",
                  "12-habit behaviour blueprint",
                  "7-day sprint plan",
                  "Leadership signals to track",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs text-zinc-500">
                    <CheckCircle className="w-3 h-3 text-zinc-700 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Email input for Stripe */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.38 }}
              className="mb-3"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email (for receipt & re-download)"
                className="w-full bg-zinc-900/60 border border-zinc-700/60 rounded-xl px-4 py-3 text-white text-sm
                           placeholder-zinc-600 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/20 transition-all"
              />
            </motion.div>

            {checkoutError && (
              <p className="text-red-400 text-xs font-mono mb-3 px-1">⚠ {checkoutError}</p>
            )}

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="flex flex-col gap-3"
            >
              {/* Primary: pay for report */}
              <motion.button
                onClick={() => handlePurchase("report")}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.975 }}
                disabled={checkoutLoading}
                animate={{
                  boxShadow: checkoutLoading ? undefined : [
                    "0 0 0px rgba(255,255,255,0)",
                    "0 0 32px rgba(255,255,255,0.12)",
                    "0 0 0px rgba(255,255,255,0)",
                  ],
                }}
                transition={{ duration: 2.8, repeat: Infinity }}
                className="flex items-center justify-center gap-2.5 bg-white text-black px-5 py-4 rounded-full font-semibold text-sm hover:bg-zinc-100 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                {checkoutLoading ? "Redirecting to checkout…" : "Download Full Report · $29.99"}
              </motion.button>

              {/* Secondary: book session — goes through Stripe then Calendly */}
              <motion.button
                onClick={() => handlePurchase("report-call")}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                disabled={checkoutLoading}
                className="flex items-center justify-center gap-2.5 bg-white/8 border border-white/15 text-white px-5 py-3.5 rounded-full text-sm hover:bg-white/12 transition-colors cursor-pointer disabled:opacity-60"
              >
                <Calendar className="w-4 h-4" />
                {checkoutLoading ? "Redirecting…" : "Book Session + Get Report · $99.99"}
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

      {/* CalendlyModal removed — booking is gated behind /success after payment */}
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
    return <ReportReady analysis={analysis} answers={answers} />;
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
