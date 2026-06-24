import { memo, useMemo, useRef, useCallback } from "react";
import { Download } from "lucide-react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent, LegendComponent, DataZoomComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { type ChartPoint, type Currency } from "../../api";
import { buttonStyle, v } from "../../shared/theme";
import { getCurrencySymbol } from "../../shared/currency";
import { buildChartData, type Timeframe } from "./chartUtils";

echarts.use([LineChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, CanvasRenderer]);

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

const INCOME_COLOR = "#10b981";
const EXPENSE_COLOR = "#f43f5e";
const TOTAL_COLOR = "#6366f1";

const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  "1W": "Неделя",
  "1M": "Месяц",
  "3M": "3 месяца",
  "1Y": "Год",
};

export const ChartVisualization = memo(function ChartVisualization({
  points,
  timeframe,
  isDark,
  chart: chartConfig,
  currencies,
  onTimeframeChange,
  onExport,
  onAddPoint,
}: ChartVisualizationProps) {
  const chartRef = useRef<ReactECharts | null>(null);
  const chartData = buildChartData(points, timeframe);
  const curCode = currencies.find((c) => c.id === chartConfig.currency_id)?.code ?? "RUB";
  const curSym = getCurrencySymbol(curCode);

  const categories = useMemo(() => chartData.map((d) => d.date), [chartData]);

  const isSparse = chartData.length > 0 && chartData.length <= 2 && points.length >= 2;

  const handleZoomIn = useCallback(() => {
    const instance = chartRef.current?.getEchartsInstance();
    if (!instance) return;
    const option = instance.getOption() as Record<string, unknown>;
    const zoom = (option.dataZoom as Array<Record<string, unknown>> | undefined) ?? [];
    const start = (zoom[0]?.start as number) ?? 0;
    const end = (zoom[0]?.end as number) ?? 100;
    const range = end - start;
    if (range < 5) return;
    const center = (start + end) / 2;
    const newRange = range * 0.6;
    instance.dispatchAction({
      type: "dataZoom",
      start: Math.max(center - newRange / 2, 0),
      end: Math.min(center + newRange / 2, 100),
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    const instance = chartRef.current?.getEchartsInstance();
    if (!instance) return;
    const option = instance.getOption() as Record<string, unknown>;
    const zoom = (option.dataZoom as Array<Record<string, unknown>> | undefined) ?? [];
    const start = (zoom[0]?.start as number) ?? 0;
    const end = (zoom[0]?.end as number) ?? 100;
    const range = end - start;
    const center = (start + end) / 2;
    const newRange = Math.min(range / 0.6, 100);
    instance.dispatchAction({
      type: "dataZoom",
      start: Math.max(center - newRange / 2, 0),
      end: Math.min(center + newRange / 2, 100),
    });
  }, []);

  const handleReset = useCallback(() => {
    const instance = chartRef.current?.getEchartsInstance();
    if (!instance) return;
    instance.dispatchAction({
      type: "dataZoom",
      start: 0,
      end: 100,
    });
  }, []);

  const option = useMemo(
    () => ({
      color: [INCOME_COLOR, EXPENSE_COLOR, TOTAL_COLOR],
      grid: {
        left: 10,
        right: 10,
        top: 10,
        bottom: 50,
        containLabel: true,
      },
      tooltip: {
        trigger: "axis",
        backgroundColor: isDark ? "rgba(14, 12, 36, 0.95)" : "rgba(255,255,255,0.95)",
        borderColor: isDark ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.15)",
        borderRadius: 12,
        padding: [12, 16],
        textStyle: {
          fontSize: 12,
          color: isDark ? "#f0eeff" : "#0f172a",
        },
        formatter(params) {
          const items = Array.isArray(params) ? params : [];
          const date = items[0]?.axisValue ?? "";
          let html = `<div style="font-weight:600;margin-bottom:6px;font-size:12px;color:${isDark ? "#f0eeff" : "#0f172a"}">${date}</div>`;
          for (const item of items) {
            const val = Number(item.value).toFixed(2);
            html += `<div style="display:flex;align-items:center;gap:6px;font-size:12px;margin-bottom:2px">
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${item.color}"></span>
              ${item.seriesName}: <strong>${val} ${curSym}</strong>
            </div>`;
          }
          return html;
        },
      },
      legend: {
        show: categories.length > 0,
        bottom: 0,
        left: "center",
        icon: "roundRect",
        itemWidth: 12,
        itemHeight: 4,
        textStyle: {
          fontSize: 12,
          color: isDark ? "#7e78a8" : "#64748b",
        },
      },
      xAxis: {
        type: "category",
        data: categories,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          fontSize: 11,
          color: isDark ? "#7e78a8" : "#64748b",
          hideOverlap: true,
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: "value",
        splitLine: {
          lineStyle: {
            color: isDark ? "rgba(99,102,241,0.06)" : "rgba(99,102,241,0.08)",
            type: "dashed" as const,
          },
        },
        axisLabel: {
          fontSize: 11,
          color: isDark ? "#7e78a8" : "#64748b",
        },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      dataZoom: [
        {
          type: "inside",
          start: 0,
          end: 100,
          minSpan: 5,
        },
        {
          type: "slider",
          start: 0,
          end: 100,
          minSpan: 5,
          bottom: 20,
          borderColor: isDark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.1)",
          backgroundColor: "transparent",
          fillerColor: isDark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)",
          handleStyle: {
            color: isDark ? "rgba(99,102,241,0.4)" : "rgba(99,102,241,0.3)",
          },
          textStyle: {
            fontSize: 10,
            color: isDark ? "#7e78a8" : "#64748b",
          },
          selectedDataBackground: {
            lineStyle: { color: TOTAL_COLOR, opacity: 0.3 },
            areaStyle: { color: TOTAL_COLOR, opacity: 0.05 },
          },
        },
      ],
      series: [
        {
          name: "Доходы",
          type: "line",
          smooth: true,
          symbol: "none",
          lineStyle: { width: 2 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(16, 185, 129, 0.25)" },
              { offset: 1, color: "rgba(16, 185, 129, 0.02)" },
            ]),
          },
          data: chartData.map((d) => d.income),
        },
        {
          name: "Расходы",
          type: "line",
          smooth: true,
          symbol: "none",
          lineStyle: { width: 2 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(244, 63, 94, 0.2)" },
              { offset: 1, color: "rgba(244, 63, 94, 0.01)" },
            ]),
          },
          data: chartData.map((d) => d.expense),
        },
        {
          name: "Итог",
          type: "line",
          smooth: true,
          symbol: "none",
          lineStyle: { width: 2.5, color: TOTAL_COLOR },
          data: chartData.map((d) => d.total ?? 0),
        },
      ],
      animationDuration: 600,
      animationEasing: "cubicOut" as const,
    }),
    [categories, chartData, isDark, curSym],
  );

  return (
    <article
      className="rounded-2xl border p-5"
      style={{ borderColor: v("border-primary"), background: v("bg-secondary") }}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border p-0.5" style={{ borderColor: v("border-primary") }}>
          {(["1W", "1M", "3M", "1Y"] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              className="rounded-md px-3 py-1.5 text-xs font-medium transition-all"
              style={
                timeframe === tf
                  ? { background: v("bg-active"), color: v("text-primary"), boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }
                  : { background: "transparent", color: v("text-secondary") }
              }
              onClick={() => onTimeframeChange(tf)}
            >
              {TIMEFRAME_LABELS[tf]}
            </button>
          ))}
        </div>

        <div className="flex gap-1">
          <button
            className="flex items-center justify-center rounded-lg border p-1.5 transition-colors"
            style={{ borderColor: v("border-secondary"), color: v("text-secondary"), fontSize: 16, lineHeight: 1 }}
            onMouseEnter={(e) => { e.currentTarget.style.background = v("bg-hover"); }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            onClick={handleZoomIn}
            title="Приблизить"
          >
            +
          </button>
          <button
            className="flex items-center justify-center rounded-lg border p-1.5 transition-colors"
            style={{ borderColor: v("border-secondary"), color: v("text-secondary"), fontSize: 16, lineHeight: 1 }}
            onMouseEnter={(e) => { e.currentTarget.style.background = v("bg-hover"); }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            onClick={handleZoomOut}
            title="Отдалить"
          >
            &minus;
          </button>
          <button
            className="flex items-center justify-center rounded-lg border p-1.5 transition-colors text-xs"
            style={{ borderColor: v("border-secondary"), color: v("text-secondary") }}
            onMouseEnter={(e) => { e.currentTarget.style.background = v("bg-hover"); }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            onClick={handleReset}
            title="Сбросить масштаб"
          >
            ⟲
          </button>
        </div>

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
        <div className="relative w-full overflow-hidden rounded-xl">
          <ReactECharts
            ref={chartRef}
            echarts={echarts}
            option={option}
            style={{ height: 340 }}
            notMerge
            lazyUpdate
          />
          {isSparse && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p
                className="rounded-lg px-4 py-2 text-center text-xs leading-relaxed backdrop-blur-sm"
                style={{
                  background: `color-mix(in srgb, ${v("bg-secondary")} 80%, transparent)`,
                  color: v("text-muted"),
                }}
              >
                Данных за этот период недостаточно<br />для отображения тренда —<br />добавьте больше точек
              </p>
            </div>
          )}
        </div>
      )}
    </article>
  );
});
