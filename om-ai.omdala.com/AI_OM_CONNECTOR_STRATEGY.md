# Om AI Connector Strategy

Version: 1.0
Status: Draft for DEV handoff

## 1. Goal

Define how Om AI expands device coverage through vendor connectors.

## 2. Connector Tiers

### Tier 1

Native Apple Home / Matter direct control

### Tier 2

Local bridges through Om Gateway

### Tier 3

Vendor cloud APIs

### Tier 4

Enterprise or property-specific custom connectors

## 3. Connector Rules

- explicit auth
- explicit latency class
- explicit failure model
- explicit proof source
- explicit revoke path

## 4. Connector Lifecycle

1. register
2. authenticate
3. test capability
4. validate proof source
5. enable control
6. monitor health
7. revoke if needed

## 5. Initial Priorities

- lighting
- climate
- locks
- blinds
- audio endpoints
- sensors
