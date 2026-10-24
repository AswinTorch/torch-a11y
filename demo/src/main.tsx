import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initA11y } from "torch-a11y";
import { App } from "./app";
import "./styles.css";

// Before the first render, so nothing paints at the wrong size or contrast.
initA11y();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
