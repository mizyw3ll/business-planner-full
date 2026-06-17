import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, EyeOff, X, ArrowLeft, Mail, Lock, User, Check, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../features/auth/AuthContext";
import { forgotPassword } from "../features/auth/authApi";

type Tab = "login" | "register" | "forgot";

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernameRegex = /^[A-Za-z0-9_]{3,20}$/;

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

function FloatingInput({
  icon: Icon,
  label,
  value,
  onChange,
  type = "text",
  error,
  isValid,
  firstInput,
  rightElement,
}: {
  icon: any;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  error?: string;
  isValid?: boolean;
  firstInput?: React.RefObject<HTMLInputElement | null>;
  rightElement?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  const isActive = focused || value.length > 0;

  return (
    <div className="relative group">
      <div
        className="relative rounded-2xl transition-all duration-300"
        style={{
          background: focused ? "rgba(99, 102, 241, 0.08)" : "rgba(255, 255, 255, 0.04)",
          border: `1.5px solid ${
            error
              ? "rgba(239, 68, 68, 0.5)"
              : focused
                ? "rgba(99, 102, 241, 0.5)"
                : isValid
                  ? "rgba(16, 185, 129, 0.4)"
                  : "rgba(255, 255, 255, 0.08)"
          }`,
          boxShadow: focused ? "0 0 0 4px rgba(99, 102, 241, 0.08), 0 4px 16px rgba(99, 102, 241, 0.1)" : "none",
        }}
      >
        <div className="flex items-center">
          <div
            className="pl-4 transition-colors duration-200"
            style={{
              color: focused ? "#818cf8" : error ? "#ef4444" : isValid ? "#10b981" : "#6b7280",
            }}
          >
            <Icon size={18} />
          </div>
          <input
            ref={firstInput}
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="flex-1 bg-transparent px-3 py-3.5 text-sm text-white outline-none"
            placeholder=""
            style={{ color: "#f0eeff" }}
          />
          {rightElement && <div className="pr-3">{rightElement}</div>}
        </div>
        <label
          className="absolute left-11 transition-all duration-200 pointer-events-none px-1"
          style={{
            top: isActive ? "-10px" : "50%",
            transform: isActive ? "translateY(0)" : "translateY(-50%)",
            fontSize: isActive ? "11px" : "14px",
            color: focused ? "#818cf8" : error ? "#ef4444" : isValid ? "#10b981" : "#6b7280",
            letterSpacing: isActive ? "0.03em" : "0",
            fontWeight: isActive ? "500" : "400",
            background: isActive
              ? "linear-gradient(to bottom, transparent 40%, rgba(15, 12, 35, 0.95) 40%)"
              : "transparent",
            lineHeight: "1",
          }}
        >
          {label}
        </label>
      </div>
      {error && (
        <p className="mt-1.5 ml-1 text-xs text-red-400 animate-slide-up" style={{ animationDuration: "0.2s" }}>
          {error}
        </p>
      )}
    </div>
  );
}

function PasswordStrengthBar({ password }: { password: string }) {
  const strength = passwordStrength(password);
  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: strength.width,
            background: `linear-gradient(90deg, ${strength.color}, ${strength.color}dd)`,
            boxShadow: `0 0 12px ${strength.color}40`,
          }}
        />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-[11px]" style={{ color: strength.color }}>
          {strength.label}
        </p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-1 w-1 rounded-full transition-all duration-300"
              style={{
                background: i <= strength.score ? strength.color : "rgba(255,255,255,0.1)",
                transform: i <= strength.score ? "scale(1)" : "scale(0.7)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signin, signup } = useAuth();
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
      setTimeout(() => firstInputRef.current?.focus(), 300);
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
    if (!loginForm.login.trim()) errors.login = "Введите email или username";
    else if (loginForm.login.includes("@")) {
      if (!emailRegex.test(loginForm.login)) errors.login = "Некорректный email";
    } else if (!usernameRegex.test(loginForm.login)) errors.login = "Username: 3-20 символов, латиница, цифры, _";
    if (!loginForm.password) errors.password = "Введите пароль";
    return errors;
  }, [loginForm]);

  const regErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    if (!emailRegex.test(regForm.email)) errors.email = "Введите корректный email";
    if (!usernameRegex.test(regForm.username)) errors.username = "Username: 3-20 символов, латиница, цифры, _";
    const passChecks = [
      regForm.password.length >= 8,
      /[A-Z]/.test(regForm.password),
      /[a-z]/.test(regForm.password),
      /\d/.test(regForm.password),
      /[^A-Za-z0-9]/.test(regForm.password),
    ];
    if (!passChecks.every(Boolean)) errors.password = "Минимум 8 символов: заглавная, строчная, цифра, спецсимвол";
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
    } catch {
      toast.error("Ошибка входа. Проверьте данные.");
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
    } catch {
      toast.error("Ошибка регистрации");
    } finally {
      setBusy(false);
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    if (!emailRegex.test(forgotEmail)) {
      toast.error("Введите корректный email");
      return;
    }
    try {
      setForgotBusy(true);
      await forgotPassword(forgotEmail.trim());
      toast.success("Письмо для сброса пароля отправлено");
      setForgotEmail("");
      setTab("login");
    } catch {
      toast.error("Не удалось отправить письмо. Проверьте email.");
    } finally {
      setForgotBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ animation: "authOverlayIn 0.4s ease-out forwards" }}
    >
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden" style={{ background: "rgba(0,0,0,0.75)" }}>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")",
            backgroundRepeat: "repeat",
            backgroundSize: "256px 256px",
            mixBlendMode: "overlay",
          }}
        />
        {/* Floating orbs */}
        <div
          className="absolute rounded-full"
          style={{
            width: "600px",
            height: "600px",
            top: "5%",
            left: "10%",
            background:
              "radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, rgba(80, 80, 160, 0.08) 40%, transparent 72%)",
            filter: "blur(80px)",
            animation: "authOrbFloat1 20s ease-in-out infinite",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: "500px",
            height: "500px",
            bottom: "10%",
            right: "15%",
            background:
              "radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, rgba(60, 140, 120, 0.05) 40%, transparent 72%)",
            filter: "blur(80px)",
            animation: "authOrbFloat2 25s ease-in-out infinite",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: "400px",
            height: "400px",
            top: "45%",
            left: "55%",
            background:
              "radial-gradient(circle, rgba(139, 92, 246, 0.18) 0%, rgba(100, 80, 180, 0.04) 40%, transparent 72%)",
            filter: "blur(60px)",
            animation: "authOrbFloat3 18s ease-in-out infinite",
          }}
        />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />
      </div>

      {/* Main card */}
      <div
        className="relative w-full max-w-[920px] overflow-hidden rounded-3xl"
        style={{
          background: "rgba(14, 12, 36, 0.88)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(40px) saturate(1.6)",
          WebkitBackdropFilter: "blur(40px) saturate(1.6)",
          boxShadow:
            "0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04) inset, 0 1px 0 rgba(255,255,255,0.06) inset",
          animation: "authCardIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
        <div className="flex min-h-[580px]">
          {/* Left decorative panel */}
          <div
            className="relative hidden w-[340px] shrink-0 overflow-hidden lg:block"
            style={{
              background:
                "linear-gradient(135deg, rgba(99, 102, 241, 0.35) 0%, rgba(67, 56, 202, 0.45) 50%, rgba(30, 27, 75, 0.65) 100%)",
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 20% 30%, rgba(129, 140, 248, 0.35) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(16, 185, 129, 0.2) 0%, transparent 50%)",
                animation: "authGradientShift 15s ease infinite",
                backgroundSize: "200% 200%",
              }}
            />
            <div
              className="absolute inset-0 opacity-25"
              style={{
                background: "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.18) 0%, transparent 60%)",
              }}
            />
            <div className="relative flex h-full flex-col justify-between p-8">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{
                      background: "rgba(255,255,255,0.12)",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                    }}
                  >
                    <div
                      className="h-5 w-5 rounded-md"
                      style={{ background: "linear-gradient(135deg, #818cf8, #6366f1)" }}
                    />
                  </div>
                  <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
                    Конструктор бизнес-планов
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white leading-tight mb-3">Управляйте бизнесом эффективно</h2>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                  Создавайте бизнес-планы, управляйте финансами и задачами — всё в одном месте.
                </p>
              </div>
              <div className="space-y-4">
                {["Бизнес-планы с ИИ-помощником", "Финансовое моделирование", "Kanban и CRM-система"].map(
                  (feature, i) => (
                    <div
                      key={feature}
                      className="flex items-center gap-3 text-sm text-white/70"
                      style={{ animation: `authSlideInRight 0.4s ease-out ${0.6 + i * 0.1}s both` }}
                    >
                      <div
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                        style={{ background: "rgba(16, 185, 129, 0.2)", border: "1px solid rgba(16, 185, 129, 0.3)" }}
                      >
                        <Check size={10} style={{ color: "#34d399" }} />
                      </div>
                      {feature}
                    </div>
                  ),
                )}
              </div>
              <div className="pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                  © 2026 Конструктор бизнес-планов
                </p>
              </div>
            </div>
          </div>

          {/* Right form panel */}
          <div className="flex-1 p-6 sm:p-8">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold" style={{ color: "#f0eeff", animation: "fadeIn 0.3s ease-out" }}>
                  {tab === "login" ? "Добро пожаловать" : tab === "register" ? "Создать аккаунт" : "Сброс пароля"}
                </h3>
                <p className="mt-1 text-sm" style={{ color: "#6b7280", animation: "fadeIn 0.3s ease-out 0.1s both" }}>
                  {tab === "login"
                    ? "Войдите в свой аккаунт"
                    : tab === "register"
                      ? "Заполните данные для регистрации"
                      : "Введите email для получения ссылки"}
                </p>
              </div>
              <button
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                type="button"
                className="rounded-xl p-2.5 transition-all duration-200 hover:bg-white/5"
                style={{ color: "#6b7280" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            {tab !== "forgot" && (
              <div
                className="mb-6 flex rounded-2xl p-1"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {(["login", "register"] as const).map((t) => (
                  <button
                    key={t}
                    className="relative flex-1 rounded-xl py-2.5 text-sm font-medium transition-all duration-300"
                    style={{
                      color: tab === t ? "#f0eeff" : "#6b7280",
                      background: tab === t ? "rgba(99, 102, 241, 0.15)" : "transparent",
                    }}
                    onClick={() => setTab(t)}
                    type="button"
                  >
                    {tab === t && (
                      <div
                        className="absolute inset-0 rounded-xl"
                        style={{
                          background: "rgba(99, 102, 241, 0.1)",
                          boxShadow: "0 0 20px rgba(99, 102, 241, 0.1)",
                        }}
                      />
                    )}
                    <span className="relative z-10">{t === "login" ? "Вход" : "Регистрация"}</span>
                  </button>
                ))}
              </div>
            )}

            {tab === "forgot" && (
              <button
                className="mb-6 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm transition-all duration-200 hover:bg-white/5"
                style={{ color: "#818cf8" }}
                onClick={() => setTab("login")}
                type="button"
              >
                <ArrowLeft size={14} /> Назад ко входу
              </button>
            )}

            {/* Forms */}
            <div style={{ animation: "fadeIn 0.3s ease-out" }}>
              {tab === "login" && (
                <form className="space-y-4" onSubmit={handleLogin}>
                  <FloatingInput
                    icon={Mail}
                    label="Email или username"
                    value={loginForm.login}
                    onChange={(v) => setLoginForm((p) => ({ ...p, login: v }))}
                    error={loginErrors.login}
                    firstInput={firstInputRef as any}
                  />
                  <FloatingInput
                    icon={Lock}
                    label="Пароль"
                    value={loginForm.password}
                    onChange={(v) => setLoginForm((p) => ({ ...p, password: v }))}
                    type={showPass ? "text" : "password"}
                    error={loginErrors.password}
                    rightElement={
                      <button
                        type="button"
                        className="rounded-lg p-1.5 transition-colors duration-200 hover:bg-white/5"
                        style={{ color: "#6b7280" }}
                        onClick={() => setShowPass((p) => !p)}
                      >
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                  />

                  <button
                    type="button"
                    className="text-xs transition-colors duration-200 hover:text-indigo-400"
                    style={{ color: "#6b7280" }}
                    onClick={() => setTab("forgot")}
                  >
                    Забыли пароль?
                  </button>

                  <button
                    type="submit"
                    disabled={!loginValid || busy}
                    className="relative w-full overflow-hidden rounded-2xl py-3.5 text-sm font-semibold text-white transition-all duration-300 disabled:opacity-40 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98]"
                    style={{
                      background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                      boxShadow: busy ? "none" : "0 4px 20px rgba(99, 102, 241, 0.3)",
                    }}
                  >
                    {busy ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 size={16} className="animate-spin" /> Вход...
                      </span>
                    ) : (
                      "Войти"
                    )}
                    <div
                      className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500"
                      style={{
                        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
                        animation: busy ? "none" : "authButtonShine 3s ease-in-out infinite",
                      }}
                    />
                  </button>
                </form>
              )}

              {tab === "forgot" && (
                <form className="space-y-4" onSubmit={handleForgot}>
                  <FloatingInput
                    icon={Mail}
                    label="Email"
                    value={forgotEmail}
                    onChange={setForgotEmail}
                    type="email"
                    firstInput={firstInputRef as any}
                  />
                  <button
                    type="submit"
                    disabled={forgotBusy}
                    className="relative w-full overflow-hidden rounded-2xl py-3.5 text-sm font-semibold text-white transition-all duration-300 disabled:opacity-40 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98]"
                    style={{
                      background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                      boxShadow: forgotBusy ? "none" : "0 4px 20px rgba(99, 102, 241, 0.3)",
                    }}
                  >
                    {forgotBusy ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 size={16} className="animate-spin" /> Отправка...
                      </span>
                    ) : (
                      "Отправить ссылку"
                    )}
                  </button>
                </form>
              )}

              {tab === "register" && (
                <form className="space-y-3.5" onSubmit={handleRegister}>
                  <div className="grid grid-cols-2 gap-3">
                    <FloatingInput
                      icon={User}
                      label="Имя"
                      value={regForm.first_name}
                      onChange={(v) => setRegForm((p) => ({ ...p, first_name: v }))}
                      firstInput={firstInputRef as any}
                    />
                    <FloatingInput
                      icon={User}
                      label="Фамилия"
                      value={regForm.last_name}
                      onChange={(v) => setRegForm((p) => ({ ...p, last_name: v }))}
                    />
                  </div>
                  <FloatingInput
                    icon={Mail}
                    label="Email"
                    value={regForm.email}
                    onChange={(v) => setRegForm((p) => ({ ...p, email: v }))}
                    type="email"
                    error={regErrors.email}
                    isValid={!regErrors.email && regForm.email.length > 0}
                  />
                  <FloatingInput
                    icon={User}
                    label="Username"
                    value={regForm.username}
                    onChange={(v) => setRegForm((p) => ({ ...p, username: v }))}
                    error={regErrors.username}
                    isValid={!regErrors.username && regForm.username.length > 0}
                  />
                  <div>
                    <FloatingInput
                      icon={Lock}
                      label="Пароль"
                      value={regForm.password}
                      onChange={(v) => setRegForm((p) => ({ ...p, password: v }))}
                      type={showPass ? "text" : "password"}
                      error={regErrors.password}
                      rightElement={
                        <button
                          type="button"
                          className="rounded-lg p-1.5 transition-colors duration-200 hover:bg-white/5"
                          style={{ color: "#6b7280" }}
                          onClick={() => setShowPass((p) => !p)}
                        >
                          {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      }
                    />
                    <PasswordStrengthBar password={regForm.password} />
                  </div>
                  <FloatingInput
                    icon={Lock}
                    label="Подтвердите пароль"
                    value={regForm.confirm}
                    onChange={(v) => setRegForm((p) => ({ ...p, confirm: v }))}
                    type={showConfirm ? "text" : "password"}
                    error={regErrors.confirm}
                    isValid={!regErrors.confirm && regForm.confirm.length > 0}
                    rightElement={
                      <button
                        type="button"
                        className="rounded-lg p-1.5 transition-colors duration-200 hover:bg-white/5"
                        style={{ color: "#6b7280" }}
                        onClick={() => setShowConfirm((p) => !p)}
                      >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                  />

                  {/* Consent checkboxes */}
                  <div className="space-y-3 pt-1">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative mt-0.5">
                        <input
                          type="checkbox"
                          checked={consentProcessing}
                          onChange={(e) => setConsentProcessing(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div
                          className="h-4 w-4 rounded border transition-all duration-200 peer-checked:bg-indigo-500 peer-checked:border-indigo-500"
                          style={{
                            borderColor: consentProcessing ? "#6366f1" : "rgba(255,255,255,0.15)",
                            background: consentProcessing ? "#6366f1" : "transparent",
                          }}
                        >
                          {consentProcessing && (
                            <Check
                              size={10}
                              className="text-white"
                              style={{ animation: "authCheckPop 0.2s ease-out" }}
                            />
                          )}
                        </div>
                      </div>
                      <span className="text-[11px] leading-snug text-gray-400 group-hover:text-gray-300 transition-colors">
                        Даю согласие на обработку персональных данных в соответствии с{" "}
                        <Link
                          to="/privacy"
                          target="_blank"
                          className="underline font-medium text-indigo-400 hover:text-indigo-300"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Политикой конфиденциальности
                        </Link>
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative mt-0.5">
                        <input
                          type="checkbox"
                          checked={consentTerms}
                          onChange={(e) => setConsentTerms(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div
                          className="h-4 w-4 rounded border transition-all duration-200 peer-checked:bg-indigo-500 peer-checked:border-indigo-500"
                          style={{
                            borderColor: consentTerms ? "#6366f1" : "rgba(255,255,255,0.15)",
                            background: consentTerms ? "#6366f1" : "transparent",
                          }}
                        >
                          {consentTerms && (
                            <Check
                              size={10}
                              className="text-white"
                              style={{ animation: "authCheckPop 0.2s ease-out" }}
                            />
                          )}
                        </div>
                      </div>
                      <span className="text-[11px] leading-snug text-gray-400 group-hover:text-gray-300 transition-colors">
                        Ознакомлен и принимаю{" "}
                        <Link
                          to="/terms"
                          target="_blank"
                          className="underline font-medium text-indigo-400 hover:text-indigo-300"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Условия пользования
                        </Link>
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={!regValid || busy}
                    className="relative w-full overflow-hidden rounded-2xl py-3.5 text-sm font-semibold text-white transition-all duration-300 disabled:opacity-40 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98]"
                    style={{
                      background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                      boxShadow: busy ? "none" : "0 4px 20px rgba(99, 102, 241, 0.3)",
                    }}
                  >
                    {busy ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 size={16} className="animate-spin" /> Регистрация...
                      </span>
                    ) : (
                      "Зарегистрироваться"
                    )}
                    <div
                      className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500"
                      style={{
                        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
                        animation: busy ? "none" : "authButtonShine 3s ease-in-out infinite",
                      }}
                    />
                  </button>
                  <p className="text-center text-[10px] text-gray-500">
                    Регистрируясь, вы соглашаетесь с{" "}
                    <Link to="/privacy" target="_blank" className="underline text-indigo-400 hover:text-indigo-300">
                      Политикой конфиденциальности
                    </Link>{" "}
                    и{" "}
                    <Link to="/terms" target="_blank" className="underline text-indigo-400 hover:text-indigo-300">
                      Условиями пользования
                    </Link>
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
