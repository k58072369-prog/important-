import { useEffect, useRef, useState, useCallback } from "react";
import { getVideoBlobUrl } from "@/lib/intro-video-db";
import { getSplashSettings, markAsPlayed } from "@/lib/splash-settings";

interface IntroScreenProps {
  onDone: () => void;
}

export function IntroScreen({ onDone }: IntroScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [visible, setVisible] = useState(true);
  const settings = getSplashSettings();
  const blobUrlRef = useRef<string | null>(null);
  const doneCalledRef = useRef(false);

  const finish = useCallback(() => {
    if (doneCalledRef.current) return;
    doneCalledRef.current = true;
    markAsPlayed();
    setVisible(false);
    setTimeout(onDone, 500);
  }, [onDone]);

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
    if (!videoSrc || !videoRef.current) return;
    const vid = videoRef.current;

    vid.muted = true;

    if (settings.autoplay) {
      const playPromise = vid.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          finish();
        });
      }
    }
  }, [videoSrc, settings.autoplay, finish]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
      style={{ direction: "rtl" }}
    >
      {videoSrc && (
        <video
          ref={videoRef}
          src={videoSrc}
          className="w-full h-full object-cover"
          playsInline
          muted
          autoPlay={settings.autoplay}
          preload="auto"
          onEnded={finish}
          onError={finish}
        />
      )}

      <button
        onClick={finish}
        className="absolute top-6 left-6 z-10 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full px-6 py-3 text-base font-bold transition-all duration-200 hover:scale-105 cursor-pointer shadow-lg shadow-black/40"
      >
        <span>{settings.skipButtonText || "تخطي"}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="rotate-180"
        >
          <polyline points="13 17 18 12 13 7" />
          <polyline points="6 17 11 12 6 7" />
        </svg>
      </button>
    </div>
  );
}
