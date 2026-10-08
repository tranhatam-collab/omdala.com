// ─── Smart Card — Glassmorphism, Hover Lift ─────────────────────────────
"use client";

import * as React from "react";

interface SmartCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  hover?: boolean;
  elevated?: boolean;
}

export const SmartCard = React.forwardRef<HTMLDivElement, SmartCardProps>(
  function SmartCard({ glow = false, hover = true, elevated = false, children, style, ...props }, ref) {
    const [isHovered, setIsHovered] = React.useState(false);

    const base: React.CSSProperties = {
      borderRadius: 16,
      background: elevated
        ? "rgba(21, 36, 64, 0.8)"
        : "rgba(15, 29, 51, 0.7)",
      backdropFilter: "blur(16px) saturate(180%)",
      WebkitBackdropFilter: "blur(16px) saturate(180%)",
      border: `1px solid ${glow || isHovered ? "rgba(126, 242, 255, 0.15)" : "rgba(255,255,255,0.06)"}`,
      boxShadow:
        glow || isHovered
          ? "0 0 30px rgba(126, 242, 255, 0.08), 0 10px 40px rgba(0,0,0,0.2)"
          : "0 4px 12px rgba(0,0,0,0.15)",
      padding: 24,
      transition: "all 300ms cubic-bezier(0.4,0,0.2,1)",
      transform: hover && isHovered ? "translateY(-4px)" : "translateY(0)",
    };

    return (
      <div
        ref={ref}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ ...base, ...style }}
        {...props}
      >
        {children}
      </div>
    );
  },
);
