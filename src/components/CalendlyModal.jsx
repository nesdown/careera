import { useEffect } from "react";
import { X } from "lucide-react";

export default function CalendlyModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return;

    // Prevent body scroll
    document.body.style.overflow = "hidden";

    // Load Calendly script if not already present
    if (!document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]')) {
      const script = document.createElement("script");
      script.src = "https://assets.calendly.com/assets/external/widget.js";
      script.type = "text/javascript";
      script.async = true;
      document.head.appendChild(script);
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[101] pointer-events-none flex items-center justify-center p-0 sm:p-4">
        <div className="pointer-events-auto relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-5xl bg-zinc-900 sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-zinc-900 border-b border-zinc-800 shrink-0">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-white">
                Book Your Leadership Call
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1 hidden sm:block">
                Let&apos;s discuss your career goals
              </p>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 ml-4 p-2 hover:bg-zinc-800 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>

          {/* Calendly Container */}
          <div className="flex-1 bg-black overflow-hidden">
            {/* Calendly inline widget */}
            <div 
              className="calendly-inline-widget h-full w-full" 
              data-url="https://calendly.com/careera-roadmap/careera-roadmap-review?hide_gdpr_banner=1&background_color=000000&text_color=ffffff&primary_color=ffffff"
              style={{
                minWidth: '320px',
                height: '100%',
                minHeight: '630px'
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
