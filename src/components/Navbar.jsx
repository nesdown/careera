import { Link } from "react-router-dom";
import Logo from "./Logo";

export default function Navbar({ showProgress, progress, questionLabel }) {
  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black via-black to-zinc-950 border-b border-zinc-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 sm:h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            <Logo size="small" className="sm:hidden" />
            <Logo size="default" className="hidden sm:flex" />
          </Link>
          
          {questionLabel ? (
            <span className="text-xs sm:text-sm text-zinc-400 truncate max-w-[180px] sm:max-w-none">
              {questionLabel}
            </span>
          ) : (
            <Link
              to="/Questionnaire"
              className="bg-white text-black px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-semibold hover:bg-zinc-200 transition-all shadow-md hover:shadow-lg"
            >
              <span className="hidden sm:inline">Start Your Journey</span>
              <span className="sm:hidden">Start</span>
            </Link>
          )}
        </div>
      </nav>
      
      {showProgress && (
        <div className="fixed top-18 sm:top-20 left-0 right-0 z-50 h-1 bg-zinc-900">
          <div
            className="h-full bg-white shadow-sm transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </>
  );
}
