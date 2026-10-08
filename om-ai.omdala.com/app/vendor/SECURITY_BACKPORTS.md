# Mobile dependency security backports

These directories are reviewable internal forks for high-severity advisories that had no patched npm release on 2026-10-08. Their versions contain +omdala build metadata to identify Omdala's synthetic fork state; they are not official upstream releases.

A clean npm audit result is only a version-range observation. It does not prove that a backport is correct. Acceptance also requires exact patch and complete-tree hashes, exploit regression tests, valid controls, upstream source-suite evidence where feasible, and a successful Expo/Metro export.

## braces

- Source: official npm braces@3.0.3 tarball.
- Backport: all runtime changes represented by the eight-commit upstream PR #72 final head 28d440b5dd449dbf1fe6f3506cf94ecca4d02660. GitHub's raw patch contains five non-merge patch records; the three additional commits merge those reviewed follow-ups.
- Applied runtime coverage: parse, compile, expand, and stringify, including caller-supplied deep ASTs, cyclic parent chains, fractional maxDepth, and escapeInvalid compatibility.
- The vendored patch bytes are preserved at patches/braces-pr-72.patch.
- The published tarball's development-only dependencies are removed from the internal runtime package metadata; they are not part of braces runtime and would add obsolete Mocha tooling to the app install.

The public methods accept 100 nested brace or parenthesis nodes and reject 101. Values above 100 are capped, while stricter and fractional limits are honored.

## node-forge

- Source: official npm node-forge@1.4.0 tarball and Git tag v1.4.0 commit fa385f92440879601240020f158bed68e444e83a.
- Backport: upstream PR #1152 commit ceba34402e329f0365134f23fe19898756527d65.
- Applied runtime coverage: lib/rsa.js, requiring the nested DigestAlgorithm element count.
- The vendored patch bytes are preserved at patches/node-forge-pr-1152.patch.
- Prebuilt dist/ and legacy Flash outputs are deliberately excluded so the app cannot import an unpatched alternate build.

The local contract uses the exact upstream forged-signature vector and valid signing controls. The release assessment must state whether the full upstream source suite and Expo certificate/signing flows ran successfully.

## Unresolved moderate advisory

There is no sprintf-js fork or direct override. GHSA-hp3w-g68c-fv3c is moderate and has no upstream fixed release. The package is absent from the final installed tree because replacing the vulnerable js-yaml 3.x tooling path with js-yaml 4.3.2 also removes its argparse 1.x parent. If sprintf-js returns through another dependency, the high/critical gate may leave that moderate advisory visible.

SECURITY_BACKPORTS.json records tarball provenance, raw patch hashes, and a deterministic SHA-256 for every byte in each vendored package tree. The regression test recomputes those hashes. Replace an internal fork only after an official upstream release passes the same exploit and compatibility tests.

The app also overrides only @istanbuljs/load-nyc-config's js-yaml dependency to 4.3.2. Its declared js-yaml 3.x line has unresolved high-severity parser advisories and has no patched 3.x release. Jest and the app contract suite are the compatibility controls for that tooling-only override.
