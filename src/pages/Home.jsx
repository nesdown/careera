import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import {
  Sparkles,
  ArrowRight,
  Users,
  Award,
  Trophy,
  Compass,
  Map,
  Rocket,
  Clock,
  Calendar,
  DollarSign,
  ShieldCheck,
  Target,
  CheckCircle,
  TrendingUp,
  Zap,
  Star,
  BarChart3,
  LineChart,
  ChevronRight,
  Quote,
} from "lucide-react";
import Navbar from "../components/Navbar";
import QuestionnaireWidget from "../components/QuestionnaireWidget";
import Logo from "../components/Logo";
import LiveActivity from "../components/LiveActivity";
import CostOfWaiting from "../components/CostOfWaiting";
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

// Animated Counter Component
function AnimatedCounter({ end, duration = 2, suffix = "", prefix = "" }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (hasAnimated) return;
    
    const startTime = Date.now();
    const endTime = startTime + duration * 1000;

    const updateCount = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / (duration * 1000), 1);
      const easeOutQuad = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOutQuad * end));

      if (now < endTime) {
        requestAnimationFrame(updateCount);
      } else {
        setCount(end);
        setHasAnimated(true);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          updateCount();
        }
      },
      { threshold: 0.5 }
    );

    const element = document.getElementById(`counter-${end}`);
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, [end, duration, hasAnimated]);

  return (
    <span id={`counter-${end}`}>
      {prefix}
      {count}
      {suffix}
    </span>
  );
}

// Circular Progress Chart
function CircularProgress({ percentage, label, value }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="flex flex-col items-center"
    >
      <div className="relative w-40 h-40">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="currentColor"
            strokeWidth="12"
            fill="none"
            className="text-zinc-800"
          />
          <motion.circle
            cx="80"
            cy="80"
            r={radius}
            stroke="currentColor"
            strokeWidth="12"
            fill="none"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            whileInView={{ strokeDashoffset }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
            className="text-white"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl font-bold text-white">{value}</div>
          <div className="text-xs text-zinc-400 mt-1">{label}</div>
        </div>
      </div>
    </motion.div>
  );
}

// Success Story Card
function SuccessStory({ quote, name, role, achievement, beforeSalary, afterSalary, image, timeAgo }) {
  return (
    <motion.div
      variants={childFade}
      whileHover={{ y: -8, boxShadow: "0 20px 60px rgba(255,255,255,0.1)" }}
      className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800/50 border border-zinc-700/50 rounded-2xl p-8 relative overflow-hidden group"
    >
      <div className="absolute top-3 right-3">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="px-2 py-1 bg-white/10 border border-white/20 rounded-full text-xs text-white font-medium"
        >
          {timeAgo}
        </motion.div>
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
          Old Way
        </div>

        <div className="mb-5 sm:mb-6">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-3 sm:mb-4">
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-400" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">Managing Tasks</h3>
          <p className="text-xs sm:text-sm text-zinc-500">The reality without leadership training...</p>
        </div>

        {/* Pain Points */}
        <ul className="space-y-2 sm:space-y-3 mb-5 sm:mb-6">
          {[
            "Promoted to manager, still doing IC work",
            "Team not performing, don't know why",
            "Avoiding tough conversations",
            "Feel like an imposter in leadership meetings",
            "Others get promoted, you stay stuck",
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
            <motion.p
              animate={{ opacity: isHovered ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              className="text-xs text-zinc-600 mt-2"
            >
              Most never become true leaders
            </motion.p>
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
        {/* Badges */}
        <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="px-2.5 sm:px-3 py-0.5 sm:py-1 bg-white/10 border border-white/20 rounded-full text-[10px] sm:text-xs text-white font-semibold flex items-center gap-1"
          >
            <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            New Way
          </motion.div>
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white text-black rounded-full text-[10px] sm:text-xs font-bold"
          >
            POPULAR
          </motion.div>
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
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-1.5 sm:mb-2">Leading People</h3>
          <p className="text-xs sm:text-sm text-zinc-400">With personalized career boost</p>
        </div>

        {/* Benefits */}
        <ul className="space-y-2 sm:space-y-3 mb-5 sm:mb-6">
          {[
            "5-min assessment → personalized plan",
            "1-on-1 intro call to map your roadmap",
            "Regular mentorship to hit your goals",
            "Learn to lead, not just manage",
            "Director/VP ready in under 3 months",
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

        {/* Live stats and urgency */}
        <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-white/10 space-y-3 sm:space-y-4">
          {/* Member counter */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs text-zinc-400">Leaders in program</span>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white"
              />
              <div className="text-xl sm:text-xl font-bold tabular-nums text-white">
                Growing
              </div>
            </div>
          </div>

          {/* Urgency: spots left */}
          <motion.div
            animate={{
              borderColor: isHovered
                ? ["rgba(255,255,255,0.2)", "rgba(255,255,255,0.4)", "rgba(255,255,255,0.2)"]
                : "rgba(255,255,255,0.2)",
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="p-2.5 sm:p-3 bg-white/5 border-2 rounded-lg sm:rounded-xl"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs text-zinc-400">Next cohort</span>
              <div className="text-base sm:text-lg font-bold text-white">
                Starting Soon
              </div>
            </div>
            <motion.div
              animate={{ opacity: isHovered ? 1 : 0.7 }}
              transition={{ duration: 0.3 }}
              className="text-[10px] sm:text-xs text-zinc-500 mt-1.5 sm:mt-2"
            >
              ⚡ Limited spots available
            </motion.div>
          </motion.div>

          {/* Time to breakthrough */}
          <div className="pt-2 sm:pt-3">
            <div className="text-zinc-400 text-[10px] sm:text-xs mb-1">Time to confident leadership</div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-2xl sm:text-3xl font-bold text-white">&lt;3 months</div>
              <motion.div
                animate={{ scale: isHovered ? [1, 1.1, 1] : 1 }}
                transition={{ duration: 0.8, repeat: isHovered ? Infinity : 0 }}
                className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white/10 rounded-full text-xs sm:text-sm text-white font-semibold"
              >
                Fast-track
              </motion.div>
            </div>
            <motion.p
              animate={{ opacity: isHovered ? 1 : 0 }}
              className="text-[10px] sm:text-xs text-zinc-400 mt-1.5 sm:mt-2"
            >
              Become a respected leader, fast
            </motion.p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Timeline Item
function TimelineItem({ week, title, description, isActive }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      variants={childFade}
      className="flex gap-4 group relative"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Hover glow effect */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: isHovered ? 0.15 : 0,
          scale: isHovered ? 1.5 : 0.8,
        }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 bg-white rounded-2xl blur-2xl pointer-events-none -z-10"
      />

      <div className="flex flex-col items-center">
        <motion.div
          whileHover={{ scale: 1.2 }}
          animate={{
            boxShadow: isHovered
              ? "0 0 30px rgba(255,255,255,0.3)"
              : "0 0 0px rgba(255,255,255,0)",
          }}
          transition={{ duration: 0.5 }}
          className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-all relative overflow-hidden ${
            isActive
              ? "bg-white border-white text-black"
              : "bg-zinc-900 border-zinc-700 text-zinc-400 group-hover:border-white group-hover:text-white"
          }`}
        >
          {/* Animated background on hover */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: isHovered ? 2 : 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 bg-white/10 rounded-full"
          />
          <span className="relative z-10">{week}</span>
        </motion.div>
        {week !== "3+" && (
          <motion.div
            animate={{
              height: isHovered ? "80px" : "64px",
              background: isHovered
                ? "linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)"
                : "linear-gradient(to bottom, rgba(113,113,122,1), transparent)",
            }}
            transition={{ duration: 0.3 }}
            className="w-0.5"
          />
        )}
      </div>
      
      <motion.div
        className="flex-1 pb-8 relative"
        animate={{
          x: isHovered ? 8 : 0,
        }}
        transition={{ duration: 0.3 }}
      >
        {/* Animated border on hover */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isHovered ? 1 : 0 }}
          transition={{ duration: 0.4 }}
          className="absolute left-0 top-0 h-0.5 bg-gradient-to-r from-white to-transparent origin-left"
          style={{ width: "100%" }}
        />

        <motion.h4
          animate={{
            color: isHovered ? "#ffffff" : "#fafafa",
            scale: isHovered ? 1.02 : 1,
          }}
          transition={{ duration: 0.3 }}
          className="text-lg font-semibold mb-2 origin-left"
        >
          {title}
        </motion.h4>
        
        {/* Short description always visible */}
        <motion.p
          className="text-sm text-zinc-400 mb-2"
        >
          {description}
        </motion.p>

        {/* Detailed text appears on hover */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{
            opacity: isHovered ? 1 : 0,
            height: isHovered ? "auto" : 0,
          }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="overflow-hidden"
        >
          <div className="pt-2 border-t border-zinc-800 text-xs text-zinc-500 space-y-1">
            {week === "1" && (
              <>
                <p>• Answer questions about your management situation</p>
                <p>• Get insights into your leadership style</p>
                <p>• Receive your personalized career boost roadmap</p>
              </>
            )}
            {week === "2" && (
              <>
                <p>• Deep dive into your specific challenges</p>
                <p>• Define clear, achievable milestones</p>
                <p>• Establish your regular mentorship schedule</p>
              </>
            )}
            {week === "3+" && (
              <>
                <p>• Work through real challenges as they arise</p>
                <p>• Build leadership skills through practice</p>
                <p>• Get accountability and guidance every step</p>
                <p>• Adapt your plan as you grow and progress</p>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default function Home() {
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
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.03, 0.05, 0.03],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-white to-transparent blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.02, 0.04, 0.02],
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-white to-transparent blur-3xl"
        />
        {/* Floating particles */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Space Background Elements */}
      <SpaceBackground />
      <OrbitingElements />
      <ShootingStars />
      <GradientOrbs />

      <Navbar />
      <LiveActivity />

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
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-white/10 to-transparent border border-white/20 rounded-full px-3 sm:px-4 py-1.5 sm:py-2"
                >
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  <span className="text-xs sm:text-sm bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent font-semibold">
                    Building Tomorrow's Leaders
                  </span>
                </motion.div>
                <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-2.5 sm:px-3 py-1">
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white"
                  />
                  <span className="text-[10px] sm:text-xs text-zinc-400 font-medium">
                    New cohort starting soon
                  </span>
                </div>
              </motion.div>

              <motion.h1
                variants={childFade}
                className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.1] mb-4 sm:mb-6"
              >
                <span className="bg-gradient-to-r from-white via-white to-zinc-400 bg-clip-text text-transparent">
                  You were promoted.
                </span>
                <br />
                <span className="text-white">
                  No one taught you how.
                </span>
              </motion.h1>

              <motion.p
                variants={childFade}
                className="text-base sm:text-lg lg:text-xl text-zinc-400 max-w-xl mx-auto lg:mx-0 leading-relaxed mb-6 sm:mb-8 px-2 sm:px-0"
              >
                Take the 5-minute diagnostic. Get a <span className="text-white font-semibold">personalized leadership report</span> that shows exactly what's holding you back — and a clear plan to fix it.
              </motion.p>

              <motion.div
                variants={childFade}
                className="inline-flex items-center gap-2 text-xs sm:text-sm text-zinc-500 mb-6 sm:mb-8"
              >
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-center lg:text-left">5-min assessment • Personalized roadmap • 1-on-1 mentorship</span>
              </motion.div>

              <motion.div
                variants={childFade}
                className="flex flex-wrap gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8 justify-center lg:justify-start"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  <span className="text-zinc-300 text-xs sm:text-sm">No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  <span className="text-zinc-300 text-xs sm:text-sm">5-minute assessment</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  <span className="text-zinc-300 text-xs sm:text-sm">Instant results</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Column - Questionnaire Widget */}
            <div className="lg:sticky lg:top-24 mt-8 lg:mt-0">
              <QuestionnaireWidget />
            </div>
          </div>
        </div>
      </motion.section>

      {/* Live Stats Banner - Mobile Optimized */}
      <section className="py-8 sm:py-10 lg:py-12 px-4 sm:px-6 border-y border-zinc-800/50 bg-gradient-to-r from-zinc-900/50 to-transparent backdrop-blur-sm">
        <motion.div
          className="max-w-7xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {[
              { value: 100, label: "Leaders in Program", suffix: "+" },
              { value: Math.floor(Math.random() * 21) + 10, label: "Started This Week", suffix: "" },
              { value: 87, label: "Satisfaction Rate", suffix: "%" },
              { value: 45, label: "Avg. Salary Increase", suffix: "K" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                variants={childFade}
                className="text-center"
              >
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent mb-1 sm:mb-2">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} prefix={stat.value > 100 && stat.suffix === "K" ? "$" : ""} />
                </div>
                <div className="text-xs sm:text-sm text-zinc-500 leading-tight">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* The Problem (Visual Comparison) - Mobile Optimized */}
      <section className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-12 sm:mb-16 lg:mb-20"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <motion.div
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="inline-block mb-4 sm:mb-6"
            >
              <div className="px-4 sm:px-5 py-1.5 sm:py-2 bg-white/5 border border-white/10 rounded-full text-xs sm:text-sm text-zinc-400">
                <span className="text-white font-semibold">68%</span> of new managers feel unprepared for leadership
              </div>
            </motion.div>
            <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 px-2">
              Stop Being Just{" "}
              <span className="italic">
                A Manager
              </span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-zinc-400 max-w-3xl mx-auto px-4 sm:px-6">
              Learn to lead people, influence executives, and advance your career with personalized guidance.
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

      {/* Success Stories - Mobile Optimized */}
      <section className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 bg-gradient-to-b from-transparent via-zinc-900/30 to-transparent">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-10 sm:mb-14 lg:mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/5 border border-white/10 rounded-full mb-4 sm:mb-6"
            >
              <Star className="w-3 h-3 sm:w-4 sm:h-4 text-white fill-white" />
              <span className="text-xs sm:text-sm text-white font-semibold">Real Leader Transformations</span>
            </motion.div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 px-2">
              They Were Managers. Now They're Leaders.
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-zinc-400 px-4">
              <span className="text-white font-semibold">Under 3 months</span>—from struggling to confident, respected leadership.
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

      {/* Results Visualization - Mobile Optimized */}
      <section className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-12 sm:mb-16 lg:mb-20"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <div className="inline-block mb-4 sm:mb-6 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/5 border border-white/10 rounded-full text-xs sm:text-sm">
              <span className="text-zinc-400">Real outcomes from </span>
              <span className="text-white font-semibold">our members</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 px-2">
              The Leadership Impact You'll Create
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-zinc-400 px-4">
              Real transformation. Proven process.
            </p>
          </motion.div>

          {/* Key Transformation Metrics - Mobile Optimized */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-12 sm:mb-16 lg:mb-20"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {[
              {
                icon: Users,
                value: "92%",
                label: "Feel More Confident",
                detail: "After first month",
              },
              {
                icon: TrendingUp,
                value: "2.4x",
                label: "Leadership Impact",
                detail: "Team performance boost",
              },
              {
                icon: Award,
                value: "85%",
                label: "Career Advancement",
                detail: "Within 12 months",
              },
            ].map((metric, i) => (
              <motion.div
                key={metric.label}
                variants={childFade}
                whileHover={{ y: -8, scale: 1.02 }}
                className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-xl sm:rounded-2xl p-6 sm:p-8 hover:border-zinc-700 transition-all relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative z-10">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-white/10 border border-white/20 rounded-lg sm:rounded-xl mb-4 sm:mb-6"
                  >
                    <metric.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </motion.div>

                  <div className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-2 sm:mb-3 bg-gradient-to-b from-white to-zinc-300 bg-clip-text text-transparent">
                    {metric.value}
                  </div>
                  <div className="text-white font-semibold text-base sm:text-lg mb-1 sm:mb-2">{metric.label}</div>
                  <div className="text-xs sm:text-sm text-zinc-500">{metric.detail}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* What You'll Achieve - Mobile Optimized */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
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
                variants={childFade}
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
          </motion.div>
        </div>
      </section>

      {/* Your Journey Timeline - Mobile Optimized */}
      <section className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6 bg-gradient-to-b from-zinc-900/30 to-transparent">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-10 sm:mb-14 lg:mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <div className="inline-block mb-4 sm:mb-6 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/5 border border-white/10 rounded-full text-xs sm:text-sm">
              <span className="text-zinc-400">Your </span>
              <span className="text-white font-semibold">3-step process</span>
              <span className="text-zinc-400"> to leadership</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 px-2">
              How It Works
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-zinc-400 px-4">
              Simple process. Powerful results. Personalized for <span className="text-white font-semibold">your</span> career goals.
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
            />
            <TimelineItem
              week="2"
              title="Intro Call"
              description="1-on-1 session to review your plan, map your roadmap, and set clear goals."
            />
            <TimelineItem
              week="3+"
              title="Regular Mentorship"
              description="Weekly/bi-weekly calls to guide you, build skills, and track progress to your goals."
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
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-2 sm:gap-3 bg-white text-black px-6 sm:px-8 lg:px-10 py-3 sm:py-4 lg:py-5 rounded-full text-sm sm:text-base lg:text-lg font-semibold shadow-2xl shadow-white/10 hover:shadow-white/20 hover:bg-zinc-100 transition-all group active:scale-95"
            >
              <span className="hidden sm:inline">Start Your Journey Now</span>
              <span className="sm:hidden">Start Now</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Cost of Waiting - Mobile Optimized */}
      <section className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <CostOfWaiting />
        </div>
      </section>

      {/* Why Our Methodology Works - Mobile Optimized */}
      <section className="py-16 sm:py-24 lg:py-32 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-10 sm:mb-14 lg:mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 px-2">
              Science-Backed Career Acceleration
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-zinc-400 px-4">
              Our methodology is built on research and proven by results
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
                icon: DollarSign,
                title: "Data-Driven Insights",
                description:
                  "Built on years of career development research and analysis of 50,000+ successful career transitions to identify exact patterns that lead to breakthrough success.",
              },
              {
                icon: Compass,
                title: "Hyper-Personalized Strategy",
                description:
                  "Every roadmap is uniquely crafted using AI and expert review based on your industry, experience level, goals, and learning style. No generic advice—ever.",
              },
              {
                icon: Award,
                title: "Verified Mentor Network",
                description:
                  "Each mentor has achieved significant career success (director+ level, $200K+ comp) and has a proven track record of helping others reach their goals.",
              },
              {
                icon: ShieldCheck,
                title: "Accountability System",
                description:
                  "Weekly check-ins, milestone tracking, and real-time strategy adjustments ensure you don't just have a plan—you execute it with consistent support.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                variants={childFade}
                whileHover={{ x: 8 }}
                className="flex items-start gap-6 bg-gradient-to-br from-zinc-800/50 to-zinc-900/30 border border-zinc-700/50 rounded-2xl p-8 hover:border-zinc-600 transition-all group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <motion.div
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="flex-shrink-0 flex items-center justify-center w-16 h-16 bg-gradient-to-br from-zinc-700 to-zinc-800 border border-zinc-600 rounded-2xl shadow-lg relative z-10"
                >
                  <item.icon className="w-8 h-8 text-white" />
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

      {/* Final CTA Section - Mobile Optimized */}
      <section className="py-20 sm:py-28 lg:py-40 px-4 sm:px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent" />
        
        <motion.div
          className="max-w-4xl mx-auto text-center relative z-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
        >
          <motion.div variants={childFade} className="mb-6 sm:mb-8 flex flex-col items-center gap-3 sm:gap-4">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-1.5 sm:py-2 bg-white/5 border border-white/10 rounded-full"
            >
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white"
              />
              <span className="text-xs sm:text-sm text-white font-semibold">Limited spots in next cohort</span>
            </motion.div>
          </motion.div>

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
            className="text-base sm:text-lg lg:text-xl text-zinc-400 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed px-4"
          >
            Your team needs a leader, not just a manager. Take the first step now.
          </motion.p>

          <motion.div
            variants={childFade}
            className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 lg:gap-4 text-xs sm:text-sm mb-8 sm:mb-10 lg:mb-12 px-2"
          >
            <div className="px-2.5 sm:px-3 py-1 bg-white/5 rounded-full text-zinc-400">
              ⚡ <span className="text-white font-semibold">Olena K.</span> booked a call
            </div>
            <div className="px-2.5 sm:px-3 py-1 bg-white/5 rounded-full text-zinc-400">
              ⚡ <span className="text-white font-semibold">James M.</span> completed assessment
            </div>
            <div className="px-2.5 sm:px-3 py-1 bg-white/5 rounded-full text-zinc-400 hidden sm:inline-flex">
              ⚡ <span className="text-white font-semibold">Anna S.</span> started career path
            </div>
          </motion.div>

          <motion.div variants={childFade} className="flex flex-col items-center gap-4 sm:gap-6">
            <motion.button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                boxShadow: [
                  "0 20px 60px rgba(255,255,255,0.1)",
                  "0 20px 80px rgba(255,255,255,0.2)",
                  "0 20px 60px rgba(255,255,255,0.1)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-flex items-center gap-2 sm:gap-3 bg-white text-black px-8 sm:px-10 lg:px-12 py-4 sm:py-5 lg:py-6 rounded-full text-base sm:text-lg font-semibold shadow-2xl hover:bg-zinc-100 transition-all group cursor-pointer active:scale-95"
            >
              <span className="hidden sm:inline">Start Leadership Assessment</span>
              <span className="sm:hidden">Start Assessment</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
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

          <motion.div
            variants={childFade}
            className="mt-8 sm:mt-10 lg:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-zinc-600"
          >
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[
                  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=faces",
                  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=faces",
                  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=faces",
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=40&h=40&fit=crop&crop=faces",
                ].map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt=""
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-[#0a0a0a] object-cover"
                  />
                ))}
              </div>
              <span>{Math.floor(Math.random() * 21) + 10} started this week</span>
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
                Transforming careers, one roadmap at a time.
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
