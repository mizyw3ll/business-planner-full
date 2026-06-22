import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryClient";
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
import { v } from "../shared/theme";
import { useTheme } from "../features/theme/ThemeContext";
import { useModalRegistration } from "../hooks/useModalOpen";
import { textToTiptapDoc } from "../lib/textToTiptap";
import { tiptapToText } from "../lib/tiptapToText";
import { type Timeframe, getLocalDateTimeWithSeconds } from "./financial-plan-details/chartUtils";
import { ChartHeader } from "./financial-plan-details/ChartHeader";
import { AnalyticsPanel } from "./financial-plan-details/AnalyticsPanel";
import { ChartVisualization } from "./financial-plan-details/ChartVisualization";
import { PointsTable } from "./financial-plan-details/PointsTable";

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

  const [aiPreviewOpen, setAiPreviewOpen] = useState(false);
  const [aiPreviewTitle, setAiPreviewTitle] = useState("");
  const [aiPreviewContent, setAiPreviewContent] = useState("");
  const [aiPreviewCharCount, setAiPreviewCharCount] = useState(0);
  const [aiPreviewMaxChars, setAiPreviewMaxChars] = useState(5000);
  const [aiPreviewProvider, setAiPreviewProvider] = useState("");
  const [aiPreviewModel, setAiPreviewModel] = useState("");
  const [aiPreviewSaving, setAiPreviewSaving] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiAbortRef] = useState(() => ({ current: null as AbortController | null }));

  const [isEditingChart, setIsEditingChart] = useState(false);
  const [chartForm, setChartForm] = useState<{
    title: string;
    description: string;
    descriptionDoc: object | null;
    currency_id: number;
    is_active: boolean;
  }>({ title: "", description: "", descriptionDoc: null, currency_id: 0, is_active: true });

  const [pointModalOpen, setPointModalOpen] = useState(false);
  useModalRegistration(pointModalOpen);
  const [editingPointId, setEditingPointId] = useState<number | null>(null);
  const [form, setForm] = useState<{
    date: string;
    type: "income" | "expense";
    amount: string;
    description: string;
  }>({ date: getLocalDateTimeWithSeconds(), type: "income", amount: "", description: "" });

  const isEditingPoint = editingPointId !== null;

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
    } catch (err: any) {
      toast.error(err?.userMessage || "Не удалось загрузить график");
    } finally {
      setLoading(false);
    }
  }, [chartId]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  function openCreatePointModal() {
    setEditingPointId(null);
    setForm({ date: getLocalDateTimeWithSeconds(), type: "income", amount: "", description: "" });
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
    setForm({ date: getLocalDateTimeWithSeconds(), type: "income", amount: "", description: "" });
    setEditingPointId(null);
    setPointModalOpen(false);
  }

  async function savePoint() {
    if (!chartId) return;
    const numAmount = Number(form.amount);
    if (!form.date || Number.isNaN(numAmount)) return;
    try {
      const payload = { date: new Date(form.date).toISOString(), type: form.type, amount: numAmount, description: form.description || undefined };
      if (editingPointId) {
        await updateChartPointApi(chartId, editingPointId, payload);
      } else {
        await createChartPointApi(chartId, payload);
      }
      resetForm();
      await fetchData();
      toast.success(editingPointId ? "Точка обновлена" : "Финансовая точка добавлена");
    } catch (err: any) {
      toast.error(err?.userMessage || (editingPointId ? "Ошибка обновления точки" : "Ошибка добавления точки"));
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
    } catch (err: any) {
      toast.error(err?.userMessage || "Ошибка удаления");
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
    } catch (err: any) {
      toast.error(err?.userMessage || "Ошибка обновления финансового плана");
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
      await updateFinancialPlanApi(chartId!, { description: content });
      setAiSummary(content);
      setAiPreviewOpen(false);
      toast.success("AI-сводка сохранена");
      await fetchData();
    } catch (err: any) {
      toast.error(err?.userMessage || "Не удалось сохранить AI-сводку");
    } finally {
      setAiPreviewSaving(false);
    }
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
    } catch (err: any) {
      toast.error(err?.userMessage || "Export failed");
    }
  }

  if (loading) return <div className="h-48 animate-pulse rounded-2xl" style={{ background: v("bg-hover") }} />;
  if (!chart) return <div style={{ color: v("text-secondary") }}>График не найден</div>;

  const curCode = currencies.find((c) => c.id === chart.currency_id)?.code ?? "RUB";

  return (
    <section className="space-y-6 pb-8 pt-2 animate-fade-in">
      <ChartHeader
        chart={chart}
        isDark={isDark}
        isEditing={isEditingChart}
        chartForm={chartForm}
        currencies={currencies}
        aiSummaryLoading={aiSummaryLoading}
        aiSummary={aiSummary}
        onFormChange={(field, value) => setChartForm((prev) => ({ ...prev, [field]: value }))}
        onStartEdit={() => setIsEditingChart(true)}
        onSave={() => void saveChart()}
        onCancelEdit={() => {
          setChartForm({
            title: chart.title,
            description: chart.description ?? "",
            descriptionDoc: null,
            currency_id: chart.currency_id,
            is_active: chart.is_active,
          });
          setIsEditingChart(false);
        }}
        onDelete={() => setDeleteTarget({ type: "chart", id: chart.id, title: chart.title })}
        onToggleAI={() => { if (aiSummaryLoading) { aiAbortRef.current?.abort(); } else { void handleAiSummary(); } }}
        onCopySummary={() => { navigator.clipboard.writeText(aiSummary ?? ""); toast.success("Скопировано"); }}
        onInsertSummaryToDescription={() => {
          setChartForm((prev) => ({ ...prev, description: aiSummary ?? "", descriptionDoc: textToTiptapDoc(aiSummary ?? "") }));
          setIsEditingChart(true);
        }}
      />

      {analytics && <AnalyticsPanel analytics={analytics} currencyCode={curCode} />}

      <ChartVisualization
        points={points}
        timeframe={timeframe}
        isDark={isDark}
        chart={chart}
        currencies={currencies}
        onTimeframeChange={setTimeframe}
        onExport={(fmt) => void handleExport(fmt)}
        onAddPoint={openCreatePointModal}
      />

      <PointsTable
        points={points}
        isDark={isDark}
        onAdd={openCreatePointModal}
        onEdit={startEdit}
        onDelete={(p) => setDeleteTarget({ type: "point", id: p.id, title: `${new Date(p.date).toLocaleDateString()} ${p.amount}` })}
      />

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
            ? `Вы действительно хотите удалить ${deleteTarget.type === "chart" ? "финансовый график" : "точку"} "${deleteTarget.title}"?`
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
        onCancel={() => setAiPreviewOpen(false)}
      />
    </section>
  );
}
