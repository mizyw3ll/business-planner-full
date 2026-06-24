import { useRef } from "react";
import toast from "react-hot-toast";
import { Loader2, Download } from "lucide-react";
import { RichTextEditor } from "./RichTextEditor";
import { SwotEditor, TimelineEditor, MetricsEditor, MarkdownEditor, ChecklistEditor } from "./SmartBlockEditors";
import { TagPicker } from "./TagPicker";
import { isRichTextBlockType } from "../lib/blockDefaults";
import { ru } from "../i18n/ru";
import { v, tw, inputStyle, buttonStyle } from "../shared/theme";
import { useModalRegistration } from "../hooks/useModalOpen";
import type { FinancialPlan, MediaAttachment, Tag } from "../api";
import { uploadBlockAttachmentApi, deleteBlockAttachmentApi } from "../api";

interface BlockModalProps {
  open: boolean;
  title: string;
  form: {
    title: string;
    content: string;
    block_type: string;
    rich_content: object;
    media_attachments: MediaAttachment[];
    linked_financial_chart_ids: number[];
    tags: Tag[];
    due_date: string | null;
  };
  planId: number | null;
  editingBlockId: number | null;
  financialCharts: FinancialPlan[];
  isDark: boolean;
  onFormChange: (field: string, value: string | number[] | object | null) => void;
  onSave: () => void;
  onCancel: () => void;
  onImproveWithAI?: () => Promise<void>;
  onStopAI?: () => void;
  aiImproving?: boolean;
}

const BLOCK_TYPES = [
  { value: "general", label: ru.blocks.types.general },
  { value: "financial", label: ru.blocks.types.financial },
  { value: "marketing", label: ru.blocks.types.marketing },
  { value: "operations", label: ru.blocks.types.operations },
  { value: "swot", label: ru.blocks.types.swot },
  { value: "timeline", label: ru.blocks.types.timeline },
  { value: "metrics", label: ru.blocks.types.metrics },
  { value: "chart_embed", label: ru.blocks.types.chart_embed },
  { value: "markdown", label: ru.blocks.types.markdown },
  { value: "checklist", label: ru.blocks.types.checklist },
] as const;

function isRichBlock(type: string) {
  return isRichTextBlockType(type);
}

function canSaveBlock(form: BlockModalProps["form"]): boolean {
  if (!form.title.trim()) return false;
  if (isRichBlock(form.block_type)) {
    return true;
  }
  if (form.block_type === "swot") {
    const data = form.rich_content as {
      strengths?: string[];
      weaknesses?: string[];
      opportunities?: string[];
      threats?: string[];
    };
    return Object.values(data ?? {}).some((arr) => arr?.some((s) => s.trim()));
  }
  if (form.block_type === "timeline") {
    const data = form.rich_content as { milestones?: { title?: string }[] };
    return data?.milestones?.some((m) => m.title?.trim()) ?? false;
  }
  if (form.block_type === "metrics") {
    const data = form.rich_content as { metrics?: { label?: string; value?: string }[] };
    return data?.metrics?.some((m) => m.label?.trim() || m.value?.trim()) ?? false;
  }
  if (form.block_type === "chart_embed") {
    if (form.linked_financial_chart_ids.length > 0) return true;
    return false;
  }
  if (form.block_type === "markdown") {
    return ((form.rich_content as { markdown?: string })?.markdown ?? "").trim().length > 0;
  }
  if (form.block_type === "checklist") {
    const data = form.rich_content as { items?: { text?: string }[] };
    return data?.items?.some((i) => i.text?.trim()) ?? false;
  }
  return form.content.trim().length > 0;
}

function getValidationHint(form: BlockModalProps["form"]): string | null {
  if (!form.title.trim()) return ru.blocks.validation.titleRequired;
  if (form.block_type === "swot") {
    const data = form.rich_content as { strengths?: string[]; weaknesses?: string[]; opportunities?: string[]; threats?: string[] };
    const hasAny = Object.values(data ?? {}).some((arr) => arr?.some((s) => s.trim()));
    if (!hasAny) return ru.blocks.validation.swotEmpty;
  }
  if (form.block_type === "timeline") {
    const data = form.rich_content as { milestones?: { title?: string }[] };
    if (!(data?.milestones?.some((m) => m.title?.trim()) ?? false)) return ru.blocks.validation.timelineEmpty;
  }
  if (form.block_type === "metrics") {
    const data = form.rich_content as { metrics?: { label?: string; value?: string }[] };
    if (!(data?.metrics?.some((m) => m.label?.trim() || m.value?.trim()) ?? false)) return ru.blocks.validation.metricsEmpty;
  }
  if (form.block_type === "chart_embed" && form.linked_financial_chart_ids.length === 0) {
    return ru.blocks.validation.chartNotSelected;
  }
  if (form.block_type === "markdown") {
    if (((form.rich_content as { markdown?: string })?.markdown ?? "").trim().length === 0) return ru.blocks.validation.markdownEmpty;
  }
  if (form.block_type === "checklist") {
    const data = form.rich_content as { items?: { text?: string }[] };
    if (!(data?.items?.some((i) => i.text?.trim()) ?? false)) return ru.blocks.validation.checklistEmpty;
  }
  if (!isRichBlock(form.block_type) && form.content.trim().length === 0) return ru.blocks.validation.contentRequired;
  return null;
}

export function BlockModal({
  open,
  title,
  form,
  planId,
  editingBlockId,
  financialCharts,
  isDark,
  onFormChange,
  onSave,
  onCancel,
  onImproveWithAI,
  onStopAI,
  aiImproving,
}: BlockModalProps) {
  const attachInputRef = useRef<HTMLInputElement>(null);
  useModalRegistration(open);

  if (!open) return null;

  const canSave = canSaveBlock(form);
  const uploadContext = planId && editingBlockId ? { planId, blockId: editingBlockId } : null;

  async function handleBlockAttachment(file: File) {
    if (!planId || !editingBlockId) {
      toast.error(ru.editor.saveBlockFirst);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(ru.editor.fileTooLarge);
      return;
    }
    try {
      const meta = await uploadBlockAttachmentApi(planId, editingBlockId, file);
      onFormChange("media_attachments", [...form.media_attachments, meta]);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || ru.editor.fileUploadError;
      toast.error(msg);
    }
  }

  async function removeAttachment(id: string) {
    if (!planId || !editingBlockId) return;
    try {
      await deleteBlockAttachmentApi(planId, editingBlockId, id);
      onFormChange(
        "media_attachments",
        form.media_attachments.filter((a) => a.id !== id),
      );
    } catch {
      toast.error(ru.editor.fileUploadError);
    }
  }

  return (
    <div className="fixed inset-0 z-[120] grid place-items-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div
        className="w-full max-h-[90vh] overflow-y-auto rounded-2xl border p-4 sm:max-w-xl sm:p-5"
        style={{
          background: v("bg-sidebar"),
          borderColor: v("border-primary"),
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold" style={{ color: v("text-primary") }}>
            {title}
          </h3>
          {editingBlockId && onImproveWithAI ? (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-colors"
              style={{
                borderColor: aiImproving ? "rgba(220, 38, 38, 0.5)" : v("border-secondary"),
                color: aiImproving ? "rgb(252, 165, 165)" : v("text-secondary"),
                background: aiImproving ? "rgba(220, 38, 38, 0.1)" : "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = aiImproving ? "rgba(220, 38, 38, 0.2)" : v("bg-hover");
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = aiImproving ? "rgba(220, 38, 38, 0.1)" : "transparent";
              }}
              onClick={() => {
                if (aiImproving) {
                  onStopAI?.();
                } else {
                  void onImproveWithAI();
                }
              }}
            >
              {aiImproving ? <Loader2 size={14} className="animate-spin" /> : null}
              {aiImproving ? "■ Стоп" : "AI: улучшить"}
            </button>
          ) : null}
        </div>

        <div className="mt-4 space-y-3">
          <input
            className={tw.inputBase}
            style={inputStyle(isDark)}
            value={form.title}
            onChange={(e) => onFormChange("title", e.target.value)}
            placeholder={ru.blocks.blockTitle}
          />

          <select
            className={tw.inputBase}
            style={inputStyle(isDark)}
            value={form.block_type}
            onChange={(e) => onFormChange("block_type", e.target.value)}
          >
            {BLOCK_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          <div className="pt-1">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Теги блока</label>
            <TagPicker selectedTags={form.tags} onChange={(tags) => onFormChange("tags", tags)} />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Дедлайн</label>
              <input
                type="date"
                className={tw.inputBase}
                style={inputStyle(isDark)}
                value={form.due_date ?? ""}
                min="2000-01-01"
                max="2099-12-31"
                onChange={(e) => {
                  onFormChange("due_date", e.target.value || null);
                }}
              />
          </div>

          {isRichBlock(form.block_type) && (
            <>
              <RichTextEditor
                content={form.rich_content}
                onChange={(json) => onFormChange("rich_content", json)}
                isDark={isDark}
                placeholder={ru.editor.placeholder}
                uploadContext={uploadContext}
              />
              {editingBlockId && (
                <div className="space-y-2 rounded-xl p-3" style={{ border: `1px solid ${v("border-secondary")}` }}>
                  <p className="text-sm font-medium" style={{ color: v("text-secondary") }}>
                    {ru.editor.attachments}
                  </p>
                  {form.media_attachments.length > 0 && (
                    <ul className="space-y-1">
                      {form.media_attachments.map((a) => (
                        <li key={a.id} className="flex items-center justify-between gap-2 text-xs">
                          <a
                            href={a.url}
                            target="_blank"
                            rel="noreferrer"
                            className="truncate"
                            style={{ color: v("text-primary") }}
                          >
                            {a.name}
                          </a>
                          <div className="flex shrink-0 gap-1">
                            <a
                              href={a.url}
                              download={a.name}
                              className="rounded border px-2 py-0.5"
                              style={buttonStyle("secondary", isDark)}
                              title={ru.editor.downloadFile}
                            >
                              <Download size={12} />
                            </a>
                            <button
                              type="button"
                              className="rounded border px-2 py-0.5"
                              style={buttonStyle("danger", isDark)}
                              onClick={() => void removeAttachment(a.id)}
                            >
                              {ru.editor.removeFile}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    type="button"
                    className="rounded-lg border px-3 py-1.5 text-xs"
                    style={buttonStyle("primary", isDark)}
                    onClick={() => attachInputRef.current?.click()}
                  >
                    {ru.editor.uploadFile}
                  </button>
                  <input
                    ref={attachInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (f) void handleBlockAttachment(f);
                    }}
                  />
                </div>
              )}
            </>
          )}

          {form.block_type === "swot" && (
            <SwotEditor value={form.rich_content} onChange={(v) => onFormChange("rich_content", v)} isDark={isDark} />
          )}

          {form.block_type === "timeline" && (
            <TimelineEditor
              value={form.rich_content}
              onChange={(v) => onFormChange("rich_content", v)}
              isDark={isDark}
            />
          )}

          {form.block_type === "metrics" && (
            <MetricsEditor
              value={form.rich_content}
              onChange={(v) => onFormChange("rich_content", v)}
              isDark={isDark}
            />
          )}

          {form.block_type === "chart_embed" &&
            (financialCharts.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm" style={{ color: v("text-muted") }}>
                  {ru.blocks.chartEmbed.select}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {financialCharts.map((chart) => (
                    <label
                      key={chart.id}
                      className="flex items-start gap-2 rounded-lg border px-3 py-2 text-xs cursor-pointer min-w-0"
                      style={{ borderColor: v("border-secondary"), background: v("bg-primary") }}
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 shrink-0"
                        checked={form.linked_financial_chart_ids.includes(chart.id)}
                        onChange={(e) => {
                          const newIds = e.target.checked
                            ? [...form.linked_financial_chart_ids, chart.id]
                            : form.linked_financial_chart_ids.filter((id) => id !== chart.id);
                          onFormChange("linked_financial_chart_ids", newIds);
                        }}
                      />
                      <span
                        className="line-clamp-2 break-all min-w-0"
                        style={{ color: v("text-secondary") }}
                        title={chart.title}
                      >
                        {chart.title}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <p
                className="text-sm rounded-xl border p-3"
                style={{ borderColor: v("border-secondary"), color: v("text-muted") }}
              >
                {ru.blocks.chartEmbed.noCharts}
              </p>
            ))}

          {form.block_type === "markdown" && (
            <MarkdownEditor
              value={form.rich_content}
              onChange={(v) => onFormChange("rich_content", v)}
              isDark={isDark}
            />
          )}

          {form.block_type === "checklist" && (
            <ChecklistEditor
              value={form.rich_content}
              onChange={(v) => onFormChange("rich_content", v)}
              isDark={isDark}
            />
          )}
        </div>

        <div className="mt-5 flex flex-col-reverse sm:flex-row justify-end gap-2">
          <button
            className="w-full sm:w-auto rounded-xl border px-4 py-2 text-sm transition-colors"
            style={{ borderColor: v("border-secondary"), color: v("text-secondary") }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = v("bg-hover");
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
            onClick={onCancel}
          >
            {ru.common.cancel}
          </button>
          <button
            className="w-full sm:w-auto rounded-xl border px-4 py-2 text-sm transition-colors"
            style={buttonStyle("primary", isDark)}
            disabled={!canSave}
            onMouseEnter={(e) => {
              if (canSave) e.currentTarget.style.opacity = "0.9";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
            onClick={() => {
              if (!canSave) {
                const hint = getValidationHint(form);
                if (hint) toast.error(hint);
                return;
              }
              onSave();
            }}
          >
            {ru.common.save}
          </button>
        </div>
      </div>
    </div>
  );
}
