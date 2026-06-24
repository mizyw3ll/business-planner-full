import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, ChevronLeft, ChevronRight, Search, ChevronDown } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import {
  createBoardApi,
  createCardApi,
  deleteCardApi,
  deleteBoardApi,
  moveCardApi,
  updateBoardApi,
  updateCardApi,
  type BoardCard,
} from "../api";
import { inputStyle, buttonStyle, tw, v } from "../shared/theme";
import { useTheme } from "../features/theme/ThemeContext";
import { useKanbanBoardsQuery, useKanbanBoardQuery } from "../hooks/useCachedData";
import { queryKeys } from "../lib/queryClient";
import { ConfirmModal } from "../components/ConfirmModal";
import { EmptyState } from "../components/EmptyState";
import { useModalRegistration } from "../hooks/useModalOpen";
import { CardOverlay, KanbanColumn } from "./KanbanPageComponents";
import { BoardList } from "./kanban/BoardList";
import { EditBoardModal } from "./kanban/EditBoardModal";
import { EditCardModal } from "./kanban/EditCardModal";

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
  useModalRegistration(!!editBoard);
  const [editBoardTitle, setEditBoardTitle] = useState("");
  const [activeCard, setActiveCard] = useState<BoardCard | null>(null);
  const [editCard, setEditCard] = useState<BoardCard | null>(null);
  useModalRegistration(!!editCard);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const sortedColumns = (board?.columns ?? []).sort((a, b) => a.column_order - b.column_order);

  const [searchParams] = useSearchParams();
  useEffect(() => {
    const boardIdParam = searchParams.get("boardId");
    if (boardIdParam) {
      setSelectedBoardId(Number(boardIdParam));
    }
  }, [searchParams]);
  useEffect(() => {
    const cardIdParam = searchParams.get("cardId");
    if (!cardIdParam || !board) return;
    for (const col of board.columns) {
      const found = col.cards.find((c) => c.id === Number(cardIdParam));
      if (found) {
        setEditCard(found);
        setEditTitle(found.title);
        setEditDesc(found.description ?? "");
        break;
      }
    }
  }, [searchParams, board]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 10 } }),
  );

  async function handleCreateBoard() {
    if (!newBoardTitle.trim()) return;
    try {
      const newBoard = await createBoardApi({ title: newBoardTitle.trim() });
      toast.success("Доска создана");
      setShowCreateBoard(false);
      setNewBoardTitle("");
      await queryClient.invalidateQueries({ queryKey: queryKeys.kanbanBoards });
      setSelectedBoardId(newBoard.id);
    } catch (err: unknown) {
      toast.error((err as Error & { userMessage?: string })?.userMessage || "Ошибка при создании доски");
    }
  }

  async function handleUpdateBoard() {
    if (!editBoard || !editBoardTitle.trim()) return;
    try {
      await updateBoardApi(editBoard.id, { title: editBoardTitle.trim() });
      toast.success("Доска обновлена");
      setEditBoard(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.kanbanBoards });
    } catch (err: unknown) {
      toast.error((err as Error & { userMessage?: string })?.userMessage || "Ошибка при обновлении доски");
    }
  }

  async function handleAddCard(columnId: number, title: string) {
    try {
      await createCardApi(columnId, { title });
      await queryClient.invalidateQueries({ queryKey: queryKeys.kanbanBoard(selectedBoardId!) });
    } catch (err: unknown) {
      toast.error((err as Error & { userMessage?: string })?.userMessage || "Ошибка");
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
    } catch (err: unknown) {
      toast.error((err as Error & { userMessage?: string })?.userMessage || "Ошибка при удалении");
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
    } catch (err: unknown) {
      toast.error((err as Error & { userMessage?: string })?.userMessage || "Ошибка обновления");
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

    const dragCard = activeData.card as BoardCard;
    let targetColumnId = dragCard.column_id;

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

    if (dragCard.column_id === targetColumnId) {
      const oldIndex = targetCards.findIndex((c) => c.id === dragCard.id);
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
      moveCardApi(dragCard.id, {
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
        <h1 className="text-2xl font-semibold" style={{ color: v("text-primary") }}>Доски</h1>
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
        <h1 className="text-2xl font-semibold" style={{ color: v("text-primary") }}>Доски</h1>
          <button type="button" onClick={() => setShowCreateBoard(true)} className={`${tw.buttonPrimary} flex items-center gap-1.5`}>
          <Plus size={16} /> <span className="hidden sm:inline">Новая доска</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <div className="relative flex-1 max-w-xs w-full sm:w-auto">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: v("text-tertiary") }} />
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
          <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: v("text-muted") }} />
        </div>
      </div>

      {boards.length === 0 && !showCreateBoard && (
        <EmptyState
          title="У вас пока нет досок"
          subtitle="Создайте первую доску для управления задачами"
          actionLabel="Создать доску"
          onAction={() => setShowCreateBoard(true)}
        />
      )}

      {boards.length > 0 && filteredBoards.length === 0 && (
        <p className="text-sm" style={{ color: v("text-muted") }}>Ничего не найдено</p>
      )}

      {showCreateBoard && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newBoardTitle}
            onChange={(e) => setNewBoardTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreateBoard(); if (e.key === "Escape") setShowCreateBoard(false); }}
            placeholder="Название доски"
            className="rounded-xl border px-3 py-2 text-sm"
            style={inputStyle(isDark)}
            autoFocus
          />
          <button type="button" onClick={handleCreateBoard} className="rounded-xl px-4 py-2 text-sm font-medium" style={buttonStyle("primary", isDark)}>
            Создать
          </button>
        </div>
      )}

      {editBoard && (
        <EditBoardModal
          isDark={isDark}
          title={editBoardTitle}
          onTitleChange={setEditBoardTitle}
          onSave={() => void handleUpdateBoard()}
          onClose={() => setEditBoard(null)}
        />
      )}

      {!selectedBoardId && boards.length > 0 && (
        <>
          <BoardList
            boards={visibleBoards}
            selectedBoardId={selectedBoardId}
            onSelect={setSelectedBoardId}
            onEdit={(b) => { setEditBoard(b); setEditBoardTitle(b.title); }}
            onDelete={(b) => setDeleteTarget({ type: "board", id: b.id, title: b.title })}
          />
          {totalBoardPages > 1 && (
            <div className="flex items-center justify-center gap-1 pt-1">
              <button onClick={() => setBoardPage((p) => Math.max(1, p - 1))} disabled={safeBoardPage <= 1} className="rounded-lg p-1.5 transition-colors disabled:opacity-30" style={{ color: v("text-muted") }}>
                <ChevronLeft size={16} />
              </button>
              {boardPageNumbers.map((p, i) =>
                p === "..." ? (
                  <span key={`e${i}`} className="px-1 text-xs" style={{ color: v("text-muted") }}>...</span>
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
              <button onClick={() => setBoardPage((p) => Math.min(totalBoardPages, p + 1))} disabled={safeBoardPage >= totalBoardPages} className="rounded-lg p-1.5 transition-colors disabled:opacity-30" style={{ color: v("text-muted") }}>
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
            <button onClick={() => setSelectedBoardId(null)} className="ml-3 text-sm font-normal transition-colors hover:text-indigo-500" style={{ color: v("text-muted") }}>
              ← Все доски
            </button>
          </h2>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex gap-4 flex-1 overflow-x-auto pb-2">
              {sortedColumns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  onAddCard={handleAddCard}
                  onDeleteCard={(card) => setDeleteTarget({ type: "card", id: card.id, title: card.title })}
                  onEditCard={openEditCard}
                  onCardTap={openEditCard}
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
            ? `Вы действительно хотите удалить ${deleteTarget.type === "board" ? "доску" : "карточку"} "${deleteTarget.title}"?`
            : ""
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />

      {editCard && (
        <EditCardModal
          isDark={isDark}
          title={editTitle}
          description={editDesc}
          onTitleChange={setEditTitle}
          onDescriptionChange={setEditDesc}
          onSave={() => void saveEditCard()}
          onClose={() => setEditCard(null)}
          onDelete={() => {
            if (!editCard) return;
            setDeleteTarget({ type: "card", id: editCard.id, title: editCard.title });
            setEditCard(null);
          }}
        />
      )}
    </div>
  );
}
