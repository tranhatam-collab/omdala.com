import { withLanguagePath, type OmdalaLanguage } from "@omdala/core";
import Link from "next/link";
import {
  getChromeCopy,
  getNotFoundCopy,
  getPageCopy,
  getPagePath,
} from "../lib/bilingual-source";

export function NotFoundContent({
  language,
  headingLevel = 1,
}: {
  language: OmdalaLanguage;
  headingLevel?: 1 | 2;
}) {
  const copy = getNotFoundCopy(language);
  const chrome = getChromeCopy(language);
  const Heading = headingLevel === 1 ? "h1" : "h2";

  return (
    <>
      <Heading>{copy.title}</Heading>
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
    </>
  );
}

export function NotFoundView({ language }: { language: OmdalaLanguage }) {
  return (
    <main>
      <NotFoundContent language={language} />
    </main>
  );
}

// One static 404.html serves every unknown URL and cannot know the visitor's language, so it
// shows both, each block tagged with its own language.
export function BilingualNotFoundView() {
  return (
    <main>
      <section lang="en">
        <NotFoundContent language="en" />
      </section>
      <section lang="vi">
        <NotFoundContent language="vi" headingLevel={2} />
      </section>
    </main>
  );
}
