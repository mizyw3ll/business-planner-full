import { X, Eye, EyeOff } from "lucide-react";
import { useVisualSettings, type VisualSettings } from "./VisualSettingsContext";

type Props = {
  open: boolean;
  onClose: () => void;
};

const labels: Record<keyof VisualSettings, { label: string; desc: string }> = {
  auroraOrbs: { label: "Световые орбы", desc: "Анимированные градиентные сферы на фоне" },
  particles: { label: "Частицы", desc: "Плавающие светящиеся точки" },
  gridOverlay: { label: "Сетка", desc: "Тонкая линейная сетка на фоне" },
};

export function VisualSettingsModal({ open, onClose }: Props) {
  const { settings, toggle } = useVisualSettings();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ animation: "fadeIn 0.2s ease-out" }}
      onClick={onClose}
    >
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }} />
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl p-6"
        style={{
          background: "rgba(14, 12, 36, 0.95)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
          animation: "authCardIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Настройки отображения</h3>
            <p className="mt-0.5 text-xs" style={{ color: "#7e78a8" }}>
              Визуальные эффекты интерфейса
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 transition-colors duration-200 hover:bg-white/5"
            style={{ color: "#6b7280" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Toggles */}
        <div className="space-y-2">
          {(Object.keys(labels) as (keyof VisualSettings)[]).map((key) => {
            const active = settings[key];
            const info = labels[key];
            return (
              <button
                key={key}
                onClick={() => toggle(key)}
                className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all duration-200"
                style={{
                  background: active ? "rgba(99, 102, 241, 0.08)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${active ? "rgba(99, 102, 241, 0.2)" : "rgba(255,255,255,0.04)"}`,
                }}
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200"
                  style={{
                    background: active ? "rgba(99, 102, 241, 0.15)" : "rgba(255,255,255,0.04)",
                    color: active ? "#818cf8" : "#555080",
                  }}
                >
                  {active ? <Eye size={16} /> : <EyeOff size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium" style={{ color: active ? "#f0eeff" : "#8b8bb0" }}>
                    {info.label}
                  </div>
                  <div className="text-[11px]" style={{ color: "#555080" }}>
                    {info.desc}
                  </div>
                </div>
                <div
                  className="h-5 w-9 shrink-0 rounded-full transition-all duration-300"
                  style={{
                    background: active ? "#6366f1" : "rgba(255,255,255,0.08)",
                    boxShadow: active ? "0 0 12px rgba(99,102,241,0.3)" : "none",
                  }}
                >
                  <div
                    className="h-4 w-4 rounded-full bg-white transition-all duration-300"
                    style={{
                      marginTop: "2px",
                      marginLeft: active ? "18px" : "2px",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Reset */}
        <button
          onClick={() => {
            const keys = Object.keys(labels) as (keyof VisualSettings)[];
            keys.forEach((k) => {
              if (!settings[k]) toggle(k);
            });
          }}
          className="mt-4 w-full rounded-xl py-2.5 text-xs font-medium transition-colors duration-200"
          style={{ color: "#7e78a8", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)" }}
        >
          Включить все эффекты
        </button>
      </div>
    </div>
  );
}
