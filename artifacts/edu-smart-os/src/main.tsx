import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div dir="rtl" className="min-h-[100dvh] font-sans bg-background text-foreground">
      <App />
    </div>
  </StrictMode>
);
