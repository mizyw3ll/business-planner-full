import { memo } from "react";
import type { ReactNode, CSSProperties } from "react";
import clsx from "clsx";

type GlassCardProps = {
  children: ReactNode;
  className?: string;
  accent?: "indigo" | "emerald" | "amber" | "rose" | "sky";
  hover?: boolean;
  onClick?: () => void;
  as?: "div" | "a" | "button";
  href?: string;
  padding?: "normal" | "compact" | "none";
};

const accentConfig: Record<string, { bar: string; glow: string; shadow: string; borderHover: string; glowColor: string }> = {
  indigo: {
    bar: "linear-gradient(90deg, #818cf8, #c7d2fe, #818cf8)",
    glow: "radial-gradient(circle at 100% 0%, rgba(99,102,241,0.15), transparent 70%)",
    shadow: "hover:shadow-indigo-500/20",
    borderHover: "hover:border-indigo-400/60",
    glowColor: "rgba(99, 102, 241, 0.5)",
  },
  emerald: {
    bar: "linear-gradient(90deg, #34d399, #a7f3d0, #34d399)",
    glow: "radial-gradient(circle at 100% 0%, rgba(16,185,129,0.15), transparent 70%)",
    shadow: "hover:shadow-emerald-500/20",
    borderHover: "hover:border-emerald-400/60",
    glowColor: "rgba(16, 185, 129, 0.5)",
  },
  amber: {
    bar: "linear-gradient(90deg, #fbbf24, #fde68a, #fbbf24)",
    glow: "radial-gradient(circle at 100% 0%, rgba(245,158,11,0.15), transparent 70%)",
    shadow: "hover:shadow-amber-500/20",
    borderHover: "hover:border-amber-400/60",
    glowColor: "rgba(245, 158, 11, 0.5)",
  },
  rose: {
    bar: "linear-gradient(90deg, #fb7185, #fecdd3, #fb7185)",
    glow: "radial-gradient(circle at 100% 0%, rgba(244,63,94,0.15), transparent 70%)",
    shadow: "hover:shadow-rose-500/20",
    borderHover: "hover:border-rose-400/60",
    glowColor: "rgba(244, 63, 94, 0.5)",
  },
  sky: {
    bar: "linear-gradient(90deg, #38bdf8, #bae6fd, #38bdf8)",
    glow: "radial-gradient(circle at 100% 0%, rgba(14,165,233,0.15), transparent 70%)",
    shadow: "hover:shadow-sky-500/20",
    borderHover: "hover:border-sky-400/60",
    glowColor: "rgba(14, 165, 233, 0.5)",
  },
};

const paddingMap: Record<string, string> = {
  normal: "p-6",
  compact: "p-4",
  none: "p-0",
};

export const GlassCard = memo(function GlassCard({
  children,
  className,
  accent = "indigo",
  hover = true,
  onClick,
  as = "div",
  href,
  padding = "normal",
}: GlassCardProps) {
  const cfg = accentConfig[accent];

  const base = clsx(
    "group relative rounded-2xl border backdrop-blur-md transition-all duration-500 ease-out flex flex-col",
    paddingMap[padding],
    hover && [
      "hover:-translate-y-1.5",
      "hover:shadow-glow",
      cfg.borderHover,
      "cursor-pointer",
    ],
    className,
  );

  const style: CSSProperties = {
    background: "var(--bg-card)",
    borderColor: "var(--border-primary)",
    boxShadow: `var(--card-shadow, 0 4px 12px rgba(0,0,0,0.25)), inset 0 1px 0 rgba(255,255,255,0.05)`,
    overflow: "hidden",
  };

  const content = (
    <>
      {/* Accent Bar */}
      <div className="absolute top-0 left-0 right-0 h-[2.5px] opacity-90 z-20" style={{ background: cfg.bar }} />
      
      {/* Background Subtle Accent */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ background: cfg.glow }} />

      <div className="relative z-10 flex flex-col flex-1">{children}</div>
      
      {/* External Bloom Glow on Hover — Toned down */}
      <div 
        className="absolute inset-0 -z-20 opacity-0 group-hover:opacity-100 transition-all duration-700 blur-[30px] pointer-events-none scale-105"
        style={{ 
          background: `radial-gradient(circle at center, ${cfg.glowColor}, transparent 75%)`,
          margin: '-20px' 
        }}
      />
    </>
  );

  if (as === "a" && href) {
    return (
      <a href={href} className={base} style={style}>
        {content}
      </a>
    );
  }

  if (as === "button") {
    return (
      <button type="button" onClick={onClick} className={base} style={style}>
        {content}
      </button>
    );
  }

  return (
    <div onClick={onClick} className={base} style={style}>
      {content}
    </div>
  );
});
