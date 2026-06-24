import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Folder,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  createNoteApi,
  updateNoteApi,
  deleteNoteApi,
  createProjectApi,
  deleteProjectApi,
  type Note,
  type Project,
  type Tag,
} from "../api";
import { useNotesQuery, useProjectsQuery, useTagsQuery } from "../hooks/useCachedData";
import { queryKeys } from "../lib/queryClient";
import { EmptyState } from "../components/EmptyState";
import { TagPicker } from "../components/TagPicker";
import { TagChip } from "../components/TagChip";
import { MarkdownPreview } from "../components/MarkdownPreview";
import { buttonStyle, inputStyle, tw, v } from "../shared/theme";
import { useTheme } from "../features/theme/ThemeContext";
import { ConfirmModal } from "../components/ConfirmModal";
import { useModalRegistration } from "../hooks/useModalOpen";

const TAB_COLORS = [
  "rgba(239,68,68,0.9)",
  "rgba(249,115,22,0.9)",
  "rgba(245,158,11,0.9)",
  "rgba(34,197,94,0.9)",
  "rgba(20,184,166,0.9)",
  "rgba(59,130,246,0.9)",
  "rgba(99,102,241,0.9)",
  "rgba(139,92,246,0.9)",
  "rgba(168,85,247,0.9)",
  "rgba(236,72,153,0.9)",
];

export function NotesPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [searchParams] = useSearchParams();
  const noteIdParam = searchParams.get("noteId");

  const [calcPerPage, setCalcPerPage] = useState(() =>
    Math.max(5, Math.min(10, Math.floor((window.innerHeight - 280) / 110))),
  );
  useEffect(() => {
    function updatePerPage() {
      setCalcPerPage(Math.max(5, Math.min(10, Math.floor((window.innerHeight - 280) / 110))));
    }
    updatePerPage();
    window.addEventListener("resize", updatePerPage);
    return () => window.removeEventListener("resize", updatePerPage);
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("updated_at_desc");
  const [deleteTarget, setDeleteTarget] = useState<{ type: "note" | "project"; id: number; title: string } | null>(
    null,
  );

  const effectivePerPage = searchQuery || noteIdParam ? 100 : calcPerPage;

  const tagIdsParam = selectedTagId ? String(selectedTagId) : undefined;
  const { data: notesData, isLoading: notesLoading } = useNotesQuery(
    selectedProject,
    tagIdsParam,
    page,
    effectivePerPage,
  );
  const notes = useMemo(() => notesData?.items ?? [], [notesData]);
  const totalNotes = notesData?.total ?? 0;
  const perPage = notesData?.per_page ?? 10;
  const totalPages = Math.max(1, Math.ceil(totalNotes / perPage));

  const pageNumbers = useMemo(() => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }, [page, totalPages]);
  const { data: projects = [], isLoading: projectsLoading } = useProjectsQuery();
  const { data: allTags = [], isLoading: tagsLoading } = useTagsQuery();
  const loading = notesLoading || projectsLoading || tagsLoading;
  // Note editor
  const [editorOpen, setEditorOpen] = useState(false);
  useModalRegistration(editorOpen);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteProjectId, setNoteProjectId] = useState<number | null>(null);
  const [noteTags, setNoteTags] = useState<Tag[]>([]);

  // Open note from search result
  useEffect(() => {
    if (!noteIdParam || !notes.length || loading) return;
    const target = notes.find((n) => n.id === Number(noteIdParam));
    if (target) {
      setEditingNote(target); // eslint-disable-line react-hooks/set-state-in-effect
      setNoteTitle(target.title);
      setNoteContent(target.content_markdown);
      setNoteProjectId(target.project_id ?? null);
      setNoteTags(target.tags ?? []);
      setEditorOpen(true);
    }
  }, [noteIdParam, notes, loading]);

  // Project create
  const [projectInput, setProjectInput] = useState("");
  const [showProjectInput, setShowProjectInput] = useState(false);

  async function refreshNotes() {
    await queryClient.invalidateQueries({ queryKey: ["notes"] });
  }

  function selectProject(id: number | null) {
    setSelectedProject(id);
    setPage(1);
  }

  function selectTag(id: number | null) {
    setSelectedTagId(id);
    setPage(1);
  }

  async function refreshProjects() {
    await queryClient.invalidateQueries({ queryKey: queryKeys.projects });
  }

  function openNewNote() {
    setEditingNote(null);
    setNoteTitle("");
    setNoteContent("");
    setNoteProjectId(selectedProject);
    setNoteTags([]);
    setEditorOpen(true);
  }

  function openEditNote(note: Note) {
    setEditingNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content_markdown);
    setNoteProjectId(note.project_id ?? null);
    setNoteTags(note.tags ?? []);
    setEditorOpen(true);
  }

  async function saveNote() {
    if (!noteTitle.trim()) return;
    try {
      if (editingNote) {
        await updateNoteApi(editingNote.id, {
          title: noteTitle.trim(),
          content_markdown: noteContent,
          project_id: noteProjectId,
          tag_ids: noteTags.map((t) => t.id),
        });
        toast.success("Заметка обновлена");
      } else {
        await createNoteApi({
          title: noteTitle.trim(),
          content_markdown: noteContent,
          project_id: noteProjectId,
          tag_ids: noteTags.map((t) => t.id),
        });
        toast.success("Заметка создана");
      }
      setEditorOpen(false);
      await refreshNotes();
    } catch (err: any) {
      toast.error(err?.userMessage || "Ошибка сохранения заметки");
    }
  }

  async function handleDeleteNote(note: Note) {
    setDeleteTarget({ type: "note", id: note.id, title: note.title });
  }

  async function handleCreateProject() {
    if (!projectInput.trim()) return;
    try {
      await createProjectApi({ name: projectInput.trim(), color_idx: 0 });
      setProjectInput("");
      setShowProjectInput(false);
      toast.success("Проект создан");
      await refreshProjects();
    } catch (err: any) {
      toast.error(err?.userMessage || "Ошибка создания проекта");
    }
  }

  async function handleDeleteProject(project: Project) {
    setDeleteTarget({ type: "project", id: project.id, title: project.name });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "note") {
        await deleteNoteApi(deleteTarget.id);
        toast.success("Заметка удалена");
        await refreshNotes();
      } else {
        await deleteProjectApi(deleteTarget.id);
        toast.success("Проект удалён");
        if (selectedProject === deleteTarget.id) setSelectedProject(null);
        await Promise.all([refreshProjects(), refreshNotes()]);
      }
    } catch (err: any) {
      toast.error(err?.userMessage || (deleteTarget.type === "note" ? "Ошибка удаления заметки" : "Ошибка удаления проекта"));
    } finally {
      setDeleteTarget(null);
    }
  }

  const filteredNotes = useMemo(() => {
    const list = notes.filter((n) => n.title.toLowerCase().includes(searchQuery.toLowerCase()));
    list.sort((a, b) => {
      if (sortBy === "title_asc") return a.title.localeCompare(b.title);
      if (sortBy === "title_desc") return b.title.localeCompare(a.title);
      if (sortBy === "created_at_asc") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === "created_at_desc") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === "updated_at_asc") return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
    return list;
  }, [notes, searchQuery, sortBy]);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2" style={{ color: v("text-primary") }}>
          <Folder size={20} style={{ color: v("text-muted") }} />
          Заметки
        </h1>
        <button
          onClick={openNewNote}
          className={`${tw.buttonPrimary} flex items-center gap-1.5`}
        >
          <Plus size={16} /> <span className="hidden sm:inline">Заметка</span>
        </button>
      </div>

      {/* Project tabs */}
      <div className="overflow-x-auto -mx-1 px-1 scrollbar-hide">
        <div className="flex items-center gap-2 min-w-max pb-1">
          {/* "All" tab */}
          <button
            onClick={() => selectProject(null)}
            className="relative px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap"
            style={{
              background: selectedProject === null
                ? isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"
                : "transparent",
              color: selectedProject === null
                ? v("text-primary")
                : v("text-muted"),
              border: `1.5px solid ${selectedProject === null ? (isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)") : "transparent"}`,
            }}
          >
            Все
            {selectedProject === null && (
              <span
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full"
                style={{ background: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.3)" }}
              />
            )}
          </button>

          {/* Project tabs */}
          {projects.map((p) => {
            const isActive = selectedProject === p.id;
            const color = TAB_COLORS[p.color_idx % TAB_COLORS.length];
            return (
              <div key={p.id} className="group relative flex items-center">
                <button
                  onClick={() => selectProject(isActive ? null : p.id)}
                  className="relative px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1.5"
                  style={{
                    background: isActive
                      ? isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"
                      : "transparent",
                    color: isActive ? v("text-primary") : v("text-muted"),
                    border: `1.5px solid ${isActive ? (isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)") : "transparent"}`,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: color, opacity: isActive ? 1 : 0.5 }}
                  />
                  <span className="truncate max-w-[120px]">{p.name}</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleDeleteProject(p);
                  }}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/80 text-white hover:bg-red-500"
                  title="Удалить проект"
                >
                  <X size={10} />
                </button>
              </div>
            );
          })}

          {/* Add project */}
          {showProjectInput ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={projectInput}
                onChange={(e) => setProjectInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleCreateProject();
                  if (e.key === "Escape") { setShowProjectInput(false); setProjectInput(""); }
                }}
                autoFocus
                placeholder="Название проекта"
                className="w-32 px-3 py-1.5 text-sm border rounded-xl"
                style={inputStyle(isDark)}
              />
              <button
                onClick={() => void handleCreateProject()}
                disabled={!projectInput.trim()}
                className="px-2 py-1.5 rounded-xl text-sm font-medium disabled:opacity-50"
                style={buttonStyle("primary", isDark)}
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowProjectInput(true)}
              className="px-3 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1"
              style={{
                color: v("text-muted"),
                border: `1.5px dashed ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}`,
              }}
            >
              <Plus size={14} /> <span className="hidden sm:inline">Проект</span>
            </button>
          )}
        </div>
      </div>

      {/* Search + Sort + Tags */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <div className="relative flex-1 max-w-xs w-full">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: v("text-tertiary") }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию..."
            className="w-full rounded-xl border py-2 pl-9 pr-3 text-sm"
            style={inputStyle(isDark)}
          />
        </div>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border px-3 py-2 pr-8 text-sm appearance-none cursor-pointer"
            style={{ background: v("bg-secondary"), borderColor: v("border-primary"), color: v("text-primary") }}
          >
            <option value="updated_at_desc">Сначала новые</option>
            <option value="updated_at_asc">Сначала старые</option>
            <option value="title_asc">По названию (А→Я)</option>
            <option value="title_desc">По названию (Я→А)</option>
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: v("text-muted") }}
          />
        </div>
        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-xs" style={{ color: v("text-muted") }}>Теги:</span>
            {allTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => selectTag(selectedTagId === tag.id ? null : tag.id)}
                className={selectedTagId === tag.id ? "opacity-100" : "opacity-50 hover:opacity-100 transition-opacity"}
              >
                <TagChip tag={tag} size="sm" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notes list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton-card h-24 rounded-xl" />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <EmptyState
          title="У вас пока нет заметок"
          subtitle="Создайте первую заметку, чтобы начать работу"
          actionLabel="Создать заметку"
          onAction={openNewNote}
        />
      ) : filteredNotes.length === 0 ? (
        <div className="flex items-center justify-center h-40 animate-fade-in">
          <p className="text-sm" style={{ color: v("text-muted") }}>
            Ничего не найдено
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="animate-fade-in rounded-xl border p-4 cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/5"
              style={{ borderColor: v("border-primary"), background: v("bg-card") }}
              onClick={() => openEditNote(note)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-sm" style={{ color: v("text-primary") }}>
                    {note.title}
                  </h3>
                  {note.content_markdown && (
                    <div className="mt-1 text-xs line-clamp-2" style={{ color: v("text-muted") }}>
                      <MarkdownPreview content={note.content_markdown} />
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {note.tags?.map((tag) => <TagChip key={tag.id} tag={tag} size="sm" />)}
                    {note.project_id && (
                      <span className="text-xs" style={{ color: v("text-muted") }}>
                        {projects.find((p) => p.id === note.project_id)?.name || "Без проекта"}
                      </span>
                    )}
                    <span className="text-xs" style={{ color: v("text-muted") }}>
                      {new Date(note.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleDeleteNote(note);
                  }}
                  className="p-1 text-gray-400 hover:text-red-500 shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-2 pb-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg p-2 transition-colors disabled:opacity-30"
            style={{ color: v("text-muted") }}
          >
            <ChevronLeft size={16} />
          </button>
          {pageNumbers.map((p, i) =>
            p === "..." ? (
              <span key={`e${i}`} className="px-1 text-xs" style={{ color: v("text-muted") }}>
                ...
              </span>
            ) : (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`min-w-[32px] rounded-lg px-2 py-1.5 text-sm transition-all ${
                  p === page ? "font-semibold shadow-sm" : "hover:bg-[var(--bg-hover)]"
                }`}
                style={{
                  background: p === page ? v("bg-hover") : "transparent",
                  color: p === page ? v("text-primary") : v("text-muted"),
                  border: p === page ? `1px solid ${v("border-secondary")}` : "1px solid transparent",
                }}
              >
                {p}
              </button>
            ),
          )}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-lg p-2 transition-colors disabled:opacity-30"
            style={{ color: v("text-muted") }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Подтверждение удаления"
        description={
          deleteTarget
            ? `Вы действительно хотите удалить ${deleteTarget.type === "note" ? "заметку" : "проект"} "${
                deleteTarget.title
              }"?`
            : ""
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />

      {/* Editor Modal */}
      {editorOpen && (
        <div className="fixed inset-0 z-[120] grid place-items-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div
            className="w-full max-h-[90vh] overflow-y-auto rounded-2xl border p-4 sm:max-w-2xl sm:p-5"
            style={{ background: v("bg-sidebar"), borderColor: v("border-primary") }}
          >
            <h3 className="text-lg font-semibold mb-3" style={{ color: v("text-primary") }}>
              {editingNote ? "Редактировать заметку" : "Новая заметка"}
            </h3>

            <div className="space-y-3">
              <input
                className={tw.inputBase}
                style={inputStyle(isDark)}
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Заголовок"
              />
              {!noteTitle.trim() && noteTitle !== "" && (
                <p className="text-xs" style={{ color: "#ef4444" }}>
                  Заголовок обязателен
                </p>
              )}

              <select
                className={tw.inputBase}
                style={inputStyle(isDark)}
                value={noteProjectId ?? ""}
                onChange={(e) => setNoteProjectId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Без проекта</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">Теги</label>
                <TagPicker selectedTags={noteTags} onChange={setNoteTags} />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
                  Содержимое (Markdown)
                </label>
                <textarea
                  className={`${tw.inputBase} min-h-[200px] font-mono`}
                  style={inputStyle(isDark)}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Напишите заметку в Markdown..."
                />
                {noteContent && (
                  <div className="mt-2 rounded-xl border p-3" style={{ borderColor: v("border-secondary") }}>
                    <p className="text-xs font-medium mb-1" style={{ color: v("text-muted") }}>
                      Предпросмотр:
                    </p>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <MarkdownPreview content={noteContent} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                className="rounded-xl border px-4 py-2 text-sm"
                style={{ borderColor: v("border-secondary"), color: v("text-secondary") }}
                onClick={() => setEditorOpen(false)}
              >
                Отмена
              </button>
              <button
                className="rounded-xl border px-4 py-2 text-sm"
                style={buttonStyle("primary", isDark)}
                disabled={!noteTitle.trim()}
                onClick={() => void saveNote()}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
