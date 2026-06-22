import { memo } from "react";
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
  return (
    <article className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight" style={{ color: v("text-primary") }}>Точки графика</h2>
        <button className={tw.buttonPrimary} onClick={onAdd}>Добавить точку</button>
      </div>
      {points.length === 0 ? (
        <div
          className="flex min-h-[150px] items-center justify-center rounded-xl border p-6"
          style={{ borderColor: v("border-primary"), background: v("bg-hover") }}
        >
          <div className="text-center">
            <p className="text-sm font-medium" style={{ color: v("text-secondary") }}>
              У вас пока нет точек в этом графике
            </p>
            <p className="mt-1 text-xs" style={{ color: v("text-muted") }}>
              Добавьте минимум 2 точки для отображения графика
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {points.map((point) => (
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
