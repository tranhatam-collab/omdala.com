"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL, createApiUrl } from "../lib/api";

const initialState = {
  health: null,
  session: null,
  error: ""
};

export function LiveApiPanel() {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    let cancelled = false;

    async function loadRuntimeState() {
      try {
        const [healthResponse, sessionResponse] = await Promise.all([
          fetch(createApiUrl("/api/health"), {
            cache: "no-store"
          }),
          fetch(createApiUrl("/api/session"), {
            cache: "no-store"
          })
        ]);

        if (!healthResponse.ok || !sessionResponse.ok) {
          throw new Error("API responded with a non-success status.");
        }

        const [health, session] = await Promise.all([
          healthResponse.json(),
          sessionResponse.json()
        ]);

        if (!cancelled) {
          setState({
            error: "",
            health,
            session
          });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            error:
              error instanceof Error
                ? error.message
                : "Could not reach the API skeleton.",
            health: null,
            session: null
          });
        }
      }
    }

    loadRuntimeState();

    return () => {
      cancelled = true;
    };
  }, []);

  const isConnected = Boolean(state.health);

  return (
    <section className="surface status-panel">
      <div className="section-label">Runtime link</div>
      <div className="status-chip-row">
        <span className={`status-chip ${isConnected ? "status-live" : "status-offline"}`}>
          {isConnected ? "API reachable" : "API offline"}
        </span>
        <span className="status-chip status-neutral">{API_BASE_URL}</span>
      </div>

      {state.health ? (
        <dl className="status-list">
          <div>
            <dt>Service</dt>
            <dd>{state.health.service}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{state.health.status}</dd>
          </div>
          <div>
            <dt>Session</dt>
            <dd>
              {state.session?.authenticated ? state.session.user?.email : "Anonymous skeleton"}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="support-copy">
          Run <code>npm run dev:api</code> from the repo root to light up live health and session
          status.
        </p>
      )}

      {state.error ? <p className="error-copy">{state.error}</p> : null}
    </section>
  );
}
