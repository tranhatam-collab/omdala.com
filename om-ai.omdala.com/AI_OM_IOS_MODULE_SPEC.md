# Om AI iOS Module Spec

Version: 1.0
Status: Draft for DEV handoff

## 1. Purpose

Define the implementation modules for the native iOS app.

## 2. Module List

### 2.1 App Shell Module

- navigation
- session state
- deep links

### 2.2 Auth Module

- sign in
- token refresh
- session restore

### 2.3 Home Module

- quick actions
- active alerts
- approvals summary

### 2.4 Rooms Module

- room list
- room state cards
- device clusters

### 2.5 Voice Module

- mic capture
- speech-to-text
- transcript preview
- response playback

### 2.6 Scenes Module

- scene execution
- scene scheduling
- scene favorites

### 2.7 Activity Module

- execution history
- proof display
- denied action reasons

### 2.8 Memory Module

- aliases
- routines
- preferences

### 2.9 Settings Module

- permissions
- integrations
- privacy
- gateway linking

### 2.10 Planner Client Module

- submit intent
- receive plan
- show policy result

### 2.11 Proof Client Module

- fetch proof
- render before and after

### 2.12 Approval Module

- confirm sensitive actions
- reject sensitive actions

## 3. Required Frameworks

- SwiftUI
- HomeKit
- MatterSupport
- AccessorySetupKit
- Core Bluetooth
- AVFAudio
- Speech
- App Intents

## 4. Module Boundary Rules

- UI modules do not own policy logic
- planner client does not execute hardware actions directly
- proof client only reads and displays proof
- approval module only confirms or rejects requests
