// ─── OMCODE — AI Code OS standalone (no auth) ───────────────────────────
// Local-first AI coding workspace cho MacBook. Không cần đăng nhập.
import { WorkspaceShell } from "../workspace/WorkspaceShell";
import { ErrorBoundary } from "../workspace/components/ErrorBoundary";

export const metadata = {
  title: "OMCODE — AI Code OS",
  description: "Local AI coding workspace for OMDALA",
};

export default function OmCodePage() {
  return (
    <ErrorBoundary>
      <WorkspaceShell />
    </ErrorBoundary>
  );
}
