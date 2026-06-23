import { api } from "../../shared/api/instance";
import type {
  BusinessPlan,
  BusinessPlanAnalytics,
  PlanBlock,
  Template,
  MediaAttachment,
  DashboardData,
  Tag,
  AITextResponse,
} from "../../shared/api/types";

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

export async function duplicatePlanApi(planId: number) {
  const { data } = await api.post<BusinessPlan>(`/business/plans/${planId}/duplicate`);
  return data;
}

export async function duplicateBlockApi(planId: number, blockId: number) {
  const { data } = await api.post<PlanBlock>(`/business/plans/${planId}/blocks/${blockId}/duplicate`);
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

export async function getDashboardApi() {
  const { data } = await api.get<DashboardData>("/dashboard");
  return data;
}

export async function getTagsApi() {
  const { data } = await api.get<Tag[]>("/tags");
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
