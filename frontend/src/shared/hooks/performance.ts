import { useEffect } from "react";


export const usePerformanceMonitoring = () => {
  useEffect(() => {
    if (typeof window === "undefined" || !("performance" in window)) return;

    const observer = new PerformanceObserver(() => {});

    try {
      observer.observe({ entryTypes: ["longtask", "layout-shift"] });
    } catch {
      // Some browsers don't support all entry types
    }

    return () => observer.disconnect();
  }, []);
};
