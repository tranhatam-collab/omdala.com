"use client";

import { resolveLanguage } from "@omdala/core";
import { useLocationSearchParam } from "@omdala/ui";
import { APP_COPY, t } from "@/lib/bilingual-copy";
import type { UnreleasedRuntimeSurface as Surface } from "@/lib/release-boundary";
import { LocaleLink } from "../../components/LocaleLink";

const SURFACE_LABELS: Record<Surface, keyof typeof APP_COPY.layout.navLabels> = {
  nodes: "Nodes",
  resources: "Resources",
  offers: "Offers",
  requests: "Requests",
  trust: "Trust",
};

export function UnreleasedRuntimeSurface({ surface }: { surface: Surface }) {
  const language = resolveLanguage(useLocationSearchParam("lang"));
  const label = t(language, APP_COPY.layout.navLabels[SURFACE_LABELS[surface]]);

  return (
    <section
      className="dashboard-panel"
      data-release-state="unreleased"
      data-runtime-surface={surface}
    >
      <p className="app-eyebrow">{t(language, APP_COPY.releaseBoundary.eyebrow)}</p>
      <h1>
        {label} {t(language, APP_COPY.releaseBoundary.titleSuffix)}
      </h1>
      <p className="app-copy">{t(language, APP_COPY.releaseBoundary.body)}</p>
      <div className="pill-row">
        <span className="app-pill">
          {t(language, APP_COPY.releaseBoundary.stateLabel)}: {t(language, APP_COPY.releaseBoundary.stateValue)}
        </span>
      </div>
      <div className="entity-actions">
        <LocaleLink href="/dashboard" className="app-button app-button--primary">
          {t(language, APP_COPY.releaseBoundary.backToDashboard)}
        </LocaleLink>
      </div>
    </section>
  );
}
