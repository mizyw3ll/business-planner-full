export function textToTiptapDoc(text: string) {
  const lines = text.split(/\r?\n/).map((line) => line.trim());
  return {
    type: "doc",
    content: lines.length ? parseBlocks(lines) : [{ type: "paragraph", content: [{ type: "text", text }] }],
  };
}

function parseBlocks(lines: string[]) {
  const nodes: object[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line) {
      i++;
      continue;
    }

    const hMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (hMatch) {
      nodes.push({ type: "heading", attrs: { level: hMatch[1].length }, content: parseInline(hMatch[2]) });
      i++;
      continue;
    }

    if (line.match(/^[-*+]\s+/)) {
      const items: object[] = [];
      while (i < lines.length && lines[i].match(/^[-*+]\s+/)) {
        items.push({
          type: "listItem",
          content: [{ type: "paragraph", content: parseInline(lines[i].replace(/^[-*+]\s+/, "")) }],
        });
        i++;
      }
      nodes.push({ type: "bulletList", content: items });
      continue;
    }

    const oMatch = line.match(/^\d+[.)]\s+/);
    if (oMatch) {
      const items: object[] = [];
      while (i < lines.length && lines[i].match(/^\d+[.)]\s+/)) {
        items.push({
          type: "listItem",
          content: [{ type: "paragraph", content: parseInline(lines[i].replace(/^\d+[.)]\s+/, "")) }],
        });
        i++;
      }
      nodes.push({ type: "orderedList", content: items });
      continue;
    }

    if (line.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      nodes.push({ type: "blockquote", content: [{ type: "paragraph", content: parseInline(quoteLines.join("\n")) }] });
      continue;
    }

    if (/^[-*_]{3,}$/.test(line)) {
      nodes.push({ type: "horizontalRule" });
      i++;
      continue;
    }

    if (i > 0 && !lines[i - 1]) {
      i++;
      continue;
    }

    nodes.push({ type: "paragraph", content: parseInline(line) });
    i++;
  }
  return nodes;
}

function parseInline(text: string) {
  const result: { type: string; text: string; marks?: object[] }[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      result.push({ type: "text", text: codeMatch[1], marks: [{ type: "code" }] });
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    const biMatch = remaining.match(/^\*\*\*(.+?)\*\*\*/);
    if (biMatch) {
      result.push({ type: "text", text: biMatch[1], marks: [{ type: "bold" }, { type: "italic" }] });
      remaining = remaining.slice(biMatch[0].length);
      continue;
    }

    const bMatch = remaining.match(/^\*\*(.+?)\*\*/);
    if (bMatch) {
      result.push({ type: "text", text: bMatch[1], marks: [{ type: "bold" }] });
      remaining = remaining.slice(bMatch[0].length);
      continue;
    }

    const iMatch = remaining.match(/^\*(.+?)\*/);
    if (iMatch) {
      result.push({ type: "text", text: iMatch[1], marks: [{ type: "italic" }] });
      remaining = remaining.slice(iMatch[0].length);
      continue;
    }

    const sMatch = remaining.match(/^~~(.+?)~~/);
    if (sMatch) {
      result.push({ type: "text", text: sMatch[1], marks: [{ type: "strike" }] });
      remaining = remaining.slice(sMatch[0].length);
      continue;
    }

    const hMatch = remaining.match(/^==(.+?)==/);
    if (hMatch) {
      result.push({ type: "text", text: hMatch[1], marks: [{ type: "highlight" }] });
      remaining = remaining.slice(hMatch[0].length);
      continue;
    }

    const nextSpecial = remaining.search(/[*~`]/);
    if (nextSpecial === 0) {
      result.push({ type: "text", text: remaining[0] });
      remaining = remaining.slice(1);
    } else if (nextSpecial > 0) {
      result.push({ type: "text", text: remaining.slice(0, nextSpecial) });
      remaining = remaining.slice(nextSpecial);
    } else {
      result.push({ type: "text", text: remaining });
      remaining = "";
    }
  }

  return result;
}
