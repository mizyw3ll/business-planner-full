import { memo, useMemo, useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { type ChartPoint } from "../../api";
import { ExpandableText } from "../../components/ExpandableText";
import { buttonStyle, tw, v } from "../../shared/theme";

interface PointsTableProps {
  points: ChartPoint[];
  isDark: boolean;
  onAdd: () => void;
  onEdit: (point: ChartPoint) => void;
  onDelete: (point: ChartPoint) => void;
}

export const PointsTable = memo(function PointsTable({
  points,
  isDark,
  onAdd,
  onEdit,
  onDelete,
}: PointsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");

  const filteredPoints = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const filtered = q
      ? points.filter((p) => {
          const dateStr = new Date(p.date).toLocaleString("ru-RU").toLowerCase();
          const amountStr = String(p.amount);
          const descStr = (p.description ?? "").toLowerCase();
          const typeStr = p.type === "income" ? "доход" : "расход";
          return dateStr.includes(q) || amountStr.includes(q) || descStr.includes(q) || typeStr.includes(q);
        })
      : [...points];

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date_asc": return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "date_desc": return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "amount_asc": return Number(a.amount) - Number(b.amount);
        case "amount_desc": return Number(b.amount) - Number(a.amount);
        case "type": return a.type.localeCompare(b.type);
        default: return 0;
      }
    });

    return filtered;
  }, [points, searchQuery, sortBy]);

  return (
    <article className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight" style={{ color: v("text-primary") }}>Точки графика</h2>
        <button className={tw.buttonPrimary} onClick={onAdd}>Добавить точку</button>
      </div>

      {points.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <div className="relative flex-1 max-w-xs w-full sm:w-auto">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: v("text-tertiary") }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по дате, сумме, описанию..."
              className="w-full rounded-xl border py-2 pl-9 pr-3 text-sm"
              style={{
                background: v("bg-primary"),
                borderColor: v("border-primary"),
                color: v("text-primary"),
              }}
            />
          </div>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl border px-3 py-2 pr-8 text-sm appearance-none cursor-pointer"
              style={{ background: v("bg-secondary"), borderColor: v("border-primary"), color: v("text-primary") }}
            >
              <option value="date_desc">Сначала новые</option>
              <option value="date_asc">Сначала старые</option>
              <option value="amount_asc">Сумма ↑</option>
              <option value="amount_desc">Сумма ↓</option>
              <option value="type">По типу</option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: v("text-muted") }}
            />
          </div>
        </div>
      )}

      {filteredPoints.length === 0 ? (
        <div
          className="flex min-h-[150px] items-center justify-center rounded-xl border p-6"
          style={{ borderColor: v("border-primary"), background: v("bg-hover") }}
        >
          <div className="text-center">
            <p className="text-sm font-medium" style={{ color: v("text-secondary") }}>
              {points.length === 0
                ? "У вас пока нет точек в этом графике"
                : "Ничего не найдено"}
            </p>
            {points.length === 0 && (
              <p className="mt-1 text-xs" style={{ color: v("text-muted") }}>
                Добавьте минимум 2 точки для отображения графика
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredPoints.map((point) => (
            <div
              key={point.id}
              className="rounded-xl border p-3 transition overflow-hidden"
              style={{ borderColor: v("border-primary"), background: v("bg-card") }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = v("border-secondary"); }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = v("border-primary"); }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm" style={{ color: v("text-secondary") }}>
                  {new Date(point.date).toLocaleString()}
                </p>
                <p className="text-xs" style={{ color: v("text-muted") }}>
                  {point.type === "income" ? "Доход" : "Расход"}: {point.amount}
                </p>
                {point.description && <ExpandableText text={point.description} className="mt-1" />}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  className="rounded-lg border px-3 py-1 text-xs transition-colors"
                  style={{ borderColor: v("border-secondary"), color: v("text-secondary") }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = v("bg-hover"); }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  onClick={() => onEdit(point)}
                >
                  Редактировать
                </button>
                <button
                  className="rounded-lg border px-3 py-1 text-xs transition-colors"
                  style={buttonStyle("danger", isDark)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(220, 38, 38, 0.2)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  onClick={() => onDelete(point)}
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
});
