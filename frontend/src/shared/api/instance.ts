import axios from "axios";
import { extractApiError } from "../../shared/utils/extractApiError";

export const TOKEN_KEY = "remain.accessToken";

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
    const isAuthCheck = config?.url?.includes("/users/me") && status === 401;
    if (!isAuthCheck && config?.metadata?.startTime !== undefined) {
      const durationMs = performance.now() - config.metadata.startTime;
      console.warn(`[API error] ${config.method?.toUpperCase()} ${config.url} — ${durationMs.toFixed(0)}ms`);
    }
    (error as Error & { userMessage?: string }).userMessage = extractApiError(error);
    return Promise.reject(error);
  },
);
