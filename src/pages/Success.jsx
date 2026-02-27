import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Download, Loader, Sparkles, ArrowRight } from "lucide-react";
import Navbar from "../components/Navbar";

export default function Success() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [status, setStatus] = useState("loading"); // loading | generating | ready | error
  const [reportData, setReportData] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      setError("No session ID found. Please contact support.");
      return;
    }

    generatePaidReport();
  }, [sessionId]);

  const generatePaidReport = async () => {
    setStatus("generating");
    setLoadingProgress(0);
    setLoadingStep(0);

    // Smooth progress animation tied to real expected duration (~25s)
    let cancelled = false;
    const TOTAL_MS = 28000;
    const startTime = Date.now();

    const animateProgress = () => {
      if (cancelled) return;
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / TOTAL_MS, 1);
      // Ease-out: fast start, slow near end (cap at 92% until real done)
      const eased = 1 - Math.pow(1 - t, 2);
      const progress = Math.min(eased * 92, 92);
      setLoadingProgress(progress);

      // Advance loading step label based on progress
      if (progress < 15) setLoadingStep(0);
      else if (progress < 35) setLoadingStep(1);
      else if (progress < 55) setLoadingStep(2);
      else if (progress < 70) setLoadingStep(3);
      else if (progress < 82) setLoadingStep(4);
      else setLoadingStep(5);

      if (t < 1) requestAnimationFrame(animateProgress);
    };
    requestAnimationFrame(animateProgress);

    try {
      const response = await fetch("/api/generate-report-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const data = await response.json();

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
    } catch (err) {
      cancelled = true;
      setStatus("error");
      setError("Something went wrong. Please contact support@careera.cc");
    }
  };

  const downloadPDF = () => {
    if (!reportData) return;
    if (reportData.pdf) {
      const link = document.createElement("a");
      link.href = reportData.pdf;
      link.download = reportData.filename || "Careera-Leadership-Report.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (reportData.gammaUrl) {
      window.open(reportData.gammaUrl, "_blank", "noopener,noreferrer");
    }
  };

  const loadingSteps = [
    { label: 'PAYMENT VERIFIED', detail: 'Stripe confirmation + secure session keys issued.' },
    { label: 'PROFILE RECONSTRUCTED', detail: 'Replaying your questionnaire answers into the engine.' },
    { label: 'COMPETENCY LATTICE SCORED', detail: 'Six-dimension model + archetype + blind spots locked.' },
    { label: 'OPERATING SYSTEM BUILT', detail: 'Operating cadence, metrics dashboard, and risks assembled.' },
    { label: 'REPORT TYPESSET', detail: 'Designing the 13-page PDF dossier with Careera styling.' },
    { label: 'ENCRYPTION & DELIVERY', detail: 'Packaging PDF + issuing download token.' },
    { label: 'REPORT READY', detail: 'Download unlocked below.' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 pt-24 pb-12">
        <div className="w-full max-w-2xl">

          {/* Loading / Generating */}
          {status === "generating" && (
            <div className="bg-black border border-green-500/30 rounded-xl overflow-hidden shadow-2xl shadow-green-500/10">
              <div className="bg-zinc-900 border-b border-green-500/30 px-4 py-2 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="text-green-400 text-sm font-mono ml-2">
                  careera@engine:~$ ./generate-report --premium
                </span>
              </div>
              <div className="p-6 font-mono text-sm space-y-4 min-h-[420px]">
                <div className="text-white text-center text-base font-bold mb-4">
                  🔐 BUILDING YOUR PREMIUM LEADERSHIP REPORT...
                </div>
                <div className="space-y-3">
                  {loadingSteps.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{
                        opacity: loadingStep > idx ? 1 : loadingStep === idx ? 1 : 0.3,
                        x: loadingStep >= idx ? 0 : -20,
                      }}
                      transition={{ duration: 0.3 }}
                      className="border-l-2 border-green-500/30 pl-3"
                    >
                      <div className="flex items-start gap-2">
                        {loadingStep > idx ? (
                          <span className="text-green-400 shrink-0">✓</span>
                        ) : loadingStep === idx ? (
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="text-cyan-400 shrink-0"
                          >◐</motion.span>
                        ) : (
                          <span className="text-zinc-600 shrink-0">○</span>
                        )}
                        <div>
                          <div className={`font-bold text-xs ${loadingStep >= idx ? "text-green-400" : "text-zinc-600"}`}>
                            {item.label}
                          </div>
                          {loadingStep === idx && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-cyan-400/70 text-xs mt-1">
                              {item.detail}
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-6 space-y-1">
                  <div className="text-zinc-400 text-xs">Progress: {Math.round(loadingProgress)}%</div>
                  <div className="font-mono text-green-400 text-sm">
                    [{Array.from({ length: 30 }).map((_, i) => (
                      <span key={i}>{i < Math.floor((loadingProgress / 100) * 30) ? "█" : "░"}</span>
                    ))}]
                  </div>
                </div>
                <div className="text-zinc-500 text-xs mt-2">Usually takes 20–30 seconds. Do not close this page.</div>
              </div>
            </div>
          )}

          {/* Ready */}
          {status === "ready" && reportData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-2xl p-6 sm:p-8"
            >
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.6 }}
                  className="inline-flex items-center justify-center w-20 h-20 bg-green-500/10 border border-green-500/30 rounded-full mb-4"
                >
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </motion.div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  Payment Confirmed — Your Report is Ready
                </h1>
                <p className="text-zinc-400 text-sm">
                  Thank you for your purchase. Download your personalized leadership report below.
                </p>
              </div>

              {reportData.analysis && (
                <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-5 mb-6">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-14 h-14 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">{reportData.analysis.leadershipScore}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-white">Your Leadership Score</div>
                      <div className="text-sm text-zinc-400">{reportData.analysis.leadershipStage}</div>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed line-clamp-3">
                    {reportData.analysis.executiveSummary}
                  </p>
                </div>
              )}

              <motion.button
                onClick={downloadPDF}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 bg-white text-black px-6 py-4 rounded-full text-base font-semibold hover:bg-zinc-100 transition-colors mb-4"
              >
                <Download className="w-5 h-5" />
                Download Your Leadership Report (PDF)
              </motion.button>

              {reportData.plan === "report-call" && (
                <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-5 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-white" />
                    <span className="font-semibold text-white text-sm">Book Your Career Boost Call</span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-3">
                    You purchased the Report + Call package. Click below to schedule your 30-minute strategy session.
                  </p>
                  <a
                    href="https://calendly.com/careera"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-zinc-100 transition-colors"
                  >
                    Schedule Your Call <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              )}

              <div className="text-center">
                <Link to="/" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
                  ← Return to Home
                </Link>
              </div>
            </motion.div>
          )}

          {/* Error */}
          {status === "error" && (
            <div className="text-center">
              <div className="text-red-400 text-lg font-semibold mb-3">Something went wrong</div>
              <p className="text-zinc-400 text-sm mb-6">{error}</p>
              <Link to="/" className="text-sm text-zinc-400 hover:text-white transition-colors underline">
                Return to Home
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
