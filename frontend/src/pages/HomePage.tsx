import { useEffect, useState, useRef, useCallback } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  FileText,
  Users,
  Sparkles,
  Zap,
  ChevronRight,
  Rocket,
  ArrowRight,
  ArrowLeft,
  Play,
  Pause,
  BarChart3,
  Brain,
  Globe,
} from "lucide-react";
import { useAuth } from "../features/auth/AuthContext";

const slides = [
  {
    title: "Бизнес-планы с ИИ",
    desc: "Искусственный интеллект помогает создавать структуру плана, заполнять блоки и улучшать текст. Вы получаете профессиональный документ за минуты.",
    badge: "ИИ-помощник",
    color: "#6366f1",
    mockupType: "ai" as const,
  },
  {
    title: "Финансовое моделирование",
    desc: "Интерактивные графики доходов и расходов. Автоматический расчёт рентабельности и прогноз на несколько лет вперёд.",
    badge: "Графики",
    color: "#10b981",
    mockupType: "finance" as const,
  },
  {
    title: "CRM и воронка продаж",
    desc: "Управляйте контактами, отслеживайте сделки и визуализируйте воронку продаж в одном месте.",
    badge: "CRM",
    color: "#06b6d4",
    mockupType: "crm" as const,
  },
  {
    title: "Kanban-доски",
    desc: "Организуйте задачи с drag-and-drop. Наглядно отслеживайте прогресс по каждому проекту.",
    badge: "Задачи",
    color: "#8b5cf6",
    mockupType: "kanban" as const,
  },
];

const howItWorks = [
  {
    num: "01",
    title: "Регистрация",
    desc: "Создайте аккаунт за 30 секунд. Нужен только email и пароль.",
    icon: Rocket,
    color: "#6366f1",
  },
  {
    num: "02",
    title: "Настройка",
    desc: "Определите тип бизнеса, целевую аудиторию и финансовые цели.",
    icon: BarChart3,
    color: "#10b981",
  },
  {
    num: "03",
    title: "Генерация",
    desc: "ИИ создаст структуру плана, подскажет формулировки и рассчитает финансы.",
    icon: Brain,
    color: "#8b5cf6",
  },
  {
    num: "04",
    title: "Запуск",
    desc: "Экспортируйте в PDF, поделитесь с партнёрами или начните действовать.",
    icon: Globe,
    color: "#f59e0b",
  },
];

function SlideMockup({ type }: { type: string }) {
  if (type === "ai") {
    return (
      <div
        className="overflow-hidden rounded-xl border"
        style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(99,102,241,0.05)" }}
      >
        <div
          className="flex items-center gap-2 border-b px-4 py-2"
          style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
        >
          <Sparkles size={12} style={{ color: "#818cf8" }} />
          <span className="text-xs" style={{ color: "#818cf8" }}>
            ИИ-помощник
          </span>
        </div>
        <div className="space-y-3 p-4">
          <div className="flex gap-2">
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
              style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
            >
              <Brain size={12} className="text-white" />
            </div>
            <div
              className="rounded-xl rounded-tl-sm px-3 py-2 text-xs"
              style={{ background: "rgba(99,102,241,0.12)", color: "#c7d2fe" }}
            >
              Создайте структуру бизнес-плана для интернет-магазина
            </div>
          </div>
          <div className="flex gap-2">
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
              style={{ background: "rgba(99,102,241,0.2)" }}
            >
              <div className="h-2 w-2 rounded-full" style={{ background: "#34d399" }} />
            </div>
            <div
              className="space-y-2 rounded-xl rounded-tl-sm px-3 py-2 text-xs"
              style={{ background: "rgba(255,255,255,0.04)", color: "#9994c0" }}
            >
              <div>Готово! Вот структура:</div>
              <div className="space-y-1">
                {["Резюме", "Анализ рынка", "Маркетинг", "Финансы", "Риски"].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 rounded-lg px-2 py-1"
                    style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.1)" }}
                  >
                    <ChevronRight size={10} style={{ color: "#818cf8" }} />
                    <span style={{ color: "#e0dcf0" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex animate-pulse gap-1 self-start px-2">
            <div className="h-1.5 w-1.5 rounded-full" style={{ background: "#6366f1" }} />
            <div className="h-1.5 w-1.5 rounded-full" style={{ background: "#818cf8", animationDelay: "0.2s" }} />
            <div className="h-1.5 w-1.5 rounded-full" style={{ background: "#a5b4fc", animationDelay: "0.4s" }} />
          </div>
        </div>
      </div>
    );
  }
  const src = `/screenshots/${type}.png`;
  return (
    <div className="overflow-hidden rounded-xl border" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
      <img src={src} alt={type} className="w-full h-auto" />
    </div>
  );
}

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
  const sliderRef = useRef<HTMLElement>(null);
  const statsInView = useInView(statsRef);
  const stepsInView = useInView(stepsRef);
  const ctaInView = useInView(ctaRef);
  const sliderInView = useInView(sliderRef);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [publicStats, setPublicStats] = useState<{ userCount: number; planCount: number } | null>(null);

  const nextSlide = useCallback(() => {
    setCurrentSlide((p) => (p + 1) % slides.length);
  }, []);
  const prevSlide = useCallback(() => {
    setCurrentSlide((p) => (p - 1 + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    intervalRef.current = setInterval(nextSlide, 4000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, nextSlide]);

  // Fetch public stats with daily cache
  useEffect(() => {
    const CACHE_KEY = "public_stats_cache_v2";
    const CACHE_TTL = 86400000; // 24 hours

    // Clear old cache key
    localStorage.removeItem("public_stats_cache");

    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed?.data?.userCount != null && Date.now() - parsed.ts < CACHE_TTL) {
          setPublicStats(parsed.data);
          return;
        }
      } catch {
        /* ignore */
      }
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
        // API unavailable — use hardcoded defaults so stats always show numbers
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

  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <main className="relative min-h-screen overflow-hidden" style={{ background: "#070515" }}>
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div data-visual="aurora" className="aurora-orb aurora-orb-1" />
        <div data-visual="aurora" className="aurora-orb aurora-orb-2" />
        <div data-visual="aurora" className="aurora-orb aurora-orb-3" />
        <div data-visual="aurora" className="aurora-orb aurora-orb-4" />
        <div data-visual="aurora" className="aurora-orb aurora-orb-5" />
        <div data-visual="grid" className="aurora-grid" />
        <div data-visual="noise" className="aurora-noise" />
      </div>

      {/* Navbar */}
      <nav className="glass-nav fixed left-1/2 top-4 z-50 flex -translate-x-1/2 items-center gap-1 rounded-2xl px-2 py-2">
        <Link
          to="/"
          className="flex items-center gap-2.5 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/5"
        >
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              boxShadow: "0 2px 8px rgba(99,102,241,0.3)",
            }}
          >
            <Rocket size={14} className="text-white" />
          </div>
          <span className="hidden md:inline">Конструктор бизнес-планов</span>
        </Link>
        <div className="hidden md:block mx-1 h-5 w-px" style={{ background: "rgba(255,255,255,0.08)" }} />

        <a
          href="#how-it-works"
          className="hidden md:inline-flex rounded-xl px-3 py-2 text-sm text-gray-400 transition-all duration-200 hover:text-white hover:bg-white/5"
        >
          Как работает
        </a>
        <div className="hidden md:block mx-1 h-5 w-px" style={{ background: "rgba(255,255,255,0.08)" }} />
        <button
          type="button"
          onClick={onOpenAuth}
          className="hidden md:inline-flex rounded-xl px-4 py-2 text-sm font-medium text-gray-300 transition-all duration-200 hover:text-white hover:bg-white/5"
        >
          Войти
        </button>
        <button
          type="button"
          onClick={onOpenAuth}
          className="hidden md:inline-flex rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all duration-200"
          style={{
            background: "linear-gradient(135deg, #6366f1, #4f46e5)",
            boxShadow: "0 2px 12px rgba(99,102,241,0.35)",
          }}
        >
          Начать
        </button>
        {/* Mobile: only rocket icon + auth button */}
        <button
          type="button"
          onClick={onOpenAuth}
          className="md:hidden rounded-xl px-3 py-2 text-sm font-semibold text-white transition-all duration-200"
          style={{
            background: "linear-gradient(135deg, #6366f1, #4f46e5)",
            boxShadow: "0 2px 12px rgba(99,102,241,0.35)",
          }}
        >
          Начать
        </button>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-24 pb-16">
        <div
          className="mb-8 inline-flex items-center gap-2 rounded-full px-4 py-2"
          style={{
            background: "rgba(99,102,241,0.08)",
            border: "1px solid rgba(99,102,241,0.2)",
            animation: "hero-badge-pulse 4s ease-in-out infinite",
          }}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-sm text-gray-300">Новая версия с ИИ-помощником</span>
          <ChevronRight size={14} className="text-gray-500" />
        </div>

        <div className="animate-fade-in max-w-5xl text-center">
          <h1 className="mb-6 text-5xl font-extrabold leading-[1.08] tracking-tight md:text-7xl lg:text-[5.5rem]">
            <span className="text-white">Создавайте</span>
            <br />
            <span
              className="inline-block"
              style={{
                background: "linear-gradient(135deg, #a5b4fc 0%, #818cf8 20%, #6366f1 40%, #10b981 70%, #34d399 100%)",
                backgroundSize: "200% 200%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                animation: "hero-gradient 6s ease infinite",
                filter: "drop-shadow(0 0 30px rgba(99,102,241,0.3))",
              }}
            >
              бизнес-планы
            </span>
            <br />
            <span className="text-white">с ИИ</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed md:text-xl" style={{ color: "#9994c0" }}>
            Современная платформа для создания бизнес-планов, финансового моделирования, управления задачами и CRM — всё
            в одном месте с искусственным интеллектом.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={onOpenAuth}
              className="group relative overflow-hidden rounded-2xl px-8 py-4 text-base font-semibold text-white transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                boxShadow: "0 4px 24px rgba(99,102,241,0.4), 0 0 0 1px rgba(255,255,255,0.1) inset",
              }}
            >
              <span className="relative z-10 flex items-center gap-2">
                <Sparkles size={18} />
                Начать бесплатно
              </span>
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: "linear-gradient(135deg, #818cf8 0%, #6366f1 100%)" }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
                  animation: "shimmer-line 3s ease-in-out infinite",
                }}
              />
            </button>
            <a
              href="#demo"
              className="group flex items-center gap-2 rounded-2xl px-8 py-4 text-base font-medium text-gray-300 transition-all duration-300 hover:text-white hover:-translate-y-0.5 active:scale-[0.97]"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(8px)",
              }}
            >
              <Play size={18} />
              Смотреть демо
            </a>
          </div>
        </div>
      </section>

      {/* Slider Section */}
      <section id="demo" ref={sliderRef} className="relative py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <div
              className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
              style={{
                background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.2)",
                color: "#34d399",
              }}
            >
              <Play size={12} />
              Демонстрация
            </div>
            <h2 className="mb-4 text-3xl font-bold text-white md:text-5xl">Увидьте возможности</h2>
            <p className="mx-auto max-w-xl" style={{ color: "#7e78a8" }}>
              Интерактивный обзор ключевых функций платформы
            </p>
          </div>
          <div
            className="relative"
            style={{
              animation: sliderInView ? "card-entrance 0.6s ease-out forwards" : "none",
              opacity: sliderInView ? 1 : 0,
            }}
          >
            <div
              className="relative overflow-hidden rounded-3xl"
              style={{
                background: "rgba(12, 10, 30, 0.7)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                boxShadow: "0 24px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              <div className="grid md:grid-cols-2">
                <div className="p-8 md:p-12">
                  <div
                    className="mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
                    style={{
                      background: `${slides[currentSlide].color}15`,
                      color: slides[currentSlide].color,
                      border: `1px solid ${slides[currentSlide].color}30`,
                    }}
                  >
                    {slides[currentSlide].badge}
                  </div>
                  <h3 className="mb-4 text-2xl font-bold text-white md:text-3xl">{slides[currentSlide].title}</h3>
                  <p className="leading-relaxed" style={{ color: "#8b8bb0" }}>
                    {slides[currentSlide].desc}
                  </p>
                </div>
                <div
                  className="flex items-center justify-center p-8"
                  style={{ background: "rgba(255,255,255,0.02)", borderLeft: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <div className="w-full max-w-sm">
                    <SlideMockup type={slides[currentSlide].mockupType} />
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={prevSlide}
                className="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#6b7280",
                }}
              >
                <ArrowLeft size={16} />
              </button>
              <div className="flex gap-2">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentSlide(i)}
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: i === currentSlide ? "32px" : "8px",
                      background: i === currentSlide ? slides[currentSlide].color : "rgba(255,255,255,0.12)",
                    }}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={nextSlide}
                className="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#6b7280",
                }}
              >
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: isPlaying ? "#818cf8" : "#6b7280",
                }}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section ref={statsRef} className="relative py-24 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <div
              className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
              style={{
                background: "rgba(99,102,241,0.08)",
                border: "1px solid rgba(99,102,241,0.2)",
                color: "#818cf8",
              }}
            >
              <BarChart3 size={12} />
              Статистика
            </div>
            <h2 className="mb-4 text-3xl font-bold text-white md:text-5xl">Растём вместе с вами</h2>
            <p className="mx-auto max-w-xl" style={{ color: "#7e78a8" }}>
              Каждый день к нам присоединяются новые предприниматели
            </p>
          </div>
          <div
            className="grid gap-8 md:grid-cols-2"
            style={{
              animation: statsInView ? "card-entrance 0.6s ease-out forwards" : "none",
              opacity: statsInView ? 1 : 0,
            }}
          >
            <div className="glass-card group relative overflow-hidden rounded-2xl p-8 text-center transition-all duration-500 hover:-translate-y-1">
              <div
                className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: "radial-gradient(circle at 50% 0%, rgba(99,102,241,0.12), transparent 70%)" }}
              />
              <div className="relative">
                <div
                  className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
                  style={{
                    background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.05))",
                    border: "1px solid rgba(99,102,241,0.2)",
                  }}
                >
                  <Users size={28} className="text-indigo-400" />
                </div>
                <div className="mb-2 text-5xl font-bold text-white">
                  {publicStats ? roundStat(publicStats.userCount) : "—"}
                </div>
                <p className="text-sm font-medium" style={{ color: "#818cf8" }}>
                  Пользователей
                </p>
                <p className="mt-3 text-xs" style={{ color: "#555080" }}>
                  Предпринимателей и экспертов
                </p>
              </div>
            </div>
            <div className="glass-card group relative overflow-hidden rounded-2xl p-8 text-center transition-all duration-500 hover:-translate-y-1">
              <div
                className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: "radial-gradient(circle at 50% 0%, rgba(16,185,129,0.12), transparent 70%)" }}
              />
              <div className="relative">
                <div
                  className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
                  style={{
                    background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))",
                    border: "1px solid rgba(16,185,129,0.2)",
                  }}
                >
                  <FileText size={28} className="text-emerald-400" />
                </div>
                <div className="mb-2 text-5xl font-bold text-white">
                  {publicStats ? roundStat(publicStats.planCount) : "—"}
                </div>
                <p className="text-sm font-medium" style={{ color: "#34d399" }}>
                  Создано планов
                </p>
                <p className="mt-3 text-xs" style={{ color: "#555080" }}>
                  Бизнес-планов и финансовых моделей
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" ref={stepsRef} className="relative py-24 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <div
              className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
              style={{
                background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.2)",
                color: "#34d399",
              }}
            >
              <Zap size={12} />
              Как это работает
            </div>
            <h2 className="mb-4 text-3xl font-bold text-white md:text-5xl">Четыре шага к успеху</h2>
            <p className="mx-auto max-w-xl" style={{ color: "#7e78a8" }}>
              Начните за считанные минуты
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-4">
            {howItWorks.map((step, i) => (
              <div
                key={step.num}
                className="group relative"
                style={{
                  animation: stepsInView ? `card-entrance 0.6s ease-out ${i * 0.15}s both` : "none",
                  opacity: stepsInView ? 1 : 0,
                }}
              >
                {i < howItWorks.length - 1 && (
                  <div
                    className="absolute left-1/2 top-10 hidden h-px w-full md:block"
                    style={{ background: "linear-gradient(90deg, rgba(99,102,241,0.3), rgba(16,185,129,0.3))" }}
                  />
                )}
                <div className="glass-card relative overflow-hidden rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-1">
                  <div
                    className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{ background: `radial-gradient(circle at 50% 0%, ${step.color}15, transparent 70%)` }}
                  />
                  <div className="relative">
                    <div
                      className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110"
                      style={{
                        background: `linear-gradient(135deg, ${step.color}18, ${step.color}05)`,
                        border: `1px solid ${step.color}25`,
                        boxShadow: `0 4px 16px ${step.color}15`,
                      }}
                    >
                      <step.icon size={24} style={{ color: step.color }} />
                    </div>
                    <div className="mb-2 text-xs font-bold tracking-widest" style={{ color: step.color }}>
                      {step.num}
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-white">{step.title}</h3>
                    <p className="text-sm" style={{ color: "#8b8bb0" }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section ref={ctaRef} className="relative py-24 px-6">
        <div className="mx-auto max-w-4xl">
          <div
            className="glass-strong relative overflow-hidden rounded-3xl p-12 text-center md:p-16"
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(16,185,129,0.06) 100%)",
              animation: ctaInView ? "card-entrance 0.6s ease-out forwards" : "none",
              opacity: ctaInView ? 1 : 0,
            }}
          >
            <div
              className="absolute -top-24 -right-24 h-72 w-72 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)",
                filter: "blur(50px)",
              }}
            />
            <div
              className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)",
                filter: "blur(50px)",
              }}
            />
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")",
                backgroundRepeat: "repeat",
                backgroundSize: "256px 256px",
                mixBlendMode: "overlay",
                borderRadius: "inherit",
              }}
            />
            <div className="relative">
              <h2 className="mb-4 text-3xl font-bold text-white md:text-5xl">Готовы начать?</h2>
              <p className="mx-auto mb-8 max-w-lg" style={{ color: "#b8b3e0" }}>
                Присоединяйтесь к тысячам предпринимателей, которые уже создают бизнес-планы с помощью ИИ
              </p>
              <button
                type="button"
                onClick={onOpenAuth}
                className="group relative overflow-hidden rounded-2xl px-8 py-4 text-base font-semibold text-white transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.97]"
                style={{
                  background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                  boxShadow: "0 4px 24px rgba(99,102,241,0.4), 0 0 0 1px rgba(255,255,255,0.1) inset",
                }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Rocket size={18} />
                  Создать аккаунт бесплатно
                </span>
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "linear-gradient(135deg, #818cf8 0%, #6366f1 100%)" }}
                />
              </button>
              <p className="mt-4 text-xs" style={{ color: "#555080" }}>
                Без кредитной карты. Навсегда бесплатно.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative px-6 py-12" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="mx-auto max-w-6xl">
          {/* Top row */}
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                  boxShadow: "0 2px 8px rgba(99,102,241,0.3)",
                }}
              >
                <Rocket size={14} className="text-white" />
              </div>
              <span className="text-sm font-semibold text-white">Конструктор бизнес-планов</span>
            </div>
            <div className="flex gap-6 text-sm" style={{ color: "#555080" }}>
              <Link to="/privacy" className="transition-colors duration-200 hover:text-white">
                Политика конфиденциальности
              </Link>
              <Link to="/terms" className="transition-colors duration-200 hover:text-white">
                Пользовательское соглашение
              </Link>
              <Link to="/cookie-policy" className="transition-colors duration-200 hover:text-white">
                Политика cookie
              </Link>
            </div>
          </div>

          {/* Divider */}
          <div
            className="mt-5 mb-5 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(99,102,241,0.15), rgba(16,185,129,0.1), rgba(99,102,241,0.15), transparent)",
            }}
          />

          {/* Copyright */}
          <div className="text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <p className="text-xs" style={{ color: "#555080" }}>
              © 2026 Конструктор бизнес-планов · ИП Рыбкин Кирилл Александрович · ИНН 3525050141 · ОГРНИП 1033500045149
            </p>
            <p className="mt-1 text-xs" style={{ color: "#3d3860" }}>
              Юридический адрес: 160011, г. Вологда, ул. Первомайская, 42 · Email: business_planner@inbox.ru
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
