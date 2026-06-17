import { X } from "lucide-react";

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LogoutConfirmModal({ isOpen, onClose, onConfirm }: LogoutConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border p-5"
        style={{
          background: "var(--bg-sidebar)",
          borderColor: "var(--border-primary)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Подтверждение выхода
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 transition-colors"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-hover)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
          Вы действительно хотите выйти из аккаунта?
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border px-4 py-2 text-sm transition-colors"
            style={{
              borderColor: "var(--border-secondary)",
              color: "var(--text-secondary)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            className="rounded-xl border px-4 py-2 text-sm transition-colors"
            style={{
              background: "rgba(220, 38, 38, 0.1)",
              borderColor: "rgba(220, 38, 38, 0.3)",
              color: "#dc2626",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(220, 38, 38, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(220, 38, 38, 0.1)";
            }}
          >
            Выйти
          </button>
        </div>
      </div>
    </div>
  );
}
