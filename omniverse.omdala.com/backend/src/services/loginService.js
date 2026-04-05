import { HttpError } from "../core/errors.js";

export function createLoginService({ sharedCoreClient, sessionStore }) {
  // Build an authCtx object from a bearer token using shared-core proxies
  async function buildAuthCtxFromToken(accessToken) {
    if (!accessToken) {
      throw new HttpError(401, "AUTH_MISSING_TOKEN", "Missing bearer token");
    }
    const session = sessionStore.getByToken(accessToken);
    if (!session) {
      throw new HttpError(
        401,
        "AUTH_INVALID_TOKEN",
        "Session not found or expired",
      );
    }

    const sharedSession = await sharedCoreClient.getSession(
      session.sharedSessionToken,
    );
    const accountProfile = await sharedCoreClient.getAccountProfile(
      session.sharedSessionToken,
    );
    const workspaces = await sharedCoreClient.listWorkspaces(
      session.sharedSessionToken,
    );
    const workspaceIds = new Set(
      (workspaces || []).map((w) => w.id ?? w.workspaceId),
    );

    return {
      user: sharedSession.user,
      session,
      workspaces,
      workspaceIds,
      assertWorkspaceAccess(workspaceId) {
        if (!workspaceIds.has(workspaceId)) {
          throw new HttpError(
            403,
            "WORKSPACE_FORBIDDEN",
            "User does not have access to this workspace",
          );
        }
      },
    };
  }

  return {
    async login({ email, password }) {
      if (!email || !password) {
        throw new HttpError(
          400,
          "AUTH_VALIDATION_ERROR",
          "email and password are required",
        );
      }

      const authResult = await sharedCoreClient.login({ email, password });
      const session = sessionStore.create({
        user: authResult.user,
        sharedSessionToken: authResult.sharedSessionToken,
        accountProfile: authResult.accountProfile,
      });

      return {
        user: session.user,
        accessToken: session.omniverseSessionToken,
        tokenType: "Bearer",
        createdAt: session.createdAt,
      };
    },

    // Exposed to API layer: build authCtx from token
    buildAuthCtxFromToken,
  };
}
