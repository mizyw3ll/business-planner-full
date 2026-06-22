import axios from "axios";
import { extractApiError } from "./shared/utils/extractApiError";

export const TOKEN_KEY = "remain.accessToken";

export type User = {
  id: number;
  email: string;
  username: string;
  first_name?: string | null;
  last_name?: string | null;
  is_active?: boolean;
  is_verified?: boolean;
};

export type BusinessPlan = {
  id: number;
  user_id?: number;
  title: string;
  description?: string | null;
  blocks?: PlanBlock[];
  tags?: Tag[];
  created_at: string;
  updated_at?: string;
};

export type FinancialPlan = {
  id: number;
  user_id?: number;
  title: string;
  description?: string | null;
  currency_id: number;
  is_active: boolean;
  chart_points?: ChartPoint[];
  created_at: string;
  updated_at?: string;
};

export type Currency = {
  id: number;
  code: string;
  name: string;
  kind: string;
  is_active: boolean;
  is_popular: boolean;
};

export type Tag = {
  id: number;
  user_id: number;
  name: string;
  color_idx: number;
  created_at: string;
};

export type Template = {
  id: number;
  title: string;
  description?: string | null;
  category: string;
  blocks?: object[];
  is_public: boolean;
};

export type PlanBlock = {
  id: number;
  business_plan_id: number;
  title: string;
  content: string;
  block_type: string;
  rich_content?: object | null;
  media_attachments?: object[];
  linked_financial_chart_ids: number[];
  has_unpublished_draft: boolean;
  draft_saved_at?: string | null;
  tags?: Tag[];
  due_date?: string | null;
  comments_count?: number;
};

export type BusinessPlanAnalytics = {
  plan_id: number;
  blocks_count: number;
  drafts_count: number;
  comments_count: number;
  attachments_count: number;
  linked_financial_charts_count: number;
  rich_blocks_count: number;
  total_content_chars: number;
  average_content_chars: number;
  block_type_breakdown: Record<string, number>;
};

export type ChartPoint = {
  id: number;
  chart_id: number;
  date: string;
  type: "income" | "expense";
  amount: string;
  description?: string | null;
};

export type FinancialChartAnalyticsPoint = {
  date: string;
  income: number;
  expense: number;
  net: number;
  cumulative: number;
};

export type FinancialChartAnalytics = {
  chart_id: number;
  currency_code: string;
  points_count: number;
  income_total: number;
  expense_total: number;
  net_total: number;
  average_daily_net: number;
  average_point_net: number;
  first_point_at?: string | null;
  last_point_at?: string | null;
  series: FinancialChartAnalyticsPoint[];
};

export type AITextResponse = {
  content: string;
  provider: string;
  model: string;
  char_count: number;
  max_chars: number;
};

export const api = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  (config as typeof config & { metadata?: { startTime: number } }).metadata = {
    startTime: performance.now(),
  };
  return config;
});

api.interceptors.response.use(
  (response) => {
    const meta = (response.config as typeof response.config & { metadata?: { startTime: number } }).metadata;
    if (meta?.startTime !== undefined) {
      const durationMs = performance.now() - meta.startTime;
      if (durationMs >= 500) {
        console.warn(
          `[API slow] ${response.config.method?.toUpperCase()} ${response.config.url} — ${durationMs.toFixed(0)}ms`,
        );
      }
    }
    return response;
  },
  (error) => {
    const config = error.config as (typeof error.config & { metadata?: { startTime: number } }) | undefined;
    const status = error.response?.status as number | undefined;
    // Don't log 401 on /users/me — expected when not logged in
    const isAuthCheck = config?.url?.includes("/users/me") && status === 401;
    if (!isAuthCheck && config?.metadata?.startTime !== undefined) {
      const durationMs = performance.now() - config.metadata.startTime;
      console.warn(`[API error] ${config.method?.toUpperCase()} ${config.url} — ${durationMs.toFixed(0)}ms`);
    }
    // Attach extracted user-friendly message to every error
    (error as Error & { userMessage?: string }).userMessage = extractApiError(error);
    return Promise.reject(error);
  },
);

export async function loginApi(login: string, password: string) {
  const body = new URLSearchParams();
  body.set("username", login);
  body.set("password", password);
  const { data } = await api.post<{ access_token: string; token_type: string }>("/auth/login", body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return data;
}

export async function registerApi(payload: {
  email: string;
  username: string;
  password: string;
  first_name?: string;
  last_name?: string;
}) {
  const { data } = await api.post<User>("/auth/register", payload);
  return data;
}

export async function meApi() {
  const { data } = await api.get<User>("/users/me");
  return data;
}

export async function deleteUserApi(userId: number) {
  await api.delete(`/users/${userId}`);
}

export async function getBusinessPlansApi() {
  const { data } = await api.get<BusinessPlan[]>("/business/plans");
  return data;
}

export async function createBusinessPlanApi(payload: { title: string; description?: string }) {
  const { data } = await api.post<BusinessPlan>("/business/plans", payload);
  return data;
}

export async function updateBusinessPlanApi(id: number, payload: Partial<Pick<BusinessPlan, "title" | "description">>) {
  const { data } = await api.patch<BusinessPlan>(`/business/plans/${id}`, payload);
  return data;
}

export async function deleteBusinessPlanApi(id: number) {
  await api.delete(`/business/plans/${id}`);
}

export async function getBusinessPlanApi(id: number) {
  const { data } = await api.get<BusinessPlan>(`/business/plans/${id}`);
  return data;
}

export async function getBusinessPlanAnalyticsApi(id: number) {
  const { data } = await api.get<BusinessPlanAnalytics>(`/business/plans/${id}/analytics`);
  return data;
}

export async function getPlanBlocksApi(planId: number) {
  const { data } = await api.get<PlanBlock[]>(`/business/plans/${planId}/blocks`);
  return data;
}

export async function createPlanBlockApi(
  planId: number,
  payload: {
    title: string;
    content?: string;
    block_type: string;
    rich_content?: object;
    linked_financial_chart_ids?: number[];
    due_date?: string | null;
    media_attachments?: MediaAttachment[];
  },
) {
  const { data } = await api.post<PlanBlock>(`/business/plans/${planId}/blocks`, {
    content: payload.content ?? "",
    rich_content: payload.rich_content ?? {},
    media_attachments: [],
    linked_financial_chart_ids: payload.linked_financial_chart_ids ?? [],
    ...payload,
  });
  return data;
}

export type MediaAttachment = {
  id: string;
  name: string;
  url: string;
  size: number;
  mime_type: string;
};

export async function updatePlanBlockApi(
  planId: number,
  blockId: number,
  payload: {
    title?: string;
    content?: string;
    block_type?: string;
    rich_content?: object;
    media_attachments?: MediaAttachment[];
    linked_financial_chart_ids?: number[];
    due_date?: string | null;
  },
) {
  const { data } = await api.patch<PlanBlock>(`/business/plans/${planId}/blocks/${blockId}`, payload);
  return data;
}

export async function uploadBlockAttachmentApi(planId: number, blockId: number, file: File) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<MediaAttachment>(`/business/plans/${planId}/blocks/${blockId}/attachments`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function deleteBlockAttachmentApi(planId: number, blockId: number, attachmentId: string) {
  await api.delete(`/business/plans/${planId}/blocks/${blockId}/attachments/${attachmentId}`);
}

export async function deletePlanBlockApi(planId: number, blockId: number) {
  await api.delete(`/business/plans/${planId}/blocks/${blockId}`);
}

export async function reorderPlanBlocksApi(planId: number, newOrder: number[]) {
  await api.patch(`/business/plans/${planId}/blocks/reorder`, { new_order: newOrder });
}

export async function getFinancialPlansApi(includePoints = false) {
  const { data } = await api.get<FinancialPlan[]>("/financial/charts", {
    params: includePoints ? { include_points: true } : undefined,
  });
  return data;
}

export async function createFinancialPlanApi(payload: {
  title: string;
  description?: string;
  currency_id: number;
  is_active: boolean;
}) {
  const { data } = await api.post<FinancialPlan>("/financial/charts", payload);
  return data;
}

export async function updateFinancialPlanApi(
  id: number,
  payload: Partial<Pick<FinancialPlan, "title" | "description" | "currency_id" | "is_active">>,
) {
  const { data } = await api.patch<FinancialPlan>(`/financial/charts/${id}`, payload);
  return data;
}

export async function deleteFinancialPlanApi(id: number) {
  await api.delete(`/financial/charts/${id}`);
}

export async function getFinancialPlanApi(id: number) {
  const { data } = await api.get<FinancialPlan>(`/financial/charts/${id}`);
  return data;
}

export async function getFinancialChartAnalyticsApi(id: number, includeSeries = false) {
  const { data } = await api.get<FinancialChartAnalytics>(`/financial/charts/${id}/analytics`, {
    params: includeSeries ? { include_series: true } : { include_series: false },
  });
  return data;
}

export async function getChartPointsApi(chartId: number) {
  const { data } = await api.get<ChartPoint[]>(`/financial/${chartId}/points`);
  return data;
}

export async function getChartPointsBatchApi(chartIds: number[]) {
  if (chartIds.length === 0) return {} as Record<number, ChartPoint[]>;
  const { data } = await api.post<{ chart_id: number; points: ChartPoint[] }[]>("/financial/charts/points/batch", {
    chart_ids: chartIds,
  });
  const result: Record<number, ChartPoint[]> = {};
  for (const item of data) {
    result[item.chart_id] = item.points;
  }
  return result;
}

export async function createChartPointApi(
  chartId: number,
  payload: { date: string; type: "income" | "expense"; amount: number; description?: string },
) {
  const { data } = await api.post<ChartPoint>(`/financial/${chartId}/points`, payload);
  return data;
}

export async function updateChartPointApi(
  chartId: number,
  pointId: number,
  payload: Partial<{ date: string; type: "income" | "expense"; amount: number; description: string }>,
) {
  const { data } = await api.patch<ChartPoint>(`/financial/${chartId}/points/${pointId}`, payload);
  return data;
}

export async function deleteChartPointApi(chartId: number, pointId: number) {
  await api.delete(`/financial/${chartId}/points/${pointId}`);
}

export async function getCurrenciesApi() {
  const { data } = await api.get<Currency[]>("/financial/currencies");
  return data;
}

export async function getTemplatesApi(category?: string) {
  const { data } = await api.get<Template[]>("/business/templates", { params: { category } });
  return data;
}

export async function createPlanFromTemplateApi(templateId: number) {
  const { data } = await api.post<BusinessPlan>(`/business/plans/from-template/${templateId}`);
  return data;
}

export async function exportFinancialChartApi(chartId: number, format: "xlsx" | "csv") {
  const response = await api.get(`/financial/charts/${chartId}/export`, {
    params: { format },
    responseType: "blob",
  });
  return response.data as Blob;
}

export async function exportBusinessPlanApi(planId: number, format: "html" | "xlsx" | "csv" | "pdf" = "html") {
  const response = await api.get(`/business/plans/${planId}/export`, {
    params: { format },
    responseType: "blob",
  });
  if (!(response.data instanceof Blob)) {
    throw new Error(`Unexpected response type: ${typeof response.data}`);
  }
  return response.data as Blob;
}

export async function importBusinessPlanApi(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<BusinessPlan>("/business/plans/import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function saveSnapshotApi(planId: number, title?: string, note?: string) {
  const params: Record<string, string> = {};
  if (title) params.title = title;
  if (note) params.note = note;
  const { data } = await api.post<{ detail: string; snapshot_id: number }>(
    `/business/plans/${planId}/snapshots`,
    null,
    { params },
  );
  return data;
}

export async function getSnapshotsApi(planId: number) {
  const { data } = await api.get<
    { id: number; title: string; note: string | null; created_at: string; created_by_id: number }[]
  >(`/business/plans/${planId}/snapshots`);
  return data;
}

export async function deleteSnapshotApi(planId: number, snapshotId: number) {
  const { data } = await api.delete<{ detail: string }>(`/business/plans/${planId}/snapshots/${snapshotId}`);
  return data;
}

export async function restoreSnapshotApi(planId: number, snapshotId: number) {
  const { data } = await api.post<BusinessPlan>(`/business/plans/${planId}/snapshots/${snapshotId}/restore`);
  return data;
}

export async function getCommentsApi(planId: number, blockId: number) {
  const { data } = await api.get<
    { id: number; content: string; resolved: boolean; created_at: string; user_id: number }[]
  >(`/business/plans/${planId}/blocks/${blockId}/comments`);
  return data;
}

export async function createCommentApi(planId: number, blockId: number, content: string) {
  const { data } = await api.post<{
    id: number;
    content: string;
    resolved: boolean;
    created_at: string;
    user_id: number;
  }>(`/business/plans/${planId}/blocks/${blockId}/comments`, { content });
  return data;
}

export async function updateCommentApi(
  planId: number,
  blockId: number,
  commentId: number,
  payload: { content?: string; resolved?: boolean },
) {
  const { data } = await api.patch<{
    id: number;
    content: string;
    resolved: boolean;
    created_at: string;
    user_id: number;
  }>(`/business/plans/${planId}/blocks/${blockId}/comments/${commentId}`, payload);
  return data;
}

export async function deleteCommentApi(planId: number, blockId: number, commentId: number) {
  await api.delete(`/business/plans/${planId}/blocks/${blockId}/comments/${commentId}`);
}

export async function generateBusinessPlanOutlineApi(planId: number, signal?: AbortSignal) {
  const { data } = await api.post<AITextResponse>(`/ai/business-plans/${planId}/generate`, undefined, { signal });
  return data;
}

export async function improveBusinessPlanBlockApi(planId: number, blockId: number, signal?: AbortSignal) {
  const { data } = await api.post<AITextResponse>(`/ai/business-plans/${planId}/blocks/${blockId}/improve`, undefined, {
    signal,
  });
  return data;
}

export async function summarizeFinancialChartApi(chartId: number, signal?: AbortSignal) {
  const { data } = await api.post<AITextResponse>(`/ai/financial-charts/${chartId}/summary`, undefined, { signal });
  return data;
}

// ── Duplicate ──

export async function duplicatePlanApi(planId: number) {
  const { data } = await api.post<BusinessPlan>(`/business/plans/${planId}/duplicate`);
  return data;
}

export async function duplicateBlockApi(planId: number, blockId: number) {
  const { data } = await api.post<PlanBlock>(`/business/plans/${planId}/blocks/${blockId}/duplicate`);
  return data;
}

// ── Tags ──

export async function getTagsApi() {
  const { data } = await api.get<Tag[]>(`/tags`);
  return data;
}

export async function createTagApi(payload: { name: string; color_idx: number }) {
  const { data } = await api.post<Tag>(`/tags`, payload);
  return data;
}

export async function updateTagApi(tagId: number, payload: { name?: string; color_idx?: number }) {
  const { data } = await api.patch<Tag>(`/tags/${tagId}`, payload);
  return data;
}

export async function deleteTagApi(tagId: number) {
  await api.delete(`/tags/${tagId}`);
}

export async function assignTagToPlanApi(planId: number, tagId: number) {
  await api.post(`/business/plans/${planId}/tags/${tagId}`);
}

export async function unassignTagFromPlanApi(planId: number, tagId: number) {
  await api.delete(`/business/plans/${planId}/tags/${tagId}`);
}

export async function assignTagToBlockApi(planId: number, blockId: number, tagId: number) {
  await api.post(`/business/plans/${planId}/blocks/${blockId}/tags/${tagId}`);
}

export async function unassignTagFromBlockApi(planId: number, blockId: number, tagId: number) {
  await api.delete(`/business/plans/${planId}/blocks/${blockId}/tags/${tagId}`);
}

// ── Projects & Notes ──

export type Project = {
  id: number;
  user_id: number;
  name: string;
  description?: string | null;
  color_idx: number;
  created_at: string;
};

export type Note = {
  id: number;
  user_id: number;
  project_id?: number | null;
  title: string;
  content_markdown: string;
  tags?: Tag[];
  created_at: string;
  updated_at: string;
};

export async function getProjectsApi() {
  const { data } = await api.get<Project[]>(`/notes/projects`);
  return data;
}

export async function createProjectApi(payload: { name: string; description?: string; color_idx?: number }) {
  const { data } = await api.post<Project>(`/notes/projects`, payload);
  return data;
}

export async function updateProjectApi(
  projectId: number,
  payload: { name?: string; description?: string; color_idx?: number },
) {
  const { data } = await api.patch<Project>(`/notes/projects/${projectId}`, payload);
  return data;
}

export async function deleteProjectApi(projectId: number) {
  await api.delete(`/notes/projects/${projectId}`);
}

export type PaginatedNotes = {
  items: Note[];
  total: number;
  page: number;
  per_page: number;
};

export async function getNotesApi(params?: {
  project_id?: number;
  tag_ids?: string;
  page?: number;
  per_page?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.project_id) searchParams.set("project_id", String(params.project_id));
  if (params?.tag_ids) searchParams.set("tag_ids", params.tag_ids);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.per_page) searchParams.set("per_page", String(params.per_page));
  const query = searchParams.toString();
  const { data } = await api.get<PaginatedNotes>(`/notes${query ? `?${query}` : ""}`);
  return data;
}

export async function createNoteApi(payload: {
  title: string;
  content_markdown?: string;
  project_id?: number | null;
  tag_ids?: number[];
}) {
  const { data } = await api.post<Note>(`/notes`, payload);
  return data;
}

export async function getNoteApi(noteId: number) {
  const { data } = await api.get<Note>(`/notes/${noteId}`);
  return data;
}

export async function updateNoteApi(
  noteId: number,
  payload: { title?: string; content_markdown?: string; project_id?: number | null; tag_ids?: number[] },
) {
  const { data } = await api.patch<Note>(`/notes/${noteId}`, payload);
  return data;
}

export async function deleteNoteApi(noteId: number) {
  await api.delete(`/notes/${noteId}`);
}

// ── Calendar ──

export type CalendarEvent = {
  id: number;
  user_id: number;
  title: string;
  description?: string | null;
  event_date: string;
  notify_before?: number | null;
  notified_at?: string | null;
  event_type: string;
  related_plan_id?: number | null;
  related_block_id?: number | null;
  related_note_id?: number | null;
  created_at: string;
};

export async function getCalendarEventsApi(fromDate?: string, toDate?: string) {
  const params = new URLSearchParams();
  if (fromDate) params.set("from_date", fromDate);
  if (toDate) params.set("to_date", toDate);
  const query = params.toString();
  const { data } = await api.get<CalendarEvent[]>(`/calendar/events${query ? `?${query}` : ""}`);
  return data;
}

export async function createCalendarEventApi(payload: {
  title: string;
  description?: string;
  event_date: string;
  event_type?: string;
  notify_before?: number | null;
}) {
  const { data } = await api.post<CalendarEvent>(`/calendar/events`, payload);
  return data;
}

export async function updateCalendarEventApi(
  eventId: number,
  payload: { title?: string; description?: string; event_date?: string; notify_before?: number | null },
) {
  const { data } = await api.patch<CalendarEvent>(`/calendar/events/${eventId}`, payload);
  return data;
}

export async function deleteCalendarEventApi(eventId: number) {
  await api.delete(`/calendar/events/${eventId}`);
}

export function getCalendarExportUrl(fromDate?: string, toDate?: string) {
  const params = new URLSearchParams();
  if (fromDate) params.set("from_date", fromDate);
  if (toDate) params.set("to_date", toDate);
  const query = params.toString();
  return `/api/v1/calendar/export.ics${query ? `?${query}` : ""}`;
}

export type CalendarImportResult = {
  imported: number;
  skipped: number;
  errors: number;
  details: string[];
};

export async function importCalendarApi(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<CalendarImportResult>("/calendar/import.ics", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

// ── Dashboard ──

export type DashboardPlanItem = {
  id: number;
  title: string;
  description?: string | null;
  block_count: number;
  created_at: string;
};

export type DashboardChartItem = {
  id: number;
  title: string;
  point_count: number;
  created_at: string;
};

export type DashboardNoteItem = {
  id: number;
  title: string;
  created_at: string;
};

export type DashboardData = {
  plan_count: number;
  chart_count: number;
  note_count: number;
  block_count: number;
  recent_plans: DashboardPlanItem[];
  recent_charts: DashboardChartItem[];
  recent_notes: DashboardNoteItem[];
};

export async function getDashboardApi() {
  const { data } = await api.get<DashboardData>("/dashboard");
  return data;
}
// ── Search ──

export type SearchPlanResult = {
  id: number;
  title: string;
  description?: string | null;
  type: "plan";
};

export type SearchBlockResult = {
  id: number;
  title: string;
  content: string;
  plan_id: number;
  plan_title: string;
  type: "block";
};

export type SearchNoteResult = {
  id: number;
  title: string;
  content_markdown: string;
  type: "note";
};

export type SearchBoardResult = {
  id: number;
  title: string;
  type: "board";
};

export type SearchCardResult = {
  id: number;
  title: string;
  description: string | null;
  board_id: number;
  board_title: string;
  column_id: number;
  type: "card";
};

export type SearchContactResult = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  type: "contact";
};

export type SearchDealResult = {
  id: number;
  title: string;
  description: string | null;
  status: string;
  value: number | null;
  contact_id: number | null;
  contact_name: string | null;
  type: "deal";
};

export type SearchFinancialChartResult = {
  id: number;
  title: string;
  description: string | null;
  type: "financial_chart";
};

export type SearchTaxEventResult = {
  id: number;
  title: string;
  type: "tax_event";
};

export type SearchResults = {
  plans: SearchPlanResult[];
  blocks: SearchBlockResult[];
  notes: SearchNoteResult[];
  boards: SearchBoardResult[];
  cards: SearchCardResult[];
  contacts: SearchContactResult[];
  deals: SearchDealResult[];
  financial_charts: SearchFinancialChartResult[];
  tax_events: SearchTaxEventResult[];
  total: number;
};

export async function searchApi(query: string) {
  const { data } = await api.get<SearchResults>("/search", { params: { q: query } });
  return data;
}
// ── Tax Events ──

export type TaxEvent = {
  id: number;
  user_id: number;
  title: string;
  description?: string | null;
  event_date: string;
  event_type: string;
  amount?: number | null;
  is_recurring: boolean;
  recurrence_rule?: string | null;
  is_completed: boolean;
  notify_before?: number | null;
  notified_at?: string | null;
  created_at: string;
  updated_at: string;
};

export async function getTaxEventsApi() {
  const { data } = await api.get<TaxEvent[]>("/tax-events");
  return data;
}

export async function createTaxEventApi(payload: {
  title: string;
  description?: string;
  event_date: string;
  event_type?: string;
  amount?: number;
  is_recurring?: boolean;
  recurrence_rule?: string;
  notify_before?: number | null;
}) {
  const { data } = await api.post<TaxEvent>("/tax-events", payload);
  return data;
}

export async function updateTaxEventApi(id: number, payload: Partial<TaxEvent>) {
  const { data } = await api.patch<TaxEvent>(`/tax-events/${id}`, payload);
  return data;
}

export async function deleteTaxEventApi(id: number) {
  await api.delete(`/tax-events/${id}`);
}

export async function getPendingNotificationsApi() {
  const { data } = await api.get<TaxEvent[]>("/tax-events/pending-notifications");
  return data;
}

export async function markNotifiedApi(id: number) {
  const { data } = await api.post<TaxEvent>(`/tax-events/${id}/mark-notified`);
  return data;
}

// ── Calendar Pending Notifications ──

export async function getCalendarPendingNotificationsApi() {
  const { data } = await api.get<CalendarEvent[]>("/calendar/events/pending-notifications");
  return data;
}

export async function markCalendarNotifiedApi(eventId: number) {
  const { data } = await api.post<CalendarEvent>(`/calendar/events/${eventId}/mark-notified`);
  return data;
}

// ── Notifications ──

export type AppNotification = {
  id: number;
  user_id?: number;
  title: string;
  body?: string | null;
  source_type: string;
  source_id?: number | null;
  is_read: boolean;
  created_at: string;
};

export async function getNotificationsApi() {
  const { data } = await api.get<AppNotification[]>("/notifications");
  return data;
}

export async function getUnreadCountApi() {
  const { data } = await api.get<{ count: number }>("/notifications/unread-count");
  return data;
}

export async function createNotificationApi(payload: {
  title: string;
  body?: string;
  source_type: string;
  source_id?: number;
}) {
  const { data } = await api.post<AppNotification>("/notifications", payload);
  return data;
}

export async function markNotificationReadApi(notificationId: number) {
  const { data } = await api.post<AppNotification>(`/notifications/${notificationId}/read`);
  return data;
}

export async function markAllNotificationsReadApi() {
  const { data } = await api.post<{ ok: boolean }>("/notifications/read-all");
  return data;
}

export async function deleteNotificationApi(notificationId: number) {
  await api.delete(`/notifications/${notificationId}`);
}

export async function deleteAllNotificationsApi() {
  await api.delete("/notifications");
}

export type NotificationSSEEvent = {
  type: "notification" | "connected";
  id?: number;
  title?: string;
  body?: string | null;
  source_type?: string;
  source_id?: number | null;
  is_read?: boolean;
  created_at?: string;
};

export function connectNotificationStream(
  onEvent: (event: NotificationSSEEvent) => void,
  onError?: (error: Event) => void,
): () => void {
  let cancelled = false;
  let controller: AbortController | null = null;

  async function connect() {
    if (cancelled) return;

    controller = new AbortController();

    try {
      const response = await fetch("/api/v1/notifications/stream", {
        signal: controller.signal,
        credentials: "include",
      });

      if (!response.ok || !response.body) {
        throw new Error(`SSE connection failed: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              onEvent(data);
            } catch {
              // ignore parse errors (keepalive lines etc)
            }
          }
        }
      }
    } catch (err: any) {
      if (err?.name !== "AbortError" && !cancelled) {
        onError?.(err);
        // Reconnect after 3 seconds
        setTimeout(connect, 3000);
      }
    }
  }

  connect();

  return () => {
    cancelled = true;
    controller?.abort();
  };
}
// ── Kanban ──

export type BoardCard = {
  id: number;
  column_id: number;
  title: string;
  description?: string | null;
  card_order: number;
  metadata_json?: Record<string, unknown> | null;
};

export type BoardColumn = {
  id: number;
  board_id: number;
  title: string;
  color?: string | null;
  column_order: number;
  cards: BoardCard[];
};

export type Board = {
  id: number;
  user_id: number;
  business_plan_id?: number | null;
  title: string;
  created_at: string;
  updated_at: string;
  columns: BoardColumn[];
};

export type BoardListItem = {
  id: number;
  title: string;
  business_plan_id?: number | null;
  created_at: string;
};

export async function getBoardsApi() {
  const { data } = await api.get<BoardListItem[]>("/kanban/boards");
  return data;
}

export async function getBoardApi(id: number) {
  const { data } = await api.get<Board>(`/kanban/boards/${id}`);
  return data;
}

export async function createBoardApi(payload: { title: string; business_plan_id?: number }) {
  const { data } = await api.post<Board>("/kanban/boards", payload);
  return data;
}

export async function updateBoardApi(id: number, payload: { title?: string }) {
  const { data } = await api.patch<Board>(`/kanban/boards/${id}`, payload);
  return data;
}

export async function deleteBoardApi(id: number) {
  await api.delete(`/kanban/boards/${id}`);
}

export async function createColumnApi(boardId: number, payload: { title: string; color?: string }) {
  const { data } = await api.post<BoardColumn>(`/kanban/boards/${boardId}/columns`, payload);
  return data;
}

export async function updateColumnApi(id: number, payload: { title?: string; color?: string }) {
  const { data } = await api.patch<BoardColumn>(`/kanban/columns/${id}`, payload);
  return data;
}

export async function deleteColumnApi(id: number) {
  await api.delete(`/kanban/columns/${id}`);
}

export async function reorderColumnsApi(boardId: number, columnIds: number[]) {
  await api.patch(`/kanban/boards/${boardId}/columns/reorder`, { column_ids: columnIds });
}

export async function createCardApi(columnId: number, payload: { title: string; description?: string }) {
  const { data } = await api.post<BoardCard>(`/kanban/columns/${columnId}/cards`, payload);
  return data;
}

export async function updateCardApi(id: number, payload: { title?: string; description?: string }) {
  const { data } = await api.patch<BoardCard>(`/kanban/cards/${id}`, payload);
  return data;
}

export async function deleteCardApi(id: number) {
  await api.delete(`/kanban/cards/${id}`);
}

export async function moveCardApi(id: number, payload: { column_id: number; card_order: number }) {
  const { data } = await api.patch<BoardCard>(`/kanban/cards/${id}/move`, payload);
  return data;
}

// ── CRM ──

export type Contact = {
  id: number;
  user_id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  position?: string | null;
  notes?: string | null;
  is_lead: boolean;
  created_at: string;
  updated_at: string;
};

export type Deal = {
  id: number;
  user_id: number;
  contact_id?: number | null;
  title: string;
  description?: string | null;
  status: string;
  value?: number | null;
  currency: string;
  priority: string;
  due_date?: string | null;
  created_at: string;
  updated_at: string;
  contact?: Contact | null;
};

export type PipelineStats = {
  total_deals: number;
  total_value: number;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
};

export async function getContacts(isLead?: boolean) {
  const params = isLead !== undefined ? { is_lead: isLead } : {};
  const { data } = await api.get<Contact[]>("/crm/contacts", { params });
  return data;
}

export async function createContactApi(payload: {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  notes?: string;
  is_lead?: boolean;
}) {
  const { data } = await api.post<Contact>("/crm/contacts", payload);
  return data;
}

export async function updateContactApi(
  id: number,
  payload: Partial<Pick<Contact, "name" | "email" | "phone" | "company" | "position" | "notes" | "is_lead">>,
) {
  const { data } = await api.patch<Contact>(`/crm/contacts/${id}`, payload);
  return data;
}

export async function deleteContactApi(id: number) {
  await api.delete(`/crm/contacts/${id}`);
}

export async function getDeals(status?: string) {
  const params = status ? { status } : {};
  const { data } = await api.get<Deal[]>("/crm/deals", { params });
  return data;
}

export async function createDealApi(payload: {
  title: string;
  description?: string;
  contact_id?: number;
  status?: string;
  value?: number;
  currency?: string;
  priority?: string;
  due_date?: string;
}) {
  const { data } = await api.post<Deal>("/crm/deals", payload);
  return data;
}

export async function updateDealApi(
  id: number,
  payload: Partial<
    Pick<Deal, "title" | "description" | "contact_id" | "status" | "value" | "currency" | "priority" | "due_date">
  >,
) {
  const { data } = await api.patch<Deal>(`/crm/deals/${id}`, payload);
  return data;
}

export async function deleteDealApi(id: number) {
  await api.delete(`/crm/deals/${id}`);
}

export async function getPipelineStats() {
  const { data } = await api.get<PipelineStats>("/crm/pipeline/stats");
  return data;
}
