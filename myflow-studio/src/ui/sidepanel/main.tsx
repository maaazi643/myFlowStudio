import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SidePanelApp } from "./SidePanelApp";
import "../styles/tokens.css";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Side panel root element not found.");
}

createRoot(container).render(
  <StrictMode>
    <SidePanelApp />
  </StrictMode>,
);
