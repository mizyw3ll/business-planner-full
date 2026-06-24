import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, EyeOff, X, ArrowLeft, Mail, Lock, User, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../features/auth/AuthContext";
import { forgotPassword } from "../features/auth/authApi";
import { useAutofillFix } from "../shared/hooks/useAutofillFix";
import { useModalRegistration } from "../hooks/useModalOpen";
import { inputStyle, buttonStyle, v } from "../shared/theme";
import { useTheme } from "../features/theme/ThemeContext";

type Tab = "login" | "register" | "forgot";

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

function AuthInput({
  icon: Icon,
  label,
  value,
  onChange,
  type = "text",
  error,
  isValid,
  firstInput,
  rightElement,
  autoComplete = "off",
  isDark,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  error?: string;
  isValid?: boolean;
  firstInput?: React.RefObject<HTMLInputElement | null>;
  rightElement?: React.ReactNode;
  autoComplete?: string;
  isDark: boolean;
}) {
  const localRef = useRef<HTMLInputElement | null>(null);

  useAutofillFix(localRef);

  return (
    <div>
      <label className="text-xs font-medium block mb-1" style={{ color: v("text-muted") }}>{label}</label>
      <div className="relative flex items-center rounded-xl border" style={error ? { borderColor: "#ef4444", background: v("bg-input") } : inputStyle(isDark)}>
        <div className="pl-3" style={{ color: error ? "#ef4444" : isValid ? "#10b981" : v("text-muted") }}>
          <Icon size={16} />
        </div>
        <input
          ref={(node) => {
            localRef.current = node;
            if (firstInput) {
              (firstInput as React.MutableRefObject<HTMLInputElement | null>).current = node;
            }
          }}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none"
          style={{ color: v("text-primary") }}
        />
        {rightElement && <div className="pr-2">{rightElement}</div>}
      </div>
      {error && <p className="mt-1 text-xs" style={{ color: "#ef4444" }}>{error}</p>}
    </div>
  );
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  useModalRegistration(isOpen);
  const { signin, signup } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [tab, setTab] = useState<Tab>("login");
  const [busy, setBusy] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const firstInputRef = useRef<HTMLInputElement | null>(null);

  const [loginForm, setLoginForm] = useState({ login: "", password: "" });
  const [regForm, setRegForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    username: "",
    password: "",
    confirm: "",
  });
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotBusy, setForgotBusy] = useState(false);
  const [consentProcessing, setConsentProcessing] = useState(false);
  const [consentTerms, setConsentTerms] = useState(false);

  function resetForm() {
    setLoginForm({ login: "", password: "" });
    setRegForm({ first_name: "", last_name: "", email: "", username: "", password: "", confirm: "" });
    setForgotEmail("");
    setTab("login");
    setShowPass(false);
    setShowConfirm(false);
    setConsentProcessing(false);
    setConsentTerms(false);
  }

  useEffect(() => {
    if (isOpen) {
      resetForm();
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const loginErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    if (!loginForm.login.trim()) errors.login = "Поле не заполнено";
    if (!loginForm.password) errors.password = "Поле не заполнено";
    return errors;
  }, [loginForm]);

  const regErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    if (!regForm.email.trim()) errors.email = "Поле не заполнено";
    if (!regForm.username.trim()) errors.username = "Поле не заполнено";
    if (!regForm.password) errors.password = "Поле не заполнено";
    if (regForm.confirm !== regForm.password) errors.confirm = "Пароли не совпадают";
    return errors;
  }, [regForm]);

  const loginValid = Object.keys(loginErrors).length === 0;
  const regValid = Object.keys(regErrors).length === 0 && consentProcessing && consentTerms;

  if (!isOpen) return null;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!loginValid) return;
    try {
      setBusy(true);
      await signin(loginForm.login.trim(), loginForm.password);
      toast.success("Добро пожаловать!");
      resetForm();
      onClose();
    } catch (err: unknown) {
      toast.error((err as Error & { userMessage?: string })?.userMessage || "Ошибка входа. Проверьте данные.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!regValid) return;
    try {
      setBusy(true);
      await signup({
        email: regForm.email.trim(),
        username: regForm.username.trim(),
        password: regForm.password,
        first_name: regForm.first_name.trim() || undefined,
        last_name: regForm.last_name.trim() || undefined,
      });
      toast.success("Регистрация успешна!");
      resetForm();
      onClose();
    } catch (err: unknown) {
      toast.error((err as Error & { userMessage?: string })?.userMessage || "Ошибка регистрации");
    } finally {
      setBusy(false);
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      toast.error("Поле не заполнено");
      return;
    }
    try {
      setForgotBusy(true);
      await forgotPassword(forgotEmail.trim());
      toast.success("Письмо для сброса пароля отправлено");
      setForgotEmail("");
      setTab("login");
    } catch (err: unknown) {
      toast.error((err as Error & { userMessage?: string })?.userMessage || "Не удалось отправить письмо. Проверьте email.");
    } finally {
      setForgotBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border p-6"
        style={{ background: v("bg-sidebar"), borderColor: v("border-primary") }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold" style={{ color: v("text-primary") }}>
              {tab === "login" ? "Вход" : tab === "register" ? "Регистрация" : "Сброс пароля"}
            </h3>
            <p className="mt-0.5 text-sm" style={{ color: v("text-muted") }}>
              {tab === "login"
                ? "Войдите в свой аккаунт"
                : tab === "register"
                  ? "Создайте новый аккаунт"
                  : "Введите email для получения ссылки"}
            </p>
          </div>
          <button
            onClick={() => { resetForm(); onClose(); }}
            type="button"
            className="rounded-xl p-2 transition-colors hover:bg-white/5"
            style={{ color: v("text-muted") }}
          >
            <X size={18} />
          </button>
        </div>

        {tab !== "forgot" && (
          <div
            className="flex rounded-xl p-1 mb-5"
            style={{ background: v("bg-hover"), border: `1px solid ${v("border-secondary")}` }}
          >
            {(["login", "register"] as const).map((t) => (
              <button
                key={t}
                className="flex-1 rounded-lg py-2 text-sm font-medium transition-colors"
                style={{
                  color: tab === t ? v("text-primary") : v("text-muted"),
                  background: tab === t ? v("bg-secondary") : "transparent",
                }}
                onClick={() => setTab(t)}
                type="button"
              >
                {t === "login" ? "Вход" : "Регистрация"}
              </button>
            ))}
          </div>
        )}

        {tab === "forgot" && (
          <button
            className="mb-4 inline-flex items-center gap-1.5 text-sm transition-colors hover:text-indigo-400"
            style={{ color: v("text-muted") }}
            onClick={() => setTab("login")}
            type="button"
          >
            <ArrowLeft size={14} /> Назад ко входу
          </button>
        )}

        {tab === "login" && (
          <form className="space-y-3" onSubmit={handleLogin}>
            <AuthInput
              icon={Mail}
              label="Email или username"
              value={loginForm.login}
              onChange={(v) => setLoginForm((p) => ({ ...p, login: v }))}
              error={loginErrors.login}
              firstInput={firstInputRef}
              autoComplete="off"
              isDark={isDark}
            />
            <AuthInput
              icon={Lock}
              label="Пароль"
              value={loginForm.password}
              onChange={(v) => setLoginForm((p) => ({ ...p, password: v }))}
              type={showPass ? "text" : "password"}
              error={loginErrors.password}
              autoComplete="off"
              isDark={isDark}
              rightElement={
                <button type="button" className="p-1 rounded-lg transition-colors hover:bg-white/5" style={{ color: v("text-muted") }} onClick={() => setShowPass((p) => !p)}>
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              }
            />
            <button type="button" className="text-xs transition-colors hover:text-indigo-400" style={{ color: v("text-muted") }} onClick={() => setTab("forgot")}>
              Забыли пароль?
            </button>
            <button
              type="submit"
              disabled={!loginValid || busy}
              className="w-full rounded-xl py-2.5 text-sm font-medium transition-all disabled:opacity-40"
              style={buttonStyle("primary", isDark)}
            >
              {busy ? <span className="flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin" /> Вход...</span> : "Войти"}
            </button>
          </form>
        )}

        {tab === "forgot" && (
          <form className="space-y-3" onSubmit={handleForgot}>
            <AuthInput
              icon={Mail}
              label="Email"
              value={forgotEmail}
              onChange={setForgotEmail}
              type="email"
              firstInput={firstInputRef}
              autoComplete="off"
              isDark={isDark}
            />
            <button
              type="submit"
              disabled={forgotBusy}
              className="w-full rounded-xl py-2.5 text-sm font-medium transition-all disabled:opacity-40"
              style={buttonStyle("primary", isDark)}
            >
              {forgotBusy ? <span className="flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin" /> Отправка...</span> : "Отправить ссылку"}
            </button>
          </form>
        )}

        {tab === "register" && (
          <form className="space-y-3" onSubmit={handleRegister}>
            <div className="grid grid-cols-2 gap-3">
              <AuthInput icon={User} label="Имя" value={regForm.first_name} onChange={(v) => setRegForm((p) => ({ ...p, first_name: v }))} firstInput={firstInputRef} autoComplete="off" isDark={isDark} />
              <AuthInput icon={User} label="Фамилия" value={regForm.last_name} onChange={(v) => setRegForm((p) => ({ ...p, last_name: v }))} autoComplete="off" isDark={isDark} />
            </div>
            <AuthInput icon={Mail} label="Email" value={regForm.email} onChange={(v) => setRegForm((p) => ({ ...p, email: v }))} type="email" error={regErrors.email} isValid={!regErrors.email && regForm.email.length > 0} autoComplete="off" isDark={isDark} />
            <AuthInput icon={User} label="Username" value={regForm.username} onChange={(v) => setRegForm((p) => ({ ...p, username: v }))} error={regErrors.username} isValid={!regErrors.username && regForm.username.length > 0} autoComplete="off" isDark={isDark} />
            <div>
              <AuthInput
                icon={Lock}
                label="Пароль"
                value={regForm.password}
                onChange={(v) => setRegForm((p) => ({ ...p, password: v }))}
                type={showPass ? "text" : "password"}
                error={regErrors.password}
                autoComplete="new-password"
                isDark={isDark}
                rightElement={
                  <button type="button" className="p-1 rounded-lg transition-colors hover:bg-white/5" style={{ color: v("text-muted") }} onClick={() => setShowPass((p) => !p)}>
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                }
              />
            </div>
            <AuthInput
              icon={Lock}
              label="Подтвердите пароль"
              value={regForm.confirm}
              onChange={(v) => setRegForm((p) => ({ ...p, confirm: v }))}
              type={showConfirm ? "text" : "password"}
              error={regErrors.confirm}
              isValid={!regErrors.confirm && regForm.confirm.length > 0}
              autoComplete="new-password"
              isDark={isDark}
              rightElement={
                <button type="button" className="p-1 rounded-lg transition-colors hover:bg-white/5" style={{ color: v("text-muted") }} onClick={() => setShowConfirm((p) => !p)}>
                  {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              }
            />

            <div className="space-y-2 pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentProcessing}
                  onChange={(e) => setConsentProcessing(e.target.checked)}
                  className="mt-0.5 rounded accent-indigo-500"
                />
                <span className="text-[11px] leading-snug" style={{ color: v("text-muted") }}>
                  Даю согласие на обработку персональных данных в соответствии с{" "}
                  <Link to="/privacy" target="_blank" className="underline font-medium text-indigo-400 hover:text-indigo-300" onClick={(e) => e.stopPropagation()}>
                    Политикой конфиденциальности
                  </Link>
                </span>
              </label>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentTerms}
                  onChange={(e) => setConsentTerms(e.target.checked)}
                  className="mt-0.5 rounded accent-indigo-500"
                />
                <span className="text-[11px] leading-snug" style={{ color: v("text-muted") }}>
                  Ознакомлен и принимаю{" "}
                  <Link to="/terms" target="_blank" className="underline font-medium text-indigo-400 hover:text-indigo-300" onClick={(e) => e.stopPropagation()}>
                    Условия пользования
                  </Link>
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={!regValid || busy}
              className="w-full rounded-xl py-2.5 text-sm font-medium transition-all disabled:opacity-40"
              style={buttonStyle("primary", isDark)}
            >
              {busy ? <span className="flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin" /> Регистрация...</span> : "Зарегистрироваться"}
            </button>
            <p className="text-center text-[10px]" style={{ color: v("text-muted") }}>
              Регистрируясь, вы соглашаетесь с{" "}
              <Link to="/privacy" target="_blank" className="underline text-indigo-400 hover:text-indigo-300">Политикой конфиденциальности</Link>{" "}
              и{" "}
              <Link to="/terms" target="_blank" className="underline text-indigo-400 hover:text-indigo-300">Условиями пользования</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
