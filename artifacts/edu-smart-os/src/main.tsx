import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// Hide the native HTML loader once React is ready
function hideNativeLoader() {
  const loader = document.getElementById("native-loader");
  if (loader) {
    loader.classList.add("hidden");
    setTimeout(() => loader.remove(), 600);
  }
  // Restore body background after React takes over
  document.body.style.background = "";
}

const rootEl = document.getElementById("root")!;

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Hide native loader as soon as React starts rendering
hideNativeLoader();
