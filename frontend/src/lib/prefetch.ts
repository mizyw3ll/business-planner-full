const routePrefetchMap: Record<string, () => Promise<unknown>> = {
  "/dashboard": () => import("../pages/HomePage"),
  "/business-plans": () => import("../pages/BusinessPlansPage"),
  "/notes": () => import("../pages/NotesPage"),
  "/calendar": () => import("../pages/CalendarPage"),
  "/financial-plans": () => import("../pages/FinancialPlansPage"),
  "/kanban": () => import("../pages/KanbanPage"),
  "/crm": () => import("../pages/CrmPage"),
  "/notifications": () => import("../pages/NotificationsPage"),
  "/search": () => import("../pages/SearchPage"),
  "/tax-calendar": () => import("../pages/TaxCalendarPage"),
};

const prefetched = new Set<string>();

export function prefetchRoute(path: string) {
  const base = path.split("?")[0].replace(/\/\d+$/, "");
  if (prefetched.has(base)) return;
  const loader = routePrefetchMap[base];
  if (loader) {
    prefetched.add(base);
    loader();
  }
}
