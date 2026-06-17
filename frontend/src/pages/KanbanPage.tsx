import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Trash2, GripVertical, Pencil, ChevronLeft, ChevronRight, Search, ChevronDown } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  createBoardApi,
  createCardApi,
  deleteCardApi,
  deleteBoardApi,
  moveCardApi,
  updateBoardApi,
  updateCardApi,
  type BoardCard,
  type BoardColumn,
} from "../api";
import { inputStyle, buttonStyle, tw, v } from "../shared/theme";
import { GlassCard } from "../shared/components/GlassCard";
import { useTheme } from "../features/theme/ThemeContext";
import { useKanbanBoardsQuery, useKanbanBoardQuery } from "../hooks/useCachedData";
import { queryKeys } from "../lib/queryClient";
import { ConfirmModal } from "../components/ConfirmModal";

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function SortableCard({
  card,
  columnColor,
  onDelete,
  onEdit,
}: {
  card: BoardCard;
  columnColor?: string;
  onDelete: (card: BoardCard) => void;
  onEdit: (card: BoardCard) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `card-${card.id}`,
    data: { type: "card", card },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    background: columnColor ? hexToRgba(columnColor, 0.08) : undefined,
    borderLeftWidth: "4px",
    borderLeftColor: columnColor || undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-xl border p-3 mb-2 flex items-start gap-2 group backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
      {...attributes}
    >
      <button
        type="button"
        className="mt-1 cursor-grab active:cursor-grabbing"
        style={{ color: v("text-muted") }}
        {...listeners}
      >
        <GripVertical size={14} />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: v("text-primary") }}>
          {card.title}
        </p>
        {card.description && (
          <p className="text-xs mt-1 break-words" style={{ color: v("text-tertiary") }}>
            {card.description}
          </p>
        )}
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          type="button"
          onClick={() => onEdit(card)}
          className="p-1 rounded-lg transition-colors hover:bg-blue-500/10"
          style={{ color: v("text-muted") }}
        >
          <Pencil size={12} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(card)}
          className="p-1 rounded-lg transition-colors hover:bg-red-500/10"
          style={{ color: v("text-muted") }}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

function CardOverlay({ card }: { card: BoardCard }) {
  return (
    <div
      className="rounded-xl border p-3 shadow-xl backdrop-blur-sm"
      style={{
        background: v("bg-card"),
        borderColor: v("border-secondary"),
        width: "272px",
        opacity: 0.95,
      }}
    >
      <p className="text-sm font-medium break-words" style={{ color: v("text-primary") }}>
        {card.title}
      </p>
      {card.description && (
        <p className="text-xs mt-1 break-words" style={{ color: v("text-tertiary") }}>
          {card.description}
        </p>
      )}
    </div>
  );
}

function KanbanColumn({
  column,
  onAddCard,
  onDeleteCard,
  onEditCard,
}: {
  column: BoardColumn;
  onAddCard: (columnId: number, title: string) => void;
  onDeleteCard: (card: BoardCard) => void;
  onEditCard: (card: BoardCard) => void;
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
        <p className="text-sm font-semibold flex-1" style={{ color: v("text-primary") }}>
          {column.title}
        </p>
        <span
          className="rounded-full px-2 py-0.5 text-xs font-medium"
          style={{ background: v("bg-hover"), color: v("text-muted") }}
        >
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
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") setShowAddCard(false);
            }}
            placeholder="Название карточки"
            className="w-full rounded-xl border px-3 py-2 text-sm"
            style={inputStyle(isDark)}
            autoFocus
          />
          <div className="flex gap-1 mt-2">
            <button
              type="button"
              onClick={handleAdd}
              className="rounded-lg px-3 py-1.5 text-xs font-medium"
              style={buttonStyle("primary", isDark)}
            >
              Добавить
            </button>
            <button
              type="button"
              onClick={() => setShowAddCard(false)}
              className="rounded-lg px-3 py-1.5 text-xs"
              style={buttonStyle("secondary", isDark)}
            >
              Отмена
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddCard(true)}
          className="mt-2 flex items-center gap-1 rounded-xl px-3 py-2 text-xs transition-all duration-200"
          style={{ color: v("text-muted") }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = v("bg-hover");
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <Plus size={14} />
          Добавить карточку
        </button>
      )}
    </div>
  );
}

export function KanbanPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const queryClient = useQueryClient();
  const { data: boards = [], isLoading } = useKanbanBoardsQuery();
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(null);
  const { data: board } = useKanbanBoardQuery(selectedBoardId);
  const [cols, setCols] = useState(4);
  useEffect(() => {
    function updateCols() {
      const w = window.innerWidth;
      if (w < 640) setCols(1);
      else if (w < 1024) setCols(2);
      else if (w < 1280) setCols(3);
      else setCols(4);
    }
    updateCols();
    window.addEventListener("resize", updateCols);
    return () => window.removeEventListener("resize", updateCols);
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("created_at_desc");
  const [deleteTarget, setDeleteTarget] = useState<{ type: "board" | "card"; id: number; title: string } | null>(null);

  const filteredBoards = useMemo(() => {
    const list = boards.filter((b) => b.title.toLowerCase().includes(searchQuery.toLowerCase()));
    list.sort((a, b) => {
      if (sortBy === "title_asc") return a.title.localeCompare(b.title);
      if (sortBy === "title_desc") return b.title.localeCompare(a.title);
      if (sortBy === "created_at_asc") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return list;
  }, [boards, searchQuery, sortBy]);

  const boardsPerPage = cols * 4;
  const [boardPage, setBoardPage] = useState(1);
  const totalBoardPages = Math.max(1, Math.ceil(filteredBoards.length / boardsPerPage));
  const safeBoardPage = Math.min(boardPage, totalBoardPages);
  const boardStartIdx = (safeBoardPage - 1) * boardsPerPage;
  const visibleBoards = filteredBoards.slice(boardStartIdx, boardStartIdx + boardsPerPage);
  const boardPageNumbers = useMemo(() => {
    const pages: (number | "...")[] = [];
    if (totalBoardPages <= 7) {
      for (let i = 1; i <= totalBoardPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safeBoardPage > 3) pages.push("...");
      const start = Math.max(2, safeBoardPage - 1);
      const end = Math.min(totalBoardPages - 1, safeBoardPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (safeBoardPage < totalBoardPages - 2) pages.push("...");
      pages.push(totalBoardPages);
    }
    return pages;
  }, [safeBoardPage, totalBoardPages]);

  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [editBoard, setEditBoard] = useState<{ id: number; title: string } | null>(null);
  const [editBoardTitle, setEditBoardTitle] = useState("");
  const [activeCard, setActiveCard] = useState<BoardCard | null>(null);
  const [editCard, setEditCard] = useState<BoardCard | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const sortedColumns = (board?.columns ?? []).sort((a, b) => a.column_order - b.column_order);

  const [searchParams] = useSearchParams();
  useEffect(() => {
    const boardIdParam = searchParams.get("boardId");
    if (boardIdParam) {
      setSelectedBoardId(Number(boardIdParam)); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [searchParams]);
  useEffect(() => {
    const cardIdParam = searchParams.get("cardId");
    if (!cardIdParam || !board) return;
    for (const col of board.columns) {
      const found = col.cards.find((c) => c.id === Number(cardIdParam));
      if (found) {
        setEditCard(found); // eslint-disable-line react-hooks/set-state-in-effect
        setEditTitle(found.title);
        setEditDesc(found.description ?? "");
        break;
      }
    }
  }, [searchParams, board]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function handleCreateBoard() {
    if (!newBoardTitle.trim()) return;
    try {
      const newBoard = await createBoardApi({ title: newBoardTitle.trim() });
      toast.success("Доска создана");
      setShowCreateBoard(false);
      setNewBoardTitle("");
      await queryClient.invalidateQueries({ queryKey: queryKeys.kanbanBoards });
      setSelectedBoardId(newBoard.id);
    } catch {
      toast.error("Ошибка при создании доски");
    }
  }

  async function handleUpdateBoard() {
    if (!editBoard || !editBoardTitle.trim()) return;
    try {
      await updateBoardApi(editBoard.id, { title: editBoardTitle.trim() });
      toast.success("Доска обновлена");
      setEditBoard(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.kanbanBoards });
    } catch {
      toast.error("Ошибка при обновлении доски");
    }
  }

  async function handleAddCard(columnId: number, title: string) {
    try {
      await createCardApi(columnId, { title });
      await queryClient.invalidateQueries({ queryKey: queryKeys.kanbanBoard(selectedBoardId!) });
    } catch {
      toast.error("Ошибка");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "board") {
        await deleteBoardApi(deleteTarget.id);
        toast.success("Доска удалена");
        if (selectedBoardId === deleteTarget.id) setSelectedBoardId(null);
        await queryClient.invalidateQueries({ queryKey: queryKeys.kanbanBoards });
      } else {
        await deleteCardApi(deleteTarget.id);
        await queryClient.invalidateQueries({ queryKey: queryKeys.kanbanBoard(selectedBoardId!) });
      }
    } catch {
      toast.error("Ошибка при удалении");
    } finally {
      setDeleteTarget(null);
    }
  }

  function openEditCard(card: BoardCard) {
    setEditCard(card);
    setEditTitle(card.title);
    setEditDesc(card.description || "");
  }

  async function saveEditCard() {
    if (!editCard || !editTitle.trim()) return;
    try {
      await updateCardApi(editCard.id, {
        title: editTitle.trim(),
        description: editDesc.trim() || undefined,
      });
      toast.success("Карточка обновлена");
      setEditCard(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.kanbanBoard(selectedBoardId!) });
    } catch {
      toast.error("Ошибка обновления");
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const activeData = active.data.current;
    if (activeData?.type === "card") {
      setActiveCard(activeData.card as BoardCard);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveCard(null);
    if (!over || !board) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData || activeData.type !== "card") return;

    const activeCard = activeData.card as BoardCard;
    let targetColumnId = activeCard.column_id;

    if (overData?.type === "card") {
      const overCard = overData.card as BoardCard;
      targetColumnId = overCard.column_id;
    } else if (overData?.type === "column") {
      targetColumnId = overData.columnId as number;
    }

    const targetCol = board.columns.find((c) => c.id === targetColumnId);
    if (!targetCol) return;

    const targetCards = [...targetCol.cards];
    const overIndex =
      overData?.type === "card"
        ? targetCards.findIndex((c) => c.id === (overData.card as BoardCard).id)
        : targetCards.length;

    if (activeCard.column_id === targetColumnId) {
      const oldIndex = targetCards.findIndex((c) => c.id === activeCard.id);
      if (oldIndex !== -1 && overIndex !== -1 && oldIndex !== overIndex) {
        const newCards = arrayMove(targetCards, oldIndex, overIndex);
        const cardOrderUpdates = newCards.map((c, i) =>
          moveCardApi(c.id, { column_id: targetColumnId, card_order: i }),
        );
        Promise.all(cardOrderUpdates).then(() => {
          queryClient.invalidateQueries({ queryKey: queryKeys.kanbanBoard(selectedBoardId!) });
        });
      }
    } else {
      moveCardApi(activeCard.id, {
        column_id: targetColumnId,
        card_order: overIndex >= 0 ? overIndex : targetCards.length,
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: queryKeys.kanbanBoard(selectedBoardId!) });
      });
    }
  }

  if (isLoading) {
    return (
      <div className={tw.pageContainer}>
        <h1 className="text-2xl font-semibold" style={{ color: v("text-primary") }}>
          Доски
        </h1>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-card h-12 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 space-y-4 max-w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold" style={{ color: v("text-primary") }}>
          Доски
        </h1>
        <button
          type="button"
          onClick={() => setShowCreateBoard(true)}
          className={`${tw.buttonPrimary} flex items-center gap-2`}
        >
          <Plus size={16} />
          Новая доска
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: v("text-tertiary") }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию..."
            className="w-full rounded-xl border py-2 pl-9 pr-3 text-sm"
            style={inputStyle(isDark)}
          />
        </div>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border px-3 py-2 pr-8 text-sm appearance-none cursor-pointer"
            style={{ background: v("bg-secondary"), borderColor: v("border-primary"), color: v("text-primary") }}
          >
            <option value="created_at_desc">Сначала новые</option>
            <option value="created_at_asc">Сначала старые</option>
            <option value="title_asc">По названию (А→Я)</option>
            <option value="title_desc">По названию (Я→А)</option>
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: v("text-muted") }}
          />
        </div>
      </div>

      {boards.length === 0 && !showCreateBoard && (
        <p className="text-sm" style={{ color: v("text-tertiary") }}>
          Нет досок. Создайте первую.
        </p>
      )}

      {boards.length > 0 && filteredBoards.length === 0 && (
        <p className="text-sm" style={{ color: v("text-muted") }}>
          Ничего не найдено
        </p>
      )}

      {showCreateBoard && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newBoardTitle}
            onChange={(e) => setNewBoardTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateBoard();
              if (e.key === "Escape") setShowCreateBoard(false);
            }}
            placeholder="Название доски"
            className="rounded-xl border px-3 py-2 text-sm"
            style={inputStyle(isDark)}
            autoFocus
          />
          <button
            type="button"
            onClick={handleCreateBoard}
            className="rounded-xl px-4 py-2 text-sm font-medium"
            style={buttonStyle("primary", isDark)}
          >
            Создать
          </button>
        </div>
      )}

      {/* Edit Board Modal */}
      {editBoard && (
        <div className="fixed inset-0 z-[120] grid place-items-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div
            className="w-full max-w-md rounded-2xl border p-5 backdrop-blur-xl"
            style={{ background: v("bg-sidebar"), borderColor: v("border-primary") }}
          >
            <h3 className="text-lg font-semibold mb-3" style={{ color: v("text-primary") }}>
              Редактировать доску
            </h3>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: v("text-muted") }}>
                Название *
              </label>
              <input
                type="text"
                value={editBoardTitle}
                onChange={(e) => setEditBoardTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleUpdateBoard();
                  if (e.key === "Escape") setEditBoard(null);
                }}
                className={tw.inputBase}
                style={inputStyle(isDark)}
                autoFocus
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="rounded-xl border px-4 py-2 text-sm"
                style={{ borderColor: v("border-secondary"), color: v("text-secondary") }}
                onClick={() => setEditBoard(null)}
              >
                Отмена
              </button>
              <button
                className="rounded-xl border px-4 py-2 text-sm font-medium"
                style={buttonStyle("primary", isDark)}
                disabled={!editBoardTitle.trim()}
                onClick={() => void handleUpdateBoard()}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {!selectedBoardId && boards.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 min-w-0">
            {visibleBoards.map((b) => (
              <div key={b.id} className="relative group">
                <GlassCard
                  as="button"
                  onClick={() => setSelectedBoardId(b.id === selectedBoardId ? null : b.id)}
                  className={`text-left animate-fade-in min-w-0 w-full ${
                    selectedBoardId === b.id ? "ring-2 ring-indigo-500/50" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: "rgba(99,102,241,0.12)" }}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#818cf8"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold truncate" style={{ color: v("text-primary") }}>
                        {b.title}
                      </p>
                      <p className="text-xs mt-1" style={{ color: v("text-muted") }}>
                        {new Date(b.created_at).toLocaleDateString("ru-RU")}
                      </p>
                    </div>
                  </div>
                </GlassCard>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditBoard(b);
                      setEditBoardTitle(b.title);
                    }}
                    className="p-1.5 rounded-lg transition-colors hover:bg-blue-500/10"
                    style={{ color: v("text-muted") }}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget({ type: "board", id: b.id, title: b.title });
                    }}
                    className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                    style={{ color: v("text-muted") }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {totalBoardPages > 1 && (
            <div className="flex items-center justify-center gap-1 pt-1">
              <button
                onClick={() => setBoardPage((p) => Math.max(1, p - 1))}
                disabled={safeBoardPage <= 1}
                className="rounded-lg p-1.5 transition-colors disabled:opacity-30"
                style={{ color: v("text-muted") }}
              >
                <ChevronLeft size={16} />
              </button>
              {boardPageNumbers.map((p, i) =>
                p === "..." ? (
                  <span key={`e${i}`} className="px-1 text-xs" style={{ color: v("text-muted") }}>
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setBoardPage(p)}
                    className={`min-w-[32px] rounded-lg px-2 py-1.5 text-sm transition-all ${
                      p === safeBoardPage ? "font-semibold shadow-sm" : "hover:bg-[var(--bg-hover)]"
                    }`}
                    style={{
                      background: p === safeBoardPage ? v("bg-hover") : "transparent",
                      color: p === safeBoardPage ? v("text-primary") : v("text-muted"),
                      border: p === safeBoardPage ? `1px solid ${v("border-secondary")}` : "1px solid transparent",
                    }}
                  >
                    {p}
                  </button>
                ),
              )}
              <button
                onClick={() => setBoardPage((p) => Math.min(totalBoardPages, p + 1))}
                disabled={safeBoardPage >= totalBoardPages}
                className="rounded-lg p-1.5 transition-colors disabled:opacity-30"
                style={{ color: v("text-muted") }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {board && (
        <div className="flex flex-col flex-1 min-h-0">
          <h2 className="text-lg font-semibold mb-3" style={{ color: v("text-primary") }}>
            {board.title}
            <button
              onClick={() => setSelectedBoardId(null)}
              className="ml-3 text-sm font-normal transition-colors hover:text-indigo-500"
              style={{ color: v("text-muted") }}
            >
              ← Все доски
            </button>
          </h2>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 flex-1 overflow-x-auto pb-2">
              {sortedColumns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  onAddCard={handleAddCard}
                  onDeleteCard={(card) => setDeleteTarget({ type: "card", id: card.id, title: card.title })}
                  onEditCard={openEditCard}
                />
              ))}
            </div>
          </DndContext>
          <DragOverlay>{activeCard ? <CardOverlay card={activeCard} /> : null}</DragOverlay>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Подтверждение удаления"
        description={
          deleteTarget
            ? `Вы действительно хотите удалить ${deleteTarget.type === "board" ? "доску" : "карточку"} "${
                deleteTarget.title
              }"?`
            : ""
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />

      {/* Edit Card Modal */}
      {editCard && (
        <div className="fixed inset-0 z-[120] grid place-items-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div
            className="w-full max-w-md rounded-2xl border p-5 backdrop-blur-xl"
            style={{ background: v("bg-sidebar"), borderColor: v("border-primary") }}
          >
            <h3 className="text-lg font-semibold mb-3" style={{ color: v("text-primary") }}>
              Редактировать карточку
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: v("text-muted") }}>
                  Название *
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className={tw.inputBase}
                  style={inputStyle(isDark)}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: v("text-muted") }}>
                  Описание
                </label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className={`${tw.inputBase} min-h-[80px]`}
                  style={inputStyle(isDark)}
                  placeholder="Описание карточки..."
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="rounded-xl border px-4 py-2 text-sm"
                style={{ borderColor: v("border-secondary"), color: v("text-secondary") }}
                onClick={() => setEditCard(null)}
              >
                Отмена
              </button>
              <button
                className="rounded-xl border px-4 py-2 text-sm font-medium"
                style={buttonStyle("primary", isDark)}
                disabled={!editTitle.trim()}
                onClick={() => void saveEditCard()}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
