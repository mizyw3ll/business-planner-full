import { api } from "../../shared/api/instance";
import type {
  ChartPoint,
  FinancialPlan,
  Currency,
  FinancialChartAnalytics,
} from "../../shared/api/types";

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

export async function exportFinancialChartApi(chartId: number, format: "xlsx" | "csv") {
  const response = await api.get(`/financial/charts/${chartId}/export`, {
    params: { format },
    responseType: "blob",
  });
  return response.data as Blob;
}
