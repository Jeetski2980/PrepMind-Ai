import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Brain, Sun, Moon } from "lucide-react";

export default function Layout({ children, footerAtBottom = false }) {
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check for saved theme preference on load
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);
// toggles dark/light mode and saves choice
  const handleThemeToggle = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
    
    if (newTheme) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const navLinkClass = (path) => {
    const baseClass = "inline-flex shrink-0 items-center justify-center rounded-full px-3 py-2 text-[13px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white md:px-4 md:text-sm dark:focus-visible:ring-emerald-300 dark:focus-visible:ring-offset-[#080c0a]";
    const activeClass = "bg-white text-emerald-800 shadow-sm ring-1 ring-black/[0.04] dark:bg-emerald-400/15 dark:text-emerald-200 dark:shadow-[0_2px_12px_-6px_rgba(52,211,153,0.45)] dark:ring-emerald-300/10";
    const inactiveClass = "text-gray-600 hover:bg-white/75 hover:text-gray-950 dark:text-white/65 dark:hover:bg-white/[0.07] dark:hover:text-white";
    return `${baseClass} ${location.pathname === path ? activeClass : inactiveClass}`;
  };

  return (
    <div className={`${footerAtBottom ? "flex flex-col" : ""} min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white transition-colors`}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/85 backdrop-blur-xl transition-colors dark:border-transparent dark:bg-[#080c0a]/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 py-3 sm:gap-6 sm:py-3.5">
            {/* Logo */}
            <Link to="/" className="group flex shrink-0 items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-4 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#080c0a]">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-sm shadow-emerald-950/15 transition-transform duration-200 group-hover:scale-105">
                <Brain className="h-[18px] w-[18px] text-white" aria-hidden="true" />
              </div>
              <span className="text-[18px] font-bold tracking-tight sm:text-xl">
                <span className="text-gray-900 dark:text-white">PrepMind</span>
                <span className="text-emerald-600 dark:text-emerald-400">.org</span>
              </span>
            </Link>

            {/* Navigation */}
            <nav aria-label="Primary navigation" className="hidden items-center gap-0.5 rounded-full border border-gray-200/80 bg-gray-100/80 p-1 shadow-inner shadow-gray-950/[0.025] md:flex dark:border-white/[0.08] dark:bg-white/[0.045] dark:shadow-black/20">
              <Link to="/" aria-current={location.pathname === "/" ? "page" : undefined} className={navLinkClass("/")}>
                Home
              </Link>
              <Link to="/practice" aria-current={location.pathname === "/practice" ? "page" : undefined} className={navLinkClass("/practice")}>
                Practice
              </Link>
              <Link to="/tutor" aria-current={location.pathname === "/tutor" ? "page" : undefined} className={navLinkClass("/tutor")}>
                AI Tutor
              </Link>
              <Link to="/about" aria-current={location.pathname === "/about" ? "page" : undefined} className={navLinkClass("/about")}>
                About
              </Link>
            </nav>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={handleThemeToggle}
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              aria-pressed={isDarkMode}
              title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              className="relative inline-flex h-8 w-[3.35rem] shrink-0 items-center rounded-full border border-gray-200 bg-gray-100 p-1 shadow-inner shadow-gray-950/[0.04] transition-colors hover:border-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-white/[0.07] dark:hover:border-emerald-300/30 dark:focus-visible:ring-emerald-300 dark:focus-visible:ring-offset-[#080c0a]"
            >
              <span className={`flex h-6 w-6 items-center justify-center rounded-full shadow-sm transition-all duration-200 ${isDarkMode ? "translate-x-[1.3rem] bg-emerald-400 text-emerald-950" : "translate-x-0 bg-white text-amber-500"}`}>
                {isDarkMode ? <Moon className="h-3.5 w-3.5" aria-hidden="true" /> : <Sun className="h-3.5 w-3.5" aria-hidden="true" />}
              </span>
            </button>
          </div>

          {/* Mobile navigation */}
          <nav aria-label="Mobile navigation" className="-mx-1 flex items-center gap-0.5 overflow-x-auto rounded-full border border-gray-200/80 bg-gray-100/80 p-1 shadow-inner shadow-gray-950/[0.025] md:hidden dark:border-white/[0.08] dark:bg-white/[0.045] dark:shadow-black/20">
            <Link to="/" aria-current={location.pathname === "/" ? "page" : undefined} className={navLinkClass("/")}>
              Home
            </Link>
            <Link to="/practice" aria-current={location.pathname === "/practice" ? "page" : undefined} className={navLinkClass("/practice")}>
              Practice
            </Link>
            <Link to="/tutor" aria-current={location.pathname === "/tutor" ? "page" : undefined} className={navLinkClass("/tutor")}>
              AI Tutor
            </Link>
            <Link to="/about" aria-current={location.pathname === "/about" ? "page" : undefined} className={navLinkClass("/about")}>
              About
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className={footerAtBottom ? "flex-1" : undefined}>{children}</main>

      {/* Footer */}
      <footer className="bg-white dark:bg-black border-0 outline-none shadow-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Logo & Description */}
            <div className="md:col-span-2">
              <Link to="/" className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">
                  <span className="text-gray-900 dark:text-white">PrepMind</span>
                  <span className="text-emerald-600 dark:text-emerald-400">.org</span>
                </span>
              </Link>
              <p className="text-gray-600 dark:text-white/70 max-w-md">
                Free AI-powered test preparation for SAT, ACT, and AP exams. 
                Helping students achieve their academic goals with personalized practice and instant feedback.
              </p>
            </div>

            {/* Quick Links */}
         <div>
  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Links</h3>
  <ul className="space-y-2">
    <li>
      <Link to="/practice" className="text-gray-600 dark:text-white/70 hover:text-emerald-600 dark:hover:text-emerald-400">
        Practice Questions
      </Link>
    </li>
    <li>
      <Link to="/tutor" className="text-gray-600 dark:text-white/70 hover:text-emerald-600 dark:hover:text-emerald-400">
        AI Tutor
      </Link>
    </li>
    <li>
      <Link to="/about" className="text-gray-600 dark:text-white/70 hover:text-emerald-600 dark:hover:text-emerald-400">
        About Us
      </Link>
    </li>
    <li>
      <span className="text-gray-600 dark:text-white/70">
        Contact Us:{' '}
        <a
          href="https://mail.google.com/mail/?view=cm&fs=1&to=support@prepmind.org"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-emerald-600 dark:hover:text-emerald-400 underline"
        >
          support@prepmind.org
        </a>
      </span>
    </li>
  </ul>
</div>


            {/* Support */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Tests</h3>
              <ul className="space-y-2">
                <li className="text-gray-600 dark:text-white/70">SAT Prep</li>
                <li className="text-gray-600 dark:text-white/70">ACT Prep</li>
                <li className="text-gray-600 dark:text-white/70">AP Exams</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 text-center border-0 outline-none shadow-none">
            <p className="text-gray-600 dark:text-white/70">
              © 2026 PrepMind. Empowering students with free, AI-powered test preparation.
            </p>
            <Link
              to="/terms"
              className="mt-2 inline-block text-gray-600 dark:text-white/70 hover:text-emerald-600 dark:hover:text-emerald-400 underline underline-offset-4"
            >
              Terms and Conditions
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
