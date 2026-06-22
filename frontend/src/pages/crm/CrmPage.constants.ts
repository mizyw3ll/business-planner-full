export const DEAL_STATUSES = [
  { value: "new", label: "Новая", color: "#3b82f6" },
  { value: "qualified", label: "Квалификация", color: "#eab308" },
  { value: "proposal", label: "Предложение", color: "#f97316" },
  { value: "negotiation", label: "Переговоры", color: "#a855f7" },
  { value: "won", label: "Выиграна", color: "#22c55e" },
  { value: "lost", label: "Проиграна", color: "#ef4444" },
] as const;

export const PRIORITIES = [
  { value: "low", label: "Низкий", color: "#9ca3af" },
  { value: "medium", label: "Средний", color: "#eab308" },
  { value: "high", label: "Высокий", color: "#ef4444" },
] as const;

export type Tab = "contacts" | "deals" | "pipeline";
