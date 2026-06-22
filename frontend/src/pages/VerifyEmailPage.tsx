import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { verifyEmail } from "../features/auth/authApi";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error"); // eslint-disable-line react-hooks/set-state-in-effect
      setMessage("Ссылка не содержит токен верификации.");
      return;
    }

    verifyEmail(token)
      .then(() => {
        setStatus("success");
        setMessage("Email успешно подтвержден!");
        toast.success("Email подтвержден!");
      })
      .catch((err) => {
        const detail =
          err.response?.data?.detail || "Не удалось подтвердить email. Ссылка устарела или недействительна.";
        setStatus("error");
        setMessage(detail);
        toast.error("Ошибка подтверждения email");
      });
  }, [searchParams]);

  return (
    <div
      className="grid min-h-screen place-items-center px-4"
      style={{ background: "var(--bg-page)", color: "var(--text-primary)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl border p-8 text-center"
        style={{
          background: "var(--bg-secondary)",
          borderColor: "var(--border-primary)",
        }}
      >
        {status === "loading" && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={40} className="animate-spin" style={{ color: "var(--text-muted)" }} />
            <p className="text-lg">Подтверждаем ваш email...</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Пожалуйста, не закрывайте страницу.
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle size={48} className="text-green-500" />
            <h1 className="text-2xl font-semibold">Успешно!</h1>
            <p>{message}</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Теперь вы можете войти в свой аккаунт.
            </p>
            <Link
              to="/"
              className="mt-2 rounded-lg bg-white px-5 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-200"
            >
              На главную
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-4">
            <XCircle size={48} className="text-rose-500" />
            <h1 className="text-2xl font-semibold text-rose-500">Ошибка</h1>
            <p>{message}</p>
            <div className="flex gap-3">
              <Link
                to="/"
                className="rounded-lg bg-white px-5 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-200"
              >
                На главную
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
