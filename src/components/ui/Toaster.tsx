"use client";
import { useSyncExternalStore } from "react";

export type ToastKind = "success" | "error" | "info";
export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

let toasts: Toast[] = [];
const listeners = new Set<() => void>();
let nextId = 1;

function emit() {
  Array.from(listeners).forEach(l => l());
}

export function toast(message: string, kind: ToastKind = "info") {
  const id = nextId++;
  toasts = [...toasts, { id, kind, message }];
  emit();
  setTimeout(() => {
    toasts = toasts.filter(t => t.id !== id);
    emit();
  }, 3500);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function getSnapshot() {
  return toasts;
}

export function Toaster({ children }: { children: React.ReactNode }) {
  const current = useSyncExternalStore(subscribe, getSnapshot);
  return (
    <>
      {children}
      <div className="fixed bottom-20 lg:bottom-6 right-4 z-[100] flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm">
        {current.map(t => (
          <div key={t.id}
            className="animate-fadeIn px-4 py-3 rounded-lg shadow-md text-sm font-medium border"
            style={{
              background: "var(--card-bg)",
              borderColor: t.kind === "error" ? "var(--danger)" : t.kind === "success" ? "var(--success)" : "var(--border)",
              color: t.kind === "error" ? "var(--danger)" : t.kind === "success" ? "var(--success)" : "var(--text)",
            }}>
            {t.message}
          </div>
        ))}
      </div>
    </>
  );
}