import { memo } from "react";
import { X } from "lucide-react";
import { type Contact, type Deal } from "../../api";
import { DEAL_STATUSES, PRIORITIES } from "./CrmPage.constants";
import { inputStyle, buttonStyle, v } from "../../shared/theme";

interface DealFormModalProps {
  isDark: boolean;
  editingDeal: Deal | null;
  dTitle: string;
  dDescription: string;
  dContactId: string;
  dStatus: string;
  dValue: string;
  dCurrency: string;
  dPriority: string;
  dDueDate: string;
  dealErrors: Record<string, string>;
  contacts: Contact[];
  isPending: boolean;
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onContactIdChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onValueChange: (v: string) => void;
  onCurrencyChange: (v: string) => void;
  onPriorityChange: (v: string) => void;
  onDueDateChange: (v: string) => void;
  onClearError: (field: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export const DealFormModal = memo(function DealFormModal({
  isDark,
  editingDeal,
  dTitle,
  dDescription,
  dContactId,
  dStatus,
  dValue,
  dCurrency,
  dPriority,
  dDueDate,
  dealErrors,
  contacts,
  isPending,
  onTitleChange,
  onDescriptionChange,
  onContactIdChange,
  onStatusChange,
  onValueChange,
  onCurrencyChange,
  onPriorityChange,
  onDueDateChange,
  onClearError,
  onSave,
  onClose,
}: DealFormModalProps) {
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div
        className="w-full max-w-lg rounded-2xl border p-4 max-h-[90vh] overflow-y-auto"
        style={{ background: v("bg-secondary"), borderColor: v("border-primary") }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: v("text-primary") }}>
            {editingDeal ? "Редактировать сделку" : "Добавить сделку"}
          </h2>
          <button type="button" onClick={onClose} style={{ color: v("text-muted") }}>
            <X size={20} />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <input
              type="text"
              value={dTitle}
              onChange={(e) => { onTitleChange(e.target.value); if (dealErrors.title) onClearError("title"); }}
              placeholder="Название сделки *"
              className="w-full rounded-xl border px-3 py-2 text-sm"
              style={{ ...inputStyle(isDark), borderColor: dealErrors.title ? "#ef4444" : undefined }}
            />
            {dealErrors.title && <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{dealErrors.title}</p>}
          </div>
          <textarea
            value={dDescription}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Описание"
            rows={2}
            className="w-full rounded-xl border px-3 py-2 text-sm"
            style={inputStyle(isDark)}
          />
          <select
            value={dContactId}
            onChange={(e) => onContactIdChange(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm"
            style={inputStyle(isDark)}
          >
            <option value="">Без контакта</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={dStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm"
            style={inputStyle(isDark)}
          >
            {DEAL_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="number"
                value={dValue}
                onChange={(e) => { onValueChange(e.target.value); if (dealErrors.value) onClearError("value"); }}
                placeholder="Сумма"
                min="0"
                className="w-full rounded-xl border px-3 py-2 text-sm"
                style={{ ...inputStyle(isDark), borderColor: dealErrors.value ? "#ef4444" : undefined }}
              />
              {dealErrors.value && <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{dealErrors.value}</p>}
            </div>
            <select
              value={dCurrency}
              onChange={(e) => onCurrencyChange(e.target.value)}
              className="rounded-xl border px-3 py-2 text-sm"
              style={inputStyle(isDark)}
            >
              <option value="RUB">₽ — Рубль</option>
              <option value="USD">$ — Доллар США</option>
              <option value="EUR">€ — Евро</option>
            </select>
          </div>
          <select
            value={dPriority}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm"
            style={inputStyle(isDark)}
          >
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <div>
            <input
              type="date"
              value={dDueDate}
              onChange={(e) => { onDueDateChange(e.target.value); if (dealErrors.dueDate) onClearError("dueDate"); }}
              className="w-full rounded-xl border px-3 py-2 text-sm"
              style={{ ...inputStyle(isDark), borderColor: dealErrors.dueDate ? "#ef4444" : undefined }}
            />
            {dealErrors.dueDate && <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{dealErrors.dueDate}</p>}
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm transition-colors"
            style={buttonStyle("secondary", isDark)}
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={!dTitle.trim() || isPending}
            className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            style={buttonStyle("primary", isDark)}
          >
            {editingDeal ? "Сохранить" : "Создать"}
          </button>
        </div>
      </div>
    </div>
  );
});
