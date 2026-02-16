import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export default function CalendlyModal({ isOpen, onClose }) {
  const containerRef = useRef(null);
  const calendlyUrl =
    "https://calendly.com/careera-roadmap/careera-roadmap-review?background_color=1a1a1a&text_color=ffffff&primary_color=ffffff";

  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    const init = () => {
      if (!containerRef.current) return;
      if (!window.Calendly || typeof window.Calendly.initInlineWidget !== "function") return;

      // Avoid duplicated iframes on re-open.
      containerRef.current.innerHTML = "";
      window.Calendly.initInlineWidget({
        url: calendlyUrl,
        parentElement: containerRef.current,
      });
    };

    const existing = document.querySelector(
      'script[src="https://assets.calendly.com/assets/external/widget.js"]'
    );

    if (existing) {
      init();
    } else {
      const script = document.createElement("script");
      script.src = "https://assets.calendly.com/assets/external/widget.js";
      script.async = true;
      script.addEventListener("load", init, { once: true });
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
      {/* Click-outside close only on desktop (prevents accidental closes on mobile) */}
      <div className="absolute inset-0 hidden sm:block" onClick={onClose} />

      <div className="relative mx-auto w-full h-[100dvh] sm:h-[90vh] sm:max-w-4xl sm:mt-[5vh] sm:rounded-3xl bg-zinc-900 border-0 sm:border sm:border-zinc-800 shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-zinc-800 bg-zinc-900 shrink-0 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="min-w-0 pr-3">
            <h3 className="text-base sm:text-lg font-bold text-white truncate">
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

        {/* This is the same “inline widget” Calendly embed, just initialized via JS. */}
        <div className="flex-1 min-h-0 bg-[#1a1a1a] pb-[env(safe-area-inset-bottom)]">
          <div
            ref={containerRef}
            className="w-full h-full"
            style={{ minWidth: 320 }}
          />
        </div>
      </div>
    </div>
  );
}
