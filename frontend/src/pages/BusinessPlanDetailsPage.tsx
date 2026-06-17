import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Pencil, Trash2, Download, Camera, Check, X, Loader2, FileText, Table } from "lucide-react";
import toast from "react-hot-toast";
import {
  createPlanBlockApi,
  deleteBusinessPlanApi,
  deletePlanBlockApi,
  getBusinessPlanAnalyticsApi,
  generateBusinessPlanOutlineApi,
  improveBusinessPlanBlockApi,
  getBusinessPlanApi,
  getPlanBlocksApi,
  type MediaAttachment,
  reorderPlanBlocksApi,
  updateBusinessPlanApi,
  updatePlanBlockApi,
  exportBusinessPlanApi,
  saveSnapshotApi,
  getSnapshotsApi,
  deleteSnapshotApi,
  restoreSnapshotApi,
  getCommentsApi,
  createCommentApi,
  updateCommentApi,
  deleteCommentApi,
  assignTagToBlockApi,
  assignTagToPlanApi,
  unassignTagFromPlanApi,
  duplicateBlockApi,
  type BusinessPlan,
  type BusinessPlanAnalytics,
  type PlanBlock,
  type FinancialPlan,
  type Tag,
} from "../api";
import { useQueryClient } from "@tanstack/react-query";
import { ConfirmModal } from "../components/ConfirmModal";
import { queryKeys } from "../lib/queryClient";
import { BlockModal } from "../components/BlockModal";
import { SortableBlock } from "../components/SortableBlock";
import { AIPreviewModal } from "../components/AIPreviewModal";
import { useChartEmbedPoints } from "../hooks/useChartEmbedPoints";
import { useFinancialPlansQuery } from "../hooks/useCachedData";
import { ExpandableText } from "../components/ExpandableText";
import { MarkdownPreview } from "../components/MarkdownPreview";
import { RichTextEditor } from "../components/RichTextEditor";
import { TagPicker } from "../components/TagPicker";
import { buttonStyle, inputStyle, tw, v } from "../shared/theme";
import { useTheme } from "../features/theme/ThemeContext";
import { getDefaultRichContent, normalizeRichContentForBlockType } from "../lib/blockDefaults";
import { textToTiptapDoc } from "../lib/textToTiptap";
import { tiptapToText } from "../lib/tiptapToText";
import { ru } from "../i18n/ru";

export function BusinessPlanDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const planId = Number(id);
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 0, tolerance: 10 } }),
  );

  const [plan, setPlan] = useState<BusinessPlan | null>(null);
  const [blocks, setBlocks] = useState<PlanBlock[]>([]);
  const [analytics, setAnalytics] = useState<BusinessPlanAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "plan" | "block" | "snapshot" | "comment";
    id: number;
    title: string;
  } | null>(null);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [planForm, setPlanForm] = useState<{ title: string; description: string; descriptionDoc: object | null }>({
    title: "",
    description: "",
    descriptionDoc: null,
  });
  const location = useLocation();

  // Scroll to block from search result hash
  useEffect(() => {
    if (!location.hash || !blocks.length) return;
    const el = document.getElementById(location.hash.slice(1));
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 300);
    }
  }, [location.hash, blocks.length]);

  // Block modal state (for create and edit)
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<number | null>(null);
  const [blockForm, setBlockForm] = useState<{
    title: string;
    content: string;
    block_type: string;
    rich_content: object;
    media_attachments: MediaAttachment[];
    linked_financial_chart_ids: number[];
    tags: Tag[];
    due_date: string | null;
  }>({
    title: "",
    content: "",
    block_type: "general",
    rich_content: {},
    media_attachments: [],
    linked_financial_chart_ids: [],
    tags: [],
    due_date: null,
  });
  const [financialCharts, setFinancialCharts] = useState<FinancialPlan[]>([]);
  const [aiGeneratingPlan, setAiGeneratingPlan] = useState(false);
  const [aiImprovingBlock, setAiImprovingBlock] = useState(false);

  // AI Preview modal state
  const [aiPreviewOpen, setAiPreviewOpen] = useState(false);
  const [aiPreviewTitle, setAiPreviewTitle] = useState("");
  const [aiPreviewContent, setAiPreviewContent] = useState("");
  const [aiPreviewCharCount, setAiPreviewCharCount] = useState(0);
  const [aiPreviewMaxChars, setAiPreviewMaxChars] = useState(5000);
  const [aiPreviewProvider, setAiPreviewProvider] = useState("");
  const [aiPreviewModel, setAiPreviewModel] = useState("");
  const [aiPreviewSaving, setAiPreviewSaving] = useState(false);
  const [aiPreviewMode, setAiPreviewMode] = useState<"generate" | "improve">("generate");
  const aiAbortRef = useRef<AbortController | null>(null);

  // Snapshots
  const [snapshotsOpen, setSnapshotsOpen] = useState(false);
  const [snapshots, setSnapshots] = useState<
    { id: number; title: string; note: string | null; created_at: string; created_by_id: number }[]
  >([]);
  const [snapshotsLoading, setSnapshotsLoading] = useState(false);
  const [snapshotTitle, setSnapshotTitle] = useState("");
  const [snapshotNote, setSnapshotNote] = useState("");

  // Comments
  const [commentBlockId, setCommentBlockId] = useState<number | null>(null);
  const [comments, setComments] = useState<
    { id: number; content: string; resolved: boolean; created_at: string; user_id: number; username?: string | null }[]
  >([]);
  const [commentText, setCommentText] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");

  // Export format selection
  const [exportFormatOpen, setExportFormatOpen] = useState(false);

  const isEditingBlock = editingBlockId !== null;
  const { chartPointsById, chartPointsLoading } = useChartEmbedPoints(blocks);
  const { data: financialPlansList = [] } = useFinancialPlansQuery();

  useEffect(() => {
    setFinancialCharts(financialPlansList.filter((c) => c.is_active));
  }, [financialPlansList]);

  const refreshAnalytics = useCallback(async () => {
    if (!planId) return;
    try {
      setAnalytics(await getBusinessPlanAnalyticsApi(planId));
    } catch {
      // ignore analytics refresh errors
    }
  }, [planId]);

  const refreshBlocks = useCallback(async () => {
    if (!planId) return;
    try {
      setBlocks(await getPlanBlocksApi(planId));
      await refreshAnalytics();
    } catch {
      toast.error(ru.toasts.planLoadError);
    }
  }, [planId, refreshAnalytics]);

  const fetchData = useCallback(async () => {
    if (!planId) return;
    try {
      setLoading(true);
      const [planData, analyticsData] = await Promise.all([
        getBusinessPlanApi(planId),
        getBusinessPlanAnalyticsApi(planId),
      ]);
      setPlan(planData);
      setPlanForm({
        title: planData.title,
        description: planData.description ?? "",
        descriptionDoc: textToTiptapDoc(planData.description ?? ""),
      });
      setBlocks(planData.blocks ?? []);
      setAnalytics(analyticsData);
    } catch {
      toast.error(ru.toasts.planLoadError);
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  function openCreateBlockModal() {
    setEditingBlockId(null);
    setBlockForm({
      title: "",
      content: "",
      block_type: "general",
      rich_content: getDefaultRichContent("general"),
      media_attachments: [],
      linked_financial_chart_ids: [],
      tags: [],
      due_date: null,
    });
    setBlockModalOpen(true);
  }

  async function generatePlanOutlineWithAI() {
    if (!planId) return;
    const controller = new AbortController();
    aiAbortRef.current = controller;
    try {
      setAiGeneratingPlan(true);
      const result = await generateBusinessPlanOutlineApi(planId, controller.signal);
      setAiPreviewTitle("AI-структура плана");
      setAiPreviewContent(result.content);
      setAiPreviewCharCount(result.char_count);
      setAiPreviewMaxChars(result.max_chars);
      setAiPreviewProvider(result.provider);
      setAiPreviewModel(result.model);
      setAiPreviewMode("generate");
      setAiPreviewOpen(true);
    } catch (err: any) {
      if (err?.name !== "CanceledError" && err?.code !== "ERR_CANCELED") {
        toast.error("Не удалось сгенерировать структуру");
      }
    } finally {
      setAiGeneratingPlan(false);
      aiAbortRef.current = null;
    }
  }

  async function saveBlock() {
    if (!planId) return;
    try {
      let blockId: number;
      if (isEditingBlock) {
        await updatePlanBlockApi(planId, editingBlockId, {
          title: blockForm.title.trim(),
          content: blockForm.content.trim(),
          block_type: blockForm.block_type,
          rich_content: blockForm.rich_content,
          media_attachments: blockForm.media_attachments,
          linked_financial_chart_ids: blockForm.linked_financial_chart_ids,
          due_date: blockForm.due_date,
        });
        blockId = editingBlockId;
        toast.success(ru.toasts.blockUpdated);
      } else {
        const newBlock = await createPlanBlockApi(planId, {
          title: blockForm.title.trim(),
          content: blockForm.content.trim(),
          block_type: blockForm.block_type,
          rich_content: blockForm.rich_content,
          media_attachments: blockForm.media_attachments,
          linked_financial_chart_ids: blockForm.linked_financial_chart_ids,
          due_date: blockForm.due_date,
        });
        blockId = newBlock.id;
        toast.success(ru.toasts.blockAdded);
      }

      // Sync tags
      if (blockForm.tags.length > 0) {
        for (const tag of blockForm.tags) {
          await assignTagToBlockApi(planId, blockId, tag.id);
        }
      }

      setBlockModalOpen(false);
      setEditingBlockId(null);
      setBlockForm({
        title: "",
        content: "",
        block_type: "general",
        rich_content: {},
        media_attachments: [],
        linked_financial_chart_ids: [],
        tags: [],
        due_date: null,
      });
      await refreshBlocks();
    } catch {
      toast.error(isEditingBlock ? ru.toasts.blockUpdateError : ru.toasts.blockCreateError);
    }
  }

  function handleEditBlock(block: PlanBlock) {
    setEditingBlockId(block.id);
    setBlockForm({
      title: block.title,
      content: block.content,
      block_type: block.block_type,
      rich_content: normalizeRichContentForBlockType(block.block_type, block.rich_content),
      media_attachments: (block.media_attachments ?? []) as MediaAttachment[],
      linked_financial_chart_ids: block.linked_financial_chart_ids || [],
      tags: (block.tags ?? []) as Tag[],
      due_date: block.due_date ?? null,
    });
    setBlockModalOpen(true);
  }

  async function handleImproveBlockWithAI() {
    if (!planId || editingBlockId === null) return;
    const controller = new AbortController();
    aiAbortRef.current = controller;
    try {
      setAiImprovingBlock(true);

      // Сохраняем текущий контент блока перед вызовом ИИ
      await updatePlanBlockApi(planId, editingBlockId, {
        title: blockForm.title.trim(),
        content: blockForm.content.trim(),
        block_type: blockForm.block_type,
        rich_content: blockForm.rich_content,
        media_attachments: blockForm.media_attachments,
        linked_financial_chart_ids: blockForm.linked_financial_chart_ids,
        due_date: blockForm.due_date,
      });

      const result = await improveBusinessPlanBlockApi(planId, editingBlockId, controller.signal);
      setAiPreviewTitle("Улучшение блока");
      setAiPreviewContent(result.content);
      setAiPreviewCharCount(result.char_count);
      setAiPreviewMaxChars(result.max_chars);
      setAiPreviewProvider(result.provider);
      setAiPreviewModel(result.model);
      setAiPreviewMode("improve");
      setAiPreviewOpen(true);
    } catch (err: any) {
      if (err?.name !== "CanceledError" && err?.code !== "ERR_CANCELED") {
        toast.error("Не удалось улучшить текст");
      }
    } finally {
      setAiImprovingBlock(false);
      aiAbortRef.current = null;
    }
  }

  function handleCancelBlockEdit() {
    setBlockModalOpen(false);
    setEditingBlockId(null);
    setBlockForm({
      title: "",
      content: "",
      block_type: "general",
      rich_content: {},
      media_attachments: [],
      linked_financial_chart_ids: [],
      tags: [],
      due_date: null,
    });
  }

  async function handleAIPreviewSave(content: string) {
    if (aiPreviewMode === "generate") {
      // Open block modal with the AI-generated content
      setEditingBlockId(null);
      setBlockForm({
        title: "AI-структура плана",
        content: "",
        block_type: "markdown",
        rich_content: { markdown: content },
        media_attachments: [],
        tags: [],
        due_date: null,
        linked_financial_chart_ids: [],
      });
      setAiPreviewOpen(false);
      setBlockModalOpen(true);
      toast.success("AI-структура создана");
    } else if (aiPreviewMode === "improve" && planId && editingBlockId !== null) {
      // Save the improved content to the existing block
      try {
        setAiPreviewSaving(true);
        if (blockForm.block_type === "markdown") {
          await updatePlanBlockApi(planId, editingBlockId, {
            title: blockForm.title.trim(),
            content: blockForm.content.trim(),
            block_type: blockForm.block_type,
            rich_content: { markdown: content },
            media_attachments: blockForm.media_attachments,
            linked_financial_chart_ids: blockForm.linked_financial_chart_ids,
            due_date: blockForm.due_date,
          });
        } else if (["general", "financial", "marketing", "operations"].includes(blockForm.block_type)) {
          await updatePlanBlockApi(planId, editingBlockId, {
            title: blockForm.title.trim(),
            content: blockForm.content.trim(),
            block_type: blockForm.block_type,
            rich_content: textToTiptapDoc(content),
            media_attachments: blockForm.media_attachments,
            linked_financial_chart_ids: blockForm.linked_financial_chart_ids,
            due_date: blockForm.due_date,
          });
        } else {
          await updatePlanBlockApi(planId, editingBlockId, {
            title: blockForm.title.trim(),
            content: content,
            block_type: blockForm.block_type,
            rich_content: blockForm.rich_content,
            media_attachments: blockForm.media_attachments,
            linked_financial_chart_ids: blockForm.linked_financial_chart_ids,
            due_date: blockForm.due_date,
          });
        }
        // Update blockForm so BlockModal shows the new content
        if (blockForm.block_type === "markdown") {
          setBlockForm((prev) => ({ ...prev, rich_content: { markdown: content } }));
        } else if (["general", "financial", "marketing", "operations"].includes(blockForm.block_type)) {
          setBlockForm((prev) => ({ ...prev, rich_content: textToTiptapDoc(content) }));
        } else {
          setBlockForm((prev) => ({ ...prev, content }));
        }
        setAiPreviewOpen(false);
        toast.success("Текст улучшен с помощью AI");
        await refreshBlocks();
      } catch {
        toast.error("Не удалось сохранить улучшенный текст");
      } finally {
        setAiPreviewSaving(false);
      }
    }
  }

  function handleAIPreviewCancel() {
    setAiPreviewOpen(false);
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !planId) return;
    const oldIndex = blocks.findIndex((block) => block.id === active.id);
    const newIndex = blocks.findIndex((block) => block.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(blocks, oldIndex, newIndex);
    setBlocks(next);
    try {
      await reorderPlanBlocksApi(
        planId,
        next.map((block) => block.id),
      );
      toast.success(ru.toasts.orderUpdated);
    } catch {
      toast.error(ru.toasts.orderError);
      setBlocks(blocks);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget || !planId) return;
    try {
      if (deleteTarget.type === "plan") {
        await deleteBusinessPlanApi(deleteTarget.id);
        toast.success(ru.toasts.planDeleted);
        await queryClient.invalidateQueries({ queryKey: queryKeys.businessPlans });
        navigate("/business-plans");
      } else if (deleteTarget.type === "block") {
        await deletePlanBlockApi(planId, deleteTarget.id);
        toast.success(ru.toasts.blockDeleted);
        await refreshBlocks();
      } else if (deleteTarget.type === "snapshot") {
        await deleteSnapshotApi(planId, deleteTarget.id);
        toast.success(ru.toasts.snapshotDeleted);
        await loadSnapshots();
      } else {
        await deleteCommentApi(planId, commentBlockId!, deleteTarget.id);
        toast.success(ru.toasts.commentDeleteError);
        await loadComments(commentBlockId!);
      }
    } catch {
      toast.error(ru.toasts.deleteError);
    } finally {
      setDeleteTarget(null);
    }
  }

  async function savePlan() {
    if (!planId || !planForm.title.trim()) return;
    try {
      const description = planForm.descriptionDoc ? tiptapToText(planForm.descriptionDoc).trim() : undefined;
      const updated = await updateBusinessPlanApi(planId, {
        title: planForm.title.trim(),
        description: description || undefined,
      });
      setPlan(updated);
      setPlanForm({
        title: updated.title,
        description: updated.description ?? "",
        descriptionDoc: textToTiptapDoc(updated.description ?? ""),
      });
      setIsEditingPlan(false);
      toast.success(ru.toasts.planUpdated);
      await queryClient.invalidateQueries({ queryKey: queryKeys.businessPlans });
      await queryClient.invalidateQueries({ queryKey: queryKeys.kanbanBoards });
    } catch {
      toast.error(ru.toasts.planUpdateError);
    }
  }

  function handleBlockFormChange(field: string, value: string | number[] | object | Tag[] | null) {
    setBlockForm((prev) => {
      if (field === "block_type" && typeof value === "string" && value !== prev.block_type) {
        return {
          ...prev,
          block_type: value,
          rich_content: getDefaultRichContent(value),
          media_attachments: [],
          linked_financial_chart_ids: value === "chart_embed" ? prev.linked_financial_chart_ids : [],
        };
      }
      return { ...prev, [field]: value };
    });
  }

  async function handleExportPlan(format: "html" | "xlsx" | "csv" | "pdf" = "html") {
    if (!planId) return;
    try {
      const blob = await exportBusinessPlanApi(planId, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `plan_${planId}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(ru.toasts.planExported);
      setExportFormatOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("Export error:", msg, e);
      toast.error(`${ru.toasts.exportError}: ${msg}`);
    }
  }

  async function loadSnapshots() {
    if (!planId) return;
    try {
      setSnapshotsLoading(true);
      const data = await getSnapshotsApi(planId);
      setSnapshots(data);
    } catch {
      toast.error(ru.toasts.snapshotsLoadError);
    } finally {
      setSnapshotsLoading(false);
    }
  }

  async function handleSaveSnapshot() {
    if (!planId) return;
    try {
      const title = snapshotTitle.trim() || plan?.title;
      await saveSnapshotApi(planId, title || undefined, snapshotNote.trim() || undefined);
      toast.success(ru.toasts.snapshotSaved);
      setSnapshotTitle("");
      setSnapshotNote("");
      await loadSnapshots();
    } catch {
      toast.error(ru.toasts.snapshotSaveError);
    }
  }

  async function handleDeleteSnapshot(snapshotId: number, title: string) {
    setDeleteTarget({ type: "snapshot", id: snapshotId, title });
  }

  async function handleRestoreSnapshot(snapshotId: number) {
    if (!planId) return;
    try {
      await restoreSnapshotApi(planId, snapshotId);
      toast.success(ru.toasts.snapshotRestored);
      setSnapshotsOpen(false);
      await fetchData();
    } catch {
      toast.error(ru.toasts.snapshotRestoreError);
    }
  }

  async function loadComments(blockId: number) {
    if (!planId) return;
    try {
      setCommentsLoading(true);
      const data = await getCommentsApi(planId, blockId);
      setComments(data);
    } catch {
      toast.error(ru.toasts.commentsLoadError);
    } finally {
      setCommentsLoading(false);
    }
  }

  async function handleAddComment() {
    if (!planId || !commentBlockId || !commentText.trim()) return;
    try {
      await createCommentApi(planId, commentBlockId, commentText.trim());
      setCommentText("");
      await loadComments(commentBlockId);
    } catch {
      toast.error(ru.toasts.commentAddError);
    }
  }

  async function handleToggleResolveComment(commentId: number, resolved: boolean) {
    if (!planId || !commentBlockId) return;
    try {
      await updateCommentApi(planId, commentBlockId, commentId, { resolved: !resolved });
      await loadComments(commentBlockId);
    } catch {
      toast.error(ru.toasts.commentUpdateError);
    }
  }

  async function handleUpdateCommentText(commentId: number, text: string) {
    if (!planId || !commentBlockId || !text.trim()) return;
    try {
      await updateCommentApi(planId, commentBlockId, commentId, { content: text.trim() });
      setEditingCommentId(null);
      await loadComments(commentBlockId);
    } catch {
      toast.error(ru.toasts.commentUpdateError);
    }
  }

  async function handleDeleteComment(commentId: number, commentContent: string) {
    setDeleteTarget({ type: "comment", id: commentId, title: commentContent.slice(0, 50) });
  }

  if (loading) return <div className="h-48 animate-pulse rounded-2xl" style={{ background: v("bg-hover") }} />;
  if (!plan) return <div style={{ color: v("text-secondary") }}>План не найден</div>;

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
              {isEditingPlan ? (
                <input
                  className={tw.inputBase}
                  style={inputStyle(isDark)}
                  value={planForm.title}
                  onChange={(e) => setPlanForm((prev) => ({ ...prev, title: e.target.value }))}
                />
              ) : (
                <ExpandableText text={plan.title} fontSize="text-2xl" fontWeight="font-semibold" color="text-primary" />
              )}
            </div>
            <div className="shrink-0 flex flex-wrap gap-2 max-sm:w-full max-sm:justify-end">
              {isEditingPlan ? (
                <>
                  <button className={tw.buttonPrimary} onClick={() => void savePlan()}>
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
                      setPlanForm({ title: plan.title, description: plan.description ?? "", descriptionDoc: null });
                      setIsEditingPlan(false);
                    }}
                  >
                    Отмена
                  </button>
                </>
              ) : (
                <>
                  <div className="relative">
                    <button
                      className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors"
                      style={{ borderColor: v("border-secondary"), color: v("text-secondary") }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = v("bg-hover");
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                      onClick={() => setExportFormatOpen(!exportFormatOpen)}
                    >
                      <Download size={16} />
                      <span className="hidden sm:inline">{ru.modals.export}</span>
                    </button>
                    {exportFormatOpen && (
                      <div
                        className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border p-1"
                        style={{ borderColor: v("border-primary"), background: v("bg-sidebar") }}
                      >
                        <button
                          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors"
                          style={{ color: v("text-secondary") }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = v("bg-hover");
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                          }}
                          onClick={() => void handleExportPlan("html")}
                        >
                          <FileText size={14} />
                          {ru.export.html}
                        </button>
                        <button
                          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors"
                          style={{ color: v("text-secondary") }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = v("bg-hover");
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                          }}
                          onClick={() => void handleExportPlan("xlsx")}
                        >
                          <Table size={14} />
                          {ru.export.excel}
                        </button>
                        <button
                          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors"
                          style={{ color: v("text-secondary") }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = v("bg-hover");
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                          }}
                          onClick={() => void handleExportPlan("csv")}
                        >
                          <Table size={14} />
                          {ru.export.csv}
                        </button>
                        <button
                          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors"
                          style={{ color: v("text-secondary") }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = v("bg-hover");
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                          }}
                          onClick={() => void handleExportPlan("pdf")}
                        >
                          <FileText size={14} />
                          {ru.export.pdf}
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors"
                    style={{ borderColor: v("border-secondary"), color: v("text-secondary") }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = v("bg-hover");
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                    onClick={() => {
                      setSnapshotsOpen(true);
                      void loadSnapshots();
                    }}
                  >
                    <Camera size={16} />
                    <span className="hidden sm:inline">{ru.modals.snapshots}</span>
                  </button>
                  <button
                    className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors"
                    style={buttonStyle("secondary", isDark)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = v("bg-hover");
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                    onClick={() => setIsEditingPlan(true)}
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
                    onClick={() => setDeleteTarget({ type: "plan", id: plan.id, title: plan.title })}
                  >
                    <Trash2 size={16} />
                    <span className="hidden sm:inline">Удалить</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Description - full width */}
          {isEditingPlan ? (
            <RichTextEditor
              content={planForm.descriptionDoc ?? { type: "doc", content: [] }}
              onChange={(doc) => setPlanForm((prev) => ({ ...prev, descriptionDoc: doc }))}
              isDark={isDark}
              placeholder="Описание плана"
            />
          ) : (
            <MarkdownPreview content={plan.description || "Без описания"} />
          )}

          {plan && (
            <div className="mt-3">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Теги плана</label>
              <TagPicker
                selectedTags={(plan.tags ?? []) as Tag[]}
                onChange={async (tags) => {
                  if (!planId) return;
                  const currentIds = new Set((plan.tags ?? []).map((t) => t.id));
                  const newIds = new Set(tags.map((t) => t.id));

                  const toRemove = [...currentIds].filter((id) => !newIds.has(id));
                  const toAdd = tags.filter((t) => !currentIds.has(t.id));

                  try {
                    for (const tagId of toRemove) {
                      await unassignTagFromPlanApi(planId, tagId);
                    }
                    for (const tag of toAdd) {
                      await assignTagToPlanApi(planId, tag.id);
                    }
                    await fetchData();
                  } catch {
                    toast.error("Ошибка при обновлении тегов");
                  }
                }}
              />
            </div>
          )}
        </div>
      </article>

      {analytics && (
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
            {[
              ["Блоков", analytics.blocks_count],
              ["Черновиков", analytics.drafts_count],
              ["Комментариев", analytics.comments_count],
              ["Вложений", analytics.attachments_count],
              ["Связей с графиками", analytics.linked_financial_charts_count],
            ].map(([label, value]) => (
              <div
                key={label as string}
                className="rounded-xl border p-3"
                style={{ borderColor: v("border-primary"), background: v("bg-card") }}
              >
                <p className="text-xs uppercase tracking-wide" style={{ color: v("text-muted") }}>
                  {label as string}
                </p>
                <p className="mt-1 text-2xl font-semibold" style={{ color: v("text-primary") }}>
                  {value as number}
                </p>
              </div>
            ))}
          </div>
        </article>
      )}

      <article className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight" style={{ color: v("text-primary") }}>
            Блоки
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-lg border px-3 py-2 text-sm transition-colors"
              style={{
                borderColor: aiGeneratingPlan ? "rgba(220, 38, 38, 0.5)" : v("border-secondary"),
                color: aiGeneratingPlan ? "rgb(252, 165, 165)" : v("text-secondary"),
                background: aiGeneratingPlan ? "rgba(220, 38, 38, 0.1)" : "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = aiGeneratingPlan ? "rgba(220, 38, 38, 0.2)" : v("bg-hover");
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = aiGeneratingPlan ? "rgba(220, 38, 38, 0.1)" : "transparent";
              }}
              onClick={() => {
                if (aiGeneratingPlan) {
                  aiAbortRef.current?.abort();
                } else {
                  void generatePlanOutlineWithAI();
                }
              }}
            >
              {aiGeneratingPlan ? "■ Стоп" : "AI: структура"}
            </button>
            <button className={tw.buttonPrimary} onClick={openCreateBlockModal}>
              Добавить блок
            </button>
          </div>
        </div>
        {blocks.length === 0 ? (
          <div
            className="flex min-h-[150px] items-center justify-center rounded-xl border p-6"
            style={{ borderColor: v("border-primary"), background: v("bg-hover") }}
          >
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: v("text-secondary") }}>
                У вас пока нет блоков в этом плане
              </p>
              <p className="mt-1 text-xs" style={{ color: v("text-muted") }}>
                Добавьте первый блок, чтобы начать заполнять план
              </p>
            </div>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={blocks.map((block) => block.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {blocks.map((block) => (
                  <SortableBlock
                    key={block.id}
                    block={block}
                    isDark={isDark}
                    financialCharts={financialCharts}
                    chartPointsById={chartPointsById}
                    chartPointsLoading={chartPointsLoading}
                    onEdit={handleEditBlock}
                    onDelete={(item) => setDeleteTarget({ type: "block", id: item.id, title: item.title })}
                    onComments={(item) => {
                      setCommentBlockId(item.id);
                      void loadComments(item.id);
                    }}
                    onDuplicate={async (item) => {
                      if (!planId) return;
                      try {
                        await duplicateBlockApi(planId, item.id);
                        toast.success(ru.toasts.blockAdded);
                        await refreshBlocks();
                      } catch {
                        toast.error("Не удалось дублировать блок");
                      }
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </article>

      <BlockModal
        open={blockModalOpen}
        title={isEditingBlock ? ru.modals.editBlock : ru.modals.newBlock}
        form={blockForm}
        planId={planId ?? null}
        editingBlockId={editingBlockId}
        financialCharts={financialCharts}
        isDark={isDark}
        onFormChange={handleBlockFormChange}
        onSave={saveBlock}
        onCancel={handleCancelBlockEdit}
        onImproveWithAI={editingBlockId !== null ? handleImproveBlockWithAI : undefined}
        onStopAI={() => aiAbortRef.current?.abort()}
        aiImproving={aiImprovingBlock}
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

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Подтверждение удаления"
        description={
          deleteTarget
            ? `Вы действительно хотите удалить ${
                deleteTarget.type === "plan"
                  ? "бизнес-план"
                  : deleteTarget.type === "block"
                    ? "блок"
                    : deleteTarget.type === "snapshot"
                      ? "снимок"
                      : "комментарий"
              } "${deleteTarget.title}"?`
            : ""
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />

      {/* Snapshots Modal */}
      {snapshotsOpen && (
        <div className={tw.modalOverlay} style={{ background: "rgba(0,0,0,0.6)" }}>
          <div
            className="w-full max-h-[90vh] overflow-y-auto rounded-2xl border p-4 sm:max-w-lg sm:p-5"
            style={{ background: v("bg-sidebar"), borderColor: v("border-primary") }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold" style={{ color: v("text-primary") }}>
                {ru.modals.snapshots}
              </h3>
              <span className="text-xs" style={{ color: v("text-muted") }}>
                {snapshots.length}/20
              </span>
            </div>
            <div className="mt-3 space-y-2">
              <input
                className={tw.inputBase + " w-full"}
                style={inputStyle(isDark)}
                placeholder={ru.modals.snapshotTitlePlaceholder}
                value={snapshotTitle}
                onChange={(e) => setSnapshotTitle(e.target.value)}
              />
              <input
                className={tw.inputBase + " w-full"}
                style={inputStyle(isDark)}
                placeholder={ru.modals.snapshotNotePlaceholder}
                value={snapshotNote}
                onChange={(e) => setSnapshotNote(e.target.value)}
              />
              <button
                className="w-full rounded-lg border px-3 py-2 text-sm transition-colors"
                style={buttonStyle("primary", isDark)}
                disabled={snapshots.length >= 20}
                onClick={() => void handleSaveSnapshot()}
              >
                {ru.modals.saveSnapshot}
              </button>
              {snapshots.length >= 20 && (
                <p className="text-xs" style={{ color: v("text-muted") }}>
                  {ru.modals.snapshotLimitReached}
                </p>
              )}
            </div>
            {snapshotsLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="animate-spin" size={24} style={{ color: v("text-muted") }} />
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {snapshots.length === 0 ? (
                  <p className="text-sm" style={{ color: v("text-muted") }}>
                    {ru.modals.noSnapshots}
                  </p>
                ) : (
                  snapshots.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-xl border p-3"
                      style={{ borderColor: v("border-primary"), background: v("bg-primary") }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: v("text-primary") }}>
                          {s.title}
                        </p>
                        {s.note && (
                          <p className="text-xs" style={{ color: v("text-muted") }}>
                            {s.note}
                          </p>
                        )}
                        <p className="text-xs" style={{ color: v("text-muted") }}>
                          {new Date(s.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="shrink-0 flex gap-2">
                        <button
                          className="rounded-lg border px-3 py-1 text-xs"
                          style={buttonStyle("primary", isDark)}
                          onClick={() => void handleRestoreSnapshot(s.id)}
                        >
                          {ru.modals.restore}
                        </button>
                        <button
                          className="rounded-lg border px-3 py-1 text-xs"
                          style={buttonStyle("danger", isDark)}
                          onClick={() => void handleDeleteSnapshot(s.id, s.title)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <button
                className={tw.buttonSecondary}
                style={buttonStyle("secondary", isDark)}
                onClick={() => setSnapshotsOpen(false)}
              >
                {ru.modals.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments Modal */}
      {commentBlockId !== null && (
        <div className={tw.modalOverlay} style={{ background: "rgba(0,0,0,0.6)" }}>
          <div
            className="w-full max-h-[90vh] overflow-y-auto rounded-2xl border p-4 sm:max-w-lg sm:p-5"
            style={{ background: v("bg-sidebar"), borderColor: v("border-primary") }}
          >
            <h3 className="text-lg font-semibold" style={{ color: v("text-primary") }}>
              {ru.modals.comments}
            </h3>
            {commentsLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="animate-spin" size={24} style={{ color: v("text-muted") }} />
              </div>
            ) : (
              <div className="mt-3 space-y-2 max-h-[400px] overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-sm" style={{ color: v("text-muted") }}>
                    {ru.modals.noComments}
                  </p>
                ) : (
                  comments.map((c) => (
                    <div
                      key={c.id}
                      className={`rounded-xl border p-3 ${c.resolved ? "opacity-60" : ""}`}
                      style={{ borderColor: v("border-primary"), background: v("bg-primary") }}
                    >
                      <div className="flex items-center gap-2 text-xs" style={{ color: v("text-muted") }}>
                        <span className="font-medium" style={{ color: v("text-primary") }}>
                          {c.username || `User #${c.user_id}`}
                        </span>
                        <span>{new Date(c.created_at).toLocaleString()}</span>
                      </div>
                      {editingCommentId === c.id ? (
                        <div className="mt-1 flex gap-2">
                          <input
                            className={tw.inputBase + " flex-1 text-sm"}
                            style={inputStyle(isDark)}
                            value={editingCommentText}
                            onChange={(e) => setEditingCommentText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                void handleUpdateCommentText(c.id, editingCommentText);
                              }
                              if (e.key === "Escape") setEditingCommentId(null);
                            }}
                          />
                          <button
                            className="rounded-md border px-2 py-0.5 text-xs"
                            style={buttonStyle("primary", isDark)}
                            onClick={() => void handleUpdateCommentText(c.id, editingCommentText)}
                          >
                            <Check size={12} />
                          </button>
                          <button
                            className="rounded-md border px-2 py-0.5 text-xs"
                            style={buttonStyle("secondary", isDark)}
                            onClick={() => setEditingCommentId(null)}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <p className="mt-1 text-sm" style={{ color: v("text-secondary") }}>
                          {c.content}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          className="rounded-md border px-2 py-0.5 text-xs"
                          style={{ borderColor: v("border-secondary"), color: v("text-muted") }}
                          onClick={() => void handleToggleResolveComment(c.id, c.resolved)}
                        >
                          {c.resolved ? <X size={12} /> : <Check size={12} />}
                        </button>
                        {editingCommentId !== c.id && (
                          <button
                            className="rounded-md border px-2 py-0.5 text-xs"
                            style={{ borderColor: v("border-secondary"), color: v("text-muted") }}
                            onClick={() => {
                              setEditingCommentId(c.id);
                              setEditingCommentText(c.content);
                            }}
                          >
                            <Pencil size={12} />
                          </button>
                        )}
                        <button
                          className="rounded-md border px-2 py-0.5 text-xs"
                          style={buttonStyle("danger", isDark)}
                          onClick={() => void handleDeleteComment(c.id, c.content)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            <div className="mt-3 flex gap-2">
              <input
                className={tw.inputBase + " flex-1 text-sm"}
                style={inputStyle(isDark)}
                placeholder={ru.modals.addComment}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleAddComment();
                }}
              />
              <button
                className={tw.buttonPrimary}
                style={buttonStyle("primary", isDark)}
                onClick={() => void handleAddComment()}
              >
                {ru.modals.postComment}
              </button>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                className={tw.buttonSecondary}
                style={buttonStyle("secondary", isDark)}
                onClick={() => setCommentBlockId(null)}
              >
                {ru.modals.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
