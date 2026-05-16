# Household Memory Model Spec 2026

## Purpose

Define the memory structure used to personalize Om AI for a household or workspace.

## Memory Types

- identity memory
- room memory
- device alias memory
- routine memory
- preference memory
- approval memory
- exception memory
- policy memory

## Required Fields

- memory_id
- space_id
- subject_type
- subject_id
- key
- value
- source
- confidence
- updated_at

## Examples

- room nickname mapping
- preferred bedtime scene
- guest restrictions
- trusted operator list
- night mode hours

## Rule

Memory may assist execution, but policy always decides execution.
