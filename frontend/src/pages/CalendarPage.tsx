import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Download,
  Upload,
  Trash2,
  Pencil,
  Bell,
  BellOff,
  Search,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getCalendarEventsApi,
  createCalendarEventApi,
  updateCalendarEventApi,
  deleteCalendarEventApi,
  getCalendarExportUrl,
  importCalendarApi,
  type CalendarEvent,
} from "../api";
import { buttonStyle, inputStyle, tw, v } from "../shared/theme";
import { useTheme } from "../features/theme/ThemeContext";
import { ConfirmModal } from "../components/ConfirmModal";

const MONTHS = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

const DAYS_OF_WEEK = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const NOTIFY_OPTIONS = [
  { value: 0, label: "Нет" },
  { value: 10, label: "За 10 минут" },
  { value: 30, label: "За 30 минут" },
  { value: 60, label: "За 1 час" },
  { value: 120, label: "За 2 часа" },
  { value: 1440, label: "За 1 день" },
];

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: (Date | null)[] = [];
  const startPad = (firstDay.getDay() + 6) % 7;
  for (let i = 0; i < startPad; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
  return days;
}

function formatDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getLocalDatetimeStr() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const h = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}T${h}:${min}`;
}

function isoToDatetimeLocal(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso.slice(0, 16);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}:${min}`;
}

function isPastDate(d: Date) {
  const now = new Date();
  return d.getTime() < now.getTime();
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

export function CalendarPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState(getLocalDatetimeStr());
  const [newDesc, setNewDesc] = useState("");
  const [newNotify, setNewNotify] = useState(0);

  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editNotify, setEditNotify] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("event_date_asc");
  const [deleteTarget, setDeleteTarget] = useState<CalendarEvent | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredEvents = useMemo(() => {
    const list = events.filter((e) => e.title.toLowerCase().includes(searchQuery.toLowerCase()));
    list.sort((a, b) => {
      if (sortBy === "title_asc") return a.title.localeCompare(b.title);
      if (sortBy === "title_desc") return b.title.localeCompare(a.title);
      if (sortBy === "event_date_desc") return new Date(b.event_date).getTime() - new Date(a.event_date).getTime();
      return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
    });
    return list;
  }, [events, searchQuery, sortBy]);

  async function fetchEvents() {
    try {
      const firstDay = formatDate(new Date(year, month, 1));
      const lastDay = formatDate(new Date(year, month + 1, 0));
      const data = await getCalendarEventsApi(firstDay, lastDay);
      setEvents(data);
    } catch {
      toast.error("Ошибка загрузки событий");
    }
  }

  useEffect(() => {
    const firstDay = formatDate(new Date(year, month, 1));
    const lastDay = formatDate(new Date(year, month + 1, 0));
    getCalendarEventsApi(firstDay, lastDay)
      .then(setEvents)
      .catch(() => toast.error("Ошибка загрузки событий"));
  }, [year, month]);

  useEffect(() => {
    const firstDay = formatDate(new Date(year, month, 1));
    const lastDay = formatDate(new Date(year, month + 1, 0));
    getCalendarEventsApi(firstDay, lastDay)
      .then(setEvents)
      .catch(() => toast.error("Ошибка загрузки событий"));
  }, [year, month]);

  const days = getMonthDays(year, month);

  function prevMonth() {
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else {
      setMonth(month - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else {
      setMonth(month + 1);
    }
  }

  function getEventsForDate(d: Date | null) {
    if (!d) return [];
    const ds = formatDate(d);
    return events.filter((e) => e.event_date.startsWith(ds));
  }

  async function handleCreate() {
    if (!newTitle.trim()) return;
    try {
      const eventDate = new Date(newDate);
      await createCalendarEventApi({
        title: newTitle.trim(),
        description: newDesc || undefined,
        event_date: eventDate.toISOString(),
        notify_before: newNotify || null,
      });
      toast.success("Событие создано");
      setShowCreate(false);
      setNewTitle("");
      setNewDesc("");
      setNewNotify(0);
      setNewDate(getLocalDatetimeStr());
      await fetchEvents();
    } catch {
      toast.error("Ошибка создания события");
    }
  }

  function openEdit(event: CalendarEvent) {
    setEditEvent(event);
    setEditTitle(event.title);
    setEditDate(isoToDatetimeLocal(event.event_date));
    setEditDesc(event.description || "");
    setEditNotify(event.notify_before ?? 0);
  }

  async function handleEdit() {
    if (!editEvent || !editTitle.trim()) return;
    try {
      const eventDate = new Date(editDate);
      await updateCalendarEventApi(editEvent.id, {
        title: editTitle.trim(),
        description: editDesc || undefined,
        event_date: eventDate.toISOString(),
        notify_before: editNotify || null,
      });
      toast.success("Событие обновлено");
      setEditEvent(null);
      await fetchEvents();
    } catch {
      toast.error("Ошибка обновления события");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteCalendarEventApi(deleteTarget.id);
      toast.success("Событие удалено");
      await fetchEvents();
    } catch {
      toast.error("Ошибка удаления события");
    } finally {
      setDeleteTarget(null);
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const result = await importCalendarApi(file);
      let msg = `Импортировано: ${result.imported}`;
      if (result.skipped > 0) msg += `, пропущено: ${result.skipped}`;
      if (result.errors > 0) msg += `, ошибок: ${result.errors}`;
      toast.success(msg);
      if (result.details.length > 0) {
        result.details.forEach((d) => toast(d, { icon: "⚠️" }));
      }
      await fetchEvents();
    } catch {
      toast.error("Ошибка импорта файла");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold flex items-center gap-2" style={{ color: v("text-primary") }}>
          <span className="inline-block h-6 w-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600" />
          Календарь
        </h1>
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept=".ics" onChange={handleImport} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className={`${tw.buttonSecondary} flex items-center gap-1.5`}
          >
            <Upload size={16} />
            {importing ? "Импорт..." : "Импорт"}
          </button>
          <a href={getCalendarExportUrl()} download className={`${tw.buttonSecondary} flex items-center gap-1.5`}>
            <Download size={16} />
            Экспорт
          </a>
          <button onClick={() => setShowCreate(true)} className={`${tw.buttonPrimary} flex items-center gap-1.5`}>
            <Plus size={16} />
            Событие
          </button>
        </div>
      </div>

      {/* Calendar card */}
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
        {/* Month nav */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={prevMonth}
            className="grid h-9 w-9 place-items-center rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-md"
            style={{ color: v("text-secondary"), background: v("bg-secondary") }}
          >
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-lg font-bold tracking-wide" style={{ color: v("text-primary") }}>
            {MONTHS[month]} {year}
          </h2>
          <button
            onClick={nextMonth}
            className="grid h-9 w-9 place-items-center rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-md"
            style={{ color: v("text-secondary"), background: v("bg-secondary") }}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS_OF_WEEK.map((d, i) => (
            <div
              key={d}
              className={`text-center text-xs font-bold uppercase tracking-wider py-1 ${
                i >= 5 ? "text-indigo-400" : ""
              }`}
              style={{ color: i >= 5 ? undefined : v("text-muted") }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
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
                className={`min-h-[95px] rounded-xl border p-1.5 transition-all duration-200 hover:scale-[1.02] hover:z-10 ${
                  isToday ? "border-indigo-500/60 ring-2 ring-indigo-500/20" : "border-transparent"
                } ${past ? "opacity-35" : ""}`}
                style={{
                  background: d
                    ? isToday
                      ? "linear-gradient(145deg, rgba(99,102,241,0.12), rgba(139,92,246,0.06))"
                      : past
                        ? isDark
                          ? "rgba(35,35,50,0.25)"
                          : "rgba(200,200,220,0.15)"
                        : weekend && !isDark
                          ? "rgba(99,102,241,0.03)"
                          : v("bg-card")
                    : "transparent",
                  position: "relative",
                }}
              >
                {d && (
                  <>
                    <div className="relative mb-1 inline-flex items-center justify-center group/number">
                      <span
                        className="absolute inset-0 scale-0 rounded-full transition-transform duration-200 group-hover/number:scale-100"
                        style={{
                          background: isToday
                            ? "rgba(129,140,248,0.15)"
                            : isDark
                              ? "rgba(255,255,255,0.06)"
                              : "rgba(0,0,0,0.04)",
                        }}
                      />
                      <p
                        className={`relative text-xs font-semibold z-10 size-6 inline-flex items-center justify-center ${
                          isOtherMonth ? "opacity-30" : ""
                        }`}
                        style={{
                          color: isToday ? "#818cf8" : v("text-secondary"),
                        }}
                      >
                        {d.getDate()}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map((ev) => (
                        <div key={ev.id} className="relative group flex items-center gap-0.5">
                          <div
                            className="flex-1 truncate rounded-lg px-1.5 py-0.5 text-[10px] leading-tight cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-sm font-medium"
                            style={{
                              background: getEventColor(ev.title),
                              color: v("text-primary"),
                            }}
                            title={ev.title}
                            onClick={() => openEdit(ev)}
                          >
                            {ev.title}
                          </div>
                          {ev.notify_before && !ev.notified_at && (
                            <Bell size={8} style={{ color: "rgba(250,204,21,0.8)", flexShrink: 0 }} />
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(ev);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-all duration-200 hover:bg-red-500/10 shrink-0"
                            style={{ color: "#ef4444" }}
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <p className="text-[10px] font-medium" style={{ color: v("text-muted") }}>
                          +{dayEvents.length - 3}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Event list */}
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
              <option value="event_date_asc">По дате (сначала старые)</option>
              <option value="event_date_desc">По дате (сначала новые)</option>
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
        {events.length === 0 ? (
          <p className="text-sm" style={{ color: v("text-muted") }}>
            Нет событий
          </p>
        ) : filteredEvents.length === 0 ? (
          <p className="text-sm" style={{ color: v("text-muted") }}>
            Ничего не найдено
          </p>
        ) : (
          <div className="space-y-2">
            {filteredEvents.map((ev, idx) => {
              const isPast = new Date(ev.event_date) < new Date();
              return (
                <div
                  key={ev.id}
                  className={`animate-fade-in stagger-${
                    (idx % 6) + 1
                  } flex items-center justify-between rounded-xl border p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                    isPast ? "" : ""
                  }`}
                  style={{
                    borderColor: v("border-secondary"),
                    background: isPast ? (isDark ? "rgba(35,35,50,0.3)" : "rgba(200,200,220,0.12)") : v("bg-card"),
                    opacity: isPast ? 0.45 : 1,
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium flex items-center gap-1.5" style={{ color: v("text-primary") }}>
                      <span
                        className="inline-block h-2 w-2 rounded-full shrink-0"
                        style={{
                          background: getEventColor(ev.title).match(/rgba\((\d+,\d+,\d+)/)?.[1]
                            ? `rgb(${getEventColor(ev.title).match(/rgba\((\d+,\d+,\d+)/)![1]})`
                            : "#6366f1",
                        }}
                      />
                      {ev.title}
                      {ev.notify_before && !ev.notified_at && (
                        <BellOff size={12} style={{ color: "rgba(250,204,21,0.7)" }} />
                      )}
                      {ev.notified_at && <Bell size={12} style={{ color: "rgba(74,222,128,0.7)" }} />}
                    </p>
                    <p className="text-xs" style={{ color: v("text-muted") }}>
                      {formatDateTime(ev.event_date)}
                      {ev.description ? ` — ${ev.description}` : ""}
                      {ev.notify_before ? ` • увед. за ${ev.notify_before} мин` : ""}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(ev)}
                      className="p-1.5 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-sm"
                      style={{ color: v("text-secondary") }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = v("text-primary");
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = v("text-secondary");
                      }}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(ev)}
                      className="p-1.5 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-sm"
                      style={{ color: v("text-secondary") }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#ef4444";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = v("text-secondary");
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Подтверждение удаления"
        description={deleteTarget ? `Вы действительно хотите удалить событие "${deleteTarget.title}"?` : ""}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />

      {/* Create modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-[120] grid place-items-center p-4 backdrop-blur-sm"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="w-full max-w-md rounded-2xl border p-6 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl"
            style={{
              background: isDark
                ? "linear-gradient(145deg, rgba(30,30,45,0.96), rgba(20,20,35,0.92))"
                : "linear-gradient(145deg, rgba(255,255,255,0.96), rgba(248,247,255,0.92))",
              borderColor: v("border-primary"),
              boxShadow: "0 16px 48px rgba(0,0,0,0.3)",
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: v("text-primary") }}>
              Новое событие
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: v("text-muted") }}>
                  Название *
                </label>
                <input
                  className={tw.inputBase}
                  style={inputStyle(isDark)}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Название события"
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: v("text-muted") }}>
                  Дата и время *
                </label>
                <input
                  type="datetime-local"
                  className={tw.inputBase}
                  style={inputStyle(isDark)}
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: v("text-muted") }}>
                  Напоминание
                </label>
                <select
                  className={tw.inputBase}
                  style={inputStyle(isDark)}
                  value={newNotify}
                  onChange={(e) => setNewNotify(Number(e.target.value))}
                >
                  {NOTIFY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: v("text-muted") }}>
                  Описание
                </label>
                <textarea
                  className={`${tw.inputBase} min-h-[80px]`}
                  style={inputStyle(isDark)}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Описание (необязательно)"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                className="rounded-xl border px-4 py-2 text-sm transition-all duration-200 hover:scale-105"
                style={{ borderColor: v("border-secondary"), color: v("text-secondary"), background: v("bg-card") }}
                onClick={() => setShowCreate(false)}
              >
                Отмена
              </button>
              <button
                className="rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-200 hover:scale-105"
                style={buttonStyle("primary", isDark)}
                disabled={!newTitle.trim()}
                onClick={() => void handleCreate()}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editEvent && (
        <div
          className="fixed inset-0 z-[120] grid place-items-center p-4 backdrop-blur-sm"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="w-full max-w-md rounded-2xl border p-6 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl"
            style={{
              background: isDark
                ? "linear-gradient(145deg, rgba(30,30,45,0.96), rgba(20,20,35,0.92))"
                : "linear-gradient(145deg, rgba(255,255,255,0.96), rgba(248,247,255,0.92))",
              borderColor: v("border-primary"),
              boxShadow: "0 16px 48px rgba(0,0,0,0.3)",
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: v("text-primary") }}>
              Редактировать событие
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: v("text-muted") }}>
                  Название *
                </label>
                <input
                  className={tw.inputBase}
                  style={inputStyle(isDark)}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Название события"
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: v("text-muted") }}>
                  Дата и время *
                </label>
                <input
                  type="datetime-local"
                  className={tw.inputBase}
                  style={inputStyle(isDark)}
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: v("text-muted") }}>
                  Напоминание
                </label>
                <select
                  className={tw.inputBase}
                  style={inputStyle(isDark)}
                  value={editNotify}
                  onChange={(e) => setEditNotify(Number(e.target.value))}
                >
                  {NOTIFY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: v("text-muted") }}>
                  Описание
                </label>
                <textarea
                  className={`${tw.inputBase} min-h-[80px]`}
                  style={inputStyle(isDark)}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Описание (необязательно)"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                className="rounded-xl border px-4 py-2 text-sm transition-all duration-200 hover:scale-105"
                style={{ borderColor: v("border-secondary"), color: v("text-secondary"), background: v("bg-card") }}
                onClick={() => setEditEvent(null)}
              >
                Отмена
              </button>
              <button
                className="rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-200 hover:scale-105"
                style={buttonStyle("primary", isDark)}
                disabled={!editTitle.trim()}
                onClick={() => void handleEdit()}
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
