import { useEffect, useState } from "react";
import { MarkdownPreview } from "./MarkdownPreview";
import { useTheme } from "../features/theme/ThemeContext";
import { v } from "../shared/theme";
import { useModalRegistration } from "../hooks/useModalOpen";

type AIPreviewModalProps = {
  open: boolean;
  title: string;
  content: string;
  charCount: number;
  maxChars: number;
  provider?: string;
  model?: string;
  saving?: boolean;
  onSave: (content: string) => void;
  onCancel: () => void;
};

export function AIPreviewModal({
  open,
  title,
  content,
  charCount,
  maxChars,
  provider,
  model,
  saving = false,
  onSave,
  onCancel,
}: AIPreviewModalProps) {
  const [editedContent, setEditedContent] = useState(content);
  const [isEditing, setIsEditing] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    if (open) {
      setEditedContent(content);
      setIsEditing(false);
    }
  }, [open, content]);

  useModalRegistration(open);

  if (!open) return null;

  const usagePercent = maxChars > 0 ? Math.round((charCount / maxChars) * 100) : 0;
  const isNearLimit = usagePercent > 80;

  return (
    <div className="fixed inset-0 z-[120] grid place-items-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border"
        style={{
          background: v("bg-sidebar"),
          borderColor: v("border-primary"),
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: v("border-primary") }}
        >
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold" style={{ color: v("text-primary") }}>
              {title}
            </h3>
            <div className="mt-1 flex items-center gap-3">
              <span
                className="text-xs"
                style={{ color: isNearLimit ? "rgb(252, 165, 165)" : v("text-muted") }}
              >
                {charCount} / {maxChars} символов ({usagePercent}%)
              </span>
              {provider && (
                <span className="text-xs" style={{ color: v("text-muted") }}>
                  {provider} / {model}
                </span>
              )}
            </div>
          </div>
          <button
            className="ml-3 flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            style={{ color: v("text-muted") }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = v("bg-hover");
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
            onClick={onCancel}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isEditing ? (
            <textarea
              className="w-full rounded-xl border p-4 text-sm leading-relaxed focus:outline-none focus:ring-2"
              style={{
                background: v("bg-input"),
                borderColor: v("border-secondary"),
                color: v("text-primary"),
                minHeight: "300px",
              }}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
            />
          ) : (
            <div
              className="rounded-xl border p-4"
              style={{
                background: v("bg-input"),
                borderColor: v("border-muted"),
                color: v("text-primary"),
              }}
            >
              <div
                className="ai-preview-content"
                style={{
                  color: v("text-primary"),
                }}
              >
                <style>{`
                  .ai-preview-content p { color: ${v("text-primary")}; }
                  .ai-preview-content h1, .ai-preview-content h2, .ai-preview-content h3,
                  .ai-preview-content h4, .ai-preview-content h5, .ai-preview-content h6 {
                    color: ${v("text-primary")};
                  }
                  .ai-preview-content strong { color: ${v("text-primary")}; }
                  .ai-preview-content em { color: ${v("text-secondary")}; }
                  .ai-preview-content li { color: ${v("text-primary")}; }
                  .ai-preview-content ul, .ai-preview-content ol { color: ${v("text-primary")}; }
                  .ai-preview-content blockquote { color: ${v("text-secondary")}; border-color: ${v("text-muted")}; }
                  .ai-preview-content a { color: ${isDark ? "#818cf8" : "#6366f1"}; }
                  .ai-preview-content code { color: ${v("text-primary")}; background: ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}; }
                  .ai-preview-content hr { border-color: ${v("border-primary")}; }
                  .ai-preview-content table { color: ${v("text-primary")}; }
                  .ai-preview-content th { color: ${v("text-primary")}; }
                  .ai-preview-content td { color: ${v("text-primary")}; }
                `}</style>
                <MarkdownPreview content={editedContent} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between border-t px-5 py-4"
          style={{ borderColor: v("border-primary") }}
        >
          <button
            className="rounded-xl border px-3 py-2 text-sm transition-colors"
            style={{ borderColor: v("border-secondary"), color: v("text-secondary") }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = v("bg-hover");
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? "Просмотр" : "Редактировать"}
          </button>

          <div className="flex gap-2">
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
              disabled={saving}
            >
              Отмена
            </button>
            <button
              className="rounded-xl px-4 py-2 text-sm font-medium transition-colors"
              style={{
                background: "rgba(99, 102, 241, 0.9)",
                color: "white",
                opacity: saving ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!saving) e.currentTarget.style.background = "rgba(99, 102, 241, 1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(99, 102, 241, 0.9)";
              }}
              onClick={() => onSave(editedContent)}
              disabled={saving}
            >
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
