import { memo } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { buttonStyle, inputStyle, tw, v } from "../../shared/theme";
import { ru } from "../../i18n/ru";

interface Snapshot {
  id: number;
  title: string;
  note: string | null;
  created_at: string;
  created_by_id: number;
}

interface SnapshotsModalProps {
  open: boolean;
  isDark: boolean;
  snapshots: Snapshot[];
  loading: boolean;
  snapshotTitle: string;
  snapshotNote: string;
  onTitleChange: (v: string) => void;
  onNoteChange: (v: string) => void;
  onSave: () => void;
  onRestore: (id: number) => void;
  onDelete: (id: number, title: string) => void;
  onClose: () => void;
}

export const SnapshotsModal = memo(function SnapshotsModal({
  open,
  isDark,
  snapshots,
  loading,
  snapshotTitle,
  snapshotNote,
  onTitleChange,
  onNoteChange,
  onSave,
  onRestore,
  onDelete,
  onClose,
}: SnapshotsModalProps) {
  if (!open) return null;

  return (
    <div className={tw.modalOverlay} style={{ background: "rgba(0,0,0,0.6)" }}>
      <div
        className="w-full max-h-[90vh] overflow-y-auto rounded-2xl border p-4 sm:max-w-lg sm:p-5"
        style={{ background: v("bg-sidebar"), borderColor: v("border-primary") }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold" style={{ color: v("text-primary") }}>
            {ru.modals.snapshots}
          </h3>
          <span className="text-xs" style={{ color: v("text-muted") }}>
            {snapshots.length}/20
          </span>
        </div>
        <div className="mt-3 space-y-2">
          <input
            className={tw.inputBase + " w-full"}
            style={inputStyle(isDark)}
            placeholder={ru.modals.snapshotTitlePlaceholder}
            value={snapshotTitle}
            onChange={(e) => onTitleChange(e.target.value)}
          />
          <input
            className={tw.inputBase + " w-full"}
            style={inputStyle(isDark)}
            placeholder={ru.modals.snapshotNotePlaceholder}
            value={snapshotNote}
            onChange={(e) => onNoteChange(e.target.value)}
          />
          <button
            className="w-full rounded-lg border px-3 py-2 text-sm transition-colors"
            style={buttonStyle("primary", isDark)}
            disabled={snapshots.length >= 20}
            onClick={onSave}
          >
            {ru.modals.saveSnapshot}
          </button>
          {snapshots.length >= 20 && (
            <p className="text-xs" style={{ color: v("text-muted") }}>
              {ru.modals.snapshotLimitReached}
            </p>
          )}
        </div>
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="animate-spin" size={24} style={{ color: v("text-muted") }} />
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {snapshots.length === 0 ? (
              <p className="text-sm" style={{ color: v("text-muted") }}>
                {ru.modals.noSnapshots}
              </p>
            ) : (
              snapshots.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-xl border p-3"
                  style={{ borderColor: v("border-primary"), background: v("bg-primary") }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: v("text-primary") }}>
                      {s.title}
                    </p>
                    {s.note && (
                      <p className="text-xs" style={{ color: v("text-muted") }}>
                        {s.note}
                      </p>
                    )}
                    <p className="text-xs" style={{ color: v("text-muted") }}>
                      {new Date(s.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="shrink-0 flex gap-2">
                    <button
                      className="rounded-lg border px-3 py-1 text-xs"
                      style={buttonStyle("primary", isDark)}
                      onClick={() => onRestore(s.id)}
                    >
                      {ru.modals.restore}
                    </button>
                    <button
                      className="rounded-lg border px-3 py-1 text-xs"
                      style={buttonStyle("danger", isDark)}
                      onClick={() => onDelete(s.id, s.title)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        <div className="mt-4 flex justify-end">
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
