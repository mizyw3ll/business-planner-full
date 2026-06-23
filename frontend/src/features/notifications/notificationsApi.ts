import { api } from "../../shared/api/instance";
import type { AppNotification, NotificationSSEEvent } from "../../shared/api/types";

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
