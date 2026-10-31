# WO-TAI-04 report
Order: WO-TAI-04 (MOB-02 toolchain). Status: PARTIAL (Linux-side verified; device/macOS items listed). Base SHA: e5eb70e. Files changed: none (report only).
Pinned: CI Node 22.22.3 (`.nvmrc`; container ran 22.22.0). app: expo ^57.0.27, react 19.2.3, react-native 0.86.3, jest-expo ~57.0.5, TypeScript ~6.0.3, tsx ^4.19.2; lockfile `app/package-lock.json`, `npm ci`.
Linux, run here: `npm ci` ok; `npm test` (= `test:contract` tsx node tests, `test:unit` jest, `typecheck`) 15 node pass, jest 3 suites / 4 tests pass, typecheck ok; `npx expo export --platform android` exit 0 (Metro bundles the app, no SDK needed).
Needs more than this container: `expo run:android` (no ANDROID_HOME / SDK; Java and Gradle 8.14.3 present), `expo run:ios` and all Xcode builds (macOS only), `omai/omaiTests` and `omaiUITests` (Xcode, simulator), any real device or push/audio test.
Config gaps (not fixed, owner decision): (1) `app/app.json` has no `ios.bundleIdentifier` or `android.package`, so `expo prebuild` and store builds cannot be reproduced; (2) `omai/omai.xcodeproj` bundle ids are the corrupted string `sudo-xcode-select--s--Applications-Xcode.app-Contents-Developer.omai*`, deployment target 26.4, Swift 5.0; (3) `ios/AIOmApp/**` Swift sources and `ios/README.md` are not referenced by any Xcode project or Package.swift, and `omai/omai` is the Xcode template; (4) `android/` is a README only; (5) CI mobile job covers the Expo app only. I did not invent identifiers.
Evidence: VERIFIED_WORKTREE_ONLY.
Next: owner picks the real bundle id / package name, then a config-only order.
