import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Menu, ArrowLeft } from "lucide-react";
import { useAuth } from "../features/auth/AuthContext";
import { Sidebar } from "./Sidebar";
import { SettingsModal } from "./SettingsModal";
import { SettingsUiProvider } from "../context/SettingsUiContext";
import { useSettingsModalState } from "../context/settingsUi";
import { NotificationBell } from "./NotificationBell";
import { useAnyModalOpen } from "../hooks/useModalOpen";
import { SearchBar } from "./SearchBar";
import { useVisualPreferences } from "../context/VisualPreferencesContext";

export function ProtectedLayout() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { open, tab, openModal, closeModal } = useSettingsModalState();
  const { preferences } = useVisualPreferences();
  const anyModalOpen = useAnyModalOpen();

  useEffect(() => {
    let mounted = true;
    const checkCalendarNotifications = async () => {
      try {
        const { getCalendarPendingNotificationsApi, createNotificationApi, markCalendarNotifiedApi } = await import(
          "../api"
        );
        const pending = await getCalendarPendingNotificationsApi();
        if (!mounted) return;
        for (const ev of pending) {
          await createNotificationApi({
            title: ev.title,
            body: ev.description ?? undefined,
            source_type: "calendar_event",
            source_id: ev.id,
          });
          await markCalendarNotifiedApi(ev.id);
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
  }, []);

  useEffect(() => {
    if (!preferences.antigravity) return;

    let rafId = 0;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;
    const LERP = 0.15;
    const el = document.documentElement;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const tick = () => {
      currentX = lerp(currentX, targetX, LERP);
      currentY = lerp(currentY, targetY, LERP);
      el.style.setProperty("--mouse-x", `${currentX}px`);
      el.style.setProperty("--mouse-y", `${currentY}px`);
      rafId = requestAnimationFrame(tick);
    };

    const handleMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    rafId = requestAnimationFrame(tick);
    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", handleMove);
    };
  }, [preferences.antigravity]);

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
      <div className="relative min-h-screen w-full overflow-x-hidden bg-[var(--bg-body)]">
        {/* Background Elements */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="aurora-orb aurora-orb-1" />
          <div className="aurora-orb aurora-orb-2" />
          <div className="aurora-orb aurora-orb-3" />
          <div className="aurora-orb aurora-orb-4" />
          <div className="aurora-orb aurora-orb-5" />
          <div className="aurora-grid" />
          <div className="antigravity-layer" />

          {/* Orbital light particles — pure diffuse glow, no circles */}
          <div
            className="particle"
            style={{
              width: "40px",
              height: "40px",
              top: "8%",
              left: "5%",
              background: "radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%)",
              filter: "blur(6px)",
              animation: "particle-float-1 7s ease-in-out infinite",
              zIndex: 1,
            }}
          />
          <div
            className="particle"
            style={{
              width: "30px",
              height: "30px",
              top: "15%",
              left: "92%",
              background: "radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 70%)",
              filter: "blur(5px)",
              animation: "particle-float-2 9s ease-in-out infinite 0.5s",
              zIndex: 1,
            }}
          />
          <div
            className="particle"
            style={{
              width: "50px",
              height: "50px",
              top: "22%",
              left: "30%",
              background: "radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 70%)",
              filter: "blur(8px)",
              animation: "particle-float-3 6s ease-in-out infinite 1s",
              zIndex: 1,
            }}
          />
          <div
            className="particle"
            style={{
              width: "35px",
              height: "35px",
              top: "28%",
              left: "70%",
              background: "radial-gradient(circle, rgba(244,63,94,0.3) 0%, transparent 70%)",
              filter: "blur(6px)",
              animation: "particle-float-1 8s ease-in-out infinite 1.5s",
              zIndex: 1,
            }}
          />
          <div
            className="particle"
            style={{
              width: "55px",
              height: "55px",
              top: "35%",
              left: "15%",
              background: "radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)",
              filter: "blur(10px)",
              animation: "particle-float-2 5s ease-in-out infinite 2s",
              zIndex: 1,
            }}
          />
          <div
            className="particle"
            style={{
              width: "28px",
              height: "28px",
              top: "42%",
              left: "55%",
              background: "radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 70%)",
              filter: "blur(5px)",
              animation: "particle-float-3 10s ease-in-out infinite 2.5s",
              zIndex: 1,
            }}
          />
          <div
            className="particle"
            style={{
              width: "42px",
              height: "42px",
              top: "48%",
              left: "88%",
              background: "radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 70%)",
              filter: "blur(7px)",
              animation: "particle-float-1 7s ease-in-out infinite 3s",
              zIndex: 1,
            }}
          />
          <div
            className="particle"
            style={{
              width: "32px",
              height: "32px",
              top: "55%",
              left: "40%",
              background: "radial-gradient(circle, rgba(244,63,94,0.3) 0%, transparent 70%)",
              filter: "blur(5px)",
              animation: "particle-float-2 6s ease-in-out infinite 3.5s",
              zIndex: 1,
            }}
          />
          <div
            className="particle"
            style={{
              width: "48px",
              height: "48px",
              top: "62%",
              left: "75%",
              background: "radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%)",
              filter: "blur(8px)",
              animation: "particle-float-3 8s ease-in-out infinite 4s",
              zIndex: 1,
            }}
          />
          <div
            className="particle"
            style={{
              width: "26px",
              height: "26px",
              top: "68%",
              left: "10%",
              background: "radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 70%)",
              filter: "blur(4px)",
              animation: "particle-float-1 9s ease-in-out infinite 4.5s",
              zIndex: 1,
            }}
          />
          <div
            className="particle"
            style={{
              width: "52px",
              height: "52px",
              top: "75%",
              left: "48%",
              background: "radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)",
              filter: "blur(9px)",
              animation: "particle-float-2 5s ease-in-out infinite 5s",
              zIndex: 1,
            }}
          />
          <div
            className="particle"
            style={{
              width: "38px",
              height: "38px",
              top: "82%",
              left: "60%",
              background: "radial-gradient(circle, rgba(244,63,94,0.3) 0%, transparent 70%)",
              filter: "blur(6px)",
              animation: "particle-float-3 7s ease-in-out infinite 5.5s",
              zIndex: 1,
            }}
          />
          <div
            className="particle"
            style={{
              width: "44px",
              height: "44px",
              top: "88%",
              left: "25%",
              background: "radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%)",
              filter: "blur(7px)",
              animation: "particle-float-1 8s ease-in-out infinite 6s",
              zIndex: 1,
            }}
          />
          <div
            className="particle"
            style={{
              width: "30px",
              height: "30px",
              top: "50%",
              left: "3%",
              background: "radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 70%)",
              filter: "blur(5px)",
              animation: "particle-float-2 10s ease-in-out infinite 6.5s",
              zIndex: 1,
            }}
          />
          <div
            className="particle"
            style={{
              width: "46px",
              height: "46px",
              top: "10%",
              left: "50%",
              background: "radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 70%)",
              filter: "blur(8px)",
              animation: "particle-float-3 6s ease-in-out infinite 7s",
              zIndex: 1,
            }}
          />
          <div
            className="particle"
            style={{
              width: "36px",
              height: "36px",
              top: "30%",
              left: "82%",
              background: "radial-gradient(circle, rgba(244,63,94,0.3) 0%, transparent 70%)",
              filter: "blur(6px)",
              animation: "particle-float-1 9s ease-in-out infinite 7.5s",
              zIndex: 1,
            }}
          />
          <div
            className="particle"
            style={{
              width: "54px",
              height: "54px",
              top: "70%",
              left: "92%",
              background: "radial-gradient(circle, rgba(99,102,241,0.4) 0%, transparent 70%)",
              filter: "blur(10px)",
              animation: "particle-float-2 5s ease-in-out infinite 8s",
              zIndex: 1,
            }}
          />
          <div
            className="particle"
            style={{
              width: "28px",
              height: "28px",
              top: "45%",
              left: "20%",
              background: "radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 70%)",
              filter: "blur(4px)",
              animation: "particle-float-3 11s ease-in-out infinite 8.5s",
              zIndex: 1,
            }}
          />
          <div
            className="particle"
            style={{
              width: "40px",
              height: "40px",
              top: "18%",
              left: "65%",
              background: "radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 70%)",
              filter: "blur(7px)",
              animation: "particle-float-1 7s ease-in-out infinite 9s",
              zIndex: 1,
            }}
          />
          <div
            className="particle"
            style={{
              width: "34px",
              height: "34px",
              top: "90%",
              left: "75%",
              background: "radial-gradient(circle, rgba(244,63,94,0.3) 0%, transparent 70%)",
              filter: "blur(5px)",
              animation: "particle-float-2 8s ease-in-out infinite 9.5s",
              zIndex: 1,
            }}
          />
          <div
            className="particle"
            style={{
              width: "50px",
              height: "50px",
              top: "5%",
              left: "78%",
              background: "radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%)",
              filter: "blur(8px)",
              animation: "particle-float-3 6s ease-in-out infinite 10s",
              zIndex: 1,
            }}
          />
          <div
            className="particle"
            style={{
              width: "26px",
              height: "26px",
              top: "58%",
              left: "35%",
              background: "radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 70%)",
              filter: "blur(4px)",
              animation: "particle-float-1 9s ease-in-out infinite 10.5s",
              zIndex: 1,
            }}
          />
          <div
            className="particle"
            style={{
              width: "48px",
              height: "48px",
              top: "40%",
              left: "50%",
              background: "radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)",
              filter: "blur(9px)",
              animation: "particle-float-2 5s ease-in-out infinite 11s",
              zIndex: 1,
            }}
          />
          <div
            className="particle"
            style={{
              width: "32px",
              height: "32px",
              top: "78%",
              left: "15%",
              background: "radial-gradient(circle, rgba(244,63,94,0.3) 0%, transparent 70%)",
              filter: "blur(5px)",
              animation: "particle-float-3 7s ease-in-out infinite 11.5s",
              zIndex: 1,
            }}
          />
          <div
            className="particle"
            style={{
              width: "42px",
              height: "42px",
              top: "95%",
              left: "45%",
              background: "radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%)",
              filter: "blur(7px)",
              animation: "particle-float-1 8s ease-in-out infinite 12s",
              zIndex: 1,
            }}
          />
          <div
            className="particle"
            style={{
              width: "28px",
              height: "28px",
              top: "3%",
              left: "35%",
              background: "radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 70%)",
              filter: "blur(5px)",
              animation: "particle-float-2 10s ease-in-out infinite 12.5s",
              zIndex: 1,
            }}
          />



          {/* SVG Filter for Moving Fluid Waves */}
          <svg className="hidden">
            <filter id="fishing-net-filter" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="3" result="noise" seed="5" />
              <feOffset dx="0" dy="0" result="offsetNoise">
                <animate attributeName="dx" from="0" to="500" dur="40s" repeatCount="indefinite" />
                <animate attributeName="dy" from="0" to="250" dur="30s" repeatCount="indefinite" />
              </feOffset>
              <feDisplacementMap in="SourceGraphic" in2="offsetNoise" scale="30" />
            </filter>
          </svg>
        </div>

        <div className="app-shell relative z-10 min-h-screen">
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

          <div className="fixed right-4 top-4 z-40 flex items-center gap-3 max-[639px]:left-20">
            <div className="flex-1 sm:w-80 lg:w-[400px] sm:flex-none">
              <SearchBar />
            </div>
            <NotificationBell />
          </div>

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
