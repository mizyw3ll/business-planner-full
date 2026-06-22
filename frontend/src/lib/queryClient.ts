import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

export const queryKeys = {
  user: ["user"] as const,
  tags: ["tags"] as const,
  currencies: ["currencies"] as const,
  businessPlans: ["businessPlans"] as const,
  financialPlans: ["financialPlans"] as const,
  notes: (projectId?: number | null, tagIds?: string, page?: number, perPage?: number) =>
    ["notes", projectId ?? "all", tagIds ?? "", page ?? 1, perPage ?? 10] as const,
  projects: ["projects"] as const,
  dashboard: ["dashboard"] as const,
  search: (query: string) => ["search", query] as const,
  taxEvents: ["taxEvents"] as const,
  kanbanBoards: ["kanbanBoards"] as const,
  kanbanBoard: (id: number) => ["kanbanBoard", id] as const,
  contacts: (isLead?: boolean) => ["contacts", isLead] as const,
  deals: (status?: string) => ["deals", status] as const,
  pipelineStats: ["pipelineStats"] as const,
};
