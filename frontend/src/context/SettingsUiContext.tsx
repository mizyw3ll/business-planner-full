import { useMemo, type ReactNode } from "react";
import { SettingsUiContext, type SettingsTab } from "./SettingsContext";

export function SettingsUiProvider({
  children,
  openSettings,
}: {
  children: ReactNode;
  openSettings: (tab?: SettingsTab) => void;
}) {
  const value = useMemo(() => ({ openSettings }), [openSettings]);
  return <SettingsUiContext.Provider value={value}>{children}</SettingsUiContext.Provider>;
}
