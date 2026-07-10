import { ToastProvider } from "@ui/components";
import { AppShell } from "./AppShell";

export function SidePanelApp() {
  return (
    <ToastProvider>
      <AppShell />
    </ToastProvider>
  );
}
