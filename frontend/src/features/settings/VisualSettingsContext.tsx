import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type VisualSettings = {
  auroraOrbs: boolean;
  particles: boolean;
  gridOverlay: boolean;
};

type VisualSettingsContextType = {
  settings: VisualSettings;
  toggle: (key: keyof VisualSettings) => void;
};

const defaults: VisualSettings = {
  auroraOrbs: true,
  particles: true,
  gridOverlay: true,
};

const STORAGE_KEY = "visual-settings";

function loadSettings(): VisualSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch {}
  return defaults;
}

function saveSettings(s: VisualSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

const VisualSettingsContext = createContext<VisualSettingsContextType>({
  settings: defaults,
  toggle: () => {},
});

export function VisualSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<VisualSettings>(loadSettings);

  useEffect(() => {
    saveSettings(settings);
    const root = document.documentElement;
    if (!settings.auroraOrbs) root.classList.add("no-aurora");
    else root.classList.remove("no-aurora");
    if (!settings.particles) root.classList.add("no-particles");
    else root.classList.remove("no-particles");
    if (!settings.gridOverlay) root.classList.add("no-grid");
    else root.classList.remove("no-grid");
  }, [settings]);

  function toggle(key: keyof VisualSettings) {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return <VisualSettingsContext.Provider value={{ settings, toggle }}>{children}</VisualSettingsContext.Provider>;
}

export function useVisualSettings() {
  return useContext(VisualSettingsContext);
}
