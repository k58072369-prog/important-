export interface SplashSettings {
  enabled: boolean;
  autoplay: boolean;
  playOnce: boolean;
  skipButtonText: string;
}

const KEY = "furqan_splash_settings";
const PLAYED_KEY = "furqan_splash_played";

const DEFAULTS: SplashSettings = {
  enabled: true,
  autoplay: true,
  playOnce: true,
  skipButtonText: "تخطي",
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

export function hasPlayedBefore(): boolean {
  return localStorage.getItem(PLAYED_KEY) === "1";
}

export function markAsPlayed(): void {
  try {
    localStorage.setItem(PLAYED_KEY, "1");
  } catch {
    // ignore
  }
}

export function clearPlayedFlag(): void {
  try {
    localStorage.removeItem(PLAYED_KEY);
  } catch {
    // ignore
  }
}

export function shouldShowIntro(): boolean {
  const settings = getSplashSettings();
  if (!settings.enabled) return false;
  if (settings.playOnce && hasPlayedBefore()) return false;
  return true;
}
