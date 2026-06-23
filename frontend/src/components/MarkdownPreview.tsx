import { memo } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

function highlightMdToHtml(md: string): string {
  return md.replace(/==(.+?)==/g, "<mark>$1</mark>");
}

const mdComponents = {
  p: ({ children, ...props }: any) => <p className="mb-1 last:mb-0 leading-relaxed text-sm sm:text-base" {...props}>{children}</p>,
  strong: ({ children, ...props }: any) => <strong className="font-semibold" {...props}>{children}</strong>,
  em: ({ children, ...props }: any) => <em className="italic" {...props}>{children}</em>,
  del: ({ children, ...props }: any) => <del className="line-through opacity-60" {...props}>{children}</del>,
  code: ({ children, className: cls, ...props }: any) => {
    const isBlock = cls?.includes("language-");
    return isBlock
      ? <code className="block p-2 my-1 rounded text-xs font-mono bg-black/5 dark:bg-white/10 overflow-x-auto whitespace-pre" {...props}>{children}</code>
      : <code className="px-1 py-0.5 rounded text-xs font-mono bg-black/5 dark:bg-white/10" {...props}>{children}</code>;
  },
  pre: ({ children, ...props }: any) => <pre className="my-1 overflow-x-auto" {...props}>{children}</pre>,
  ul: ({ children, ...props }: any) => <ul className="list-disc pl-5 mb-1 space-y-0.5" {...props}>{children}</ul>,
  ol: ({ children, ...props }: any) => <ol className="list-decimal pl-5 mb-1 space-y-0.5" {...props}>{children}</ol>,
  li: ({ children, ordered, ...props }: any) => <li className="leading-relaxed" {...props}>{children}</li>,
  a: ({ children, href, ...props }: any) => <a href={href} className="underline text-blue-500 hover:text-blue-600" target="_blank" rel="noopener noreferrer" {...props}>{children}</a>,
  h1: ({ children, ...props }: any) => <h1 className="text-sm sm:text-lg font-bold mb-1 mt-2 first:mt-0" {...props}>{children}</h1>,
  h2: ({ children, ...props }: any) => <h2 className="text-xs sm:text-base font-bold mb-1 mt-2 first:mt-0" {...props}>{children}</h2>,
  h3: ({ children, ...props }: any) => <h3 className="text-xs sm:text-sm font-bold mb-1 mt-2 first:mt-0" {...props}>{children}</h3>,
  h4: ({ children, ...props }: any) => <h4 className="text-xs sm:text-sm font-semibold mb-1 mt-1 first:mt-0" {...props}>{children}</h4>,
  blockquote: ({ children, ...props }: any) => <blockquote className="pl-3 border-l-2 border-current opacity-60 italic my-1" {...props}>{children}</blockquote>,
  hr: (props: any) => <hr className="my-2 border-current opacity-20" {...props} />,
  mark: ({ children, ...props }: any) => <mark className="px-0.5 rounded bg-yellow-200/60 dark:bg-yellow-500/30" {...props}>{children}</mark>,
  table: ({ children, ...props }: any) => <div className="overflow-x-auto my-1"><table className="w-full text-sm border-collapse" {...props}>{children}</table></div>,
  thead: ({ children, ...props }: any) => <thead className="border-b border-current opacity-30" {...props}>{children}</thead>,
  tbody: ({ children, ...props }: any) => <tbody {...props}>{children}</tbody>,
  tr: ({ children, ...props }: any) => <tr className="border-b border-current/10 last:border-0" {...props}>{children}</tr>,
  th: ({ children, ...props }: any) => <th className="text-left px-2 py-1 font-semibold" {...props}>{children}</th>,
  td: ({ children, ...props }: any) => <td className="px-2 py-1" {...props}>{children}</td>,
  input: ({ checked, ...props }: any) => (
    <input type="checkbox" checked={checked} readOnly className="mr-1 align-middle accent-blue-500" {...props} />
  ),
  img: ({ src, alt, ...props }: any) => <img src={src} alt={alt || ""} className="max-w-full rounded my-1" {...props} />,
};

export const MarkdownPreview = memo(function MarkdownPreview({ content, className = "" }: MarkdownPreviewProps) {
  const html = highlightMdToHtml(content);
  return (
    <div className={className}>
      <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={mdComponents}>{html}</Markdown>
    </div>
  );
});
