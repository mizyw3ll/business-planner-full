// ============================================
// Glassmorphism Theme — Indigo + Emerald
// ============================================

export const theme = {
  colors: {
    dark: {
      bg: {
        body: "#07060e",
        primary: "#0d0b1a",
        secondary: "#141225",
        tertiary: "#1b1930",
        card: "rgba(18, 16, 36, 0.72)",
        sidebar: "rgba(13, 11, 26, 0.92)",
        modal: "rgba(22, 20, 40, 0.96)",
        hover: "rgba(99, 102, 241, 0.1)",
        active: "rgba(99, 102, 241, 0.18)",
        input: "rgba(25, 23, 48, 0.7)",
      },
      text: {
        primary: "#f0eeff",
        secondary: "#b0abd8",
        muted: "#706a9e",
        tertiary: "#4a4570",
      },
      border: {
        primary: "rgba(99, 102, 241, 0.18)",
        secondary: "rgba(99, 102, 241, 0.3)",
        muted: "rgba(99, 102, 241, 0.1)",
      },
      accent: {
        primary: "#818cf8",
        secondary: "#6366f1",
      },
    },

    light: {
      bg: {
        body: "#f8f7ff",
        primary: "#ffffff",
        secondary: "#fdfcff",
        tertiary: "#f5f3ff",
        card: "rgba(255, 255, 255, 0.85)",
        sidebar: "rgba(255, 255, 255, 0.96)",
        modal: "rgba(255, 255, 255, 0.99)",
        hover: "rgba(99, 102, 241, 0.06)",
        active: "rgba(99, 102, 241, 0.12)",
        input: "rgba(255, 255, 255, 0.95)",
      },
      text: {
        primary: "#1e1b4b",
        secondary: "#4338ca",
        muted: "#6366f1",
        tertiary: "#818cf8",
      },
      border: {
        primary: "rgba(99, 102, 241, 0.15)",
        secondary: "rgba(99, 102, 241, 0.25)",
        muted: "rgba(99, 102, 241, 0.08)",
      },
      accent: {
        primary: "#4f46e5",
        secondary: "#4338ca",
      },
    },
  },

  cards: {
    business: {
      dark: {
        bg: "rgba(24, 22, 43, 0.8)",
        border: "rgba(99, 102, 241, 0.15)",
        hoverBorder: "rgba(99, 102, 241, 0.35)",
        hoverBg: "rgba(99, 102, 241, 0.08)",
      },
      light: {
        bg: "rgba(255, 255, 255, 0.85)",
        border: "rgba(99, 102, 241, 0.12)",
        hoverBorder: "rgba(99, 102, 241, 0.3)",
        hoverBg: "rgba(99, 102, 241, 0.06)",
      },
    },
    financial: {
      dark: {
        bg: "rgba(24, 22, 43, 0.8)",
        border: "rgba(16, 185, 129, 0.15)",
        hoverBorder: "rgba(16, 185, 129, 0.35)",
        hoverBg: "rgba(16, 185, 129, 0.08)",
      },
      light: {
        bg: "rgba(255, 255, 255, 0.85)",
        border: "rgba(16, 185, 129, 0.12)",
        hoverBorder: "rgba(16, 185, 129, 0.3)",
        hoverBg: "rgba(16, 185, 129, 0.06)",
      },
    },
    note: {
      dark: {
        bg: "rgba(24, 22, 43, 0.8)",
        border: "rgba(245, 158, 11, 0.15)",
        hoverBorder: "rgba(245, 158, 11, 0.35)",
        hoverBg: "rgba(245, 158, 11, 0.08)",
      },
      light: {
        bg: "rgba(255, 255, 255, 0.85)",
        border: "rgba(245, 158, 11, 0.12)",
        hoverBorder: "rgba(245, 158, 11, 0.3)",
        hoverBg: "rgba(245, 158, 11, 0.06)",
      },
    },
  },

  blocks: {
    business: {
      dark: {
        bg: "rgba(24, 22, 43, 0.8)",
        border: "rgba(99, 102, 241, 0.15)",
        hoverBg: "rgba(99, 102, 241, 0.08)",
      },
      light: {
        bg: "rgba(255, 255, 255, 0.85)",
        border: "rgba(99, 102, 241, 0.12)",
        hoverBg: "rgba(99, 102, 241, 0.06)",
      },
    },
  },

  inputs: {
    dark: {
      bg: "rgba(31, 29, 53, 0.6)",
      border: "rgba(99, 102, 241, 0.15)",
      text: "#f0eeff",
    },
    light: {
      bg: "rgba(255, 255, 255, 0.8)",
      border: "rgba(99, 102, 241, 0.12)",
      text: "#1e1b4b",
    },
  },

  buttons: {
    primary: {
      dark: { bg: "#6366f1", text: "#ffffff" },
      light: { bg: "#4f46e5", text: "#ffffff" },
    },
    secondary: {
      dark: { border: "rgba(99, 102, 241, 0.3)", text: "#a5a0d0" },
      light: { border: "rgba(99, 102, 241, 0.25)", text: "#4338ca" },
    },
    danger: {
      dark: {
        border: "rgba(239, 68, 68, 0.4)",
        text: "#fca5a5",
        bg: "rgba(239, 68, 68, 0.1)",
      },
      light: {
        border: "rgba(239, 68, 68, 0.3)",
        text: "#dc2626",
        bg: "rgba(239, 68, 68, 0.06)",
      },
    },
  },

  // Gradient accents
  gradients: {
    primary: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)",
    success: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
    warning: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
    danger: "linear-gradient(135deg, #ef4444 0%, #f87171 100%)",
    glass: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%)",
  },
} as const;

// Helper to get CSS variable
export const v = (name: string) => `var(--${name})`;

// Tailwind classes for common patterns
export const tw = {
  pageContainer: "space-y-8",
  pageTitle: "text-3xl font-bold tracking-tight",
  grid: "grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4",
  cardBase:
    "group block rounded-2xl border p-6 backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-2xl cursor-pointer",
  modalOverlay: "fixed inset-0 z-[90] grid place-items-center p-4 backdrop-blur-md bg-black/60",
  modalContent: "w-full max-w-lg rounded-3xl border p-8 backdrop-blur-2xl shadow-2xl",
  inputBase:
    "w-full rounded-2xl border px-5 py-3 backdrop-blur-sm transition-all duration-200 ease-out focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400",
  buttonBase: "rounded-2xl px-6 py-3 text-sm font-semibold transition-all duration-200 ease-out active:scale-[0.96]",
  buttonPrimary:
    "rounded-2xl px-6 py-3 text-sm font-semibold transition-all duration-200 ease-out hover:shadow-xl hover:shadow-indigo-500/30 active:scale-[0.96] bg-gradient-to-br from-indigo-500 to-indigo-600 text-white",
  buttonSecondary:
    "rounded-2xl border px-6 py-3 text-sm font-semibold transition-all duration-200 ease-out hover:bg-indigo-500/10 active:scale-[0.96]",
  buttonDanger:
    "rounded-2xl border px-6 py-3 text-sm font-semibold transition-all duration-200 ease-out hover:bg-red-500/10 active:scale-[0.96]",
} as const;

// Get card style object for inline styles — glassmorphism with depth
export function cardStyle(type: "business" | "financial" | "note", isDark: boolean) {
  const t = theme.cards[type][isDark ? "dark" : "light"];
  return {
    background: isDark
      ? `linear-gradient(145deg, ${t.bg}, rgba(18,16,36,0.6))`
      : `linear-gradient(145deg, ${t.bg}, rgba(255,255,255,0.65))`,
    border: `1px solid ${isDark ? "rgba(99, 102, 241, 0.22)" : "rgba(99, 102, 241, 0.15)"}`,
    backdropFilter: "var(--glass-blur, blur(28px)) var(--glass-saturate, saturate(1.8))",
    WebkitBackdropFilter: "var(--glass-blur, blur(28px)) var(--glass-saturate, saturate(1.8))",
    boxShadow: isDark
      ? "var(--card-shadow, 0 4px 16px rgba(0,0,0,0.3)), inset 0 1px 0 rgba(255,255,255,0.06)"
      : "var(--card-shadow, 0 4px 12px rgba(99,102,241,0.06)), inset 0 1px 0 rgba(255,255,255,0.8)",
  };
}

// Get input style object
export function inputStyle(isDark: boolean) {
  const t = theme.inputs[isDark ? "dark" : "light"];
  return {
    backgroundColor: t.bg,
    border: `1px solid ${t.border}`,
    color: t.text,
    borderRadius: "12px",
    transition: "all 0.2s ease-out",
  };
}

// Get button style object
export function buttonStyle(variant: "primary" | "secondary" | "danger", isDark: boolean) {
  const mode = isDark ? "dark" : "light";
  if (variant === "primary") {
    const t = theme.buttons.primary[mode];
    return {
      background: t.bg,
      color: t.text,
    };
  }
  if (variant === "secondary") {
    const t = theme.buttons.secondary[mode];
    return {
      border: `1px solid ${t.border}`,
      color: t.text,
    };
  }
  const t = theme.buttons.danger[mode];
  return {
    background: t.bg,
    border: `1px solid ${t.border}`,
    color: t.text,
  };
}
