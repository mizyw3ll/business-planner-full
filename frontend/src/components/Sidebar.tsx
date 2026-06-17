import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import {
  LogOut,
  Menu,
  MoreHorizontal,
  PiggyBank,
  ScrollText,
  Settings,
  Home,
  FileText,
  Calendar,
  Receipt,
  LayoutGrid,
  Users,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import type { SettingsTab } from "../context/SettingsContext";
import { LogoutConfirmModal } from "./LogoutConfirmModal";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
  onOpenSettings: (tab?: SettingsTab) => void;
};

export function Sidebar({ open, onClose, onOpenSettings }: SidebarProps) {
  const { user, signout } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!accountOpen) return;
    const close = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [accountOpen]);

  return (
    <>
      <aside
        className={`theme-sidebar fixed inset-y-0 left-0 z-50 w-[260px] border-r transition-transform duration-400 ease-[0.22,1,0.36,1] ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: "var(--bg-sidebar)",
          borderColor: "var(--border-primary)",
          color: "var(--text-primary)",
          backdropFilter: "blur(32px) saturate(1.8)",
          WebkitBackdropFilter: "blur(32px) saturate(1.8)",
          boxShadow: "10px 0 40px rgba(0, 0, 0, 0.4)",
        }}
      >
        <div className="flex h-full flex-col p-4">
          <div className="mb-6 flex items-center justify-between px-2">
            <p className="text-xs font-bold uppercase tracking-widest opacity-60" style={{ color: "var(--text-secondary)" }}>
              Навигация
            </p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 transition-all duration-200 hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] active:scale-90"
              style={{ color: "var(--text-muted)" }}
              aria-label="Закрыть меню"
            >
              <Menu size={20} />
            </button>
          </div>

          <nav className="space-y-1.5">
            <NavButton to="/dashboard" icon={<Home size={20} />} text="Дашборд" onNavigate={onClose} />
            <NavButton to="/business-plans" icon={<ScrollText size={20} />} text="Бизнес-планы" onNavigate={onClose} />
            <NavButton to="/notes" icon={<FileText size={20} />} text="Заметки" onNavigate={onClose} />
            <NavButton to="/calendar" icon={<Calendar size={20} />} text="Календарь" onNavigate={onClose} />
            <NavButton to="/tax-calendar" icon={<Receipt size={20} />} text="Налоги" onNavigate={onClose} />
            <NavButton to="/kanban" icon={<LayoutGrid size={20} />} text="Kanban" onNavigate={onClose} />
            <NavButton to="/crm" icon={<Users size={20} />} text="CRM" onNavigate={onClose} />
            <NavButton
              to="/financial-plans"
              icon={<PiggyBank size={20} />}
              text="Финансовые планы"
              onNavigate={onClose}
            />
          </nav>

          <div className="my-6 px-3" style={{ borderTop: `1px solid var(--border-muted)` }} />

          <div className="mt-auto space-y-2">
            {user && (
              <div
                ref={accountRef}
                className="relative cursor-pointer select-none rounded-2xl border p-4 transition-all duration-300 hover:bg-[var(--bg-hover)]"
                style={{
                  background: "var(--bg-secondary)",
                  borderColor: "var(--border-muted)",
                }}
                onClick={() => setAccountOpen((p) => !p)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-extrabold shadow-lg shadow-indigo-500/20"
                    style={{ background: "var(--accent-primary)", color: "#000" }}
                  >
                    {(user.first_name || user.username).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                      {user.first_name || user.username}
                    </p>
                    <p className="truncate text-xs font-medium opacity-60" style={{ color: "var(--text-secondary)" }}>
                      {user.email}
                    </p>
                  </div>
                  <MoreHorizontal size={18} style={{ color: "var(--text-muted)" }} />
                </div>

                {accountOpen ? (
                  <div
                    className="absolute bottom-full left-0 right-0 z-10 mb-2 overflow-hidden rounded-2xl border shadow-2xl animate-scale-in"
                    style={{
                      background: "var(--bg-secondary)",
                      borderColor: "var(--border-primary)",
                    }}
                  >
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                      style={{ color: "var(--text-secondary)" }}
                      onClick={() => {
                        setAccountOpen(false);
                        onOpenSettings("main");
                      }}
                    >
                      <Settings size={16} />
                      Настройки
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 border-t px-4 py-3 text-left text-sm font-semibold transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                      style={{
                        color: "var(--text-secondary)",
                        borderColor: "var(--border-muted)",
                      }}
                      onClick={() => {
                        setAccountOpen(false);
                        setLogoutConfirmOpen(true);
                      }}
                    >
                      <LogOut size={16} />
                      Выйти
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </aside>

      <LogoutConfirmModal
        isOpen={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={() => {
          signout();
          onClose();
          setLogoutConfirmOpen(false);
        }}
      />
    </>
  );
}

function NavButton({
  to,
  icon,
  text,
  onNavigate,
}: {
  to: string;
  icon: ReactNode;
  text: string;
  onNavigate: () => void;
}) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex h-12 items-center rounded-2xl px-4 transition-all duration-300 group ${
          isActive
            ? "bg-[var(--bg-active)] text-[var(--text-primary)] shadow-[inset_0_0_0_1px_var(--border-secondary)] shadow-lg"
            : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] hover:translate-x-1"
        }`
      }
    >
      <span className="mr-3.5 transition-transform duration-300 group-hover:scale-110">{icon}</span>
      <span className="text-[15px] font-bold tracking-tight">{text}</span>
    </NavLink>
  );
}
