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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm">
      {/* Background overlay - desktop only */}
      <div
        className="absolute inset-0 hidden sm:block"
        onClick={onClose}
      />
      
      {/* Modal Container - Full screen on mobile, contained on desktop */}
      <div className="relative w-full h-full sm:w-[90vw] sm:h-[90vh] sm:max-w-4xl sm:rounded-3xl bg-zinc-900 border-0 sm:border sm:border-zinc-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header - Fixed at top */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-zinc-800 bg-zinc-900 z-10">
          <div className="flex-1 min-w-0 pr-3">
            <h3 className="text-base sm:text-lg font-bold text-white">
              Book Your Call
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5 hidden sm:block">
              Let's unlock your leadership potential
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>
        
        {/* Calendly iframe container - Takes remaining space */}
        <div className="flex-1 w-full overflow-auto bg-white">
          <div
            className="calendly-inline-widget h-full w-full"
            data-url="https://calendly.com/careera-roadmap/careera-roadmap-review"
            data-resize="true"
          />
        </div>
      </div>
    </div>
  );
}
