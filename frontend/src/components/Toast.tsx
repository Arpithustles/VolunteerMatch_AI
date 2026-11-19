import React, { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

type Toast = { id: number; message: string; type: "success" | "error" | "info" };
const ToastContext = createContext<{ push: (m: string, t?: Toast["type"]) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);
  const remove = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));
  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 w-full max-w-sm">
        {toasts.map((t) => (
          <div key={t.id} className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg text-sm bg-white dark:bg-slate-900 ${t.type === "success" ? "border-emerald-200" : t.type === "error" ? "border-rose-200" : "border-slate-200"}`}>
            {t.type === "success" ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : t.type === "error" ? <XCircle className="w-5 h-5 text-rose-600 shrink-0" /> : <Info className="w-5 h-5 text-slate-500 shrink-0" />}
            <p className="flex-1 text-slate-700 dark:text-slate-200">{t.message}</p>
            <button onClick={() => remove(t.id)} className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
};
