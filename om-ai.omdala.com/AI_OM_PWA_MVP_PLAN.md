# Om AI PWA MVP Plan

Version: 2.0
Status: Locked for DEV handoff

## 1. Goal

Ship the orchestration and admin surface for Om AI at `ai.omdala.com`.

## 2. MVP Promise

The web surface must support chat, memory, policies, scenes, logs, proofs, gateway views, device graph exploration, persona catalog review, and live usage visibility.

## 3. MVP Modules

### 3.1 Auth Shell

- sign in
- session restore

### 3.2 Reality Workspace

- text input
- conversation history
- planner result view
- scene and proof shortcuts

### 3.3 Live Workspace

- persona catalog
- usage today card
- recent recaps
- lesson-plan list

### 3.4 Memory

- aliases
- routines
- preferences
- learner goals

### 3.5 Policy

- policy editor
- safety class view
- approval requirements
- wellness boundary copy review

### 3.6 Activity

- runs
- proofs
- failures
- approvals
- live session history

### 3.7 Gateway

- gateway list
- health view
- last heartbeat

### 3.8 Device Graph

- rooms
- devices
- capabilities
- support matrix

## 4. PWA Rules

- orchestration-first
- admin-first for persona and usage review
- no native trust claims
- no deep hardware control claims

## 5. MVP Acceptance Criteria

1. User can manage memory and scenes.
2. User can inspect proofs, activity, and recent live recaps.
3. User can edit policies and review wellness boundaries.
4. User can see gateway health.
5. User can view usage remaining and available personas.
6. Web surface never becomes the only trusted execution path for device control or call-grade audio.
