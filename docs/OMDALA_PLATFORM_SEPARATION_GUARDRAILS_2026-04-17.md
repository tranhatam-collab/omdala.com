# OMDALA Platform Separation Guardrails

Effective date: April 17, 2026
Owner: Tran Ha Tam
Scope: OMDALA team only

## Purpose

This document exists to protect `omdala.com` from mixed-brand drift.

It defines only what the `OMDALA` team must enforce inside this repository, this product, and this public site.

## Decision lock

From April 17, 2026 onward:

- `OMDALA` is a standalone platform
- `omdala.com` must be positioned, built, and operated independently
- non-OMDALA platforms are outside the implementation scope of this repository
- no external brand may be described inside OMDALA as a node, child layer, local skin, or derivative product

## What the OMDALA team must do

### 1. Public brand boundary

- keep `omdala.com` copy focused on OMDALA only
- remove public wording that implies OMDALA depends on or contains another platform
- avoid using any external platform as an explanatory shortcut in hero copy, definition pages, SEO copy, or navigation

### 2. Product boundary

- keep OMDALA roadmap centered on coordination, trust, proof, and execution
- do not use external platform requirements to define OMDALA product scope
- treat any future connection as a separate integration, not shared platform identity

### 3. Architecture boundary

- no shared routing assumptions
- no shared auth or cookie model
- no shared data model by default
- no cross-platform dependency unless a written interface contract is approved

### 4. Documentation boundary

- source-of-truth docs in this repo must speak for OMDALA only
- if an external platform is mentioned, mention it only as an external boundary reference
- do not maintain implementation checklists or delivery plans for non-OMDALA teams in this repository

## Immediate OMDALA actions

1. lock root README to OMDALA-only scope
2. update public homepage and SEO copy to frame OMDALA as independent
3. remove newly added mixed-scope execution documents from this repo
4. leave any future non-OMDALA planning to its own team

## Definition of done

This guardrail is satisfied when:

- OMDALA public copy stands on its own
- OMDALA source-of-truth docs do not prescribe work for external teams
- no new architecture decision quietly reconnects the two platforms

## Founder note

The OMDALA team is responsible for keeping OMDALA clean, independent, and internally coherent.
