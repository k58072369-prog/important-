import { useEffect, useRef } from "react";

const OPENING_PLAYED_KEY = "furqan_opening_played";
export const PRAYER_ENABLED_KEY = "furqan_prayer_reminder_enabled";
const PRAYER_INTERVAL_MS = 300_000; // 5 minutes

export function isPrayerReminderEnabled(): boolean {
  return localStorage.getItem(PRAYER_ENABLED_KEY) !== "false";
}

export function setPrayerReminderEnabled(enabled: boolean): void {
  localStorage.setItem(PRAYER_ENABLED_KEY, enabled ? "true" : "false");
}

function tryPlay(src: string, volume = 0.65): void {
  try {
    const audio = new Audio(src);
    audio.volume = volume;
    audio.play().catch(() => {});
  } catch {}
}

export function AudioManager() {
  const prayerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Opening audio — play once per session (localStorage flag)
    const hasPlayed = localStorage.getItem(OPENING_PLAYED_KEY);
    if (!hasPlayed) {
      // Mark immediately so repeated fast mounts don't replay
      localStorage.setItem(OPENING_PLAYED_KEY, "1");
      // Slight delay to allow browser to settle before playing
      setTimeout(() => tryPlay("/audio/opening.mp3", 0.7), 800);
    }

    // Prayer reminder every 5 minutes
    const startPrayerTimer = () => {
      if (prayerTimerRef.current) clearInterval(prayerTimerRef.current);
      prayerTimerRef.current = setInterval(() => {
        if (isPrayerReminderEnabled()) {
          tryPlay("/audio/prayer.mp3", 0.6);
        }
      }, PRAYER_INTERVAL_MS);
    };

    startPrayerTimer();

    return () => {
      if (prayerTimerRef.current) clearInterval(prayerTimerRef.current);
    };
  }, []);

  return null;
}
