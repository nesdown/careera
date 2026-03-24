import { useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Download, Lock } from "lucide-react";
import Navbar from "../components/Navbar";

const CALENDLY_URL =
  "https://calendly.com/careera-roadmap/careera-roadmap-review?hide_gdpr_banner=1&background_color=000000&text_color=ffffff&primary_color=ffffff";

// ─── Inject Calendly script once ─────────────────────────────────────────────
function useCalendlyScript() {
  useEffect(() => {
    if (document.getElementById("calendly-script")) return;
    const script = document.createElement("script");
    script.id = "calendly-script";
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    document.head.appendChild(script);
  }, []);
}

// ─── Calendly inline widget ───────────────────────────────────────────────────
function CalendlyWidget({ onScheduled }) {
  useCalendlyScript();

  useEffect(() => {
    function handleMessage(e) {
      // Calendly fires this when a slot is confirmed
      if (e.data?.event === "calendly.event_scheduled") {
        onScheduled();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onScheduled]);

  return (
    <div
      className="calendly-inline-widget w-full rounded-xl overflow-hidden border border-zinc-800"
      data-url={CALENDLY_URL}
      style={{ minWidth: 320, height: 700 }}
    />
  );
}

// ─── PDF download — server returns binary with Content-Disposition: attachment
// This is the only approach that works reliably on iOS Safari and all mobile browsers.
function triggerDownload(sessionId) {
  if (!sessionId) return;
  // Navigate directly to the download endpoint. The server will stream the cached
  // PDF buffer with proper headers, which forces a download on every device.
  window.location.href = `/api/download-report?session_id=${encodeURIComponent(sessionId)}`;
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Success() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [status, setStatus]               = useState("generating");
  const [reportData, setReportData]       = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStep, setLoadingStep]     = useState(0);
  const [error, setError]                 = useState("");
  const [calendlyDone, setCalendlyDone]   = useState(false);
  const [justScheduled, setJustScheduled] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      setError("No session ID found. Please contact support.");
      return;
    }
    generatePaidReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  async function generatePaidReport() {
    setStatus("generating");
    setLoadingProgress(0);
    setLoadingStep(0);

    let cancelled = false;
    const TOTAL_MS = 28_000;
    const start = Date.now();

    const tick = () => {
      if (cancelled) return;
      const elapsed = Date.now() - start;
      const t = Math.min(elapsed / TOTAL_MS, 1);
      const progress = Math.min((1 - Math.pow(1 - t, 2)) * 92, 92);
      setLoadingProgress(progress);
      if (progress < 15) setLoadingStep(0);
      else if (progress < 35) setLoadingStep(1);
      else if (progress < 55) setLoadingStep(2);
      else if (progress < 70) setLoadingStep(3);
      else if (progress < 82) setLoadingStep(4);
      else setLoadingStep(5);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    try {
      const res = await fetch("/api/generate-report-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const data = await res.json();
      cancelled = true;
      setLoadingProgress(100);
      setLoadingStep(6);
      if (data.success) {
        setReportData(data);
        setStatus("ready");
      } else {
        setStatus("error");
        setError(data.error || "Report generation failed. Please contact support.");
      }
    } catch {
      cancelled = true;
      setStatus("error");
      setError("Something went wrong. Please contact support@careera.cc");
    }
  }

  function handleCalendlyScheduled() {
    setCalendlyDone(true);
    setJustScheduled(true);
  }

  const isCallPlan = reportData?.plan === "report-call";
  const downloadSessionId = reportData?.session_id || sessionId;

  const loadingSteps = [
    { label: "PAYMENT VERIFIED",          detail: "Stripe confirmation + secure session keys issued." },
    { label: "PROFILE RECONSTRUCTED",     detail: "Replaying your questionnaire answers into the engine." },
    { label: "COMPETENCY LATTICE SCORED", detail: "Six-dimension model + archetype + blind spots locked." },
    { label: "OPERATING SYSTEM BUILT",    detail: "Cadence, metrics dashboard, and roadmap assembled." },
    { label: "REPORT TYPESET",            detail: "Designing your long-form PDF with Careera styling." },
    { label: "ENCRYPTION & DELIVERY",     detail: "Packaging PDF + issuing download token." },
    { label: "REPORT READY",              detail: "Download unlocked below." },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col">
      {/* Subtle grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.012) 1px,transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      <Navbar />

      <div className="flex-1 flex items-center justify-center px-4 pt-24 pb-16 relative z-10">
        <div className="w-full max-w-2xl">

          {/* ── Generating ── */}
          {status === "generating" && (
            <div className="bg-black border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="bg-zinc-900/80 border-b border-zinc-800 px-5 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  {["bg-zinc-700", "bg-zinc-700", "bg-zinc-700"].map((c, i) => (
                    <div key={i} className={`w-2.5 h-2.5 rounded-full ${c}`} />
                  ))}
                </div>
                <span className="text-zinc-500 text-xs font-mono ml-2 tracking-widest">
                  careera@engine:~$ ./generate-report --premium
                </span>
              </div>

              <div className="p-6 font-mono text-sm space-y-4 min-h-[400px]">
                <p className="text-zinc-400 text-center text-xs tracking-widest uppercase mb-6">
                  Building your leadership report…
                </p>
                <div className="space-y-3">
                  {loadingSteps.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{
                        opacity: loadingStep >= idx ? 1 : 0.25,
                        x: loadingStep >= idx ? 0 : -16,
                      }}
                      transition={{ duration: 0.3 }}
                      className="flex items-start gap-3"
                    >
                      {loadingStep > idx ? (
                        <span className="text-white shrink-0 mt-0.5">✓</span>
                      ) : loadingStep === idx ? (
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="text-white/60 shrink-0 mt-0.5"
                        >◐</motion.span>
                      ) : (
                        <span className="text-zinc-700 shrink-0 mt-0.5">○</span>
                      )}
                      <div>
                        <div className={`text-xs font-bold tracking-wider ${loadingStep >= idx ? "text-white" : "text-zinc-700"}`}>
                          {item.label}
                        </div>
                        {loadingStep === idx && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-zinc-500 text-xs mt-0.5"
                          >
                            {item.detail}
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-8 space-y-1.5">
                  <div className="flex justify-between text-[10px] font-mono text-zinc-600">
                    <span>PROGRESS</span>
                    <span>{Math.round(loadingProgress)}%</span>
                  </div>
                  <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-white rounded-full"
                      style={{ width: `${loadingProgress}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                  <p className="text-zinc-700 text-[10px] mt-2">Usually 20–30 seconds. Do not close this page.</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Ready ── */}
          {status === "ready" && reportData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Header */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-white/8 border border-white/20 rounded-full mb-5"
                >
                  <CheckCircle className="w-8 h-8 text-white" />
                </motion.div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  {isCallPlan ? "Payment Confirmed — Schedule Your Session" : "Payment Confirmed — Your Report Is Ready"}
                </h1>
                <p className="text-zinc-500 text-sm">
                  {isCallPlan
                    ? "Book your 1:1 strategy session below. Your report download unlocks automatically once scheduled."
                    : "Download your personalised leadership report below."}
                </p>
              </div>

              {/* Score preview */}
              {reportData.analysis && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 mb-6">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 bg-white/8 border border-white/15 rounded-xl flex items-center justify-center shrink-0">
                      <span className="text-xl font-bold text-white">{reportData.analysis.leadershipScore}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm">Your Leadership Score</div>
                      <div className="text-xs text-zinc-500">{reportData.analysis.leadershipStage}</div>
                    </div>
                  </div>
                  {reportData.analysis.executiveSummary && (
                    <p className="text-xs text-zinc-500 leading-relaxed line-clamp-3">
                      {reportData.analysis.executiveSummary}
                    </p>
                  )}
                </div>
              )}

              {/* ── REPORT-ONLY: immediate download ── */}
              {!isCallPlan && (
                <motion.button
                  onClick={() => triggerDownload(downloadSessionId)}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.975 }}
                  className="w-full flex items-center justify-center gap-2.5 bg-white text-black px-6 py-4 rounded-full text-sm font-semibold hover:bg-zinc-100 transition-colors mb-4"
                >
                  <Download className="w-4 h-4" />
                  Download Your Leadership Report (PDF)
                </motion.button>
              )}

              {/* ── CALL PLAN: Calendly gate ── */}
              {isCallPlan && (
                <>
                  <AnimatePresence>
                    {justScheduled && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mb-4 flex items-center gap-3 bg-white/8 border border-white/20 rounded-xl px-5 py-3.5"
                      >
                        <CheckCircle className="w-5 h-5 text-white shrink-0" />
                        <div>
                          <p className="text-white text-sm font-semibold">Session booked!</p>
                          <p className="text-zinc-400 text-xs">Check your email for the confirmation. Your report is ready below.</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Download — locked until Calendly confirms */}
                  <div className="mb-6">
                    <motion.button
                      onClick={() => calendlyDone && triggerDownload(downloadSessionId)}
                      whileHover={calendlyDone ? { scale: 1.015 } : {}}
                      whileTap={calendlyDone ? { scale: 0.975 } : {}}
                      disabled={!calendlyDone}
                      className={`w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-full text-sm font-semibold transition-all ${
                        calendlyDone
                          ? "bg-white text-black hover:bg-zinc-100 cursor-pointer"
                          : "bg-zinc-900 border border-zinc-700 text-zinc-500 cursor-not-allowed"
                      }`}
                    >
                      {calendlyDone ? (
                        <Download className="w-4 h-4" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                      {calendlyDone
                        ? "Download Your Leadership Report (PDF)"
                        : "Download unlocks after you schedule your session"}
                    </motion.button>
                    {!calendlyDone && (
                      <p className="text-center text-[11px] text-zinc-700 mt-2 font-mono">
                        Schedule your 1:1 session below to unlock the download
                      </p>
                    )}
                  </div>

                  {/* Calendly widget */}
                  {!calendlyDone && (
                    <div className="mb-6">
                      <p className="text-[10px] font-mono text-zinc-600 tracking-widest uppercase mb-4">
                        Schedule Your 1:1 Leadership Strategy Session
                      </p>
                      <CalendlyWidget onScheduled={handleCalendlyScheduled} />
                    </div>
                  )}
                </>
              )}

              <div className="text-center mt-4">
                <Link to="/" className="text-xs text-zinc-700 hover:text-zinc-400 transition-colors font-mono tracking-widest uppercase">
                  ← Return to Home
                </Link>
              </div>
            </motion.div>
          )}

          {/* ── Error ── */}
          {status === "error" && (
            <div className="text-center">
              <p className="text-white text-lg font-semibold mb-3">Something went wrong</p>
              <p className="text-zinc-500 text-sm mb-6">{error}</p>
              <Link to="/" className="text-sm text-zinc-500 hover:text-white transition-colors underline">
                Return to Home
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
