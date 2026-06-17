import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";

const STORAGE_KEY = "cookie_consent";

type CookiePreferences = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
};

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [prefs, setPrefs] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    setVisible(false);
  }

  function acceptAll() {
    const all = { necessary: true, analytics: true, marketing: true };
    setPrefs(all);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center p-4 sm:items-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={save} />

      <div
        className="relative w-full max-w-lg rounded-2xl border p-5 shadow-2xl animate-fade-in"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border-primary)",
          color: "var(--text-primary)",
        }}
      >
        <button
          type="button"
          onClick={save}
          className="absolute right-3 top-3 rounded-lg p-1 transition-colors hover:bg-[var(--bg-hover)]"
          style={{ color: "var(--text-muted)" }}
        >
          <X size={16} />
        </button>

        <h3 className="text-sm font-bold pr-6">Мы используем cookie</h3>
        <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Продолжая использовать сайт, вы соглашаетесь с обработкой cookie-файлов для обеспечения
          работоспособности сервиса, анализа трафика и персонализации контента. Подробнее — в{" "}
          <Link to="/cookie-policy" className="underline hover:opacity-80">
            Политике cookie
          </Link>.
        </p>

        {expanded && (
          <div className="mt-3 space-y-2">
            {([
              { key: "necessary", label: "Необходимые", desc: "Обеспечивают работу сайта" },
              { key: "analytics", label: "Аналитика", desc: "Помогают улучшить сервис" },
              { key: "marketing", label: "Маркетинг", desc: "Для показа релевантной рекламы" },
            ] as const).map((item) => (
              <label
                key={item.key}
                className="flex items-center gap-2.5 rounded-xl border px-3 py-2 cursor-pointer transition-colors hover:bg-[var(--bg-hover)]"
                style={{ borderColor: "var(--border-muted)" }}
              >
                <input
                  type="checkbox"
                  checked={prefs[item.key]}
                  disabled={item.key === "necessary"}
                  onChange={(e) =>
                    setPrefs((p) => ({ ...p, [item.key]: e.target.checked }))
                  }
                  className="h-4 w-4 rounded accent-indigo-500"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">{item.label}</p>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                    {item.desc}
                  </p>
                </div>
              </label>
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setExpanded((p) => !p);
            }}
            className="rounded-xl border px-3 py-2 text-xs font-semibold transition-colors hover:bg-[var(--bg-hover)]"
            style={{ borderColor: "var(--border-primary)", color: "var(--text-secondary)" }}
          >
            {expanded ? "Свернуть" : "Настройки"}
          </button>
          <button
            type="button"
            onClick={save}
            className="rounded-xl border px-3 py-2 text-xs font-semibold transition-colors hover:bg-[var(--bg-hover)]"
            style={{ borderColor: "var(--border-primary)", color: "var(--text-secondary)" }}
          >
            Только необходимые
          </button>
          <button
            type="button"
            onClick={acceptAll}
            className="ml-auto rounded-xl px-3 py-2 text-xs font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "var(--accent-primary)" }}
          >
            Принять все
          </button>
        </div>

        <p className="mt-2 text-center text-[10px]" style={{ color: "var(--text-muted)" }}>
          <Link to="/privacy" className="underline hover:opacity-80">
            Политика конфиденциальности
          </Link>{" "}
          ·{" "}
          <Link to="/terms" className="underline hover:opacity-80">
            Условия пользования
          </Link>
        </p>
      </div>
    </div>
  );
}
