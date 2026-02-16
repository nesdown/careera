import { useEffect } from "react";
import { X } from "lucide-react";

export default function CalendlyModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return;

    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    // Load Calendly widget script if not already loaded
    if (!document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]')) {
      const script = document.createElement("script");
      script.src = "https://assets.calendly.com/assets/external/widget.js";
      script.async = true;
      document.body.appendChild(script);
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm">
      {/* Click outside to close - desktop only */}
      <div className="absolute inset-0 hidden sm:block" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative mx-auto w-full h-[100dvh] sm:h-[90vh] sm:max-w-4xl sm:mt-[5vh] sm:rounded-3xl bg-zinc-900 border-0 sm:border sm:border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div 
          className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-zinc-800 bg-zinc-900 shrink-0"
          style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
        >
          <div className="min-w-0 pr-3">
            <h3 className="text-base sm:text-lg font-bold text-white">
              Book Your Call
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5 hidden sm:block">
              Let&apos;s unlock your leadership potential
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

        {/* Calendly Embed Container */}
        <div 
          className="flex-1 min-h-0 bg-white overflow-auto"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {/* Calendly inline widget - using direct embed code */}
          <div 
            className="calendly-inline-widget" 
            data-url="https://calendly.com/careera-roadmap/careera-roadmap-review?hide_gdpr_banner=1"
            style={{ 
              minWidth: '320px', 
              width: '100%',
              height: '100%',
              minHeight: '600px'
            }}
          />
        </div>
      </div>
    </div>
  );
}
