"use client";

import { OMDALA_API_ORIGIN, resolveLanguage, type OmdalaLanguage } from "@omdala/core";
import { useLocationSearchParam } from "@omdala/ui";
import { useEffect, useState } from "react";

type AiagentAuthority = {
  provider: "aiagent";
  configured: boolean;
  ready: boolean;
  origin: string | null;
  contractVersion: "1.0.0";
  tenant: "omdala-com";
  workspace: string | null;
  probe: "configuration-only";
  directUpstreamAllowed: false;
};

type AuthorityState = {
  status: "idle" | "loading" | "ready" | "error";
  authority: AiagentAuthority | null;
  modelCallExecuted: false | null;
  error: string | null;
};

const COPY: Record<OmdalaLanguage, { eyebrow: string; title: string; lead: string; loading: string }> = {
  en: {
    eyebrow: "AI authority",
    title: "AIAGENT contract health",
    lead: "Configuration-only view of the single AI authority. Opening this page never calls a model.",
    loading: "Loading AIAGENT authority health...",
  },
  vi: {
    eyebrow: "Thẩm quyền AI",
    title: "Sức khỏe contract AIAGENT",
    lead: "Chỉ đọc cấu hình của một thẩm quyền AI duy nhất. Mở trang này không gọi model.",
    loading: "Đang tải trạng thái thẩm quyền AIAGENT...",
  },
  zh: {
    eyebrow: "AI authority",
    title: "AIAGENT contract health",
    lead: "Configuration-only status for the single AI authority; no model call is executed.",
    loading: "Loading AIAGENT authority health...",
  },
  es: {
    eyebrow: "AI authority",
    title: "AIAGENT contract health",
    lead: "Configuration-only status for the single AI authority; no model call is executed.",
    loading: "Loading AIAGENT authority health...",
  },
  ja: {
    eyebrow: "AI authority",
    title: "AIAGENT contract health",
    lead: "Configuration-only status for the single AI authority; no model call is executed.",
    loading: "Loading AIAGENT authority health...",
  },
  ko: {
    eyebrow: "AI authority",
    title: "AIAGENT contract health",
    lead: "Configuration-only status for the single AI authority; no model call is executed.",
    loading: "Loading AIAGENT authority health...",
  },
};

export function ProviderObservabilityDashboard() {
  const language = resolveLanguage(useLocationSearchParam("lang"));
  const [state, setState] = useState<AuthorityState>({
    status: "idle",
    authority: null,
    modelCallExecuted: null,
    error: null,
  });

  useEffect(() => {
    let mounted = true;
    async function load() {
      setState({ status: "loading", authority: null, modelCallExecuted: null, error: null });
      try {
        const response = await fetch(`${OMDALA_API_ORIGIN}/v1/ai/health`, {
          credentials: "include",
          redirect: "error",
        });
        const payload = (await response.json()) as {
          ok?: boolean;
          data?: { providers?: AiagentAuthority[]; total?: number; modelCallExecuted?: false };
          error?: { message?: string };
        };
        const authority = payload.data?.providers?.[0];
        if (
          !response.ok ||
          payload.ok !== true ||
          payload.data?.total !== 1 ||
          payload.data?.modelCallExecuted !== false ||
          !authority ||
          authority.provider !== "aiagent" ||
          authority.contractVersion !== "1.0.0" ||
          authority.tenant !== "omdala-com" ||
          authority.directUpstreamAllowed !== false
        ) {
          throw new Error(payload.error?.message ?? "AIAGENT authority health is incomplete.");
        }
        if (mounted) {
          setState({ status: "ready", authority, modelCallExecuted: false, error: null });
        }
      } catch (error) {
        if (mounted) {
          setState({
            status: "error",
            authority: null,
            modelCallExecuted: null,
            error: error instanceof Error ? error.message : "Unable to load AIAGENT authority health.",
          });
        }
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const copy = COPY[language];
  return (
    <>
      <section className="admin-card">
        <p className="admin-eyebrow">{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <p className="admin-copy">{copy.lead}</p>
        {state.status === "loading" ? <p className="admin-copy">{copy.loading}</p> : null}
        {state.error ? <p className="admin-copy" role="alert">{state.error}</p> : null}
      </section>

      {state.authority ? (
        <section className="admin-card">
          <div className="admin-list">
            <article className="admin-list-item">
              <p className="admin-eyebrow">{state.authority.provider}</p>
              <h2>Contract {state.authority.contractVersion}</h2>
              <div className="admin-meta">
                <span>Configured: {String(state.authority.configured)}</span>
                <span>Credential ready: {String(state.authority.ready)}</span>
                <span>Tenant: {state.authority.tenant}</span>
                <span>Workspace: {state.authority.workspace ?? "not configured"}</span>
                <span>Origin: {state.authority.origin ?? "not configured"}</span>
                <span>Direct upstream: {String(state.authority.directUpstreamAllowed)}</span>
                <span>Probe: {state.authority.probe}</span>
                <span>Model call executed: {String(state.modelCallExecuted)}</span>
              </div>
            </article>
          </div>
        </section>
      ) : null}
    </>
  );
}
