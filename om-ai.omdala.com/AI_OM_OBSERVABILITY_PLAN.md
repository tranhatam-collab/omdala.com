# AI_OM_OBSERVABILITY_PLAN.md

Version: 2.0  
Status: Locked Om AI observability plan  
Canonical product name: Om AI  
Legacy filename namespace: `AI_OM_*` retained for continuity  
Date: April 9, 2026

---

# 0. Boundary Normalization - April 9, 2026

This file is normalized to the current Om AI boundary.

- `Om AI` is not `OmCode`
- `Om AI` is not `Omniverse`
- observability must focus on live sessions, account and billing dependencies, recap, safety, and provider behavior
- gateway, proof, device, and physical-control metrics are now `legacy-transition` or `bridge-only`

---

# 1. Purpose

This file defines what Om AI must observe to remain operable as a live AI human interaction product.

Observability goals:

- detect session failure quickly
- detect degraded provider behavior quickly
- detect account or billing dependency breakage quickly
- detect moderation and family-safe issues quickly
- detect recap and memory pipeline failure quickly

---

# 2. Core Metric Groups

## 2.1 Live Session Metrics

Track:

- session create success rate
- session create latency
- realtime bootstrap success rate
- realtime connect success rate
- reconnect rate
- reconnect recovery success rate
- average session length
- end-session success rate

## 2.2 Audio and Avatar Metrics

Track:

- voice-only session rate
- avatar enabled session rate
- avatar fallback rate
- route change events
- interruption recovery rate

## 2.3 Usage and Plan Metrics

Track:

- usage fetch success rate
- free-minute warning delivery rate
- free-limit soft landing rate
- upgrade prompt exposure rate
- plan visibility fetch success rate

## 2.4 Shared Dependency Metrics

Track:

- account/profile fetch success rate
- preferences fetch success rate
- billing subscriptions fetch success rate
- billing usage fetch success rate
- shared dependency latency bands

## 2.5 Learning and Recap Metrics

Track:

- recap generation success rate
- recap latency
- next recommendation generation rate
- memory update success rate

## 2.6 Safety Metrics

Track:

- moderation checks triggered
- policy blocks returned
- escalation flow triggers
- child-safe restriction blocks

---

# 3. Logging Requirements

Structured logs must exist for:

- session create, connect, reconnect, end
- provider route decision
- avatar provider fallback
- usage warning events
- recap pipeline completion or failure
- memory fetch or update failures
- shared account or billing dependency failures
- moderation and escalation decisions

Logs must be searchable by:

- request id
- session id
- user id or workspace id where policy allows
- provider id

---

# 4. Dashboard Requirements

Required dashboards:

1. Live Session Health
2. Provider and Fallback Health
3. Shared Dependency Health
4. Moderation and Family Safety Health
5. Recap and Learning Pipeline Health

These dashboards should answer:

- are users able to start and complete sessions
- are providers degrading
- are shared profile or billing dependencies failing
- are safety policies behaving as expected
- are recap and memory systems still adding value

---

# 5. Alerting Priorities

Page or urgent alert:

- session create failure spike
- realtime connect failure spike
- widespread usage or plan fetch failure
- recap pipeline outage
- moderation outage

High-priority alert:

- avatar fallback spike
- reconnect recovery degradation
- account/profile dependency degradation
- billing visibility dependency degradation

Informational alert:

- lesson recommendation quality drift
- increased support diagnostics events

---

# 6. Shared Platform Coordination

Because Om AI now depends partially on shared platform surfaces, observability must preserve boundary clarity:

- shared platform may own baseline account or billing health metrics
- Om AI must maintain product-facing dependency health views
- Om AI must not assume shared platform alerts fully represent Om AI user impact

If shared platform is green but Om AI product impact is red, Om AI still owns the product incident.

---

# 7. Legacy Transition Rule

Historical metrics such as:

- gateway health
- proof verification rate
- device health
- scene execution latency

are not primary Om AI observability targets anymore.

They may only remain as:

- bridge-only dashboards
- legacy-transition panels
- future cross-product coordination references

---

# 8. Final Lock

The canonical Om AI observability plan is:

- live-session first
- provider aware
- shared dependency aware
- recap and memory aware
- safety aware
- bridge-only for old reality scope
