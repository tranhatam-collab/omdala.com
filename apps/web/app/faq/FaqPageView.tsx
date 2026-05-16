import type { OmdalaLanguage } from "@omdala/core";
import { WebPageShell } from "../WebPageShell";
import { getPageCopy, getPublicPageBodyCopy, isBilingualLanguage } from "../lib/bilingual-source";
import { faqContent, pickText } from "../lib/content";

export function FaqPageView({ locale }: { locale: OmdalaLanguage }) {
  const body = isBilingualLanguage(locale)
    ? getPublicPageBodyCopy("faq", locale)
    : null;

  return (
    <WebPageShell language={locale}>
      <main className="site-shell page-shell">
        <section className="panel hero">
          <p className="eyebrow">{body ? body.heroEyebrow : getPageCopy("faq", locale).heroEyebrow}</p>
          <h1>{body ? body.heroTitle : pickText(locale, faqContent.hero.title)}</h1>
          <p className="lead">{body ? body.heroLead : pickText(locale, faqContent.hero.lead)}</p>
        </section>

        <section className="panel">
          <div className="faq-grid">
            {body
              ? body.questions.map((faq) => (
                  <article key={faq.question}>
                    <h3>{faq.question}</h3>
                    <p>{faq.answer}</p>
                  </article>
                ))
              : faqContent.questions.map((faq) => (
                  <article key={faq.question.en}>
                    <h3>{pickText(locale, faq.question)}</h3>
                    <p>{pickText(locale, faq.answer)}</p>
                  </article>
                ))}
          </div>
        </section>
      </main>
    </WebPageShell>
  );
}
