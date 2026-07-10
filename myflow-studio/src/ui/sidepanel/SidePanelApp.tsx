import type { CSSProperties } from "react";
import pkg from "../../../package.json";

const shellStyle: CSSProperties = {
  minHeight: "100vh",
  padding: "28px 24px",
};

const cardStyle: CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--line)",
  borderRadius: 10,
  padding: "16px 18px",
  marginTop: 20,
};

export function SidePanelApp() {
  return (
    <div style={shellStyle}>
      <p className="eyebrow">MyFlow Studio · v{pkg.version}</p>
      <h1 style={{ margin: 0, fontSize: 22 }}>Hello, Studio.</h1>
      <p style={{ color: "var(--ink-soft)", maxWidth: "42ch" }}>
        The build scaffold is live. Prompt management, the generation queue, and the automation
        engine arrive in the milestones ahead.
      </p>
      <div style={cardStyle}>
        <strong style={{ fontSize: 13 }}>Milestone M0 — Foundations &amp; tooling</strong>
        <p style={{ color: "var(--ink-soft)", fontSize: 13, margin: "4px 0 0" }}>
          Vite + React + strict TypeScript are wired up, the MV3 manifest resolves, and this side
          panel boots. Next up: M1 — design system &amp; app shell.
        </p>
      </div>
    </div>
  );
}
