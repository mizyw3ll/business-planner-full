import { memo } from "react";
import type { Tag } from "../api";

const TAG_COLORS = [
  "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
  "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
];

interface TagChipProps {
  tag: Tag;
  onClick?: () => void;
  onRemove?: () => void;
  removable?: boolean;
  size?: "sm" | "md";
}

export const TagChip = memo(function TagChip({ tag, onClick, onRemove, removable = false, size = "md" }: TagChipProps) {
  const colorClass = TAG_COLORS[tag.color_idx % TAG_COLORS.length];
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full ${colorClass} ${sizeClasses} cursor-pointer transition-colors hover:opacity-80`}
      onClick={onClick}
    >
      <span>#{tag.name}</span>
      {removable && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 p-0.5"
          aria-label="Удалить тег"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </span>
  );
});
