import { useEffect } from "react";


export const usePerformanceMonitoring = () => {
  useEffect(() => {
    if (typeof window === "undefined" || !("performance" in window)) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === "longtask") {
          console.warn("[Performance] Long task detected:", entry.duration, "ms");
        }
        if (entry.entryType === "layout-shift") {
          console.warn("[Performance] Layout shift:", (entry as any).value);
        }
      }
    });

    try {
      observer.observe({ entryTypes: ["longtask", "layout-shift"] });
    } catch {
      // Some browsers don't support all entry types
    }

    return () => observer.disconnect();
  }, []);
};
