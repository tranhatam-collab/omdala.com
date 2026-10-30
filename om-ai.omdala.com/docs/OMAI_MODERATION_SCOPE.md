# Om AI moderation scope

`backend/src/live/moderation.ts` is a **keyword screen, not a safety classifier**. Release criteria must not count it as one. Responses carry `method: "keyword_screen"`.

What it does: a deterministic, local check for a short list of self-harm phrases in English and Vietnamese. Input is normalized first: Unicode compatibility folding, case, zero-width characters, common Cyrillic look-alikes, Vietnamese diacritics (kept for "tự tử", stripped for unambiguous phrases), punctuation or spacing inside words, digit and symbol letter swaps (`1`, `0`, `3`, `4`, `5`, `7`, `@`, `$`, `!`) and repeated letters. It is applied to `POST /v2/live/moderation/check` and to the `goal` of a new session.

What it does not do: understand meaning or intent (it flags "suicide prevention class" and misses "I do not want to be alive any more"), cover other harm classes (violence, abuse, sexual content involving minors, bullying), cover other languages, or screen live transcripts, which do not exist yet. "tu tu" without diacritics counts only after "muon", "nghi den" or "dinh", because it is also "từ từ" (slowly).

Needed before any safety claim: a reviewed classifier behind the AI authority, escalation routing for flagged turns, child and family policy from the guardian model, and evaluation data in the target languages.
