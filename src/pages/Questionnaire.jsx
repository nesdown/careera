import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Rocket, CheckCircle } from "lucide-react";
import { getActiveQuestions, getActiveMilestones, getQuestionnaireVariant } from "../data/questions";
import { SpaceBackground, ShootingStars, GradientOrbs } from "../components/SpaceBackground";
import CompletionPage from "../components/CompletionPage";

// ─── Static data (pre-calculated once at module load) ─────────────────────────

const LAUNCH_PARTICLES = Array.from({ length: 35 }, (_, i) => ({
  id: i,
  left: 5 + Math.random() * 90,
  top: Math.random() * 100,
  duration: 0.6 + Math.random() * 1.2,
  delay: Math.random() * 1.5,
  size: Math.random() > 0.6 ? 2 : 1,
}));

// Burst particles that explode outward when an option is selected
const BURST_PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  angle: (i / 12) * 360,
  distance: 30 + Math.random() * 50,
  size: Math.random() > 0.5 ? 2 : 1,
}));

// Milestone check-points are loaded dynamically from the questions data per variant

// ─── Helper components ─────────────────────────────────────────────────────────

// Cinematic rocket-launch screen
function LaunchSequence() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center z-50 overflow-hidden"
    >
      {LAUNCH_PARTICLES.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-white"
          style={{ left: `${p.left}%`, top: `${p.top}%`, width: `${p.size}px`, height: `${p.size}px` }}
          animate={{ y: [0, -800], opacity: [0, 0.9, 0] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "linear" }}
        />
      ))}
      <motion.div
        initial={{ y: 0, opacity: 1 }}
        animate={{ y: -320, opacity: 0 }}
        transition={{ duration: 1.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative mb-8"
      >
        <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 0.25, repeat: Infinity }}>
          <Rocket className="w-14 h-14 sm:w-16 sm:h-16 text-white" />
        </motion.div>
        <motion.div
          animate={{ height: ["16px", "36px", "16px"], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.18, repeat: Infinity }}
          className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-3 bg-gradient-to-b from-white via-white/60 to-transparent rounded-full"
        />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center"
      >
        <div className="text-white text-xl sm:text-2xl font-bold mb-2">Assessment Complete</div>
        <div className="text-zinc-500 text-xs sm:text-sm font-mono tracking-widest uppercase">
          Analyzing your leadership trajectory
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-white"
              animate={{ opacity: [0.15, 1, 0.15] }}
              transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.22 }}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// "SIGNAL RECEIVED" toast — top-right confirmation after each selection
function SignalToast({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="toast"
          initial={{ opacity: 0, y: -12, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="fixed top-4 right-4 sm:top-5 sm:right-5 z-40 flex items-center gap-2 px-3 py-1.5 bg-zinc-900/95 border border-white/15 rounded-full text-[10px] sm:text-xs font-mono text-white backdrop-blur-md pointer-events-none shadow-lg"
        >
          <motion.div
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 0.35 }}
            className="w-1.5 h-1.5 rounded-full bg-white shrink-0"
          />
          SIGNAL RECEIVED
          <CheckCircle className="w-3 h-3 text-white/70" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Section-complete milestone celebration overlay
function MilestoneOverlay({ sectionName, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 900);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-30 flex items-center justify-center pointer-events-none"
    >
      {/* Radial burst particles */}
      {BURST_PARTICLES.map((p) => {
        const rad = (p.angle * Math.PI) / 180;
        return (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-white"
            style={{ width: `${p.size}px`, height: `${p.size}px` }}
            initial={{ x: 0, y: 0, opacity: 0.9 }}
            animate={{
              x: Math.cos(rad) * p.distance,
              y: Math.sin(rad) * p.distance,
              opacity: 0,
            }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        );
      })}

      {/* Checkpoint card */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 1.05, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="text-center"
      >
        <div className="text-[9px] sm:text-[10px] font-mono text-zinc-500 tracking-[0.35em] uppercase mb-2">
          {sectionName} — Complete
        </div>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "160px" }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="h-px bg-gradient-to-r from-transparent via-white to-transparent mx-auto mb-3"
        />
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
          className="text-4xl sm:text-5xl font-bold text-white"
        >
          ✓
        </motion.div>
      </motion.div>

      {/* Subtle screen flash */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.07, 0] }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0 bg-white"
      />
    </motion.div>
  );
}

// Word-by-word question text reveal
function QuestionText({ text, questionId, isFinal }) {
  const words = text.split(" ");
  return (
    <h2 className={`font-bold text-white leading-snug mb-6 sm:mb-8 ${isFinal ? "text-2xl sm:text-3xl md:text-4xl" : "text-2xl sm:text-3xl md:text-4xl"}`}>
      {words.map((word, i) => (
        <motion.span
          key={`${questionId}-w${i}`}
          initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{
            delay: 0.08 + i * 0.028,
            duration: 0.28,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="inline-block"
          style={{ marginRight: "0.28em" }}
        >
          {word}
        </motion.span>
      ))}
    </h2>
  );
}

// Enhanced radio option card
function RadioOption({ option, optIdx, isSelected, isAnySelected, onClick, questionId }) {
  return (
    <motion.button
      key={`${questionId}-opt-${optIdx}`}
      initial={{ opacity: 0, x: 16 }}
      animate={{
        opacity: isAnySelected && !isSelected ? 0.38 : 1,
        x: 0,
        scale: isSelected ? 1.005 : 1,
      }}
      transition={{
        opacity: { duration: 0.18 },
        scale: { type: "spring", stiffness: 400, damping: 25 },
        default: { delay: optIdx * 0.048, duration: 0.32, ease: [0.22, 1, 0.36, 1] },
      }}
      onClick={onClick}
      className={`relative w-full text-left p-3.5 sm:p-4 rounded-xl border transition-colors duration-150 flex items-start gap-3 sm:gap-4 group cursor-pointer overflow-hidden ${
        isSelected
          ? "bg-white/[0.08] border-white/30 text-white"
          : "bg-zinc-900/40 border-zinc-800/70 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 hover:bg-zinc-900/70"
      }`}
    >
      {/* Hover sweep shimmer */}
      {!isAnySelected && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent -translate-x-full pointer-events-none"
          whileHover={{ translateX: "200%" }}
          transition={{ duration: 0.55, ease: "easeInOut" }}
        />
      )}

      {/* Selection ripple */}
      {isSelected && (
        <motion.div
          key={`ripple-${questionId}-${optIdx}`}
          initial={{ scale: 0.4, opacity: 0.3 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="absolute inset-0 bg-white rounded-xl pointer-events-none"
        />
      )}

      {/* Letter / check badge */}
      <div
        className={`relative w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-mono font-bold transition-all duration-200 ${
          isSelected
            ? "bg-white border-white text-black"
            : "border-zinc-700 text-zinc-600 group-hover:border-zinc-500 group-hover:text-zinc-400"
        }`}
      >
        <AnimatePresence mode="wait">
          {isSelected ? (
            <motion.span
              key="check"
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
            >
              ✓
            </motion.span>
          ) : (
            <motion.span key="letter" initial={{ scale: 1 }} exit={{ scale: 0 }}>
              {String.fromCharCode(65 + optIdx)}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <span className="flex-1 text-sm sm:text-base leading-relaxed">{option}</span>

      {/* Right-side confirmed dot */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.05 }}
          className="shrink-0 mt-1.5 w-3.5 h-3.5 rounded-full bg-white/20 border border-white/30 flex items-center justify-center"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-white" />
        </motion.div>
      )}
    </motion.button>
  );
}

// Horizontal scan beam that sweeps each new question
function ScanLine({ questionId }) {
  return (
    <motion.div
      key={`scan-${questionId}`}
      initial={{ y: 0, opacity: 0 }}
      animate={{ y: 280, opacity: [0, 0.35, 0] }}
      transition={{ duration: 0.65, delay: 0.06, ease: "easeOut" }}
      className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none"
    />
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function Questionnaire() {
  const location = useLocation();
  const navigate = useNavigate();

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isComplete, setIsComplete] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [direction, setDirection] = useState(1);

  // Animation states
  const [signalToast, setSignalToast] = useState(false);
  const [bgPulse, setBgPulse] = useState(false);
  const [milestone, setMilestone] = useState(null); // null | 1 | 2
  const [counterFlash, setCounterFlash] = useState(false);

  const autoAdvanceRef = useRef(null);
  const toastTimerRef = useRef(null);

  const questions = useMemo(() => getActiveQuestions(), []);
  const milestoneIndices = useMemo(() => getActiveMilestones(), []);
  const variant = useMemo(() => getQuestionnaireVariant(), []);

  useEffect(() => {
    if (location.state?.fromWidget && location.state?.answers) {
      setAnswers(location.state.answers);
      setIsComplete(true);
    }
  }, [location.state]);

  // Flash the question counter when it changes
  useEffect(() => {
    setCounterFlash(true);
    const t = setTimeout(() => setCounterFlash(false), 500);
    return () => clearTimeout(t);
  }, [currentQ]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const question = questions[currentQ];
  const isLast = currentQ === questions.length - 1;

  const triggerSignalToast = useCallback(() => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setSignalToast(true);
    toastTimerRef.current = setTimeout(() => setSignalToast(false), 1400);
  }, []);

  const advanceToNext = useCallback((fromQ) => {
    const isLastQ = fromQ === questions.length - 1;
    if (isLastQ) {
      setIsLaunching(true);
      setTimeout(() => {
        setIsLaunching(false);
        setIsComplete(true);
      }, 2400);
      return;
    }
    const milestoneIdx = milestoneIndices.indexOf(fromQ);
    if (milestoneIdx !== -1) {
      setMilestone(milestoneIdx + 1);
    } else {
      setDirection(1);
      setCurrentQ((prev) => prev + 1);
    }
  }, [milestoneIndices, questions.length]);

  const handleSelect = useCallback(
    (value) => {
      setAnswers((prev) => ({ ...prev, [question.id]: value }));
      triggerSignalToast();

      // Subtle background pulse
      setBgPulse(true);
      setTimeout(() => setBgPulse(false), 400);

      // Auto-advance for all radio questions, including the last one
      if (question.type === "radio") {
        if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
        const snapQ = currentQ;
        autoAdvanceRef.current = setTimeout(() => {
          advanceToNext(snapQ);
        }, 480);
      }
    },
    [question, isLast, currentQ, triggerSignalToast, advanceToNext]
  );

  const handleMilestoneDone = useCallback(() => {
    setMilestone(null);
    setDirection(1);
    setCurrentQ((prev) => prev + 1);
  }, []);

  const handleNext = () => {
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    if (isLast) {
      setIsLaunching(true);
      setTimeout(() => {
        setIsLaunching(false);
        setIsComplete(true);
      }, 2400);
    } else {
      advanceToNext(currentQ);
    }
  };

  const handleBack = () => {
    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
    if (currentQ > 0) {
      setDirection(-1);
      setCurrentQ((prev) => prev - 1);
    }
  };

  const canProceed = (() => {
    const answer = answers[question?.id];
    if (!answer) return false;
    if (question?.type === "textarea" && answer.trim().length < 5) return false;
    return true;
  })();

  const selectedAnswer = answers[question?.id];
  const isAnySelected = !!selectedAnswer;

  if (isLaunching) return <LaunchSequence />;
  if (isComplete) return <CompletionPage answers={answers} />;

  const arrivedFromLaunch = location.state?.fromLaunch ?? false;
  const sectionLabel = question?.section || "";
  const isFinalQ = isLast;

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden flex flex-col">
      <SpaceBackground />
      <ShootingStars />
      <GradientOrbs />

      {/* Subtle bg pulse when an answer is selected */}
      <AnimatePresence>
        {bgPulse && (
          <motion.div
            key="bgpulse"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.055, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.38 }}
            className="fixed inset-0 bg-white pointer-events-none z-[1]"
          />
        )}
      </AnimatePresence>

      {/* Milestone overlay — shows completed section name */}
      <AnimatePresence>
        {milestone !== null && (
          <MilestoneOverlay
            key={`milestone-${milestone}`}
            sectionName={questions[milestoneIndices[milestone - 1]]?.section || "Section"}
            onDone={handleMilestoneDone}
          />
        )}
      </AnimatePresence>

      {/* Signal received toast */}
      <SignalToast visible={signalToast} />

      {/* ── Top bar ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 flex items-center justify-between px-4 sm:px-6 pt-5 sm:pt-6 pb-3"
      >
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-300 transition-colors text-xs group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span className="font-mono tracking-widest uppercase">Abort</span>
        </button>

        <div className="flex items-center gap-2">
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-white"
          />
          <span className="text-[10px] sm:text-xs font-mono text-zinc-500 tracking-widest uppercase hidden sm:inline">
            Mission Control
          </span>
          <AnimatePresence mode="wait">
            <motion.span
              key={sectionLabel}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="text-[9px] sm:text-[10px] font-mono text-zinc-600 tracking-widest uppercase px-1.5 py-0.5 bg-white/[0.04] border border-white/[0.06] rounded"
            >
              {sectionLabel}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Counter with flash on change */}
        <motion.div
          animate={counterFlash ? { scale: [1, 1.25, 1], color: ["#71717a", "#ffffff", "#71717a"] } : {}}
          transition={{ duration: 0.4 }}
          className="text-[10px] sm:text-xs font-mono text-zinc-600"
        >
          {String(currentQ + 1).padStart(2, "0")}&nbsp;/&nbsp;{questions.length}
        </motion.div>
      </motion.div>

      {/* ── Trajectory progress ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="relative z-10 px-4 sm:px-6 pb-4 sm:pb-6"
      >
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-1 sm:gap-1.5">
            {questions.map((_, i) => (
              <motion.div
                key={i}
                initial={false}
                animate={{
                  width: i === currentQ ? 22 : i < currentQ ? 8 : 6,
                  height: i === currentQ ? 6 : 4,
                  opacity: i < currentQ ? 1 : i === currentQ ? 1 : 0.22,
                  boxShadow:
                    i === currentQ
                      ? "0 0 8px 2px rgba(255,255,255,0.35)"
                      : "none",
                }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className={`rounded-full ${i <= currentQ ? "bg-white" : "bg-zinc-700"}`}
              />
            ))}
          </div>
            <div className="flex items-center justify-between mt-1.5">
            <div className="text-[9px] sm:text-[10px] font-mono text-zinc-700 tracking-widest uppercase">
              {isFinalQ ? "Final Transmission" : `Waypoint ${String(currentQ + 1).padStart(2, "0")}`} — {sectionLabel}
            </div>
            <div className="text-[9px] sm:text-[10px] font-mono text-zinc-700">
              {Math.round(((currentQ + 1) / questions.length) * 100)}%
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Question area ── */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-2 pb-8">
        <div className="max-w-3xl w-full">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentQ}
              initial={{ opacity: 0, x: direction * 52, filter: "blur(8px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: direction * -52, filter: "blur(8px)" }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              {/* Scan beam on entry */}
              <ScanLine questionId={currentQ} />

              {/* Transmission label */}
              <div className="flex items-center gap-3 mb-4 sm:mb-5">
                <motion.span
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 }}
                  className={`text-[9px] sm:text-[10px] font-mono tracking-widest uppercase whitespace-nowrap ${
                    isFinalQ ? "text-zinc-400" : "text-zinc-600"
                  }`}
                >
                  {isFinalQ ? "⬛ Final Transmission" : `Transmission ${String(currentQ + 1).padStart(2, "0")}`}
                </motion.span>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  style={{ transformOrigin: "left" }}
                  className="flex-1 h-px bg-gradient-to-r from-zinc-700 to-transparent"
                />
              </div>

              {/* Question text — word-by-word reveal */}
              <QuestionText
                text={question.question}
                questionId={currentQ}
                isFinal={isFinalQ}
              />

              {/* Radio options */}
              {question.type === "radio" && (
                <div className="space-y-2 sm:space-y-2.5">
                  {question.options.map((option, optIdx) => (
                    <RadioOption
                      key={option}
                      option={option}
                      optIdx={optIdx}
                      isSelected={selectedAnswer === option}
                      isAnySelected={isAnySelected}
                      questionId={currentQ}
                      onClick={() => handleSelect(option)}
                    />
                  ))}
                </div>
              )}

              {/* Textarea */}
              {question.type === "textarea" && (
                <div>
                  <p className="text-[10px] sm:text-xs font-mono text-zinc-600 tracking-widest uppercase mb-4">
                    → Enter your response below
                  </p>
                  <textarea
                    value={answers[question.id] || ""}
                    onChange={(e) => handleSelect(e.target.value)}
                    placeholder={question.placeholder || "Your response..."}
                    className="w-full min-h-[180px] sm:min-h-[200px] bg-zinc-900/50 border border-zinc-800 text-white text-base rounded-xl p-4 sm:p-5 resize-none focus:border-zinc-700 focus:outline-none placeholder:text-zinc-700 transition-colors backdrop-blur-sm font-light leading-relaxed"
                    autoFocus
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* ── Navigation ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-between mt-6 sm:mt-8"
          >
            <button
              onClick={handleBack}
              disabled={currentQ === 0}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                currentQ === 0
                  ? "opacity-20 cursor-not-allowed border-zinc-800 text-zinc-500"
                  : "border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white cursor-pointer"
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            {/* Show manual Next only for textarea questions */}
            {question.type === "textarea" && (
              <motion.button
                onClick={handleNext}
                disabled={!canProceed}
                whileHover={canProceed ? { scale: 1.03 } : undefined}
                whileTap={canProceed ? { scale: 0.97 } : undefined}
                animate={
                  canProceed
                    ? {
                        boxShadow: [
                          "0 0 16px rgba(255,255,255,0.06)",
                          "0 0 32px rgba(255,255,255,0.15)",
                          "0 0 16px rgba(255,255,255,0.06)",
                        ],
                      }
                    : {}
                }
                transition={{ duration: 2.4, repeat: Infinity }}
                className={`flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-semibold text-sm sm:text-base transition-all ${
                  canProceed
                    ? "bg-white text-black hover:bg-zinc-100 cursor-pointer"
                    : "bg-white/15 text-white/30 cursor-not-allowed"
                }`}
              >
                Continue
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </motion.button>
            )}

            {/* For radio non-last: show a subtle "auto-advancing" indicator */}
            {question.type === "radio" && !isLast && isAnySelected && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-[10px] sm:text-xs font-mono text-zinc-500"
              >
                <motion.div
                  animate={{ scaleX: [0, 1] }}
                  transition={{ duration: 0.46, ease: "linear" }}
                  style={{ transformOrigin: "left" }}
                  className="w-10 sm:w-14 h-px bg-gradient-to-r from-white/40 to-transparent"
                />
                continuing
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Entrance flash — continues the warp transition seamlessly */}
      {arrivedFromLaunch && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="fixed inset-0 bg-white pointer-events-none z-[9998]"
        />
      )}
    </div>
  );
}
