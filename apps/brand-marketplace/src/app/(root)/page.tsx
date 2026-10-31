import Link from "next/link";
import { localeUrl } from "@/lib/seo";

// The marketplace lives under /en and /vi. The bare origin is a real page (not a client-side
// redirect shell): it refreshes to English and links to both languages for visitors without JS.
export default function RootPage() {
  return (
    <main className="market-information">
      <meta httpEquiv="refresh" content="0; url=/en/" />
      <link rel="canonical" href={localeUrl("en", "/")} />
      <h1>OMDALA Brand Exchange</h1>
      <p className="market-information__lead">
        <Link href="/en/" lang="en" hrefLang="en">Continue in English</Link>
        {" · "}
        <Link href="/vi/" lang="vi" hrefLang="vi">Tiếp tục bằng tiếng Việt</Link>
      </p>
    </main>
  );
}
