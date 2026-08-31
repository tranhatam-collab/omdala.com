// ─── /workspace — OMCODE AI Code OS (no auth) ────────────────────────────
// Local-first AI coding workspace. Không cần đăng nhập.
// This is the public /workspace route, accessible without authentication.
// The (dashboard)/workspace route is removed to avoid auth gate conflict.
import { WorkspaceShell } from "./WorkspaceShell";
import { ErrorBoundary } from "./components/ErrorBoundary";

export const metadata = {
  title: "OMCODE Workspace — AI Code OS",
  description: "Local-first AI coding workspace for OMDALA",
};

export default function WorkspacePage() {
  return (
    <ErrorBoundary>
      <WorkspaceShell />
    </ErrorBoundary>
  );
}
