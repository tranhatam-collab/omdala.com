# Om AI App Intents Catalog

Version: 1.0
Status: Draft for DEV handoff
Product: Om AI

## 1. Purpose

Define the safe command set exposed through App Intents, Siri, Shortcuts, and other Apple system surfaces.

## 2. Principles

- expose only safe, high-frequency actions
- keep intents typed and deterministic
- require policy checks in backend before execution
- never expose dangerous actions without approval handling

## 3. Intent Groups

### Scene Intents

- `RunSceneIntent`
- `StopSceneIntent`
- `ScheduleSceneIntent`

### Device Intents

- `TurnOnDeviceIntent`
- `TurnOffDeviceIntent`
- `ToggleDeviceIntent`
- `SetDeviceLevelIntent`
- `SetDeviceModeIntent`

### Space Intents

- `ActivateRoomModeIntent`
- `SetRoomTemperatureIntent`
- `CloseRoomShadeIntent`
- `OpenRoomShadeIntent`

### Communication Intents

- `AnnounceIntent`
- `NotifyPersonIntent`
- `SpeakReplyIntent`

### Utility Intents

- `RequestApprovalIntent`
- `ShowActivityIntent`
- `ShowProofIntent`
- `ShowMemoryIntent`

## 4. Required Intent Fields

- `intent_id`
- `display_name`
- `parameters`
- `required_privilege`
- `policy_class`
- `approval_requirement`
- `supported_surfaces`

## 5. Surface Mapping

- Siri
- Shortcuts
- Spotlight where applicable
- App action surfaces

## 6. Non-Goals

- custom wake-word logic
- unrestricted background execution
- financial or regulated action intents
- bypassing planner or policy engine
