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
      <button
        type="button"
        onClick={() => {
          void openStudio();
        }}
        style={{
          width: "100%",
          padding: "10px 14px",
          borderRadius: 8,
          border: "none",
          background: "var(--accent)",
          color: "var(--accent-ink)",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Open MyFlow Studio →
      </button>
    </div>
  );
}
