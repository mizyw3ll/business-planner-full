import { memo } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { type Board } from "../../api";
import { GlassCard } from "../../shared/components/GlassCard";
import { v } from "../../shared/theme";

interface BoardListProps {
  boards: Board[];
  selectedBoardId: number | null;
  onSelect: (id: number | null) => void;
  onEdit: (board: Board) => void;
  onDelete: (board: Board) => void;
}

export const BoardList = memo(function BoardList({
  boards,
  selectedBoardId,
  onSelect,
  onEdit,
  onDelete,
}: BoardListProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 min-w-0">
      {boards.map((b) => (
        <div key={b.id} className="relative group">
          <GlassCard
            as="button"
            onClick={() => onSelect(b.id === selectedBoardId ? null : b.id)}
            className={`text-left animate-fade-in min-w-0 w-full ${
              selectedBoardId === b.id ? "ring-2 ring-indigo-500/50" : ""
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(99,102,241,0.12)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold truncate" style={{ color: v("text-primary") }}>{b.title}</p>
                <p className="text-xs mt-1" style={{ color: v("text-muted") }}>
                  {new Date(b.created_at).toLocaleDateString("ru-RU")}
                </p>
              </div>
            </div>
          </GlassCard>
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(b); }}
              className="p-1.5 rounded-lg transition-colors hover:bg-blue-500/10"
              style={{ color: v("text-muted") }}
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(b); }}
              className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
              style={{ color: v("text-muted") }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
});
