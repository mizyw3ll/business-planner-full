import { memo } from "react";
import { Trash2 } from "lucide-react";
import { inputStyle, buttonStyle, tw, v } from "../../shared/theme";

interface EditCardModalProps {
  isDark: boolean;
  title: string;
  description: string;
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onSave: () => void;
  onClose: () => void;
  onDelete?: () => void;
}

export const EditCardModal = memo(function EditCardModal({
  isDark,
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  onSave,
  onClose,
  onDelete,
}: EditCardModalProps) {
  return (
    <div className="fixed inset-0 z-[120] grid place-items-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div
        className="w-full max-w-md rounded-2xl border p-5 backdrop-blur-xl"
        style={{ background: v("bg-sidebar"), borderColor: v("border-primary") }}
      >
        <h3 className="text-lg font-semibold mb-3" style={{ color: v("text-primary") }}>Редактировать карточку</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: v("text-muted") }}>Название *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className={tw.inputBase}
              style={inputStyle(isDark)}
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: v("text-muted") }}>Описание</label>
            <textarea
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className={`${tw.inputBase} min-h-[80px]`}
              style={inputStyle(isDark)}
              placeholder="Описание карточки..."
            />
          </div>
        </div>
        <div className="mt-4 flex justify-between">
          {onDelete && (
            <button
              className="rounded-xl px-3 py-2 text-sm flex items-center gap-1.5 transition-colors hover:bg-red-500/10"
              style={{ color: "#ef4444" }}
              onClick={onDelete}
            >
              <Trash2 size={14} /> Удалить
            </button>
          )}
          <div className="flex gap-2 ml-auto">
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
    </div>
  );
});
