import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { Pencil, Trash2, Check, X, Loader2 } from "lucide-react";
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
import { AIPreviewModal } from "../components/AIPreviewModal";
import { useFinancialPlansQuery } from "../hooks/useCachedData";
import { v } from "../shared/theme";
import { useTheme } from "../features/theme/ThemeContext";
import { getDefaultRichContent, normalizeRichContentForBlockType } from "../lib/blockDefaults";
import { textToTiptapDoc } from "../lib/textToTiptap";
import { tiptapToText } from "../lib/tiptapToText";
import { ru } from "../i18n/ru";
import { useModalRegistration } from "../hooks/useModalOpen";
import { PlanHeader } from "./plan-details/PlanHeader";
import { AnalyticsGrid } from "./plan-details/AnalyticsGrid";
import { BlocksSection } from "./plan-details/BlocksSection";
import { SnapshotsModal } from "./plan-details/SnapshotsModal";
import { CommentsModal } from "./plan-details/CommentsModal";

export function BusinessPlanDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const planId = Number(id);
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const isDark = theme === "dark";

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

  useEffect(() => {
    if (!location.hash || !blocks.length) return;
    const el = document.getElementById(location.hash.slice(1));
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 300);
    }
  }, [location.hash, blocks.length]);

  const [blockModalOpen, setBlockModalOpen] = useState(false);
  useModalRegistration(blockModalOpen);
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
  const [aiGeneratingPlan, setAiGeneratingPlan] = useState(false);
  const [aiImprovingBlock, setAiImprovingBlock] = useState(false);

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

  const [snapshotsOpen, setSnapshotsOpen] = useState(false);
  useModalRegistration(snapshotsOpen);
  const [snapshots, setSnapshots] = useState<
    { id: number; title: string; note: string | null; created_at: string; created_by_id: number }[]
  >([]);
  const [snapshotsLoading, setSnapshotsLoading] = useState(false);
  const [snapshotTitle, setSnapshotTitle] = useState("");
  const [snapshotNote, setSnapshotNote] = useState("");

  const [commentBlockId, setCommentBlockId] = useState<number | null>(null);
  useModalRegistration(!!commentBlockId);
  const [comments, setComments] = useState<
    { id: number; content: string; resolved: boolean; created_at: string; user_id: number; username?: string | null }[]
  >([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");

  const isEditingBlock = editingBlockId !== null;
  const { data: financialPlansList = [] } = useFinancialPlansQuery();
  const financialCharts = useMemo(() => financialPlansList.filter((c) => c.is_active), [financialPlansList]);

  const refreshAnalytics = useCallback(async () => {
    if (!planId) return;
    try {
      setAnalytics(await getBusinessPlanAnalyticsApi(planId));
    } catch {
      // ignore
    }
  }, [planId]);

  const refreshBlocks = useCallback(async () => {
    if (!planId) return;
    try {
      setBlocks(await getPlanBlocksApi(planId));
      await refreshAnalytics();
    } catch (err: any) {
      toast.error(err?.userMessage || ru.toasts.planLoadError);
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
    } catch (err: any) {
      toast.error(err?.userMessage || ru.toasts.planLoadError);
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
        toast.error(err?.userMessage || "Не удалось сгенерировать структуру");
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
    } catch (err: any) {
      toast.error(err?.userMessage || (isEditingBlock ? ru.toasts.blockUpdateError : ru.toasts.blockCreateError));
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
        toast.error(err?.userMessage || "Не удалось улучшить текст");
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
      } catch (err: any) {
        toast.error(err?.userMessage || "Не удалось сохранить улучшенный текст");
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
      await reorderPlanBlocksApi(planId, next.map((block) => block.id));
      toast.success(ru.toasts.orderUpdated);
    } catch (err: any) {
      toast.error(err?.userMessage || ru.toasts.orderError);
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
        await refreshBlocks();
      }
    } catch (err: any) {
      toast.error(err?.userMessage || ru.toasts.deleteError);
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
    } catch (err: any) {
      toast.error(err?.userMessage || ru.toasts.planUpdateError);
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
    } catch (err: any) {
      toast.error(err?.userMessage || ru.toasts.snapshotsLoadError);
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
    } catch (err: any) {
      toast.error(err?.userMessage || ru.toasts.snapshotSaveError);
    }
  }

  async function handleRestoreSnapshot(snapshotId: number) {
    if (!planId) return;
    try {
      await restoreSnapshotApi(planId, snapshotId);
      toast.success(ru.toasts.snapshotRestored);
      setSnapshotsOpen(false);
      await fetchData();
    } catch (err: any) {
      toast.error(err?.userMessage || ru.toasts.snapshotRestoreError);
    }
  }

  async function loadComments(blockId: number) {
    if (!planId) return;
    try {
      setCommentsLoading(true);
      const data = await getCommentsApi(planId, blockId);
      setComments(data);
    } catch (err: any) {
      toast.error(err?.userMessage || ru.toasts.commentsLoadError);
    } finally {
      setCommentsLoading(false);
    }
  }

  async function handleAddComment(text: string) {
    if (!planId || !commentBlockId || !text.trim()) return;
    try {
      await createCommentApi(planId, commentBlockId, text.trim());
      await loadComments(commentBlockId);
      await refreshBlocks();
    } catch (err: any) {
      toast.error(err?.userMessage || ru.toasts.commentAddError);
    }
  }

  async function handleToggleResolveComment(commentId: number, resolved: boolean) {
    if (!planId || !commentBlockId) return;
    try {
      await updateCommentApi(planId, commentBlockId, commentId, { resolved: !resolved });
      await loadComments(commentBlockId);
      await refreshBlocks();
    } catch (err: any) {
      toast.error(err?.userMessage || ru.toasts.commentUpdateError);
    }
  }

  async function handleUpdateCommentText(commentId: number, text: string) {
    if (!planId || !commentBlockId || !text.trim()) return;
    try {
      await updateCommentApi(planId, commentBlockId, commentId, { content: text.trim() });
      setEditingCommentId(null);
      await loadComments(commentBlockId);
      await refreshBlocks();
    } catch (err: any) {
      toast.error(err?.userMessage || ru.toasts.commentUpdateError);
    }
  }

  async function handleDeleteComment(commentId: number, commentContent: string) {
    setDeleteTarget({ type: "comment", id: commentId, title: commentContent.slice(0, 50) });
  }

  async function handleTagsChange(tags: Tag[]) {
    if (!planId || !plan) return;
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
    } catch (err: any) {
      toast.error(err?.userMessage || "Ошибка при обновлении тегов");
    }
  }

  if (loading) return <div className="h-48 animate-pulse rounded-2xl" style={{ background: v("bg-hover") }} />;
  if (!plan) return <div style={{ color: v("text-secondary") }}>План не найден</div>;

  return (
    <section className="space-y-6 pb-8 pt-2 animate-fade-in">
      <PlanHeader
        plan={plan}
        isDark={isDark}
        isEditingPlan={isEditingPlan}
        planForm={planForm}
        onFormChange={(field, value) => setPlanForm((prev) => ({ ...prev, [field]: value }))}
        onStartEdit={() => setIsEditingPlan(true)}
        onSave={() => void savePlan()}
        onCancelEdit={() => {
          setPlanForm({ title: plan.title, description: plan.description ?? "", descriptionDoc: null });
          setIsEditingPlan(false);
        }}
        onDelete={() => setDeleteTarget({ type: "plan", id: plan.id, title: plan.title })}
        onOpenSnapshots={() => { setSnapshotsOpen(true); void loadSnapshots(); }}
        onTagsChange={(tags) => void handleTagsChange(tags)}
        onExport={(fmt) => void handleExportPlan(fmt)}
      />

      {analytics && <AnalyticsGrid analytics={analytics} />}

      <BlocksSection
        blocks={blocks}
        isDark={isDark}
        aiGeneratingPlan={aiGeneratingPlan}
        financialCharts={financialCharts}
        onDragEnd={onDragEnd}
        onCreateBlock={openCreateBlockModal}
        onToggleAI={() => {
          if (aiGeneratingPlan) {
            aiAbortRef.current?.abort();
          } else {
            void generatePlanOutlineWithAI();
          }
        }}
        onEditBlock={handleEditBlock}
        onDeleteBlock={(item) => setDeleteTarget({ type: "block", id: item.id, title: item.title })}
        onCommentsBlock={(item) => { setCommentBlockId(item.id); void loadComments(item.id); }}
        onDuplicateBlock={async (item) => {
          if (!planId) return;
          try {
            await duplicateBlockApi(planId, item.id);
            toast.success(ru.toasts.blockAdded);
            await refreshBlocks();
          } catch (err: any) {
            toast.error(err?.userMessage || "Не удалось дублировать блок");
          }
        }}
      />

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

      <SnapshotsModal
        open={snapshotsOpen}
        isDark={isDark}
        snapshots={snapshots}
        loading={snapshotsLoading}
        snapshotTitle={snapshotTitle}
        snapshotNote={snapshotNote}
        onTitleChange={setSnapshotTitle}
        onNoteChange={setSnapshotNote}
        onSave={() => void handleSaveSnapshot()}
        onRestore={(id) => void handleRestoreSnapshot(id)}
        onDelete={(id, title) => setDeleteTarget({ type: "snapshot", id, title })}
        onClose={() => setSnapshotsOpen(false)}
      />

      <CommentsModal
        open={commentBlockId !== null}
        isDark={isDark}
        blockTitle={commentBlockId !== null ? blocks.find((b) => b.id === commentBlockId)?.title ?? null : null}
        comments={comments}
        loading={commentsLoading}
        onAdd={(text) => void handleAddComment(text)}
        onToggleResolve={(id, resolved) => void handleToggleResolveComment(id, resolved)}
        onUpdateText={(id, text) => void handleUpdateCommentText(id, text)}
        onDelete={(id, content) => void handleDeleteComment(id, content)}
        onClose={() => setCommentBlockId(null)}
      />
    </section>
  );
}
