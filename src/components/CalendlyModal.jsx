import { useEffect } from "react";
import { X } from "lucide-react";

export default function CalendlyModal({ isOpen, onClose }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const script = document.createElement("script");
      script.src = "https://assets.calendly.com/assets/external/widget.js";
      script.async = true;
      document.body.appendChild(script);
      return () => {
        document.body.style.overflow = "";
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl sm:rounded-3xl w-full max-w-[95vw] sm:max-w-4xl h-[90vh] sm:h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-zinc-800 shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="text-lg sm:text-xl font-bold text-white truncate">
              Book Your Career Boost Call
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              30-minute strategy session + Full roadmap access - $29.99
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>
        
        {/* Calendly Container */}
        <div className="flex-1 overflow-hidden p-2 sm:p-4">
          <div
            className="calendly-inline-widget w-full h-full"
            data-url="https://calendly.com/careera-roadmap/careera-roadmap-review"
            style={{ minWidth: '100%', height: '100%' }}
          />
        </div>
      </div>
    </div>
  );
}
