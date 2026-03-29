"use client";

import { useState, useTransition } from "react";
import { createApiUrl } from "../lib/api";

export function MagicLinkForm() {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      try {
        const response = await fetch(createApiUrl("/api/auth/magic-link"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email })
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? "Request failed.");
        }

        setResult(payload);
      } catch (submissionError) {
        setResult(null);
        setError(
          submissionError instanceof Error ? submissionError.message : "Could not reach auth API."
        );
      }
    });
  }

  return (
    <form className="magic-form surface" onSubmit={handleSubmit}>
      <label className="field">
        <span>Email</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          placeholder="operator@omdala.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>

      <button className="primary-action" type="submit" disabled={isPending}>
        {isPending ? "Queuing link..." : "Request magic link"}
      </button>

      {result ? (
        <div className="callout success-callout">
          <strong>{result.message}</strong>
          <p>
            Request ID: <code>{result.requestId}</code>
          </p>
        </div>
      ) : null}

      {error ? (
        <div className="callout error-callout">
          <strong>Auth request failed</strong>
          <p>{error}</p>
        </div>
      ) : null}
    </form>
  );
}
