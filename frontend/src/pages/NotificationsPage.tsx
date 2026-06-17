import { useCallback, useEffect, useState } from "react";
import { Trash2, Bell, CheckCheck, Calendar, FileText, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import {
  getNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
  deleteNotificationApi,
  deleteAllNotificationsApi,
  type AppNotification,
} from "../api";
import { v } from "../shared/theme";
import { useTheme } from "../features/theme/ThemeContext";
import { ConfirmModal } from "../components/ConfirmModal";

export function NotificationsPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [notifs, setNotifs] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<AppNotification | null>(null);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);

  const fetchNotifs = useCallback(async () => {
    try {
      const data = await getNotificationsApi();
      setNotifs(data);
    } catch {
      toast.error("Ошибка загрузки уведомлений");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchNotifs();
  }, [fetchNotifs]);

  async function handleMarkRead(id: number) {
    try {
      await markNotificationReadApi(id);
      setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch {
      toast.error("Ошибка");
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsReadApi();
      setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success("Все прочитаны");
    } catch {
      toast.error("Ошибка");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteNotificationApi(deleteTarget.id);
      setNotifs((prev) => prev.filter((n) => n.id !== deleteTarget.id));
    } catch {
      toast.error("Ошибка удаления");
    } finally {
      setDeleteTarget(null);
    }
  }

  async function confirmDeleteAll() {
    try {
      await deleteAllNotificationsApi();
      setNotifs([]);
      setDeleteAllConfirm(false);
      toast.success("Все уведомления удалены");
    } catch {
      toast.error("Ошибка удаления");
    }
  }

  const unreadCount = notifs.filter((n) => !n.is_read).length;

  return (
    <>
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Подтверждение удаления"
        description={deleteTarget ? `Вы действительно хотите удалить уведомление "${deleteTarget.title}"?` : ""}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
      <ConfirmModal
        open={deleteAllConfirm}
        title="Удалить все уведомления"
        description="Вы действительно хотите удалить все уведомления? Это действие необратимо."
        confirmText="Удалить все"
        onCancel={() => setDeleteAllConfirm(false)}
        onConfirm={() => void confirmDeleteAll()}
      />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <h1 className="text-2xl font-semibold" style={{ color: v("text-primary") }}>
                Уведомления
              </h1>
              {unreadCount > 0 && (
                <span
                  className="absolute -top-2 -right-16 flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold transition-all duration-300 animate-fade-in"
                  style={{
                    background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))",
                    color: "rgba(99,102,241,0.9)",
                  }}
                >
                  <Bell size={10} />
                  {unreadCount}
                </span>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => void handleMarkAllRead()}
              className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-all duration-200 hover:scale-105"
              style={{ borderColor: v("border-secondary"), color: v("text-secondary"), background: v("bg-card") }}
            >
              <CheckCheck size={16} />
              Прочитать все
            </button>
          )}
          {notifs.length > 0 && (
            <button
              onClick={() => setDeleteAllConfirm(true)}
              className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-all duration-200 hover:scale-105"
              style={{
                borderColor: "rgba(220,38,38,0.3)",
                color: "rgb(252,165,165)",
                background: "rgba(220,38,38,0.08)",
              }}
            >
              <Trash2 size={16} />
              Удалить все
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-card h-[72px] rounded-xl" />
            ))}
          </div>
        ) : notifs.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center rounded-2xl border p-12 backdrop-blur-xl"
            style={{
              borderColor: v("border-primary"),
              background: isDark
                ? "linear-gradient(145deg, rgba(30,30,40,0.85), rgba(20,20,30,0.75))"
                : "linear-gradient(145deg, rgba(255,255,255,0.85), rgba(245,245,255,0.75))",
            }}
          >
            <Bell size={48} style={{ color: v("text-muted"), opacity: 0.4 }} />
            <p className="mt-3 text-sm" style={{ color: v("text-muted") }}>
              Нет уведомлений
            </p>
          </div>
        ) : (
          <div
            className="rounded-2xl border p-4 backdrop-blur-xl"
            style={{
              borderColor: v("border-primary"),
              background: isDark
                ? "linear-gradient(145deg, rgba(30,30,40,0.85), rgba(20,20,30,0.75))"
                : "linear-gradient(145deg, rgba(255,255,255,0.85), rgba(245,245,255,0.75))",
            }}
          >
            <div className="space-y-1.5">
              {notifs.map((n, i) => {
                const iconInfo =
                  n.source_type === "tax_event"
                    ? {
                        icon: AlertTriangle,
                        color: "#ef4444",
                        bg: isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.08)",
                      }
                    : n.source_type === "calendar_event"
                      ? {
                          icon: Calendar,
                          color: "#6366f1",
                          bg: isDark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)",
                        }
                      : {
                          icon: FileText,
                          color: "#10b981",
                          bg: isDark ? "rgba(16,185,129,0.12)" : "rgba(16,185,129,0.08)",
                        };
                const Icon = iconInfo.icon;
                return (
                  <div
                    key={n.id}
                    className={`animate-fade-in stagger-${
                      (i % 6) + 1
                    } group flex items-start justify-between rounded-xl border p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                      n.is_read ? "" : "border-l-4"
                    }`}
                    style={{
                      borderColor: n.is_read ? v("border-secondary") : "rgba(99,102,241,0.3)",
                      background: v("bg-card"),
                      opacity: n.is_read ? 0.5 : 1,
                    }}
                    onClick={() => (!n.is_read ? void handleMarkRead(n.id) : undefined)}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1 cursor-pointer">
                      <div
                        className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: iconInfo.bg }}
                      >
                        <Icon size={14} style={{ color: iconInfo.color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium flex items-center gap-2" style={{ color: v("text-primary") }}>
                          {!n.is_read && (
                            <span
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{ background: "rgba(99,102,241,0.8)" }}
                            />
                          )}
                          {n.title}
                        </p>
                        {n.body && (
                          <p className="text-xs mt-0.5 line-clamp-2" style={{ color: v("text-muted") }}>
                            {n.body}
                          </p>
                        )}
                        <p className="text-[10px] mt-1" style={{ color: v("text-secondary") }}>
                          {new Date(n.created_at).toLocaleString("ru-RU")}
                          {n.source_type &&
                            ` • ${
                              n.source_type === "tax_event"
                                ? "Налог"
                                : n.source_type === "calendar_event"
                                  ? "Событие"
                                  : n.source_type
                            }`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(n);
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
