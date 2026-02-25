import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, CheckCircle, Download, Loader, Sparkles } from "lucide-react";
import { getActiveQuestions, getQuestionnaireVariant, roadmapPhases } from "../data/questions";

export default function QuestionnaireWidget() {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isComplete, setIsComplete] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportReady, setReportReady] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState(0);
  
  const variant = useMemo(() => getQuestionnaireVariant(), []);
  const questions = useMemo(() => getActiveQuestions(), []);
  
  useEffect(() => {
    console.log(`A/B Test: User assigned to Questionnaire ${variant}`);
  }, [variant]);
  
  const question = questions[currentQ];
  const progress = ((currentQ + 1) / questions.length) * 100;
  const isLast = currentQ === questions.length - 1;

  const handleSelect = (option) => {
    setAnswers((prev) => ({ ...prev, [question.id]: option }));
  };

  const handleNext = () => {
    if (isLast) {
      setIsComplete(true);
      generateReport();
    } else {
      setCurrentQ((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentQ > 0) setCurrentQ((prev) => prev - 1);
  };

  const canProceed = (() => {
    const answer = answers[question.id];
    if (!answer) return false;
    if (question.type === "textarea" && answer.trim().length < 5) return false;
    return true;
  })();

  const generateReport = async () => {
    setIsGeneratingReport(true);
    setLoadingProgress(0);
    setLoadingStep(0);

    const apiPromise = fetch('/api/generate-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, variant }),
    });

    const steps = [
      { progress: 12, duration: 3000, step: 0 },
      { progress: 24, duration: 3500, step: 1 },
      { progress: 36, duration: 4000, step: 2 },
      { progress: 48, duration: 4000, step: 3 },
      { progress: 60, duration: 5000, step: 4 },
      { progress: 72, duration: 5000, step: 5 },
      { progress: 84, duration: 6000, step: 6 },
      { progress: 95, duration: 8000, step: 7 },
    ];

    for (const stepData of steps) {
      const startProgress = loadingProgress;
      const duration = stepData.duration;
      const startTime = Date.now();
      
      await new Promise(resolve => {
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const t = Math.min(elapsed / duration, 1);
          const currentProgress = startProgress + (stepData.progress - startProgress) * t;
          
          setLoadingProgress(currentProgress);
          
          if (t < 1) {
            requestAnimationFrame(animate);
          } else {
            setLoadingStep(stepData.step + 1);
            resolve();
          }
        };
        animate();
      });
    }

    try {
      const response = await apiPromise;
      const data = await response.json();
      
      const finalStart = Date.now();
      await new Promise(resolve => {
        const animate = () => {
          const elapsed = Date.now() - finalStart;
          const t = Math.min(elapsed / 800, 1);
          setLoadingProgress(95 + (5 * t));
          if (t < 1) {
            requestAnimationFrame(animate);
          } else {
            resolve();
          }
        };
        animate();
      });
      
      if (data.success) {
        setReportData(data);
        setReportReady(true);
      } else {
        setReportReady(true);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      setLoadingProgress(100);
      setReportReady(true);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const downloadPDF = () => {
    if (!reportData) return;
    if (reportData.pdf) {
      const link = document.createElement('a');
      link.href = reportData.pdf;
      link.download = reportData.filename || 'Careera-Leadership-Report.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (reportData.gammaUrl) {
      window.open(reportData.gammaUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handlePurchase = (option) => {
    setSelectedOption(option);
    console.log(`User selected: ${option}`);
    
    setTimeout(() => {
      alert(`Purchase confirmed! ${option === 'report' ? 'Report' : 'Report + Career Boost Call'}`);
      if (option === 'report') {
        downloadPDF();
      }
    }, 500);
  };

  if (isComplete) {
    if (showPricing) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden w-full"
        >
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-zinc-800 bg-zinc-900">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-1">
              Get Your Leadership Report
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400">
              Choose the option that fits your needs
            </p>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handlePurchase('report')}
              className="bg-zinc-900/50 border-2 border-zinc-700 hover:border-white/30 rounded-xl p-4 sm:p-6 cursor-pointer transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Download className="w-5 h-5 text-white" />
                    <h4 className="text-base sm:text-lg font-bold text-white">
                      Leadership Report Only
                    </h4>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-400 mb-3">
                    Get your personalized 10-page leadership report PDF with AI analysis and data visualizations
                  </p>
                </div>
                <div className="text-right ml-4">
                  <div className="text-2xl sm:text-3xl font-bold text-white">$9.99</div>
                </div>
              </div>
              
              <ul className="space-y-2 mb-4">
                {[
                  "10-page detailed PDF report",
                  "6 competency deep-dives with scores",
                  "Leadership archetype identification",
                  "90-day roadmap with weekly KPIs",
                  "Data visualizations & charts",
                  "Instant PDF download",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-xs sm:text-sm text-zinc-300">
                    <CheckCircle className="w-4 h-4 text-white shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button className="w-full bg-white text-black px-4 py-3 rounded-lg font-semibold hover:bg-zinc-200 transition-colors">
                Get Report - $9.99
              </button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handlePurchase('report-call')}
              className="relative bg-gradient-to-br from-white/10 to-zinc-900/50 border-2 border-white/40 rounded-xl p-4 sm:p-6 cursor-pointer transition-all overflow-hidden group"
            >
              <div className="absolute top-4 right-4 px-2 py-1 bg-white text-black rounded-full text-[10px] font-bold">
                BEST VALUE
              </div>

              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-white" />
                    <h4 className="text-base sm:text-lg font-bold text-white">
                      Report + Career Boost Call
                    </h4>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-300 mb-1">
                    Everything in the report, plus 30-minute strategy call with a leadership coach
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 line-through">$134.99</span>
                    <span className="text-xs text-white font-bold">Save $105!</span>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-2xl sm:text-3xl font-bold text-white">$29.99</div>
                </div>
              </div>
              
              <ul className="space-y-2 mb-4">
                {[
                  "Everything in the report",
                  "30-minute 1-on-1 strategy call",
                  "Personalized action plan review",
                  "Answer your specific questions",
                  "Career roadmap guidance",
                  "Book your preferred time",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-xs sm:text-sm text-zinc-200">
                    <CheckCircle className="w-4 h-4 text-white shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <motion.button
                whileHover={{ scale: 1.02 }}
                className="w-full bg-white text-black px-4 py-3 rounded-lg font-semibold hover:bg-zinc-100 transition-colors shadow-lg"
              >
                Get Report + Call - $29.99
              </motion.button>
            </motion.div>
          </div>

          <div className="px-4 sm:px-6 py-4 border-t border-zinc-800 bg-zinc-900">
            <button
              onClick={() => setShowPricing(false)}
              className="text-xs sm:text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to Preview
            </button>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 shadow-2xl w-full"
      >
        {isGeneratingReport && (
          <div className="mb-6">
            <div className="bg-black border border-green-500/30 rounded-lg overflow-hidden shadow-2xl shadow-green-500/20">
              <div className="bg-zinc-900 border-b border-green-500/30 px-4 py-2 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <span className="text-green-400 text-xs sm:text-sm font-mono ml-2">
                  careera@terminal:~$ ./build-leadership-report.sh
                </span>
              </div>

              <div className="p-4 sm:p-6 font-mono text-xs sm:text-sm space-y-2 min-h-[380px]">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-green-400 mb-4"
                >
                  <div className="text-base sm:text-lg font-bold mb-2">
                    ╔═══════════════════════════════════════════════╗
                  </div>
                  <div className="text-center text-sm sm:text-base mb-2 text-white">
                    🔐 BUILDING YOUR PREMIUM LEADERSHIP REPORT...
                  </div>
                  <div className="text-base sm:text-lg font-bold">
                    ╚═══════════════════════════════════════════════╝
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-cyan-400"
                >
                  <span className="text-green-400">$</span> Initializing AI engines...
                  <motion.span
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  > ▊</motion.span>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-zinc-400 text-[10px] sm:text-xs"
                >
                  → Loading GPT-4o + Gamma Design Engine... [████████████████] 100%
                </motion.div>

                <div className="space-y-3 mt-4">
                  {[
                    { label: "ANALYZING LEADERSHIP PATTERNS", detail: "Parsing management style indicators...", step: 0 },
                    { label: "SCORING 6 COMPETENCY DIMENSIONS", detail: "Calculating strategic thinking coefficients...", step: 1 },
                    { label: "IDENTIFYING YOUR ARCHETYPE", detail: "Matching leadership behavior patterns...", step: 2 },
                    { label: "BUILDING 90-DAY ROADMAP", detail: "Generating personalized action sequences...", step: 3 },
                    { label: "DETECTING BLIND SPOTS", detail: "Cross-referencing behavioral signals...", step: 4 },
                    { label: "DESIGNING REPORT PAGES", detail: "Creating 22+ visual pages with dark theme...", step: 5 },
                    { label: "GENERATING AI ILLUSTRATIONS", detail: "Rendering professional visuals...", step: 6 },
                    { label: "FINALIZING PREMIUM REPORT", detail: "Applying final polish and export...", step: 7 },
                  ].map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ 
                        opacity: loadingStep > item.step ? 1 : (loadingStep === item.step ? 1 : 0.3),
                        x: loadingStep >= item.step ? 0 : -20
                      }}
                      transition={{ duration: 0.3 }}
                      className="border-l-2 border-green-500/30 pl-3"
                    >
                      <div className="flex items-start gap-2">
                        {loadingStep > item.step ? (
                          <span className="text-green-400 shrink-0">✓</span>
                        ) : loadingStep === item.step ? (
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="text-cyan-400 shrink-0"
                          >
                            ◐
                          </motion.span>
                        ) : (
                          <span className="text-zinc-600 shrink-0">○</span>
                        )}
                        <div className="flex-1">
                          <div className={`font-bold ${
                            loadingStep >= item.step ? 'text-green-400' : 'text-zinc-600'
                          }`}>
                            {item.label}
                          </div>
                          {loadingStep === item.step && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-cyan-400/70 text-[10px] sm:text-xs mt-1"
                            >
                              {item.detail}
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-6 space-y-2">
                  <div className="text-zinc-400 text-[10px] sm:text-xs">
                    Progress: {Math.round(loadingProgress)}%
                  </div>
                  <div className="font-mono text-green-400">
                    [
                    {Array.from({ length: 30 }).map((_, i) => (
                      <span key={i}>
                        {i < Math.floor((loadingProgress / 100) * 30) ? '█' : '░'}
                      </span>
                    ))}
                    ]
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="mt-4 text-yellow-400/80 text-[10px] sm:text-xs"
                >
                  <span className="text-yellow-500">⚡</span> {loadingStep < 4 ? 'Optimizing neural pathways...' : 'Rendering premium visuals...'}
                </motion.div>

                {loadingProgress > 80 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-cyan-400 text-xs sm:text-sm mt-3"
                  >
                    <span className="text-green-400">→</span> Almost there — finalizing your leadership blueprint...
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 }}
                  className="mt-3 text-zinc-600 text-[10px] sm:text-xs"
                >
                  This usually takes 1-2 minutes while we create your personalized report
                </motion.div>
              </div>
            </div>
          </div>
        )}

        {!isGeneratingReport && reportReady && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.6 }}
                className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white/10 border border-white/20 rounded-full mb-4"
              >
                <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </motion.div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Your Leadership Report is Ready
              </h3>
              <p className="text-sm text-zinc-400">
                {reportData?.pdf
                  ? "Your personalized 10-page report is ready to download"
                  : "Here's a preview of what we've prepared for you"}
              </p>
            </div>

            <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700 rounded-xl p-4 sm:p-6 mb-6 relative overflow-hidden">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-700">
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-white mb-1">
                    LEADERSHIP READINESS REPORT
                  </div>
                  <div className="text-[10px] sm:text-xs text-zinc-500">
                    {new Date().toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })} · 10 Pages · PDF Document
                  </div>
                </div>
                <div className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded text-[10px] font-bold text-green-400">
                  READY
                </div>
              </div>

              <div className="space-y-4 mb-4">
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-white mb-2 flex items-center gap-2">
                    <span className="w-1 h-4 bg-white rounded-full"></span>
                    What's Inside Your Report
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      "Executive Summary & Leadership Score",
                      "6 Competency Deep-Dive Analyses",
                      "Leadership Archetype & Blind Spots",
                      "Priority Growth Areas with Action Plans",
                      "Stakeholder Playbook & Weekly KPIs",
                      "90-Day Roadmap (Month-by-Month)",
                      "First 7-Day Action Sprint",
                      "Executive Communication Template",
                      "Data Visualizations & Charts",
                      "Projected 90-Day Outcomes",
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-zinc-300">
                        <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {reportData?.analysis && (
                  <div className="mt-4 pt-4 border-t border-zinc-700">
                    <h4 className="text-sm sm:text-base font-bold text-white mb-3 flex items-center gap-2">
                      <span className="w-1 h-4 bg-white rounded-full"></span>
                      Quick Preview
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center">
                          <span className="text-xl sm:text-2xl font-bold text-white">
                            {reportData.analysis.leadershipScore}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm sm:text-base font-semibold text-white">
                            Leadership Score
                          </div>
                          <div className="text-xs sm:text-sm text-zinc-400">
                            {reportData.analysis.leadershipStage}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs sm:text-sm text-zinc-400 leading-relaxed line-clamp-3">
                        {reportData.analysis.executiveSummary}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-zinc-900 to-transparent pointer-events-none" />
            </div>

            <motion.div
              animate={{
                borderColor: ["rgba(255,255,255,0.2)", "rgba(255,255,255,0.4)", "rgba(255,255,255,0.2)"],
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="bg-gradient-to-br from-white/10 to-zinc-900/50 border-2 border-white/20 rounded-xl p-4 sm:p-6 mb-4 relative overflow-hidden"
            >
              <div className="absolute top-3 right-3 px-2 py-1 bg-white text-black rounded-full text-[10px] font-bold">
                LIMITED ACCESS
              </div>
              
              <h4 className="text-base sm:text-lg font-bold text-white mb-2">
                Download Your Full Report
              </h4>
              <p className="text-xs sm:text-sm text-zinc-400 mb-4">
                Your complete 10-page PDF with competency charts, data visualizations, 
                90-day roadmap, and personalized action plan is ready to download.
              </p>
              
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  "10 detailed pages",
                  "Charts & data visualizations",
                  "Instant PDF download",
                  "Professional document format",
                ].map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-1.5 text-[10px] sm:text-xs text-zinc-300"
                  >
                    <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white shrink-0" />
                    {feature}
                  </div>
                ))}
              </div>

              <motion.button
                onClick={() => setShowPricing(true)}
                whileTap={{ scale: 0.98 }}
                animate={{
                  boxShadow: [
                    "0 10px 40px rgba(255,255,255,0.1)",
                    "0 10px 60px rgba(255,255,255,0.2)",
                    "0 10px 40px rgba(255,255,255,0.1)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-full flex items-center justify-center gap-2 bg-white text-black px-5 py-3 sm:py-3.5 rounded-full text-sm sm:text-base font-semibold hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Get Your Leadership Report</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
              
              <p className="mt-3 text-[10px] sm:text-xs text-center text-zinc-500">
                Free intro call • No commitment required
              </p>
            </motion.div>

            <button
              onClick={() => {
                setIsComplete(false);
                setCurrentQ(0);
                setAnswers({});
                setReportReady(false);
                setReportData(null);
              }}
              className="w-full text-center text-xs sm:text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              ← Restart Assessment
            </button>
          </motion.div>
        )}

        {!isGeneratingReport && !reportReady && (
          <div className="text-center py-8">
            <Loader className="w-12 h-12 text-zinc-600 mx-auto mb-4 animate-spin" />
            <p className="text-sm text-zinc-500">Loading your results...</p>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 shadow-2xl w-full"
    >
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-white">Quick Assessment</h3>
        <span className="text-xs sm:text-sm text-zinc-400">
          {currentQ + 1} / {questions.length}
        </span>
      </div>

      <div className="h-1 sm:h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-5 sm:mb-6">
        <motion.div
          className="h-full bg-white"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="min-h-[280px] sm:min-h-[320px] mb-5 sm:mb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h4 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-3 sm:mb-4 leading-snug">
              {question.question}
            </h4>

            {question.type === "radio" && (
              <div className="space-y-2 sm:space-y-3">
                {question.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleSelect(option)}
                    className={`w-full text-left p-3 sm:p-4 rounded-lg sm:rounded-xl border transition-all cursor-pointer text-sm sm:text-base active:scale-[0.98] ${
                      answers[question.id] === option
                        ? "bg-zinc-800 border-zinc-600 text-white"
                        : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {question.type === "textarea" && (
              <textarea
                value={answers[question.id] || ""}
                onChange={(e) => handleSelect(e.target.value)}
                placeholder={question.placeholder}
                className="w-full min-h-[120px] sm:min-h-[150px] bg-zinc-900 border border-zinc-800 text-white text-sm sm:text-base rounded-lg sm:rounded-xl p-3 sm:p-4 resize-none focus:border-zinc-700 focus:outline-none placeholder:text-zinc-500"
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <button
          onClick={handleBack}
          disabled={currentQ === 0}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg border border-zinc-800 text-xs sm:text-sm font-medium transition-all active:scale-95 ${
            currentQ === 0
              ? "opacity-30 cursor-not-allowed text-zinc-500"
              : "text-white hover:bg-zinc-900 cursor-pointer"
          }`}
        >
          <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Back</span>
        </button>
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className={`flex items-center gap-1.5 sm:gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all active:scale-95 ${
            canProceed
              ? "bg-white text-black hover:bg-zinc-100 cursor-pointer"
              : "bg-white/30 text-black/50 opacity-30 cursor-not-allowed"
          }`}
        >
          {isLast ? "Submit" : "Next"}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
