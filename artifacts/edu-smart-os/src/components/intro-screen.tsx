import { useEffect, useRef, useState, useCallback } from "react";
import { getVideoBlobUrl } from "@/lib/intro-video-db";
import { getSplashSettings, markAsPlayed } from "@/lib/splash-settings";

const MAX_WAIT_MS = 6000; // hard cap — skip intro if nothing happens within 6s

interface IntroScreenProps {
  onDone: () => void;
}

export function IntroScreen({ onDone }: IntroScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const blobUrlRef = useRef<string | null>(null);
  const doneCalledRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settings = getSplashSettings();

  const finish = useCallback(() => {
    if (doneCalledRef.current) return;
    doneCalledRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    markAsPlayed();
    onDone();
  }, [onDone]);

  // Hard safety timeout — never leave user stuck on intro screen
  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      if (!doneCalledRef.current) finish();
    }, MAX_WAIT_MS);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [finish]);

  // Load video source (custom from IndexedDB, or default)
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const blobUrl = await getVideoBlobUrl();
        if (cancelled) return;
        if (blobUrl) {
          blobUrlRef.current = blobUrl;
          setVideoSrc(blobUrl);
        } else {
          setVideoSrc("/intro.mp4");
        }
      } catch {
        if (!cancelled) setVideoSrc("/intro.mp4");
      }
    }

    load();

    return () => {
      cancelled = true;
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  // Autoplay once source is set
  useEffect(() => {
    if (!videoSrc || !videoRef.current) return;
    const vid = videoRef.current;
    vid.muted = true;
    if (settings.autoplay) {
      vid.play().catch(() => {
        // If autoplay fails for any reason, skip intro immediately
        finish();
      });
    }
  }, [videoSrc, settings.autoplay, finish]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "#000",
        overflow: "hidden",
      }}
    >
      {/* Video fills the screen */}
      {videoSrc && (
        <video
          ref={videoRef}
          src={videoSrc}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: videoReady ? 1 : 0,
            transition: "opacity 0.4s ease",
          }}
          playsInline
          muted
          autoPlay={settings.autoplay}
          preload="auto"
          onCanPlay={() => setVideoReady(true)}
          onEnded={finish}
          onError={finish}
          onStalled={finish}
          onAbort={finish}
        />
      )}

      {/* Loading indicator — shows until video is ready */}
      {!videoReady && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              border: "3px solid rgba(16,185,129,0.25)",
              borderTopColor: "#10b981",
              animation: "ispin 0.85s linear infinite",
            }}
          />
          <p
            style={{
              color: "rgba(52,211,153,0.7)",
              fontSize: 13,
              margin: 0,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            جاري التحميل...
          </p>
        </div>
      )}

      {/* Skip button — always visible */}
      <button
        onClick={finish}
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(5,150,105,0.9)",
          backdropFilter: "blur(8px)",
          color: "#fff",
          border: "1px solid rgba(16,185,129,0.4)",
          borderRadius: 9999,
          padding: "10px 22px",
          fontSize: 15,
          fontWeight: 700,
          fontFamily: "system-ui, sans-serif",
          cursor: "pointer",
          boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
        }}
      >
        <span>تخطي</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transform: "rotate(180deg)" }}
        >
          <polyline points="13 17 18 12 13 7" />
          <polyline points="6 17 11 12 6 7" />
        </svg>
      </button>

      {/* Branding at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 28,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          pointerEvents: "none",
        }}
      >
        <p
          style={{
            color: "rgba(52,211,153,0.8)",
            fontSize: 15,
            fontWeight: 700,
            margin: 0,
            fontFamily: "system-ui, sans-serif",
            textShadow: "0 2px 8px rgba(0,0,0,0.8)",
          }}
        >
          مكتب الفرقان لتحفيظ القرآن الكريم
        </p>
      </div>

      <style>{`@keyframes ispin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
