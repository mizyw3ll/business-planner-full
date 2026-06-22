import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Search, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { createFinancialPlanApi } from "../api";
import { useCurrenciesQuery, useFinancialPlansQuery } from "../hooks/useCachedData";
import { queryKeys } from "../lib/queryClient";
import { inputStyle, buttonStyle, tw, v } from "../shared/theme";
import { getCurrencySymbol, getCurrencyRussianName } from "../shared/currency";
import { MarkdownPreview } from "../components/MarkdownPreview";
import { GlassCard } from "../shared/components/GlassCard";
import { RichTextEditor } from "../components/RichTextEditor";
import { useTheme } from "../features/theme/ThemeContext";
import { tiptapToText } from "../lib/tiptapToText";

type FormState = {
  title: string;
  description: string;
  descriptionDoc: object | null;
  currency_id: number;
  is_active: boolean;
};

const emptyForm: FormState = { title: "", description: "", descriptionDoc: null, currency_id: 0, is_active: true };

export function FinancialPlansPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const queryClient = useQueryClient();
  const { data: plans = [], isLoading: plansLoading, isError: plansError } = useFinancialPlansQuery();
  const { data: currencies = [], isLoading: currenciesLoading } = useCurrenciesQuery();
  const loading = plansLoading || currenciesLoading;
  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("title_asc");

  const filteredPlans = useMemo(() => {
    const list = plans.filter((p) => p.title.toLowerCase().includes(searchQuery.toLowerCase()));
    list.sort((a, b) => {
      if (sortBy === "title_asc") return a.title.localeCompare(b.title);
      if (sortBy === "title_desc") return b.title.localeCompare(a.title);
      if (sortBy === "created_at_asc") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return list;
  }, [plans, searchQuery, sortBy]);

  useEffect(() => {
    if (plansError) toast.error("Ошибка загрузки финансовых планов");
  }, [plansError]);

  const valid = useMemo(() => form.title.trim().length > 0 && form.currency_id > 0, [form]);

  async function submit() {
    if (!valid) return;
    try {
      const description = form.descriptionDoc ? tiptapToText(form.descriptionDoc).trim() : undefined;
      await createFinancialPlanApi({
        title: form.title,
        description: description || undefined,
        currency_id: form.currency_id,
        is_active: form.is_active,
      });
      toast.success("План создан");
      setOpenForm(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.financialPlans });
    } catch (err: any) {
      toast.error(err?.userMessage || "Ошибка сохранения финансового плана");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold" style={{ color: v("text-primary") }}>
          Финансовые планы
        </h1>
        <div className="flex items-center gap-2">
          <button
            className={`${tw.buttonPrimary} flex items-center gap-1.5`}
            style={buttonStyle("primary", isDark)}
            onClick={() => setOpenForm(true)}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.9";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
          >
            <Plus size={16} />
            <span className="hidden sm:inline whitespace-nowrap">Создать</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: v("text-tertiary") }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию..."
            className="w-full rounded-xl border py-2 pl-9 pr-3 text-sm"
            style={inputStyle(isDark)}
          />
        </div>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border px-3 py-2 pr-8 text-sm appearance-none cursor-pointer"
            style={{ background: v("bg-secondary"), borderColor: v("border-primary"), color: v("text-primary") }}
          >
            <option value="title_asc">По названию (А→Я)</option>
            <option value="title_desc">По названию (Я→А)</option>
            <option value="created_at_desc">Сначала новые</option>
            <option value="created_at_asc">Сначала старые</option>
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: v("text-muted") }}
          />
        </div>
      </div>

      {loading ? (
        <div className={tw.grid}>
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="skeleton-card h-44" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="text-center animate-fade-in">
            <p className="text-lg font-medium" style={{ color: v("text-primary") }}>
              У вас пока нет финансовых графиков
            </p>
            <p className="mt-2 text-sm" style={{ color: v("text-muted") }}>
              Создайте первый график для отслеживания доходов и расходов
            </p>
            <button
              className="mt-4 rounded-lg border px-4 py-2 text-sm transition-colors"
              style={buttonStyle("primary", isDark)}
              onClick={() => setOpenForm(true)}
            >
              Создать график
            </button>
          </div>
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <p className="text-sm" style={{ color: v("text-muted") }}>
            Ничего не найдено
          </p>
        </div>
      ) : (
        <div className={tw.grid}>
          {filteredPlans.map((plan) => {
            const cur = currencies.find((c) => c.id === plan.currency_id);
            const symbol = cur ? getCurrencySymbol(cur.code) : "$";
            return (
              <Link
                key={plan.id}
                to={`/financial-plans/${plan.id}`}
                className="animate-fade-in block min-w-0 h-full"
              >
                <GlassCard accent="emerald" className="h-full flex flex-col">
                  {/* Row 1: icon + title + status badge */}
                  <div className="flex items-center gap-3 pb-3 mb-3 border-b" style={{ borderColor: "var(--border-muted)" }}>
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold"
                      style={{ background: "rgba(16,185,129,0.12)", color: "#34d399" }}
                    >
                      {symbol}
                    </div>
                    <h2 className="flex-1 min-w-0 text-base font-semibold leading-tight truncate" style={{ color: v("text-primary") }}>
                      {plan.title}
                    </h2>
                    <span
                      className="shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-medium whitespace-nowrap"
                      style={
                        plan.is_active
                          ? { background: "rgba(34, 197, 94, 0.15)", color: "#16a34a" }
                          : { background: v("bg-active"), color: v("text-muted") }
                      }
                    >
                      {plan.is_active ? "Активен" : "Неактивен"}
                    </span>
                  </div>

                  {/* Row 2: description */}
                  <div className="flex-1 min-w-0">
                    <MarkdownPreview
                      content={plan.description || "Без описания"}
                      className="markdown-body-compact line-clamp-3 text-sm"
                    />
                  </div>

                  {/* Row 3: creation date */}
                  <div className="pt-3 mt-3 border-t" style={{ borderColor: "var(--border-muted)" }}>
                    <span className="text-xs" style={{ color: v("text-muted") }}>
                      {new Date(plan.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </GlassCard>
              </Link>
            );
          })}
        </div>
      )}

      {openForm && (
        <div className={tw.modalOverlay} style={{ background: "rgba(0,0,0,0.6)" }}>
          <div
            className={tw.modalContent}
            style={{
              background: v("bg-sidebar"),
              borderColor: v("border-primary"),
            }}
          >
            <h3 className="mb-3 text-lg font-semibold" style={{ color: v("text-primary") }}>
              Создать финансовый план
            </h3>
            <div className="space-y-3">
              <input
                className={tw.inputBase}
                style={inputStyle(isDark)}
                placeholder="Название"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              />
              {!form.title.trim() && form.title !== "" && (
                <p className="text-xs" style={{ color: "#ef4444" }}>
                  Название обязательно
                </p>
              )}
              <RichTextEditor
                content={form.descriptionDoc ?? { type: "doc", content: [] }}
                onChange={(doc) => setForm((p) => ({ ...p, descriptionDoc: doc }))}
                isDark={isDark}
                placeholder="Описание"
              />
              <select
                className={tw.inputBase}
                style={inputStyle(isDark)}
                value={form.currency_id}
                onChange={(e) => setForm((p) => ({ ...p, currency_id: Number(e.target.value) }))}
              >
                <option value={0}>Выберите валюту</option>
                {currencies.map((currency) => (
                  <option key={currency.id} value={currency.id}>
                    {getCurrencySymbol(currency.code)} — {getCurrencyRussianName(currency.code)}
                  </option>
                ))}
              </select>
              {form.currency_id === 0 && (
                <p className="text-xs" style={{ color: "#ef4444" }}>
                  Выберите валюту
                </p>
              )}
              <label className="flex items-center gap-2 text-sm" style={{ color: v("text-secondary") }}>
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                />
                Активный график
              </label>
              <div className="flex justify-end gap-2">
                <button
                  className={tw.buttonSecondary}
                  style={buttonStyle("secondary", isDark)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = v("bg-hover");
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                  onClick={() => setOpenForm(false)}
                >
                  Отмена
                </button>
                <button className={tw.buttonPrimary} disabled={!valid} onClick={() => void submit()}>
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
