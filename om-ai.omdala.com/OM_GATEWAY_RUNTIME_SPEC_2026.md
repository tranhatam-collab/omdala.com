# Om Gateway Runtime Spec 2026

## Purpose

Define the local runtime that bridges Om AI to devices outside native Apple Home / Matter support.

## Responsibilities

- local discovery
- protocol translation
- device health checks
- queue buffering
- retry logic
- offline scenes
- secure relay to OMDALA backend
- proof forwarding

## Supported Bridge Types

- local IP APIs
- BLE peripherals
- serial-connected devices
- legacy hubs
- vendor cloud fallbacks

## Runtime Properties

- must be resilient to network loss
- must preserve execution auditability
- must expose device health state
- must support safe shutdown behavior
