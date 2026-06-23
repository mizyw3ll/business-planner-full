import { memo } from "react";
import { ChevronLeft, ChevronRight, Trash2, Bell } from "lucide-react";
import { type CalendarEvent } from "../../api";
import { v } from "../../shared/theme";

const MONTHS = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
const DAYS_OF_WEEK = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function formatDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isPastDate(d: Date) {
  return d.getTime() < new Date().getTime();
}

function isWeekend(d: Date) {
  const day = d.getDay();
  return day === 0 || day === 6;
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

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: (Date | null)[] = [];
  const startPad = (firstDay.getDay() + 6) % 7;
  for (let i = 0; i < startPad; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
  return days;
}

interface CalendarGridProps {
  year: number;
  month: number;
  events: CalendarEvent[];
  isDark: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDayClick?: (date: Date) => void;
  onEditEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (event: CalendarEvent) => void;
}

export const CalendarGrid = memo(function CalendarGrid({
  year,
  month,
  events,
  isDark,
  onPrevMonth,
  onNextMonth,
  onDayClick,
  onEditEvent,
  onDeleteEvent,
}: CalendarGridProps) {
  const days = getMonthDays(year, month);
  const today = new Date();

  function getEventsForDate(d: Date | null) {
    if (!d) return [];
    const ds = formatDate(d);
    return events.filter((e) => e.event_date.startsWith(ds));
  }

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
      <div className="flex items-center justify-between mb-5">
        <button onClick={onPrevMonth} className="grid h-9 w-9 place-items-center rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-md" style={{ color: v("text-secondary"), background: v("bg-secondary") }}>
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-lg font-bold tracking-wide" style={{ color: v("text-primary") }}>{MONTHS[month]} {year}</h2>
        <button onClick={onNextMonth} className="grid h-9 w-9 place-items-center rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-md" style={{ color: v("text-secondary"), background: v("bg-secondary") }}>
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS_OF_WEEK.map((d, i) => (
          <div key={d} className={`text-center text-xs font-bold uppercase tracking-wider py-1 ${i >= 5 ? "text-indigo-400" : ""}`} style={{ color: i >= 5 ? undefined : v("text-muted") }}>
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          const dayEvents = getEventsForDate(d);
          const isToday = d && formatDate(d) === formatDate(today);
          const isOtherMonth = d && d.getMonth() !== month;
          const past = d ? isPastDate(d) : false;
          const weekend = d ? isWeekend(d) : false;

          return (
            <div
              key={i}
              onClick={() => { if (d && onDayClick) onDayClick(d); }}
              className={`min-h-[95px] rounded-xl border p-1.5 transition-all duration-200 hover:scale-[1.02] hover:z-10 ${
                isToday ? "border-indigo-500/60 ring-2 ring-indigo-500/20" : "border-transparent"
              } ${past ? "opacity-35" : ""} ${d ? "cursor-pointer" : ""}`}
              style={{
                background: d
                  ? isToday
                    ? "linear-gradient(145deg, rgba(99,102,241,0.12), rgba(139,92,246,0.06))"
                    : past
                      ? isDark ? "rgba(35,35,50,0.25)" : "rgba(200,200,220,0.15)"
                      : weekend && !isDark ? "rgba(99,102,241,0.03)" : v("bg-card")
                  : "transparent",
                position: "relative",
              }}
            >
              {d && (
                <>
                  <div className="relative mb-1 inline-flex items-center justify-center group/number">
                    <span className="absolute inset-0 scale-0 rounded-full transition-transform duration-200 group-hover/number:scale-100" style={{ background: isToday ? "rgba(129,140,248,0.15)" : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }} />
                    <p className={`relative text-xs font-semibold z-10 size-6 inline-flex items-center justify-center ${isOtherMonth ? "opacity-30" : ""}`} style={{ color: isToday ? "#818cf8" : v("text-secondary") }}>
                      {d.getDate()}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <div key={ev.id} className="relative group flex items-center gap-0.5">
                        <div
                          className="flex-1 truncate rounded-lg px-1.5 py-0.5 text-[10px] leading-tight cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-sm font-medium"
                          style={{ background: getEventColor(ev.title), color: v("text-primary") }}
                          title={ev.title}
                          onClick={() => onEditEvent(ev)}
                        >
                          {ev.title}
                        </div>
                        {ev.notify_before && !ev.notified_at && (
                          <Bell size={8} style={{ color: "rgba(250,204,21,0.8)", flexShrink: 0 }} />
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteEvent(ev); }}
                          className="p-0.5 rounded transition-all duration-200 hover:bg-red-500/10 shrink-0"
                          style={{ color: "#ef4444" }}
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <p className="text-[10px] font-medium" style={{ color: v("text-muted") }}>+{dayEvents.length - 3}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
