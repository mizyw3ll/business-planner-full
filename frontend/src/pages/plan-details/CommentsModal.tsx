import { memo, useState } from "react";
import { Pencil, Trash2, Check, X, Loader2, Send } from "lucide-react";
import { buttonStyle, inputStyle, tw, v } from "../../shared/theme";
import { ru } from "../../i18n/ru";

interface Comment {
  id: number;
  content: string;
  resolved: boolean;
  created_at: string;
  user_id: number;
  username?: string | null;
}

interface CommentsModalProps {
  open: boolean;
  isDark: boolean;
  blockTitle: string | null;
  comments: Comment[];
  loading: boolean;
  onAdd: (text: string) => void;
  onToggleResolve: (commentId: number, resolved: boolean) => void;
  onUpdateText: (commentId: number, text: string) => void;
  onDelete: (commentId: number, content: string) => void;
  onClose: () => void;
}

export const CommentsModal = memo(function CommentsModal({
  open,
  isDark,
  blockTitle,
  comments,
  loading,
  onAdd,
  onToggleResolve,
  onUpdateText,
  onDelete,
  onClose,
}: CommentsModalProps) {
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

  if (!open) return null;

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setText("");
  };

  return (
    <div className={tw.modalOverlay} style={{ background: "rgba(0,0,0,0.6)" }}>
      <div
        className="w-full max-h-[90vh] overflow-y-auto rounded-2xl border p-4 sm:max-w-lg sm:p-5"
        style={{ background: v("bg-sidebar"), borderColor: v("border-primary") }}
      >
        <h3 className="text-lg font-semibold" style={{ color: v("text-primary") }}>
          {ru.modals.comments} — {blockTitle}
        </h3>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="animate-spin" size={24} style={{ color: v("text-muted") }} />
          </div>
        ) : (
          <div className="mt-3 space-y-2 max-h-[400px] overflow-y-auto">
            {comments.length === 0 ? (
              <p className="text-sm" style={{ color: v("text-muted") }}>
                {ru.modals.noComments}
              </p>
            ) : (
              comments.map((c) => (
                <div
                  key={c.id}
                  className={`rounded-xl border p-3 ${c.resolved ? "opacity-60" : ""}`}
                  style={{ borderColor: v("border-primary"), background: v("bg-primary") }}
                >
                  <div className="flex items-center gap-2 text-xs" style={{ color: v("text-muted") }}>
                    <span className="font-medium" style={{ color: v("text-primary") }}>
                      {c.username || `User #${c.user_id}`}
                    </span>
                    <span>{new Date(c.created_at).toLocaleString()}</span>
                  </div>
                  {editingId === c.id ? (
                    <div className="mt-1 flex gap-2">
                      <input
                        className={tw.inputBase + " flex-1 text-sm"}
                        style={inputStyle(isDark)}
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") onUpdateText(c.id, editingText);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      />
                      <button
                        className="rounded-md border px-2 py-0.5 text-xs"
                        style={buttonStyle("primary", isDark)}
                        onClick={() => onUpdateText(c.id, editingText)}
                      >
                        <Check size={12} />
                      </button>
                      <button
                        className="rounded-md border px-2 py-0.5 text-xs"
                        style={buttonStyle("secondary", isDark)}
                        onClick={() => setEditingId(null)}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm" style={{ color: v("text-secondary") }}>
                      {c.content}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      className="rounded-md border px-2 py-0.5 text-xs"
                      style={{ borderColor: v("border-secondary"), color: v("text-muted") }}
                      onClick={() => onToggleResolve(c.id, c.resolved)}
                    >
                      {c.resolved ? <X size={12} /> : <Check size={12} />}
                    </button>
                    {editingId !== c.id && (
                      <button
                        className="rounded-md border px-2 py-0.5 text-xs"
                        style={{ borderColor: v("border-secondary"), color: v("text-muted") }}
                        onClick={() => { setEditingId(c.id); setEditingText(c.content); }}
                      >
                        <Pencil size={12} />
                      </button>
                    )}
                    <button
                      className="rounded-md border px-2 py-0.5 text-xs"
                      style={buttonStyle("danger", isDark)}
                      onClick={() => onDelete(c.id, c.content)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div className="mt-3 flex gap-2">
          <input
            className={tw.inputBase + " flex-1 text-sm"}
            style={inputStyle(isDark)}
            placeholder={ru.modals.addComment}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
          />
          <button
            className={tw.buttonPrimary}
            style={buttonStyle("primary", isDark)}
            onClick={handleSubmit}
          >
            <Send size={16} />
          </button>
        </div>

        <div className="mt-3 flex justify-end">
          <button
            className={tw.buttonSecondary}
            style={buttonStyle("secondary", isDark)}
            onClick={onClose}
          >
            {ru.modals.close}
          </button>
        </div>
      </div>
    </div>
  );
});
