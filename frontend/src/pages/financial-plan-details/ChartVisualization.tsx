import { memo } from "react";
import { Download } from "lucide-react";
import { CartesianGrid, Line, Area, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartWrapper } from "../../shared/components/ChartWrapper";
import { type ChartPoint, type Currency } from "../../api";
import { buttonStyle, v } from "../../shared/theme";
import { getCurrencySymbol } from "../../shared/currency";
import { type Timeframe, buildChartData } from "./chartUtils";

interface ChartVisualizationProps {
  points: ChartPoint[];
  timeframe: Timeframe;
  isDark: boolean;
  chart: { currency_id: number };
  currencies: Currency[];
  onTimeframeChange: (tf: Timeframe) => void;
  onExport: (format: "csv" | "xlsx") => void;
  onAddPoint: () => void;
}

export const ChartVisualization = memo(function ChartVisualization({
  points,
  timeframe,
  isDark,
  chart,
  currencies,
  onTimeframeChange,
  onExport,
  onAddPoint,
}: ChartVisualizationProps) {
  const chartData = buildChartData(points, timeframe);

  return (
    <article
      className="rounded-2xl border p-5"
      style={{ borderColor: v("border-primary"), background: v("bg-secondary") }}
    >
      <div className="relative mb-3 flex flex-wrap items-center gap-2">
        {(["1W", "1M", "3M", "1Y"] as Timeframe[]).map((tf) => (
          <button
            key={tf}
            className="rounded-lg px-3 py-1.5 text-xs transition-colors"
            style={
              timeframe === tf
                ? { background: v("bg-active"), color: v("text-primary") }
                : { background: v("bg-secondary"), color: v("text-secondary") }
            }
            onClick={() => onTimeframeChange(tf)}
          >
            {tf === "1W" ? "По неделям" : tf === "1M" ? "Месяц" : tf === "3M" ? "3 месяца" : "Год"}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <button
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors"
            style={{ borderColor: v("border-secondary"), color: v("text-secondary") }}
            onMouseEnter={(e) => { e.currentTarget.style.background = v("bg-hover"); }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            onClick={() => onExport("csv")}
          >
            <Download size={14} /> CSV
          </button>
          <button
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors"
            style={buttonStyle("primary", isDark)}
            onClick={() => onExport("xlsx")}
          >
            <Download size={14} /> Excel
          </button>
        </div>
      </div>

      {points.length < 2 ? (
        <div
          className="flex h-80 items-center justify-center rounded-xl border p-6"
          style={{ borderColor: v("border-primary"), background: v("bg-hover") }}
        >
          <div className="text-center">
            <p className="text-sm font-medium" style={{ color: v("text-secondary") }}>
              Для отображения графика необходимо добавить минимум 2 точки
            </p>
            <button
              className="mt-3 rounded-lg border px-4 py-2 text-sm transition-colors"
              style={buttonStyle("primary", isDark)}
              onClick={onAddPoint}
            >
              Добавить точку
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="relative h-80 w-full overflow-x-auto overflow-y-hidden">
            <ChartWrapper className="h-full min-w-[600px]">
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <svg style={{ position: "absolute", width: 0, height: 0 }}>
                    <defs>
                      <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                  </svg>
                  <CartesianGrid
                    stroke={isDark ? "rgba(99,102,241,0.06)" : "rgba(99,102,241,0.08)"}
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    stroke={isDark ? "#555080" : "#94a3b8"}
                    tick={{ fontSize: 11, fill: isDark ? "#7e78a8" : "#64748b" }}
                    tickLine={false}
                    axisLine={{ stroke: isDark ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.12)" }}
                  />
                  <YAxis
                    stroke={isDark ? "#555080" : "#94a3b8"}
                    tick={{ fontSize: 11, fill: isDark ? "#7e78a8" : "#64748b" }}
                    tickLine={false}
                    axisLine={false}
                    width={50}
                  />
                  <Tooltip
                    cursor={{
                      stroke: isDark ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.15)",
                      strokeWidth: 1,
                      strokeDasharray: "4 4",
                    }}
                    contentStyle={{
                      background: isDark ? "rgba(14, 12, 36, 0.95)" : "rgba(255,255,255,0.95)",
                      border: `1px solid ${isDark ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.15)"}`,
                      borderRadius: "12px",
                      boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.4)" : "0 4px 16px rgba(0,0,0,0.08)",
                      padding: "12px 16px",
                      backdropFilter: "blur(12px)",
                    }}
                    labelStyle={{
                      color: isDark ? "#f0eeff" : "#0f172a",
                      fontWeight: 600,
                      marginBottom: 6,
                      fontSize: 12,
                    }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const item = payload[0]?.payload as {
                        income?: number;
                        expense?: number;
                        total?: number | null;
                      };
                      const curCode = currencies.find((c) => c.id === chart.currency_id)?.code ?? "RUB";
                      const curSym = getCurrencySymbol(curCode);
                      return (
                        <div>
                          <p style={{ color: isDark ? "#f0eeff" : "#0f172a", fontWeight: 600, marginBottom: 6, fontSize: 12 }}>
                            {label}
                          </p>
                          {typeof item.income === "number" && item.income > 0 && (
                            <p style={{ color: "#10b981", fontSize: 12, marginBottom: 2 }}>
                              <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#10b981", marginRight: 6 }} />
                              Доходы: {item.income.toFixed(2)} {curSym}
                            </p>
                          )}
                          {typeof item.expense === "number" && item.expense > 0 && (
                            <p style={{ color: "#f43f5e", fontSize: 12, marginBottom: 2 }}>
                              <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#f43f5e", marginRight: 6 }} />
                              Расходы: {item.expense.toFixed(2)} {curSym}
                            </p>
                          )}
                          {typeof item.total === "number" && (
                            <p style={{
                              color: isDark ? "#f0eeff" : "#0f172a",
                              fontWeight: 700,
                              marginTop: 6,
                              paddingTop: 6,
                              borderTop: `1px solid ${isDark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.1)"}`,
                              fontSize: 13,
                            }}>
                              Итог: {item.total.toFixed(2)} {curSym}
                            </p>
                          )}
                        </div>
                      );
                    }}
                  />
                  <Area type="monotone" dataKey="income" stroke="none" fill="url(#incomeGradient)" fillOpacity={1} isAnimationActive animationDuration={600} />
                  <Area type="monotone" dataKey="expense" stroke="none" fill="url(#expenseGradient)" fillOpacity={1} isAnimationActive animationDuration={600} />
                  <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", strokeWidth: 0, r: 3 }} activeDot={{ r: 5, stroke: "#10b981", strokeWidth: 2, fill: isDark ? "#0e0c24" : "#fff" }} isAnimationActive animationDuration={600} />
                  <Line type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={2} dot={{ fill: "#f43f5e", strokeWidth: 0, r: 3 }} activeDot={{ r: 5, stroke: "#f43f5e", strokeWidth: 2, fill: isDark ? "#0e0c24" : "#fff" }} isAnimationActive animationDuration={600} />
                  <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: "#6366f1", strokeWidth: 0, r: 3 }} activeDot={{ r: 6, stroke: "#6366f1", strokeWidth: 2, fill: isDark ? "#0e0c24" : "#fff", strokeDasharray: "0" }} strokeDasharray="0" isAnimationActive animationDuration={600} />
                </LineChart>
              </ResponsiveContainer>
            </ChartWrapper>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs" style={{ color: isDark ? "#7e78a8" : "#64748b" }}>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: "#10b981" }} /> Доходы</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: "#f43f5e" }} /> Расходы</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: "#6366f1" }} /> Итог</span>
          </div>
        </>
      )}
    </article>
  );
});
