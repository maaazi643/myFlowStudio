import { Button } from "@ui/components";
import pkg from "../../../package.json";

async function openStudio(): Promise<void> {
  const currentWindow = await chrome.windows.getCurrent();
  if (currentWindow.id === undefined) {
    return;
  }
  await chrome.sidePanel.open({ windowId: currentWindow.id });
  window.close();
}

export function PopupApp() {
  return (
    <div style={{ padding: 16 }}>
      <p className="eyebrow">MyFlow Studio · v{pkg.version}</p>
      <p style={{ color: "var(--ink-soft)", fontSize: 13, margin: "0 0 14px" }}>
        The full queue, prompts, and settings live in the side panel.
      </p>
      <Button
        fullWidth
        onClick={() => {
          void openStudio();
        }}
      >
        Open MyFlow Studio →
      </Button>
    </div>
  );
}
