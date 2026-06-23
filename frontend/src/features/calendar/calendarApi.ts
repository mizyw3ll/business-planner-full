import { api } from "../../shared/api/instance";
import type { CalendarEvent, CalendarImportResult } from "../../shared/api/types";

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
  notify_before?: number[] | null;
}) {
  const { data } = await api.post<CalendarEvent>(`/calendar/events`, payload);
  return data;
}

export async function updateCalendarEventApi(
  eventId: number,
  payload: { title?: string; description?: string; event_date?: string; notify_before?: number[] | null },
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

export async function importCalendarApi(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<CalendarImportResult>("/calendar/import.ics", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function getCalendarPendingNotificationsApi() {
  const { data } = await api.get<CalendarEvent[]>("/calendar/events/pending-notifications");
  return data;
}

export async function markCalendarNotifiedApi(eventId: number) {
  const { data } = await api.post<CalendarEvent>(`/calendar/events/${eventId}/mark-notified`);
  return data;
}
