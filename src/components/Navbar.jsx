import { Link } from "react-router-dom";
import Logo from "./Logo";

export default function Navbar({ showProgress, progress, questionLabel }) {
  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <Logo size="small" className="sm:hidden" />
            <Logo size="default" className="hidden sm:flex" />
          </Link>
          {questionLabel ? (
            <span className="text-xs sm:text-sm text-zinc-400 truncate max-w-[180px] sm:max-w-none">{questionLabel}</span>
          ) : (
            <Link
              to="/Questionnaire"
              className="bg-white text-black px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold hover:bg-zinc-100 transition-all active:scale-95"
            >
              <span className="hidden sm:inline">Start Your Journey</span>
              <span className="sm:hidden">Start</span>
            </Link>
          )}
        </div>
      </nav>
      {showProgress && (
        <div className="fixed top-14 sm:top-16 left-0 right-0 z-50 h-1 bg-zinc-900">
          <div
            className="h-full bg-white transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </>
  );
}
