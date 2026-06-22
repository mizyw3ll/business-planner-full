/* eslint-disable @typescript-eslint/no-explicit-any */
type TiptapNode = { type: string; content?: TiptapNode[]; text?: string; marks?: any[]; attrs?: Record<string, any> };

function renderMarks(text: string, marks?: any[]): string {
  if (!marks?.length) return text;
  let result = text;
  for (const mark of marks) {
    const trimmed = result.replace(/\s+$/, "");
    const trailing = result.slice(trimmed.length);
    if (mark.type === "bold") result = `**${trimmed}**${trailing}`;
    else if (mark.type === "italic") result = `*${trimmed}*${trailing}`;
    else if (mark.type === "strike") result = `~~${trimmed}~~${trailing}`;
    else if (mark.type === "code") result = `\`${trimmed}\`${trailing}`;
    else if (mark.type === "highlight") result = `==${trimmed}==${trailing}`;
  }
  return result;
}

function renderNode(node: TiptapNode): string {
  const { type, content, text, marks, attrs } = node;

  if (type === "text" && text != null) return renderMarks(text, marks);

  const children = content?.map(renderNode).join("") ?? "";

  switch (type) {
    case "paragraph":
      return children + "\n";
    case "heading": {
      const level = attrs?.level ?? 1;
      return `${"#".repeat(level)} ${children}\n`;
    }
    case "bulletList":
      return content?.map((item) => `- ${renderListItem(item)}`).join("") ?? "";
    case "orderedList":
      return content?.map((item, i) => `${i + 1}. ${renderListItem(item)}`).join("") ?? "";
    case "listItem":
      return children;
    case "blockquote":
      return children
        .split("\n")
        .filter(Boolean)
        .map((line) => `> ${line}`)
        .join("\n") + "\n";
    case "horizontalRule":
      return "---\n";
    case "codeBlock":
      return `\`\`\`${attrs?.language ?? ""}\n${children}\`\`\`\n`;
    case "table":
      return renderTable(content ?? []) + "\n";
    case "hardBreak":
      return "\n";
    default:
      return children;
  }
}

function renderListItem(item: TiptapNode): string {
  const inner = item.content?.map(renderNode).join("") ?? "";
  return inner.trim() + "\n";
}

function renderTable(rows: TiptapNode[]): string {
  if (!rows.length) return "";
  const lines: string[] = [];
  for (const row of rows) {
    const cells =
      row.content?.map((cell) => {
        return cell.content?.map(renderNode).join("").trim() ?? "";
      }) ?? [];
    lines.push("| " + cells.join(" | ") + " |");
    if (lines.length === 1) {
      lines.push("| " + cells.map(() => "---").join(" | ") + " |");
    }
  }
  return lines.join("\n");
}

export function tiptapToText(doc: any): string {
  if (!doc || doc.type !== "doc" || !doc.content) return "";
  return doc.content
    .map(renderNode)
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
