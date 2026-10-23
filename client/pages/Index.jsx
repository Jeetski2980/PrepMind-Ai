import { useEffect } from "react";
import { Link } from "react-router-dom";
import { InlineMath } from "react-katex";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Lightbulb,
  MessageSquare,
} from "lucide-react";
import Layout from "@/components/Layout.jsx";

const DEMO_LIMIT_MATH = String.raw`\lim\limits_{x \to 2} \frac{x^2 - 4}{x - 2}`;

export default function Index() {
  useEffect(() => {
    const obj = document.getElementById("countryCount");
    if (!obj) return undefined;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      obj.textContent = "21";
      return undefined;
    }

    let startTimestamp = null;
    let animationFrameId = null;
    const animateValue = (target, start, end, duration) => {
      const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 4);
        target.textContent = String(Math.floor(easedProgress * (end - start) + start));
        if (progress < 1) {
          animationFrameId = window.requestAnimationFrame(step);
        } else {
          target.textContent = String(end);
          target.classList.add("country-count-finished");
        }
      };
      animationFrameId = window.requestAnimationFrame(step);
    };

    animateValue(obj, 0, 21, 3200);
    return () => {
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <Layout>
      <main className="overflow-hidden bg-white text-gray-950 dark:bg-black dark:text-white">
        <section className="relative border-b border-emerald-950/10 bg-gradient-to-br from-emerald-50 via-white to-green-50 dark:border-white/10 dark:from-black dark:via-black dark:to-emerald-950/30">
          <div className="pointer-events-none absolute -right-24 top-16 h-80 w-80 rounded-full bg-emerald-300/20 blur-3xl dark:bg-emerald-400/10" />
          <div className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-lime-300/20 blur-3xl dark:bg-lime-400/5" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
            <div className="max-w-2xl">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-emerald-800/10 bg-white/80 px-4 py-2 text-sm font-medium text-emerald-900 shadow-sm dark:border-emerald-300/20 dark:bg-white/5 dark:text-emerald-200">
                <Lightbulb className="h-4 w-4" aria-hidden="true" />
                Powered by Google Gemini AI
              </div>

              <h1 className="max-w-2xl text-5xl font-bold leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">
                Prep smarter,
                <br />
                <span className="text-emerald-700 dark:text-emerald-400">not harder.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-gray-600 dark:text-white/70 sm:text-xl">
                Free, focused SAT, ACT, and AP practice to help you feel ready for what comes next.
                Learn at your pace, with tools built around the way students study.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/practice"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-700 px-6 py-3.5 font-semibold text-white shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 dark:bg-emerald-400 dark:text-black dark:hover:bg-emerald-300"
                >
                  Build a practice set <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  to="/tutor"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white/80 px-6 py-3.5 font-semibold text-gray-900 transition hover:-translate-y-0.5 hover:border-emerald-600 hover:text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:border-emerald-400 dark:hover:text-emerald-300"
                >
                  Ask your AI tutor <MessageSquare className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>

              <p className="mt-9 max-w-2xl text-[1.625rem] font-semibold leading-snug tracking-tight text-gray-950 dark:text-white md:text-[1.95rem]">
                Trusted by students in over{" "}
                <span id="countryCount" className="country-count mx-1 inline-block align-baseline text-5xl font-extrabold leading-none text-emerald-700 dark:text-emerald-400 sm:text-6xl">
                  0
                </span>{" "}
                countries
              </p>
            </div>

            <div className="relative mx-auto w-full max-w-xl lg:ml-auto">
              <div className="absolute -inset-4 rounded-[2rem] bg-emerald-500/10 blur-2xl" />
              <div className="relative overflow-hidden rounded-[1.75rem] border border-gray-200/35 bg-white p-4 shadow-2xl shadow-emerald-950/10 dark:border-white/[0.05] dark:bg-[#0b110d] sm:p-6">
                <div className="flex items-center justify-between border-b border-gray-200/30 pb-4 dark:border-white/[0.05]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300">
                      <BookOpen className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold tracking-wide text-gray-900 dark:text-white">
                        PRACTICE SESSION
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-white/50">
                        A quick look inside PrepMind
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-50/75 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-400/[0.06] dark:text-emerald-300">
                    AP CALCULUS AB
                  </span>
                </div>

                <div className="px-1 py-6 sm:px-2">
                  <div className="mb-4 flex items-center justify-between text-xs font-medium text-gray-500 dark:text-white/50">
                    <span>QUESTION 2</span>
                    <span>LIMITS</span>
                  </div>
                  <h2 className="text-xl font-semibold leading-7 text-gray-950 dark:text-white sm:text-2xl">
                    What is <InlineMath math={DEMO_LIMIT_MATH} />?
                  </h2>

                  <div className="mt-6 space-y-3" role="img" aria-label="Static example showing answer B selected">
                    <div className="flex items-center gap-3 rounded-2xl border border-gray-200 px-4 py-3 text-gray-700 dark:border-white/10 dark:text-white/75">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-sm font-semibold dark:border-white/25">A</span>
                      <span>0</span>
                    </div>
                    <div className="relative flex items-center gap-3 rounded-2xl border-2 border-emerald-600 bg-emerald-50 px-4 py-3 text-gray-950 shadow-sm dark:border-emerald-400 dark:bg-emerald-400/10 dark:text-white">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-700 text-sm font-bold text-white dark:bg-emerald-400 dark:text-black">B</span>
                      <span className="font-semibold">4</span>
                      <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Selected
                      </span>
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="pointer-events-none absolute -bottom-3 right-7 z-10 h-8 w-8 drop-shadow-md"
                      >
                        <path d="M5 2.5v16l4.4-4.3 3.1 6.2 2.4-1.2-3-6.1 6-.3L5 2.5Z" fill="white" stroke="#0b110d" strokeWidth="1.5" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl border border-gray-200 px-4 py-3 text-gray-700 dark:border-white/10 dark:text-white/75">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-sm font-semibold dark:border-white/25">C</span>
                      <span>2</span>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl border border-gray-200 px-4 py-3 text-gray-700 dark:border-white/10 dark:text-white/75">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-sm font-semibold dark:border-white/25">D</span>
                      <span>The limit does not exist</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-gray-200/30 pt-4 dark:border-white/[0.05]">
                  <span className="text-xs text-gray-500 dark:text-white/50">Example only · not an active quiz</span>
                  <span className="rounded-full bg-gray-100/70 px-3 py-1.5 text-xs font-medium text-gray-700 dark:bg-white/[0.05] dark:text-white/70">2/10</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">
              Study your way
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Everything you need to feel ready</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            <article className="rounded-3xl border border-gray-200 bg-white p-7 transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/[0.03]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300">
                <BookOpen className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-xl font-semibold">Practice that fits your goal</h3>
              <p className="mt-2 leading-7 text-gray-600 dark:text-white/65">Choose your exam, focus on a topic, and build a short set you can start right away.</p>
            </article>
            <article className="rounded-3xl border border-gray-200 bg-white p-7 transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/[0.03]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300">
                <Lightbulb className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-xl font-semibold">Understand each answer</h3>
              <p className="mt-2 leading-7 text-gray-600 dark:text-white/65">Review clear explanations after every practice set and learn from the steps you take.</p>
            </article>
            <article className="rounded-3xl border border-gray-200 bg-white p-7 transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/[0.03]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300">
                <MessageSquare className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-xl font-semibold">Get help when you need it</h3>
              <p className="mt-2 leading-7 text-gray-600 dark:text-white/65">Ask the tutor to explain a concept, walk through a problem, or help you find the next step.</p>
            </article>
          </div>
        </section>

        <section className="bg-emerald-700 py-14 text-white dark:bg-emerald-900/70 sm:py-16">
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-100">Made for students</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Built by students, for students</h2>
            <div className="mx-auto mt-9 grid max-w-3xl gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-5">
                <p className="text-3xl font-bold">3+</p><p className="mt-1 text-sm text-white/80">Exam types</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-5">
                <p className="text-3xl font-bold">∞</p><p className="mt-1 text-sm text-white/80">Practice questions</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-5">
                <p className="text-3xl font-bold">24/7</p><p className="mt-1 text-sm text-white/80">Tutor access</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to start?</h2>
          <p className="mx-auto mt-3 max-w-xl text-lg text-gray-600 dark:text-white/65">Pick one small goal and make today’s study time count.</p>
          <Link to="/practice" className="mt-7 inline-flex items-center gap-2 rounded-full bg-emerald-700 px-6 py-3 font-semibold text-white transition hover:bg-emerald-800 dark:bg-emerald-400 dark:text-black dark:hover:bg-emerald-300">
            Start practicing <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </section>
      </main>
    </Layout>
  );
}
