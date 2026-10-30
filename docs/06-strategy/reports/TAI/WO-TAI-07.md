# WO-TAI-07 report
Order: WO-TAI-07 (moderation normalization, T4 WO-T4-06 finding 3). Status: DONE. Base SHA: fc41625.
Files (om-ai.omdala.com): backend/src/live/moderation.ts (rewritten matcher), backend/src/moderation-bypass.test.ts (new, 11 tests), docs/OMAI_MODERATION_SCOPE.md (new).
Normalization before matching: NFKC (full-width), case folding, zero-width and soft-hyphen removal, Cyrillic look-alikes, Vietnamese diacritics (kept for "tự tử/tự sát/muốn chết" so "từ từ" is not flagged; stripped for "tu sat/muon chet"; "tu tu" only after muon/nghi den/dinh and only without diacritics), punctuation inside words, runs of single letters, digit/symbol swaps (1 tried as i and l), repeated letters, left word boundary (no "skill myself" hit). Added "suicidal". Response gained `method: "keyword_screen"`.
Commands (om-ai.omdala.com/backend): `npm run typecheck` pass; `npm test` 58 pass / 0 fail / 0 skip (was 47; +11 incl. one for every bypass class and a benign set); `npm run build` pass.
Evidence: VERIFIED_WORKTREE_ONLY.
Findings: the screen still flags discussion of the topic and misses paraphrase (tested as known limits); docs/OMAI_MODERATION_SCOPE.md says it is not a classifier. Release criteria in other docs that count it as moderation coverage should be corrected by their owners.
Next: WO-TAI-08.
