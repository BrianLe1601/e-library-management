import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

// ─── Cấu hình giao diện cho từng loại Toast ──────────────────────────────
const config = {
  success: {
    Icon: CheckCircle2,
    iconColor: 'text-emerald-500 dark:text-emerald-400',
    iconBg: 'bg-emerald-100/50 dark:bg-emerald-500/20 ring-1 ring-emerald-200 dark:ring-emerald-500/30',
    borderColor: 'border-l-emerald-500',
    progressColor: '#10b981',
  },
  error: {
    Icon: XCircle,
    iconColor: 'text-rose-500 dark:text-rose-400',
    iconBg: 'bg-rose-100/50 dark:bg-rose-500/20 ring-1 ring-rose-200 dark:ring-rose-500/30',
    borderColor: 'border-l-rose-500',
    progressColor: '#f43f5e',
  },
  info: {
    Icon: Info,
    iconColor: 'text-blue-500 dark:text-blue-400',
    iconBg: 'bg-blue-100/50 dark:bg-blue-500/20 ring-1 ring-blue-200 dark:ring-blue-500/30',
    borderColor: 'border-l-blue-500',
    progressColor: '#3b82f6',
  },
  warning: {
    Icon: AlertTriangle,
    iconColor: 'text-amber-500 dark:text-amber-400',
    iconBg: 'bg-amber-100/50 dark:bg-amber-500/20 ring-1 ring-amber-200 dark:ring-amber-500/30',
    borderColor: 'border-l-amber-500',
    progressColor: '#f59e0b',
  },
};

// ─── Component Thanh thời gian chạy lùi ──────────────────────────────────
function ProgressBar({ duration, color, paused }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800 rounded-b-xl overflow-hidden">
      <div
        className="h-full origin-left"
        style={{
          backgroundColor: color,
          animation: `shrink-progress ${duration}ms linear forwards`,
          animationPlayState: paused ? 'paused' : 'running',
        }}
      />
    </div>
  );
}

// ─── Component Chính ─────────────────────────────────────────────────────
export function Toast({ id, type, title, description, duration = 4000, onDismiss }) {
  const [hovered, setHovered] = useState(false);
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef(null);
  
  const { Icon, iconColor, iconBg, borderColor, progressColor } = config[type];

  // Hàm kích hoạt hiệu ứng mờ dần trước khi đóng
  const dismiss = () => {
    setExiting(true);
    setTimeout(() => {
      if (onDismiss) onDismiss(id);
    }, 300); // Đợi 300ms cho hiệu ứng đóng hoàn tất
  };

  useEffect(() => {
    if (duration === Infinity) return;
    
    // Tạm dừng đếm ngược khi hover chuột vào
    if (!hovered) {
      timerRef.current = setTimeout(dismiss, duration);
    }
    
    return () => clearTimeout(timerRef.current);
  }, [hovered, duration]);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative flex items-start gap-3 w-[360px] p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-200/60 dark:border-slate-700/50 ${borderColor} border-l-4 pointer-events-auto transform transition-all duration-300 ${
        exiting ? 'opacity-0 translate-x-12 scale-95' : 'animate-slide-in-right opacity-100 translate-x-0 scale-100'
      }`}
    >
      {/* Icon */}
      <div className={`mt-0.5 shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${iconBg}`}>
        <Icon size={18} className={iconColor} strokeWidth={2.5} />
      </div>

      {/* Nội dung */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</p>
        {description && (
          <p className="mt-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Nút Đóng */}
      <button
        onClick={dismiss}
        className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <X size={14} strokeWidth={2.5} />
      </button>

      {/* Thanh Progress */}
      {duration !== Infinity && (
        <ProgressBar duration={duration} color={progressColor} paused={hovered || exiting} />
      )}
    </div>
  );
}