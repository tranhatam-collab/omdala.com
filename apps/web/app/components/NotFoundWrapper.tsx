"use client";

import { usePathname } from "next/navigation";
import { NotFoundView } from "./NotFoundView";
import { resolveRouteLanguage } from "../lib/locale-routing";

export function NotFoundWrapper() {
  const pathname = usePathname();
  const lang = pathname?.startsWith("/en") ? "en" : "vi";
  const language = resolveRouteLanguage(lang);

  return <NotFoundView language={language} />;
}
