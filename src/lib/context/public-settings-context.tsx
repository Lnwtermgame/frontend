"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  publicSettingsApi,
  PublicSiteSettings,
} from "@/lib/services/public-settings-api";

type PublicSettingsContextValue = {
  settings: PublicSiteSettings | null;
  loading: boolean;
  reload: () => Promise<void>;
};

const PublicSettingsContext = createContext<PublicSettingsContextValue | null>(
  null,
);

const SETTINGS_CACHE_KEY = "public_settings_cache";

export function PublicSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PublicSiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const response = await publicSettingsApi.getPublicSettings();
      setSettings(response.data);
      // Persist to localStorage for instant restore next time
      try {
        localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(response.data));
      } catch { /* quota exceeded — ignore */ }
    } catch {
      // keep existing settings if we have them
    } finally {
      setLoading(false);
    }
  }, []);

  // On mount: restore from cache first (instant), then fetch fresh data
  useEffect(() => {
    try {
      const cached = localStorage.getItem(SETTINGS_CACHE_KEY);
      if (cached) {
        setSettings(JSON.parse(cached));
        setLoading(false); // cached data available — no skeleton needed
      }
    } catch { /* ignore parse errors */ }
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      loadSettings();
    }, 60_000);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadSettings();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [loadSettings]);

  return (
    <PublicSettingsContext.Provider
      value={{ settings, loading, reload: loadSettings }}
    >
      {children}
    </PublicSettingsContext.Provider>
  );
}

export function usePublicSettings() {
  const ctx = useContext(PublicSettingsContext);
  if (!ctx) {
    throw new Error(
      "usePublicSettings must be used within PublicSettingsProvider",
    );
  }
  return ctx;
}
