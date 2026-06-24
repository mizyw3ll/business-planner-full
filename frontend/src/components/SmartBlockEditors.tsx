import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { normalizeSwotData, type SwotData } from "../lib/blockDefaults";
import { MarkdownPreview } from "./MarkdownPreview";
import { ru } from "../i18n/ru";
import { tw, inputStyle, buttonStyle, v } from "../shared/theme";

/* ─── SWOT ─── */
export function SwotEditor({
  value,
  onChange,
  isDark,
}: {
  value: object;
  onChange: (v: object) => void;
  isDark: boolean;
}) {
  const data: SwotData = normalizeSwotData(value);
  const quadrants: { key: keyof SwotData; label: string; color: string }[] = [
    { key: "strengths", label: ru.swot.strengths, color: "#16a34a" },
    { key: "weaknesses", label: ru.swot.weaknesses, color: "#dc2626" },
    { key: "opportunities", label: ru.swot.opportunities, color: "#2563eb" },
    { key: "threats", label: ru.swot.threats, color: "#ea580c" },
  ];

  function update(key: keyof SwotData, items: string[]) {
    onChange({ ...data, [key]: items });
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {quadrants.map(({ key, label, color }) => (
        <div
          key={key}
          className="rounded-xl border p-3"
          style={{ borderColor: v("border-primary"), background: v("bg-primary") }}
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color }}>
            {label}
          </p>
          <div className="space-y-2">
            {(data[key] ?? [""]).map((item, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  className={tw.inputBase + " flex-1 text-sm"}
                  style={inputStyle(isDark)}
                  value={item}
                  onChange={(e) => {
                    const next = [...(data[key] ?? [])];
                    next[idx] = e.target.value;
                    update(key, next);
                  }}
                  placeholder={ru.swot.itemPlaceholder}
                />
                <button
                  type="button"
                  className="shrink-0 rounded-lg border px-2 py-1 text-xs"
                  style={buttonStyle("danger", isDark)}
                  onClick={() => {
                    const next = [...(data[key] ?? [])];
                    next.splice(idx, 1);
                    update(key, next.length ? next : [""]);
                  }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="mt-2 inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs"
            style={{ borderColor: v("border-secondary"), color: v("text-secondary") }}
            onClick={() => update(key, [...(data[key] ?? []), ""])}
          >
            <Plus size={12} /> {ru.common.add}
          </button>
        </div>
      ))}
    </div>
  );
}

/* ─── Timeline ─── */
interface Milestone {
  title: string;
  date: string;
  description: string;
}

export function TimelineEditor({
  value,
  onChange,
  isDark,
}: {
  value: object;
  onChange: (v: object) => void;
  isDark: boolean;
}) {
  const milestones: Milestone[] = (value as { milestones?: Milestone[] })?.milestones ?? [
    { title: "", date: "", description: "" },
  ];

  function updateMilestones(next: Milestone[]) {
    onChange({ milestones: next });
  }

  return (
    <div className="space-y-3">
      {milestones.map((m, idx) => (
        <div
          key={idx}
          className="rounded-xl border p-3"
          style={{ borderColor: v("border-primary"), background: v("bg-primary") }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold" style={{ color: v("text-muted") }}>
              {ru.timeline.milestone(idx + 1)}
            </span>
            <button
              type="button"
              className="rounded-lg border px-2 py-1 text-xs"
              style={buttonStyle("danger", isDark)}
              onClick={() => {
                const next = [...milestones];
                next.splice(idx, 1);
                updateMilestones(next.length ? next : [{ title: "", date: "", description: "" }]);
              }}
            >
              <Trash2 size={12} />
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              className={tw.inputBase + " text-sm"}
              style={inputStyle(isDark)}
              value={m.title}
              onChange={(e) => {
                const next = [...milestones];
                next[idx] = { ...m, title: e.target.value };
                updateMilestones(next);
              }}
              placeholder={ru.timeline.title}
            />
            <input
              type="date"
              className={tw.inputBase + " text-sm"}
              style={inputStyle(isDark)}
              value={m.date}
              min="2000-01-01"
              max="2099-12-31"
              onChange={(e) => {
                const next = [...milestones];
                next[idx] = { ...m, date: e.target.value };
                updateMilestones(next);
              }}
            />
          </div>
          <textarea
            className={tw.inputBase + " mt-2 text-sm"}
            style={inputStyle(isDark)}
            value={m.description}
            onChange={(e) => {
              const next = [...milestones];
              next[idx] = { ...m, description: e.target.value };
              updateMilestones(next);
            }}
            placeholder={ru.timeline.description}
            rows={2}
          />
        </div>
      ))}
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs"
        style={buttonStyle("primary", isDark)}
        onClick={() => updateMilestones([...milestones, { title: "", date: "", description: "" }])}
      >
        <Plus size={14} /> {ru.timeline.add}
      </button>
    </div>
  );
}

/* ─── Metrics ─── */
interface Metric {
  label: string;
  value: string;
  unit: string;
  change?: string;
}

export function MetricsEditor({
  value,
  onChange,
  isDark,
}: {
  value: object;
  onChange: (v: object) => void;
  isDark: boolean;
}) {
  const metrics: Metric[] = (value as { metrics?: Metric[] })?.metrics ?? [{ label: "", value: "", unit: "" }];

  function updateMetrics(next: Metric[]) {
    onChange({ metrics: next });
  }

  return (
    <div className="space-y-3">
      {metrics.map((m, idx) => (
        <div
          key={idx}
          className="rounded-xl border p-3"
          style={{ borderColor: v("border-primary"), background: v("bg-primary") }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold" style={{ color: v("text-muted") }}>
              {ru.metrics.metric(idx + 1)}
            </span>
            <button
              type="button"
              className="rounded-lg border px-2 py-1 text-xs"
              style={buttonStyle("danger", isDark)}
              onClick={() => {
                const next = [...metrics];
                next.splice(idx, 1);
                updateMetrics(next.length ? next : [{ label: "", value: "", unit: "" }]);
              }}
            >
              <Trash2 size={12} />
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <input
              className={tw.inputBase + " text-sm"}
              style={inputStyle(isDark)}
              value={m.label}
              onChange={(e) => {
                const next = [...metrics];
                next[idx] = { ...m, label: e.target.value };
                updateMetrics(next);
              }}
              placeholder={ru.metrics.label}
            />
            <input
              className={tw.inputBase + " text-sm"}
              style={inputStyle(isDark)}
              value={m.value}
              onChange={(e) => {
                const next = [...metrics];
                next[idx] = { ...m, value: e.target.value };
                updateMetrics(next);
              }}
              placeholder={ru.metrics.value}
            />
            <input
              className={tw.inputBase + " text-sm"}
              style={inputStyle(isDark)}
              value={m.unit}
              onChange={(e) => {
                const next = [...metrics];
                next[idx] = { ...m, unit: e.target.value };
                updateMetrics(next);
              }}
              placeholder={ru.metrics.unit}
            />
          </div>
          <input
            className={tw.inputBase + " mt-2 text-sm"}
            style={inputStyle(isDark)}
            value={m.change ?? ""}
            onChange={(e) => {
              const next = [...metrics];
              next[idx] = { ...m, change: e.target.value };
              updateMetrics(next);
            }}
            placeholder={ru.metrics.change}
          />
        </div>
      ))}
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs"
        style={buttonStyle("primary", isDark)}
        onClick={() => updateMetrics([...metrics, { label: "", value: "", unit: "" }])}
      >
        <Plus size={14} /> {ru.metrics.add}
      </button>
    </div>
  );
}

/* ─── Markdown ─── */
export function MarkdownEditor({
  value,
  onChange,
  isDark,
}: {
  value: object;
  onChange: (v: object) => void;
  isDark: boolean;
}) {
  const md = (value as { markdown?: string })?.markdown ?? "";
  const [preview, setPreview] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          className="rounded-lg border px-3 py-1 text-xs"
          style={
            !preview
              ? buttonStyle("primary", isDark)
              : { borderColor: v("border-secondary"), color: v("text-secondary") }
          }
          onClick={() => setPreview(false)}
        >
          {ru.markdown.edit}
        </button>
        <button
          type="button"
          className="rounded-lg border px-3 py-1 text-xs"
          style={
            preview
              ? buttonStyle("primary", isDark)
              : { borderColor: v("border-secondary"), color: v("text-secondary") }
          }
          onClick={() => setPreview(true)}
        >
          {ru.markdown.preview}
        </button>
      </div>
      {!preview ? (
        <textarea
          className={tw.inputBase + " text-sm font-mono"}
          style={inputStyle(isDark)}
          value={md}
          onChange={(e) => onChange({ markdown: e.target.value })}
          placeholder={ru.markdown.placeholder}
          rows={8}
        />
      ) : (
        <div
          className="rounded-xl border p-3 text-sm"
          style={{ borderColor: v("border-primary"), background: v("bg-primary"), color: v("text-primary") }}
        >
          {md ? (
            <MarkdownPreview content={md} />
          ) : (
            <span style={{ color: v("text-muted") }}>{ru.markdown.emptyPreview}</span>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Checklist ─── */
interface CheckItem {
  text: string;
  checked: boolean;
}

export function ChecklistEditor({
  value,
  onChange,
  isDark,
}: {
  value: object;
  onChange: (v: object) => void;
  isDark: boolean;
}) {
  const items: CheckItem[] = (value as { items?: CheckItem[] })?.items ?? [{ text: "", checked: false }];

  function updateItems(next: CheckItem[]) {
    onChange({ items: next });
  }

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <input
            type="checkbox"
            className="shrink-0"
            checked={item.checked}
            onChange={(e) => {
              const next = [...items];
              next[idx] = { ...item, checked: e.target.checked };
              updateItems(next);
            }}
          />
          <input
            className={tw.inputBase + " flex-1 text-sm"}
            style={inputStyle(isDark)}
            value={item.text}
            onChange={(e) => {
              const next = [...items];
              next[idx] = { ...item, text: e.target.value };
              updateItems(next);
            }}
            placeholder={ru.checklist.itemPlaceholder}
          />
          <button
            type="button"
            className="shrink-0 rounded-lg border px-2 py-1 text-xs"
            style={buttonStyle("danger", isDark)}
            onClick={() => {
              const next = [...items];
              next.splice(idx, 1);
              updateItems(next.length ? next : [{ text: "", checked: false }]);
            }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs"
        style={buttonStyle("primary", isDark)}
        onClick={() => updateItems([...items, { text: "", checked: false }])}
      >
        <Plus size={14} /> {ru.checklist.add}
      </button>
    </div>
  );
}
