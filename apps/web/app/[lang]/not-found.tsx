"use client";

import { useParams } from "next/navigation";
import { NotFoundView } from "../components/NotFoundView";
import { resolveRouteLanguage } from "../lib/locale-routing";

export default function LocalizedNotFound() {
  const params = useParams<{ lang: string }>();
  const language = resolveRouteLanguage(params?.lang);

  return <NotFoundView language={language} />;
}
