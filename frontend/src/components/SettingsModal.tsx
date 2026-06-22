import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Moon,
  Sun,
  X,
  Shield,
  FileCheck,
  Cookie,
  Mail,
  Lock,
  CheckCircle,
  Loader2,
  Eye,
  EyeOff,
  Grid3x3,
  Wand2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useModalRegistration } from "../hooks/useModalOpen";
import { useTheme } from "../features/theme/ThemeContext";
import { useAuth } from "../features/auth/AuthContext";

import { useVisualSettings } from "../features/settings/VisualSettingsContext";
import { deleteUserApi } from "../api";
import { requestVerification, changePassword } from "../features/auth/authApi";
import { extractApiError } from "../shared/utils/extractApiError";
import { ConfirmModal } from "./ConfirmModal";
import { LogoutConfirmModal } from "./LogoutConfirmModal";
import type { SettingsTab } from "../context/SettingsContext";

type Props = {
  open: boolean;
  tab: SettingsTab;
  onClose: () => void;
};

export function SettingsModal({ open, tab, onClose }: Props) {
  const { theme, setTheme } = useTheme();
  const { user, signout } = useAuth();
  const navigate = useNavigate();
  const [panel, setPanel] = useState<SettingsTab>(tab);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useModalRegistration(open);

  if (!open) return null;

  async function handleDeleteAccount() {
    if (!user) return;
    try {
      await deleteUserApi(user.id);
      toast.success("Аккаунт удалён");
      setDeleteOpen(false);
      onClose();
      signout();
      navigate("/", { replace: true });
    } catch {
      toast.error("Не удалось удалить аккаунт");
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-[100] md:flex md:items-center md:justify-center md:p-[max(1rem,5vw)]">
        <button
          type="button"
          className="absolute inset-0"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={onClose}
          aria-label="Закрыть настройки"
        />
        <div
          role="dialog"
          className="relative z-10 flex flex-col overflow-hidden max-md:fixed max-md:inset-x-0 max-md:top-6 max-md:bottom-0 max-md:rounded-t-2xl max-md:border max-lg:top-12 md:h-[656px] md:w-full md:max-w-2xl md:rounded-2xl md:border animate-scale-in"
          style={{
            background: "var(--bg-sidebar)",
            borderColor: "var(--border-primary)",
            boxShadow: "var(--shadow-lg)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="flex items-center justify-between px-6 py-4 shrink-0"
            style={{ borderBottom: `1px solid var(--border-muted)` }}
          >
            <h2 className="text-xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Настройки
            </h2>
            <button
              onClick={onClose}
              className="rounded-xl p-2 transition-colors hover:bg-[var(--bg-hover)]"
              style={{ color: "var(--text-muted)" }}
            >
              <X size={22} />
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden max-md:flex-col">
            <div
              className="flex max-md:flex-row max-md:gap-2 max-md:px-4 max-md:pt-2 md:flex-col md:gap-1 md:p-3 md:w-48 md:shrink-0"
              style={{
                borderColor: "var(--border-muted)",
                borderBottom: "1px solid var(--border-muted)",
                borderRight: "1px solid var(--border-muted)",
              }}
            >
              <TabBtn active={panel === "main"} onClick={() => setPanel("main")} label="Общие" />
              <TabBtn active={panel === "appearance"} onClick={() => setPanel("appearance")} label="Внешний вид" />
              <TabBtn active={panel === "profile"} onClick={() => setPanel("profile")} label="Профиль" />
              <TabBtn active={panel === "about"} onClick={() => setPanel("about")} label="О программе" />
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {panel === "main" && (
                <div className="space-y-6">
                  <div>
                    <p
                      className="text-sm font-bold uppercase tracking-widest opacity-60 mb-4"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Тема оформления
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <ThemeBtn
                        active={theme === "dark"}
                        onClick={() => setTheme("dark")}
                        icon={<Moon size={24} />}
                        label="Тёмная"
                      />
                      <ThemeBtn
                        active={theme === "light"}
                        onClick={() => setTheme("light")}
                        icon={<Sun size={24} />}
                        label="Светлая"
                      />
                    </div>
                  </div>
                </div>
              )}

              {panel === "appearance" && <AppearancePanel />}

              {panel === "profile" && (
                <div className="space-y-6">
                  <div
                    className="rounded-2xl p-5 space-y-4"
                    style={{ border: "1px solid var(--border-primary)", background: "var(--bg-secondary)" }}
                  >
                    <p
                      className="text-xs font-bold uppercase tracking-widest opacity-60"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Аккаунт
                    </p>
                    <p className="font-mono text-sm font-bold truncate">{user?.email}</p>
                    <button
                      onClick={() => setLogoutConfirmOpen(true)}
                      className="w-full rounded-xl py-3 text-sm font-bold transition-all hover:bg-white/5"
                      style={{ border: "1px solid var(--border-secondary)" }}
                    >
                      Выйти из системы
                    </button>
                  </div>

                  <EmailVerification user={user} />

                  <ChangePasswordForm />

                  <button
                    onClick={() => setDeleteOpen(true)}
                    className="w-full rounded-xl py-3 text-sm font-bold transition-all hover:bg-rose-500/10"
                    style={{ border: "1px solid rgba(244, 63, 94, 0.3)", color: "#fda4af" }}
                  >
                    Удалить аккаунт
                  </button>
                </div>
              )}

              {panel === "about" && (
                <div className="space-y-6">
                  <div
                    className="rounded-2xl p-5 space-y-4"
                    style={{ border: "1px solid var(--border-primary)", background: "var(--bg-secondary)" }}
                  >
                    <p
                      className="text-xs font-bold uppercase tracking-widest opacity-60"
                      style={{ color: "var(--text-muted)" }}
                    >
                      О программе
                    </p>
                    <div className="space-y-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                      <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                        Конструктор бизнес-планов
                      </p>
                      <p>Версия 1.0.0</p>
                      <p>Сервис для управления бизнес-процессами, финансами и задачами.</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p
                      className="text-xs font-bold uppercase tracking-widest opacity-60 mb-3"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Документы
                    </p>
                    <Link
                      to="/privacy"
                      onClick={() => localStorage.setItem("openSettings", "true")}
                      className="flex items-center gap-3 rounded-2xl p-4 text-sm font-semibold transition-all hover:bg-[var(--bg-hover)]"
                      style={{ border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
                    >
                      <Shield size={18} style={{ color: "var(--text-muted)" }} />
                      Политика конфиденциальности
                    </Link>
                    <Link
                      to="/terms"
                      onClick={() => localStorage.setItem("openSettings", "true")}
                      className="flex items-center gap-3 rounded-2xl p-4 text-sm font-semibold transition-all hover:bg-[var(--bg-hover)]"
                      style={{ border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
                    >
                      <FileCheck size={18} style={{ color: "var(--text-muted)" }} />
                      Пользовательское соглашение
                    </Link>
                    <Link
                      to="/cookie-policy"
                      onClick={() => localStorage.setItem("openSettings", "true")}
                      className="flex items-center gap-3 rounded-2xl p-4 text-sm font-semibold transition-all hover:bg-[var(--bg-hover)]"
                      style={{ border: "1px solid var(--border-primary)", color: "var(--text-primary)" }}
                    >
                      <Cookie size={18} style={{ color: "var(--text-muted)" }} />
                      Политика cookie
                    </Link>
                  </div>

                  <div
                    className="rounded-2xl p-4 text-xs"
                    style={{
                      border: "1px solid var(--border-primary)",
                      background: "var(--bg-secondary)",
                      color: "var(--text-muted)",
                    }}
                  >
                    <p>© 2026 Конструктор бизнес-планов · ИП Рыбкин Кирилл Александрович · ИНН 3525050141</p>
                    <p className="mt-1">ОГРНИП 1033500045149 · 160011, г. Вологда, ул. Первомайская, 42</p>
                    <p className="mt-1">
                      Email:{" "}
                      <a href="mailto:business_planner@inbox.ru" className="underline hover:opacity-80">
                        business_planner@inbox.ru
                      </a>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={deleteOpen}
        title="Удаление аккаунта"
        description="Это действие необратимо. Все данные профиля будут удалены."
        confirmText="Удалить навсегда"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => void handleDeleteAccount()}
      />

      <LogoutConfirmModal
        isOpen={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        onConfirm={() => {
          signout();
          onClose();
          navigate("/", { replace: true });
          setLogoutConfirmOpen(false);
        }}
      />
    </>
  );
}

function TabBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-4 py-3 text-sm font-bold transition-all text-left ${
        active
          ? "bg-[var(--bg-active)] text-[var(--text-primary)] shadow-lg shadow-indigo-500/10"
          : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)]"
      }`}
    >
      {label}
    </button>
  );
}

function ThemeBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-3 rounded-2xl border-2 p-6 transition-all active:scale-95 ${
        active
          ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
          : "border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:border-[var(--border-secondary)]"
      }`}
    >
      {icon}
      <span className="text-sm font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}

function AppearancePanel() {
  const { settings, toggle } = useVisualSettings();

  return (
    <div className="space-y-8">
      <div>
        <p
          className="text-sm font-bold uppercase tracking-widest opacity-60 mb-5"
          style={{ color: "var(--text-secondary)" }}
        >
          Эффекты интерфейса
        </p>
        <div className="space-y-4">
          <PreferenceToggle
            icon={<Grid3x3 size={20} />}
            title="Сетка"
            desc="Тонкая линейная сетка на фоне"
            active={settings.gridOverlay}
            onToggle={() => toggle("gridOverlay")}
          />
        </div>
      </div>
    </div>
  );
}

function PreferenceToggle({
  icon,
  title,
  desc,
  active,
  onToggle,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  active: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <div
      className="flex items-center justify-between rounded-2xl p-4 transition-all hover:bg-white/5"
      style={{ border: "1px solid var(--border-primary)", background: "var(--bg-secondary)" }}
    >
      <div className="flex items-center gap-4">
        <div
          className="rounded-xl p-2.5"
          style={{
            background: active ? "rgba(129, 140, 248, 0.2)" : "var(--bg-tertiary)",
            color: active ? "#818cf8" : "var(--text-muted)",
          }}
        >
          {icon}
        </div>
        <div>
          <p className="text-[15px] font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            {title}
          </p>
          <p className="text-xs font-medium opacity-60" style={{ color: "var(--text-muted)" }}>
            {desc}
          </p>
        </div>
      </div>
      <button
        onClick={() => onToggle(!active)}
        className={`relative h-6 w-11 rounded-full transition-colors duration-300 ${
          active ? "bg-indigo-500" : "bg-zinc-700"
        }`}
      >
        <div
          className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform duration-300 ${
            active ? "translate-x-5" : ""
          }`}
        />
      </button>
    </div>
  );
}

function EmailVerification({ user }: { user: { email?: string | null; is_verified?: boolean } | null }) {
  const [sending, setSending] = useState(false);
  const isVerified = user?.is_verified;

  async function handleSend() {
    setSending(true);
    try {
      await requestVerification();
      toast.success("Письмо с ссылкой подтверждения отправлено");
    } catch {
      toast.error("Не удалось отправить письмо");
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="rounded-2xl p-5 space-y-3"
      style={{ border: "1px solid var(--border-primary)", background: "var(--bg-secondary)" }}
    >
      <div className="flex items-center gap-3">
        <Mail size={18} style={{ color: isVerified ? "#16a34a" : "var(--text-muted)" }} />
        <p className="text-xs font-bold uppercase tracking-widest opacity-60" style={{ color: "var(--text-muted)" }}>
          Подтверждение почты
        </p>
      </div>
      {isVerified ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: "#16a34a" }}>
          <CheckCircle size={16} />
          <span className="font-semibold">Почта подтверждена</span>
        </div>
      ) : (
        <>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Почта не подтверждена. Подтвердите её для получения важных уведомлений.
          </p>
          <button
            onClick={() => void handleSend()}
            disabled={sending}
            className="w-full rounded-xl py-3 text-sm font-bold transition-all hover:bg-white/5 disabled:opacity-50"
            style={{ border: "1px solid var(--border-secondary)" }}
          >
            {sending ? <Loader2 size={16} className="animate-spin inline" /> : "Отправить письмо подтверждения"}
          </button>
        </>
      )}
    </div>
  );
}

function passwordStrength(password: string) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  if (score <= 2) return { label: "Слабый", color: "#ef4444", width: "33%", score };
  if (score <= 4) return { label: "Средний", color: "#f59e0b", width: "66%", score };
  return { label: "Сильный", color: "#10b981", width: "100%", score };
}

function generatePassword(): string {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const special = "!@#$%^&*";
  const all = upper + lower + digits + special;
  const required = [upper, lower, digits, special].map((s) => s[Math.floor(Math.random() * s.length)]);
  const rest = Array.from({ length: 12 }, () => all[Math.floor(Math.random() * all.length)]);
  return [...required, ...rest].sort(() => Math.random() - 0.5).join("");
}

function PasswordStrengthBar({ password }: { password: string }) {
  const strength = passwordStrength(password);
  if (!password) return null;

  return (
    <div className="mt-1.5 space-y-1">
      <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: strength.width, background: strength.color }}
        />
      </div>
      <p className="text-[11px]" style={{ color: strength.color }}>{strength.label}</p>
    </div>
  );
}

function ChangePasswordForm() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const newPasswordError = useMemo(() => {
    if (!newPassword) return "";
    const checks = [
      newPassword.length >= 8,
      /[A-Z]/.test(newPassword),
      /[a-z]/.test(newPassword),
      /\d/.test(newPassword),
      /[^A-Za-z0-9]/.test(newPassword),
    ];
    if (!checks.every(Boolean)) return "Минимум 8 символов: заглавная, строчная, цифра, спецсимвол";
    return "";
  }, [newPassword]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Пароли не совпадают");
      return;
    }
    if (newPasswordError) {
      toast.error(newPasswordError);
      return;
    }
    setLoading(true);
    try {
      await changePassword(oldPassword, newPassword);
      toast.success("Пароль успешно изменён");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      const msg = extractApiError(err, "Не удалось изменить пароль");
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function onGenerate() {
    const pwd = generatePassword();
    setNewPassword(pwd);
    setConfirmPassword(pwd);
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="rounded-2xl p-5 space-y-4"
      style={{ border: "1px solid var(--border-primary)", background: "var(--bg-secondary)" }}
    >
      <div className="flex items-center gap-3">
        <Lock size={18} style={{ color: "var(--text-muted)" }} />
        <p className="text-xs font-bold uppercase tracking-widest opacity-60" style={{ color: "var(--text-muted)" }}>
          Смена пароля
        </p>
      </div>
      <div className="relative">
        <input
          type={showOld ? "text" : "password"}
          placeholder="Текущий пароль"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="w-full rounded-xl px-4 py-3 text-sm outline-none pr-10"
          style={{
            border: "1px solid var(--border-primary)",
            background: "var(--bg-input)",
            color: "var(--text-primary)",
          }}
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors hover:bg-white/5"
          style={{ color: "var(--text-muted)" }}
          onClick={() => setShowOld((p) => !p)}
          tabIndex={-1}
        >
          {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      <div>
        <div className="relative">
          <input
            type={showNew ? "text" : "password"}
            placeholder="Новый пароль"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-xl px-4 py-3 text-sm outline-none pr-10"
            style={{
              border: `1px solid ${newPasswordError ? "#ef4444" : "var(--border-primary)"}`,
              background: "var(--bg-input)",
              color: "var(--text-primary)",
            }}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: "var(--text-muted)" }}
            onClick={() => setShowNew((p) => !p)}
            tabIndex={-1}
          >
            {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <PasswordStrengthBar password={newPassword} />
        {newPasswordError && (
          <p className="mt-1 text-xs" style={{ color: "#ef4444" }}>{newPasswordError}</p>
        )}
      </div>
      <div className="relative">
        <input
          type={showConfirm ? "text" : "password"}
          placeholder="Повторите новый пароль"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-xl px-4 py-3 text-sm outline-none pr-10"
          style={{
            border: `1px solid ${confirmPassword && confirmPassword !== newPassword ? "#ef4444" : "var(--border-primary)"}`,
            background: "var(--bg-input)",
            color: "var(--text-primary)",
          }}
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors hover:bg-white/5"
          style={{ color: "var(--text-muted)" }}
          onClick={() => setShowConfirm((p) => !p)}
          tabIndex={-1}
        >
          {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {confirmPassword && confirmPassword !== newPassword && (
        <p className="text-xs" style={{ color: "#ef4444" }}>Пароли не совпадают</p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || !oldPassword || !newPassword || !confirmPassword}
          className="flex-1 rounded-xl py-3 text-sm font-bold transition-all disabled:opacity-50"
          style={{ border: "1px solid var(--border-secondary)", background: "var(--bg-hover)" }}
        >
          {loading ? <Loader2 size={16} className="animate-spin inline" /> : "Изменить пароль"}
        </button>
        <button
          type="button"
          onClick={onGenerate}
          className="rounded-xl px-3 py-3 transition-all hover:bg-white/5"
          style={{ border: "1px solid var(--border-muted)" }}
          title="Сгенерировать пароль"
        >
          <Wand2 size={16} style={{ color: "var(--text-muted)" }} />
        </button>
      </div>
    </form>
  );
}
