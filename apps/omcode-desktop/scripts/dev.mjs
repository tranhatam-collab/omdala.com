import { build } from "vite";
import { startServer } from "../server/index.mjs";

await build();
const runtime = await startServer();
console.log("OMCODE: " + runtime.origin + "/#" + runtime.token);
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => runtime.close().finally(() => process.exit()));
