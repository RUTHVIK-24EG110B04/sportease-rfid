import { createContext, useContext, useState } from "react";
import { statusTone } from "./api";

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  function push(message, kind = "ok") {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed right-4 top-4 z-[80] space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-in rounded-2xl px-4 py-3 text-sm shadow-lift ${
              t.kind === "err" ? "bg-rose-600 text-white" : "bg-navy-900 text-white"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}

export function Badge({ status }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone[status] || "bg-slate-100"}`}>
      {status}
    </span>
  );
}

export function Modal({ open, title, onClose, children, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-navy-950/50 p-0 sm:items-center sm:p-6">
      <button className="absolute inset-0" onClick={onClose} aria-label="Close" />
      <div className={`relative page-enter max-h-[92vh] overflow-auto rounded-t-3xl bg-white p-6 shadow-lift sm:rounded-3xl ${wide ? "w-full max-w-4xl" : "w-full max-w-lg"}`}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="rounded-full px-3 py-1 text-slate-500 hover:bg-slate-100">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Empty({ title, hint, action }) {
  return (
    <div className="page-enter rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
      <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-accent-soft text-2xl">🏅</div>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{hint}</p>
      {action}
    </div>
  );
}

export function SkeletonGrid({ n = 8 }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="skeleton h-44" />
      ))}
    </div>
  );
}

export function Field({ label, error, children }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block font-medium text-slate-700">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-rose-600">{error}</span> : null}
    </label>
  );
}

export function inputCls(error) {
  return `w-full rounded-2xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-accent/30 ${
    error ? "border-rose-400 animate-[shake_0.3s_ease]" : "border-slate-200 focus:border-accent"
  }`;
}

export function Primary({ children, className = "", ...props }) {
  return (
    <button
      className={`btn-press inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-accent-dark disabled:opacity-60 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Ghost({ children, className = "", ...props }) {
  return (
    <button
      className={`btn-press inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-navy-900 hover:bg-slate-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Stat({ label, value, icon }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-card">
      <div className="flex items-start justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-accent-soft text-lg">{icon}</div>
      </div>
      <p className="mt-3 text-3xl font-extrabold tracking-tight">{value}</p>
    </div>
  );
}
