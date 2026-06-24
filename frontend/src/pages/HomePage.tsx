import { useEffect, useState, useRef } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import {
  Rocket,
  ArrowRight,
  BarChart3,
  Calendar,
  LayoutGrid,
  Briefcase,
} from "lucide-react";
import { useAuth } from "../features/auth/AuthContext";

const features = [
  {
    icon: Briefcase,
    title: "Бизнес-планы",
    desc: "Структурированные планы с ИИ-помощником. Заполнение блоков, формулировки, экспорт в PDF.",
    color: "#6366f1",
  },
  {
    icon: BarChart3,
    title: "Финансы",
    desc: "Интерактивные графики доходов и расходов. Прогноз рентабельности на несколько лет.",
    color: "#10b981",
  },
  {
    icon: LayoutGrid,
    title: "Задачи",
    desc: "Kanban-доски с drag-and-drop. Визуальный контроль прогресса по каждому проекту.",
    color: "#8b5cf6",
  },
  {
    icon: Calendar,
    title: "CRM",
    desc: "Контакты, сделки и воронка продаж. Управляйте взаимоотношениями в одном месте.",
    color: "#06b6d4",
  },
];

const steps = [
  { num: "01", title: "Регистрация", desc: "Аккаунт за 30 секунд. Только email и пароль." },
  { num: "02", title: "Настройка", desc: "Определите тип бизнеса и цели." },
  { num: "03", title: "Генерация", desc: "ИИ создаст структуру и рассчитает финансы." },
  { num: "04", title: "Запуск", desc: "Экспорт в PDF, sharing с партнёрами." },
];

function useInView(ref: React.RefObject<HTMLElement | null>, threshold = 0.1) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref, threshold]);
  return inView;
}

export function HomePage({ onOpenAuth }: { onOpenAuth: () => void }) {
  const { user } = useAuth();
  const statsRef = useRef<HTMLElement>(null);
  const stepsRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);
  const statsInView = useInView(statsRef);
  const stepsInView = useInView(stepsRef);
  const ctaInView = useInView(ctaRef);

  const [publicStats, setPublicStats] = useState<{ userCount: number; planCount: number } | null>(null);

  useEffect(() => {
    const CACHE_KEY = "public_stats_cache_v2";
    const CACHE_TTL = 86400000;
    localStorage.removeItem("public_stats_cache");

    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed?.data?.userCount != null && Date.now() - parsed.ts < CACHE_TTL) {
          setPublicStats(parsed.data);
          return;
        }
      } catch { /* ignore */ }
    }

    fetch("/api/public/stats")
      .then((r) => {
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
      })
      .then((data) => {
        const uc = typeof data.user_count === "number" ? data.user_count : 0;
        const pc = typeof data.plan_count === "number" ? data.plan_count : 0;
        const stats = { userCount: uc, planCount: pc };
        setPublicStats(stats);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: stats }));
      })
      .catch(() => {
        const fallback = { userCount: 10, planCount: 5 };
        setPublicStats(fallback);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: fallback }));
      });
  }, []);

  function roundStat(n: number | undefined): string {
    if (n == null || Number.isNaN(n) || n === 0) return "10+";
    const rounded = Math.round(n / 10) * 10;
    return `${Math.max(rounded, 1)}+`;
  }

  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  if (user) return <Navigate to={from || "/dashboard"} replace />;

  return (
    <main className="relative min-h-screen overflow-hidden" style={{ background: "#0a0a14" }}>
      {/* Subtle background */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99,102,241,0.06) 0%, transparent 60%)",
          }}
        />
      </div>

      {/* Navbar */}
      <nav className="fixed left-0 right-0 top-0 z-50" style={{ background: "rgba(10,10,20,0.9)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center gap-2.5 text-sm font-semibold text-white">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: "#6366f1" }}
            >
              <Rocket size={16} className="text-white" />
            </div>
            <span className="hidden sm:inline">Конструктор бизнес-планов</span>
          </Link>

          <div className="flex items-center gap-3">
            <a
              href="#how-it-works"
              className="hidden md:inline-flex rounded-lg px-3 py-2 text-sm text-gray-400 transition-colors hover:text-white"
            >
              Как работает
            </a>
            <button
              type="button"
              onClick={onOpenAuth}
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:text-white"
            >
              Войти
            </button>
            <button
              type="button"
              onClick={onOpenAuth}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.97]"
              style={{ background: "#6366f1" }}
            >
              Начать
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-24 pb-16">
        <div className="animate-fade-in max-w-3xl text-center">
          <h1 className="mb-5 text-4xl font-bold leading-tight tracking-tight text-white md:text-6xl lg:text-7xl">
            Бизнес-планы
            <br />
            <span style={{ color: "#818cf8" }}>с ИИ-помощником</span>
          </h1>
          <p className="mx-auto mb-10 max-w-xl text-base leading-relaxed md:text-lg" style={{ color: "#8b85b0 }}">
            Платформа для создания бизнес-планов, финансового моделирования и управления задачами.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onOpenAuth}
              className="group rounded-xl px-7 py-3.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97]"
              style={{ background: "#6366f1", boxShadow: "0 4px 24px rgba(99,102,241,0.35)" }}
            >
              <span className="flex items-center gap-2">
                Начать бесплатно
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative px-6" style={{ paddingBottom: "clamp(30px, 4vw, 60px)" }}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 md:mb-12 text-center">
            <h2 className="mb-3 text-2xl font-bold text-white md:text-4xl">Всё что нужно</h2>
            <p style={{ color: "#6b6590" }}>Четыре инструмента в одной платформе</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="group rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  animation: `fadeSlideUp 0.5s ease-out ${i * 0.08}s both`,
                }}
              >
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `${f.color}15`, border: `1px solid ${f.color}25` }}
                >
                  <f.icon size={22} style={{ color: f.color }} />
                </div>
                <h3 className="mb-2 text-base font-semibold text-white">{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#7a749e" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section ref={statsRef} className="relative px-6" style={{ paddingBottom: "clamp(30px, 4vw, 60px)" }}>
        <div className="mx-auto max-w-3xl">
          <div
            className="grid grid-cols-2 gap-6"
            style={{
              opacity: statsInView ? 1 : 0,
              transform: statsInView ? "none" : "translateY(16px)",
              transition: "all 0.5s ease-out",
            }}
          >
            <div className="rounded-2xl p-6 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="mb-1 text-3xl font-bold text-white md:text-4xl">
                {publicStats ? roundStat(publicStats.userCount) : "\u2014"}
              </div>
              <div className="text-sm" style={{ color: "#818cf8" }}>Пользователей</div>
            </div>
            <div className="rounded-2xl p-6 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="mb-1 text-3xl font-bold text-white md:text-4xl">
                {publicStats ? roundStat(publicStats.planCount) : "\u2014"}
              </div>
              <div className="text-sm" style={{ color: "#34d399" }}>Создано планов</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" ref={stepsRef} className="relative px-6" style={{ paddingBottom: "clamp(30px, 4vw, 60px)" }}>
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 md:mb-12 text-center">
            <h2 className="mb-3 text-2xl font-bold text-white md:text-4xl">Как это работает</h2>
            <p style={{ color: "#6b6590" }}>Четыре шага от регистрации до готового плана</p>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {steps.map((step, i) => (
              <div
                key={step.num}
                style={{
                  opacity: stepsInView ? 1 : 0,
                  transform: stepsInView ? "none" : "translateY(16px)",
                  transition: `all 0.5s ease-out ${i * 0.1}s`,
                }}
              >
                <div className="rounded-2xl p-5 text-center transition-all duration-300 hover:-translate-y-1" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="mb-3 text-xs font-bold tracking-widest" style={{ color: "#6366f1" }}>
                    {step.num}
                  </div>
                  <h3 className="mb-1.5 text-sm font-semibold text-white">{step.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "#7a749e" }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section ref={ctaRef} className="relative px-6" style={{ paddingBottom: "clamp(30px, 4vw, 60px)" }}>
        <div className="mx-auto max-w-2xl text-center">
          <div
            style={{
              opacity: ctaInView ? 1 : 0,
              transform: ctaInView ? "none" : "translateY(16px)",
              transition: "all 0.5s ease-out",
            }}
          >
            <h2 className="mb-3 text-2xl font-bold text-white md:text-4xl">Готовы начать?</h2>
            <p className="mx-auto mb-8 max-w-md" style={{ color: "#8b85b0" }}>
              Присоединяйтесь к предпринимателям, которые уже создают бизнес-планы
            </p>
            <button
              type="button"
              onClick={onOpenAuth}
              className="rounded-xl px-8 py-3.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.97]"
              style={{ background: "#6366f1", boxShadow: "0 4px 24px rgba(99,102,241,0.35)" }}
            >
              Создать аккаунт бесплатно
            </button>
            <p className="mt-3 text-xs" style={{ color: "#4a4570" }}>Без кредитной карты</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative px-6 pt-8" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingBottom: "clamp(30px, 4vw, 60px)" }}>
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="flex h-6 w-6 items-center justify-center rounded" style={{ background: "#6366f1" }}>
              <Rocket size={12} className="text-white" />
            </div>
            <span>Конструктор бизнес-планов</span>
          </div>
          <div className="flex gap-5 text-xs" style={{ color: "#555080" }}>
            <Link to="/privacy" className="transition-colors hover:text-white">Конфиденциальность</Link>
            <Link to="/terms" className="transition-colors hover:text-white">Соглашение</Link>
            <Link to="/cookie-policy" className="transition-colors hover:text-white">Cookie</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
