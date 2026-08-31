// ─── OMDALA Design System v2 — Theme Tokens ─────────────────────────────
// Sáng tạo · Thông minh · Nhẹ nhàng

export const THEME = {
  colors: {
    // Core palette
    midnight: "#060d1a",
    deep: "#0a1628",
    surface: "#0f1d33",
    surfaceHighlight: "#152440",
    elevated: "#1a2e4d",

    // Accent — Oceanic cyan gradient
    accent: "#7ef2ff",
    accentSoft: "#a8f5ff",
    accentGlow: "rgba(126, 242, 255, 0.15)",
    accentBorder: "rgba(126, 242, 255, 0.25)",

    // Semantic
    success: "#4ade80",
    warning: "#fbbf24",
    danger: "#f87171",
    info: "#60a5fa",

    // Text
    textPrimary: "#f7fbff",
    textSecondary: "#a8b9d0",
    textMuted: "#6b7f99",
    textInverse: "#060d1a",

    // Border
    borderSubtle: "rgba(255,255,255,0.06)",
    borderDefault: "rgba(255,255,255,0.1)",
    borderFocus: "rgba(126, 242, 255, 0.4)",
  },

  spacing: {
    0: "0",
    1: "0.25rem",   // 4px
    2: "0.5rem",    // 8px
    3: "0.75rem",   // 12px
    4: "1rem",      // 16px
    5: "1.25rem",   // 20px
    6: "1.5rem",    // 24px
    8: "2rem",      // 32px
    10: "2.5rem",   // 40px
    12: "3rem",     // 48px
    16: "4rem",     // 64px
    20: "5rem",     // 80px
    24: "6rem",     // 96px
  },

  radius: {
    sm: "0.375rem",    // 6px
    md: "0.5rem",      // 8px
    lg: "0.75rem",     // 12px
    xl: "1rem",        // 16px
    "2xl": "1.25rem",  // 20px
    full: "9999px",
  },

  font: {
    sans: "'Inter', 'SF Pro Display', 'Segoe UI', system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
    display: "'Inter', 'SF Pro Display', sans-serif",
  },

  size: {
    xs: "0.75rem",    // 12px
    sm: "0.875rem",   // 14px
    base: "1rem",     // 16px
    lg: "1.125rem",    // 18px
    xl: "1.25rem",     // 20px
    "2xl": "1.5rem",   // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem",  // 36px
    "5xl": "3rem",     // 48px
  },

  shadow: {
    sm: "0 1px 2px rgba(0,0,0,0.3)",
    md: "0 4px 6px rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.15)",
    lg: "0 10px 15px rgba(0,0,0,0.25), 0 4px 6px rgba(0,0,0,0.15)",
    glow: "0 0 20px rgba(126, 242, 255, 0.15), 0 0 40px rgba(126, 242, 255, 0.05)",
    glowStrong: "0 0 30px rgba(126, 242, 255, 0.25), 0 0 60px rgba(126, 242, 255, 0.1)",
  },

  transition: {
    fast: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
    base: "200ms cubic-bezier(0.4, 0, 0.2, 1)",
    slow: "300ms cubic-bezier(0.4, 0, 0.2, 1)",
    spring: "400ms cubic-bezier(0.34, 1.56, 0.64, 1)",
  },

  z: {
    base: 0,
    dropdown: 50,
    sticky: 100,
    overlay: 200,
    modal: 300,
    toast: 400,
    tooltip: 500,
    command: 600,
  },
} as const;

export type Theme = typeof THEME;

// ─── Glassmorphism Utilities ─────────────────────────────────────────────

export const glass = {
  base: {
    background: "rgba(15, 29, 51, 0.7)",
    backdropFilter: "blur(16px) saturate(180%)",
    WebkitBackdropFilter: "blur(16px) saturate(180%)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  elevated: {
    background: "rgba(21, 36, 64, 0.8)",
    backdropFilter: "blur(24px) saturate(180%)",
    WebkitBackdropFilter: "blur(24px) saturate(180%)",
    border: "1px solid rgba(126, 242, 255, 0.12)",
    boxShadow: THEME.shadow.glow,
  },
  subtle: {
    background: "rgba(6, 13, 26, 0.4)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.04)",
  },
} as const;

// ─── Animation Keyframes (CSS-in-JS ready) ─────────────────────────────────

export const animations = {
  fadeIn: `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `,
  slideUp: `
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `,
  scaleIn: `
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `,
  shimmer: `
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `,
  pulseGlow: `
    @keyframes pulseGlow {
      0%, 100% { box-shadow: 0 0 20px rgba(126, 242, 255, 0.1); }
      50% { box-shadow: 0 0 30px rgba(126, 242, 255, 0.25); }
    }
  `,
  float: `
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }
  `,
  typing: `
    @keyframes typing {
      from { width: 0; }
      to { width: 100%; }
    }
  `,
  blink: `
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
  `,
} as const;

// ─── Gradient Utilities ──────────────────────────────────────────────────

export const gradients = {
  hero: "linear-gradient(135deg, #0a1628 0%, #0f1d33 50%, #152440 100%)",
  accent: "linear-gradient(135deg, #7ef2ff 0%, #3d8bff 100%)",
  card: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)",
  shimmer: "linear-gradient(90deg, transparent 0%, rgba(126,242,255,0.05) 50%, transparent 100%)",
  mesh: "radial-gradient(ellipse at 20% 20%, rgba(126,242,255,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(61,139,255,0.06) 0%, transparent 50%)",
} as const;
