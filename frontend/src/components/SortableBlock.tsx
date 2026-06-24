import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2, MessageCircle, Copy } from "lucide-react";
import { BlockRenderer } from "./BlockRenderer";
import { TagChip } from "./TagChip";
import { v, theme, buttonStyle } from "../shared/theme";
import type { PlanBlock, FinancialPlan, ChartPoint } from "../api";

interface SortableBlockProps {
  block: PlanBlock;
  onDelete: (block: PlanBlock) => void;
  onEdit: (block: PlanBlock) => void;
  onComments: (block: PlanBlock) => void;
  onDuplicate: (block: PlanBlock) => void;
  financialCharts: FinancialPlan[];
  isDark: boolean;
  chartPointsById?: Record<number, ChartPoint[]>;
  chartPointsLoading?: boolean;
  readOnly?: boolean;
  hideActions?: boolean;
}

export function SortableBlock({
  block,
  onDelete,
  onEdit,
  onComments,
  onDuplicate,
  financialCharts,
  isDark,
  chartPointsById,
  chartPointsLoading,
  readOnly,
  hideActions,
}: SortableBlockProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });

  const actionBtnClass = "rounded-lg border px-2.5 py-1.5 text-xs transition-colors";

  return (
    <article
      id={`block-${block.id}`}
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0 : 1,
        background: isDark ? theme.colors.dark.bg.secondary : theme.colors.light.bg.secondary,
        border: `1px solid ${isDark ? theme.colors.dark.border.primary : theme.colors.light.border.primary}`,
      }}
      className="rounded-2xl border p-3 sm:p-4 overflow-hidden"
    >
      {/* Title row */}
      <div className="flex items-start gap-2 sm:gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-xs sm:text-base font-semibold break-words" style={{ color: v("text-primary") }}>
            {block.title}
          </h3>
          <p className="text-xs capitalize" style={{ color: v("text-muted") }}>
            {block.block_type.replace("_", " ")}
          </p>
        </div>
        {!readOnly && !hideActions && (
          <button
            className="rounded-lg border px-2 py-1 text-xs transition-colors shrink-0 flex items-center gap-1"
            style={{ borderColor: v("border-secondary"), color: v("text-secondary"), cursor: "grab" }}
            {...attributes}
            {...listeners}
            onMouseEnter={(e) => { e.currentTarget.style.background = v("bg-hover"); }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            title="Перетащить"
          >
            <GripVertical size={16} />
            <span className="hidden sm:inline">Перетащить</span>
          </button>
        )}
      </div>

      {/* Block content */}
      <BlockRenderer
        block={block}
        financialCharts={financialCharts}
        isDark={isDark}
        chartPointsById={chartPointsById}
        chartPointsLoading={chartPointsLoading}
      />

      {/* Tags & due date */}
      {block.tags && block.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {block.tags.map((tag) => (
            <TagChip key={tag.id} tag={tag} />
          ))}
        </div>
      )}
      {block.due_date && (
        <div className="mt-2 text-xs text-orange-600 dark:text-orange-400">
          Дедлайн: {new Date(block.due_date + "T00:00:00").toLocaleDateString("ru-RU")}
        </div>
      )}

      {/* Action buttons — bottom row */}
      {!hideActions && (
        <div className="flex items-center gap-1.5 mt-3 pt-2.5" style={{ borderTop: `1px solid ${isDark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)"}` }}>
          <button
            className={actionBtnClass}
            style={{ borderColor: v("border-secondary"), color: v("text-secondary") }}
            onMouseEnter={(e) => { e.currentTarget.style.background = v("bg-hover"); }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            onClick={() => onEdit(block)}
            title="Редактировать"
          >
            <Pencil size={14} />
          </button>
          <button
            className="relative rounded-lg border px-2.5 py-1.5 text-xs transition-colors"
            style={{ borderColor: v("border-secondary"), color: v("text-secondary") }}
            onMouseEnter={(e) => { e.currentTarget.style.background = v("bg-hover"); }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            onClick={() => onComments(block)}
            title="Комментарии"
          >
            <MessageCircle size={14} />
            {(block.comments_count ?? 0) > 0 && (
              <span
                className="absolute -right-1.5 -top-1.5 flex min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-tight"
                style={{ background: v("text-primary"), color: v("bg-secondary") }}
              >
                {block.comments_count}
              </span>
            )}
          </button>
          <button
            className={actionBtnClass}
            style={{ borderColor: v("border-secondary"), color: v("text-secondary") }}
            onMouseEnter={(e) => { e.currentTarget.style.background = v("bg-hover"); }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            onClick={() => onDuplicate(block)}
            title="Дублировать блок"
          >
            <Copy size={14} />
          </button>
          <button
            className={actionBtnClass}
            style={buttonStyle("danger", isDark)}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(220, 38, 38, 0.2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            onClick={() => onDelete(block)}
            title="Удалить блок"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </article>
  );
}
