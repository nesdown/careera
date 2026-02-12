import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export default function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 45,
    seconds: 30,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        let { hours, minutes, seconds } = prev;
        
        seconds--;
        if (seconds < 0) {
          seconds = 59;
          minutes--;
          if (minutes < 0) {
            minutes = 59;
            hours--;
            if (hours < 0) {
              hours = 23;
            }
          }
        }
        
        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-4 py-2">
      <Clock className="w-4 h-4 text-white" />
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <span className="text-white font-bold text-sm tabular-nums">
            {String(timeLeft.hours).padStart(2, "0")}
          </span>
          <span className="text-zinc-400 text-xs">h</span>
        </div>
        <span className="text-zinc-500">:</span>
        <div className="flex items-center gap-1">
          <span className="text-white font-bold text-sm tabular-nums">
            {String(timeLeft.minutes).padStart(2, "0")}
          </span>
          <span className="text-zinc-400 text-xs">m</span>
        </div>
        <span className="text-zinc-500">:</span>
        <div className="flex items-center gap-1">
          <span className="text-white font-bold text-sm tabular-nums">
            {String(timeLeft.seconds).padStart(2, "0")}
          </span>
          <span className="text-zinc-400 text-xs">s</span>
        </div>
      </div>
    </div>
  );
}
