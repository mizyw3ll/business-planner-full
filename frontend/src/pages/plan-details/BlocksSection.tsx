import { memo, useState, useCallback, useRef } from "react";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
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
  financialCharts: FinancialPlan[];
  onDragEnd: (event: DragEndEvent) => void;
  onCreateBlock: () => void;
  onGenerateOutline: () => void;
  onEditBlock: (block: PlanBlock) => void;
  onDeleteBlock: (block: PlanBlock) => void;
  onCommentsBlock: (block: PlanBlock) => void;
  onDuplicateBlock: (block: PlanBlock) => void;
}

export const BlocksSection = memo(function BlocksSection({
  blocks,
  isDark,
  financialCharts,
  onDragEnd,
  onCreateBlock,
  onGenerateOutline,
  onEditBlock,
  onDeleteBlock,
  onCommentsBlock,
  onDuplicateBlock,
}: BlocksSectionProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 10 } }),
  );
  const { chartPointsById, chartPointsLoading } = useChartEmbedPoints(blocks);
  const [activeBlock, setActiveBlock] = useState<PlanBlock | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [overlayWidth, setOverlayWidth] = useState(0);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const block = blocks.find((b) => b.id === event.active.id);
      setActiveBlock(block ?? null);
      if (containerRef.current) {
        setOverlayWidth(containerRef.current.offsetWidth);
      }
    },
    [blocks],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveBlock(null);
      onDragEnd(event);
    },
    [onDragEnd],
  );

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
              borderColor: v("border-secondary"),
              color: v("text-secondary"),
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = v("bg-hover"); }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            onClick={onGenerateOutline}
          >
            <span className="sm:hidden">AI</span>
            <span className="hidden sm:inline">AI: структура</span>
          </button>
          <button className={tw.buttonPrimary} onClick={onCreateBlock}>
            <span className="sm:hidden">+</span>
            <span className="hidden sm:inline">Добавить блок</span>
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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveBlock(null)}
        >
          <SortableContext items={blocks.map((block) => block.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2" ref={containerRef}>
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
          <DragOverlay>
            {activeBlock ? (
              <div style={{ width: overlayWidth > 0 ? overlayWidth : undefined }}>
                <SortableBlock
                  block={activeBlock}
                  isDark={isDark}
                  financialCharts={financialCharts}
                  chartPointsById={chartPointsById}
                  chartPointsLoading={chartPointsLoading}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  onComments={() => {}}
                  onDuplicate={() => {}}
                  hideActions
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </article>
  );
});
