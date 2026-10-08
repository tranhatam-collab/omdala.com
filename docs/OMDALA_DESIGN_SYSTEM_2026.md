# OMDALA DESIGN SYSTEM 2026

## 1. Purpose

Define the visual system for OMDALA so product, design, and frontend implementation stay consistent across the global platform.

This document should guide UI decisions before a full component library is implemented.

---

## 2. Core Principles

The visual system should be:

- minimal
- dark-first
- calm but high-signal
- trust-oriented
- system-grade rather than decorative

The interface should feel operational, not noisy.

---

## 3. Visual Tone

OMDALA should communicate:

- confidence
- clarity
- control
- modern infrastructure
- explainable intelligence

Avoid:

- gimmicky neon overload
- hyperactive motion
- social-feed aesthetics
- consumer-app visual noise

---

## 4. Color System

### Primary Signals

- trust / success: `#00FF88`
- information / active edge: `#7EF2FF`
- brand infrastructure blue: `#3D8BFF`

### Surfaces

- background: `#0B0B0B`
- elevated surface: `#111111`
- deep background: `#040816`

### States

- error: `#FF4444`
- warning: `#FFB020`
- muted text: `rgba(255,255,255,0.68)`

Rules:

- use color to communicate trust and state, not decoration
- keep contrast high for production readability

---

## 5. Typography

Recommended fonts:

- Inter
- SF Pro

Typography rules:

- large, clear headings
- compact but breathable body spacing
- stable rhythm across dashboard and public pages
- avoid overly condensed text for system surfaces

---

## 6. Component System

### Buttons

Required variants:

- primary
- secondary
- ghost
- danger

Behavior:

- clear hierarchy
- no ambiguous click targets
- hover and active states must be visible but restrained

### Cards

Required card types:

- node card
- commitment card
- proof card
- trust summary card

Behavior:

- strong surface separation
- concise metadata presentation
- support for action footer when needed

### Graph Nodes

Required style:

- circle or rounded node container
- trust ring around the node
- glow or emphasis only for active selection or trust change

---

## 7. Motion System

Rules:

- target 60fps only
- use subtle glow and transition states
- animate state change, not everything
- avoid long decorative animation loops

Recommended use cases:

- trust updates
- transition progress
- proof verified state
- node selection in Reality Map

---

## 8. Reality Map Style

Reality Map should use:

- dark canvas
- neon but restrained edges
- soft shadow depth
- visible trust rings
- clear node hierarchy

The map should feel like a system interface, not a toy graph.

---

## 9. UX Rules

- every important action must be legible in one scan
- trust and proof should always be visible when relevant
- system state must be explainable
- compact does not mean cramped

---

## 10. Next Actions

1. Convert these rules into design tokens.
2. Define component specs for app and docs.
3. Build Reality Map interaction states.
4. Align marketing and product surfaces to one visual language.
