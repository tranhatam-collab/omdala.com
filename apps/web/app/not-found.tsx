import type { Metadata } from "next";
import { NotFoundView } from "./components/NotFoundView";
import { getNotFoundCopy } from "./lib/bilingual-source";

const copy = getNotFoundCopy("en");

export const metadata: Metadata = {
  title: copy.metadataTitle,
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return <NotFoundView language="en" />;
}
