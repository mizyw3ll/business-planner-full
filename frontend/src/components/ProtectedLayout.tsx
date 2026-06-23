import { useEffect, useRef, useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, ArrowLeft, Search } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../features/auth/AuthContext";
import { Sidebar } from "./Sidebar";
import { SettingsModal } from "./SettingsModal";
import { SettingsUiProvider } from "../context/SettingsUiContext";
import { useSettingsModalState } from "../context/settingsUi";
import { NotificationBell } from "./NotificationBell";
import { useAnyModalOpen } from "../hooks/useModalOpen";
import { SearchBar } from "./SearchBar";

export function ProtectedLayout() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { open, tab, openModal, closeModal } = useSettingsModalState();
  const anyModalOpen = useAnyModalOpen();

  const calendarNotifiedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    const checkCalendarNotifications = async () => {
      try {
        const { getCalendarPendingNotificationsApi, createNotificationApi, markCalendarNotifiedApi } = await import(
          "../api"
        );
        const pending = await getCalendarPendingNotificationsApi();
        if (!mounted) return;
        for (const ev of pending) {
          if (calendarNotifiedRef.current.has(ev.id)) continue;
          calendarNotifiedRef.current.add(ev.id);
          toast(`🔔 ${ev.title} — событие начинается!`, { duration: 8000 });
          createNotificationApi({
            title: ev.title,
            body: ev.description ?? undefined,
            source_type: "calendar_event",
            source_id: ev.id,
          }).catch(() => {});
          markCalendarNotifiedApi(ev.id).catch(() => {});
        }
      } catch {
        /* silent */
      }
    };
    void checkCalendarNotifications();
    const id = setInterval(() => void checkCalendarNotifications(), 15000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [user]);

  useEffect(() => {
    if (location.state?.openSettings || localStorage.getItem("openSettings") === "true") {
      localStorage.removeItem("openSettings");
      openModal("about");
    }
  }, [location.state, openModal]);

  const isDetailPage =
    location.pathname.includes("/business-plans/") || location.pathname.includes("/financial-plans/");
  const backPath = location.pathname.includes("/business-plans/")
    ? "/business-plans"
    : location.pathname.includes("/financial-plans/")
      ? "/financial-plans"
      : null;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg-body)]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return (
    <SettingsUiProvider openSettings={openModal}>
      <div className="relative min-h-screen w-full overflow-x-hidden bg-[var(--bg-page)]">
        <div className="app-shell relative z-10 min-h-screen">
          {!anyModalOpen && (
            <div className="fixed left-4 top-4 z-40 flex items-center gap-2">
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-xl border transition-all hover:bg-[var(--bg-hover)] hover:scale-105 active:scale-95 shrink-0"
                style={{
                  borderColor: "var(--border-primary)",
                  background: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                }}
                onClick={() => setSidebarOpen(true)}
                aria-label="Открыть меню"
              >
                <Menu size={20} />
              </button>

              {isDetailPage && backPath && (
                <button
                  type="button"
                  className="grid h-10 w-10 place-items-center rounded-xl border transition-all hover:bg-[var(--bg-hover)] hover:scale-105 active:scale-95 shrink-0"
                  style={{
                    borderColor: "var(--border-primary)",
                    background: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                  }}
                  onClick={() => navigate(backPath)}
                  aria-label="Назад к списку"
                >
                  <ArrowLeft size={20} />
                </button>
              )}
            </div>
          )}

          {!anyModalOpen && (
            <div className="fixed right-4 top-4 z-40 flex items-center gap-3">
              <div className="hidden sm:block flex-1 sm:w-80 lg:w-[400px]">
                <SearchBar />
              </div>
              <button
                type="button"
                className="sm:hidden grid h-10 w-10 place-items-center rounded-xl border transition-all hover:bg-[var(--bg-hover)] hover:scale-105 active:scale-95 shrink-0"
                style={{
                  borderColor: "var(--border-primary)",
                  background: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                }}
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label="Поиск"
              >
                <Search size={20} />
              </button>
              <NotificationBell />
            </div>
          )}

          {searchOpen && (
            <div
              className="fixed left-4 right-4 top-16 z-50 sm:hidden"
              onClick={() => setSearchOpen(false)}
            >
              <div onClick={(e) => e.stopPropagation()}>
                <SearchBar onNavigate={() => setSearchOpen(false)} />
              </div>
            </div>
          )}

          {sidebarOpen ? (
            <button
              type="button"
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
              aria-label="Закрыть меню"
            />
          ) : null}

          <Sidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onOpenSettings={(t) => {
              openModal(t);
              setSidebarOpen(false);
            }}
          />
          <SettingsModal open={open} tab={tab} onClose={closeModal} />

          <div className="min-h-screen p-4 pt-20 md:p-8 md:pt-24 pb-16">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </div>

          {/* Юридический footer — ст. 10 ФЗ-149, ст. 9 ФЗ-152 */}
          {!anyModalOpen && (
            <footer
              className="relative z-10 border-t px-4 py-6 text-center md:px-8"
              style={{ borderColor: "var(--border-primary)", background: "var(--bg-primary)" }}
            >
              <div className="mx-auto max-w-4xl space-y-2">
                <p className="text-[11px] font-medium" style={{ color: "var(--text-secondary)" }}>
                  © 2026 Конструктор бизнес-планов · ИП Рыбкин Кирилл Александрович · ИНН 3525050141 · ОГРНИП
                  1033500045149
                </p>
                <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                  Юридический адрес: 160011, г. Вологда, ул. Первомайская, 42 · Email:{" "}
                  <a href="mailto:business_planner@inbox.ru" className="underline hover:opacity-80">
                    business_planner@inbox.ru
                  </a>
                </p>
                <div className="flex flex-wrap justify-center gap-3 text-[10px]" style={{ color: "var(--text-muted)" }}>
                  <Link to="/privacy" className="underline hover:opacity-80">
                    Политика конфиденциальности
                  </Link>
                  <Link to="/terms" className="underline hover:opacity-80">
                    Пользовательское соглашение
                  </Link>
                  <Link to="/cookie-policy" className="underline hover:opacity-80">
                    Политика cookie
                  </Link>
                </div>
              </div>
            </footer>
          )}
        </div>
      </div>
    </SettingsUiProvider>
  );
}
