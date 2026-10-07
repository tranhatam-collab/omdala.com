import { describe, expect, it } from "vitest";
import {
  applyMailDeliveryPolicy,
  PRODUCTION_MAIL_WORKSPACE_ID,
  STAGING_MAIL_WORKSPACE_ID,
} from "./mail-delivery-policy";

describe("mail delivery policy", () => {
  it("rewrites every staging recipient to one protected sink", async () => {
    const result = await applyMailDeliveryPolicy(
      {
        ENVIRONMENT: "staging",
        MAIL_DELIVERY_MODE: "sink",
        MAIL_API_WORKSPACE_ID: STAGING_MAIL_WORKSPACE_ID,
        MAIL_STAGING_SINK_ADDRESS: "Staging-Sink@omdala.com",
      },
      {
        to: ["first@example.com", "second@example.com"],
        workspace_id: "attacker-workspace",
      },
    );

    expect(result).toMatchObject({
      deliveryMode: "sink",
      sinkEnforced: true,
      workspaceId: STAGING_MAIL_WORKSPACE_ID,
      originalRecipientCount: 2,
      deliveredRecipientCount: 1,
      recipientSetSha256:
        "9cc13bd965f524bd1701d0f4f5df06c479185e18723da23aab1f37dcaa95d260",
      payload: {
        to: "staging-sink@omdala.com",
        workspace_id: STAGING_MAIL_WORKSPACE_ID,
      },
    });
  });

  it.each([
    [{ MAIL_DELIVERY_MODE: "direct" }, /MAIL_DELIVERY_MODE=sink/],
    [{ MAIL_API_WORKSPACE_ID: PRODUCTION_MAIL_WORKSPACE_ID }, /isolated/],
    [{ MAIL_STAGING_SINK_ADDRESS: "not-an-email" }, /valid email/],
  ])("fails closed for incomplete staging sink authority", async (override, message) => {
    await expect(
      applyMailDeliveryPolicy(
        {
          ENVIRONMENT: "staging",
          MAIL_DELIVERY_MODE: "sink",
          MAIL_API_WORKSPACE_ID: STAGING_MAIL_WORKSPACE_ID,
          MAIL_STAGING_SINK_ADDRESS: "staging-sink@omdala.com",
          ...override,
        },
        { to: "real-recipient@example.com" },
      ),
    ).rejects.toThrow(message);
  });

  it("keeps production recipients direct under the production workspace", async () => {
    const result = await applyMailDeliveryPolicy(
      {
        ENVIRONMENT: "production",
        MAIL_DELIVERY_MODE: "direct",
        MAIL_API_WORKSPACE_ID: PRODUCTION_MAIL_WORKSPACE_ID,
      },
      { to: ["second@example.com", "first@example.com"] },
    );

    expect(result).toMatchObject({
      deliveryMode: "direct",
      sinkEnforced: false,
      workspaceId: PRODUCTION_MAIL_WORKSPACE_ID,
      originalRecipientCount: 2,
      deliveredRecipientCount: 2,
      payload: {
        to: ["second@example.com", "first@example.com"],
        workspace_id: PRODUCTION_MAIL_WORKSPACE_ID,
      },
    });
  });

  it.each([
    [{ MAIL_DELIVERY_MODE: "sink" }, /MAIL_DELIVERY_MODE=direct/],
    [{ MAIL_API_WORKSPACE_ID: STAGING_MAIL_WORKSPACE_ID }, /Production/],
  ])("fails closed for invalid production mail authority", async (override, message) => {
    await expect(
      applyMailDeliveryPolicy(
        {
          ENVIRONMENT: "production",
          MAIL_DELIVERY_MODE: "direct",
          MAIL_API_WORKSPACE_ID: PRODUCTION_MAIL_WORKSPACE_ID,
          ...override,
        },
        { to: "customer@example.com" },
      ),
    ).rejects.toThrow(message);
  });
});
