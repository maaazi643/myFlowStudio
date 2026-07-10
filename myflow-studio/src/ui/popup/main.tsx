import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PopupApp } from "./PopupApp";
import "../styles/tokens.css";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Popup root element not found.");
}

createRoot(container).render(
  <StrictMode>
    <PopupApp />
  </StrictMode>,
);
