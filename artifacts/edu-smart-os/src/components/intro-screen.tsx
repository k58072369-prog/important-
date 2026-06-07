import { useEffect, useRef, useState } from "react";
import { getVideoBlobUrl } from "@/lib/intro-video-db";
import { getSplashSettings, markAsPlayed } from "@/lib/splash-settings";

interface IntroScreenProps {
  onDone: () => void;
}

export function IntroScreen({ onDone }: IntroScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(true);
  const settings = getSplashSettings();
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const blobUrl = await getVideoBlobUrl();
      if (cancelled) return;

      if (blobUrl) {
        blobUrlRef.current = blobUrl;
        setVideoSrc(blobUrl);
      } else {
        setVideoSrc("/intro.mp4");
      }
      setLoading(false);
    }

    load();

    return () => {
      cancelled = true;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (videoSrc && videoRef.current && settings.autoplay) {
      videoRef.current.play().catch(() => {});
    }
  }, [videoSrc, settings.autoplay]);

  function handleDone() {
    markAsPlayed();
    setVisible(false);
    setTimeout(onDone, 350);
  }

  function handleVideoEnd() {
    handleDone();
  }

  if (!visible) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black transition-opacity duration-300 opacity-0 pointer-events-none" />
    );
  }

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
      style={{ direction: "rtl" }}
    >
      {loading && (
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full border-4 border-emerald-500/30 border-t-emerald-500 animate-spin" />
          <p className="text-emerald-400/70 text-sm font-medium">جاري التحميل...</p>
        </div>
      )}

      {videoSrc && (
        <video
          ref={videoRef}
          src={videoSrc}
          className="w-full h-full object-cover"
          style={{ display: loading ? "none" : "block" }}
          onLoadedData={() => setLoading(false)}
          onEnded={handleVideoEnd}
          onError={handleDone}
          playsInline
          preload="auto"
        />
      )}

      <button
        onClick={handleDone}
        className="
          absolute top-6 left-6
          flex items-center gap-2
          px-5 py-2.5
          rounded-full
          bg-black/50 backdrop-blur-sm
          border border-white/20
          text-white text-sm font-bold
          hover:bg-white/20 hover:border-white/40
          active:scale-95
          transition-all duration-200
          shadow-lg
          z-10
        "
        style={{ fontFamily: "inherit" }}
      >
        <span>{settings.skipButtonText || "تخطي"}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="13 17 18 12 13 7" />
          <polyline points="6 17 11 12 6 7" />
        </svg>
      </button>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-none">
        <div className="w-8 h-0.5 rounded-full bg-white/30" />
      </div>
    </div>
  );
}
