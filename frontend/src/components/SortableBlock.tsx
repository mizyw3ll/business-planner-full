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
}: SortableBlockProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: block.id });

  return (
    <article
      id={`block-${block.id}`}
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        background: isDark ? theme.colors.dark.bg.secondary : theme.colors.light.bg.secondary,
        border: `1px solid ${isDark ? theme.colors.dark.border.primary : theme.colors.light.border.primary}`,
      }}
      className="rounded-2xl border p-4 overflow-hidden"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold break-words" style={{ color: v("text-primary") }}>
            {block.title}
          </h3>
          <p className="text-xs capitalize" style={{ color: v("text-muted") }}>
            {block.block_type.replace("_", " ")}
          </p>
        </div>
        <div className="shrink-0 flex gap-2">
          {!readOnly && (
            <>
              <button
                className="rounded-lg border px-3 py-1 text-xs transition-colors md:hidden"
                style={{ borderColor: v("border-secondary"), color: v("text-secondary"), cursor: "grab" }}
                {...attributes}
                {...listeners}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = v("bg-hover");
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.cursor = "grabbing";
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.cursor = "grab";
                }}
              >
                <GripVertical size={16} />
              </button>
              <button
                className="rounded-lg border px-3 py-1 text-xs transition-colors hidden md:flex"
                style={{ borderColor: v("border-secondary"), color: v("text-secondary"), cursor: "grab" }}
                {...attributes}
                {...listeners}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = v("bg-hover");
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.cursor = "grabbing";
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.cursor = "grab";
                }}
              >
                Перетащить
              </button>
              <button
                className="rounded-lg border px-3 py-1 text-xs transition-colors"
                style={{ borderColor: v("border-secondary"), color: v("text-secondary") }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = v("bg-hover");
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
                onClick={() => onEdit(block)}
              >
                <Pencil size={14} />
              </button>
              <button
                className="relative rounded-lg border px-3 py-1 text-xs transition-colors"
                style={{ borderColor: v("border-secondary"), color: v("text-secondary") }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = v("bg-hover");
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
                onClick={() => onComments(block)}
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
                className="rounded-lg border px-3 py-1 text-xs transition-colors"
                style={{ borderColor: v("border-secondary"), color: v("text-secondary") }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = v("bg-hover");
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
                onClick={() => onDuplicate(block)}
                title="Дублировать блок"
              >
                <Copy size={14} />
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
                onClick={() => onDelete(block)}
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>
      <BlockRenderer
        block={block}
        financialCharts={financialCharts}
        isDark={isDark}
        chartPointsById={chartPointsById}
        chartPointsLoading={chartPointsLoading}
      />
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
    </article>
  );
}
