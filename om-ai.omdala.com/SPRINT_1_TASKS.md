# SPRINT 1 TASKS

Product: Om AI
Repo: `omdala.com/om-ai.omdala.com`

## Goal

Lock live-session shell, auth, reconnect behavior, and core mobile contracts.

## Owner lanes

### iOS lead
- [ ] Implement auth and session restore
- [ ] Implement live-session shell
- [ ] Implement reconnect and session timeout behavior
- [ ] Implement deep-link entry

### Android lead
- [ ] Implement auth and session restore
- [ ] Implement live-session shell
- [ ] Implement reconnect and session timeout behavior
- [ ] Implement deep-link entry

### Backend contract lead
- [ ] Freeze `/v2/live` request and response shapes
- [ ] Freeze moderation and metering fields
- [ ] Freeze persona and lesson summary payloads

### QA / release owner
- [ ] Define live-call smoke matrix
- [ ] Define network-drop and reconnect test cases
- [ ] Define staging acceptance for mobile session lifecycle

## Exit gate

- [ ] live-session shell works on both platforms
- [ ] reconnect path is testable
- [ ] backend contract is frozen for sprint 2
