import { memo } from "react";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import {
  type PlanBlock,
  type FinancialPlan,
} from "../../api";
import { SortableBlock } from "../../components/SortableBlock";
import { useChartEmbedPoints } from "../../hooks/useChartEmbedPoints";
import { tw, v } from "../../shared/theme";

interface BlocksSectionProps {
  blocks: PlanBlock[];
  isDark: boolean;
  aiGeneratingPlan: boolean;
  financialCharts: FinancialPlan[];
  onDragEnd: (event: DragEndEvent) => void;
  onCreateBlock: () => void;
  onToggleAI: () => void;
  onEditBlock: (block: PlanBlock) => void;
  onDeleteBlock: (block: PlanBlock) => void;
  onCommentsBlock: (block: PlanBlock) => void;
  onDuplicateBlock: (block: PlanBlock) => void;
}

export const BlocksSection = memo(function BlocksSection({
  blocks,
  isDark,
  aiGeneratingPlan,
  financialCharts,
  onDragEnd,
  onCreateBlock,
  onToggleAI,
  onEditBlock,
  onDeleteBlock,
  onCommentsBlock,
  onDuplicateBlock,
}: BlocksSectionProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 0, tolerance: 10 } }),
  );
  const { chartPointsById, chartPointsLoading } = useChartEmbedPoints(blocks);

  return (
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
            onClick={onToggleAI}
          >
            {aiGeneratingPlan ? "■ Стоп" : "AI: структура"}
          </button>
          <button className={tw.buttonPrimary} onClick={onCreateBlock}>
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
                  onEdit={onEditBlock}
                  onDelete={onDeleteBlock}
                  onComments={onCommentsBlock}
                  onDuplicate={onDuplicateBlock}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </article>
  );
});
