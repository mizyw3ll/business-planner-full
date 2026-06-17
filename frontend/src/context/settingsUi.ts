import { useContext, useState, useCallback } from "react";
import { SettingsUiContext, type SettingsTab } from "./SettingsContext";

export function useSettingsUi() {
  const ctx = useContext(SettingsUiContext);
  if (!ctx) throw new Error("useSettingsUi must be used inside SettingsUiProvider");
  return ctx;
}

export function useSettingsModalState() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<SettingsTab>("main");

  const openModal = useCallback((nextTab: SettingsTab = "main") => {
    setTab(nextTab);
    setOpen(true);
  }, []);

  const closeModal = useCallback(() => setOpen(false), []);

  return { open, tab, openModal, closeModal };
}
