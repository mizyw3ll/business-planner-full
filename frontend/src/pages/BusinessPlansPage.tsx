import { useEffect, useMemo, useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, LayoutTemplate, Loader2, Upload, Search, ChevronDown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ru } from "../i18n/ru";
import {
  createBusinessPlanApi,
  getTemplatesApi,
  createPlanFromTemplateApi,
  importBusinessPlanApi,
  type Template,
} from "../api";
import { inputStyle, buttonStyle, tw, v } from "../shared/theme";
import { MarkdownPreview } from "../components/MarkdownPreview";
import { GlassCard } from "../shared/components/GlassCard";
import { RichTextEditor } from "../components/RichTextEditor";
import { useTheme } from "../features/theme/ThemeContext";
import { useBusinessPlansQuery } from "../hooks/useCachedData";
import { queryKeys } from "../lib/queryClient";
import { tiptapToText } from "../lib/tiptapToText";

type FormState = {
  title: string;
  description: string;
  descriptionDoc: object | null;
};

const emptyForm: FormState = { title: "", description: "", descriptionDoc: null };

export function BusinessPlansPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === "dark";
  const queryClient = useQueryClient();
  const { data: plans = [], isLoading: loading, isError: plansError } = useBusinessPlansQuery();
  const [openForm, setOpenForm] = useState(false);
  const [openTemplates, setOpenTemplates] = useState(false);
  const [openImport, setOpenImport] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<string | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("created_at_desc");

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
    if (plansError) toast.error(ru.toasts.plansLoadError);
  }, [plansError]);

  const valid = useMemo(() => form.title.trim().length > 0, [form.title]);

  function startCreate() {
    setForm(emptyForm);
    setOpenForm(true);
  }

  async function submit() {
    if (!valid) return;
    try {
      const description = form.descriptionDoc ? tiptapToText(form.descriptionDoc).trim() : undefined;
      await createBusinessPlanApi({ title: form.title, description: description || undefined });
      toast.success(ru.toasts.planCreated);
      setOpenForm(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.businessPlans });
    } catch (err: any) {
      toast.error(err?.userMessage || ru.toasts.planSaveError);
    }
  }

  async function loadTemplates(category?: string | null) {
    try {
      setTemplatesLoading(true);
      const data = await getTemplatesApi(category || undefined);
      setTemplates(data);
    } catch (err: any) {
      toast.error(err?.userMessage || ru.toasts.templatesLoadError);
    } finally {
      setTemplatesLoading(false);
    }
  }

  async function handleUseTemplate(templateId: number) {
    try {
      setTemplatesLoading(true);
      await createPlanFromTemplateApi(templateId);
      toast.success(ru.toasts.planFromTemplate);
      setOpenTemplates(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.businessPlans });
    } catch (err: any) {
      toast.error(err?.userMessage || ru.toasts.planFromTemplateError);
    } finally {
      setTemplatesLoading(false);
    }
  }

  async function handleImport(file: File) {
    try {
      setImportLoading(true);
      const importedPlan = await importBusinessPlanApi(file);
      toast.success(ru.toasts.planImported);
      setOpenImport(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.businessPlans });
      navigate(`/business-plans/${importedPlan.id}`);
    } catch (err: any) {
      toast.error(err?.userMessage || ru.toasts.planImportError);
    } finally {
      setImportLoading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && !importLoading) void handleImport(file);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold" style={{ color: v("text-primary") }}>
          Бизнес-планы
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpenImport(true)}
            className={`${tw.buttonSecondary} flex items-center gap-1.5`}
            style={{ borderColor: v("border-secondary"), color: v("text-secondary") }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = v("bg-hover");
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <Upload size={16} />
            <span className="hidden sm:inline whitespace-nowrap">Импорт</span>
          </button>
          <button
            onClick={() => {
              setOpenTemplates(true);
              setTemplateCategoryFilter(null);
              void loadTemplates();
            }}
            className={`${tw.buttonSecondary} flex items-center gap-1.5`}
            style={{ borderColor: v("border-secondary"), color: v("text-secondary") }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = v("bg-hover");
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <LayoutTemplate size={16} />
            <span className="hidden sm:inline whitespace-nowrap">Из шаблона</span>
          </button>
          <button
            onClick={startCreate}
            className={`${tw.buttonPrimary} flex items-center gap-1.5`}
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)",
              color: "#ffffff",
              boxShadow: "0 2px 10px rgba(99, 102, 241, 0.3)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(99, 102, 241, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 10px rgba(99, 102, 241, 0.3)";
            }}
          >
            <Plus size={16} />
            <span className="hidden sm:inline whitespace-nowrap">Создать</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <div className="relative flex-1 max-w-xs w-full sm:w-auto">
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
            <option value="created_at_desc">Сначала новые</option>
            <option value="created_at_asc">Сначала старые</option>
            <option value="title_asc">По названию (А→Я)</option>
            <option value="title_desc">По названию (Я→А)</option>
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
              У вас пока нет бизнес-планов
            </p>
            <p className="mt-2 text-sm" style={{ color: v("text-muted") }}>
              Создайте первый план, чтобы начать работу
            </p>
            <button
              className="mt-4 rounded-lg border px-4 py-2 text-sm transition-colors"
              style={buttonStyle("primary", isDark)}
              onClick={() => setOpenForm(true)}
            >
              Создать план
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
          {filteredPlans.map((plan) => (
            <Link
              key={plan.id}
              to={`/business-plans/${plan.id}`}
              className="animate-fade-in block min-w-0 h-full"
            >
              <GlassCard accent="indigo" className="h-full flex flex-col">
                {/* Row 1: icon + title */}
                <div className="flex items-center gap-3 pb-3 mb-3 border-b" style={{ borderColor: "var(--border-muted)" }}>
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: "rgba(99,102,241,0.12)" }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#818cf8"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </div>
                  <h2 className="flex-1 min-w-0 text-base font-semibold leading-tight truncate" style={{ color: v("text-primary") }}>
                    {plan.title}
                  </h2>
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
          ))}
        </div>
      )}

      {/* Create modal */}
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
              Создать план
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

      {/* Templates modal */}
      {openTemplates && (
        <div className={tw.modalOverlay} style={{ background: "rgba(0,0,0,0.6)" }}>
          <div
            className="w-full max-h-[90vh] overflow-y-auto rounded-2xl border p-4 sm:max-w-2xl sm:p-5"
            style={{
              background: v("bg-sidebar"),
              borderColor: v("border-primary"),
            }}
          >
            <h3 className="mb-3 text-lg font-semibold" style={{ color: v("text-primary") }}>
              Выберите шаблон
            </h3>
            {templatesLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="animate-spin" size={32} style={{ color: v("text-muted") }} />
              </div>
            ) : (
              <>
                <div className="mb-3 flex flex-wrap gap-2">
                  {[...new Set(templates.map((t) => t.category))].map((cat) => (
                    <button
                      key={cat}
                      className={`rounded-full border px-3 py-1 text-xs transition ${
                        templateCategoryFilter === cat ? "font-semibold" : ""
                      }`}
                      style={{
                        borderColor: templateCategoryFilter === cat ? v("text-primary") : v("border-secondary"),
                        color: templateCategoryFilter === cat ? v("text-primary") : v("text-secondary"),
                        background: templateCategoryFilter === cat ? v("bg-hover") : "transparent",
                      }}
                      onClick={() => {
                        const next = templateCategoryFilter === cat ? null : cat;
                        setTemplateCategoryFilter(next);
                        void loadTemplates(next);
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(templateCategoryFilter
                    ? templates.filter((t) => t.category === templateCategoryFilter)
                    : templates
                  ).map((t) => (
                    <button
                      key={t.id}
                      className="rounded-xl border p-4 text-left transition hover:opacity-90"
                      style={{ borderColor: v("border-primary"), background: v("bg-primary") }}
                      onClick={() => void handleUseTemplate(t.id)}
                    >
                      <p className="text-sm font-semibold capitalize" style={{ color: v("text-primary") }}>
                        {t.title}
                      </p>
                      <p className="mt-1 text-xs" style={{ color: v("text-muted") }}>
                        {t.description || "Без описания"}
                      </p>
                      <p
                        className="mt-2 text-xs font-medium uppercase tracking-wide"
                        style={{ color: v("text-secondary") }}
                      >
                        {t.category}
                      </p>
                    </button>
                  ))}
                </div>
              </>
            )}
            <div className="mt-4 flex justify-end">
              <button
                className={tw.buttonSecondary}
                style={buttonStyle("secondary", isDark)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = v("bg-hover");
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
                onClick={() => setOpenTemplates(false)}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import modal */}
      {openImport && (
        <div className={tw.modalOverlay} style={{ background: "rgba(0,0,0,0.6)" }}>
          <div
            className="w-full max-h-[90vh] overflow-y-auto rounded-2xl border p-4 sm:max-w-lg sm:p-5"
            style={{
              background: v("bg-sidebar"),
              borderColor: v("border-primary"),
            }}
          >
            <h3 className="mb-3 text-lg font-semibold" style={{ color: v("text-primary") }}>
              Импорт бизнес-плана
            </h3>
            <div className="space-y-3">
              <p className="text-sm" style={{ color: v("text-muted") }}>
                Загрузите файл в формате CSV, XLSX, HTML или PDF.
              </p>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => importFileRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors"
                style={{
                  borderColor: dragOver ? "#6366f1" : v("border-secondary"),
                  background: dragOver ? "rgba(99,102,241,0.08)" : "transparent",
                  color: v("text-muted"),
                }}
              >
                <Upload size={24} />
                <span className="text-sm">Перетащите файл сюда или нажмите для выбора</span>
                <span className="text-xs opacity-60">CSV, XLSX, HTML, PDF</span>
              </div>
              <input
                ref={importFileRef}
                type="file"
                accept=".csv,.xlsx,.xls,.html,.htm,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleImport(file);
                  e.target.value = "";
                }}
                disabled={importLoading}
                className="hidden"
              />
              {importLoading && (
                <div className="flex items-center gap-2 text-sm" style={{ color: v("text-muted") }}>
                  <Loader2 className="animate-spin" size={16} />
                  Импорт...
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                className={tw.buttonSecondary}
                style={buttonStyle("secondary", isDark)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = v("bg-hover");
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
                onClick={() => setOpenImport(false)}
                disabled={importLoading}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
