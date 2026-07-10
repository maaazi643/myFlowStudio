import { useCallback, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { cssClass } from "@ui/utils/cssModule";
import { ToastContext } from "./ToastContext";
import type { ToastTone } from "./ToastContext";
import styles from "./Toast.module.css";

interface ToastEntry {
  id: number;
  message: string;
  tone: ToastTone;
}

const toneClass: Record<ToastTone, string> = {
  neutral: "",
  success: cssClass(styles.success),
  warning: cssClass(styles.warning),
  danger: cssClass(styles.danger),
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const nextId = useRef(0);

  const show = useCallback((message: string, tone: ToastTone = "neutral", durationMs = 4000) => {
    const id = nextId.current;
    nextId.current += 1;
    setToasts((current) => [...current, { id, message, tone }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, durationMs);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {createPortal(
        <div className={styles.stack}>
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={[styles.toast, toneClass[toast.tone]].filter(Boolean).join(" ")}
              role="status"
            >
              {toast.message}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
