import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Tag } from "../api";
import { createTagApi, deleteTagApi } from "../api";
import { useTagsQuery } from "../hooks/useCachedData";
import { queryKeys } from "../lib/queryClient";
import { TagChip } from "./TagChip";
import { ConfirmModal } from "./ConfirmModal";

const COLOR_SWATCHES = [
  { idx: 0, class: "bg-red-500" },
  { idx: 1, class: "bg-orange-500" },
  { idx: 2, class: "bg-amber-500" },
  { idx: 3, class: "bg-green-500" },
  { idx: 4, class: "bg-teal-500" },
  { idx: 5, class: "bg-blue-500" },
  { idx: 6, class: "bg-indigo-500" },
  { idx: 7, class: "bg-violet-500" },
  { idx: 8, class: "bg-purple-500" },
  { idx: 9, class: "bg-pink-500" },
];

interface TagPickerProps {
  selectedTags: Tag[];
  onChange: (tags: Tag[]) => void;
}

export function TagPicker({ selectedTags, onChange }: TagPickerProps) {
  const queryClient = useQueryClient();
  const { data: allTags = [] } = useTagsQuery();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedIds = new Set(selectedTags.map((t) => t.id));

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggleTag = (tag: Tag) => {
    if (selectedIds.has(tag.id)) {
      onChange(selectedTags.filter((t) => t.id !== tag.id));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      const tag = await createTagApi({ name, color_idx: newColor });
      await queryClient.invalidateQueries({ queryKey: queryKeys.tags });
      onChange([...selectedTags, tag]);
      setNewName("");
    } catch (e) {
      console.error("Failed to create tag", e);
    }
  };

  const handleDelete = async (e: React.MouseEvent, tag: Tag) => {
    e.stopPropagation();
    setDeleteTarget(tag);
  };

  const confirmDeleteTag = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTagApi(deleteTarget.id);
      await queryClient.invalidateQueries({ queryKey: queryKeys.tags });
      onChange(selectedTags.filter((t) => t.id !== deleteTarget.id));
    } catch (err) {
      console.error("Failed to delete tag", err);
    } finally {
      setDeleteTarget(null);
    }
  };

  const available = allTags.filter((t) => !selectedIds.has(t.id));

  return (
    <>
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Подтверждение удаления"
        description={deleteTarget ? `Вы действительно хотите удалить тег "${deleteTarget.name}"?` : ""}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDeleteTag()}
      />
      <div className="relative" ref={dropdownRef}>
        <div className="flex flex-wrap gap-1 items-center mb-1">
          {selectedTags.map((tag) => (
            <TagChip key={tag.id} tag={tag} removable onRemove={() => toggleTag(tag)} size="sm" />
          ))}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border border-dashed border-gray-300 dark:border-gray-600 rounded-full px-2 py-0.5"
          >
            + тег
          </button>
        </div>

        {open && (
          <div className="absolute z-50 mt-1 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
            <div className="mb-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Выберите тег</p>
              {available.length === 0 && selectedTags.length > 0 && (
                <p className="text-xs text-gray-400">Все теги уже назначены</p>
              )}
              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                {available.map((tag) => (
                  <button key={tag.id} type="button" onClick={() => toggleTag(tag)} className="cursor-pointer">
                    <TagChip tag={tag} size="sm" />
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Новый тег</p>
              <div className="flex gap-1 mb-1">
                {COLOR_SWATCHES.map((c) => (
                  <button
                    key={c.idx}
                    type="button"
                    onClick={() => setNewColor(c.idx)}
                    className={`w-5 h-5 rounded-full ${c.class} ${
                      newColor === c.idx ? "ring-2 ring-offset-1 ring-blue-500 dark:ring-offset-gray-800" : ""
                    }`}
                  />
                ))}
              </div>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreate();
                    }
                  }}
                  placeholder="Название тега"
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={!newName.trim()}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  +
                </button>
              </div>
            </div>

            {allTags.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Все теги</p>
                <div className="flex flex-wrap gap-1">
                  {allTags.map((tag) => (
                    <div key={tag.id} className="flex items-center gap-0.5">
                      <TagChip tag={tag} size="sm" onClick={() => toggleTag(tag)} />
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, tag)}
                        className="text-gray-400 hover:text-red-500 text-xs p-0.5"
                        title="Удалить тег"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
