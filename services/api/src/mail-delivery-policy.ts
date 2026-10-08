const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PRODUCTION_MAIL_WORKSPACE_ID = "omdala.com";
export const STAGING_MAIL_WORKSPACE_ID = "omdala.com-staging";

export type MailDeliveryMode = "direct" | "sink";

export interface MailDeliveryPolicyEnv {
  ENVIRONMENT: string;
  MAIL_DELIVERY_MODE?: string;
  MAIL_API_WORKSPACE_ID?: string;
  MAIL_STAGING_SINK_ADDRESS?: string;
}

export interface MailDeliveryPolicyPayload {
  to: string | string[];
  workspace_id?: string;
}

export interface MailDeliveryPolicyResult<T extends MailDeliveryPolicyPayload> {
  payload: T;
  deliveryMode: MailDeliveryMode;
  sinkEnforced: boolean;
  workspaceId: string;
  originalRecipientCount: number;
  deliveredRecipientCount: number;
  recipientSetSha256: string;
}

function normalizeEmail(value: unknown): string {
  const email = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!EMAIL_PATTERN.test(email)) {
    throw new Error("Mail recipient configuration must be a valid email address");
  }
  return email;
}

function normalizeRecipients(value: string | string[]): string[] {
  const recipients = (Array.isArray(value) ? value : [value]).map(normalizeEmail);
  if (recipients.length === 0) {
    throw new Error("Mail request must contain at least one recipient");
  }
  return recipients;
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

/**
 * Resolve the only recipients that may be handed to the mail provider.
 *
 * Protected staging is deliberately more restrictive than production: it
 * must use a separate workspace and every message is rewritten to one
 * protected sink. A request body can never override the workspace or sink.
 */
export async function applyMailDeliveryPolicy<
  T extends MailDeliveryPolicyPayload,
>(env: MailDeliveryPolicyEnv, payload: T): Promise<MailDeliveryPolicyResult<T>> {
  const originalRecipients = normalizeRecipients(payload.to);

  if (env.ENVIRONMENT === "staging") {
    if (env.MAIL_DELIVERY_MODE !== "sink") {
      throw new Error("Staging mail requires MAIL_DELIVERY_MODE=sink");
    }
    if (env.MAIL_API_WORKSPACE_ID !== STAGING_MAIL_WORKSPACE_ID) {
      throw new Error(
        `Staging mail requires the isolated ${STAGING_MAIL_WORKSPACE_ID} workspace`,
      );
    }
    const sink = normalizeEmail(env.MAIL_STAGING_SINK_ADDRESS);
    return {
      payload: {
        ...payload,
        to: sink,
        workspace_id: STAGING_MAIL_WORKSPACE_ID,
      },
      deliveryMode: "sink",
      sinkEnforced: true,
      workspaceId: STAGING_MAIL_WORKSPACE_ID,
      originalRecipientCount: originalRecipients.length,
      deliveredRecipientCount: 1,
      recipientSetSha256: await sha256(sink),
    };
  }

  if (env.ENVIRONMENT === "production") {
    if (env.MAIL_DELIVERY_MODE !== "direct") {
      throw new Error("Production mail requires MAIL_DELIVERY_MODE=direct");
    }
    if (env.MAIL_API_WORKSPACE_ID !== PRODUCTION_MAIL_WORKSPACE_ID) {
      throw new Error(
        `Production mail requires the ${PRODUCTION_MAIL_WORKSPACE_ID} workspace`,
      );
    }
  }

  const workspaceId =
    env.MAIL_API_WORKSPACE_ID?.trim() || PRODUCTION_MAIL_WORKSPACE_ID;
  const deliveredRecipients = [...new Set(originalRecipients)].sort();
  return {
    payload: {
      ...payload,
      workspace_id: workspaceId,
    },
    deliveryMode: "direct",
    sinkEnforced: false,
    workspaceId,
    originalRecipientCount: originalRecipients.length,
    deliveredRecipientCount: deliveredRecipients.length,
    recipientSetSha256: await sha256(deliveredRecipients.join("\n")),
  };
}
