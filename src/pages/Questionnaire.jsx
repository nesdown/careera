import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { questions } from "../data/questions";
import Navbar from "../components/Navbar";
import CompletionPage from "../components/CompletionPage";

export default function Questionnaire() {
  const location = useLocation();
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isComplete, setIsComplete] = useState(false);
  const [direction, setDirection] = useState(1);

  // Check if user completed questionnaire from widget
  useEffect(() => {
    if (location.state?.fromWidget && location.state?.answers) {
      setAnswers(location.state.answers);
      setIsComplete(true);
    }
  }, [location.state]);

  const question = questions[currentQ];
  const progress = ((currentQ + 1) / questions.length) * 100;
  const isLast = currentQ === questions.length - 1;

  const handleSelect = (value) => {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  };

  const handleNext = () => {
    if (isLast) {
      setIsComplete(true);
    } else {
      setDirection(1);
      setCurrentQ((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentQ > 0) {
      setDirection(-1);
      setCurrentQ((prev) => prev - 1);
    }
  };

  const canProceed = (() => {
    const answer = answers[question.id];
    if (!answer) return false;
    if (question.type === "textarea" && answer.trim().length < 5) return false;
    return true;
  })();

  if (isComplete) {
    return <CompletionPage answers={answers} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <Navbar
        showProgress
        progress={progress}
        questionLabel={`Question ${currentQ + 1} of ${questions.length}`}
      />

      <div className="flex-1 flex items-center justify-center px-6 pt-24 pb-12">
        <div className="max-w-3xl w-full">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentQ}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                {question.question}
              </h2>

              {question.type === "textarea" && (
                <p className="text-zinc-500 mb-8">
                  Take your time — the more detail you provide, the better we
                  can help you.
                </p>
              )}

              {question.type === "radio" && <div className="mb-8" />}

              {question.type === "radio" && (
                <div className="space-y-3">
                  {question.options.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleSelect(option)}
                      className={`w-full text-left p-5 rounded-xl border transition-all cursor-pointer text-lg ${
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
                  className="w-full min-h-[200px] bg-zinc-900 border border-zinc-800 text-white text-lg rounded-xl p-5 resize-none focus:border-zinc-700 focus:outline-none placeholder:text-zinc-500 transition-colors"
                />
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-10">
            <button
              onClick={handleBack}
              disabled={currentQ === 0}
              className={`flex items-center gap-2 px-5 py-3 rounded-lg border border-zinc-800 text-sm font-medium transition-all ${
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
              className={`flex items-center gap-2 px-8 py-3 rounded-lg text-sm font-semibold transition-all ${
                canProceed
                  ? "bg-white text-black hover:bg-zinc-100 cursor-pointer"
                  : "bg-white/30 text-black/50 opacity-30 cursor-not-allowed"
              }`}
            >
              {isLast ? "Submit" : "Next"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
