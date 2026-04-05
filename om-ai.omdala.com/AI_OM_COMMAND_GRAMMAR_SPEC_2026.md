# Om AI Command Grammar Spec 2026

## Purpose

Define the normalized action language used by Om AI before any execution.

## Design Rules

- every user intent must reduce to a typed command
- ambiguous commands must request clarification
- dangerous commands must require policy evaluation
- unsupported commands must fail safely

## Primitive Commands

```text
turn_on(device)
turn_off(device)
set_level(device, value)
set_temperature(zone, value)
set_lock_state(lock, state)
run_scene(scene_id)
pause_scene(scene_id)
resume_scene(scene_id)
notify(target, message)
speak_on(output_node, text)
request_approval(action, reason)
```

## Typed Arguments

- `device` must resolve to a device_id
- `zone` must resolve to a room or area in the graph
- `scene_id` must resolve to a stored scene
- `output_node` must resolve to a supported audio endpoint
- `target` must resolve to a user, group, or system channel

## Command Lifecycle

1. parse intent
2. normalize entities
3. validate capability match
4. evaluate policy
5. request approval if needed
6. dispatch execution
7. verify outcome
8. emit proof
