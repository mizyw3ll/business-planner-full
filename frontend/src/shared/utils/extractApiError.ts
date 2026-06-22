import type { AxiosError } from "axios";

interface ValidationErrorDetail {
  loc: (string | number)[];
  msg: string;
  type: string;
}

/**
 * Extracts user-friendly error message from API response.
 * Handles: string detail, Pydantic validation errors, nested objects.
 */
export function extractApiError(err: unknown, fallback = "Произошла ошибка"): string {
  const axiosErr = err as AxiosError<{
    detail?: string | ValidationErrorDetail[] | Record<string, string>;
    message?: string;
  }>;

  const data = axiosErr?.response?.data;
  if (!data) return fallback;

  const detail = data.detail ?? data.message;
  if (!detail) return fallback;

  // FastAPI returns a plain string
  if (typeof detail === "string") return detail;

  // Pydantic returns an array of validation errors
  if (Array.isArray(detail)) {
    const messages = detail
      .map((e) => {
        if (typeof e === "string") return e;
        // Build readable path: "body -> field_name"
        const path = e.loc
          ?.filter((p) => p !== "body" && p !== "query" && p !== "path")
          .join(" → ");
        const prefix = path ? `${path}: ` : "";
        return `${prefix}${e.msg}`;
      })
      .filter(Boolean);
    return messages.length > 0 ? messages.join("\n") : fallback;
  }

  // Object with field: message pairs
  if (typeof detail === "object") {
    const messages = Object.entries(detail)
      .map(([field, msg]) => `${field}: ${msg}`)
      .filter(Boolean);
    return messages.length > 0 ? messages.join("\n") : fallback;
  }

  return String(detail);
}
