import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getSplashSettings, getCachedVideoUrl } from "@/lib/splash-settings";

interface SplashScreenProps {
  onDone: () => void;
}

export function SplashScreen({ onDone }: SplashScreenProps) {
  const settings = getSplashSettings();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoSrc, setVideoSrc] = useState<string>("");
  const [visible, setVisible] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const doneCalledRef = useRef(false);

  const finish = useCallback(() => {
    if (doneCalledRef.current) return;
    doneCalledRef.current = true;
    setVisible(false);
    setTimeout(onDone, 600);
  }, [onDone]);

  useEffect(() => {
    if (!settings.enabled) {
      onDone();
      return;
    }

    let objectUrl: string | null = null;

    getCachedVideoUrl(settings.videoUrl)
      .then((url) => {
        if (url !== settings.videoUrl) objectUrl = url;
        setVideoSrc(url);
      })
      .catch(() => {
        setVideoSrc(settings.videoUrl);
      });

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [settings.enabled, settings.videoUrl, onDone]);

  useEffect(() => {
    if (!videoSrc || !videoRef.current) return;
    const vid = videoRef.current;

    if (settings.autoplay) {
      const playPromise = vid.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          vid.muted = true;
          vid.play().catch(() => {
            finish();
          });
        });
      }
    }
  }, [videoSrc, settings.autoplay, finish]);

  if (!settings.enabled) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
        >
          {videoSrc && !videoError ? (
            <video
              ref={videoRef}
              src={videoSrc}
              className="w-full h-full object-cover"
              playsInline
              autoPlay={settings.autoplay}
              onEnded={finish}
              onError={() => {
                setVideoError(true);
                finish();
              }}
            />
          ) : null}

          {videoError && (
            <div className="text-white text-center space-y-4">
              <p className="text-xl opacity-60">جارٍ تحميل النظام...</p>
            </div>
          )}

          <motion.button
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            onClick={finish}
            className="absolute top-6 left-6 z-10 flex items-center gap-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white border border-white/20 rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-200 hover:scale-105 cursor-pointer"
            dir="rtl"
          >
            <span>{settings.skipButtonText}</span>
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
              className="rotate-180"
            >
              <polyline points="13 17 18 12 13 7" />
              <polyline points="6 17 11 12 6 7" />
            </svg>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
