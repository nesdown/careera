import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, CheckCircle, Lock } from "lucide-react";
import { questions, roadmapPhases } from "../data/questions";

export default function QuestionnaireWidget() {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isComplete, setIsComplete] = useState(false);
  const [showCalendly, setShowCalendly] = useState(false);
  
  const question = questions[currentQ];
  const progress = ((currentQ + 1) / questions.length) * 100;
  const isLast = currentQ === questions.length - 1;

  const handleSelect = (option) => {
    setAnswers((prev) => ({ ...prev, [question.id]: option }));
  };

  const handleNext = () => {
    if (isLast) {
      setIsComplete(true);
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

  // Show completion/results view or Calendly
  if (isComplete) {
    // Show Calendly embed as final step
    if (showCalendly) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-800 bg-zinc-900">
            <h3 className="text-base sm:text-lg font-bold text-white">
              Book Your Leadership Call
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Let&apos;s discuss your career goals
            </p>
          </div>

          {/* Calendly Embed */}
          <div className="bg-black" style={{ height: '700px', maxHeight: '80vh' }}>
            <div 
              className="calendly-inline-widget w-full h-full" 
              data-url="https://calendly.com/careera-roadmap/careera-roadmap-review?hide_gdpr_banner=1&background_color=000000&text_color=ffffff&primary_color=ffffff"
              style={{
                width: '100%',
                height: '100%'
              }}
            />
          </div>

          {/* Back button */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-zinc-800 bg-zinc-900">
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
        className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 shadow-2xl"
      >
        {/* Success Icon - Compact */}
        <div className="text-center mb-4 sm:mb-5">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-white/10 border border-white/20 rounded-full mb-3"
          >
            <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </motion.div>
          <h3 className="text-lg sm:text-xl font-bold text-white mb-1.5">
            Your Career Boost Plan is Ready
          </h3>
          <p className="text-zinc-400 text-xs sm:text-sm">
            Here's a preview—book your intro call to unlock everything
          </p>
        </div>

        {/* Roadmap Preview - Compact */}
        <div className="mb-4 sm:mb-5 space-y-2 sm:space-y-3 max-h-[300px] sm:max-h-[350px] overflow-y-auto">
          {roadmapPhases.slice(0, 1).map((phase) => (
            <div
              key={phase.id}
              className="bg-zinc-900/50 border border-zinc-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] sm:text-xs font-semibold tracking-wider uppercase text-white">
                  Phase {phase.id} — Free Preview
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-bold text-white mb-1">
                {phase.title}
              </h4>
              <p className="text-xs text-zinc-400 mb-2 leading-relaxed">
                {phase.description}
              </p>
              <div className="space-y-1">
                {phase.tasks.slice(0, 3).map((task, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[10px] sm:text-xs text-zinc-300">
                    <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white mt-0.5 shrink-0" />
                    <span>{task}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Locked Phases Preview - Compact */}
          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg sm:rounded-xl p-3 sm:p-4 relative overflow-hidden">
            <div className="filter blur-[1px] pointer-events-none">
              <div className="text-[10px] sm:text-xs text-zinc-600 mb-1">Phases 2-3</div>
              <h4 className="text-xs sm:text-sm font-bold text-zinc-600 mb-1">
                Complete Leadership Program
              </h4>
              <p className="text-[10px] text-zinc-700">
                Advanced leadership skills, team management, executive presence, and career strategy.
              </p>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-600" />
            </div>
          </div>
        </div>

        {/* Paywall CTA - Compact, no hover scale */}
        <motion.div
          animate={{
            borderColor: ["rgba(255,255,255,0.2)", "rgba(255,255,255,0.4)", "rgba(255,255,255,0.2)"],
          }}
          transition={{ duration: 3, repeat: Infinity }}
          className="bg-gradient-to-br from-white/10 to-zinc-900/50 border-2 border-white/20 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-3 relative overflow-hidden"
        >
          <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-white text-black rounded-full text-[10px] font-bold">
            POPULAR
          </div>
          <h4 className="text-sm sm:text-base font-bold text-white mb-1">
            Ready to Become a Leader?
          </h4>
          <p className="text-xs text-zinc-400 mb-3">
            Book your intro call to unlock your full roadmap and start your transformation.
          </p>
          
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {[
              "Full career roadmap",
              "1-on-1 intro call",
              "Regular mentorship",
              "Leadership skills",
            ].map((feature) => (
              <div
                  key={feature}
                  className="flex items-center gap-1 text-[10px] sm:text-xs text-zinc-300"
                >
                  <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white shrink-0" />
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
            className="w-full flex items-center justify-center gap-1.5 bg-white text-black px-4 sm:px-5 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-semibold hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <span className="hidden sm:inline">Unlock Full Roadmap + Intro Call</span>
            <span className="sm:hidden">Unlock Full Roadmap</span>
            <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
          </motion.button>
          
          <p className="mt-2 text-[10px] sm:text-xs text-center text-zinc-500">
            Limited spots available
          </p>
        </motion.div>

        {/* Restart Option */}
        <button
          onClick={() => {
            setIsComplete(false);
            setCurrentQ(0);
            setAnswers({});
          }}
          className="w-full text-center text-xs sm:text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          ← Restart Assessment
        </button>
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
