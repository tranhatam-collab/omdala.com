import type { InformationPage as InformationPageContent } from "@/lib/information-pages";
import type { MarketplaceLocale } from "@/lib/locale";

export function InformationPage({ content, locale }: { content: InformationPageContent; locale: MarketplaceLocale }) {
  return (
    <main className="market-information" lang={locale}>
      <header>
        <p className="market-eyebrow">{content.eyebrow}</p>
        <h1>{content.title}</h1>
        <p className="market-information__lead">{content.lead}</p>
      </header>
      <div className="market-information__sections">
        {content.sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
            {section.bullets ? <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}
          </section>
        ))}
      </div>
    </main>
  );
}
