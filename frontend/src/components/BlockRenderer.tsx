import { useMemo, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { normalizeSwotData } from "../lib/blockDefaults";
import { ru } from "../i18n/ru";
import { RichTextEditor } from "./RichTextEditor";
import { MarkdownPreview } from "./MarkdownPreview";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { Loader2 } from "lucide-react";

echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer]);
import { v } from "../shared/theme";
import type { PlanBlock, FinancialPlan, ChartPoint } from "../api";

interface BlockRendererProps {
  block: PlanBlock;
  financialCharts: FinancialPlan[];
  isDark: boolean;
  chartPointsById?: Record<number, ChartPoint[]>;
  chartPointsLoading?: boolean;
}

/* ─── SWOT ─── */
function SwotRenderer({ block }: { block: PlanBlock }) {
  const data = normalizeSwotData(block.rich_content);
  const quadrants: { key: keyof typeof data; label: string; color: string }[] = [
    { key: "strengths", label: ru.swot.strengths, color: "#16a34a" },
    { key: "weaknesses", label: ru.swot.weaknesses, color: "#dc2626" },
    { key: "opportunities", label: ru.swot.opportunities, color: "#2563eb" },
    { key: "threats", label: ru.swot.threats, color: "#ea580c" },
  ];
  return (
    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
      {quadrants.map(({ key, label, color }) => {
        const items = (data[key] ?? []).filter((i) => i.trim());
        return (
          <div
            key={key}
            className="rounded-xl border p-3"
            style={{ borderColor: v("border-primary"), background: v("bg-primary") }}
          >
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color }}>
              {label}
            </p>
            {items.length === 0 ? (
              <p className="text-xs" style={{ color: v("text-muted") }}>
                {ru.blocks.empty.swot}
              </p>
            ) : (
              <ul className="list-disc pl-4 space-y-0.5">
                {items.map((item, i) => (
                  <li key={i} className="text-sm" style={{ color: v("text-secondary") }}>
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Timeline ─── */
function TimelineRenderer({ block }: { block: PlanBlock }) {
  const milestones =
    (block.rich_content as { milestones?: { date: string; title: string; description?: string }[] })?.milestones ?? [];
  const valid = milestones.filter((e) => e.title.trim());
  if (valid.length === 0)
    return (
      <p className="mt-2 text-xs" style={{ color: v("text-muted") }}>
        {ru.blocks.empty.timeline}
      </p>
    );
  return (
    <div className="mt-2 space-y-2">
      {valid.map((event, i) => (
        <div key={i} className="flex gap-3">
          <div className="w-20 shrink-0 text-xs font-medium" style={{ color: v("text-muted") }}>
            {event.date}
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: v("text-primary") }}>
              {event.title}
            </p>
            {event.description && (
              <p className="text-xs" style={{ color: v("text-secondary") }}>
                {event.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Metrics ─── */
function MetricsRenderer({ block }: { block: PlanBlock }) {
  const metrics =
    (block.rich_content as { metrics?: { label: string; value: string; change?: string }[] })?.metrics ?? [];
  const valid = metrics.filter((m) => m.label.trim());
  if (valid.length === 0)
    return (
      <p className="mt-2 text-xs" style={{ color: v("text-muted") }}>
        {ru.blocks.empty.metrics}
      </p>
    );
  return (
    <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
      {valid.map((m, i) => (
        <div
          key={i}
          className="rounded-xl border p-3"
          style={{ borderColor: v("border-primary"), background: v("bg-card") }}
        >
          <p className="text-xs" style={{ color: v("text-muted") }}>
            {m.label}
          </p>
          <p className="text-lg font-semibold" style={{ color: v("text-primary") }}>
            {m.value}
          </p>
          {m.change && (
            <p className="text-xs" style={{ color: v("text-secondary") }}>
              {m.change}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Chart Embed ─── */
function ChartMiniView({ points, loading }: { points?: ChartPoint[]; loading?: boolean }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<echarts.ECharts | null>(null);

  const data = useMemo(() => {
    if (!points || points.length === 0) return null;
    const grouped: Record<string, { date: string; income: number; expense: number }> = {};
    for (const p of points) {
      const key = p.date.slice(0, 10);
      if (!grouped[key]) grouped[key] = { date: key, income: 0, expense: 0 };
      if (p.type === "income") grouped[key].income += Number(p.amount);
      else grouped[key].expense += Number(p.amount);
    }
    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  }, [points]);

  useEffect(() => {
    if (!chartRef.current) return;
    if (instanceRef.current) {
      instanceRef.current.dispose();
    }
    if (!data || data.length === 0) return;

    const instance = echarts.init(chartRef.current, undefined, { renderer: "canvas" });
    instanceRef.current = instance;

    instance.setOption({
      color: ["#16a34a", "#dc2626"],
      grid: { left: 0, right: 0, top: 4, bottom: 0 },
      xAxis: {
        type: "category",
        data: data.map((d) => d.date),
        show: false,
        splitLine: { show: false },
      },
      yAxis: {
        type: "value",
        show: false,
        splitLine: { show: false },
      },
      series: [
        {
          name: "Доход",
          type: "line",
          smooth: true,
          symbol: "none",
          lineStyle: { width: 1.5 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(22, 163, 74, 0.15)" },
              { offset: 1, color: "rgba(22, 163, 74, 0.01)" },
            ]),
          },
          data: data.map((d) => d.income),
        },
        {
          name: "Расход",
          type: "line",
          smooth: true,
          symbol: "none",
          lineStyle: { width: 1.5 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(220, 38, 38, 0.12)" },
              { offset: 1, color: "rgba(220, 38, 38, 0.01)" },
            ]),
          },
          data: data.map((d) => d.expense),
        },
      ],
      animation: false,
    });

    const handleResize = () => instance.resize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      instance.dispose();
      instanceRef.current = null;
    };
  }, [data]);

  if (loading)
    return (
      <div className="flex h-24 items-center justify-center">
        <Loader2 className="animate-spin" size={16} style={{ color: v("text-muted") }} />
      </div>
    );
  if (!data || data.length === 0)
    return (
      <p className="mt-2 text-xs" style={{ color: v("text-muted") }}>
        Нет данных
      </p>
    );

  return <div ref={chartRef} className="h-32 w-full" />;
}

function ChartEmbedRenderer({
  block,
  financialCharts,
  chartPointsById,
  chartPointsLoading,
}: {
  block: PlanBlock;
  financialCharts: FinancialPlan[];
  chartPointsById?: Record<number, ChartPoint[]>;
  chartPointsLoading?: boolean;
}) {
  const linked = financialCharts.filter((c) => block.linked_financial_chart_ids.includes(c.id));
  if (linked.length === 0)
    return (
      <p className="mt-2 text-xs" style={{ color: v("text-muted") }}>
        {ru.blocks.empty.charts}
      </p>
    );

  return (
    <div className="mt-2 grid gap-3 sm:grid-cols-2">
      {linked.map((chart) => (
        <div
          key={chart.id}
          className="rounded-xl border p-3"
          style={{ borderColor: v("border-primary"), background: v("bg-card") }}
        >
          <Link
            to={`/financial-plans/${chart.id}`}
            className="text-sm font-semibold hover:underline"
            style={{ color: v("text-primary") }}
          >
            {chart.title}
          </Link>
          <ChartMiniView points={chartPointsById?.[chart.id]} loading={chartPointsLoading} />
        </div>
      ))}
    </div>
  );
}

/* ─── Markdown ─── */
function MarkdownRenderer({ block }: { block: PlanBlock }) {
  const md = (block.rich_content as { markdown?: string })?.markdown ?? "";
  if (!md.trim())
    return (
      <p className="mt-2 text-xs" style={{ color: v("text-muted") }}>
        {ru.blocks.empty.markdown}
      </p>
    );
  return (
    <div className="mt-2">
      <MarkdownPreview content={md} />
    </div>
  );
}

/* ─── Checklist ─── */
function ChecklistRenderer({ block }: { block: PlanBlock }) {
  const items = (block.rich_content as { items?: { text: string; checked: boolean }[] })?.items ?? [];
  const valid = items.filter((i) => i.text.trim());
  if (valid.length === 0)
    return (
      <p className="mt-2 text-xs" style={{ color: v("text-muted") }}>
        {ru.blocks.empty.checklist}
      </p>
    );
  return (
    <div className="mt-2 space-y-1">
      {valid.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input type="checkbox" checked={item.checked} readOnly className="shrink-0" />
          <span
            className={`text-sm ${item.checked ? "line-through" : ""}`}
            style={{ color: item.checked ? v("text-muted") : v("text-secondary") }}
          >
            {item.text}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── Fallback / Rich / Plain ─── */
function DefaultRenderer({ block, isDark }: { block: PlanBlock; isDark: boolean }) {
  const hasRich = block.rich_content && Object.keys(block.rich_content as object).length > 0;
  if (hasRich) {
    return (
      <div className="mt-2">
        <RichTextEditor content={(block.rich_content as object) ?? null} onChange={() => {}} isDark={isDark} readOnly />
      </div>
    );
  }
  return (
    <p className="mt-2 text-sm whitespace-pre-wrap" style={{ color: v("text-secondary") }}>
      {block.content}
    </p>
  );
}

/* ─── Main dispatcher ─── */
export function BlockRenderer({
  block,
  financialCharts,
  isDark,
  chartPointsById,
  chartPointsLoading,
}: BlockRendererProps) {
  switch (block.block_type) {
    case "swot":
      return <SwotRenderer block={block} />;
    case "timeline":
      return <TimelineRenderer block={block} />;
    case "metrics":
      return <MetricsRenderer block={block} />;
    case "chart_embed":
      return (
        <ChartEmbedRenderer
          block={block}
          financialCharts={financialCharts}
          chartPointsById={chartPointsById}
          chartPointsLoading={chartPointsLoading}
        />
      );
    case "markdown":
      return <MarkdownRenderer block={block} />;
    case "checklist":
      return <ChecklistRenderer block={block} />;
    default:
      return <DefaultRenderer block={block} isDark={isDark} />;
  }
}
