import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getNotificationsApi,
  getUnreadCountApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
  connectNotificationStream,
  type AppNotification,
  type NotificationSSEEvent,
} from "../api";
import { v } from "../shared/theme";
import { useTheme } from "../features/theme/ThemeContext";

export function NotificationBell() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [notifs, setNotifs] = useState<AppNotification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  // SSE connection + polling fallback
  useEffect(() => {
    // Fetch unread count immediately
    getUnreadCountApi()
      .then(({ count }) => setUnread(count))
      .catch(() => {});

    // Poll unread count every 10 seconds (always works, SSE or not)
    const pollId = setInterval(() => {
      getUnreadCountApi()
        .then(({ count }) => setUnread(count))
        .catch(() => {});
    }, 10000);

    // Connect to SSE stream for instant notification delivery
    const disconnect = connectNotificationStream(
      (event: NotificationSSEEvent) => {
        if (event.type === "notification" && event.id) {
          const newNotif: AppNotification = {
            id: event.id,
            title: event.title || "",
            body: event.body || null,
            source_type: event.source_type || "",
            source_id: event.source_id ?? null,
            is_read: event.is_read ?? false,
            created_at: event.created_at || new Date().toISOString(),
          };
          setNotifs((prev) => [newNotif, ...prev].slice(0, 100));
          setUnread((u) => u + 1);
        }
      },
      () => {},
    );

    return () => {
      disconnect();
      clearInterval(pollId);
    };
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleToggle() {
    if (!open) {
      const data = await getNotificationsApi().catch(() => []);
      setNotifs(data);
      setUnread(data.filter((n) => !n.is_read).length);
    }
    setOpen(!open);
  }

  async function handleMarkRead(id: number) {
    await markNotificationReadApi(id);
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
  }

  async function handleMarkAllRead() {
    await markAllNotificationsReadApi();
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnread(0);
  }

  function handleViewAll() {
    setOpen(false);
    navigate("/notifications");
  }

  const bgCard = isDark ? "rgba(30,30,40,0.95)" : "rgba(255,255,255,0.95)";
  const borderColor = v("border-primary");
  const textPrimary = v("text-primary");
  const textSecondary = v("text-secondary");
  const textMuted = v("text-muted");

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className="relative grid h-10 w-10 place-items-center rounded-lg border transition-colors"
        style={{
          borderColor: v("border-secondary"),
          background: v("bg-secondary"),
          color: v("text-secondary"),
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = v("bg-hover");
          e.currentTarget.style.color = v("text-primary");
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = v("bg-secondary");
          e.currentTarget.style.color = v("text-secondary");
        }}
        onClick={() => void handleToggle()}
        aria-label="Уведомления"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span
            className="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full px-1 text-[10px] font-bold leading-none"
            style={{
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              color: "#fff",
              boxShadow: "0 2px 6px rgba(239,68,68,0.4)",
            }}
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-12 z-50 w-80 rounded-2xl border p-3 shadow-2xl backdrop-blur-xl"
          style={{
            background: bgCard,
            borderColor: borderColor,
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold" style={{ color: textPrimary }}>
              Уведомления
            </span>
            {unread > 0 && (
              <button
                className="text-xs font-medium transition-colors hover:underline"
                style={{ color: "rgba(99,102,241,0.8)" }}
                onClick={() => void handleMarkAllRead()}
              >
                Прочитать все
              </button>
            )}
          </div>

          <div className="max-h-80 space-y-1 overflow-y-auto">
            {notifs.length === 0 ? (
              <p className="py-4 text-center text-sm" style={{ color: textMuted }}>
                Нет уведомлений
              </p>
            ) : (
              notifs.slice(0, 10).map((n) => (
                <div
                  key={n.id}
                  className={`rounded-xl p-2.5 transition-all duration-200 cursor-pointer ${
                    !n.is_read ? "border" : ""
                  }`}
                  style={{
                    borderColor: !n.is_read ? "rgba(99,102,241,0.2)" : "transparent",
                    background: !n.is_read ? "rgba(99,102,241,0.05)" : "transparent",
                    opacity: n.is_read ? 0.5 : 1,
                  }}
                  onClick={() => (!n.is_read ? void handleMarkRead(n.id) : undefined)}
                >
                  <p className="text-sm font-medium leading-tight" style={{ color: textPrimary }}>
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="text-xs mt-0.5 line-clamp-2" style={{ color: textMuted }}>
                      {n.body}
                    </p>
                  )}
                  <p className="text-[10px] mt-1" style={{ color: textSecondary }}>
                    {new Date(n.created_at).toLocaleString("ru-RU")}
                  </p>
                </div>
              ))
            )}
          </div>

          {notifs.length > 0 && (
            <button
              className="mt-2 w-full rounded-xl py-2 text-sm font-medium transition-all duration-200 hover:scale-[1.02] border"
              style={{
                borderColor: borderColor,
                color: textPrimary,
                background: v("bg-card"),
              }}
              onClick={handleViewAll}
            >
              Все уведомления
            </button>
          )}
        </div>
      )}
    </div>
  );
}
