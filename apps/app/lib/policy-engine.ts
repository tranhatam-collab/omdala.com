// ─── Policy Engine — Workspace permissions for AI Agent ─────────────────────
// Prevents AI from renaming sessions, spaces, projects, folders

export interface WorkspacePolicy {
  allowRenameSession: boolean;
  allowRenameSpace: boolean;
  allowRenameProject: boolean;
  allowRenameFolder: boolean;
  allowRenameRepository: boolean;
  allowCreateWorkspace: boolean;
  allowDeleteWorkspace: boolean;
}

export const DEFAULT_POLICY: WorkspacePolicy = {
  allowRenameSession: false,
  allowRenameSpace: false,
  allowRenameProject: false,
  allowRenameFolder: false,
  allowRenameRepository: false,
  allowCreateWorkspace: true,
  allowDeleteWorkspace: false,
};

const POLICY_KEY = "omcode:workspace:policy";

export function loadWorkspacePolicy(): WorkspacePolicy {
  try {
    const raw = localStorage.getItem(POLICY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<WorkspacePolicy>;
      return { ...DEFAULT_POLICY, ...parsed };
    }
  } catch {}
  return DEFAULT_POLICY;
}

export function saveWorkspacePolicy(policy: WorkspacePolicy): void {
  try {
    localStorage.setItem(POLICY_KEY, JSON.stringify(policy));
  } catch {}
}

export function checkPermission(action: keyof WorkspacePolicy): boolean {
  const policy = loadWorkspacePolicy();
  return policy[action] === true;
}

export function checkRenamePermission(resource: "session" | "space" | "project" | "folder" | "repository"): boolean {
  const key = `allowRename${resource.charAt(0).toUpperCase() + resource.slice(1)}` as keyof WorkspacePolicy;
  return checkPermission(key);
}

// System prompt injection for AI agents
export function getPolicySystemPrompt(): string {
  const policy = loadWorkspacePolicy();
  const rules: string[] = [];

  if (!policy.allowRenameSession) {
    rules.push("NEVER rename sessions. Session titles are managed manually by the user.");
  }
  if (!policy.allowRenameSpace) {
    rules.push("NEVER rename spaces or workspaces.");
  }
  if (!policy.allowRenameProject) {
    rules.push("NEVER rename projects.");
  }
  if (!policy.allowRenameFolder) {
    rules.push("NEVER rename folders.");
  }
  if (!policy.allowRenameRepository) {
    rules.push("NEVER rename repositories.");
  }

  if (rules.length === 0) {
    return "";
  }

  return `# Workspace Policy\n\nThe AI agent must never:\n${rules.map((r) => `- ${r}`).join("\n")}\n\nOnly the user can change names. Treat all names as immutable identifiers.`;
}
