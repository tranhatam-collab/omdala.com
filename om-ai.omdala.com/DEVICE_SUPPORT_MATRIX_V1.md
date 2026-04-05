# Om AI Device Support Matrix v1

Version: 1.0
Status: Draft for DEV handoff
Product: Om AI

## 1. Purpose

Define the first supported device classes and execution paths for Om AI.

## 2. Support Tiers

### Tier A

Native Apple Home / HomeKit devices

### Tier B

Matter devices

### Tier C

Bluetooth and Wi-Fi accessories via supported native setup flows

### Tier D

Local IP or proprietary devices via Om Gateway

### Tier E

Cloud connector devices

### Tier F

Unsupported or unknown devices

## 3. Required Matrix Columns

- device family
- vendor
- protocol
- onboarding path
- execution path
- reportable state
- approval class
- safety class
- latency class
- offline availability
- proof source

## 4. Example Matrix Rows

| Device Family | Vendor | Protocol | Onboarding Path | Execution Path | Reportable State | Approval Class | Safety Class | Latency | Offline | Proof Source |
|---|---|---|---|---|---|---|---|---|---|---|
| Light switch | Mixed | HomeKit / Matter | Native | Native | Yes | Low | Low | Low | Partial | Native readback |
| Smart lock | Mixed | HomeKit / Matter | Native | Native | Yes | High | Sensitive | Low | Partial | Native readback |
| Thermostat | Mixed | HomeKit / Matter | Native | Native | Yes | Medium | Medium | Medium | Partial | Native readback |
| BLE speaker | Mixed | BLE | Native setup | Native or gateway | Partial | Medium | Low | Medium | No | Audio/session report |
| LAN sensor | Mixed | IP | Gateway | Gateway | Yes | Low | Low | Low | Yes | Gateway report |
| Legacy relay | Mixed | Proprietary | Gateway | Gateway | Partial | High | High | Medium | Yes | Gateway report |

## 5. Matrix Rules

- do not claim support until onboarding and proof are verified
- each device family must have an explicit fallback path
- sensitive classes must be labeled before exposure in UI
