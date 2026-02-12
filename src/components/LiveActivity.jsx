import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, MapPin } from "lucide-react";

const activities = [
  { name: "Sarah M.", location: "San Francisco", action: "just started their assessment" },
  { name: "Michael K.", location: "New York", action: "unlocked their roadmap" },
  { name: "Jennifer L.", location: "Austin", action: "booked a mentor call" },
  { name: "David P.", location: "Seattle", action: "completed their transformation" },
  { name: "Lisa R.", location: "Boston", action: "just started their assessment" },
  { name: "James T.", location: "Chicago", action: "unlocked their roadmap" },
  { name: "Emma W.", location: "Los Angeles", action: "booked a mentor call" },
  { name: "Ryan H.", location: "Denver", action: "completed their transformation" },
];

export default function LiveActivity() {
  const [currentActivity, setCurrentActivity] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentActivity((prev) => (prev + 1) % activities.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const activity = activities[currentActivity];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-6 left-6 z-40 max-w-sm"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentActivity}
          initial={{ opacity: 0, x: -50, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 50, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 rounded-xl px-4 py-3 shadow-2xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-semibold text-white text-sm">{activity.name}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              </div>
              <p className="text-xs text-zinc-400 truncate">{activity.action}</p>
              <div className="flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3 text-zinc-500" />
                <span className="text-xs text-zinc-500">{activity.location}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
