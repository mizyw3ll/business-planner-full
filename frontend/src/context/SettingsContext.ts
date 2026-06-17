import { createContext } from "react";

export type SettingsTab = "main" | "profile" | "appearance" | "about";

type SettingsUiContextValue = {
  openSettings: (tab?: SettingsTab) => void;
};

export const SettingsUiContext = createContext<SettingsUiContextValue | null>(null);
