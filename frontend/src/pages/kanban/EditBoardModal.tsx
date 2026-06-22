import { memo } from "react";
import { inputStyle, buttonStyle, tw, v } from "../../shared/theme";

interface EditBoardModalProps {
  isDark: boolean;
  title: string;
  onTitleChange: (v: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export const EditBoardModal = memo(function EditBoardModal({
  isDark,
  title,
  onTitleChange,
  onSave,
  onClose,
}: EditBoardModalProps) {
  return (
    <div className="fixed inset-0 z-[120] grid place-items-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div
        className="w-full max-w-md rounded-2xl border p-5 backdrop-blur-xl"
        style={{ background: v("bg-sidebar"), borderColor: v("border-primary") }}
      >
        <h3 className="text-lg font-semibold mb-3" style={{ color: v("text-primary") }}>Редактировать доску</h3>
        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: v("text-muted") }}>Название *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onSave(); if (e.key === "Escape") onClose(); }}
            className={tw.inputBase}
            style={inputStyle(isDark)}
            autoFocus
          />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            className="rounded-xl border px-4 py-2 text-sm"
            style={{ borderColor: v("border-secondary"), color: v("text-secondary") }}
            onClick={onClose}
          >
            Отмена
          </button>
          <button
            className="rounded-xl border px-4 py-2 text-sm font-medium"
            style={buttonStyle("primary", isDark)}
            disabled={!title.trim()}
            onClick={onSave}
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
});
