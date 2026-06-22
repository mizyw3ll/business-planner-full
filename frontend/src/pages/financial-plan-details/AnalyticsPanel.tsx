import { memo } from "react";
import {
  type FinancialChartAnalytics,
} from "../../api";
import { v } from "../../shared/theme";
import { getCurrencySymbol } from "../../shared/currency";

interface AnalyticsPanelProps {
  analytics: FinancialChartAnalytics;
  currencyCode: string;
}

export const AnalyticsPanel = memo(function AnalyticsPanel({ analytics, currencyCode }: AnalyticsPanelProps) {
  const curSymbol = getCurrencySymbol(currencyCode);
  const metrics = [
    { label: "Доход", value: analytics.income_total, fixed: 2 },
    { label: "Расход", value: analytics.expense_total, fixed: 2 },
    { label: "Net", value: analytics.net_total, fixed: 2 },
    { label: "Точек", value: analytics.points_count, fixed: 0 },
  ];

  return (
    <article
      className="space-y-3 rounded-2xl border p-5"
      style={{ borderColor: v("border-primary"), background: v("bg-secondary") }}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight" style={{ color: v("text-primary") }}>Обзор</h2>
        <p className="text-xs" style={{ color: v("text-muted") }}>Быстрая аналитика графика</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-xl border p-3"
            style={{ borderColor: v("border-primary"), background: v("bg-card") }}
          >
            <p className="text-xs uppercase tracking-wide" style={{ color: v("text-muted") }}>{m.label}</p>
            <p className="mt-1 text-2xl font-semibold" style={{ color: v("text-primary") }}>
              {m.fixed === 0
                ? Math.round(m.value).toString()
                : `${Number(m.value).toFixed(m.fixed)} ${curSymbol}`}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
});
