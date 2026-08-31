"use client";

import { resolveLanguage } from "@omdala/core";
import type {
  OmAiAccountProfile,
  OmAiBillingSubscription,
  OmAiBillingUsage,
} from "@omdala/types";
import { useLocationSearchParam } from "@omdala/ui";
import { useEffect, useState } from "react";
import { LocaleLink } from "@/app/components/LocaleLink";
import {
  getAccountProfile,
  getAiProviderHealth,
  getBillingSubscriptions,
  getBillingUsage,
  getRealityNodes,
  getRealityProofs,
  getRealityTrust,
} from "@/lib/account-billing-client";
import { APP_COPY, t } from "@/lib/bilingual-copy";

type DashboardData = {
  profile: OmAiAccountProfile;
  subscription: OmAiBillingSubscription;
  usage: OmAiBillingUsage;
  realityAvailable: boolean;
  nodeCount: number;
  trustCount: number;
  pendingProofCount: number;
  healthyProviderCount: number;
  providerCount: number;
};

export function DashboardRuntime() {
  const language = resolveLanguage(useLocationSearchParam("lang"));
  const [data, setData] = useState<DashboardData | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.all([
      getAccountProfile(),
      getBillingSubscriptions(),
      getBillingUsage(),
      Promise.allSettled([
        getRealityNodes(),
        getRealityTrust(),
        getRealityProofs(),
        getAiProviderHealth(),
      ]),
    ])
      .then(([profile, subscriptions, usage, runtimeResults]) => {
        if (!active) return;
        if (!subscriptions.primary) {
          throw new Error("Primary subscription is missing");
        }
        const [nodes, trust, proofs, providers] = runtimeResults;
        const realityAvailable =
          nodes.status === "fulfilled" &&
          trust.status === "fulfilled" &&
          proofs.status === "fulfilled";
        const healthyProviderCount =
          providers.status === "fulfilled"
            ? providers.value.providers.filter((provider) => provider.ok).length
            : 0;

        setData({
          profile,
          subscription: subscriptions.primary,
          usage,
          realityAvailable,
          nodeCount: nodes.status === "fulfilled" ? nodes.value.total : 0,
          trustCount: trust.status === "fulfilled" ? trust.value.total : 0,
          pendingProofCount:
            proofs.status === "fulfilled"
              ? proofs.value.proofs.filter(
                  (proof) => proof.verificationStatus === "pending",
                ).length
              : 0,
          healthyProviderCount,
          providerCount:
            providers.status === "fulfilled" ? providers.value.total : 0,
        });
      })
      .catch(() => {
        if (active) setLoadError(true);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <section className="dashboard-panel">
        <p className="app-eyebrow">{t(language, APP_COPY.dashboard.eyebrow)}</p>
        <h1>
          {t(language, APP_COPY.dashboard.welcomePrefix)}
          {data ? `, ${data.profile.displayName}.` : "."}
        </h1>
        <p className="app-copy">{t(language, APP_COPY.dashboard.intro)}</p>
      </section>

      {loadError ? (
        <section className="detail-card" role="alert">
          {t(language, APP_COPY.dashboard.runtime.loadFailure)}
        </section>
      ) : !data ? (
        <section className="detail-card" aria-live="polite">
          {t(language, APP_COPY.dashboard.runtime.loading)}
        </section>
      ) : (
        <>
          <section className="dashboard-grid">
            <article className="dashboard-stat">
              <strong>{t(language, APP_COPY.dashboard.runtime.email)}</strong>
              <p>{data.profile.email}</p>
            </article>
            <article className="dashboard-stat">
              <strong>{t(language, APP_COPY.dashboard.runtime.plan)}</strong>
              <p>{data.subscription.planId}</p>
            </article>
            <article className="dashboard-stat">
              <strong>{t(language, APP_COPY.dashboard.runtime.usage)}</strong>
              <p>
                {data.usage.used.callMinutesToday}{" "}
                {t(language, APP_COPY.dashboard.runtime.minutes)}
              </p>
            </article>
            <article className="dashboard-stat">
              <strong>{t(language, APP_COPY.dashboard.runtime.realityStore)}</strong>
              <p>
                {t(
                  language,
                  data.realityAvailable
                    ? APP_COPY.dashboard.runtime.connected
                    : APP_COPY.dashboard.runtime.unavailable,
                )}
              </p>
            </article>
            <article className="dashboard-stat">
              <strong>{t(language, APP_COPY.dashboard.runtime.nodes)}</strong>
              <p>{data.realityAvailable ? data.nodeCount : "-"}</p>
            </article>
            <article className="dashboard-stat">
              <strong>{t(language, APP_COPY.dashboard.runtime.trust)}</strong>
              <p>{data.realityAvailable ? data.trustCount : "-"}</p>
            </article>
            <article className="dashboard-stat">
              <strong>{t(language, APP_COPY.dashboard.runtime.pendingProofs)}</strong>
              <p>{data.realityAvailable ? data.pendingProofCount : "-"}</p>
            </article>
            <article className="dashboard-stat">
              <strong>{t(language, APP_COPY.dashboard.runtime.aiProviders)}</strong>
              <p>
                {data.healthyProviderCount}/{data.providerCount}
              </p>
            </article>
          </section>

          <section className="dashboard-panel">
            <h2>{t(language, APP_COPY.dashboard.coreWorkspace.title)}</h2>
            <div className="entity-actions">
              <LocaleLink href="/profile" className="app-button app-button--primary">
                {t(language, APP_COPY.dashboard.coreWorkspace.openProfile)}
              </LocaleLink>
              <LocaleLink href="/settings" className="app-button app-button--ghost">
                {t(language, APP_COPY.dashboard.coreWorkspace.openSettings)}
              </LocaleLink>
              <LocaleLink href="/brands" className="app-button app-button--ghost">
                {t(language, APP_COPY.dashboard.coreWorkspace.openBrands)}
              </LocaleLink>
              <LocaleLink href="/workspace" className="app-button app-button--ghost">
                {t(language, APP_COPY.dashboard.coreWorkspace.openOmcode)}
              </LocaleLink>
            </div>
          </section>
        </>
      )}
    </>
  );
}
