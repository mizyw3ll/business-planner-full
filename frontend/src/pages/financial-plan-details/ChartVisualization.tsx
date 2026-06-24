import { memo, useMemo, useRef, useCallback } from "react";
import { Download, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import Chart from "react-apexcharts";
import type ApexCharts from "apexcharts";
import type { ApexOptions } from "apexcharts";
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
  const chartRef = useRef<ApexCharts | null>(null);
  const chartData = buildChartData(points, timeframe);
  const curCode = currencies.find((c) => c.id === chartConfig.currency_id)?.code ?? "RUB";
  const curSym = getCurrencySymbol(curCode);

  const categories = useMemo(() => chartData.map((d) => d.date), [chartData]);
  const dataLen = categories.length;

  const series = useMemo(
    () => [
      { name: "Доходы", data: chartData.map((d) => d.income) },
      { name: "Расходы", data: chartData.map((d) => d.expense) },
      { name: "Итог", data: chartData.map((d) => d.total ?? 0) },
    ],
    [chartData],
  );

  const isSparse = chartData.length > 0 && chartData.length <= 2 && points.length >= 2;

  function getCurrentRange(chart: ApexCharts): { minX: number; maxX: number } {
    const s = chart.getState();
    if (typeof s.minX === "number" && typeof s.maxX === "number") {
      return { minX: s.minX, maxX: s.maxX };
    }
    return { minX: 0, maxX: dataLen - 1 };
  }

  const handleZoomIn = useCallback(() => {
    const chart = chartRef.current;
    if (!chart || dataLen < 2) return;
    const { minX, maxX } = getCurrentRange(chart);
    const center = (minX + maxX) / 2;
    const range = maxX - minX;
    if (range < 2) return;
    const newRange = Math.max(range * 0.6, 1);
    chart.zoomX(Math.max(center - newRange / 2, 0), Math.min(center + newRange / 2, dataLen - 1));
  }, [dataLen]);

  const handleZoomOut = useCallback(() => {
    const chart = chartRef.current;
    if (!chart || dataLen < 2) return;
    const { minX, maxX } = getCurrentRange(chart);
    const center = (minX + maxX) / 2;
    const range = maxX - minX;
    const newRange = Math.min(range / 0.6, dataLen - 1);
    chart.zoomX(Math.max(center - newRange / 2, 0), Math.min(center + newRange / 2, dataLen - 1));
  }, [dataLen]);

  const handleReset = useCallback(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.resetSeries();
    chart.zoomX(0, dataLen - 1);
  }, [dataLen]);

  const options = useMemo<ApexOptions>(
    () => ({
      chart: {
        type: "area",
        stacked: false,
        toolbar: { show: false },
        zoom: { enabled: true, type: "x", autoScaleYaxis: true },
        pan: { enabled: true, type: "x" },
        selection: { enabled: false },
        animations: {
          enabled: true,
          easing: "easeinout",
          speed: 600,
          animateGradually: { enabled: true, delay: 80 },
          dynamicAnimation: { enabled: true, speed: 400 },
        },
        fontFamily: "inherit",
        foreColor: isDark ? "#7e78a8" : "#64748b",
        background: "transparent",
      },
      colors: [INCOME_COLOR, EXPENSE_COLOR, TOTAL_COLOR],
      dataLabels: { enabled: false },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.25,
          opacityTo: 0.02,
          stops: [0, 95],
        },
      },
      stroke: {
        curve: "smooth",
        width: [2, 2, 2.5],
      },
      markers: {
        size: 0,
        hover: { size: 5, sizeOffset: 3 },
      },
      grid: {
        borderColor: isDark ? "rgba(99,102,241,0.06)" : "rgba(99,102,241,0.08)",
        strokeDashArray: 3,
        xaxis: { lines: { show: false } },
      },
      xaxis: {
        categories,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          style: { colors: isDark ? "#7e78a8" : "#64748b", fontSize: "11px" },
          hideOverlappingLabels: true,
          trim: true,
        },
      },
      yaxis: {
        labels: {
          style: { colors: isDark ? "#7e78a8" : "#64748b", fontSize: "11px" },
          formatter: (val: number) => val.toFixed(0),
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      tooltip: {
        enabled: true,
        shared: true,
        intersect: false,
        followCursor: true,
        theme: isDark ? "dark" : "light",
        x: { show: true, format: "dd.MM.yyyy" },
        style: { fontSize: "12px", fontFamily: "inherit" },
        marker: { show: true },
        y: {
          formatter: (val: number) => `${val.toFixed(2)} ${curSym}`,
        },
      },
      legend: { show: false },
    }),
    [categories, isDark, curSym],
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
          <ZoomBtn icon={ZoomIn} title="Приблизить" onClick={handleZoomIn} isDark={isDark} />
          <ZoomBtn icon={ZoomOut} title="Отдалить" onClick={handleZoomOut} isDark={isDark} />
          <ZoomBtn icon={Maximize2} title="Сбросить масштаб" onClick={handleReset} isDark={isDark} />
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
          <Chart options={options} series={series} type="area" height={340} width="100%" chartRef={chartRef} />
          {isSparse && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p
                className="rounded-lg bg-[--bg-secondary]/80 px-4 py-2 text-center text-xs leading-relaxed backdrop-blur-sm"
                style={{ background: `color-mix(in srgb, ${v("bg-secondary")} 80%, transparent)`, color: v("text-muted") }}
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

/* ─── Zoom button ─── */
function ZoomBtn({
  icon: Icon,
  title,
  onClick,
  isDark,
}: {
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  onClick: () => void;
  isDark: boolean;
}) {
  return (
    <button
      className="flex items-center justify-center rounded-lg border p-1.5 transition-colors"
      style={{ borderColor: v("border-secondary"), color: v("text-secondary") }}
      onMouseEnter={(e) => { e.currentTarget.style.background = v("bg-hover"); }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
      onClick={onClick}
      title={title}
    >
      <Icon size={14} />
    </button>
  );
}
