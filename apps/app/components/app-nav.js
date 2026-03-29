"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNavigation } from "../lib/navigation";

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="app-nav" aria-label="Workspace">
      {primaryNavigation.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-link${isActive ? " nav-link-active" : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            <strong>{item.label}</strong>
            <span>{item.detail}</span>
          </Link>
        );
      })}
    </nav>
  );
}
