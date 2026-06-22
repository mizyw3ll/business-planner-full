import { useEffect } from "react";

/**
 * Watches for Chrome's -webkit-autofill class and forces background color.
 * Chrome applies autofill at engine level, bypassing normal CSS.
 * MutationObserver detects class changes and overrides inline styles.
 */
export function useAutofillFix(ref: React.RefObject<HTMLInputElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const updateBackground = () => {
      if (el.matches(":-webkit-autofill")) {
        const isDark =
          !document.documentElement.dataset.theme ||
          document.documentElement.dataset.theme === "dark";
        el.style.setProperty(
          "background-color",
          isDark ? "rgba(20, 17, 48, 0.95)" : "#ffffff",
          "important",
        );
        el.style.setProperty(
          "-webkit-text-fill-color",
          isDark ? "#f0eeff" : "#0f172a",
          "important",
        );
      }
    };

    // Run immediately
    updateBackground();

    // Watch for class attribute changes (Chrome adds -webkit-autofill)
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === "class") {
          updateBackground();
        }
      }
    });
    observer.observe(el, { attributes: true, attributeFilter: ["class"] });

    // Also poll briefly to catch fast autofill
    const interval = setInterval(updateBackground, 50);
    setTimeout(() => clearInterval(interval), 3000);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, [ref]);
}
