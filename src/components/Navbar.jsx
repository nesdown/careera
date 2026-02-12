import { Link } from "react-router-dom";
import Logo from "./Logo";

export default function Navbar({ showProgress, progress, questionLabel }) {
  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <Logo size="default" />
          </Link>
          {questionLabel ? (
            <span className="text-sm text-zinc-400">{questionLabel}</span>
          ) : (
            <Link
              to="/Questionnaire"
              className="bg-white text-black px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-zinc-100 transition-all"
            >
              Start Your Journey
            </Link>
          )}
        </div>
      </nav>
      {showProgress && (
        <div className="fixed top-16 left-0 right-0 z-50 h-1 bg-zinc-900">
          <div
            className="h-full bg-white transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </>
  );
}
