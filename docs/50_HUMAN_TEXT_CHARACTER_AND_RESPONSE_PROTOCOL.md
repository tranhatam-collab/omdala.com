# 50 Human Text Character And Response Protocol

Status: Approved
Priority: Mandatory web gate
Scope: Omdala.com only
Owner: Omdala.com dev, content, SEO, QA, design, AI, and release teams

## Verdict

This protocol is approved for Omdala.com as:

`APPROVED_AS_WEB_TEXT_SEO_QA_AND_REPORTING_GATE`

This protocol is not approved as:

`BACKEND_CHANGE_PROTOCOL`
`PAYMENT_CHANGE_PROTOCOL`
`LEGAL_MAPPING_CHANGE_PROTOCOL`
`AUTH_CHANGE_PROTOCOL`
`DATABASE_CHANGE_PROTOCOL`
`PRODUCTION_DEPLOYMENT_PROTOCOL`

It is a required gate before any Omdala.com page, report, or handoff may be called:

- `WEB_READY`
- `SEO_READY`
- `PUBLICATION_READY`
- `RELEASE_READY`

## Purpose

This protocol makes human-quality text part of the product system. Text is not decoration. On Omdala.com, public words shape trust, SEO, accessibility, product clarity, and release truth.

The protocol prevents five recurring failures:

- Text that looks generated or careless.
- Heading structure that is visually acceptable but semantically wrong.
- Metadata written only to fill a field.
- Reports that claim completion without evidence.
- UI work that improves layout while weakening the words.

## Applies To

This protocol applies to:

- Public page copy.
- Navigation text.
- Footer text.
- CTA text.
- Form labels.
- Placeholder text.
- Error messages.
- Empty states.
- Status labels.
- Trust statements.
- Legal notes shown on public pages.
- Meta title.
- Meta description.
- OG title.
- OG description.
- Twitter metadata.
- Schema name and description.
- Image alt text.
- Image caption.
- Markdown docs.
- QA reports.
- SEO reports.
- Release evidence.
- Team handoff files.
- Team command files.
- CMS export or content registry used by Omdala.com.

## Does Not Apply To

This protocol does not authorize changes to:

- Backend logic.
- Payment logic.
- Invoice routing.
- Legal entity mapping.
- Authentication.
- Authorization.
- Database schema.
- User data.
- Production deployment.
- Third-party library output.
- Required protocol identifiers.

If a text issue requires code work outside public copy, metadata, content source, QA, or reporting, create a separate technical work order.

## Omdala.com Strictness Level

Omdala.com uses:

`PUBLICATION_STRICTNESS`

Primary focus:

- Public pages.
- Category and article-like pages.
- Homepage.
- Trust pages.
- Product explanation pages.
- Contact and support pages.
- Membership or community copy.
- SEO metadata.
- Image alt text.
- Footer and legal notes.
- Release reports.

Omdala.com must not look like a page completed by automation alone. It must read like a serious public platform with clear state, plain wording, and verifiable evidence.

## Human Text Standard

Every public text block must pass these rules:

- Write in a natural human rhythm.
- Use clear sentences.
- Avoid fake urgency.
- Avoid inflated marketing claims.
- Avoid decorative symbols.
- Avoid AI-style punctuation rhythm.
- Avoid vague completion claims.
- Avoid saying more than the product state proves.
- Avoid mixing languages in one block unless there is a clear product reason.
- Keep Vietnamese text fully accented.
- Keep English text natural and not literal translation from Vietnamese.

## Plain Character Rule

Final public text, reports, metadata, and team handoffs must avoid decorative or AI-looking characters.

Do not use:

- Emoji as decoration.
- Decorative arrows.
- Decorative symbols.
- Repeated punctuation for emphasis.
- Unicode dash used for visual style.
- Smart-symbol rhythm that makes the text look automated.

Allowed:

- Normal punctuation required by grammar.
- Technical punctuation required by a standard token.
- Source quotes that must preserve exact wording.
- Legal source references that must remain exact.

## Hyphen Rule

Use plain hyphen only when needed for normal language or technical tokens.

Do not use hyphenation as decoration.

Do not rewrite technical tokens only to satisfy character hygiene.

Examples that may keep required characters:

- `JSON-LD`
- `x-default`
- `application/ld+json`
- `og:image`
- `font-display`
- `hreflang`
- `SHA-256`
- `EIP-712`
- `ERC-721`
- `tokenURI`
- `OpenGraph`
- `API`
- `webhook`
- `metadata`

Public explanation around technical tokens must still be human-readable.

## H Standard

Every public page must have:

- One H1 only.
- H1 that states the page role clearly.
- H2 structure that supports the page story.
- H3 only under the correct H2.
- No heading used only for visual size.
- No hidden completion claim in heading text.
- No vague H1 such as `Welcome`, `Explore`, or `Solutions` unless the page role makes it precise.

Fail examples:

- Multiple H1 elements.
- Missing H1.
- H2 before H1.
- H3 used as a design label without hierarchy.
- Heading promises not supported by product evidence.

## SEO Text Gate

Every public page must have language-specific SEO text where applicable:

- Meta title.
- Meta description.
- Canonical.
- OG title.
- OG description.
- OG image.
- Twitter title and description if used.
- Schema name and description if schema is used.
- Alt text for meaningful images.
- Internal links that match the active language and page role.

SEO text must be human-readable. It must not be filler, machine translation, or duplicated across unrelated pages.

## Character Hygiene Gate

A page fails this gate if final public text contains:

- Decorative symbols.
- Unapproved emoji.
- Unicode punctuation used only for style.
- Missing Vietnamese diacritics.
- AI-looking punctuation patterns.
- Placeholder text.
- Mixed-language blocks without reason.
- CTA text that overpromises.
- Metadata that is empty, duplicated, or generic.

This gate requires both:

- Automated scan.
- Human review.

A script scan alone is not enough.

## True State Gate

No Omdala.com report, page, or release note may claim readiness without evidence.

Use explicit states:

- `WEB_COPY_DRAFT`
- `WEB_COPY_PASS`
- `CHARACTER_HYGIENE_FAIL`
- `H_STANDARD_FAIL`
- `SEO_METADATA_INCOMPLETE`
- `SEO_READY_PENDING_QA`
- `A11Y_READY_PENDING_QA`
- `RELEASE_READY_PENDING_EVIDENCE`
- `WEB_READY`

Do not use:

- `gan xong`
- `on roi`
- `looks good`
- `ready tam`
- `da ok`
- Any casual phrase that hides real status.

## Definition Of Done For Each Page

A public page can be called done only when every item below is checked:

- [ ] One H1 only.
- [ ] H2 and H3 hierarchy valid.
- [ ] No forbidden decorative characters.
- [ ] Vietnamese diacritics correct.
- [ ] English copy natural, not literal translation.
- [ ] Meta title exists.
- [ ] Meta description exists.
- [ ] Canonical exists.
- [ ] OG title exists.
- [ ] OG description exists.
- [ ] OG image exists.
- [ ] Alt text exists for meaningful images.
- [ ] True state declared.
- [ ] QA evidence attached.

## SEO Audit Additions

SEO audit for Omdala.com must check:

- Title is human-readable.
- Description is human-readable.
- No decorative symbols.
- No AI-style punctuation rhythm.
- No fake urgency.
- OG text matches the page language.
- Alt text describes the image.
- H1 matches page role.
- No multiple H1.
- No hidden completion claim.

## Required Report Shape

Every web, SEO, QA, release, and team handoff report must use this shape:

```text
Verdict:
Evidence checked:
Pass:
Fail:
Blocked by Founder:
Blocked by external asset:
True state:
Team command:
Hard stop:
```

Reports must be brief, evidence-based, and honest about what was not checked.

## Stop Conditions

Do not call a page `WEB_READY` if any of the following is true:

- Forbidden characters remain in final public text.
- H hierarchy is broken.
- H1 is missing.
- More than one H1 exists.
- Title is missing.
- Description is missing.
- Canonical is missing.
- OG image is missing.
- Important alt text is missing.
- Language quality is weak.
- True state is unclear.
- QA evidence is missing.

## Web Implementation Boundary

This protocol applies to visible text, SEO metadata, public HTML text, content source, CMS export, QA reports, release notes, and team commands.

It does not authorize changes to backend logic, payment logic, invoice routing, legal entity mapping, authentication, database schema, user data, or production deployment.

If a text issue requires code change, create a separate technical work order and route it to the correct engineering owner.

## Technical Token Exception

Technical identifiers may keep required characters when they are part of:

- Standard names.
- Routes.
- API fields.
- Schema properties.
- Protocol names.
- File names.
- Package names.
- Legal source references.
- Third-party source quotes.

Do not rewrite technical tokens for character hygiene.

Do review the public explanation around those tokens.

## Team Command

`TEAM_COMMAND`

Action:

Apply `HUMAN_TEXT_CHARACTER_AND_RESPONSE_PROTOCOL` as a mandatory gate for all Omdala.com web copy, SEO metadata, public page reports, QA reports, release notes, and team handoff files.

Allowed files:

- Content registry.
- SEO registry.
- UI copy registry.
- Public page copy.
- Metadata files.
- CMS export.
- HTML text.
- Markdown docs.
- QA reports.
- Release evidence.
- Sitemap review reports.
- Robots review reports.
- Image alt text inventory.

Forbidden actions:

- Do not change backend logic.
- Do not change payment logic.
- Do not change invoice routing.
- Do not change legal mapping.
- Do not change authentication.
- Do not change database schema.
- Do not deploy production.
- Do not rewrite technical tokens blindly.
- Do not claim ready without evidence.

Required evidence:

- Character hygiene result.
- H standard result.
- SEO metadata result.
- Rendered page check.
- Language check.
- True state.
- Team command.
- Release evidence if claiming release-ready.

Stop condition:

If any page has forbidden characters in final text, broken H hierarchy, missing H1, missing title, missing description, missing canonical, missing OG image, missing important alt text, or unclear true state, do not call it web-ready.

Next report required:

Create a URL-by-URL inventory with columns:

- URL.
- Page role.
- H1 status.
- Character hygiene.
- SEO metadata.
- Canonical.
- OG image.
- Alt text.
- Language.
- True state.
- Next action.

## Hard Stop

Do not call any Omdala.com web surface ready only because the interface renders.

From now on, `WEB_READY` is valid only when these are complete:

- Character hygiene pass.
- H standard pass.
- Language pass.
- SEO pass.
- Basic accessibility pass.
- Rendered page evidence.
- True state.
- Release evidence.

Final conclusion:

Apply this file immediately as the Omdala.com web text, SEO, QA, and reporting gate. It is not permission to change backend, payment, legal, authentication, database, or production deployment behavior.
