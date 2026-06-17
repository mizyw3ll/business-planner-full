import { v, tw, inputStyle, buttonStyle } from "../shared/theme";
import { useModalRegistration } from "../hooks/useModalOpen";

interface PointModalProps {
  open: boolean;
  title: string;
  form: {
    date: string;
    type: "income" | "expense";
    amount: string;
    description: string;
  };
  isDark: boolean;
  onFormChange: (field: string, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function PointModal({ open, title, form, isDark, onFormChange, onSave, onCancel }: PointModalProps) {
  useModalRegistration(open);
  if (!open) return null;

  const canSave = form.date && form.amount && !isNaN(Number(form.amount));

  return (
    <div className="fixed inset-0 z-[120] grid place-items-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div
        className="w-full max-h-[90vh] overflow-y-auto rounded-2xl border p-4 sm:max-w-lg sm:p-5"
        style={{
          background: v("bg-sidebar"),
          borderColor: v("border-primary"),
        }}
      >
        <h3 className="text-lg font-semibold" style={{ color: v("text-primary") }}>
          {title}
        </h3>

        <div className="mt-4 space-y-3">
          <input
            className={tw.inputBase}
            style={inputStyle(isDark)}
            type="datetime-local"
            value={form.date}
            onChange={(e) => onFormChange("date", e.target.value)}
          />

          <select
            className={tw.inputBase}
            style={inputStyle(isDark)}
            value={form.type}
            onChange={(e) => onFormChange("type", e.target.value as "income" | "expense")}
          >
            <option value="income">Доход</option>
            <option value="expense">Расход</option>
          </select>

          <input
            className={tw.inputBase}
            style={inputStyle(isDark)}
            type="number"
            step="0.01"
            placeholder="Сумма"
            value={form.amount}
            onChange={(e) => onFormChange("amount", e.target.value)}
          />

          <textarea
            className={tw.inputBase}
            style={inputStyle(isDark)}
            value={form.description}
            onChange={(e) => onFormChange("description", e.target.value)}
            placeholder="Описание (опционально)"
            rows={3}
          />
        </div>

        <div className="mt-5 flex flex-col-reverse sm:flex-row justify-end gap-2">
          <button
            className="w-full sm:w-auto rounded-xl border px-4 py-2 text-sm transition-colors"
            style={{ borderColor: v("border-secondary"), color: v("text-secondary") }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = v("bg-hover");
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
            onClick={onCancel}
          >
            Отмена
          </button>
          <button
            className="w-full sm:w-auto rounded-xl border px-4 py-2 text-sm transition-colors"
            style={buttonStyle("primary", isDark)}
            disabled={!canSave}
            onMouseEnter={(e) => {
              if (canSave) e.currentTarget.style.opacity = "0.9";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
            onClick={onSave}
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
