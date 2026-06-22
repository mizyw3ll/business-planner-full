import { memo } from "react";
import { X } from "lucide-react";
import { type Contact } from "../../api";
import { inputStyle, buttonStyle, v } from "../../shared/theme";

interface ContactFormModalProps {
  isDark: boolean;
  editingContact: Contact | null;
  cName: string;
  cEmail: string;
  cPhone: string;
  cCompany: string;
  cPosition: string;
  cNotes: string;
  cIsLead: boolean;
  contactErrors: Record<string, string>;
  isPending: boolean;
  onNameChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onCompanyChange: (v: string) => void;
  onPositionChange: (v: string) => void;
  onNotesChange: (v: string) => void;
  onIsLeadChange: (v: boolean) => void;
  onClearError: (field: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export const ContactFormModal = memo(function ContactFormModal({
  isDark,
  editingContact,
  cName,
  cEmail,
  cPhone,
  cCompany,
  cPosition,
  cNotes,
  cIsLead,
  contactErrors,
  isPending,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  onCompanyChange,
  onPositionChange,
  onNotesChange,
  onIsLeadChange,
  onClearError,
  onSave,
  onClose,
}: ContactFormModalProps) {
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div
        className="w-full max-w-lg rounded-2xl border p-4 max-h-[90vh] overflow-y-auto"
        style={{ background: v("bg-secondary"), borderColor: v("border-primary") }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: v("text-primary") }}>
            {editingContact ? "Редактировать контакт" : "Добавить контакт"}
          </h2>
          <button type="button" onClick={onClose} style={{ color: v("text-muted") }}>
            <X size={20} />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <input
              type="text"
              value={cName}
              onChange={(e) => { onNameChange(e.target.value); if (contactErrors.name) onClearError("name"); }}
              placeholder="Имя *"
              className="w-full rounded-xl border px-3 py-2 text-sm"
              style={{ ...inputStyle(isDark), borderColor: contactErrors.name ? "#ef4444" : undefined }}
            />
            {contactErrors.name && <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{contactErrors.name}</p>}
          </div>
          <div>
            <input
              type="email"
              value={cEmail}
              onChange={(e) => { onEmailChange(e.target.value); if (contactErrors.email) onClearError("email"); }}
              placeholder="Email"
              className="w-full rounded-xl border px-3 py-2 text-sm"
              style={{ ...inputStyle(isDark), borderColor: contactErrors.email ? "#ef4444" : undefined }}
            />
            {contactErrors.email && <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{contactErrors.email}</p>}
          </div>
          <div>
            <input
              type="text"
              value={cPhone}
              onChange={(e) => { onPhoneChange(e.target.value); if (contactErrors.phone) onClearError("phone"); }}
              placeholder="Телефон"
              className="w-full rounded-xl border px-3 py-2 text-sm"
              style={{ ...inputStyle(isDark), borderColor: contactErrors.phone ? "#ef4444" : undefined }}
            />
            {contactErrors.phone && <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{contactErrors.phone}</p>}
          </div>
          <input
            type="text"
            value={cCompany}
            onChange={(e) => onCompanyChange(e.target.value)}
            placeholder="Компания"
            className="w-full rounded-xl border px-3 py-2 text-sm"
            style={inputStyle(isDark)}
          />
          <input
            type="text"
            value={cPosition}
            onChange={(e) => onPositionChange(e.target.value)}
            placeholder="Должность"
            className="w-full rounded-xl border px-3 py-2 text-sm"
            style={inputStyle(isDark)}
          />
          <textarea
            value={cNotes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Заметки"
            rows={2}
            className="w-full rounded-xl border px-3 py-2 text-sm"
            style={inputStyle(isDark)}
          />
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={cIsLead} onChange={(e) => onIsLeadChange(e.target.checked)} />
            <span className="text-sm" style={{ color: v("text-muted") }}>Потенциальный клиент</span>
          </label>
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
            disabled={!cName.trim() || isPending}
            className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            style={buttonStyle("primary", isDark)}
          >
            {editingContact ? "Сохранить" : "Создать"}
          </button>
        </div>
      </div>
    </div>
  );
});
