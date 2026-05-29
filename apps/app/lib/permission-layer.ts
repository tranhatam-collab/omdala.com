// ─── Permission Layer — Wrapper for Agent Orchestrator ─────────────────────
// Intercepts AI agent actions and checks workspace policy before execution

import { checkRenamePermission, getPolicySystemPrompt, type WorkspacePolicy } from "./policy-engine";

export type AgentAction =
  | "rename_session"
  | "rename_space"
  | "rename_project"
  | "rename_folder"
  | "rename_repository"
  | "create_workspace"
  | "delete_workspace"
  | "edit_code"
  | "read_file"
  | "run_command";

export interface AgentRequest {
  action: AgentAction;
  resource?: string;
  payload?: unknown;
}

export interface PermissionResult {
  allowed: boolean;
  reason?: string;
}

export function checkAgentPermission(request: AgentRequest): PermissionResult {
  switch (request.action) {
    case "rename_session":
      if (!checkRenamePermission("session")) {
        return {
          allowed: false,
          reason: "Session renaming is disabled by workspace policy. Only the user can rename sessions.",
        };
      }
      break;

    case "rename_space":
      if (!checkRenamePermission("space")) {
        return {
          allowed: false,
          reason: "Space renaming is disabled by workspace policy. Only the user can rename spaces.",
        };
      }
      break;

    case "rename_project":
      if (!checkRenamePermission("project")) {
        return {
          allowed: false,
          reason: "Project renaming is disabled by workspace policy. Only the user can rename projects.",
        };
      }
      break;

    case "rename_folder":
      if (!checkRenamePermission("folder")) {
        return {
          allowed: false,
          reason: "Folder renaming is disabled by workspace policy. Only the user can rename folders.",
        };
      }
      break;

    case "rename_repository":
      if (!checkRenamePermission("repository")) {
        return {
          allowed: false,
          reason: "Repository renaming is disabled by workspace policy. Only the user can rename repositories.",
        };
      }
      break;

    case "create_workspace":
    case "delete_workspace":
    case "edit_code":
    case "read_file":
    case "run_command":
      // These are allowed by default
      break;
  }

  return { allowed: true };
}

// Hook to inject policy system prompt into AI agent
export function getAgentSystemPrompt(basePrompt: string): string {
  const policyPrompt = getPolicySystemPrompt();
  if (!policyPrompt) {
    return basePrompt;
  }
  return `${basePrompt}\n\n${policyPrompt}`;
}

// React hook for components to check permissions
export function usePermission(action: AgentAction): boolean {
  const result = checkAgentPermission({ action });
  return result.allowed;
}
