import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, MapPin } from "lucide-react";

const activities = [
  { name: "Olena K.", location: "Kyiv, Ukraine", action: "booked a call" },
  { name: "Dmytro P.", location: "Lviv, Ukraine", action: "completed assessment" },
  { name: "Anna S.", location: "Berlin, Germany", action: "started career path" },
  { name: "Mikhailo T.", location: "Warsaw, Poland", action: "joined the program" },
  { name: "Sofia M.", location: "Amsterdam, Netherlands", action: "booked a call" },
  { name: "Andriy L.", location: "Odesa, Ukraine", action: "completed assessment" },
  { name: "Kateryna H.", location: "Prague, Czech Republic", action: "started career path" },
  { name: "Viktor R.", location: "Kharkiv, Ukraine", action: "booked a call" },
  { name: "Maria V.", location: "Vienna, Austria", action: "completed assessment" },
  { name: "Yuriy B.", location: "Dnipro, Ukraine", action: "joined the program" },
];

export default function LiveActivity() {
  const [currentActivity, setCurrentActivity] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Function to show notification with random delay between 60-180 seconds (1-3 minutes)
    const scheduleNextNotification = () => {
      const randomDelay = Math.floor(Math.random() * 120000) + 60000; // 60-180 seconds in ms
      
      setTimeout(() => {
        // Show notification (no sound)
        setIsVisible(true);
        setCurrentActivity((prev) => (prev + 1) % activities.length);

        // Hide after 4 seconds
        setTimeout(() => {
          setIsVisible(false);
        }, 4000);

        // Schedule next notification
        scheduleNextNotification();
      }, randomDelay);
    };

    // Start the cycle with initial delay
    scheduleNextNotification();

    // Cleanup
    return () => {};
  }, []);

  const activity = activities[currentActivity];

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-4 left-4 right-4 sm:right-auto sm:left-6 sm:bottom-6 z-40 sm:max-w-sm"
    >
      <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 shadow-2xl">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-semibold text-white text-xs sm:text-sm truncate">{activity.name}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
            </div>
            <p className="text-xs text-zinc-400 truncate">{activity.action}</p>
            <div className="flex items-center gap-1 mt-0.5 sm:mt-1">
              <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-zinc-500 shrink-0" />
              <span className="text-xs text-zinc-500 truncate">{activity.location}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
