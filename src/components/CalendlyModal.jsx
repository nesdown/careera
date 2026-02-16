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
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-3xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div>
            <h3 className="text-xl font-bold text-white">
              Book Your Career Boost Call
            </h3>
            <p className="text-sm text-zinc-400 mt-1">
              30-minute strategy session + Full roadmap access - $29.99
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>
        <div className="p-4" style={{ height: 700 }}>
          <div
            className="calendly-inline-widget"
            data-url="https://calendly.com/careera-roadmap/careera-roadmap-review"
            style={{ minWidth: 320, height: "100%" }}
          />
        </div>
      </div>
    </div>
  );
}
