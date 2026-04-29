import React from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

const toneMap = {
  success: {
    wrapper: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    icon: <CheckCircle2 size={18} />,
  },
  error: {
    wrapper: 'border-rose-200 bg-rose-50 text-rose-800',
    icon: <AlertCircle size={18} />,
  },
  info: {
    wrapper: 'border-blue-200 bg-blue-50 text-blue-800',
    icon: <Info size={18} />,
  },
};

const ToastStack = ({ toasts }) => {
  if (!toasts?.length) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-20 z-[70] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-3">
      {toasts.map((toast) => {
        const tone = toneMap[toast.tone] || toneMap.info;

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-[0_14px_30px_rgba(15,23,42,0.12)] ${tone.wrapper}`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">{tone.icon}</div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.message && <p className="mt-1 text-sm opacity-90">{toast.message}</p>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ToastStack;
