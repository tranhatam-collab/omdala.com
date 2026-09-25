import path from "node:path";

import { verifyCandidateBundle } from "./bundle-verifier.mjs";

const moduleRoot = path.resolve(import.meta.dirname, "..");
const app = path.resolve(
  process.env.OMCODE_VERIFY_APP ||
    process.argv[2] ||
    path.join(moduleRoot, "release/OMCODE.app"),
);
const result = await verifyCandidateBundle(app, moduleRoot);
console.log(JSON.stringify(result, null, 2));
