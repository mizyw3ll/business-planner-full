import { memo } from "react";
import { type PipelineStats } from "../../api";
import { DEAL_STATUSES } from "./CrmPage.constants";
import { cardStyle, v } from "../../shared/theme";

interface PipelineViewProps {
  stats: PipelineStats | undefined;
  isDark: boolean;
}

export const PipelineView = memo(function PipelineView({ stats, isDark }: PipelineViewProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          className="animate-fade-in rounded-xl border p-4 text-center backdrop-blur-sm transition-all duration-200 hover:shadow-lg"
          style={cardStyle("business", isDark)}
        >
          <p className="text-2xl font-bold" style={{ color: v("text-primary") }}>
            {stats?.total_deals || 0}
          </p>
          <p className="text-sm" style={{ color: v("text-muted") }}>Всего сделок</p>
        </div>
        <div
          className="animate-fade-in rounded-xl border p-4 text-center backdrop-blur-sm transition-all duration-200 hover:shadow-lg"
          style={cardStyle("business", isDark)}
        >
          <p className="text-2xl font-bold" style={{ color: v("text-primary") }}>
            <span className="inline-flex items-center gap-1">
              {(stats?.total_value || 0).toLocaleString()}
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold" style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}>₽</span>
            </span>
          </p>
          <p className="text-sm" style={{ color: v("text-muted") }}>Общая сумма</p>
        </div>
        {DEAL_STATUSES.slice(0, 4).map((s, i) => (
          <div
            key={s.value}
            className={`animate-fade-in stagger-${i + 3} rounded-xl border p-4 text-center backdrop-blur-sm transition-all duration-200 hover:shadow-lg`}
            style={cardStyle("note", isDark)}
          >
            <div className="w-8 h-1 rounded mx-auto mb-2" style={{ background: s.color }} />
            <p className="text-2xl font-bold" style={{ color: v("text-primary") }}>
              {stats?.by_status[s.value] || 0}
            </p>
            <p className="text-sm" style={{ color: v("text-muted") }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div
        className="animate-fade-in rounded-xl border p-4 backdrop-blur-sm transition-all duration-200 hover:shadow-lg"
        style={cardStyle("note", isDark)}
      >
        <h3 className="mb-3 font-semibold" style={{ color: v("text-primary") }}>Воронка продаж</h3>
        <div className="relative space-y-3">
          {DEAL_STATUSES.map((s) => {
            const count = stats?.by_status[s.value] || 0;
            const total = stats?.total_deals || 1;
            const pct = Math.round((count / total) * 100);
            return (
              <div key={s.value}>
                <div className="flex justify-between text-sm mb-1">
                  <span style={{ color: v("text-muted") }}>{s.label}</span>
                  <span style={{ color: v("text-primary") }}>{count} ({pct}%)</span>
                </div>
                <div className="w-full h-6 rounded-lg overflow-hidden relative" style={{ background: v("bg-tertiary") }}>
                  <div
                    className="h-full rounded-lg transition-all duration-700 ease-out"
                    style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${s.color}88, ${s.color})` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
