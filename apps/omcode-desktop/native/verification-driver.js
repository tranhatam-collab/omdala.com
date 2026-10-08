// Injected only by the native --native-e2e harness, never by the application UI.
// Retain the task in the page and return synchronous snapshots to Swift. Long
// callAsyncJavaScript completion handlers can become unreachable before settling.
(() => {
  if (window.__omcodeNativeVerification) return;
  let state = { status: "idle" };
  window.__omcodeNativeVerification = {
    task: null,
    start(run) {
      if (state.status !== "idle")
        throw new Error("Native verification already started");
      if (typeof run !== "function")
        throw new Error("Native verification requires a function");
      state = { status: "running" };
      this.task = Promise.resolve()
        .then(run)
        .then(
          (value) => {
            state = { status: "complete", value };
          },
          (error) => {
            state = {
              status: "failed",
              error: String(error?.message || error),
            };
          },
        );
      return "started";
    },
    snapshot() {
      return JSON.stringify(state);
    },
  };
})();
