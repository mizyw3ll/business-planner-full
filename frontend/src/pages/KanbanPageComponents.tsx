import { useRef, useState } from "react";
import { Plus, Trash2, GripVertical, Pencil } from "lucide-react";
import {
  useDroppable,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  type BoardCard,
  type BoardColumn,
} from "../api";
import { inputStyle, buttonStyle, v } from "../shared/theme";
import { useTheme } from "../features/theme/ThemeContext";

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function SortableCard({
  card,
  columnColor,
  onDelete,
  onEdit,
  onCardTap,
}: {
  card: BoardCard;
  columnColor?: string;
  onDelete: (card: BoardCard) => void;
  onEdit: (card: BoardCard) => void;
  onCardTap?: (card: BoardCard) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `card-${card.id}`,
    data: { type: "card", card },
  });

  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    background: columnColor ? hexToRgba(columnColor, 0.08) : undefined,
    borderLeftWidth: "4px",
    borderLeftColor: columnColor || undefined,
  };

  function handlePointerDown(e: React.PointerEvent) {
    pointerStart.current = { x: e.clientX, y: e.clientY };
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (!pointerStart.current) return;
    const dx = Math.abs(e.clientX - pointerStart.current.x);
    const dy = Math.abs(e.clientY - pointerStart.current.y);
    pointerStart.current = null;
    if (dx < 10 && dy < 10) {
      onCardTap?.(card);
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-xl border p-3 mb-2 flex items-start gap-2 group backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg touch-none"
      {...attributes}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <button type="button" className="mt-1 cursor-grab active:cursor-grabbing" style={{ color: v("text-muted") }} {...listeners}>
        <GripVertical size={14} />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: v("text-primary") }}>{card.title}</p>
        {card.description && (
          <p className="text-xs mt-1 break-words" style={{ color: v("text-tertiary") }}>{card.description}</p>
        )}
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button type="button" onClick={(e) => { e.stopPropagation(); onEdit(card); }} className="p-1 rounded-lg transition-colors hover:bg-blue-500/10" style={{ color: v("text-muted") }}>
          <Pencil size={12} />
        </button>
        <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(card); }} className="p-1 rounded-lg transition-colors hover:bg-red-500/10" style={{ color: v("text-muted") }}>
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

export function CardOverlay({ card }: { card: BoardCard }) {
  return (
    <div
      className="rounded-xl border p-3 shadow-xl backdrop-blur-sm"
      style={{ background: v("bg-card"), borderColor: v("border-secondary"), width: "272px", opacity: 0.95 }}
    >
      <p className="text-sm font-medium break-words" style={{ color: v("text-primary") }}>{card.title}</p>
      {card.description && (
        <p className="text-xs mt-1 break-words" style={{ color: v("text-tertiary") }}>{card.description}</p>
      )}
    </div>
  );
}

export function KanbanColumn({
  column,
  onAddCard,
  onDeleteCard,
  onEditCard,
  onCardTap,
}: {
  column: BoardColumn;
  onAddCard: (columnId: number, title: string) => void;
  onDeleteCard: (card: BoardCard) => void;
  onEditCard: (card: BoardCard) => void;
  onCardTap?: (card: BoardCard) => void;
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [newCardTitle, setNewCardTitle] = useState("");
  const [showAddCard, setShowAddCard] = useState(false);

  const cardIds = column.cards.map((c) => `card-${c.id}`);

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `column-${column.id}`,
    data: { type: "column", columnId: column.id },
  });

  function handleAdd() {
    if (!newCardTitle.trim()) return;
    onAddCard(column.id, newCardTitle.trim());
    setNewCardTitle("");
    setShowAddCard(false);
  }

  return (
    <div
      className="flex-1 min-w-[260px] rounded-2xl border p-3 flex flex-col backdrop-blur-sm"
      style={{
        background: isOver ? v("bg-hover") : v("bg-secondary"),
        borderColor: isOver ? v("text-primary") : v("border-primary"),
        transition: "background 0.15s, border-color 0.15s",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        {column.color && <div className="w-3 h-3 rounded-full" style={{ background: column.color }} />}
        <p className="text-sm font-semibold flex-1" style={{ color: v("text-primary") }}>{column.title}</p>
        <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: v("bg-hover"), color: v("text-muted") }}>
          {column.cards.length}
        </span>
      </div>

      <div ref={setDropRef} className="flex-1 overflow-y-auto min-h-[40px] max-h-none p-1">
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {column.cards.map((card) => (
            <SortableCard
              key={card.id}
              card={card}
              columnColor={column.color ?? undefined}
              onDelete={onDeleteCard}
              onEdit={onEditCard}
              onCardTap={onCardTap}
            />
          ))}
        </SortableContext>
      </div>

      {showAddCard ? (
        <div className="mt-2">
          <input
            type="text"
            value={newCardTitle}
            onChange={(e) => setNewCardTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setShowAddCard(false); }}
            placeholder="Название карточки"
            className="w-full rounded-xl border px-3 py-2 text-sm"
            style={inputStyle(isDark)}
            autoFocus
          />
          <div className="flex gap-1 mt-2">
            <button type="button" onClick={handleAdd} className="rounded-lg px-3 py-1.5 text-xs font-medium" style={buttonStyle("primary", isDark)}>Добавить</button>
            <button type="button" onClick={() => setShowAddCard(false)} className="rounded-lg px-3 py-1.5 text-xs" style={buttonStyle("secondary", isDark)}>Отмена</button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddCard(true)}
          className="mt-2 flex items-center gap-1 rounded-xl px-3 py-2 text-xs transition-all duration-200"
          style={{ color: v("text-muted") }}
          onMouseEnter={(e) => { e.currentTarget.style.background = v("bg-hover"); }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <Plus size={14} /> Добавить карточку
        </button>
      )}
    </div>
  );
}
