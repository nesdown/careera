import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, CheckCircle, Lock } from "lucide-react";
import { questions, roadmapPhases } from "../data/questions";
import CalendlyModal from "./CalendlyModal";

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

  // Show completion/results view
  if (isComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-3xl p-8 shadow-2xl"
      >
        {/* Success Icon */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-white/10 border border-white/20 rounded-full mb-4"
          >
            <CheckCircle className="w-12 h-12 text-white" />
          </motion.div>
          <h3 className="text-2xl font-bold text-white mb-2">
            You're One Step Ahead Already
          </h3>
          <p className="text-zinc-400 text-sm">
            Here's what you just unlocked—but there's so much more
          </p>
        </div>

        {/* Roadmap Preview - Phase 1 Unlocked */}
        <div className="mb-6 space-y-4 max-h-[500px] overflow-y-auto">
          {roadmapPhases.slice(0, 1).map((phase) => (
            <div
              key={phase.id}
              className="bg-zinc-900/50 border border-zinc-700/50 rounded-xl p-6"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold tracking-wider uppercase text-white">
                  Phase {phase.id} — Free Preview
                </span>
              </div>
              <div className="text-xs text-zinc-500 mb-1">{phase.duration}</div>
              <h4 className="text-lg font-bold text-white mb-2">
                {phase.title}
              </h4>
              <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
                {phase.description}
              </p>
              <div className="space-y-2">
                {phase.tasks.slice(0, 3).map((task, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                    <CheckCircle className="w-3 h-3 text-white mt-0.5 shrink-0" />
                    <span>{task}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Locked Phases Preview */}
          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-6 relative overflow-hidden">
            <div className="filter blur-[1px] pointer-events-none">
              <div className="text-xs text-zinc-600 mb-1">Phases 2-6</div>
              <h4 className="text-base font-bold text-zinc-600 mb-2">
                Full 6-Month Transformation Plan
              </h4>
              <p className="text-xs text-zinc-700">
                Strategic goal setting, skill development, networking strategy, personal branding, and opportunity execution.
              </p>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Lock className="w-8 h-8 text-zinc-600" />
            </div>
          </div>
        </div>

        {/* Paywall CTA */}
        <motion.div
          animate={{
            borderColor: ["rgba(255,255,255,0.2)", "rgba(255,255,255,0.4)", "rgba(255,255,255,0.2)"],
          }}
          transition={{ duration: 3, repeat: Infinity }}
          className="bg-gradient-to-br from-white/10 to-zinc-900/50 border-2 border-white/20 rounded-2xl p-6 mb-4 relative overflow-hidden"
        >
          <div className="absolute top-3 right-3 px-2 py-1 bg-white text-black rounded-full text-xs font-bold">
            POPULAR
          </div>
          <h4 className="text-lg font-bold text-white mb-2">
            Don't Stop Here—Unlock Everything
          </h4>
          <p className="text-sm text-zinc-400 mb-4">
            <span className="text-white font-semibold">328 people</span> unlocked their complete roadmap this week. Your competitors aren't waiting.
          </p>
          
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              "Complete 6-month plan",
              "30-min expert call",
              "Custom action items",
              "Resource library",
            ].map((feature) => (
              <div
                  key={feature}
                  className="flex items-center gap-1.5 text-xs text-zinc-300"
                >
                  <CheckCircle className="w-3 h-3 text-white shrink-0" />
                  {feature}
                </div>
            ))}
          </div>

          <motion.button
            onClick={() => setShowCalendly(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            animate={{
              boxShadow: [
                "0 10px 40px rgba(255,255,255,0.1)",
                "0 10px 60px rgba(255,255,255,0.2)",
                "0 10px 40px rgba(255,255,255,0.1)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-full flex items-center justify-center gap-2 bg-white text-black px-6 py-4 rounded-full text-sm font-semibold hover:bg-zinc-100 transition-all cursor-pointer"
          >
            Unlock Full Roadmap • $29.99
            <ArrowRight className="w-4 h-4" />
          </motion.button>
          
          <p className="mt-3 text-xs text-center text-zinc-500">
            ⚡ <span className="text-white font-semibold">12 spots left</span> this month • 90-day guarantee
          </p>
        </motion.div>

        {/* Restart Option */}
        <button
          onClick={() => {
            setIsComplete(false);
            setCurrentQ(0);
            setAnswers({});
          }}
          className="w-full text-center text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          ← Restart Assessment
        </button>

        <CalendlyModal isOpen={showCalendly} onClose={() => setShowCalendly(false)} />
      </motion.div>
    );
  }

  // Show questionnaire
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-3xl p-8 shadow-2xl"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Quick Assessment</h3>
        <span className="text-sm text-zinc-400">
          {currentQ + 1} / {questions.length}
        </span>
      </div>

      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-6">
        <motion.div
          className="h-full bg-white"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <h4 className="text-xl font-semibold text-white mb-4">
            {question.question}
          </h4>

          {question.type === "radio" && (
            <div className="space-y-3">
              {question.options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleSelect(option)}
                  className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer text-base ${
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
              className="w-full min-h-[150px] bg-zinc-900 border border-zinc-800 text-white text-base rounded-xl p-4 resize-none focus:border-zinc-700 focus:outline-none placeholder:text-zinc-500"
            />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between mt-6">
        <button
          onClick={handleBack}
          disabled={currentQ === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-800 text-sm font-medium transition-all ${
            currentQ === 0
              ? "opacity-30 cursor-not-allowed text-zinc-500"
              : "text-white hover:bg-zinc-900 cursor-pointer"
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
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
