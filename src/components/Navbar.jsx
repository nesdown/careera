import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Logo from "./Logo";

export default function Navbar({ showProgress, progress, questionLabel }) {
  return (
    <>
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <Logo size="small" className="sm:hidden transition-transform group-hover:scale-105" />
            <Logo size="default" className="hidden sm:flex transition-transform group-hover:scale-105" />
          </Link>

          {/* Right Side Content */}
          <div className="flex items-center gap-3 sm:gap-4">
            {questionLabel ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-xs sm:text-sm text-zinc-400 truncate max-w-[140px] sm:max-w-[200px] lg:max-w-none">
                  {questionLabel}
                </span>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span className="text-xs text-zinc-400">In Progress</span>
                </div>
              </div>
            ) : (
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  to="/Questionnaire"
                  className="relative group bg-white text-black px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-semibold hover:bg-zinc-100 transition-all shadow-lg hover:shadow-xl overflow-hidden"
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                  
                  <span className="relative hidden sm:inline">Start Your Journey</span>
                  <span className="relative sm:hidden">Start</span>
                </Link>
              </motion.div>
            )}
          </div>
        </div>

        {/* Subtle gradient line under navbar */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </motion.nav>

      {/* Progress Bar */}
      {showProgress && (
        <motion.div 
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.3 }}
          className="fixed top-16 sm:top-20 left-0 right-0 z-50 h-1 bg-zinc-900/50 backdrop-blur-sm"
          style={{ transformOrigin: "left" }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-white via-zinc-200 to-white relative overflow-hidden"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* Shimmer effect on progress bar */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
