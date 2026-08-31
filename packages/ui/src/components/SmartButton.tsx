// ─── Smart Button — Adaptive, Animated, Accessible ──────────────────────
"use client";

import * as React from "react";

interface SmartButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "glass";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  glow?: boolean;
  locale?: "vi" | "en";
}

export const SmartButton = React.forwardRef<HTMLButtonElement, SmartButtonProps>(
  function SmartButton(
    {
      variant = "primary",
      size = "md",
      loading = false,
      glow = false,
      children,
      disabled,
      style,
      ...props
    },
    ref,
  ) {
    const base: React.CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      fontWeight: 600,
      borderRadius: 999,
      border: "none",
      cursor: disabled || loading ? "not-allowed" : "pointer",
      opacity: disabled || loading ? 0.6 : 1,
      transition: "all 200ms cubic-bezier(0.4,0,0.2,1)",
      position: "relative",
      overflow: "hidden",
      fontFamily: "var(--font-sans, 'Inter', system-ui, sans-serif)",
    };

    const sizes: Record<string, React.CSSProperties> = {
      sm: { padding: "6px 14px", fontSize: 13, height: 32 },
      md: { padding: "10px 20px", fontSize: 14, height: 40 },
      lg: { padding: "14px 28px", fontSize: 16, height: 48 },
    };

    const variants: Record<string, React.CSSProperties> = {
      primary: {
        background: "linear-gradient(135deg, #153a72, #3d8bff)",
        color: "#f7fbff",
        boxShadow: glow
          ? "0 0 20px rgba(61,139,255,0.3), 0 4px 6px rgba(0,0,0,0.2)"
          : "0 4px 6px rgba(0,0,0,0.15)",
      },
      secondary: {
        background: "rgba(255,255,255,0.08)",
        color: "#a8b9d0",
        border: "1px solid rgba(255,255,255,0.1)",
      },
      ghost: {
        background: "transparent",
        color: "#a8b9d0",
      },
      danger: {
        background: "linear-gradient(135deg, #991b1b, #ef4444)",
        color: "#f7fbff",
      },
      glass: {
        background: "rgba(15, 29, 51, 0.7)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        color: "#f7fbff",
        border: "1px solid rgba(126, 242, 255, 0.15)",
        boxShadow: glow
          ? "0 0 20px rgba(126,242,255,0.1)"
          : "0 4px 6px rgba(0,0,0,0.1)",
      },
    };

    const hoverStyles = {
      primary: { filter: "brightness(1.15)", transform: "translateY(-1px)" },
      secondary: { background: "rgba(255,255,255,0.12)" },
      ghost: { background: "rgba(255,255,255,0.06)" },
      danger: { filter: "brightness(1.15)", transform: "translateY(-1px)" },
      glass: { borderColor: "rgba(126, 242, 255, 0.3)", transform: "translateY(-1px)" },
    };

    const [isHovered, setIsHovered] = React.useState(false);

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          ...base,
          ...sizes[size],
          ...variants[variant],
          ...(isHovered && !disabled && !loading ? hoverStyles[variant] : {}),
          ...style,
        }}
        {...props}
      >
        {loading && (
          <span
            style={{
              width: 16,
              height: 16,
              border: "2px solid rgba(255,255,255,0.3)",
              borderTopColor: "currentColor",
              borderRadius: "50%",
              animation: "spin 0.6s linear infinite",
              display: "inline-block",
            }}
          />
        )}
        {children}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </button>
    );
  },
);
