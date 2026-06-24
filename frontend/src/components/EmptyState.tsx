import { type ReactNode } from "react";
import { v, buttonStyle } from "../shared/theme";
import { useTheme } from "../features/theme/ThemeContext";

type EmptyStateProps = {
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
  compact?: boolean;
};

export function EmptyState({ title, subtitle, actionLabel, onAction, icon, compact }: EmptyStateProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className={`flex items-center justify-center ${compact ? "min-h-[180px]" : "min-h-[300px]"}`}>
      <div className="text-center animate-fade-in">
        {icon && <div className="mb-4 flex justify-center opacity-30">{icon}</div>}
        <p className={`font-medium ${compact ? "text-sm" : "text-lg"}`} style={{ color: v("text-primary") }}>
          {title}
        </p>
        <p className={`mt-2 ${compact ? "text-xs" : "text-sm"}`} style={{ color: v("text-muted") }}>
          {subtitle}
        </p>
        {actionLabel && onAction && (
          <button
            className="mt-5 rounded-lg border px-4 py-2 text-sm transition-colors"
            style={buttonStyle("primary", isDark)}
            onClick={onAction}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
