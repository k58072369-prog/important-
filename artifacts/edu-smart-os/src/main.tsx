import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// ─── Native loader (shown before React mounts) ────────────────────────────────
function hideNativeLoader() {
  const loader = document.getElementById("native-loader");
  if (loader) {
    loader.classList.add("hidden");
    setTimeout(() => loader.remove(), 600);
  }
  document.body.style.background = "";
}

// ─── Diagnostic fallback — shown instead of white/blank screen ────────────────
function showDiagnosticScreen(error: unknown) {
  const msg = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? (error.stack ?? "") : "";

  try {
    const log = JSON.parse(localStorage.getItem("furqan_startup_errors") ?? "[]");
    log.unshift({ time: new Date().toISOString(), message: msg, stack });
    localStorage.setItem("furqan_startup_errors", JSON.stringify(log.slice(0, 20)));
  } catch { /* ignore */ }

  const root = document.getElementById("root");
  if (!root) return;
  root.innerHTML = `
    <div dir="rtl" style="min-height:100dvh;background:#0a0a0a;display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui,sans-serif;">
      <div style="max-width:520px;width:100%;text-align:center;">
        <div style="width:80px;height:80px;border-radius:50%;background:rgba(239,68,68,0.12);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0 0 8px;">فشل تشغيل النظام</h1>
        <p style="color:rgba(255,255,255,0.5);font-size:14px;margin:0 0 20px;">
          حدث خطأ أثناء بدء التشغيل. البيانات المحلية محفوظة بأمان ولم تُفقد.
        </p>
        <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:12px;padding:16px;margin-bottom:20px;text-align:right;">
          <p style="color:#f87171;font-size:12px;font-weight:600;margin:0 0 4px;">سبب الخطأ:</p>
          <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:0;font-family:monospace;word-break:break-all;">${msg}</p>
          ${stack ? `<details style="margin-top:8px;cursor:pointer;"><summary style="color:rgba(255,255,255,0.4);font-size:11px;">التفاصيل التقنية</summary><pre style="color:rgba(255,255,255,0.3);font-size:10px;margin-top:6px;overflow:auto;max-height:120px;white-space:pre-wrap;">${stack.slice(0, 800)}</pre></details>` : ""}
        </div>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
          <button onclick="window.location.reload()" style="padding:12px 28px;background:#10b981;color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;font-family:system-ui,sans-serif;">
            إعادة المحاولة
          </button>
          <button onclick="localStorage.clear();window.location.reload()" style="padding:12px 28px;background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);border:1px solid rgba(255,255,255,0.15);border-radius:12px;font-size:14px;cursor:pointer;font-family:system-ui,sans-serif;">
            إعادة ضبط الكاش
          </button>
        </div>
        <p style="color:rgba(255,255,255,0.25);font-size:11px;margin-top:20px;">مكتب الفرقان — نظام التخزين المحلي</p>
      </div>
    </div>
  `;
}

// ─── Safe mount ───────────────────────────────────────────────────────────────
try {
  const rootEl = document.getElementById("root");
  if (!rootEl) throw new Error("عنصر #root غير موجود في صفحة HTML");

  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>
  );

  hideNativeLoader();
} catch (err) {
  console.error("[EDU SMART OS] Startup error:", err);
  hideNativeLoader();
  showDiagnosticScreen(err);
}
