# Om AI Dev Task Breakdown

Version: 2.0
Status: Immediate build plan
Priority: Highest for today

## Track 0: Source Of Truth Lock

- lock `Om AI` brand language across core docs and visible app labels
- lock master spec for dual-product architecture
- lock Om AI Live extension spec
- lock API and iOS contracts for live sessions

## Track 1: Backend Reality Stabilization

- keep reality planner, approvals, proof, and memory contracts stable
- tighten route schemas and persistence boundaries
- preserve current gateway, rooms, scenes, and proof skeletons

## Track 2: Backend Live Foundation

- add persona registry endpoints
- add live session create and end endpoints
- add usage metering service
- add recap persistence contract
- add moderation and escalation contract

## Track 3: iOS Live Surface

- build call list and persona picker
- build active call shell with timer, mute, speaker, and fallback states
- build recap view after call end
- add quota warnings and upgrade prompt surfaces

## Track 4: Android Live Surface

- build Android call list and persona picker
- build active call shell with audio focus, route controls, and reconnect states
- build voice-only first flow with avatar fallback support
- build recap and upgrade prompt surfaces

## Track 5: Realtime And Provider Adapters

- implement OpenAI realtime adapter contract
- implement Tavus adapter contract
- implement HeyGen LiveAvatar adapter contract
- add provider fallback to audio-only mode

## Track 6: Curriculum And Memory

- create persona schema store
- create lesson plan schema store
- create short recap pipeline
- create learner progress memory fields

## Track 7: Monetization

- enforce 30 free minutes/day on backend
- implement free-plan warning states
- add subscription package contract
- add upgrade entry points in call and recap flows

## Track 8: Safety And Moderation

- define wellness-safe prompt boundaries
- define crisis redirection and escalation behavior
- block regulated diagnosis flows
- log moderation decisions for review

## Track 9: Web And Admin Support

- add persona management console stubs
- add live usage dashboard stubs
- add lesson-plan admin stubs
- add moderation review stubs

## Track 10: QA And Launch Readiness

- validate reality flows still work after brand and contract changes
- validate live session creation and quota logic
- validate graceful fallback when avatar provider fails
- validate recap and analytics events after session end
