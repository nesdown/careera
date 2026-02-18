import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, CheckCircle, Lock, Calendar, Download, Loader } from "lucide-react";
import { questions, roadmapPhases } from "../data/questions";

export default function QuestionnaireWidget() {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isComplete, setIsComplete] = useState(false);
  const [showCalendly, setShowCalendly] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const [pdfData, setPdfData] = useState(null);
  const [hasBooked, setHasBooked] = useState(false);
  
  const question = questions[currentQ];
  const progress = ((currentQ + 1) / questions.length) * 100;
  const isLast = currentQ === questions.length - 1;

  const handleSelect = (option) => {
    setAnswers((prev) => ({ ...prev, [question.id]: option }));
  };

  const handleNext = () => {
    if (isLast) {
      setIsComplete(true);
      generatePDF();
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

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPdfData(data);
        setPdfGenerated(true);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const downloadPDF = () => {
    if (!pdfData) return;
    
    const link = document.createElement('a');
    link.href = pdfData.pdf;
    link.download = pdfData.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Listen for Calendly booking completion
  useEffect(() => {
    const handleCalendlyEvent = (e) => {
      if (e.data.event === 'calendly.event_scheduled') {
        // User booked a call - mark as booked and show download
        setHasBooked(true);
        setTimeout(() => {
          alert('Thank you for booking! You can now download your Leadership Report.');
        }, 1000);
      }
    };

    window.addEventListener('message', handleCalendlyEvent);
    return () => window.removeEventListener('message', handleCalendlyEvent);
  }, []);

  // Initialize Calendly widget when showCalendly becomes true
  useEffect(() => {
    if (showCalendly && window.Calendly) {
      const timer = setTimeout(() => {
        const widgetElement = document.querySelector('.calendly-inline-widget');
        if (widgetElement && !widgetElement.querySelector('iframe')) {
          // Manually initialize the widget
          window.Calendly.initInlineWidget({
            url: 'https://calendly.com/careera-roadmap/careera-roadmap-review?hide_gdpr_banner=1&background_color=ffffff&text_color=000000&primary_color=000000',
            parentElement: widgetElement,
          });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showCalendly]);

  // Show completion/results view or Calendly
  if (isComplete) {
    // Show Calendly embed as final step
    if (showCalendly) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden w-full"
        >
          {/* Header */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Book Your Leadership Call
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                {hasBooked ? 'Booking confirmed! Download your report below.' : 'Select a time that works for you'}
              </p>
            </div>
            {pdfGenerated && hasBooked && (
              <button
                onClick={downloadPDF}
                className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-zinc-100 text-black border border-white/20 rounded-lg text-xs font-semibold transition-colors"
              >
                <Download className="w-3 h-3" />
                <span className="hidden sm:inline">Download Report</span>
                <span className="sm:hidden">Report</span>
              </button>
            )}
          </div>

          {/* Calendly Embed */}
          <div className="bg-white p-0">
            <div 
              className="calendly-inline-widget" 
              style={{
                minWidth: '320px',
                height: '700px',
                width: '100%'
              }}
            />
          </div>

          {/* Back button */}
          <div className="px-4 sm:px-6 py-3 border-t border-zinc-800 bg-zinc-900">
            <button
              onClick={() => setShowCalendly(false)}
              className="text-xs sm:text-sm text-zinc-400 hover:text-white transition-colors"
            >
              ← Back to Results
            </button>
          </div>
        </motion.div>
      );
    }

    // Show results page (more compact)
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 shadow-2xl w-full"
      >
        {/* Report Generation Progress */}
        {isGeneratingPDF && (
          <div className="mb-6">
            <div className="text-center mb-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white/10 border border-white/20 rounded-full mb-4"
              >
                <Loader className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </motion.div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Crafting Your Leadership Report
              </h3>
              <p className="text-sm text-zinc-400">
                Our AI is analyzing your responses...
              </p>
            </div>

            {/* Animated Progress Bar */}
            <div className="bg-zinc-800 rounded-full h-2 overflow-hidden mb-3">
              <motion.div
                className="h-full bg-gradient-to-r from-white via-zinc-300 to-white"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 3, ease: "easeInOut" }}
              />
            </div>

            {/* Progress Steps */}
            <div className="space-y-2">
              {[
                { label: "Analyzing your current situation", delay: 0 },
                { label: "Identifying key strengths", delay: 0.5 },
                { label: "Mapping development opportunities", delay: 1 },
                { label: "Creating personalized roadmap", delay: 1.5 },
              ].map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: step.delay }}
                  className="flex items-center gap-2 text-xs sm:text-sm text-zinc-400"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: step.delay + 0.2 }}
                  >
                    <CheckCircle className="w-4 h-4 text-white" />
                  </motion.div>
                  {step.label}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Report Preview - Show after generation */}
        {!isGeneratingPDF && pdfGenerated && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Success Header */}
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
                Here's a preview of what we've prepared for you
              </p>
            </div>

            {/* Report Preview Card */}
            <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700 rounded-xl p-4 sm:p-6 mb-6 relative overflow-hidden">
              {/* Report Header */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-700">
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-white mb-1">
                    LEADERSHIP DEVELOPMENT REPORT
                  </div>
                  <div className="text-[10px] sm:text-xs text-zinc-500">
                    {new Date().toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
                <div className="px-2 py-1 bg-white/10 border border-white/20 rounded text-[10px] font-bold text-white">
                  PREVIEW
                </div>
              </div>

              {/* Report Excerpt */}
              <div className="space-y-4 mb-4">
                {/* Executive Summary */}
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-white mb-2 flex items-center gap-2">
                    <span className="w-1 h-4 bg-white rounded-full"></span>
                    Executive Summary
                  </h4>
                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                    Based on your assessment, you're a motivated manager ready to elevate 
                    your leadership impact. Your responses indicate strong foundational skills 
                    with clear opportunities for strategic growth...
                  </p>
                </div>

                {/* Key Strengths Preview */}
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-white mb-2 flex items-center gap-2">
                    <span className="w-1 h-4 bg-white rounded-full"></span>
                    Key Strengths Identified
                  </h4>
                  <div className="space-y-1.5">
                    {[
                      "Strong commitment to team development and growth",
                      "Clear vision for personal career advancement",
                      "Demonstrated self-awareness and learning mindset",
                    ].map((strength, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-zinc-300">
                        <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white mt-0.5 shrink-0" />
                        <span>{strength}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Immediate Action Items Preview */}
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-white mb-2 flex items-center gap-2">
                    <span className="w-1 h-4 bg-white rounded-full"></span>
                    Immediate Action Items
                  </h4>
                  <div className="space-y-1.5">
                    {[
                      "Schedule 1-on-1s with direct reports this week",
                      "Identify one delegation opportunity for tomorrow",
                    ].map((action, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-zinc-300">
                        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border border-white/30 rounded mt-0.5 shrink-0" />
                        <span>{action}</span>
                      </div>
                    ))}
                    <div className="flex items-start gap-2 text-xs sm:text-sm text-zinc-500 italic">
                      <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border border-zinc-700 rounded mt-0.5 shrink-0" />
                      <span>+ 5 more personalized actions...</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fade Overlay for "Locked" Effect */}
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-zinc-900 to-transparent pointer-events-none" />
            </div>

            {/* Unlock CTA */}
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
                See Your Full Report + Personalized Roadmap
              </h4>
              <p className="text-xs sm:text-sm text-zinc-400 mb-4">
                Your complete report includes 30-day quick wins, 3-month leadership roadmap, 
                and curated resources. Book your intro call to unlock everything.
              </p>
              
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  "Complete 7-section report",
                  "Personalized action plan",
                  "1-on-1 strategy call",
                  "Ongoing mentorship",
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
                onClick={() => setShowCalendly(true)}
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
                <Calendar className="w-4 h-4" />
                <span>Book Call & Unlock Full Report</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
              
              <p className="mt-3 text-[10px] sm:text-xs text-center text-zinc-500">
                Free intro call • No commitment required
              </p>
            </motion.div>

            {/* Restart Option */}
            <button
              onClick={() => {
                setIsComplete(false);
                setCurrentQ(0);
                setAnswers({});
                setPdfGenerated(false);
                setPdfData(null);
              }}
              className="w-full text-center text-xs sm:text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              ← Restart Assessment
            </button>
          </motion.div>
        )}

        {/* Fallback - No report yet */}
        {!isGeneratingPDF && !pdfGenerated && (
          <div className="text-center py-8">
            <Loader className="w-12 h-12 text-zinc-600 mx-auto mb-4 animate-spin" />
            <p className="text-sm text-zinc-500">Loading your results...</p>
          </div>
        )}
      </motion.div>
    );
  }

  // Show questionnaire - Fixed width
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

      {/* Fixed height container for consistent size */}
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
