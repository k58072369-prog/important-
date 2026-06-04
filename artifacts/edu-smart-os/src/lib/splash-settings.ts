export interface SplashSettings {
  enabled: boolean;
  autoplay: boolean;
  skipButtonText: string;
  videoUrl: string;
}

const KEY = "furqan_splash_settings";

const DEFAULTS: SplashSettings = {
  enabled: true,
  autoplay: true,
  skipButtonText: "تخطي",
  videoUrl: "/intro.mp4",
};

export function getSplashSettings(): SplashSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSplashSettings(settings: SplashSettings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

const CACHE_NAME = "furqan-splash-video-v1";

export async function getCachedVideoUrl(videoUrl: string): Promise<string> {
  try {
    if (!("caches" in window)) return videoUrl;
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(videoUrl);
    if (cached) {
      const blob = await cached.blob();
      return URL.createObjectURL(blob);
    }
    const resp = await fetch(videoUrl);
    if (resp.ok) {
      await cache.put(videoUrl, resp.clone());
      const blob = await resp.blob();
      return URL.createObjectURL(blob);
    }
    return videoUrl;
  } catch {
    return videoUrl;
  }
}

export async function clearVideoCache(): Promise<void> {
  try {
    if ("caches" in window) {
      await caches.delete(CACHE_NAME);
    }
  } catch {
    // ignore
  }
}
