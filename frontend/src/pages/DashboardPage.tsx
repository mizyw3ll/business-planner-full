import { Link } from "react-router-dom";
import { ScrollText, PiggyBank, FileText, BarChart3, Plus, ArrowRight, TrendingUp, Calendar } from "lucide-react";
import { v, tw } from "../shared/theme";
import { useDashboardQuery } from "../hooks/useCachedData";
import { AnimatedCounter } from "../shared/components/AnimatedCounter";
import { GlassCard } from "../shared/components/GlassCard";

export function DashboardPage() {
  const { data: dashboard, isLoading } = useDashboardQuery();

  if (isLoading) {
    return (
      <div className="space-y-8 p-6">
        <div className="h-10 w-64 skeleton rounded-2xl" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-card h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-8 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-card h-56 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const planCount = dashboard?.plan_count ?? 0;
  const chartCount = dashboard?.chart_count ?? 0;
  const noteCount = dashboard?.note_count ?? 0;
  const blockCount = dashboard?.block_count ?? 0;

  const stats = [
    { label: "Бизнес-планы", value: planCount, icon: ScrollText, accent: "indigo", iconColor: "#818cf8" },
    { label: "Финансовые графики", value: chartCount, icon: PiggyBank, accent: "emerald", iconColor: "#34d399" },
    { label: "Заметки", value: noteCount, icon: FileText, accent: "amber", iconColor: "#fbbf24" },
    { label: "Всего блоков", value: blockCount, icon: BarChart3, accent: "rose", iconColor: "#fb7185" },
  ];

  return (
    <div className={tw.pageContainer}>
      <div>
        <h1 className={tw.pageTitle} style={{ color: v("text-primary") }}>
          Дашборд
        </h1>
        <p className="mt-2 text-base font-medium" style={{ color: v("text-secondary") }}>
          Обзор ваших проектов и активности
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <div key={stat.label} className={`animate-fade-in stagger-${i + 1}`}>
            <GlassCard accent={stat.accent as "indigo" | "emerald" | "amber" | "rose"}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-4xl font-extrabold tracking-tight" style={{ color: v("text-primary") }}>
                    <AnimatedCounter value={stat.value} />
                  </div>
                  <p className="mt-2 text-sm font-semibold uppercase tracking-wider opacity-80" style={{ color: v("text-secondary") }}>
                    {stat.label}
                  </p>
                </div>
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg"
                  style={{ background: `${stat.iconColor}20`, border: `1px solid ${stat.iconColor}40` }}
                >
                  <stat.icon size={26} style={{ color: stat.iconColor }} />
                </div>
              </div>
            </GlassCard>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="animate-fade-in stagger-5">
        <div className="flex flex-wrap gap-4">
          <Link
            to="/business-plans"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-500/25 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-2xl active:scale-[0.96]"
          >
            <Plus size={18} /> Новый бизнес-план
          </Link>
          <Link
            to="/financial-plans"
            className="inline-flex items-center gap-2 rounded-2xl border-2 px-6 py-3.5 text-sm font-bold transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-indigo-500/10 active:scale-[0.96]"
            style={{ borderColor: v("border-primary"), color: v("text-primary") }}
          >
            <Plus size={18} /> Новый финансовый график
          </Link>
          <Link
            to="/notes"
            className="inline-flex items-center gap-2 rounded-2xl border-2 px-6 py-3.5 text-sm font-bold transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-indigo-500/10 active:scale-[0.96]"
            style={{ borderColor: v("border-primary"), color: v("text-primary") }}
          >
            <Plus size={18} /> Новая заметка
          </Link>
        </div>
      </div>

      {/* Recent Items */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Recent Plans */}
        <div className="animate-fade-in stagger-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2.5 text-xl font-bold" style={{ color: v("text-primary") }}>
              <div className="rounded-lg p-1.5" style={{ background: "rgba(129, 140, 248, 0.15)" }}>
                <ScrollText size={20} style={{ color: "#818cf8" }} />
              </div>
              Бизнес-планы
            </h2>
            <Link
              to="/business-plans"
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest transition-all duration-200 hover:text-indigo-400 hover:translate-x-1"
              style={{ color: v("text-muted") }}
            >
              Все <ArrowRight size={14} />
            </Link>
          </div>
          {dashboard?.recent_plans && dashboard.recent_plans.length > 0 ? (
            <div className="space-y-3">
              {dashboard.recent_plans.map(
                (plan: { id: number; title: string; block_count: number; created_at: string }, i: number) => (
                  <Link
                    key={plan.id}
                    to={`/business-plans/${plan.id}`}
                    className={`group block rounded-2xl border p-5 backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-2xl hover:border-indigo-500/50 animate-fade-in stagger-${
                      i + 1
                    }`}
                    style={{ background: v("bg-card"), borderColor: v("border-primary"), boxShadow: v("shadow-md") }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-bold truncate" style={{ color: v("text-primary") }}>
                          {plan.title}
                        </p>
                        <div className="mt-2 flex items-center gap-4">
                          <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider" style={{ background: "rgba(129, 140, 248, 0.15)", color: "#818cf8" }}>
                            {plan.block_count} блоков
                          </span>
                          <span className="text-xs font-medium" style={{ color: v("text-muted") }}>
                            <Calendar size={12} className="mr-1.5 inline opacity-70" />
                            {new Date(plan.created_at).toLocaleDateString("ru-RU")}
                          </span>
                        </div>
                      </div>
                      <div className="rounded-full p-1.5 transition-colors group-hover:bg-indigo-500/20">
                        <ArrowRight
                          size={18}
                          className="shrink-0 opacity-40 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1"
                          style={{ color: v("accent-primary") }}
                        />
                      </div>
                    </div>
                  </Link>
                ),
              )}
            </div>
          ) : (
            <GlassCard hover={false} className="h-48 justify-center border-dashed">
              <ScrollText size={32} className="mx-auto mb-3 opacity-20" style={{ color: v("text-muted") }} />
              <p className="text-sm font-semibold text-center" style={{ color: v("text-muted") }}>
                Нет бизнес-планов
              </p>
            </GlassCard>
          )}
        </div>

        {/* Recent Charts */}
        <div className="animate-fade-in stagger-7">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2.5 text-xl font-bold" style={{ color: v("text-primary") }}>
              <div className="rounded-lg p-1.5" style={{ background: "rgba(52, 211, 153, 0.15)" }}>
                <TrendingUp size={20} style={{ color: "#34d399" }} />
              </div>
              Фин. графики
            </h2>
            <Link
              to="/financial-plans"
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest transition-all duration-200 hover:text-emerald-400 hover:translate-x-1"
              style={{ color: v("text-muted") }}
            >
              Все <ArrowRight size={14} />
            </Link>
          </div>
          {dashboard?.recent_charts && dashboard.recent_charts.length > 0 ? (
            <div className="space-y-3">
              {dashboard.recent_charts.map(
                (chart: { id: number; title: string; point_count: number; created_at: string }, i: number) => (
                  <Link
                    key={chart.id}
                    to={`/financial-plans/${chart.id}`}
                    className={`group block rounded-2xl border p-5 backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-2xl hover:border-emerald-500/50 animate-fade-in stagger-${
                      i + 1
                    }`}
                    style={{ background: v("bg-card"), borderColor: v("border-primary"), boxShadow: v("shadow-md") }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-bold truncate" style={{ color: v("text-primary") }}>
                          {chart.title}
                        </p>
                        <div className="mt-2 flex items-center gap-4">
                          <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider" style={{ background: "rgba(52, 211, 153, 0.15)", color: "#34d399" }}>
                            {chart.point_count} точек
                          </span>
                          <span className="text-xs font-medium" style={{ color: v("text-muted") }}>
                            <Calendar size={12} className="mr-1.5 inline opacity-70" />
                            {new Date(chart.created_at).toLocaleDateString("ru-RU")}
                          </span>
                        </div>
                      </div>
                      <div className="rounded-full p-1.5 transition-colors group-hover:bg-emerald-500/20">
                        <ArrowRight
                          size={18}
                          className="shrink-0 opacity-40 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1"
                          style={{ color: "#34d399" }}
                        />
                      </div>
                    </div>
                  </Link>
                ),
              )}
            </div>
          ) : (
            <GlassCard hover={false} className="h-48 justify-center border-dashed">
              <TrendingUp size={32} className="mx-auto mb-3 opacity-20" style={{ color: v("text-muted") }} />
              <p className="text-sm font-semibold text-center" style={{ color: v("text-muted") }}>
                Нет финансовых графиков
              </p>
            </GlassCard>
          )}
        </div>

        {/* Recent Notes */}
        <div className="animate-fade-in stagger-8">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2.5 text-xl font-bold" style={{ color: v("text-primary") }}>
              <div className="rounded-lg p-1.5" style={{ background: "rgba(251, 191, 36, 0.15)" }}>
                <FileText size={20} style={{ color: "#fbbf24" }} />
              </div>
              Заметки
            </h2>
            <Link
              to="/notes"
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest transition-all duration-200 hover:text-amber-400 hover:translate-x-1"
              style={{ color: v("text-muted") }}
            >
              Все <ArrowRight size={14} />
            </Link>
          </div>
          {dashboard?.recent_notes && dashboard.recent_notes.length > 0 ? (
            <div className="space-y-3">
              {dashboard.recent_notes.map((note: { id: number; title: string; created_at: string }, i: number) => (
                <Link
                  key={note.id}
                  to="/notes"
                  className={`group block rounded-2xl border p-5 backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-2xl hover:border-amber-500/50 animate-fade-in stagger-${
                    i + 1
                  }`}
                  style={{ background: v("bg-card"), borderColor: v("border-primary"), boxShadow: v("shadow-md") }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-bold truncate" style={{ color: v("text-primary") }}>
                        {note.title}
                      </p>
                      <div className="mt-2">
                        <span className="text-xs font-medium" style={{ color: v("text-muted") }}>
                          <Calendar size={12} className="mr-1.5 inline opacity-70" />
                          {new Date(note.created_at).toLocaleDateString("ru-RU")}
                        </span>
                      </div>
                    </div>
                    <div className="rounded-full p-1.5 transition-colors group-hover:bg-amber-500/20">
                      <ArrowRight
                        size={18}
                        className="shrink-0 opacity-40 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1"
                        style={{ color: "#fbbf24" }}
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <GlassCard hover={false} className="h-48 justify-center border-dashed">
              <FileText size={32} className="mx-auto mb-3 opacity-20" style={{ color: v("text-muted") }} />
              <p className="text-sm font-semibold text-center" style={{ color: v("text-muted") }}>
                Нет заметок
              </p>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
