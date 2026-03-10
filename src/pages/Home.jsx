import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform, useSpring, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import {
  ArrowRight,
  Users,
  Award,
  Compass,
  Rocket,
  ShieldCheck,
  Target,
  CheckCircle,
  TrendingUp,
  Star,
  BarChart3,
  ChevronRight,
  Quote,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Logo from "../components/Logo";
import { SpaceBackground, OrbitingElements, ShootingStars, GradientOrbs } from "../components/SpaceBackground";

const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const childFade = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

// ─── Mission Progress sidebar ─────────────────────────────────────────────
// Thin vertical tracker on the right side — shows how far into the mission you are
function MissionProgress() {
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, { stiffness: 80, damping: 25, restDelta: 0.001 });
  const dotY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const phases = [
    { label: "LAUNCH", offset: "0%" },
    { label: "SITUATION", offset: "20%" },
    { label: "REPORTS", offset: "42%" },
    { label: "SKILLS", offset: "58%" },
    { label: "SEQUENCE", offset: "74%" },
    { label: "PARAMS", offset: "87%" },
    { label: "ORBIT", offset: "100%" },
  ];

  return (
    <div className="fixed right-5 top-1/2 -translate-y-1/2 z-30 hidden xl:flex flex-col items-center pointer-events-none select-none">
      {/* Track + fill */}
      <div className="relative h-52 w-px">
        <div className="absolute inset-0 bg-zinc-800" />
        <motion.div
          className="absolute top-0 left-0 w-full bg-gradient-to-b from-white/60 to-white/20 origin-top"
          style={{ scaleY, height: "100%" }}
        />
        {/* Phase dots */}
        {phases.map((p, i) => (
          <div
            key={i}
            className="absolute left-1/2 -translate-x-1/2"
            style={{ top: p.offset, marginTop: "-3px" }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
          </div>
        ))}
        {/* Moving rocket dot */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2"
          style={{ top: dotY, marginTop: "-4px" }}
        >
          <motion.div
            className="w-2 h-2 rounded-full bg-white"
            animate={{ opacity: [0.5, 1, 0.5], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            style={{ boxShadow: "0 0 8px 2px rgba(255,255,255,0.6)" }}
          />
        </motion.div>
      </div>
      {/* Label */}
      <div className="mt-3 text-[8px] font-mono text-zinc-700 tracking-[0.3em] uppercase">
        MISSION
      </div>
    </div>
  );
}

// ─── Section label — mission briefing chapter marker ──────────────────────
function SectionLabel({ phase, label }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center gap-3 mb-5 sm:mb-6 justify-center"
    >
      <motion.div
        className="h-px bg-zinc-700"
        initial={{ width: 0 }}
        whileInView={{ width: 24 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.1 }}
      />
      <span className="text-[10px] font-mono text-zinc-600 tracking-[0.28em] uppercase whitespace-nowrap">
        {phase} · {label}
      </span>
      <motion.div
        className="h-px bg-zinc-700"
        initial={{ width: 0 }}
        whileInView={{ width: 24 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.1 }}
      />
    </motion.div>
  );
}

// ─── Orbit ring — decorative rotating ring with glowing dot ──────────────
function OrbitRing({ size, duration = 20, delay = 0, dotSize = 3, opacity = 0.12, reverse = false }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none border border-white/10"
      style={{
        width: size,
        height: size,
        top: "50%",
        left: "50%",
        x: "-50%",
        y: "-50%",
        opacity,
      }}
      animate={{ rotate: reverse ? -360 : 360 }}
      transition={{ duration, repeat: Infinity, ease: "linear", delay }}
    >
      <motion.div
        className="absolute rounded-full bg-white"
        style={{
          width: dotSize,
          height: dotSize,
          top: 0,
          left: "50%",
          x: "-50%",
          y: "-50%",
        }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2.5, repeat: Infinity, delay }}
      />
    </motion.div>
  );
}

// ─── Scan line — a horizontal light sweep that plays on section entry ─────
function ScanLine() {
  return (
    <motion.div
      className="absolute left-0 right-0 h-px pointer-events-none z-10"
      style={{
        background: "linear-gradient(to right, transparent, rgba(255,255,255,0.15), transparent)",
      }}
      initial={{ top: "0%", opacity: 0 }}
      whileInView={{ top: ["0%", "100%"], opacity: [0, 0.8, 0] }}
      viewport={{ once: true }}
      transition={{ duration: 1.4, ease: "easeInOut", delay: 0.2 }}
    />
  );
}

// Success Story Card
function SuccessStory({ quote, name, role, achievement, image }) {
  return (
    <motion.div
      variants={childFade}
      whileHover={{ y: -8, boxShadow: "0 20px 60px rgba(255,255,255,0.1)" }}
      className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800/50 border border-zinc-700/50 rounded-2xl p-8 relative overflow-hidden group"
    >
      {/* Transmission header */}
      <div className="absolute top-3 left-4 flex items-center gap-1.5 opacity-30 group-hover:opacity-60 transition-opacity">
        <motion.div
          className="w-1 h-1 rounded-full bg-white"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        />
        <span className="text-[8px] font-mono text-zinc-500 tracking-widest">TRANSMISSION</span>
      </div>
      <div className="absolute top-16 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Quote className="w-16 h-16 text-white" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <img 
            src={image}
            alt={name}
            className="w-12 h-12 rounded-full object-cover border-2 border-zinc-700"
          />
          <div>
            <div className="font-semibold text-white">{name}</div>
            <div className="text-sm text-zinc-400">{role}</div>
          </div>
        </div>

        <p className="text-zinc-300 mb-4 leading-relaxed italic">"{quote}"</p>

        <div className="flex items-center gap-4 pt-4 border-t border-zinc-800">
          <div className="text-sm text-zinc-400 px-3 py-1 bg-zinc-800 rounded-full">
            {achievement}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Old Way Card - Painful & FOMO-inducing
function OldWayCard() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      variants={childFade}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.3 }}
      className="relative bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-zinc-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 overflow-hidden"
    >
      {/* Subtle darkening overlay on hover */}
      <motion.div
        animate={{ opacity: isHovered ? 0.2 : 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 bg-black pointer-events-none z-0"
      />

      <div className="relative z-10">
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 px-2.5 sm:px-3 py-0.5 sm:py-1 bg-zinc-800 border border-zinc-700 rounded-full text-[10px] sm:text-xs text-zinc-400 font-semibold">
          Without guidance
        </div>

        <div className="mb-5 sm:mb-6">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-3 sm:mb-4">
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-400" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">Figuring It Out Alone</h3>
          <p className="text-xs sm:text-sm text-zinc-500">What most new managers experience</p>
        </div>

        <ul className="space-y-2 sm:space-y-3 mb-5 sm:mb-6">
          {[
            "Still doing IC work while managing people",
            "Unsure why the team isn't performing",
            "Avoiding conversations you know you should have",
            "Feeling like you don't belong in leadership meetings",
            "Watching others advance while you stay stuck",
          ].map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-zinc-400"
            >
              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-zinc-600 rounded-full" />
              </div>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        {/* Stats */}
        <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-zinc-800 space-y-2 sm:space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs text-zinc-500">Time to feel confident</span>
            <div className="text-xl sm:text-2xl font-bold tabular-nums text-zinc-500">
              3+ years
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs text-zinc-500">Team turnover</span>
            <div className="text-xl sm:text-2xl font-bold tabular-nums text-zinc-500">
              High
            </div>
          </div>
          <div className="pt-3 border-t border-zinc-800">
            <div className="text-zinc-600 text-xs mb-1">Path forward</div>
            <div className="text-3xl font-bold text-zinc-500">Unclear</div>
            <p className="text-xs text-zinc-600 mt-2">
              Most managers stay at this level for years
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// New Way Card - Attractive & Urgency-driven
function NewWayCard() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      variants={childFade}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ duration: 0.3 }}
      animate={{
        boxShadow: isHovered
          ? "0 30px 80px rgba(255,255,255,0.12)"
          : "0 20px 60px rgba(255,255,255,0.05)",
      }}
      className="relative bg-gradient-to-br from-white/5 to-zinc-900 border-2 border-white/20 rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 overflow-hidden"
    >
      {/* Animated glow on hover */}
      <motion.div
        animate={{
          opacity: isHovered ? 0.15 : 0,
          scale: isHovered ? 1 : 0.8,
        }}
        transition={{ duration: 0.4 }}
        className="absolute inset-0 bg-white rounded-2xl sm:rounded-3xl blur-3xl pointer-events-none"
      />

      <div className="relative z-10">
        <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
          <div className="px-2.5 sm:px-3 py-0.5 sm:py-1 bg-white/10 border border-white/20 rounded-full text-[10px] sm:text-xs text-white font-semibold flex items-center gap-1">
            <Rocket className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            With Careera
          </div>
        </div>

        <div className="mb-5 sm:mb-6">
          <motion.div
            animate={{ 
              scale: isHovered ? [1, 1.1, 1] : 1,
            }}
            transition={{ duration: 0.5 }}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/10 border border-white/20 flex items-center justify-center mb-3 sm:mb-4"
          >
            <Rocket className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </motion.div>
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-1.5 sm:mb-2">Leading with Clarity</h3>
          <p className="text-xs sm:text-sm text-zinc-400">Structured mentorship for managers</p>
        </div>

        <ul className="space-y-2 sm:space-y-3 mb-5 sm:mb-6">
          {[
            "5-min diagnostic to map your current state",
            "Personalized roadmap based on your real challenges",
            "1-on-1 mentorship with experienced leaders",
            "Build delegation, feedback, and strategic skills",
            "Practical frameworks you apply the same week",
          ].map((item, i) => (
            <motion.li
              key={i}
              animate={{
                x: isHovered ? 3 : 0,
              }}
              transition={{ delay: i * 0.03, duration: 0.3 }}
              className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-zinc-200"
            >
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white shrink-0 mt-0.5" />
              <span className="font-medium">{item}</span>
            </motion.li>
          ))}
        </ul>

        <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-white/10 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs text-zinc-400">Format</span>
            <div className="text-sm sm:text-base font-semibold text-white">
              Weekly 1-on-1 calls
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs text-zinc-400">Duration</span>
            <div className="text-sm sm:text-base font-semibold text-white">
              8–12 weeks
            </div>
          </div>
          <div className="pt-2 sm:pt-3">
            <div className="text-zinc-400 text-[10px] sm:text-xs mb-1">First step</div>
            <div className="text-xl sm:text-2xl font-bold text-white">Free assessment</div>
            <p className="text-[10px] sm:text-xs text-zinc-400 mt-1.5 sm:mt-2">
              Understand where you are before you commit to anything
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Hyperspace warp transition ───────────────────────────────────────────
const WARP_STREAKS = Array.from({ length: 84 }, (_, i) => ({
  id: i,
  // evenly spread 360° with tiny random jitter for realism
  angle: (i / 84) * 360 + (Math.random() * 3 - 1.5),
  length: 70 + Math.random() * 380,
  delay: Math.random() * 0.18,
  opacity: 0.45 + Math.random() * 0.55,
}));

function SpaceWarpTransition({ onComplete }) {
  useEffect(() => {
    const t = setTimeout(onComplete, 2000);
    return () => clearTimeout(t);
  }, [onComplete]);

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.12 }}
      className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex items-center justify-center overflow-hidden"
    >
      {/* Warp streaks radiating from center */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {WARP_STREAKS.map((s) => (
          <div key={s.id} style={{ position: "absolute", width: 0, height: 0 }}>
            <motion.div
              style={{
                position: "absolute",
                left: 0,
                top: "-0.5px",
                width: `${s.length}px`,
                height: "1px",
                transformOrigin: "left center",
                rotate: s.angle,
                background: `linear-gradient(to right, rgba(255,255,255,0.04), rgba(255,255,255,${s.opacity}))`,
              }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: [0, 0, 1, 1], opacity: [0, 0, s.opacity, 0] }}
              transition={{
                duration: 1.3,
                delay: 0.22 + s.delay,
                times: [0, 0.08, 0.55, 1],
                ease: [0.08, 0.5, 0.92, 1],
              }}
            />
          </div>
        ))}
      </div>

      {/* Expanding central glow */}
      <motion.div
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: [0.3, 0.6, 18], opacity: [0, 0.55, 0] }}
        transition={{ duration: 1.7, delay: 0.18, ease: "easeIn" }}
        className="absolute w-28 h-28 rounded-full bg-white blur-3xl pointer-events-none"
      />

      {/* Bright core pulse */}
      <motion.div
        animate={{ scale: [0, 1.5, 0.8, 0], opacity: [0, 1, 0.7, 0] }}
        transition={{ duration: 0.9, delay: 0.22 }}
        className="absolute w-4 h-4 rounded-full bg-white pointer-events-none"
        style={{ boxShadow: "0 0 40px 12px rgba(255,255,255,0.6)" }}
      />

      {/* Mission status text */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: [0, 1, 1, 0], y: [8, 0, 0, -6] }}
        transition={{ duration: 1.7, times: [0, 0.12, 0.72, 1] }}
        className="relative z-10 text-center select-none pointer-events-none"
      >
        <div className="text-[9px] sm:text-[10px] font-mono text-zinc-500 tracking-[0.35em] uppercase mb-2">
          Mission Control
        </div>
        <div className="text-white text-xl sm:text-2xl font-bold tracking-tight">
          Initiating Launch
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1 h-1 rounded-full bg-white"
              animate={{ opacity: [0.15, 1, 0.15] }}
              transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.13 }}
            />
          ))}
        </div>
      </motion.div>

      {/* Final white flash — triggers just before navigate */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 0, 1] }}
        transition={{ duration: 2.0, times: [0, 0.58, 0.78, 1] }}
        className="absolute inset-0 bg-white pointer-events-none"
      />
    </motion.div>,
    document.body
  );
}

// Hero Mission Card — replaces the inline questionnaire widget
const CARD_STARS = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  top: Math.random() * 100,
  size: Math.random() > 0.65 ? 2 : 1,
  duration: 1.8 + Math.random() * 3,
  delay: Math.random() * 5,
}));

function HeroMissionCard({ onLaunch }) {
  const phases = [
    { num: "01", label: "Answer 12 diagnostic questions", sub: "~5 min" },
    { num: "02", label: "Receive your personalized roadmap", sub: "Instant" },
    { num: "03", label: "Book your 1-on-1 intro call", sub: "Next step" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="relative"
    >
      <motion.div
        animate={{
          boxShadow: [
            "0 0 60px rgba(255,255,255,0.03)",
            "0 0 100px rgba(255,255,255,0.08)",
            "0 0 60px rgba(255,255,255,0.03)",
          ],
        }}
        transition={{ duration: 3.5, repeat: Infinity }}
        className="relative rounded-2xl sm:rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-[#0f0f12] to-black overflow-hidden"
      >
        {/* Ambient stars inside card */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {CARD_STARS.map((s) => (
            <motion.div
              key={s.id}
              className="absolute rounded-full bg-white"
              style={{
                left: `${s.left}%`,
                top: `${s.top}%`,
                width: `${s.size}px`,
                height: `${s.size}px`,
              }}
              animate={{ opacity: [0, 0.6, 0] }}
              transition={{ duration: s.duration, repeat: Infinity, delay: s.delay }}
            />
          ))}
          {/* Soft nebula glows */}
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/[0.025] rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-white/[0.015] rounded-full blur-3xl" />
        </div>

        {/* Header */}
        <div className="relative px-5 sm:px-6 lg:px-7 pt-5 sm:pt-6 pb-4 flex items-center justify-between border-b border-zinc-800/60">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-white"
            />
            <span className="text-[10px] sm:text-xs font-mono text-zinc-500 tracking-widest uppercase">
              Mission Control
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 bg-white/[0.07] border border-white/10 rounded-full text-[10px] sm:text-xs text-zinc-400 font-mono">
              5 MIN
            </span>
            <span className="px-2 py-0.5 bg-white/[0.05] border border-white/[0.08] rounded-full text-[10px] text-zinc-600 font-mono">
              FREE
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="relative p-5 sm:p-6 lg:p-7">
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2 leading-tight">
            Begin Your Leadership<br />Assessment
          </h3>
          <p className="text-sm text-zinc-500 mb-5 sm:mb-6">
            Map your trajectory from manager to respected leader.
          </p>

          {/* Mission phases */}
          <div className="space-y-2 sm:space-y-2.5 mb-5 sm:mb-6">
            {phases.map((phase, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
                className="flex items-center gap-3"
              >
                <div className="w-7 h-7 rounded-lg bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center shrink-0">
                  <span className="text-[9px] font-mono text-zinc-500">{phase.num}</span>
                </div>
                <span className="flex-1 text-sm text-zinc-300">{phase.label}</span>
                <span className="text-[10px] font-mono text-zinc-600 shrink-0">{phase.sub}</span>
              </motion.div>
            ))}
          </div>

          {/* CTA button */}
          <motion.button
            onClick={onLaunch}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            animate={{
              boxShadow: [
                "0 8px 32px rgba(255,255,255,0.06)",
                "0 8px 52px rgba(255,255,255,0.16)",
                "0 8px 32px rgba(255,255,255,0.06)",
              ],
            }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="w-full flex items-center justify-center gap-2 bg-white text-black px-6 py-3.5 sm:py-4 rounded-full font-semibold text-sm sm:text-base hover:bg-zinc-100 transition-colors cursor-pointer mb-3"
          >
            <Rocket className="w-4 h-4" />
            Launch Your Assessment
            <ArrowRight className="w-4 h-4" />
          </motion.button>

          {/* Trust signals */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-zinc-600">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-zinc-600" />
              No credit card
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-zinc-600" />
              Instant results
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-zinc-600" />
              Free assessment
            </div>
          </div>
        </div>

        <div className="relative px-5 sm:px-6 lg:px-7 py-3 sm:py-3.5 border-t border-zinc-800/60 bg-zinc-900/30">
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-xs text-zinc-500">
              Takes 5 minutes · No account needed · Results are private
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Timeline Item — rewritten with draw-in connector + mission step badge
function TimelineItem({ week, title, description, isActive, index = 0, details = [] }) {
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -24 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="flex gap-5 group relative cursor-pointer"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => setIsHovered(v => !v)}
    >
      {/* Hover glow */}
      <motion.div
        animate={{ opacity: isHovered ? 0.12 : 0, scale: isHovered ? 1.4 : 0.9 }}
        transition={{ duration: 0.35 }}
        className="absolute inset-0 bg-white rounded-2xl blur-2xl pointer-events-none -z-10"
      />

      {/* Left: step indicator + connector */}
      <div className="flex flex-col items-center flex-shrink-0">
        <motion.div
          whileHover={{ scale: 1.15 }}
          animate={{
            boxShadow: isActive
              ? ["0 0 20px rgba(255,255,255,0.25)", "0 0 40px rgba(255,255,255,0.5)", "0 0 20px rgba(255,255,255,0.25)"]
              : isHovered
              ? "0 0 20px rgba(255,255,255,0.2)"
              : "none",
          }}
          transition={isActive ? { duration: 2.5, repeat: Infinity } : { duration: 0.4 }}
          className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold text-sm relative overflow-hidden ${
            isActive
              ? "bg-white border-white text-black"
              : "bg-zinc-900 border-zinc-700 text-zinc-400 group-hover:border-zinc-500 group-hover:text-zinc-200"
          }`}
        >
          <motion.div
            animate={{ scale: isHovered ? 2.5 : 0, opacity: isHovered ? 0.08 : 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 bg-white rounded-full"
          />
          <span className="relative z-10 font-mono text-xs">{week}</span>
        </motion.div>

        {/* Connector line — draws itself */}
        {week !== "3+" && (
          <div className="relative w-0.5 flex-1 min-h-[56px]">
            <div className="absolute inset-0 bg-zinc-800" />
            <motion.div
              className="absolute top-0 left-0 w-full origin-top"
              style={{
                background: isActive
                  ? "linear-gradient(to bottom, rgba(255,255,255,0.5), rgba(255,255,255,0.1))"
                  : "linear-gradient(to bottom, rgba(113,113,122,0.6), transparent)",
              }}
              initial={{ scaleY: 0 }}
              animate={isInView ? { scaleY: 1 } : {}}
              transition={{ duration: 0.8, delay: index * 0.15 + 0.3, ease: "easeOut" }}
            />
            {/* Traveling dot along the line */}
            {isActive && (
              <motion.div
                className="absolute left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white"
                animate={{ top: ["0%", "100%"], opacity: [0, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              />
            )}
          </div>
        )}
      </div>

      {/* Right: content */}
      <motion.div
        className="flex-1 pb-10 relative"
        animate={{ x: isHovered ? 6 : 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Top accent line on hover */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isHovered ? 1 : 0 }}
          transition={{ duration: 0.35 }}
          className="absolute left-0 top-0 h-px bg-gradient-to-r from-white/40 to-transparent origin-left w-full"
        />

        <div className="flex items-baseline gap-3 mb-2">
          <motion.h4
            animate={{ color: isHovered ? "#ffffff" : "#f4f4f5" }}
            className="text-lg font-semibold"
          >
            {title}
          </motion.h4>
          {isActive && (
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-[9px] font-mono text-zinc-600 tracking-widest"
            >
              ◈ NOW
            </motion.span>
          )}
        </div>

        <p className="text-sm text-zinc-400 mb-2">{description}</p>

        <AnimatePresence>
          {isHovered && details.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-3 border-t border-zinc-800/60 space-y-1.5">
                {details.map((d, di) => (
                  <motion.p
                    key={di}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: di * 0.06 }}
                    className="text-xs text-zinc-600 flex items-center gap-2"
                  >
                    <span className="text-zinc-700">→</span> {d}
                  </motion.p>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleLaunch = useCallback(() => {
    setIsTransitioning(true);
  }, []);

  const handleTransitionComplete = useCallback(() => {
    navigate("/Questionnaire", { state: { fromLaunch: true } });
  }, [navigate]);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  const successStories = [
    {
      quote: "Building a startup while learning to lead was overwhelming. The structured approach helped me transition from doing everything myself to building and leading a team.",
      name: "Margaryta Sivakova",
      role: "Founder at LegalNodes",
      achievement: "Built Leadership Team",
      beforeSalary: "",
      afterSalary: "",
      image: "/src/assets/testimonial1.webp",
      timeAgo: "Recently",
    },
    {
      quote: "Scaling a sales team is different from selling. The mentorship helped me develop the leadership skills to build high-performing teams and drive real results.",
      name: "Valerie Teverovska",
      role: "Head of Sales Development at Basis Theory",
      achievement: "Scaled Team",
      beforeSalary: "",
      afterSalary: "",
      image: "/src/assets/testimonial2.jpeg",
      timeAgo: "Recently",
    },
    {
      quote: "Moving from IC to leading growth required a complete mindset shift. The career boost plan gave me clarity on how to lead strategically, not just execute.",
      name: "Ilya Azovtsev",
      role: "Head of Growth at Growth Band",
      achievement: "Leadership Transition",
      beforeSalary: "",
      afterSalary: "",
      image: "/src/assets/testimonial3.jpeg",
      timeAgo: "Recently",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden">
      {/* Warp transition portal — rendered at document.body to avoid stacking context */}
      {isTransitioning && (
        <SpaceWarpTransition onComplete={handleTransitionComplete} />
      )}

      {/* Space Background */}
      <SpaceBackground />
      <OrbitingElements />
      <ShootingStars />
      <GradientOrbs />

      {/* Subtle HUD grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Mission progress sidebar */}
      <MissionProgress />

      <Navbar onLaunch={handleLaunch} />

      {/* Hero Section - Mobile Optimized */}
      <motion.section
        ref={heroRef}
        style={{ opacity, scale }}
        className="pt-20 sm:pt-28 lg:pt-32 pb-12 sm:pb-16 lg:pb-20 px-4 sm:px-6 relative"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Column */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="text-center lg:text-left"
            >
              <motion.div
                variants={childFade}
                className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-3 mb-6 sm:mb-8"
              >
                <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 sm:px-4 py-1.5 sm:py-2">
                  <span className="text-xs sm:text-sm text-zinc-400">
                    Leadership development for managers who want more
                  </span>
                </div>
              </motion.div>

              <motion.h1
                variants={childFade}
                className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.1] mb-4 sm:mb-6"
              >
                <motion.span
                  className="block bg-gradient-to-r from-white via-white to-zinc-400 bg-clip-text text-transparent"
                  style={{ y: useTransform(scrollYProgress, [0, 1], [0, -18]) }}
                >
                  From Manager to
                </motion.span>
                <motion.span
                  className="block text-white"
                  style={{ y: useTransform(scrollYProgress, [0, 1], [0, -30]) }}
                >
                  Respected Leader
                </motion.span>
              </motion.h1>

              <motion.p
                variants={childFade}
                className="text-base sm:text-lg lg:text-xl text-zinc-400 max-w-xl mx-auto lg:mx-0 leading-relaxed mb-6 sm:mb-8 px-2 sm:px-0"
              >
                Most managers were promoted for technical skills, then left to figure out leadership alone. Take a 5-minute diagnostic to understand where you are — and get a <span className="text-white font-semibold">clear path forward</span>.
              </motion.p>

              <motion.div
                variants={childFade}
                className="flex flex-wrap gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8 justify-center lg:justify-start"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  <span className="text-zinc-300 text-xs sm:text-sm">Personalized leadership roadmap</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  <span className="text-zinc-300 text-xs sm:text-sm">1-on-1 mentorship with senior leaders</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Column - Mission Launch Card with orbit rings */}
            <div className="lg:sticky lg:top-24 mt-8 lg:mt-0">
              <div className="relative">
                {/* Orbital rings behind the card */}
                <OrbitRing size={520} duration={55} opacity={0.07} />
                <OrbitRing size={380} duration={35} delay={1.5} reverse opacity={0.1} dotSize={4} />
                <OrbitRing size={260} duration={22} delay={0.8} opacity={0.08} dotSize={2} />
                <HeroMissionCard onLaunch={handleLaunch} />
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Stats Banner */}
      <section className="py-8 sm:py-10 lg:py-12 px-4 sm:px-6 border-y border-zinc-800/50 bg-gradient-to-r from-zinc-900/50 to-transparent backdrop-blur-sm relative overflow-hidden">
        <ScanLine />
        <motion.div
          className="max-w-7xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
        >
          <div className="grid grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {[
              { value: "5 min", label: "Assessment length" },
              { value: "12", label: "Diagnostic questions" },
              { value: "1-on-1", label: "Mentorship calls" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                variants={childFade}
                className="text-center group"
              >
                <motion.div
                  className="text-2xl sm:text-3xl lg:text-4xl font-bold font-mono bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent mb-1 sm:mb-2"
                  initial={{ filter: "blur(8px)", opacity: 0 }}
                  whileInView={{ filter: "blur(0px)", opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: 0.1 * stat.label.length % 3 }}
                >
                  {stat.value}
                </motion.div>
                <div className="text-[10px] sm:text-xs text-zinc-600 leading-tight font-mono tracking-wider uppercase">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* The Problem (Visual Comparison) */}
      <section className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 relative overflow-hidden">
        <ScanLine />
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-12 sm:mb-16 lg:mb-20"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <SectionLabel phase="PHASE 01" label="SITUATION ANALYSIS" />
            <div className="inline-block mb-4 sm:mb-6">
              <div className="px-4 sm:px-5 py-1.5 sm:py-2 bg-white/5 border border-white/10 rounded-full text-xs sm:text-sm text-zinc-400">
                The difference between managing and leading
              </div>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 px-2">
              Managing Tasks vs.{" "}
              <span className="italic">
                Leading People
              </span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-zinc-400 max-w-3xl mx-auto px-4 sm:px-6">
              You were promoted because you're good at your job. But leading a team requires a completely different skill set — one nobody taught you.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {/* Without Careera - PAINFUL */}
            <OldWayCard />

            {/* With Careera - ATTRACTIVE */}
            <NewWayCard />
          </motion.div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 bg-gradient-to-b from-transparent via-zinc-900/30 to-transparent relative overflow-hidden">
        <ScanLine />
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-10 sm:mb-14 lg:mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <SectionLabel phase="PHASE 02" label="FIELD REPORTS" />
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/5 border border-white/10 rounded-full mb-4 sm:mb-6">
              <Star className="w-3 h-3 sm:w-4 sm:h-4 text-white fill-white" />
              <span className="text-xs sm:text-sm text-zinc-400">From people who've been through it</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 px-2">
              What Our Members Say
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-zinc-400 px-4">
              Real feedback from managers who used our assessment and mentorship to level up.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            {successStories.map((story, i) => (
              <SuccessStory key={i} {...story} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Results / Skills */}
      <section className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 relative overflow-hidden">
        <ScanLine />
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-12 sm:mb-16 lg:mb-20"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <SectionLabel phase="PHASE 03" label="MISSION OBJECTIVES" />
            <div className="inline-block mb-4 sm:mb-6 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/5 border border-white/10 rounded-full text-xs sm:text-sm">
              <span className="text-zinc-400">What you'll work on</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 px-2">
              Skills That Change How You Lead
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-zinc-400 px-4">
              The assessment identifies your gaps. The mentorship helps you close them.
            </p>
          </motion.div>

          {/* Key Transformation Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-12 sm:mb-16 lg:mb-20">
            {[
              {
                icon: Users,
                value: "Delegation",
                label: "Stop Doing, Start Leading",
                detail: "Learn to trust your team with real ownership",
              },
              {
                icon: TrendingUp,
                value: "Strategy",
                label: "Think Beyond Your Team",
                detail: "Connect your work to company-level goals",
              },
              {
                icon: Award,
                value: "Influence",
                label: "Earn Executive Respect",
                detail: "Communicate with clarity and confidence",
              },
            ].map((metric, i) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-xl sm:rounded-2xl p-6 sm:p-8 hover:border-zinc-700 transition-all relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative z-10">
                  <div className="relative inline-flex items-center justify-center mb-4 sm:mb-6">
                    <OrbitRing size={72} duration={12} delay={0} dotSize={3} opacity={0.3} />
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="relative z-10 inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-white/10 border border-white/20 rounded-lg sm:rounded-xl"
                    >
                      <metric.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </motion.div>
                  </div>

                  <div className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3 bg-gradient-to-b from-white to-zinc-300 bg-clip-text text-transparent">
                    {metric.value}
                  </div>
                  <div className="text-white font-semibold text-base sm:text-lg mb-1 sm:mb-2">{metric.label}</div>
                  <div className="text-xs sm:text-sm text-zinc-500">{metric.detail}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* What You'll Achieve */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {[
              {
                icon: Target,
                title: "Master Core Leadership Skills",
                items: ["Delegation & empowerment", "Difficult conversations", "Strategic decision-making", "Executive presence"],
              },
              {
                icon: Compass,
                title: "Build High-Performing Teams",
                items: ["Clear vision & goals", "Strong team culture", "Accountability systems", "Talent development"],
              },
              {
                icon: Rocket,
                title: "Accelerate Your Career",
                items: ["Faster promotions", "Bigger opportunities", "Stronger network", "Leadership credibility"],
              },
              {
                icon: ShieldCheck,
                title: "Lead with Confidence",
                items: ["No more imposter syndrome", "Trust your decisions", "Inspire your team", "Influence executives"],
              },
            ].map((achievement, i) => (
              <motion.div
                key={achievement.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ x: 5 }}
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 sm:p-6 hover:border-zinc-700 transition-all"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                    <achievement.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">{achievement.title}</h3>
                    <ul className="space-y-1.5 sm:space-y-2">
                      {achievement.items.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-zinc-400">
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works — Timeline */}
      <section className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 bg-gradient-to-b from-zinc-900/30 to-transparent relative overflow-hidden">
        <ScanLine />
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-10 sm:mb-14 lg:mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <SectionLabel phase="PHASE 04" label="LAUNCH SEQUENCE" />
            <div className="inline-block mb-4 sm:mb-6 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/5 border border-white/10 rounded-full text-xs sm:text-sm">
              <span className="text-zinc-400">Your </span>
              <span className="text-white font-semibold">3-step process</span>
              <span className="text-zinc-400"> to leadership</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 px-2">
              How It Works
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-zinc-400 px-4">
              Start with a free assessment. If it resonates, we'll build a plan together.
            </p>
          </motion.div>

          <motion.div
            className="relative"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <TimelineItem
              week="1"
              title="Take Assessment"
              description="5-min questionnaire. We analyze your situation and create your career boost plan."
              isActive={true}
              index={0}
              details={[
                "Answer 12 diagnostic questions about your situation",
                "Get a personalized leadership profile across 5 dimensions",
                "Receive your tailored development roadmap instantly",
              ]}
            />
            <TimelineItem
              week="2"
              title="Intro Call"
              description="1-on-1 session to review your plan, map your roadmap, and set clear goals."
              index={1}
              details={[
                "Deep dive into your specific leadership challenges",
                "Define milestones and a realistic development timeline",
                "Establish your regular mentorship cadence",
              ]}
            />
            <TimelineItem
              week="3+"
              title="Regular Mentorship"
              description="Weekly/bi-weekly calls to guide you, build skills, and track progress to your goals."
              index={2}
              details={[
                "Work through real challenges as they arise each week",
                "Build skills through practice, not just theory",
                "Adapt your plan as you grow and progress",
              ]}
            />
          </motion.div>

          <motion.div
            className="mt-8 sm:mt-10 lg:mt-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            <button
              onClick={handleLaunch}
              className="inline-flex items-center gap-2 sm:gap-3 bg-white text-black px-6 sm:px-8 lg:px-10 py-3 sm:py-4 lg:py-5 rounded-full text-sm sm:text-base lg:text-lg font-semibold shadow-2xl shadow-white/10 hover:shadow-white/20 hover:bg-zinc-100 transition-all group active:scale-95 cursor-pointer"
            >
              <span className="hidden sm:inline">Start Your Journey Now</span>
              <span className="sm:hidden">Start Now</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Methodology */}
      <section className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 relative overflow-hidden">
        <ScanLine />
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-10 sm:mb-14 lg:mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <SectionLabel phase="PHASE 05" label="OPERATION PARAMETERS" />
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 px-2">
              How We're Different
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-zinc-400 px-4">
              Not a course. Not a book. A structured process built around your specific situation.
            </p>
          </motion.div>

          <motion.div
            className="space-y-4 sm:space-y-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            {[
              {
                icon: Target,
                num: "01",
                title: "Starts with Diagnosis, Not Advice",
                description:
                  "Our 12-question assessment maps your leadership strengths and blind spots across five dimensions. You get a personalized report — not generic tips from a blog post.",
              },
              {
                icon: Compass,
                num: "02",
                title: "Your Roadmap, Not a Template",
                description:
                  "Based on your assessment results, we build a development plan around your actual challenges — whether that's delegation, difficult conversations, or strategic thinking.",
              },
              {
                icon: Award,
                num: "03",
                title: "Mentors Who've Done the Job",
                description:
                  "Your mentor is a senior leader who has managed teams, navigated politics, and earned promotions — not a career coach reading from a playbook.",
              },
              {
                icon: ShieldCheck,
                num: "04",
                title: "Practice, Not Theory",
                description:
                  "Weekly calls focus on real situations from your week. You bring challenges, we work through them together, and you apply what you learn immediately.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ x: 8 }}
                className="flex items-start gap-3 sm:gap-5 lg:gap-6 bg-gradient-to-br from-zinc-800/50 to-zinc-900/30 border border-zinc-700/50 rounded-2xl p-4 sm:p-6 lg:p-8 hover:border-zinc-600 transition-all group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                {/* Step number in top-right */}
                <div className="absolute top-4 right-5 text-[10px] font-mono text-zinc-700 tracking-widest">
                  {item.num} / 04
                </div>
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="flex-shrink-0 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-zinc-700 to-zinc-800 border border-zinc-600 rounded-xl sm:rounded-2xl shadow-lg relative z-10"
                >
                  <item.icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                </motion.div>
                <div className="relative z-10 flex-1">
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    {item.title}
                    <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                  </h3>
                  <p className="text-zinc-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA — "Ready for Launch" */}
      <section className="py-20 sm:py-28 lg:py-40 px-4 sm:px-6 relative overflow-hidden">
        {/* Deep space radial glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.03] to-transparent pointer-events-none" />

        {/* Expanding orbit rings centered on CTA */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[280, 480, 680, 900].map((size, i) => (
            <motion.div
              key={size}
              className="absolute rounded-full border border-white/[0.04]"
              style={{ width: size, height: size }}
              initial={{ scale: 0.6, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: i * 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Orbiting dot on each ring */}
              <motion.div
                className="absolute rounded-full bg-white/60"
                style={{
                  width: 3,
                  height: 3,
                  top: 0,
                  left: "50%",
                  x: "-50%",
                  y: "-50%",
                }}
                animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                transition={{
                  duration: 18 + i * 8,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            </motion.div>
          ))}
          {/* Central radial pulse */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border border-white/10"
              initial={{ scale: 0.2, opacity: 0.8 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                delay: i * 1.16,
                ease: "easeOut",
              }}
              style={{ width: 120, height: 120 }}
            />
          ))}
        </div>

        <motion.div
          className="max-w-4xl mx-auto text-center relative z-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
        >
          <SectionLabel phase="PHASE 06" label="INITIATE LAUNCH" />

          <motion.h2
            variants={childFade}
            className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 leading-[1.1] px-2"
          >
            Ready to Lead?
            <br />
            <span className="bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              Not Just Manage?
            </span>
          </motion.h2>

          <motion.p
            variants={childFade}
            className="text-base sm:text-lg lg:text-xl text-zinc-400 mb-8 sm:mb-10 lg:mb-12 max-w-2xl mx-auto leading-relaxed px-4"
          >
            The assessment takes 5 minutes. You'll get a leadership diagnostic that shows exactly where you are — and what to work on next. No strings attached.
          </motion.p>

          <motion.div variants={childFade} className="flex flex-col items-center gap-4 sm:gap-6">
            {/* Countdown/ready indicator */}
            <motion.div
              className="flex items-center gap-2 text-[10px] font-mono text-zinc-600 tracking-widest mb-2"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
            >
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-white"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              SYSTEM READY · AWAITING LAUNCH
            </motion.div>

            <motion.button
              onClick={handleLaunch}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                boxShadow: [
                  "0 0 40px rgba(255,255,255,0.08)",
                  "0 0 80px rgba(255,255,255,0.22)",
                  "0 0 40px rgba(255,255,255,0.08)",
                ],
              }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="relative inline-flex items-center gap-2 sm:gap-3 bg-white text-black px-8 sm:px-10 lg:px-12 py-4 sm:py-5 lg:py-6 rounded-full text-base sm:text-lg font-semibold shadow-2xl hover:bg-zinc-100 transition-all group cursor-pointer active:scale-95 overflow-hidden"
            >
              {/* Shimmer sweep on the button */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5, ease: "easeInOut" }}
              />
              <Rocket className="w-4 h-4 sm:w-5 sm:h-5 relative z-10" />
              <span className="relative z-10 hidden sm:inline">Start Leadership Assessment</span>
              <span className="relative z-10 sm:hidden">Start Assessment</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform relative z-10" />
            </motion.button>

            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 lg:gap-6 text-xs sm:text-sm text-zinc-500">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                Free assessment
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                No credit card
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                Instant results
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer - Mobile Optimized */}
      <footer className="border-t border-zinc-800 py-8 sm:py-10 lg:py-12 px-4 sm:px-6 bg-zinc-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="text-center md:text-left">
              <div className="mb-2 sm:mb-3">
                <Logo size="default" className="justify-center md:justify-start" />
              </div>
              <p className="text-xs sm:text-sm text-zinc-500">
                Leadership development for ambitious managers.
              </p>
            </div>
            <div className="flex flex-col items-center md:items-end gap-2">
              <div className="flex items-center gap-4 text-xs sm:text-sm">
                <Link to="/privacy" className="text-zinc-500 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
                <span className="text-zinc-700">|</span>
                <Link to="/terms" className="text-zinc-500 hover:text-white transition-colors">
                  Terms of Use
                </Link>
              </div>
              <div className="text-xs sm:text-sm text-zinc-500">
                &copy; 2026 Careera. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
