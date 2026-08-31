"use client";

import { resolveLanguage } from "@omdala/core";
import type { OmAiAccountPreferences, OmAiAccountProfile } from "@omdala/types";
import { useLocationSearchParam } from "@omdala/ui";
import { useEffect, useState, type FormEvent } from "react";
import {
  getAccountPreferences,
  getAccountProfile,
  updateAccountProfile,
} from "@/lib/account-billing-client";
import { APP_COPY, t } from "@/lib/bilingual-copy";

type ProfileDraft = Pick<
  OmAiAccountProfile,
  "displayName" | "bio" | "timezone" | "locale"
>;

const emptyDraft: ProfileDraft = {
  displayName: "",
  bio: "",
  timezone: "UTC",
  locale: "en",
};

export function ProfileRuntime() {
  const language = resolveLanguage(useLocationSearchParam("lang"));
  const [profile, setProfile] = useState<OmAiAccountProfile | null>(null);
  const [preferences, setPreferences] =
    useState<OmAiAccountPreferences | null>(null);
  const [draft, setDraft] = useState<ProfileDraft>(emptyDraft);
  const [loadError, setLoadError] = useState(false);
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");

  useEffect(() => {
    let active = true;
    void Promise.all([getAccountProfile(), getAccountPreferences()])
      .then(([nextProfile, nextPreferences]) => {
        if (!active) return;
        setProfile(nextProfile);
        setPreferences(nextPreferences);
        setDraft({
          displayName: nextProfile.displayName,
          bio: nextProfile.bio ?? "",
          timezone: nextProfile.timezone,
          locale: nextProfile.locale,
        });
      })
      .catch(() => {
        if (active) setLoadError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveState("saving");
    try {
      const updated = await updateAccountProfile(draft);
      setProfile(updated);
      setSaveState("success");
    } catch {
      setSaveState("error");
    }
  }

  return (
    <>
      <section className="dashboard-panel">
        <p className="app-eyebrow">{t(language, APP_COPY.profile.eyebrow)}</p>
        <h1>{profile?.displayName ?? t(language, APP_COPY.profile.identity)}</h1>
        <p className="app-copy">{t(language, APP_COPY.profile.intro)}</p>
        <p className="app-copy">{t(language, APP_COPY.profile.introSuffix)}</p>
      </section>

      {loadError ? (
        <section className="detail-card" role="alert">
          {t(language, APP_COPY.profileFlow.loadFailure)}
        </section>
      ) : !profile || !preferences ? (
        <section className="detail-card" aria-live="polite">
          {t(language, APP_COPY.profileFlow.loading)}
        </section>
      ) : (
        <section className="detail-layout">
          <article className="detail-card">
            <h2>{t(language, APP_COPY.profile.identity)}</h2>
            <ul className="dashboard-list">
              <li>
                {t(language, APP_COPY.profile.email)}: {profile.email}
              </li>
              <li>
                {t(language, APP_COPY.profile.timezone)}: {profile.timezone}
              </li>
              <li>
                {t(language, APP_COPY.profile.locale)}: {profile.locale}
              </li>
            </ul>
          </article>

          <article className="detail-card">
            <h2>{t(language, APP_COPY.profile.boundary)}</h2>
            <ul className="dashboard-list">
              <li>
                {t(language, APP_COPY.profile.language)}: {preferences.language}
              </li>
              <li>
                {t(language, APP_COPY.profile.theme)}: {preferences.theme}
              </li>
              <li>
                {t(language, APP_COPY.profile.emailNotifications)}:{" "}
                {t(
                  language,
                  preferences.notifications.email
                    ? APP_COPY.shared.on
                    : APP_COPY.shared.off,
                )}
              </li>
              <li>
                {t(language, APP_COPY.profile.pushNotifications)}:{" "}
                {t(
                  language,
                  preferences.notifications.push
                    ? APP_COPY.shared.on
                    : APP_COPY.shared.off,
                )}
              </li>
            </ul>
          </article>

          <form className="detail-card" onSubmit={submitProfile}>
            <h2>{t(language, APP_COPY.profileFlow.title)}</h2>
            <label className="field">
              <span>{t(language, APP_COPY.profileFlow.displayName)}</span>
              <input
                name="displayName"
                value={draft.displayName}
                required
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    displayName: event.target.value,
                  }))
                }
              />
            </label>
            <label className="field">
              <span>{t(language, APP_COPY.profileFlow.bio)}</span>
              <input
                name="bio"
                value={draft.bio}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    bio: event.target.value,
                  }))
                }
              />
            </label>
            <label className="field">
              <span>{t(language, APP_COPY.profileFlow.timezone)}</span>
              <input
                name="timezone"
                value={draft.timezone}
                required
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    timezone: event.target.value,
                  }))
                }
              />
            </label>
            <label className="field">
              <span>{t(language, APP_COPY.profileFlow.locale)}</span>
              <select
                name="locale"
                value={draft.locale}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    locale: event.target.value,
                  }))
                }
              >
                <option value="en">English</option>
                <option value="vi">Tiếng Việt</option>
              </select>
            </label>
            <button className="app-button" disabled={saveState === "saving"}>
              {t(
                language,
                saveState === "saving"
                  ? APP_COPY.profileFlow.saving
                  : APP_COPY.profileFlow.save,
              )}
            </button>
            {saveState === "success" ? (
              <p role="status">{t(language, APP_COPY.profileFlow.success)}</p>
            ) : null}
            {saveState === "error" ? (
              <p role="alert">{t(language, APP_COPY.profileFlow.failure)}</p>
            ) : null}
          </form>
        </section>
      )}
    </>
  );
}
