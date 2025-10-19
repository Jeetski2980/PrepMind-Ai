import { CheckCircle } from "lucide-react";

export default function ApiKeyNoticeGoogle() {
  return (
    <div className="mb-6 rounded-xl border border-emerald-200/70 bg-emerald-50 px-4 py-3 dark:border-emerald-400/30 dark:bg-emerald-400/10">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="font-semibold text-emerald-800 dark:text-emerald-300">
            AI Powered by Google Gemini
          </p>
          <p className="mt-1 text-emerald-900/80 dark:text-emerald-200/80">
            PrepMind uses Google’s Gemini models through its API to generate
            practice questions and provide live tutoring for SAT, ACT, and AP
            exams.
          </p>
        </div>
      </div>
    </div>
  );
}
