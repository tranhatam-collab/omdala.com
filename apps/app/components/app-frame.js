import Link from "next/link";
import { AppNav } from "./app-nav";
import { LiveApiPanel } from "./live-api-panel";

export function AppFrame({ eyebrow, title, intro, children, support }) {
  return (
    <div className="workspace-shell">
      <aside className="workspace-sidebar surface">
        <Link className="workspace-brand" href="/">
          OMDALA / APP
        </Link>
        <p className="workspace-side-copy">
          Product shell for nodes, requests, trust, and operator workflows.
        </p>
        <AppNav />
      </aside>

      <main className="workspace-main">
        <header className="workspace-hero surface">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p className="intro-copy">{intro}</p>
          </div>

          <div className="hero-links">
            <Link className="ghost-link" href="/">
              Overview
            </Link>
            <Link className="ghost-link" href="/sign-in">
              Auth flow
            </Link>
          </div>
        </header>

        <div className="workspace-grid">
          <section className="workspace-content">{children}</section>
          <aside className="workspace-support">
            <LiveApiPanel />
            {support}
          </aside>
        </div>
      </main>
    </div>
  );
}
