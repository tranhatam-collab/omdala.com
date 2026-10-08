// The browser selects only a deployment. Credential and authority identity are
// resolved by the native/server boundary and never enter this form.
export function aiagentConnectionForm(providers, environment) {
  if (!["production", "staging"].includes(environment))
    throw new Error("Unknown AIAGENT environment");
  const id = environment === "staging" ? "aiagent-staging" : "aiagent";
  const baseUrl =
    environment === "staging"
      ? "https://staging-api.aiagent.iai.one"
      : "https://api.aiagent.iai.one";
  const existing = providers.find(
    (provider) => provider.id === id && provider.baseUrl === baseUrl,
  );
  return {
    id,
    baseUrl,
    kind: "iai-one",
    name:
      existing?.name ||
      (environment === "staging" ? "AIAGENT staging" : "AIAGENT IAI.ONE"),
    model: existing?.model || "",
  };
}
