import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, Info, X, ShieldAlert } from 'lucide-react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'critical';
  title: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newToast = { ...toast, id };
      setToasts((prev) => [...prev, newToast]);

      const duration = toast.duration || (toast.type === 'critical' ? 9000 : 5000);
      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      {/* Toast Render Portal */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
        {toasts.map((t) => {
          const bgColors = {
            success: 'bg-slate-900 border-emerald-500/50 text-emerald-300 shadow-emerald-950/40',
            error: 'bg-slate-900 border-rose-500/60 text-rose-300 shadow-rose-950/40',
            warning: 'bg-slate-900 border-amber-500/60 text-amber-300 shadow-amber-950/40',
            info: 'bg-slate-900 border-indigo-500/50 text-indigo-300 shadow-indigo-950/40',
            critical: 'bg-rose-950/90 border-rose-500 text-rose-100 shadow-rose-900/60 animate-pulse-subtle',
          };

          const icons = {
            success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
            error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
            warning: <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />,
            info: <Info className="w-5 h-5 text-indigo-400 shrink-0" />,
            critical: <ShieldAlert className="w-5 h-5 text-rose-300 shrink-0" />,
          };

          return (
            <div
              key={t.id}
              className={`pointer-events-auto p-4 rounded-xl border backdrop-blur-md shadow-xl transition-all duration-300 flex items-start justify-between gap-3 ${bgColors[t.type]}`}
            >
              <div className="flex items-start gap-3">
                {icons[t.type]}
                <div>
                  <h4 className="font-semibold text-sm tracking-wide text-slate-100">{t.title}</h4>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{t.message}</p>
                </div>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-100 p-0.5 transition-colors"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
