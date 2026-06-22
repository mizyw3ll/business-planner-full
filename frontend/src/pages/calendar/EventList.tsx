import { memo } from "react";
import { Search, ChevronDown, Pencil, Trash2 } from "lucide-react";
import { type CalendarEvent } from "../../api";
import { inputStyle, v } from "../../shared/theme";

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function getEventColor(title: string) {
  const colors = [
    "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.18))",
    "linear-gradient(135deg, rgba(236,72,153,0.25), rgba(244,114,182,0.18))",
    "linear-gradient(135deg, rgba(52,211,153,0.25), rgba(16,185,129,0.18))",
    "linear-gradient(135deg, rgba(251,191,36,0.25), rgba(245,158,11,0.18))",
    "linear-gradient(135deg, rgba(59,130,246,0.25), rgba(96,165,250,0.18))",
    "linear-gradient(135deg, rgba(168,85,247,0.25), rgba(192,132,252,0.18))",
  ];
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

interface EventListProps {
  events: CalendarEvent[];
  isDark: boolean;
  searchQuery: string;
  sortBy: string;
  onSearchChange: (v: string) => void;
  onSortChange: (v: string) => void;
  onEditEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (event: CalendarEvent) => void;
}

export const EventList = memo(function EventList({
  events,
  isDark,
  searchQuery,
  sortBy,
  onSearchChange,
  onSortChange,
  onEditEvent,
  onDeleteEvent,
}: EventListProps) {
  const filtered = events
    .filter((e) => e.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "title_asc") return a.title.localeCompare(b.title);
      if (sortBy === "title_desc") return b.title.localeCompare(a.title);
      if (sortBy === "event_date_desc") return new Date(b.event_date).getTime() - new Date(a.event_date).getTime();
      return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
    });

  return (
    <div
      className="rounded-2xl border p-5 backdrop-blur-xl transition-all duration-300 hover:shadow-lg"
      style={{
        borderColor: v("border-primary"),
        background: isDark
          ? "linear-gradient(145deg, rgba(25,25,40,0.92), rgba(18,18,30,0.85))"
          : "linear-gradient(145deg, rgba(255,255,255,0.92), rgba(248,247,255,0.85))",
        boxShadow: isDark ? "0 8px 40px rgba(0,0,0,0.35)" : "0 8px 40px rgba(99,102,241,0.1)",
      }}
    >
      <h3 className="text-sm font-bold flex items-center gap-2 mb-3" style={{ color: v("text-primary") }}>
        <span className="inline-block h-2 w-2 rounded-full bg-indigo-500" />
        Все события месяца
      </h3>
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: v("text-tertiary") }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Поиск событий..."
            className="w-full rounded-xl border py-2 pl-9 pr-3 text-sm"
            style={inputStyle(isDark)}
          />
        </div>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="rounded-xl border px-3 py-2 pr-8 text-sm appearance-none cursor-pointer"
            style={{ background: v("bg-secondary"), borderColor: v("border-primary"), color: v("text-primary") }}
          >
            <option value="event_date_asc">По дате (старые)</option>
            <option value="event_date_desc">По дате (новые)</option>
            <option value="title_asc">По названию (А→Я)</option>
            <option value="title_desc">По названию (Я→А)</option>
          </select>
          <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: v("text-muted") }} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm" style={{ color: v("text-muted") }}>{searchQuery ? "Ничего не найдено" : "Нет событий"}</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((ev) => (
            <div
              key={ev.id}
              className="flex items-center gap-3 rounded-xl border p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm group"
              style={{ borderColor: v("border-primary"), background: v("bg-card") }}
            >
              <div className="h-8 w-1 rounded-full shrink-0" style={{ background: getEventColor(ev.title) }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: v("text-primary") }}>{ev.title}</p>
                <p className="text-xs" style={{ color: v("text-muted") }}>{formatDateTime(ev.event_date)}</p>
                {ev.description && <p className="text-xs truncate mt-0.5" style={{ color: v("text-tertiary") }}>{ev.description}</p>}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button onClick={() => onEditEvent(ev)} className="p-1.5 rounded-lg transition-colors hover:bg-blue-500/10" style={{ color: v("text-muted") }}>
                  <Pencil size={14} />
                </button>
                <button onClick={() => onDeleteEvent(ev)} className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10" style={{ color: v("text-muted") }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
