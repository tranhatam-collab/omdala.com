import { HttpError } from "../core/errors.js";

/**
 * Auth middleware for Omniverse API.
 *
 * Given a request, it:
 *  1. Extracts the Bearer token
 *  2. Resolves the Omniverse session from sessionStore
 *  3. Validates the session against shared-core /v1/auth/session
 *  4. Pre-fetches the user's workspace list from shared-core /v1/workspaces
 *
 * Returns a context object that route handlers can use without
 * re-implementing auth logic.
 *
 * For workspace-scoped endpoints, call `ctx.assertWorkspaceAccess(workspaceId)`.
 */

function parseBearerToken(authorizationHeader) {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

export function createAuthMiddleware({ sessionStore, sharedCoreClient }) {
  async function authenticate(request) {
    const accessToken = parseBearerToken(request.headers.get("authorization"));

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

    const workspaces = await sharedCoreClient.listWorkspaces(
      session.sharedSessionToken,
    );

    const workspaceIdSet = new Set(
      workspaces.map((ws) => ws.id || ws.workspaceId),
    );

    return {
      user: sharedSession.user,
      session,
      workspaces,

      assertWorkspaceAccess(workspaceId) {
        if (!workspaceIdSet.has(workspaceId)) {
          throw new HttpError(
            403,
            "WORKSPACE_FORBIDDEN",
            "User does not have access to this workspace",
          );
        }
      },
    };
  }

  return { authenticate };
}
