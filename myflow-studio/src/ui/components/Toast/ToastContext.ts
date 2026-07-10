import { createContext, useContext } from "react";

export type ToastTone = "neutral" | "success" | "warning" | "danger";

export interface ToastContextValue {
  show: (message: string, tone?: ToastTone, durationMs?: number) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider.");
  }
  return context;
}
