import { api } from "../../shared/api/instance";
import type { TaxEvent } from "../../shared/api/types";

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
  notify_before?: number[] | null;
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
