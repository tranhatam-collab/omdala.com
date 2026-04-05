# Om AI Gateway Plugin Spec

Version: 1.0
Status: Draft for DEV handoff

## 1. Purpose

Define the plugin interface for extending Om Gateway.

## 2. Plugin Types

- local IP plugin
- BLE plugin
- serial plugin
- vendor cloud relay plugin
- legacy hub plugin

## 3. Plugin Interface

Each plugin must provide:

- plugin_id
- name
- supported_protocols
- discover()
- execute(command)
- report_state()
- health_check()
- shutdown()

## 4. Plugin Constraints

- plugin must not bypass policy
- plugin must emit proof-related state
- plugin must fail safe on partial errors
- plugin must support versioning
