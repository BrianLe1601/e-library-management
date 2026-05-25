import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, BookOpen, Search } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070d1b] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-500/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-purple-500/5 blur-3xl" />
        <div
          className="absolute inset-0 opacity-30 dark:opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(99,102,241,0.15) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-lg w-full">
        {/* Animated 404 */}
        <div className="relative mb-8">
          {/* Large 404 */}
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            <span
              className="text-[120px] sm:text-[160px] font-black leading-none select-none"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              4
            </span>

            {/* Book icon in center */}
            <div className="relative">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/40">
                <BookOpen size={48} className="text-white" strokeWidth={1.5} />
              </div>
              {/* Floating search icon */}
              <div className="absolute -top-3 -right-3 w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg">
                <Search size={16} className="text-white" />
              </div>
              {/* Floating dot */}
              <div className="absolute -bottom-2 -left-2 w-5 h-5 rounded-full bg-indigo-400 animate-bounce" />
            </div>

            <span
              className="text-[120px] sm:text-[160px] font-black leading-none select-none"
              style={{
                background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              4
            </span>
          </div>

          {/* Decorative lines */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
        </div>

        <h1 className="text-slate-900 dark:text-white mb-3">Page Not Found</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
          Oops! It seems this page has been checked out and hasn't been returned yet.
          The page you're looking for doesn't exist or has been moved.
        </p>
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm transition-colors"
          >
            <ArrowLeft size={16} /> Go Back
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm transition-colors shadow-lg shadow-indigo-500/30"
          >
            <Home size={16} /> Back to Home
          </button>
        </div>

        {/* Footer note */}
        <p className="mt-12 text-slate-400 dark:text-slate-600 text-xs">
          E-Library • Error Code: 404_PAGE_NOT_FOUND
        </p>
      </div>
    </div>
  );
}
