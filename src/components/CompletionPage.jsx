import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight, Lock } from "lucide-react";
import { roadmapPhases } from "../data/questions";
import Navbar from "./Navbar";
import CalendlyModal from "./CalendlyModal";

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const childFade = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export default function CompletionPage({ answers }) {
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [showCalendly, setShowCalendly] = useState(false);

  if (showRoadmap) {
    return (
      <RoadmapPreview
        answers={answers}
        onBookCall={() => setShowCalendly(true)}
        showCalendly={showCalendly}
        onCloseCalendly={() => setShowCalendly(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center px-6 pt-24 pb-12">
        <motion.div
          className="max-w-2xl w-full text-center"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.div
            variants={childFade}
            className="inline-flex items-center justify-center w-24 h-24 bg-white/10 border border-white/20 rounded-full mb-8"
          >
            <CheckCircle className="w-16 h-16 text-white" />
          </motion.div>

          <motion.h1
            variants={childFade}
            className="text-4xl md:text-5xl font-bold text-white mb-6"
          >
            Thank You for Starting Your Journey!
          </motion.h1>

          <motion.p
            variants={childFade}
            className="text-lg text-zinc-400 mb-10 leading-relaxed"
          >
            We're analyzing your responses to create your personalized career
            roadmap. Our team will reach out within 24 hours with your custom
            plan and matched mentors.
          </motion.p>

          <motion.div
            variants={childFade}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-left mb-10"
          >
            <h3 className="text-xl font-bold text-white mb-6">
              What Happens Next?
            </h3>
            <ol className="space-y-4">
              {[
                "We analyze your responses and career profile",
                "Your personalized roadmap is created by our experts",
                "We match you with 3-5 ideal mentors from our network",
                "You'll receive everything via email within 24 hours",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-zinc-800 border border-zinc-700 rounded-full text-sm font-semibold text-white">
                    {i + 1}
                  </span>
                  <span className="text-zinc-300 pt-1">{step}</span>
                </li>
              ))}
            </ol>
          </motion.div>

          <motion.div
            variants={childFade}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={() => setShowRoadmap(true)}
              className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-semibold hover:bg-zinc-100 transition-all shadow-lg shadow-white/20 cursor-pointer"
            >
              Preview Your Roadmap
              <ArrowRight className="w-5 h-5" />
            </button>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold border border-zinc-800 text-white hover:bg-zinc-900 transition-all"
            >
              Return to Home
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

function RoadmapPreview({ answers, onBookCall, showCalendly, onCloseCalendly }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      <Navbar />

      <div className="flex-1 px-6 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Your Personalized Roadmap
            </h1>
            <p className="text-lg text-zinc-400">
              6-month plan to transform your career
            </p>
          </motion.div>

          <div className="space-y-6">
            {roadmapPhases.map((phase, index) => (
              <motion.div
                key={phase.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={`border rounded-2xl overflow-hidden transition-all ${
                  phase.unlocked
                    ? "bg-gradient-to-br from-zinc-900 to-black border-zinc-800"
                    : "bg-zinc-900/50 border-zinc-800/50"
                }`}
              >
                {phase.unlocked ? (
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-semibold tracking-wider uppercase text-white">
                        Phase {phase.id} — Unlocked
                      </span>
                    </div>
                    <div className="text-sm text-zinc-500 mb-1">
                      {phase.duration}
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">
                      {phase.title}
                    </h3>
                    <p className="text-zinc-400 mb-6 leading-relaxed">
                      {phase.description}
                    </p>

                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wider">
                        Key Actions
                      </h4>
                      <ul className="space-y-2">
                        {phase.tasks.map((task, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-3 text-zinc-300"
                          >
                            <CheckCircle className="w-4 h-4 text-white mt-0.5 shrink-0" />
                            <span className="text-sm">{task}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {phase.outcomes && (
                      <div>
                        <h4 className="text-sm font-semibold text-zinc-300 mb-3 uppercase tracking-wider">
                          Expected Outcomes
                        </h4>
                        <ul className="space-y-2">
                          {phase.outcomes.map((outcome, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-3 text-zinc-300"
                            >
                              <CheckCircle className="w-4 h-4 text-white mt-0.5 shrink-0" />
                              <span className="text-sm">{outcome}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-8 relative">
                    <div className="filter blur-[2px] pointer-events-none">
                      <div className="text-sm text-zinc-500 mb-1">
                        {phase.duration}
                      </div>
                      <h3 className="text-xl font-bold text-zinc-500 mb-2">
                        {phase.title}
                      </h3>
                      <p className="text-zinc-600 text-sm">
                        {phase.description}
                      </p>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="w-6 h-6 text-zinc-600" />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-10 bg-gradient-to-br from-zinc-900 to-black border border-zinc-700 rounded-3xl p-8 md:p-12 text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Unlock Your Complete Career Transformation
            </h2>
            <p className="text-lg text-zinc-400 mb-8 max-w-2xl mx-auto">
              Get instant access to your full 6-month personalized roadmap +
              30-minute 1-on-1 strategy session with a senior career expert
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto mb-8">
              {[
                "Complete 6-month plan",
                "30-min expert call",
                "Custom action items",
                "Resource library access",
              ].map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-2 text-sm text-zinc-300"
                >
                  <CheckCircle className="w-4 h-4 text-white shrink-0" />
                  {feature}
                </div>
              ))}
            </div>

            <button
              onClick={onBookCall}
              className="inline-flex items-center gap-3 bg-white text-black px-10 py-5 rounded-full text-lg font-semibold shadow-lg shadow-white/20 hover:shadow-white/30 hover:bg-zinc-100 transition-all cursor-pointer"
            >
              Book Your Career Boost Call &bull; $29.99
              <ArrowRight className="w-5 h-5" />
            </button>

            <p className="mt-4 text-sm text-zinc-500">
              💰 90-day money-back guarantee &bull; ⚡ Available slots filling
              fast
            </p>
          </motion.div>

          <div className="mt-8 text-center">
            <Link
              to="/"
              className="text-zinc-500 hover:text-zinc-300 transition-colors text-sm"
            >
              ← Return to Home
            </Link>
          </div>
        </div>
      </div>

      <CalendlyModal isOpen={showCalendly} onClose={onCloseCalendly} />
    </div>
  );
}
