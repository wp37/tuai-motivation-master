import React, { useState, useEffect, useCallback } from 'react';

interface ToastMessage {
  id: number;
  message: string;
  type: 'error' | 'success' | 'info';
}

let toastListeners: ((msg: ToastMessage) => void)[] = [];
let toastId = 0;

export function showToast(message: string, type: 'error' | 'success' | 'info' = 'error') {
  toastId++;
  toastListeners.forEach(fn => fn({ id: toastId, message, type }));
}

const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const listener = (msg: ToastMessage) => {
      setToasts(prev => [...prev, msg]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== msg.id));
      }, 5000);
    };
    toastListeners.push(listener);
    return () => { toastListeners = toastListeners.filter(l => l !== listener); };
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-6 z-[60] space-y-2 max-w-sm">
      {toasts.map(toast => {
        const colorMap = {
          error: 'bg-[#1a0505]/95 border-red-500/50 text-red-200',
          success: 'bg-[#051a0a]/95 border-green-500/50 text-green-200',
          info: 'bg-[#05051a]/95 border-blue-500/50 text-blue-200',
        };
        const iconMap = {
          error: 'fa-solid fa-triangle-exclamation text-red-500',
          success: 'fa-solid fa-check-circle text-green-500',
          info: 'fa-solid fa-info-circle text-blue-500',
        };
        return (
          <div key={toast.id}
            className={`${colorMap[toast.type]} border p-4 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.3)] backdrop-blur-md animate-[slideIn_0.3s_ease-out]`}>
            <div className="flex items-start gap-3">
              <i className={`${iconMap[toast.type]} shrink-0 mt-0.5`}></i>
              <div>
                <p className="text-xs">{toast.message}</p>
                <button onClick={() => dismiss(toast.id)} className="text-[10px] underline mt-1.5 hover:text-white opacity-60 hover:opacity-100">Đóng</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;