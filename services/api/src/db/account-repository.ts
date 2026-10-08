import type {
  OmAiAccountPreferences,
  OmAiAccountProfile,
} from "@omdala/types";
import type { ApiBindings } from "../contracts";
import { queryRows } from "./client";
import { toDbQueryError } from "./errors";

type SqlRow = Record<string, unknown>;

function mapProfile(row: SqlRow): OmAiAccountProfile {
  const profile: OmAiAccountProfile = {
    id: String(row.id),
    email: String(row.email),
    displayName: String(row.display_name),
    timezone: String(row.timezone),
    locale: String(row.locale),
  };

  if (row.avatar_url) profile.avatarUrl = String(row.avatar_url);
  if (row.bio) profile.bio = String(row.bio);
  return profile;
}

function mapPreferences(row: SqlRow): OmAiAccountPreferences {
  const theme = String(row.theme);
  return {
    language: String(row.language),
    theme:
      theme === "light" || theme === "dark" || theme === "system"
        ? theme
        : "system",
    notifications: {
      email: Boolean(row.email_notifications),
      push: Boolean(row.push_notifications),
    },
  };
}

async function withDbContext<T>(
  operation: string,
  action: () => Promise<T>,
): Promise<T> {
  try {
    return await action();
  } catch (error) {
    throw toDbQueryError(error, operation);
  }
}

export async function readOrCreateAccountProfile(
  env: ApiBindings,
  fallback: OmAiAccountProfile,
): Promise<OmAiAccountProfile> {
  return withDbContext("readOrCreateAccountProfile", async () => {
    await queryRows(
      env,
      `INSERT INTO omdala.account_profiles
        (email, id, display_name, avatar_url, bio, timezone, locale)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO NOTHING`,
      [
        fallback.email,
        fallback.id,
        fallback.displayName,
        fallback.avatarUrl ?? null,
        fallback.bio ?? null,
        fallback.timezone,
        fallback.locale,
      ],
    );

    const rows = (await queryRows(
      env,
      `SELECT email, id, display_name, avatar_url, bio, timezone, locale
       FROM omdala.account_profiles
       WHERE email = $1
       LIMIT 1`,
      [fallback.email],
    )) as SqlRow[];

    if (!rows[0]) throw new Error("Account profile was not persisted");
    return mapProfile(rows[0]);
  });
}

export async function writeAccountProfile(
  env: ApiBindings,
  profile: OmAiAccountProfile,
): Promise<OmAiAccountProfile> {
  return withDbContext("writeAccountProfile", async () => {
    const rows = (await queryRows(
      env,
      `INSERT INTO omdala.account_profiles
        (email, id, display_name, avatar_url, bio, timezone, locale)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO UPDATE SET
         display_name = EXCLUDED.display_name,
         avatar_url = EXCLUDED.avatar_url,
         bio = EXCLUDED.bio,
         timezone = EXCLUDED.timezone,
         locale = EXCLUDED.locale,
         updated_at = NOW()
       RETURNING email, id, display_name, avatar_url, bio, timezone, locale`,
      [
        profile.email,
        profile.id,
        profile.displayName,
        profile.avatarUrl ?? null,
        profile.bio ?? null,
        profile.timezone,
        profile.locale,
      ],
    )) as SqlRow[];

    if (!rows[0]) throw new Error("Account profile update returned no row");
    return mapProfile(rows[0]);
  });
}

export async function readOrCreateAccountPreferences(
  env: ApiBindings,
  email: string,
  profileFallback: OmAiAccountProfile,
  fallback: OmAiAccountPreferences,
): Promise<OmAiAccountPreferences> {
  return withDbContext("readOrCreateAccountPreferences", async () => {
    await readOrCreateAccountProfile(env, profileFallback);
    await queryRows(
      env,
      `INSERT INTO omdala.account_preferences
        (email, language, theme, email_notifications, push_notifications)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO NOTHING`,
      [
        email,
        fallback.language,
        fallback.theme,
        fallback.notifications.email,
        fallback.notifications.push,
      ],
    );

    const rows = (await queryRows(
      env,
      `SELECT language, theme, email_notifications, push_notifications
       FROM omdala.account_preferences
       WHERE email = $1
       LIMIT 1`,
      [email],
    )) as SqlRow[];

    if (!rows[0]) throw new Error("Account preferences were not persisted");
    return mapPreferences(rows[0]);
  });
}

export async function writeAccountPreferences(
  env: ApiBindings,
  email: string,
  profileFallback: OmAiAccountProfile,
  preferences: OmAiAccountPreferences,
): Promise<OmAiAccountPreferences> {
  return withDbContext("writeAccountPreferences", async () => {
    await readOrCreateAccountProfile(env, profileFallback);
    const rows = (await queryRows(
      env,
      `INSERT INTO omdala.account_preferences
        (email, language, theme, email_notifications, push_notifications)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET
         language = EXCLUDED.language,
         theme = EXCLUDED.theme,
         email_notifications = EXCLUDED.email_notifications,
         push_notifications = EXCLUDED.push_notifications,
         updated_at = NOW()
       RETURNING language, theme, email_notifications, push_notifications`,
      [
        email,
        preferences.language,
        preferences.theme,
        preferences.notifications.email,
        preferences.notifications.push,
      ],
    )) as SqlRow[];

    if (!rows[0]) throw new Error("Account preferences update returned no row");
    return mapPreferences(rows[0]);
  });
}
