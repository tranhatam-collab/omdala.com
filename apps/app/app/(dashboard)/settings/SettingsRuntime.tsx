"use client";

import {
  OM_AI_APP_ID,
  OM_AI_PROVIDER_CAPABILITIES,
  resolveLanguage,
  resolveOmAiBetaGate,
} from "@omdala/core";
import type {
  OmAiAccountPreferences,
  OmAiBillingSubscription,
  OmAiBillingUsage,
  OmAiProviderRouteDecision,
  OmAiUsageEventName,
} from "@omdala/types";
import { useLocationSearchParam } from "@omdala/ui";
import { useEffect, useState, type FormEvent } from "react";
import {
  getAccountPreferences,
  getBillingSubscriptions,
  getBillingUsage,
  getProviderRoute,
  getProviders,
  updateAccountPreferences,
} from "@/lib/account-billing-client";
import { APP_COPY, t } from "@/lib/bilingual-copy";

type SettingsData = {
  preferences: OmAiAccountPreferences;
  subscription: OmAiBillingSubscription;
  usage: OmAiBillingUsage;
  usageEventNames: OmAiUsageEventName[];
  providerSource: string;
  providerRoutes: OmAiProviderRouteDecision[];
};

export function SettingsRuntime() {
  const language = resolveLanguage(useLocationSearchParam("lang"));
  const [data, setData] = useState<SettingsData | null>(null);
  const [draft, setDraft] = useState<OmAiAccountPreferences | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");

  useEffect(() => {
    let active = true;
    void Promise.all([
      getAccountPreferences(),
      getBillingSubscriptions(),
      getBillingUsage(),
      getProviders(),
      Promise.all(
        Object.values(OM_AI_PROVIDER_CAPABILITIES).map((capability) =>
          getProviderRoute(capability),
        ),
      ),
    ])
      .then(([preferences, subscriptions, usage, providers, providerRoutes]) => {
        if (!active) return;
        if (!subscriptions.primary) {
          throw new Error("Primary subscription is missing");
        }
        const nextData: SettingsData = {
          preferences,
          subscription: subscriptions.primary,
          usage,
          usageEventNames: usage.eventNames,
          providerSource: providers.source,
          providerRoutes,
        };
        setData(nextData);
        setDraft(preferences);
      })
      .catch(() => {
        if (active) setLoadError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  async function submitPreferences(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    setSaveState("saving");
    try {
      const updated = await updateAccountPreferences(draft);
      setData((current) =>
        current ? { ...current, preferences: updated } : current,
      );
      setDraft(updated);
      setSaveState("success");
    } catch {
      setSaveState("error");
    }
  }

  const betaGate = data ? resolveOmAiBetaGate(data.subscription) : null;
  const usedMinutes = data?.usage.used.callMinutesToday ?? 0;
  const quotaMinutes = data?.usage.quota.callMinutesDaily;
  const remainingMinutes = data?.usage.remaining.callMinutesToday;

  return (
    <>
      <section className="dashboard-panel">
        <p className="app-eyebrow">{t(language, APP_COPY.settings.eyebrow)}</p>
        <h1>{t(language, APP_COPY.settings.settings)}</h1>
        <p className="app-copy">{t(language, APP_COPY.settings.intro)}</p>
        <p className="app-copy">{t(language, APP_COPY.settings.introSuffix)}</p>
      </section>

      {loadError ? (
        <section className="detail-card" role="alert">
          {t(language, APP_COPY.preferencesFlow.loadFailure)}
        </section>
      ) : !data || !draft || !betaGate ? (
        <section className="detail-card" aria-live="polite">
          {t(language, APP_COPY.preferencesFlow.loading)}
        </section>
      ) : (
        <section className="detail-layout">
          <article className="detail-card">
            <h2>{t(language, APP_COPY.settings.billingSummary)}</h2>
            <ul className="dashboard-list">
              <li>
                {t(language, APP_COPY.settings.appId)}: {OM_AI_APP_ID}
              </li>
              <li>
                {t(language, APP_COPY.settings.currentPlan)}:{" "}
                {data.subscription.planId}
              </li>
              <li>
                {t(language, APP_COPY.settings.billingCycle)}:{" "}
                {data.subscription.billingCycle}
              </li>
              <li>
                {t(language, APP_COPY.settings.subscriptionVisibility)}:{" "}
                {t(
                  language,
                  betaGate.isUnlocked
                    ? APP_COPY.settings.subscriptionVisibilityFull
                    : APP_COPY.settings.subscriptionVisibilityLimited,
                )}
              </li>
              <li>
                {usedMinutes}/{quotaMinutes ?? "unlimited"}{" "}
                {t(language, APP_COPY.settings.usedToday)}
              </li>
              <li>
                {t(language, APP_COPY.settings.remainingToday)}:{" "}
                {remainingMinutes ?? "unlimited"}{" "}
                {t(language, APP_COPY.settings.minutes)}
              </li>
              <li>
                {data.usageEventNames.length}{" "}
                {t(language, APP_COPY.settings.billingAwareEvents)}
              </li>
            </ul>
          </article>

          <article className="detail-card">
            <h2>{t(language, APP_COPY.settings.betaGate)}</h2>
            <ul className="dashboard-list">
              <li>
                {betaGate.isUnlocked
                  ? t(language, APP_COPY.settings.betaGateUnlocked)
                  : t(language, APP_COPY.settings.betaGateLocked)}
              </li>
              <li>
                {t(language, APP_COPY.settings.betaGateReason)}: {betaGate.reason}
              </li>
            </ul>
          </article>

          <form className="detail-card" onSubmit={submitPreferences}>
            <h2>{t(language, APP_COPY.preferencesFlow.title)}</h2>
            <label className="field">
              <span>{t(language, APP_COPY.preferencesFlow.language)}</span>
              <select
                name="language"
                value={draft.language}
                onChange={(event) =>
                  setDraft((current) =>
                    current
                      ? { ...current, language: event.target.value }
                      : current,
                  )
                }
              >
                <option value="en">English</option>
                <option value="vi">Tiếng Việt</option>
              </select>
            </label>
            <label className="field">
              <span>{t(language, APP_COPY.preferencesFlow.theme)}</span>
              <select
                name="theme"
                value={draft.theme}
                onChange={(event) => {
                  const theme = event.target.value;
                  if (theme !== "light" && theme !== "dark" && theme !== "system") {
                    return;
                  }
                  setDraft((current) =>
                    current ? { ...current, theme } : current,
                  );
                }}
              >
                <option value="system">{t(language, APP_COPY.shared.system)}</option>
                <option value="light">{t(language, APP_COPY.shared.light)}</option>
                <option value="dark">{t(language, APP_COPY.shared.dark)}</option>
              </select>
            </label>
            <label className="field">
              <span>{t(language, APP_COPY.preferencesFlow.emailNotifications)}</span>
              <input
                name="emailNotifications"
                type="checkbox"
                checked={draft.notifications.email}
                onChange={(event) =>
                  setDraft((current) =>
                    current
                      ? {
                          ...current,
                          notifications: {
                            ...current.notifications,
                            email: event.target.checked,
                          },
                        }
                      : current,
                  )
                }
              />
            </label>
            <label className="field">
              <span>{t(language, APP_COPY.preferencesFlow.pushNotifications)}</span>
              <input
                name="pushNotifications"
                type="checkbox"
                checked={draft.notifications.push}
                onChange={(event) =>
                  setDraft((current) =>
                    current
                      ? {
                          ...current,
                          notifications: {
                            ...current.notifications,
                            push: event.target.checked,
                          },
                        }
                      : current,
                  )
                }
              />
            </label>
            <button className="app-button" disabled={saveState === "saving"}>
              {t(
                language,
                saveState === "saving"
                  ? APP_COPY.preferencesFlow.saving
                  : APP_COPY.preferencesFlow.save,
              )}
            </button>
            {saveState === "success" ? (
              <p role="status">{t(language, APP_COPY.preferencesFlow.success)}</p>
            ) : null}
            {saveState === "error" ? (
              <p role="alert">{t(language, APP_COPY.preferencesFlow.failure)}</p>
            ) : null}
          </form>

          <article className="detail-card">
            <h2>{t(language, APP_COPY.providerRoutingStatus.title)}</h2>
            <p className="app-copy">
              {t(language, APP_COPY.providerRoutingStatus.source)}:{" "}
              {data.providerSource}
            </p>
            <ul className="dashboard-list">
              {data.providerRoutes.map((route) => (
                <li key={route.capability}>
                  {route.capability}: {route.providerId ?? "none"} ({t(
                    language,
                    APP_COPY.providerRoutingStatus.fallback,
                  )}: {route.fallbackProviderId ?? "none"}) {t(
                    language,
                    APP_COPY.providerRoutingStatus.score,
                  )}: {route.score.toFixed(3)}
                </li>
              ))}
            </ul>
          </article>
        </section>
      )}
    </>
  );
}
