import { withLanguagePath, type OmdalaLanguage } from "@omdala/core";
import Link from "next/link";
import {
  getChromeCopy,
  getNotFoundCopy,
  getPageCopy,
  getPagePath,
} from "../lib/bilingual-source";

export function NotFoundView({ language }: { language: OmdalaLanguage }) {
  const copy = getNotFoundCopy(language);
  const chrome = getChromeCopy(language);

  return (
    <main>
      <h1>{copy.title}</h1>
      <p>{copy.description}</p>
      <nav aria-label={chrome.helpfulLinksAriaLabel}>
        <Link href={withLanguagePath(getPagePath("home"), language)}>
          {copy.returnHome}
        </Link>
        <Link href={withLanguagePath(getPagePath("whatIsOmdala"), language)}>
          {getPageCopy("whatIsOmdala", language).breadcrumbLabel}
        </Link>
        <Link href={withLanguagePath(getPagePath("howItWorks"), language)}>
          {getPageCopy("howItWorks", language).breadcrumbLabel}
        </Link>
      </nav>
    </main>
  );
}
