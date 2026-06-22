import { memo, useState } from "react";
import { Pencil, Trash2, Download, Camera, FileText, Table } from "lucide-react";
import {
  type BusinessPlan,
  type Tag,
} from "../../api";
import { ExpandableText } from "../../components/ExpandableText";
import { MarkdownPreview } from "../../components/MarkdownPreview";
import { RichTextEditor } from "../../components/RichTextEditor";
import { TagPicker } from "../../components/TagPicker";
import { buttonStyle, inputStyle, tw, v } from "../../shared/theme";
import { ru } from "../../i18n/ru";

interface PlanHeaderProps {
  plan: BusinessPlan;
  isDark: boolean;
  isEditingPlan: boolean;
  planForm: { title: string; description: string; descriptionDoc: object | null };
  onFormChange: (field: string, value: string | object | null) => void;
  onStartEdit: () => void;
  onSave: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  onOpenSnapshots: () => void;
  onTagsChange: (tags: Tag[]) => void;
  onExport?: (format: "html" | "xlsx" | "csv" | "pdf") => void;
}

export const PlanHeader = memo(function PlanHeader({
  plan,
  isDark,
  isEditingPlan,
  planForm,
  onFormChange,
  onStartEdit,
  onSave,
  onCancelEdit,
  onDelete,
  onOpenSnapshots,
  onTagsChange,
  onExport,
}: PlanHeaderProps) {
  const [exportFormatOpen, setExportFormatOpen] = useState(false);

  return (
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
                onChange={(e) => onFormChange("title", e.target.value)}
              />
            ) : (
              <ExpandableText text={plan.title} fontSize="text-2xl" fontWeight="font-semibold" color="text-primary" />
            )}
          </div>
          <div className="shrink-0 flex flex-wrap gap-2 max-sm:w-full max-sm:justify-end">
            {isEditingPlan ? (
              <>
                <button className={tw.buttonPrimary} onClick={onSave}>
                  Сохранить
                </button>
                <button
                  className={tw.buttonSecondary}
                  style={buttonStyle("secondary", isDark)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = v("bg-hover"); }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  onClick={onCancelEdit}
                >
                  Отмена
                </button>
              </>
            ) : (
              <>
                <ExportDropdown exportFormatOpen={exportFormatOpen} setExportFormatOpen={setExportFormatOpen} onExport={onExport} />
                <button
                  className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors"
                  style={{ borderColor: v("border-secondary"), color: v("text-secondary") }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = v("bg-hover"); }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  onClick={onOpenSnapshots}
                >
                  <Camera size={16} />
                  <span className="hidden sm:inline">{ru.modals.snapshots}</span>
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors"
                  style={buttonStyle("secondary", isDark)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = v("bg-hover"); }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  onClick={onStartEdit}
                >
                  <Pencil size={16} />
                  <span className="hidden sm:inline">Редактировать</span>
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors"
                  style={buttonStyle("danger", isDark)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(220, 38, 38, 0.2)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  onClick={onDelete}
                >
                  <Trash2 size={16} />
                  <span className="hidden sm:inline">Удалить</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        {isEditingPlan ? (
          <RichTextEditor
            content={planForm.descriptionDoc ?? { type: "doc", content: [] }}
            onChange={(doc) => onFormChange("descriptionDoc", doc)}
            isDark={isDark}
            placeholder="Описание плана"
          />
        ) : (
          <MarkdownPreview content={plan.description || "Без описания"} />
        )}

        {/* Tags */}
        <div className="mt-3">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Теги плана</label>
          <TagPicker
            selectedTags={(plan.tags ?? []) as Tag[]}
            onChange={onTagsChange}
          />
        </div>
      </div>
    </article>
  );
});

interface ExportDropdownProps {
  exportFormatOpen: boolean;
  setExportFormatOpen: (open: boolean) => void;
  onExport?: (format: "html" | "xlsx" | "csv" | "pdf") => void;
}

function ExportDropdown({ exportFormatOpen, setExportFormatOpen, onExport }: ExportDropdownProps) {
  const formats = [
    { key: "html", icon: FileText, label: ru.export.html },
    { key: "xlsx", icon: Table, label: ru.export.excel },
    { key: "csv", icon: Table, label: ru.export.csv },
    { key: "pdf", icon: FileText, label: ru.export.pdf },
  ] as const;

  return (
    <div className="relative">
      <button
        className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors"
        style={{ borderColor: v("border-secondary"), color: v("text-secondary") }}
        onMouseEnter={(e) => { e.currentTarget.style.background = v("bg-hover"); }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
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
          {formats.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors"
              style={{ color: v("text-secondary") }}
              onMouseEnter={(e) => { e.currentTarget.style.background = v("bg-hover"); }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              onClick={() => { setExportFormatOpen(false); onExport?.(key as "html" | "xlsx" | "csv" | "pdf"); }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
