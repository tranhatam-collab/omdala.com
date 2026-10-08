# Om AI SDK Extensibility Plan

Version: 1.1
Status: Normalized for DEV handoff
Canonical product name: Om AI
Date: April 10, 2026
Owner: Team Om AI

## Boundary Normalization

This plan now focuses on Om AI extensibility for personas, providers, memory, curriculum, moderation, and workflow surfaces.

Gateway, device, and physical-control extensibility remain bridge-only unless re-promoted by canonical product planning.

## 1. Purpose

Define how approved third-party extensions may integrate with Om AI over time.

## 2. Extensibility Layers

- provider adapters
- persona packs
- curriculum packs
- memory import/export
- moderation and policy templates
- app actions and intent surfaces
- organization workflow templates

## 3. Extension Rules

- extensions must be policy-aware
- extensions must not bypass metering, moderation, or recap obligations
- extensions must declare capabilities explicitly
- extensions must support versioning and safe rollout
- extensions must respect workspace and plan boundaries

## 4. Future SDK Goals

- third-party persona packs
- language and curriculum expansions
- organization training templates
- safe workflow modules
- provider-specific adapters under Om AI router control
