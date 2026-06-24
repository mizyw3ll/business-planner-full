import { useEffect, useRef, useState } from "react";
import { Plus, Download, Upload } from "lucide-react";
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
import { EmptyState } from "../components/EmptyState";
import { useModalRegistration } from "../hooks/useModalOpen";
import { CalendarGrid } from "./calendar/CalendarGrid";
import { EventList } from "./calendar/EventList";

type NotifyUnit = "minutes" | "hours" | "days";

function minutesToUnit(minutes: number): { value: number; unit: NotifyUnit } {
  if (minutes >= 1440 && minutes % 1440 === 0) return { value: minutes / 1440, unit: "days" };
  if (minutes >= 60 && minutes % 60 === 0) return { value: minutes / 60, unit: "hours" };
  return { value: minutes, unit: "minutes" };
}

function unitToMinutes(value: number, unit: NotifyUnit): number {
  if (unit === "days") return value * 1440;
  if (unit === "hours") return value * 60;
  return value;
}

function formatNotifyLabel(value: number, unit: NotifyUnit): string {
  if (unit === "days") return `За ${value} дн.`;
  if (unit === "hours") return `За ${value} ч.`;
  return `За ${value} мин.`;
}

function formatDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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

export function CalendarPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  useModalRegistration(showCreate);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState(getLocalDatetimeStr());
  const [newDesc, setNewDesc] = useState("");
  const [newNotifyValue, setNewNotifyValue] = useState(30);
  const [newNotifyUnit, setNewNotifyUnit] = useState<NotifyUnit>("minutes");

  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);
  useModalRegistration(!!editEvent);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editNotifyValue, setEditNotifyValue] = useState(30);
  const [editNotifyUnit, setEditNotifyUnit] = useState<NotifyUnit>("minutes");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("event_date_asc");
  const [deleteTarget, setDeleteTarget] = useState<CalendarEvent | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function fetchEvents() {
    try {
      const firstDay = formatDate(new Date(year, month, 1));
      const lastDay = formatDate(new Date(year, month + 1, 0));
      const data = await getCalendarEventsApi(firstDay, lastDay);
      setEvents(data);
    } catch (err: any) {
      toast.error(err?.userMessage || "Ошибка загрузки событий");
    }
  }

  useEffect(() => { void fetchEvents(); }, [year, month]); // eslint-disable-line react-hooks/exhaustive-deps

  function prevMonth() {
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else setMonth(month - 1);
  }

  function nextMonth() {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else setMonth(month + 1);
  }

  async function handleCreate() {
    if (!newTitle.trim()) return;
    try {
      const eventDate = new Date(newDate);
      const notifyMinutes = unitToMinutes(newNotifyValue, newNotifyUnit);
      await createCalendarEventApi({
        title: newTitle.trim(),
        description: newDesc || undefined,
        event_date: eventDate.toISOString(),
        notify_before: notifyMinutes > 0 ? [notifyMinutes] : null,
      });
      toast.success("Событие создано");
      setShowCreate(false);
      setNewTitle(""); setNewDesc(""); setNewNotifyValue(30); setNewNotifyUnit("minutes"); setNewDate(getLocalDatetimeStr());
      await fetchEvents();
    } catch (err: any) {
      toast.error(err?.userMessage || "Ошибка создания события");
    }
  }

  function openEdit(event: CalendarEvent) {
    setEditEvent(event);
    setEditTitle(event.title);
    setEditDate(isoToDatetimeLocal(event.event_date));
    setEditDesc(event.description || "");
    const existing = event.notify_before && event.notify_before.length > 0 ? event.notify_before[0] : null;
    if (existing) {
      const { value, unit } = minutesToUnit(existing);
      setEditNotifyValue(value);
      setEditNotifyUnit(unit);
    } else {
      setEditNotifyValue(30);
      setEditNotifyUnit("minutes");
    }
  }

  async function handleEdit() {
    if (!editEvent || !editTitle.trim()) return;
    try {
      const eventDate = new Date(editDate);
      const notifyMinutes = unitToMinutes(editNotifyValue, editNotifyUnit);
      await updateCalendarEventApi(editEvent.id, {
        title: editTitle.trim(),
        description: editDesc || undefined,
        event_date: eventDate.toISOString(),
        notify_before: notifyMinutes > 0 ? [notifyMinutes] : null,
      });
      toast.success("Событие обновлено");
      setEditEvent(null);
      await fetchEvents();
    } catch (err: any) {
      toast.error(err?.userMessage || "Ошибка обновления события");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteCalendarEventApi(deleteTarget.id);
      toast.success("Событие удалено");
      await fetchEvents();
    } catch (err: any) {
      toast.error(err?.userMessage || "Ошибка удаления события");
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
      if (result.details.length > 0) result.details.forEach((d) => toast(d, { icon: "⚠️" }));
      await fetchEvents();
    } catch (err: any) {
      toast.error(err?.userMessage || "Ошибка импорта файла");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const EventForm = ({ mode }: { mode: "create" | "edit" }) => {
    const isCreate = mode === "create";
    const title = isCreate ? newTitle : editTitle;
    const date = isCreate ? newDate : editDate;
    const desc = isCreate ? newDesc : editDesc;
    const notifyValue = isCreate ? newNotifyValue : editNotifyValue;
    const notifyUnit = isCreate ? newNotifyUnit : editNotifyUnit;
    const setTitle = isCreate ? setNewTitle : setEditTitle;
    const setDate = isCreate ? setNewDate : setEditDate;
    const setDesc = isCreate ? setNewDesc : setEditDesc;
    const setNotifyValue = isCreate ? setNewNotifyValue : setEditNotifyValue;
    const setNotifyUnit = isCreate ? setNewNotifyUnit : setEditNotifyUnit;

    return (
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: v("text-muted") }}>Название *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm" style={inputStyle(isDark)} autoFocus />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: v("text-muted") }}>Дата и время *</label>
          <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm" style={inputStyle(isDark)} />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: v("text-muted") }}>Описание</label>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} className="w-full rounded-xl border px-3 py-2 text-sm" style={inputStyle(isDark)} placeholder="Описание события..." />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1.5" style={{ color: v("text-muted") }}>Напоминание</label>
          <div className="flex items-center gap-1.5">
            <span className="text-xs" style={{ color: v("text-muted") }}>За</span>
            <input
              type="number"
              min={1}
              max={999}
              value={notifyValue}
              onChange={(e) => setNotifyValue(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 rounded-xl border px-2.5 py-2 text-sm text-center"
              style={inputStyle(isDark)}
            />
            <select
              value={notifyUnit}
              onChange={(e) => setNotifyUnit(e.target.value as NotifyUnit)}
              className="rounded-xl border px-2.5 py-2 text-sm"
              style={inputStyle(isDark)}
            >
              <option value="minutes">мин.</option>
              <option value="hours">ч.</option>
              <option value="days">дн.</option>
            </select>
          </div>
        </div>
      </div>
    );
  };

  function handleDayClick(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const h = String(new Date().getHours()).padStart(2, "0");
    const min = String(new Date().getMinutes()).padStart(2, "0");
    setNewDate(`${y}-${m}-${d}T${h}:${min}`);
    setShowCreate(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide -mx-1 px-1">
        <h1 className="text-2xl font-semibold shrink-0" style={{ color: v("text-primary") }}>
          Календарь
        </h1>
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <input ref={fileInputRef} type="file" accept=".ics" onChange={handleImport} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} disabled={importing} className={`${tw.buttonSecondary} flex items-center gap-1.5 whitespace-nowrap`}>
            <Upload size={16} /> <span className="hidden sm:inline">{importing ? "Импорт..." : "Импорт"}</span>
          </button>
          <a href={getCalendarExportUrl()} download className={`${tw.buttonSecondary} flex items-center gap-1.5 whitespace-nowrap`}>
            <Download size={16} /> <span className="hidden sm:inline">Экспорт</span>
          </a>
          <button onClick={() => setShowCreate(true)} className={`${tw.buttonPrimary} flex items-center gap-1.5 whitespace-nowrap`}>
            <Plus size={16} /> <span className="hidden sm:inline">Событие</span>
          </button>
        </div>
      </div>

      <CalendarGrid
        year={year}
        month={month}
        events={events}
        isDark={isDark}
        onPrevMonth={prevMonth}
        onNextMonth={nextMonth}
        onDayClick={handleDayClick}
        onEditEvent={openEdit}
        onDeleteEvent={(ev) => setDeleteTarget(ev)}
      />

      {events.length === 0 && (
        <EmptyState
          title="У вас пока нет событий"
          subtitle="Создайте первое событие в календаре"
          actionLabel="Создать событие"
          onAction={() => setShowCreate(true)}
        />
      )}

      {events.length > 0 && <EventList
        events={events}
        isDark={isDark}
        searchQuery={searchQuery}
        sortBy={sortBy}
        onSearchChange={setSearchQuery}
        onSortChange={setSortBy}
        onEditEvent={openEdit}
        onDeleteEvent={(ev) => setDeleteTarget(ev)}
      />}

      {showCreate && (
        <div className="fixed inset-0 z-[90] grid place-items-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-md rounded-2xl border p-4 max-h-[90vh] overflow-y-auto" style={{ background: v("bg-secondary"), borderColor: v("border-primary") }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: v("text-primary") }}>Новое событие</h2>
            <EventForm mode="create" />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowCreate(false)} className="rounded-lg px-4 py-2 text-sm" style={buttonStyle("secondary", isDark)}>Отмена</button>
              <button onClick={() => void handleCreate()} disabled={!newTitle.trim()} className="rounded-lg px-4 py-2 text-sm font-medium" style={buttonStyle("primary", isDark)}>Создать</button>
            </div>
          </div>
        </div>
      )}

      {editEvent && (
        <div className="fixed inset-0 z-[90] grid place-items-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-md rounded-2xl border p-4 max-h-[90vh] overflow-y-auto" style={{ background: v("bg-secondary"), borderColor: v("border-primary") }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: v("text-primary") }}>Редактировать событие</h2>
            <EventForm mode="edit" />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setEditEvent(null)} className="rounded-lg px-4 py-2 text-sm" style={buttonStyle("secondary", isDark)}>Отмена</button>
              <button onClick={() => void handleEdit()} disabled={!editTitle.trim()} className="rounded-lg px-4 py-2 text-sm font-medium" style={buttonStyle("primary", isDark)}>Сохранить</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Подтверждение удаления"
        description={deleteTarget ? `Вы действительно хотите удалить событие "${deleteTarget.title}"?` : ""}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
