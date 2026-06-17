import { Link } from "react-router-dom";
import { normalizeSwotData } from "../lib/blockDefaults";
import { ru } from "../i18n/ru";
import { RichTextEditor } from "./RichTextEditor";
import { MarkdownPreview } from "./MarkdownPreview";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartWrapper } from "../shared/components/ChartWrapper";
import { Loader2 } from "lucide-react";
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
  const events =
    (block.rich_content as { events?: { date: string; title: string; description?: string }[] })?.events ?? [];
  const valid = events.filter((e) => e.title.trim());
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
  if (loading)
    return (
      <div className="flex h-24 items-center justify-center">
        <Loader2 className="animate-spin" size={16} style={{ color: v("text-muted") }} />
      </div>
    );
  if (!points || points.length === 0)
    return (
      <p className="mt-2 text-xs" style={{ color: v("text-muted") }}>
        Нет данных
      </p>
    );

  const grouped: Record<string, { date: string; income: number; expense: number }> = {};
  for (const p of points) {
    const key = p.date.slice(0, 10);
    if (!grouped[key]) grouped[key] = { date: key, income: 0, expense: 0 };
    if (p.type === "income") grouped[key].income += Number(p.amount);
    else grouped[key].expense += Number(p.amount);
  }
  const data = Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  const maxVal = Math.max(...data.map((d) => Math.max(d.income, d.expense)), 1);

  return (
    <ChartWrapper className="h-32 w-full">
      <ResponsiveContainer width="100%" height={128}>
        <AreaChart data={data}>
          <XAxis dataKey="date" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis domain={[0, maxVal * 1.15]} hide />
          <Tooltip
            contentStyle={{ fontSize: 11, background: "#1c1c1c", border: "1px solid #2a2a2a", borderRadius: 6 }}
            formatter={(value, name) => [Number(value).toFixed(2), name === "income" ? "Доход" : "Расход"]}
          />
          <Area
            type="monotone"
            dataKey="income"
            stroke="#16a34a"
            fill="#16a34a"
            fillOpacity={0.15}
            strokeWidth={1.5}
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="expense"
            stroke="#dc2626"
            fill="#dc2626"
            fillOpacity={0.12}
            strokeWidth={1.5}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
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
