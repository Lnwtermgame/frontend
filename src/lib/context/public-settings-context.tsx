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

export function PublicSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PublicSiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await publicSettingsApi.getPublicSettings();
      setSettings(response.data);
    } catch {
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
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
    throw new Error("usePublicSettings must be used within PublicSettingsProvider");
  }
  return ctx;
}
