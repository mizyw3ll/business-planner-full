import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Download } from "lucide-react";
import { queryKeys } from "../lib/queryClient";
import { ExpandableText } from "../components/ExpandableText";
import { MarkdownPreview } from "../components/MarkdownPreview";
import { RichTextEditor } from "../components/RichTextEditor";
import { CartesianGrid, Line, Area, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartWrapper } from "../shared/components/ChartWrapper";
import toast from "react-hot-toast";
import {
  createChartPointApi,
  deleteChartPointApi,
  deleteFinancialPlanApi,
  getFinancialChartAnalyticsApi,
  getCurrenciesApi,
  getFinancialPlanApi,
  summarizeFinancialChartApi,
  updateFinancialPlanApi,
  updateChartPointApi,
  exportFinancialChartApi,
  type ChartPoint,
  type Currency,
  type FinancialChartAnalytics,
  type FinancialPlan,
} from "../api";
import { ConfirmModal } from "../components/ConfirmModal";
import { PointModal } from "../components/PointModal";
import { AIPreviewModal } from "../components/AIPreviewModal";
import { inputStyle, buttonStyle, tw, v } from "../shared/theme";
import { getCurrencySymbol, getCurrencyRussianName } from "../shared/currency";
import { useTheme } from "../features/theme/ThemeContext";
import { textToTiptapDoc } from "../lib/textToTiptap";
import { tiptapToText } from "../lib/tiptapToText";

type Timeframe = "1W" | "1M" | "3M" | "1Y";

type PointFormState = {
  date: string;
  type: "income" | "expense";
  amount: string;
  description: string;
};

function getLocalDateTimeWithSeconds(date = new Date()) {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 19);
}

type TimeframeConfig = {
  rangeMs: number;
  bucket: "day" | "week" | "month";
};

type AggregatedPoint = {
  date: string;
  timestamp: number;
  income: number;
  expense: number;
  total: number;
};

const TIMEFRAME_CONFIG: Record<Timeframe, TimeframeConfig> = {
  "1W": { rangeMs: 7 * 24 * 60 * 60 * 1000, bucket: "day" },
  "1M": { rangeMs: 30 * 24 * 60 * 60 * 1000, bucket: "day" },
  "3M": { rangeMs: 90 * 24 * 60 * 60 * 1000, bucket: "week" },
  "1Y": { rangeMs: 365 * 24 * 60 * 60 * 1000, bucket: "month" },
};

function getBucketDate(date: Date, bucket: TimeframeConfig["bucket"]) {
  if (bucket === "day") {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
  if (bucket === "week") {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.getFullYear(), date.getMonth(), diff);
  }
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getBucketLabel(date: Date, bucket: TimeframeConfig["bucket"]) {
  if (bucket === "day") {
    return date.toLocaleDateString();
  }
  if (bucket === "week") {
    const weekStart = new Date(date);
    const weekEnd = new Date(date);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
  }
  return date.toLocaleString([], { month: "long", year: "numeric" });
}

function buildChartData(points: ChartPoint[], timeframe: Timeframe): AggregatedPoint[] {
  const now = Date.now();
  const { rangeMs, bucket } = TIMEFRAME_CONFIG[timeframe];
  const threshold = rangeMs > 0 ? now - rangeMs : 0;
  const filteredPoints = rangeMs > 0 ? points.filter((point) => new Date(point.date).getTime() >= threshold) : points;

  const sortedPoints = filteredPoints.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const aggregated = new Map<number, AggregatedPoint>();
  let runningTotal = 0;

  sortedPoints.forEach((point) => {
    const pointDate = new Date(point.date);
    const bucketDate = getBucketDate(pointDate, bucket);
    const bucketTimestamp = bucketDate.getTime();
    const amount = Number(point.amount);

    if (point.type === "income") {
      runningTotal += amount;
    } else {
      runningTotal -= amount;
    }

    const existing = aggregated.get(bucketTimestamp);
    if (existing) {
      if (point.type === "income") existing.income += amount;
      else existing.expense += amount;
      existing.total = runningTotal;
    } else {
      aggregated.set(bucketTimestamp, {
        date: getBucketLabel(bucketDate, bucket),
        timestamp: bucketTimestamp,
        income: point.type === "income" ? amount : 0,
        expense: point.type === "expense" ? amount : 0,
        total: runningTotal,
      });
    }
  });

  return Array.from(aggregated.values()).sort((a, b) => a.timestamp - b.timestamp);
}

export function FinancialPlanDetailsPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { id } = useParams();
  const navigate = useNavigate();
  const chartId = Number(id);
  const queryClient = useQueryClient();

  const [chart, setChart] = useState<FinancialPlan | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [points, setPoints] = useState<ChartPoint[]>([]);
  const [analytics, setAnalytics] = useState<FinancialChartAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<Timeframe>("1W");
  const [deleteTarget, setDeleteTarget] = useState<{ type: "chart" | "point"; id: number; title: string } | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);

  // AI Preview modal state
  const [aiPreviewOpen, setAiPreviewOpen] = useState(false);
  const [aiPreviewTitle, setAiPreviewTitle] = useState("");
  const [aiPreviewContent, setAiPreviewContent] = useState("");
  const [aiPreviewCharCount, setAiPreviewCharCount] = useState(0);
  const [aiPreviewMaxChars, setAiPreviewMaxChars] = useState(5000);
  const [aiPreviewProvider, setAiPreviewProvider] = useState("");
  const [aiPreviewModel, setAiPreviewModel] = useState("");
  const [aiPreviewSaving, setAiPreviewSaving] = useState(false);
  const aiAbortRef = useRef<AbortController | null>(null);
  const [isEditingChart, setIsEditingChart] = useState(false);
  const [chartForm, setChartForm] = useState<{
    title: string;
    description: string;
    descriptionDoc: object | null;
    currency_id: number;
    is_active: boolean;
  }>({
    title: "",
    description: "",
    descriptionDoc: null,
    currency_id: 0,
    is_active: true,
  });

  // Point modal state
  const [pointModalOpen, setPointModalOpen] = useState(false);
  const [editingPointId, setEditingPointId] = useState<number | null>(null);
  const [form, setForm] = useState<PointFormState>({
    date: getLocalDateTimeWithSeconds(),
    type: "income" as "income" | "expense",
    amount: "",
    description: "",
  });

  const isEditingPoint = editingPointId !== null;

  const chartData = useMemo(() => buildChartData(points, timeframe), [points, timeframe]);

  const fetchData = useCallback(async () => {
    if (!chartId) return;
    try {
      setLoading(true);
      const [chartData, currenciesData, analyticsData] = await Promise.all([
        getFinancialPlanApi(chartId),
        getCurrenciesApi(),
        getFinancialChartAnalyticsApi(chartId, false),
      ]);
      setChart(chartData);
      setChartForm({
        title: chartData.title,
        description: chartData.description ?? "",
        descriptionDoc: textToTiptapDoc(chartData.description ?? ""),
        currency_id: chartData.currency_id,
        is_active: chartData.is_active,
      });
      setCurrencies(currenciesData);
      setPoints(chartData.chart_points ?? []);
      setAnalytics(analyticsData);
    } catch {
      toast.error("Не удалось загрузить график");
    } finally {
      setLoading(false);
    }
  }, [chartId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  function openCreatePointModal() {
    setEditingPointId(null);
    setForm({
      date: getLocalDateTimeWithSeconds(),
      type: "income",
      amount: "",
      description: "",
    });
    setPointModalOpen(true);
  }

  function startEdit(point: ChartPoint) {
    setEditingPointId(point.id);
    setForm({
      date: getLocalDateTimeWithSeconds(new Date(point.date)),
      type: point.type,
      amount: String(point.amount),
      description: point.description || "",
    });
    setPointModalOpen(true);
  }

  function resetForm() {
    setForm({
      date: getLocalDateTimeWithSeconds(),
      type: "income",
      amount: "",
      description: "",
    });
    setEditingPointId(null);
    setPointModalOpen(false);
  }

  async function savePoint() {
    if (!chartId) return;
    const numAmount = Number(form.amount);
    if (!form.date || Number.isNaN(numAmount)) return;
    try {
      const payload = {
        date: new Date(form.date).toISOString(),
        type: form.type,
        amount: numAmount,
        description: form.description || undefined,
      };

      if (editingPointId) {
        await updateChartPointApi(chartId, editingPointId, payload);
      } else {
        await createChartPointApi(chartId, payload);
      }

      resetForm();
      await fetchData();
      toast.success(editingPointId ? "Точка обновлена" : "Финансовая точка добавлена");
    } catch {
      toast.error(editingPointId ? "Ошибка обновления точки" : "Ошибка добавления точки");
    }
  }

  function handleFormChange(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function confirmDelete() {
    if (!deleteTarget || !chartId) return;
    try {
      if (deleteTarget.type === "chart") {
        await deleteFinancialPlanApi(deleteTarget.id);
        toast.success("График удален");
        await queryClient.invalidateQueries({ queryKey: queryKeys.financialPlans });
        navigate("/financial-plans");
      } else {
        await deleteChartPointApi(chartId, deleteTarget.id);
        toast.success("Точка удалена");
        await fetchData();
      }
    } catch {
      toast.error("Ошибка удаления");
    } finally {
      setDeleteTarget(null);
    }
  }

  async function saveChart() {
    if (!chartId || !chart || !chartForm.title.trim()) return;
    try {
      const description = chartForm.descriptionDoc ? tiptapToText(chartForm.descriptionDoc).trim() : undefined;
      const updated = await updateFinancialPlanApi(chartId, {
        title: chartForm.title.trim(),
        description: description || undefined,
        currency_id: chartForm.currency_id,
        is_active: chartForm.is_active,
      });
      setChart(updated);
      setChartForm({
        title: updated.title,
        description: updated.description ?? "",
        descriptionDoc: textToTiptapDoc(updated.description ?? ""),
        currency_id: updated.currency_id,
        is_active: updated.is_active,
      });
      setIsEditingChart(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.financialPlans });
      toast.success("Финансовый план обновлен");
    } catch {
      toast.error("Ошибка обновления финансового плана");
    }
  }

  async function handleAiSummary() {
    if (!chartId) return;
    const controller = new AbortController();
    aiAbortRef.current = controller;
    try {
      setAiSummaryLoading(true);
      const result = await summarizeFinancialChartApi(chartId, controller.signal);
      setAiPreviewTitle("AI-сводка по графику");
      setAiPreviewContent(result.content);
      setAiPreviewCharCount(result.char_count);
      setAiPreviewMaxChars(result.max_chars);
      setAiPreviewProvider(result.provider);
      setAiPreviewModel(result.model);
      setAiPreviewOpen(true);
    } catch (err: any) {
      if (err?.name !== "CanceledError" && err?.code !== "ERR_CANCELED") {
        toast.error("Не удалось получить AI-сводку");
      }
    } finally {
      setAiSummaryLoading(false);
      aiAbortRef.current = null;
    }
  }

  async function handleAIPreviewSave(content: string) {
    try {
      setAiPreviewSaving(true);
      // Save the AI summary as the chart description
      await updateFinancialPlanApi(chartId!, {
        description: content,
      });
      setAiSummary(content);
      setAiPreviewOpen(false);
      toast.success("AI-сводка сохранена");
      await fetchData();
    } catch {
      toast.error("Не удалось сохранить AI-сводку");
    } finally {
      setAiPreviewSaving(false);
    }
  }

  function handleAIPreviewCancel() {
    setAiPreviewOpen(false);
  }

  async function handleExport(format: "xlsx" | "csv") {
    if (!chartId) return;
    try {
      const blob = await exportFinancialChartApi(chartId, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chart_${chartId}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch {
      toast.error("Export failed");
    }
  }

  if (loading) return <div className="h-48 animate-pulse rounded-2xl" style={{ background: v("bg-hover") }} />;
  if (!chart) return <div style={{ color: v("text-secondary") }}>График не найден</div>;

  return (
    <section className="space-y-6 pb-8 pt-2 animate-fade-in">
      <article
        className="rounded-2xl border p-5"
        style={{
          borderColor: v("border-primary"),
          background: v("bg-secondary"),
        }}
      >
        <div className="space-y-3">
          {/* Title row with buttons */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {isEditingChart ? (
                <input
                  className={tw.inputBase}
                  style={inputStyle(isDark)}
                  value={chartForm.title}
                  onChange={(e) => setChartForm((prev) => ({ ...prev, title: e.target.value }))}
                />
              ) : (
                <ExpandableText
                  text={chart.title}
                  fontSize="text-2xl"
                  fontWeight="font-semibold"
                  color="text-primary"
                />
              )}
            </div>
            <div className="shrink-0 flex flex-wrap gap-2 max-sm:w-full max-sm:justify-end">
              <button
                className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors"
                style={{
                  borderColor: aiSummaryLoading ? "rgba(220, 38, 38, 0.5)" : v("border-secondary"),
                  color: aiSummaryLoading ? "rgb(252, 165, 165)" : v("text-secondary"),
                  background: aiSummaryLoading ? "rgba(220, 38, 38, 0.1)" : "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = aiSummaryLoading ? "rgba(220, 38, 38, 0.2)" : v("bg-hover");
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = aiSummaryLoading ? "rgba(220, 38, 38, 0.1)" : "transparent";
                }}
                onClick={() => {
                  if (aiSummaryLoading) {
                    aiAbortRef.current?.abort();
                  } else {
                    void handleAiSummary();
                  }
                }}
              >
                {aiSummaryLoading ? "■ Стоп" : "AI: сводка"}
              </button>
              {isEditingChart ? (
                <>
                  <button className={tw.buttonPrimary} onClick={() => void saveChart()}>
                    Сохранить
                  </button>
                  <button
                    className={tw.buttonSecondary}
                    style={buttonStyle("secondary", isDark)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = v("bg-hover");
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                    onClick={() => {
                      setChartForm({
                        title: chart.title,
                        description: chart.description ?? "",
                        descriptionDoc: null,
                        currency_id: chart.currency_id,
                        is_active: chart.is_active,
                      });
                      setIsEditingChart(false);
                    }}
                  >
                    Отмена
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors"
                    style={buttonStyle("secondary", isDark)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = v("bg-hover");
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                    onClick={() => setIsEditingChart(true)}
                  >
                    <Pencil size={16} />
                    <span className="hidden sm:inline">Редактировать</span>
                  </button>
                  <button
                    className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors"
                    style={buttonStyle("danger", isDark)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(220, 38, 38, 0.2)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                    onClick={() => setDeleteTarget({ type: "chart", id: chart.id, title: chart.title })}
                  >
                    <Trash2 size={16} />
                    <span className="hidden sm:inline">Удалить</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Description and details - full width */}
          {isEditingChart ? (
            <div className="space-y-2">
              <RichTextEditor
                content={chartForm.descriptionDoc ?? { type: "doc", content: [] }}
                onChange={(doc) => setChartForm((prev) => ({ ...prev, descriptionDoc: doc }))}
                isDark={isDark}
                placeholder="Описание графика"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <select
                  className={tw.inputBase}
                  style={inputStyle(isDark)}
                  value={chartForm.currency_id}
                  onChange={(e) => setChartForm((prev) => ({ ...prev, currency_id: Number(e.target.value) }))}
                >
                  <option value={0}>Выберите валюту</option>
                  {currencies.map((currency) => (
                    <option key={currency.id} value={currency.id}>
                      {getCurrencySymbol(currency.code)} — {getCurrencyRussianName(currency.code)}
                    </option>
                  ))}
                </select>
                <label
                  className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"
                  style={{ borderColor: v("border-primary"), color: v("text-secondary") }}
                >
                  <input
                    type="checkbox"
                    checked={chartForm.is_active}
                    onChange={(e) => setChartForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                  />
                  Активный график
                </label>
              </div>
            </div>
          ) : (
            <>
              <MarkdownPreview content={chart.description || "Без описания"} />
              <p className="text-sm" style={{ color: v("text-muted") }}>
                Валюта:{" "}
                {(() => {
                  const cur = currencies.find((currency) => currency.id === chart.currency_id);
                  if (!cur) return `ID ${chart.currency_id}`;
                  return `${getCurrencySymbol(cur.code)} — ${getCurrencyRussianName(cur.code)}`;
                })()}
                {" | "}Статус:
                <span style={{ color: chart.is_active ? "#16a34a" : v("text-muted") }}>
                  {chart.is_active ? " активен" : " неактивен"}
                </span>
              </p>
            </>
          )}

          {aiSummary && (
            <div
              className="rounded-xl border p-4"
              style={{ borderColor: v("border-primary"), background: v("bg-card") }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold" style={{ color: v("text-primary") }}>
                  AI-сводка
                </h3>
                <div className="flex gap-2">
                  <button
                    className="rounded-lg border px-3 py-1.5 text-xs transition-colors"
                    style={{ borderColor: v("border-secondary"), color: v("text-secondary") }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = v("bg-hover");
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                    onClick={() => {
                      navigator.clipboard.writeText(aiSummary);
                      toast.success("Скопировано");
                    }}
                  >
                    Копировать
                  </button>
                  <button
                    className="rounded-lg border px-3 py-1.5 text-xs transition-colors"
                    style={buttonStyle("primary", isDark)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = v("bg-hover");
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                    onClick={() => {
                      setChartForm((prev) => ({
                        ...prev,
                        description: aiSummary,
                        descriptionDoc: textToTiptapDoc(aiSummary),
                      }));
                      setIsEditingChart(true);
                    }}
                  >
                    Вставить в описание
                  </button>
                </div>
              </div>
              <div className="mt-3">
                <MarkdownPreview content={aiSummary} />
              </div>
            </div>
          )}
        </div>
      </article>

      {analytics &&
        (() => {
          const curCode = currencies.find((c) => c.id === chart.currency_id)?.code ?? "RUB";
          const curSymbol = getCurrencySymbol(curCode);
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
                  Быстрая аналитика графика
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "Доход", value: analytics.income_total, fixed: 2 },
                  { label: "Расход", value: analytics.expense_total, fixed: 2 },
                  { label: "Net", value: analytics.net_total, fixed: 2 },
                  { label: "Точек", value: analytics.points_count, fixed: 0 },
                ].map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-xl border p-3"
                    style={{ borderColor: v("border-primary"), background: v("bg-card") }}
                  >
                    <p className="text-xs uppercase tracking-wide" style={{ color: v("text-muted") }}>
                      {metric.label}
                    </p>
                    <p className="mt-1 text-2xl font-semibold" style={{ color: v("text-primary") }}>
                      {metric.fixed === 0
                        ? Math.round(metric.value).toString()
                        : `${Number(metric.value).toFixed(metric.fixed)} ${curSymbol}`}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          );
        })()}

      <article
        className="rounded-2xl border p-5"
        style={{
          borderColor: v("border-primary"),
          background: v("bg-secondary"),
        }}
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
              onClick={() => setTimeframe(tf)}
            >
              {tf === "1W" ? "По неделям" : tf === "1M" ? "Месяц" : tf === "3M" ? "3 месяца" : "Год"}
            </button>
          ))}
          <div className="ml-auto flex gap-2">
            <button
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors"
              style={{ borderColor: v("border-secondary"), color: v("text-secondary") }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = v("bg-hover");
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
              onClick={() => void handleExport("csv")}
            >
              <Download size={14} /> CSV
            </button>
            <button
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors"
              style={buttonStyle("primary", isDark)}
              onClick={() => void handleExport("xlsx")}
            >
              <Download size={14} /> Excel
            </button>
          </div>
        </div>
        {/* Chart with horizontal scroll on mobile */}
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
                onClick={openCreatePointModal}
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
                            <p
                              style={{
                                color: isDark ? "#f0eeff" : "#0f172a",
                                fontWeight: 600,
                                marginBottom: 6,
                                fontSize: 12,
                              }}
                            >
                              {label}
                            </p>
                            {typeof item.income === "number" && item.income > 0 && (
                              <p style={{ color: "#10b981", fontSize: 12, marginBottom: 2 }}>
                                <span
                                  style={{
                                    display: "inline-block",
                                    width: 8,
                                    height: 8,
                                    borderRadius: "50%",
                                    background: "#10b981",
                                    marginRight: 6,
                                  }}
                                />
                                Доходы: {item.income.toFixed(2)} {curSym}
                              </p>
                            )}
                            {typeof item.expense === "number" && item.expense > 0 && (
                              <p style={{ color: "#f43f5e", fontSize: 12, marginBottom: 2 }}>
                                <span
                                  style={{
                                    display: "inline-block",
                                    width: 8,
                                    height: 8,
                                    borderRadius: "50%",
                                    background: "#f43f5e",
                                    marginRight: 6,
                                  }}
                                />
                                Расходы: {item.expense.toFixed(2)} {curSym}
                              </p>
                            )}
                            {typeof item.total === "number" && (
                              <p
                                style={{
                                  color: isDark ? "#f0eeff" : "#0f172a",
                                  fontWeight: 700,
                                  marginTop: 6,
                                  paddingTop: 6,
                                  borderTop: `1px solid ${isDark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.1)"}`,
                                  fontSize: 13,
                                }}
                              >
                                Итог: {item.total.toFixed(2)} {curSym}
                              </p>
                            )}
                          </div>
                        );
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="income"
                      stroke="none"
                      fill="url(#incomeGradient)"
                      fillOpacity={1}
                      isAnimationActive={true}
                      animationDuration={600}
                    />
                    <Area
                      type="monotone"
                      dataKey="expense"
                      stroke="none"
                      fill="url(#expenseGradient)"
                      fillOpacity={1}
                      isAnimationActive={true}
                      animationDuration={600}
                    />
                    <Line
                      type="monotone"
                      dataKey="income"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: "#10b981", strokeWidth: 0, r: 3 }}
                      activeDot={{ r: 5, stroke: "#10b981", strokeWidth: 2, fill: isDark ? "#0e0c24" : "#fff" }}
                      isAnimationActive={true}
                      animationDuration={600}
                    />
                    <Line
                      type="monotone"
                      dataKey="expense"
                      stroke="#f43f5e"
                      strokeWidth={2}
                      dot={{ fill: "#f43f5e", strokeWidth: 0, r: 3 }}
                      activeDot={{ r: 5, stroke: "#f43f5e", strokeWidth: 2, fill: isDark ? "#0e0c24" : "#fff" }}
                      isAnimationActive={true}
                      animationDuration={600}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      dot={{ fill: "#6366f1", strokeWidth: 0, r: 3 }}
                      activeDot={{
                        r: 6,
                        stroke: "#6366f1",
                        strokeWidth: 2,
                        fill: isDark ? "#0e0c24" : "#fff",
                        strokeDasharray: "0",
                      }}
                      strokeDasharray="0"
                      isAnimationActive={true}
                      animationDuration={600}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartWrapper>
            </div>
            {/* Legend */}
            <div
              className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs"
              style={{ color: isDark ? "#7e78a8" : "#64748b" }}
            >
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: "#10b981" }} />
                Доходы
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: "#f43f5e" }} />
                Расходы
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#6366f1" }} />
                Итог
              </span>
            </div>
          </>
        )}
      </article>

      <article className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight" style={{ color: v("text-primary") }}>
            Точки графика
          </h2>
          <button className={tw.buttonPrimary} onClick={openCreatePointModal}>
            Добавить точку
          </button>
        </div>
        {points.length === 0 ? (
          <div
            className="flex min-h-[150px] items-center justify-center rounded-xl border p-6"
            style={{ borderColor: v("border-primary"), background: v("bg-hover") }}
          >
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: v("text-secondary") }}>
                У вас пока нет точек в этом графике
              </p>
              <p className="mt-1 text-xs" style={{ color: v("text-muted") }}>
                Добавьте минимум 2 точки для отображения графика
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {points.map((point) => (
              <div
                key={point.id}
                className="rounded-xl border p-3 transition overflow-hidden"
                style={{
                  borderColor: v("border-primary"),
                  background: v("bg-card"),
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = v("border-secondary");
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = v("border-primary");
                }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm" style={{ color: v("text-secondary") }}>
                    {new Date(point.date).toLocaleString()}
                  </p>
                  <p className="text-xs" style={{ color: v("text-muted") }}>
                    {point.type === "income" ? "Доход" : "Расход"}: {point.amount}
                  </p>
                  {point.description && <ExpandableText text={point.description} className="mt-1" />}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    className="rounded-lg border px-3 py-1 text-xs transition-colors"
                    style={{ borderColor: v("border-secondary"), color: v("text-secondary") }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = v("bg-hover");
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                    onClick={() => startEdit(point)}
                  >
                    Редактировать
                  </button>
                  <button
                    className="rounded-lg border px-3 py-1 text-xs transition-colors"
                    style={buttonStyle("danger", isDark)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(220, 38, 38, 0.2)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                    onClick={() =>
                      setDeleteTarget({
                        type: "point",
                        id: point.id,
                        title: `${new Date(point.date).toLocaleDateString()} ${point.amount}`,
                      })
                    }
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>

      <PointModal
        open={pointModalOpen}
        title={isEditingPoint ? "Редактировать точку" : "Добавить точку"}
        form={form}
        isDark={isDark}
        onFormChange={handleFormChange}
        onSave={savePoint}
        onCancel={resetForm}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Подтверждение удаления"
        description={
          deleteTarget
            ? `Вы действительно хотите удалить ${deleteTarget.type === "chart" ? "финансовый график" : "точку"} "${
                deleteTarget.title
              }"?`
            : ""
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />

      <AIPreviewModal
        open={aiPreviewOpen}
        title={aiPreviewTitle}
        content={aiPreviewContent}
        charCount={aiPreviewCharCount}
        maxChars={aiPreviewMaxChars}
        provider={aiPreviewProvider}
        model={aiPreviewModel}
        saving={aiPreviewSaving}
        onSave={(content) => void handleAIPreviewSave(content)}
        onCancel={handleAIPreviewCancel}
      />
    </section>
  );
}
