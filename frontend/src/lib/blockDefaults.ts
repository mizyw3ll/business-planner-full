export const RICH_TEXT_BLOCK_TYPES = ["general", "financial", "marketing", "operations"] as const;

export const SMART_BLOCK_TYPES = ["swot", "timeline", "metrics", "markdown", "checklist", "chart_embed"] as const;

export type SwotData = {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
};

const EMPTY_TIPTAP_DOC = { type: "doc", content: [] };

export function isRichTextBlockType(blockType: string): boolean {
  return (RICH_TEXT_BLOCK_TYPES as readonly string[]).includes(blockType);
}

export function getDefaultRichContent(blockType: string): object {
  switch (blockType) {
    case "swot":
      return {
        strengths: [""],
        weaknesses: [""],
        opportunities: [""],
        threats: [""],
      };
    case "timeline":
      return { milestones: [{ title: "", date: "", description: "" }] };
    case "metrics":
      return { metrics: [{ label: "", value: "", unit: "" }] };
    case "markdown":
      return { markdown: "" };
    case "checklist":
      return { items: [{ text: "", checked: false }] };
    case "chart_embed":
      return {};
    default:
      return { ...EMPTY_TIPTAP_DOC };
  }
}

export function normalizeSwotData(value: unknown): SwotData {
  const data = (value && typeof value === "object" ? value : {}) as Partial<SwotData>;
  const keys: (keyof SwotData)[] = ["strengths", "weaknesses", "opportunities", "threats"];
  const result = {} as SwotData;
  for (const key of keys) {
    const arr = data[key];
    result[key] = Array.isArray(arr) && arr.length > 0 ? [...arr] : [""];
  }
  return result;
}

export function normalizeRichContentForBlockType(blockType: string, richContent: unknown): object {
  if (blockType === "swot") {
    return normalizeSwotData(richContent);
  }
  if (richContent && typeof richContent === "object" && Object.keys(richContent as object).length > 0) {
    return richContent as object;
  }
  return getDefaultRichContent(blockType);
}
