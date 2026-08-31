// ─── Smart Input — Floating Label, Glow Focus ───────────────────────────
"use client";

import * as React from "react";

interface SmartInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
}

export const SmartInput = React.forwardRef<HTMLInputElement, SmartInputProps>(
  function SmartInput({ label, error, size = "md", icon, style, ...props }, ref) {
    const [focused, setFocused] = React.useState(false);
    const container: React.CSSProperties = {
      position: "relative",
      display: "flex",
      flexDirection: "column",
      gap: 6,
    };

    const sizes: Record<string, React.CSSProperties> = {
      sm: { padding: "8px 12px", fontSize: 13, height: 36 },
      md: { padding: "10px 16px", fontSize: 14, height: 44 },
      lg: { padding: "14px 20px", fontSize: 16, height: 52 },
    };

    const inputBase: React.CSSProperties = {
      width: "100%",
      borderRadius: 12,
      border: `1px solid ${error ? "rgba(248,113,113,0.5)" : focused ? "rgba(126,242,255,0.4)" : "rgba(255,255,255,0.1)"}`,
      background: "rgba(6, 13, 26, 0.6)",
      color: "#f7fbff",
      outline: "none",
      transition: "all 200ms",
      fontFamily: "var(--font-sans, 'Inter', system-ui, sans-serif)",
      boxShadow: focused && !error ? "0 0 0 3px rgba(126,242,255,0.08)" : "none",
    };

    const labelStyle: React.CSSProperties = {
      fontSize: 13,
      fontWeight: 500,
      color: error ? "#f87171" : focused ? "#7ef2ff" : "#a8b9d0",
      transition: "color 200ms",
    };

    const errorStyle: React.CSSProperties = {
      fontSize: 12,
      color: "#f87171",
      minHeight: 18,
    };

    return (
      <div style={container}>
        {label && <label style={labelStyle}>{label}</label>}
        <div style={{ position: "relative" }}>
          {icon && (
            <div
              style={{
                position: "absolute",
                left: sizes[size].padding,
                top: "50%",
                transform: "translateY(-50%)",
                opacity: 0.5,
                pointerEvents: "none",
              }}
            >
              {icon}
            </div>
          )}
          <input
            ref={ref}
            {...props}
            onFocus={(e) => {
              setFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              props.onBlur?.(e);
            }}
            style={{
              ...sizes[size],
              ...inputBase,
              paddingLeft: icon ? 40 : sizes[size].padding,
              ...style,
            }}
          />
        </div>
        <div style={errorStyle}>{error || ""}</div>
      </div>
    );
  },
);
