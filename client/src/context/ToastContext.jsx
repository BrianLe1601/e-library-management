import React, { createContext, useCallback, useContext, useState } from 'react';
import { Toast } from '../components/ToastNotification';

// ─── Khởi tạo Context ────────────────────────────────────────────────────────
const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast phải được bọc bên trong <ToastProvider>');
  return ctx;
}

// ─── Provider & Vùng chứa Toast ──────────────────────────────────────────────
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((options) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    // Luôn đưa Toast mới lên đầu và giới hạn tối đa hiển thị 5 cái cùng lúc
    setToasts((prev) => [{ id, ...options }, ...prev].slice(0, 5));
  }, []);

  // Các hàm viết tắt tiện lợi
  const shortcuts = {
    success: (title, description = '', duration) =>
      addToast({ type: 'success', title, description, duration }),
    error: (title, description = '', duration) =>
      addToast({ type: 'error', title, description, duration }),
    info: (title, description = '', duration) =>
      addToast({ type: 'info', title, description, duration }),
    warning: (title, description = '', duration) =>
      addToast({ type: 'warning', title, description, duration }),
  };

  return (
    <ToastContext.Provider value={{ addToast, ...shortcuts }}>
      {children}

      {/* Vùng chứa (Container) hiển thị góc trên bên phải */}
      <div
        className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <Toast
            key={t.id}
            id={t.id}
            type={t.type}
            title={t.title}
            description={t.description}
            duration={t.duration || 4000} // Mặc định tự tắt sau 4 giây
            onDismiss={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}