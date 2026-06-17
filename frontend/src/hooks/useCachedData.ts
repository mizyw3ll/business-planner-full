import { useQuery } from "@tanstack/react-query";
import {
  getBusinessPlansApi,
  getCurrenciesApi,
  getDashboardApi,
  getFinancialPlansApi,
  getNotesApi,
  getProjectsApi,
  getTagsApi,
  getTaxEventsApi,
  getBoardsApi,
  getBoardApi,
  getContacts,
  getDeals,
  getPipelineStats,
  meApi,
  searchApi,
} from "../api";
import { queryKeys } from "../lib/queryClient";

export function useUserQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.user,
    queryFn: meApi,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useTagsQuery() {
  return useQuery({
    queryKey: queryKeys.tags,
    queryFn: getTagsApi,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCurrenciesQuery() {
  return useQuery({
    queryKey: queryKeys.currencies,
    queryFn: getCurrenciesApi,
    staleTime: 15 * 60 * 1000,
  });
}

export function useBusinessPlansQuery() {
  return useQuery({
    queryKey: queryKeys.businessPlans,
    queryFn: getBusinessPlansApi,
    staleTime: 30 * 1000,
  });
}

export function useFinancialPlansQuery() {
  return useQuery({
    queryKey: queryKeys.financialPlans,
    queryFn: () => getFinancialPlansApi(false),
    staleTime: 30 * 1000,
  });
}

export function useProjectsQuery() {
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: getProjectsApi,
    staleTime: 60 * 1000,
  });
}

export function useNotesQuery(projectId?: number | null, tagIds?: string, page?: number, perPage?: number) {
  return useQuery({
    queryKey: queryKeys.notes(projectId, tagIds, page, perPage),
    queryFn: () =>
      getNotesApi({
        project_id: projectId ?? undefined,
        tag_ids: tagIds,
        page: page ?? 1,
        per_page: perPage ?? 10,
      }),
    staleTime: 30 * 1000,
  });
}

export function useDashboardQuery() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: getDashboardApi,
    staleTime: 30 * 1000,
  });
}

export function useSearchQuery(query: string) {
  return useQuery({
    queryKey: queryKeys.search(query),
    queryFn: () => searchApi(query),
    enabled: query.length >= 1,
    staleTime: 10 * 1000,
  });
}

export function useTaxEventsQuery() {
  return useQuery({
    queryKey: queryKeys.taxEvents,
    queryFn: getTaxEventsApi,
    staleTime: 30 * 1000,
  });
}
export function useKanbanBoardsQuery() {
  return useQuery({
    queryKey: queryKeys.kanbanBoards,
    queryFn: getBoardsApi,
    staleTime: 30 * 1000,
  });
}

export function useKanbanBoardQuery(id: number | null) {
  return useQuery({
    queryKey: queryKeys.kanbanBoard(id ?? 0),
    queryFn: () => getBoardApi(id!),
    enabled: id !== null,
    staleTime: 30 * 1000,
  });
}

export function useContactsQuery(isLead?: boolean) {
  return useQuery({
    queryKey: queryKeys.contacts(isLead),
    queryFn: () => getContacts(isLead),
    staleTime: 30 * 1000,
  });
}

export function useDealsQuery(status?: string) {
  return useQuery({
    queryKey: queryKeys.deals(status),
    queryFn: () => getDeals(status),
    staleTime: 30 * 1000,
  });
}

export function usePipelineStatsQuery() {
  return useQuery({
    queryKey: queryKeys.pipelineStats,
    queryFn: getPipelineStats,
    staleTime: 30 * 1000,
  });
}
