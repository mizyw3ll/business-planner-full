import { memo } from "react";
import type { BusinessPlanAnalytics } from "../../api";
import { v } from "../../shared/theme";

interface AnalyticsGridProps {
  analytics: BusinessPlanAnalytics;
}

export const AnalyticsGrid = memo(function AnalyticsGrid({ analytics }: AnalyticsGridProps) {
  const stats = [
    ["Блоков", analytics.blocks_count],
    ["Черновиков", analytics.drafts_count],
    ["Комментариев", analytics.comments_count],
    ["Вложений", analytics.attachments_count],
    ["Связей с графиками", analytics.linked_financial_charts_count],
  ] as const;

  return (
    <article
      className="space-y-3 rounded-2xl border p-5"
      style={{ borderColor: v("border-primary"), background: v("bg-secondary") }}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight" style={{ color: v("text-primary") }}>
          Обзор
        </h2>
        <p className="text-xs" style={{ color: v("text-muted") }}>
          Быстрая аналитика плана
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border p-3"
            style={{ borderColor: v("border-primary"), background: v("bg-card") }}
          >
            <p className="text-xs uppercase tracking-wide" style={{ color: v("text-muted") }}>
              {label}
            </p>
            <p className="mt-1 text-2xl font-semibold" style={{ color: v("text-primary") }}>
              {value}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
});
