import { memo } from "react";
import { Pencil, Trash2 } from "lucide-react";
import {
  type Currency,
  type FinancialPlan,
} from "../../api";
import { ExpandableText } from "../../components/ExpandableText";
import { MarkdownPreview } from "../../components/MarkdownPreview";
import { RichTextEditor } from "../../components/RichTextEditor";
import { buttonStyle, inputStyle, tw, v } from "../../shared/theme";
import { getCurrencySymbol, getCurrencyRussianName } from "../../shared/currency";

interface ChartHeaderProps {
  chart: FinancialPlan;
  isDark: boolean;
  isEditing: boolean;
  chartForm: {
    title: string;
    description: string;
    descriptionDoc: object | null;
    currency_id: number;
    is_active: boolean;
  };
  currencies: Currency[];
  onFormChange: (field: string, value: string | number | boolean | object | null) => void;
  onStartEdit: () => void;
  onSave: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  onGenerateSummary: () => void;
}

export const ChartHeader = memo(function ChartHeader({
  chart,
  isDark,
  isEditing,
  chartForm,
  currencies,
  onFormChange,
  onStartEdit,
  onSave,
  onCancelEdit,
  onDelete,
  onGenerateSummary,
}: ChartHeaderProps) {
  return (
    <article
      className="rounded-2xl border p-5"
      style={{ borderColor: v("border-primary"), background: v("bg-secondary") }}
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                className={tw.inputBase}
                style={inputStyle(isDark)}
                value={chartForm.title}
                onChange={(e) => onFormChange("title", e.target.value)}
              />
            ) : (
              <ExpandableText text={chart.title} fontSize="text-2xl" fontWeight="font-semibold" color="text-primary" />
            )}
          </div>
          <div className="shrink-0 flex flex-wrap gap-2 max-sm:w-full max-sm:justify-end">
            <button
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors"
              style={{
                borderColor: v("border-secondary"),
                color: v("text-secondary"),
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = v("bg-hover"); }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              onClick={onGenerateSummary}
            >
              AI: сводка
            </button>
            {isEditing ? (
              <>
                <button className={tw.buttonPrimary} onClick={onSave}>Сохранить</button>
                <button
                  className={tw.buttonSecondary}
                  style={buttonStyle("secondary", isDark)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = v("bg-hover"); }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  onClick={onCancelEdit}
                >
                  Отмена
                </button>
              </>
            ) : (
              <>
                <button
                  className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors"
                  style={buttonStyle("secondary", isDark)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = v("bg-hover"); }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  onClick={onStartEdit}
                >
                  <Pencil size={16} />
                  <span className="hidden sm:inline">Редактировать</span>
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors"
                  style={buttonStyle("danger", isDark)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(220, 38, 38, 0.2)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  onClick={onDelete}
                >
                  <Trash2 size={16} />
                  <span className="hidden sm:inline">Удалить</span>
                </button>
              </>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <RichTextEditor
              content={chartForm.descriptionDoc ?? { type: "doc", content: [] }}
              onChange={(doc) => onFormChange("descriptionDoc", doc)}
              isDark={isDark}
              placeholder="Описание графика"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <select
                className={tw.inputBase}
                style={inputStyle(isDark)}
                value={chartForm.currency_id}
                onChange={(e) => onFormChange("currency_id", Number(e.target.value))}
              >
                <option value={0}>Выберите валюту</option>
                {currencies.map((currency) => (
                  <option key={currency.id} value={currency.id}>
                    {getCurrencySymbol(currency.code)} — {getCurrencyRussianName(currency.code)}
                  </option>
                ))}
              </select>
              <label
                className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"
                style={{ borderColor: v("border-primary"), color: v("text-secondary") }}
              >
                <input
                  type="checkbox"
                  checked={chartForm.is_active}
                  onChange={(e) => onFormChange("is_active", e.target.checked)}
                />
                Активный график
              </label>
            </div>
          </div>
        ) : (
          <>
            <MarkdownPreview content={chart.description || "Без описания"} />
            <p className="text-sm" style={{ color: v("text-muted") }}>
              Валюта:{" "}
              {(() => {
                const cur = currencies.find((c) => c.id === chart.currency_id);
                if (!cur) return `ID ${chart.currency_id}`;
                return `${getCurrencySymbol(cur.code)} — ${getCurrencyRussianName(cur.code)}`;
              })()}
              {" | "}Статус:
              <span style={{ color: chart.is_active ? "#16a34a" : v("text-muted") }}>
                {chart.is_active ? " активен" : " неактивен"}
              </span>
            </p>
          </>
        )}


      </div>
    </article>
  );
});
