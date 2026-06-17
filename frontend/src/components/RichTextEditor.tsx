import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useEditor, EditorContent, type Content, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Highlight } from "@tiptap/extension-highlight";
import { Subscript } from "@tiptap/extension-subscript";
import { Image } from "@tiptap/extension-image";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Quote,
  Code,
  FileCode,
  Undo,
  Redo,
  Table as TableIcon,
  Rows3,
  Columns3,
  Trash2,
  SquareX,
  X,
  Strikethrough,
  Highlighter,
  Subscript as SubscriptIcon,
  Paperclip,
  ImageIcon,
  ZoomIn,
  ZoomOut,
  Download,
} from "lucide-react";
import toast from "react-hot-toast";
import { ru } from "../i18n/ru";
import { uploadBlockAttachmentApi } from "../api";
import { inputStyle, tw, v } from "../shared/theme";

export interface RichTextEditorUploadContext {
  planId: number;
  blockId: number;
}

interface RichTextEditorProps {
  content: object | null;
  onChange: (json: object) => void;
  isDark: boolean;
  placeholder?: string;
  readOnly?: boolean;
  uploadContext?: RichTextEditorUploadContext | null;
}

const MARK_LABELS: Record<string, string> = {
  bold: "Bold",
  italic: "Italic",
  strike: "Strike",
  highlight: "Highlight",
  subscript: "Sub",
  code: "Code",
  link: "Link",
};

export function RichTextEditor({
  content,
  onChange,
  isDark,
  placeholder,
  readOnly,
  uploadContext,
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const hoverRef = useRef<HTMLDivElement>(null);
  const [hoverMarks, setHoverMarks] = useState<string[]>([]);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverRafRef = useRef<number>(0);
  const lastSyncedJson = useRef<string>("");
  const settingContent = useRef(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState(1);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false },
      }),
      Highlight.configure({ multicolor: false }),
      Subscript,
      Image.configure({ inline: true, allowBase64: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder: placeholder ?? ru.editor.placeholder }),
    ],
    content: (content && typeof content === "object" && "type" in content ? (content as Content) : undefined),
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: "tiptap-editor focus:outline-none",
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (!readOnly && !settingContent.current) {
        lastSyncedJson.current = JSON.stringify(ed.getJSON());
        onChange(ed.getJSON());
      }
    },
  });

  useEffect(() => {
    if (!editor || content == null) return;
    const incomingStr = JSON.stringify(content);
    if (incomingStr === lastSyncedJson.current) return;
    const currentStr = JSON.stringify(editor.getJSON());
    if (currentStr !== incomingStr) {
      settingContent.current = true;
      editor.commands.setContent(content as Content, { emitUpdate: false });
      settingContent.current = false;
    }
    lastSyncedJson.current = incomingStr;
  }, [editor, content]);

  // --- Hover marks logic ---
  const getMarksAtPos = useCallback(
    (editorInstance: Editor | null, pos: number): string[] => {
      if (!editorInstance) return [];
      const { state } = editorInstance.view;
      const resolved = state.doc.resolve(pos);
      const marks = resolved.marks();
      if (!marks.length) return [];
      return [...new Set(marks.map((m: any) => m.type.name as string).filter((n: string) => MARK_LABELS[n]))];
    },
    [],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!editor || readOnly) return;

      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }

      if (hoverRafRef.current) {
        cancelAnimationFrame(hoverRafRef.current);
      }

      hoverRafRef.current = requestAnimationFrame(() => {
        const editorEl = editorRef.current;
        if (!editorEl) return;

        const rect = editorEl.getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;

        if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
          setHoverMarks([]);
          setHoverPos(null);
          return;
        }

        const coords = editor.view.posAtCoords({ left: x, top: y });
        if (!coords) {
          setHoverMarks([]);
          setHoverPos(null);
          return;
        }

        const marks = getMarksAtPos(editor, coords.pos);
        if (marks.length > 0) {
          setHoverMarks(marks);
          setHoverPos({ x, y });
        } else {
          hoverTimerRef.current = setTimeout(() => {
            setHoverMarks([]);
            setHoverPos(null);
          }, 120);
        }
      });
    },
    [editor, readOnly, getMarksAtPos],
  );

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setHoverMarks([]);
    setHoverPos(null);
  }, []);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (hoverRafRef.current) cancelAnimationFrame(hoverRafRef.current);
    };
  }, []);

  useEffect(() => {
    if (!lightboxSrc) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setLightboxSrc(null); setLightboxZoom(1); }
      if (e.key === "+" || e.key === "=") setLightboxZoom((z) => Math.min(5, z + 0.25));
      if (e.key === "-") setLightboxZoom((z) => Math.max(0.25, z - 0.25));
      if (e.key === "0") setLightboxZoom(1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxSrc]);

  async function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editor) return;
    if (!uploadContext) {
      toast.error(ru.editor.saveBlockFirst);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(ru.editor.fileTooLarge);
      return;
    }
    try {
      const meta = await uploadBlockAttachmentApi(uploadContext.planId, uploadContext.blockId, file);
      const url = meta.url;
      if (file.type.startsWith("image/")) {
        editor.chain().focus().setImage({ src: url, alt: meta.name }).run();
      } else {
        editor.chain().focus().insertContent(`<a href="${url}">${meta.name}</a> `).run();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail || ru.editor.fileUploadError;
      toast.error(msg);
    }
  }

  if (!editor) return null;

  const btn = (active: boolean, onClick: () => void, icon: React.ReactNode, title: string, disabled = false) => (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="rounded-md border p-1.5 text-xs transition-colors disabled:opacity-40"
      style={{
        borderColor: active ? v("border-secondary") : "transparent",
        background: active ? v("bg-hover") : "transparent",
        color: active ? v("text-primary") : v("text-muted"),
      }}
    >
      {icon}
    </button>
  );

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: v("border-primary"), background: v("bg-primary") }}
    >
      {!readOnly && (
        <div className="flex flex-wrap gap-1 px-2 py-1.5" style={{ borderBottom: `1px solid ${v("border-primary")}` }}>
          {btn(
            editor.isActive("bold"),
            () => editor.chain().focus().toggleBold().run(),
            <Bold size={14} />,
            ru.editor.bold,
          )}
          {btn(
            editor.isActive("italic"),
            () => editor.chain().focus().toggleItalic().run(),
            <Italic size={14} />,
            ru.editor.italic,
          )}
          {btn(
            editor.isActive("strike"),
            () => editor.chain().focus().toggleStrike().run(),
            <Strikethrough size={14} />,
            ru.editor.strike,
          )}
          {btn(
            editor.isActive("highlight"),
            () => editor.chain().focus().toggleHighlight().run(),
            <Highlighter size={14} />,
            ru.editor.highlight,
          )}
          {btn(
            editor.isActive("subscript"),
            () => editor.chain().focus().toggleSubscript().run(),
            <SubscriptIcon size={14} />,
            ru.editor.subscript,
          )}
          {btn(
            editor.isActive("heading", { level: 2 }),
            () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
            <Heading2 size={14} />,
            ru.editor.heading,
          )}
          {btn(
            editor.isActive("bulletList"),
            () => editor.chain().focus().toggleBulletList().run(),
            <List size={14} />,
            ru.editor.bulletList,
          )}
          {btn(
            editor.isActive("orderedList"),
            () => editor.chain().focus().toggleOrderedList().run(),
            <ListOrdered size={14} />,
            ru.editor.orderedList,
          )}
          {btn(
            editor.isActive("blockquote"),
            () => editor.chain().focus().toggleBlockquote().run(),
            <Quote size={14} />,
            ru.editor.quote,
          )}
          {btn(
            editor.isActive("code"),
            () => editor.chain().focus().toggleCode().run(),
            <Code size={14} />,
            ru.editor.code,
          )}
          {btn(
            editor.isActive("codeBlock"),
            () => editor.chain().focus().toggleCodeBlock().run(),
            <FileCode size={14} />,
            ru.editor.codeBlock,
          )}
          <div className="mx-1 w-px self-stretch" style={{ background: v("border-primary") }} />
          {btn(
            false,
            () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
            <TableIcon size={14} />,
            ru.editor.table,
          )}
          {btn(false, () => editor.chain().focus().addRowAfter().run(), <Rows3 size={14} />, ru.editor.addRow)}
          {btn(false, () => editor.chain().focus().deleteRow().run(), <Trash2 size={14} />, ru.editor.deleteRow)}
          {btn(false, () => editor.chain().focus().addColumnAfter().run(), <Columns3 size={14} />, ru.editor.addColumn)}
          {btn(false, () => editor.chain().focus().deleteColumn().run(), <SquareX size={14} />, ru.editor.deleteColumn)}
          {btn(false, () => editor.chain().focus().deleteTable().run(), <X size={14} />, ru.editor.deleteTable)}
          <div className="mx-1 w-px self-stretch" style={{ background: v("border-primary") }} />
          {btn(
            false,
            () => fileInputRef.current?.click(), // eslint-disable-line react-hooks/refs
            <Paperclip size={14} />,
            ru.editor.attachFile,
            !uploadContext,
          )}
          {btn(
            false,
            () => fileInputRef.current?.click(), // eslint-disable-line react-hooks/refs
            <ImageIcon size={14} />,
            ru.editor.insertImage,
            !uploadContext,
          )}
          <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => void handleFilePick(e)} />
          <div className="mx-1 w-px self-stretch" style={{ background: v("border-primary") }} />
          {btn(false, () => editor.chain().focus().undo().run(), <Undo size={14} />, ru.editor.undo)}
          {btn(false, () => editor.chain().focus().redo().run(), <Redo size={14} />, ru.editor.redo)}
        </div>
      )}
      <div
        ref={editorRef}
        className={`p-3 text-sm tiptap ${readOnly ? "" : tw.inputBase}`}
        style={readOnly ? { minHeight: 120 } : { ...inputStyle(isDark), minHeight: 200 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.tagName === "IMG") {
            e.preventDefault();
            setLightboxSrc((target as HTMLImageElement).src);
          }
        }}
      >
        <EditorContent editor={editor} />
      </div>
      {lightboxSrc &&
        createPortal(
          <div
            className="image-lightbox"
            onClick={() => { setLightboxSrc(null); setLightboxZoom(1); }}
            onWheel={(e) => {
              e.preventDefault();
              setLightboxZoom((z) => Math.min(5, Math.max(0.25, z + (e.deltaY < 0 ? 0.15 : -0.15))));
            }}
          >
            <div className="fixed top-4 right-4 z-[10001] flex items-center gap-2">
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/50 text-white transition-colors hover:bg-black/70"
                onClick={(e) => { e.stopPropagation(); setLightboxZoom((z) => Math.min(5, z + 0.25)); }}
              >
                <ZoomIn size={18} />
              </button>
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/50 text-white transition-colors hover:bg-black/70"
                onClick={(e) => { e.stopPropagation(); setLightboxZoom((z) => Math.max(0.25, z - 0.25)); }}
              >
                <ZoomOut size={18} />
              </button>
              <span className="text-xs text-white/60 min-w-[3rem] text-center">{Math.round(lightboxZoom * 100)}%</span>
              <a
                href={lightboxSrc}
                download
                className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/50 text-white transition-colors hover:bg-black/70"
                onClick={(e) => e.stopPropagation()}
              >
                <Download size={18} />
              </a>
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-black/50 text-white transition-colors hover:bg-black/70"
                onClick={() => { setLightboxSrc(null); setLightboxZoom(1); }}
              >
                <X size={20} />
              </button>
            </div>
            <img
              src={lightboxSrc}
              alt=""
              onClick={(e) => e.stopPropagation()}
              style={{ transform: `scale(${lightboxZoom})`, transition: "transform 0.15s ease" }}
            />
          </div>,
          document.body,
        )}
      {hoverMarks.length > 0 && hoverPos && (
        <div
          ref={hoverRef}
          className="tiptap-hover-marks"
          data-theme={isDark ? "dark" : "light"}
          style={{
            left: hoverPos.x,
            top: hoverPos.y,
          }}
        >
          {hoverMarks.map((m) => (
            <span key={m} className="mark-tag">
              {MARK_LABELS[m]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
