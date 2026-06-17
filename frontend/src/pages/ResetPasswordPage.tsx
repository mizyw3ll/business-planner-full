import { useState, type FormEvent } from "react";
import { useSearchParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { resetPassword } from "../features/auth/authApi";
import { CheckCircle, XCircle, Loader2, Eye, EyeOff } from "lucide-react";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const token = searchParams.get("token");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) {
      setError("Ссылка не содержит токен сброса пароля.");
      return;
    }
    if (password !== confirm) {
      setError("Пароли не совпадают.");
      return;
    }
    if (password.length < 8) {
      setError("Пароль должен быть минимум 8 символов.");
      return;
    }

    const checks = [/[A-Z]/.test(password), /[a-z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)];
    if (checks.filter(Boolean).length < 3) {
      setError("Пароль слишком простой. Используйте заглавные, строчные, цифры и спецсимволы.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await resetPassword(token, password);
      setDone(true);
      toast.success("Пароль успешно изменен!");
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ||
        "Не удалось сменить пароль. Ссылка устарела.";
      setError(detail);
      toast.error("Ошибка сброса пароля");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div
        className="grid min-h-screen place-items-center px-4"
        style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
      >
        <div
          className="w-full max-w-md rounded-2xl border p-8 text-center"
          style={{ background: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}
        >
          <XCircle size={48} className="mx-auto text-rose-500" />
          <h1 className="mt-4 text-2xl font-semibold text-rose-500">Ошибка</h1>
          <p className="mt-2">Ссылка не содержит токен сброса пароля.</p>
          <Link
            to="/"
            className="mt-4 inline-block rounded-lg bg-white px-5 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-200"
          >
            На главную
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div
        className="grid min-h-screen place-items-center px-4"
        style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
      >
        <div
          className="w-full max-w-md rounded-2xl border p-8 text-center"
          style={{ background: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}
        >
          <CheckCircle size={48} className="mx-auto text-green-500" />
          <h1 className="mt-4 text-2xl font-semibold">Пароль изменен!</h1>
          <p className="mt-2">Теперь вы можете войти с новым паролем.</p>
          <Link
            to="/"
            className="mt-4 inline-block rounded-lg bg-white px-5 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-200"
          >
            На главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="grid min-h-screen place-items-center px-4"
      style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
    >
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl border p-8 space-y-4"
        style={{ background: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}
      >
        <h1 className="text-xl font-semibold">Сброс пароля</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Введите новый пароль для вашего аккаунта.
        </p>

        {error && <div className="rounded-lg bg-rose-500/10 p-3 text-sm text-rose-500">{error}</div>}

        <div className="relative">
          <input
            type={showPass ? "text" : "password"}
            placeholder="Новый пароль"
            className="w-full rounded-lg border px-3 py-2 outline-none"
            style={{
              background: "var(--bg-primary)",
              borderColor: "var(--border-secondary)",
              color: "var(--text-primary)",
            }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          <button
            type="button"
            onClick={() => setShowPass((p) => !p)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1"
            style={{ color: "var(--text-muted)" }}
          >
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <input
          type={showPass ? "text" : "password"}
          placeholder="Подтвердите пароль"
          className="w-full rounded-lg border px-3 py-2 outline-none"
          style={{
            background: "var(--bg-primary)",
            borderColor: "var(--border-secondary)",
            color: "var(--text-primary)",
          }}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-white py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Сохранение...
            </span>
          ) : (
            "Сохранить новый пароль"
          )}
        </button>
      </form>
    </div>
  );
}
