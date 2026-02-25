import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, CheckCircle, Lock, Download, Loader, Sparkles, Zap } from "lucide-react";
import { getActiveQuestions, getQuestionnaireVariant, roadmapPhases } from "../data/questions";

export default function QuestionnaireWidget() {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isComplete, setIsComplete] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const [pdfData, setPdfData] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState(0);
  
  // Initialize variant and questions immediately (not in useEffect)
  const variant = useMemo(() => getQuestionnaireVariant(), []);
  const questions = useMemo(() => getActiveQuestions(), []);
  
  // Log variant assignment
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
    setLoadingProgress(0);
    setLoadingStep(0);

    // Start API call immediately but animate progress
    const apiPromise = fetch('/api/generate-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        answers,
        variant, // Include variant for tracking
      }),
    });

    // Animate through steps while API is working
    const steps = [
      { progress: 25, duration: 1800, step: 0 },  // Analyzing
      { progress: 50, duration: 2000, step: 1 },  // Identifying strengths
      { progress: 75, duration: 2200, step: 2 },  // Mapping opportunities
      { progress: 95, duration: 2000, step: 3 },  // Creating roadmap
    ];

    // Animate through steps
    for (const stepData of steps) {
      const startProgress = loadingProgress;
      const duration = stepData.duration;
      const startTime = Date.now();
      
      await new Promise(resolve => {
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const currentProgress = startProgress + (stepData.progress - startProgress) * progress;
          
          setLoadingProgress(currentProgress);
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            setLoadingStep(stepData.step + 1);
            resolve();
          }
        };
        
        animate();
      });
    }

    // Wait for API to complete and animate to 100%
    try {
      const response = await apiPromise;
      const data = await response.json();
      
      // Animate from 95% to 100%
      const finalStart = Date.now();
      await new Promise(resolve => {
        const animate = () => {
          const elapsed = Date.now() - finalStart;
          const progress = Math.min(elapsed / 500, 1);
          const currentProgress = 95 + (5 * progress);
          
          setLoadingProgress(currentProgress);
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            resolve();
          }
        };
        animate();
      });
      
      if (data.success) {
        setPdfData(data);
        setPdfGenerated(true);
      } else {
        // Still show the preview even if PDF generation failed
        setPdfGenerated(true);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Complete animation even on error
      setLoadingProgress(100);
      setPdfGenerated(true);
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

  const handlePurchase = (option) => {
    setSelectedOption(option);
    // TODO: Integrate payment here
    console.log(`User selected: ${option}`);
    
    // For now, just simulate purchase and allow download
    setTimeout(() => {
      alert(`Purchase confirmed! ${option === 'report' ? 'Report' : 'Report + Career Boost Call'}`);
      if (option === 'report') {
        downloadPDF();
      }
    }, 500);
  };

  // Show completion/results view or pricing
  if (isComplete) {
    // Show pricing options
    if (showPricing) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden w-full"
        >
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-zinc-800 bg-zinc-900">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-1">
              Get Your Leadership Report
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400">
              Choose the option that fits your needs
            </p>
          </div>

          {/* Pricing Options */}
          <div className="p-4 sm:p-6 space-y-4">
            {/* Option 1: Report Only */}
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
                    Get your personalized 6-page leadership report with AI analysis
                  </p>
                </div>
                <div className="text-right ml-4">
                  <div className="text-2xl sm:text-3xl font-bold text-white">$9.99</div>
                </div>
              </div>
              
              <ul className="space-y-2 mb-4">
                {[
                  "Personalized leadership analysis",
                  "6 competency scores",
                  "Leadership archetype identification",
                  "90-day action roadmap",
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

            {/* Option 2: Report + Career Boost Call */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handlePurchase('report-call')}
              className="relative bg-gradient-to-br from-white/10 to-zinc-900/50 border-2 border-white/40 rounded-xl p-4 sm:p-6 cursor-pointer transition-all overflow-hidden group"
            >
              {/* Popular badge */}
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

          {/* Footer */}
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

    // Show results page (more compact)
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 shadow-2xl w-full"
      >
        {/* Report Generation Progress - Space Theme */}
        {isGeneratingPDF && (
          <div className="mb-6">
            <div className="text-center mb-6">
              {/* Orbiting Animation - Space Theme */}
              <div className="relative inline-flex items-center justify-center w-32 h-32 sm:w-40 sm:h-40 mb-6">
                {/* Center moon */}
                <motion.div
                  animate={{ 
                    rotate: 360,
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ 
                    rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                    scale: { duration: 2, repeat: Infinity }
                  }}
                  className="absolute w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full shadow-lg shadow-white/50"
                />
                
                {/* Orbit path */}
                <motion.div
                  className="absolute w-full h-full border-2 border-zinc-700 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                />
                
                {/* Orbiting dots */}
                {[0, 120, 240].map((angle, idx) => (
                  <motion.div
                    key={idx}
                    className="absolute w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full"
                    style={{
                      top: '50%',
                      left: '50%',
                      transformOrigin: '0 0',
                    }}
                    animate={{
                      rotate: 360,
                      opacity: [0.3, 1, 0.3]
                    }}
                    transition={{
                      rotate: { duration: 12, repeat: Infinity, ease: "linear", delay: idx * 0.3 },
                      opacity: { duration: 3, repeat: Infinity, delay: idx * 0.3 }
                    }}
                    initial={{ rotate: angle }}
                  >
                    <div className="w-full h-full translate-x-[-50%] translate-y-[-50%]" 
                         style={{ transform: `translate(-50%, -50%) translateX(${16 * (idx % 2 === 0 ? 3.5 : 4)}px)` }} />
                  </motion.div>
                ))}
                
                {/* Stars */}
                {[...Array(8)].map((_, idx) => (
                  <motion.div
                    key={`star-${idx}`}
                    className="absolute w-1 h-1 bg-white rounded-full"
                    style={{
                      top: `${20 + Math.random() * 60}%`,
                      left: `${20 + Math.random() * 60}%`,
                    }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: idx * 0.3
                    }}
                  />
                ))}
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Crafting Your Leadership Report
              </h3>
              <p className="text-sm text-zinc-400">
                Analyzing your path to leadership excellence...
              </p>
            </div>

            {/* Animated Progress Bar */}
            <div className="bg-zinc-800 rounded-full h-2 overflow-hidden mb-4 relative">
              <motion.div
                className="h-full bg-gradient-to-r from-white via-zinc-300 to-white relative overflow-hidden"
                style={{ width: `${loadingProgress}%` }}
              >
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </motion.div>
            </div>

            {/* Progress percentage */}
            <div className="text-center mb-4">
              <span className="text-2xl font-bold text-white">{Math.round(loadingProgress)}%</span>
            </div>

            {/* Progress Steps */}
            <div className="space-y-3">
              {[
                { label: "Analyzing your current leadership situation", step: 0 },
                { label: "Identifying your unique strengths", step: 1 },
                { label: "Mapping growth opportunities", step: 2 },
                { label: "Creating your personalized roadmap", step: 3 },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0.3, x: -20 }}
                  animate={{ 
                    opacity: loadingStep > item.step ? 1 : (loadingStep === item.step ? 0.7 : 0.3),
                    x: loadingStep >= item.step ? 0 : -20
                  }}
                  transition={{ duration: 0.5 }}
                  className="flex items-center gap-3 text-sm text-zinc-400"
                >
                  {loadingStep > item.step ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", duration: 0.5 }}
                      className="shrink-0"
                    >
                      <CheckCircle className="w-5 h-5 text-white" />
                    </motion.div>
                  ) : loadingStep === item.step ? (
                    <Loader className="w-5 h-5 text-white animate-spin shrink-0" />
                  ) : (
                    <div className="w-5 h-5 border-2 border-zinc-700 rounded-full shrink-0" />
                  )}
                  <span className={loadingStep >= item.step ? 'text-white' : ''}>
                    {item.label}
                  </span>
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
