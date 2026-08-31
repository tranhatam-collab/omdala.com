import type {
  OmAiAccountPreferences,
  OmAiAccountProfile,
} from "@omdala/types";
import { beforeEach, describe, expect, it, vi } from "vitest";

const clientMocks = vi.hoisted(() => ({
  queryRows: vi.fn(),
}));

vi.mock("./client", () => ({
  queryRows: clientMocks.queryRows,
}));

import {
  readOrCreateAccountPreferences,
  readOrCreateAccountProfile,
  writeAccountPreferences,
  writeAccountProfile,
} from "./account-repository";

const env = {
  ENVIRONMENT: "test",
  DATABASE_URL: "postgresql://example.test/omdala",
};

const profile: OmAiAccountProfile = {
  id: "user_account_test",
  email: "account@example.com",
  displayName: "Account Test",
  timezone: "UTC",
  locale: "en",
};

const preferences: OmAiAccountPreferences = {
  language: "en",
  theme: "dark",
  notifications: { email: false, push: true },
};

const profileRow = {
  email: profile.email,
  id: profile.id,
  display_name: profile.displayName,
  avatar_url: null,
  bio: null,
  timezone: profile.timezone,
  locale: profile.locale,
};

const preferencesRow = {
  language: preferences.language,
  theme: preferences.theme,
  email_notifications: preferences.notifications.email,
  push_notifications: preferences.notifications.push,
};

describe("account PostgreSQL repository", () => {
  beforeEach(() => {
    clientMocks.queryRows.mockReset();
  });

  it("creates then reads a profile from the canonical schema", async () => {
    clientMocks.queryRows.mockResolvedValueOnce([]).mockResolvedValueOnce([profileRow]);

    await expect(readOrCreateAccountProfile(env, profile)).resolves.toEqual(profile);
    expect(clientMocks.queryRows).toHaveBeenCalledTimes(2);
    expect(clientMocks.queryRows.mock.calls[0]?.[1]).toContain(
      "omdala.account_profiles",
    );
  });

  it("upserts a profile and returns the database row", async () => {
    clientMocks.queryRows.mockResolvedValueOnce([profileRow]);

    await expect(writeAccountProfile(env, profile)).resolves.toEqual(profile);
    expect(clientMocks.queryRows.mock.calls[0]?.[1]).toContain(
      "ON CONFLICT (email) DO UPDATE",
    );
  });

  it("creates then reads preferences after ensuring the profile", async () => {
    clientMocks.queryRows
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([profileRow])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([preferencesRow]);

    await expect(
      readOrCreateAccountPreferences(env, profile.email, profile, preferences),
    ).resolves.toEqual(preferences);
    expect(clientMocks.queryRows.mock.calls[2]?.[1]).toContain(
      "omdala.account_preferences",
    );
  });

  it("upserts preferences and preserves boolean notification values", async () => {
    clientMocks.queryRows
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([profileRow])
      .mockResolvedValueOnce([preferencesRow]);

    await expect(
      writeAccountPreferences(env, profile.email, profile, preferences),
    ).resolves.toEqual(preferences);
    expect(clientMocks.queryRows.mock.calls[2]?.[1]).toContain(
      "ON CONFLICT (email) DO UPDATE",
    );
  });
});
