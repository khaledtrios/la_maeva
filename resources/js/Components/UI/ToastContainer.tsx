import { useEffect, useState, useRef, useCallback } from 'react';
import { usePage, router } from '@inertiajs/react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

export interface Toast {
  id: number;
  type: 'success' | 'error';
  title: string;
  duration: number;
}

export function ToastContainer() {
  const { flash, errors } = usePage().props as any;
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idCounter = useRef(0);
  const timersRef = useRef<Set<number>>(new Set());

  const addToast = useCallback((type: 'success' | 'error', title: string, duration: number) => {
    const id = ++idCounter.current;
    setToasts((prev) => [...prev, { id, type, title, duration }]);

    const timer = window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timersRef.current.delete(timer);
    }, duration);
    timersRef.current.add(timer);
  }, []);

  // Nettoyage des timers
  useEffect(() => () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current.clear();
  }, []);

  // Affiche les toasts à partir des props actuelles
  const showToasts = useCallback(() => {
    if (flash.success) addToast('success', flash.success, 4000);
    if (flash.error && (!errors || Object.keys(errors).length === 0)) {
      addToast('error', flash.error, 6000);
    }
    if (errors && typeof errors === 'object' && !Array.isArray(errors)) {
      Object.values(errors).flatMap((v) => (Array.isArray(v) ? v : [v]))
        .forEach((msg) => addToast('error', msg, 6000));
    }
  }, [flash, errors, addToast]);

  useEffect(() => {
    showToasts();

    const handleFinish = () => setTimeout(showToasts, 0);

    const removeListener = router.on('finish', handleFinish);

    return () => {
        removeListener();
    };
    }, [showToasts]);

  const removeToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));
  if (toasts.length === 0) return null;

  return (
    <div
  className="fixed top-20 right-4 z-50 flex flex-col gap-3 sm:top-24 sm:right-6 max-w-sm w-full sm:max-w-md"
  style={{ zIndex: 10000 }}
>
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        const colors = isError
          ? {
              bg: 'bg-gradient-to-r from-red-50 to-rose-50',
              border: 'border-red-200',
              icon: 'text-red-500',
              title: 'text-red-900',
              iconComponent: <AlertCircle size={18} className="text-red-500" />,
            }
          : {
              bg: 'bg-gradient-to-r from-emerald-50 to-teal-50',
              border: 'border-emerald-200',
              icon: 'text-emerald-500',
              title: 'text-emerald-900',
              iconComponent: <CheckCircle size={18} className="text-emerald-500" />,
            };

        return (
          <div
            key={toast.id}
            className={`relative overflow-hidden rounded-xl border backdrop-blur-md ${colors.bg} ${colors.border} shadow-lg transform transition-all duration-300 hover:scale-[1.02] animate-slideInRight`}
          >
            <div
              className={`absolute bottom-0 left-0 h-0.5 ${isError ? 'bg-red-500' : 'bg-emerald-500'}`}
              style={{ width: '100%', animation: `shrink ${toast.duration}ms linear forwards` }}
            />
            <div className="flex items-start gap-3 p-4">
              <div className={`flex-shrink-0 ${colors.icon}`}>{colors.iconComponent}</div>
              <div className="flex-1 min-w-0">
                <h4 className={`font-semibold text-sm ${colors.title}`}>{toast.title}</h4>
              </div>
              <button onClick={() => removeToast(toast.id)} className="rounded-lg p-1 hover:bg-white/50">
                <X size={16} />
              </button>
            </div>
          </div>
        );
      })}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(120%) scale(0.9); opacity: 0; }
          to { transform: translateX(0) scale(1); opacity: 1; }
        }
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-slideInRight {
          animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}

export default ToastContainer;
