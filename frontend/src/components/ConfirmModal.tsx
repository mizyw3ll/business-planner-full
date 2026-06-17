import { v } from "../shared/theme";
import { useModalRegistration } from "../hooks/useModalOpen";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmModal({
  open,
  title,
  description,
  confirmText = "Удалить",
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  useModalRegistration(open);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] grid place-items-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div
        className="w-full max-w-md rounded-2xl border p-5"
        style={{
          background: v("bg-sidebar"),
          borderColor: v("border-primary"),
        }}
      >
        <h3 className="text-lg font-semibold" style={{ color: v("text-primary") }}>
          {title}
        </h3>
        <p className="mt-2 text-sm" style={{ color: v("text-secondary") }}>
          {description}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            className="rounded-xl border px-4 py-2 text-sm transition-colors"
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
            className="rounded-xl border px-4 py-2 text-sm transition-colors"
            style={{
              borderColor: "rgba(220, 38, 38, 0.6)",
              background: "rgba(220, 38, 38, 0.1)",
              color: "rgb(252, 165, 165)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(220, 38, 38, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(220, 38, 38, 0.1)";
            }}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
