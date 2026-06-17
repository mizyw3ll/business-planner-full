import React, { createContext, useContext, useEffect, useState } from "react";

type VisualPreferences = {
  antigravity: boolean;
};

type VisualPreferencesContextType = {
  preferences: VisualPreferences;
  setPreference: (key: keyof VisualPreferences, value: boolean) => void;
};

const VisualPreferencesContext = createContext<VisualPreferencesContextType | undefined>(undefined);

const STORAGE_KEY = "remain_visual_prefs";

const DEFAULT_PREFS: VisualPreferences = {
  antigravity: false,
};

export function VisualPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<VisualPreferences>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return { ...DEFAULT_PREFS, ...JSON.parse(saved) };
      } catch (e) {
        return DEFAULT_PREFS;
      }
    }
    return DEFAULT_PREFS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    
    // Apply body classes for global effects
    const body = document.body;
    
    if (preferences.antigravity) body.classList.add("theme-antigravity");
    else body.classList.remove("theme-antigravity");
  }, [preferences]);

  const setPreference = (key: keyof VisualPreferences, value: boolean) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <VisualPreferencesContext.Provider value={{ preferences, setPreference }}>
      {children}
    </VisualPreferencesContext.Provider>
  );
}

export function useVisualPreferences() {
  const context = useContext(VisualPreferencesContext);
  if (context === undefined) {
    throw new Error("useVisualPreferences must be used within a VisualPreferencesProvider");
  }
  return context;
}
