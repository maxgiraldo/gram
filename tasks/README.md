# Tasks Directory

This directory contains individual task files to prevent conflicts when multiple agents work simultaneously.

## Structure

- Each task is a separate `.md` file
- File naming: `TRACK-TASK_ID-TITLE.md` (e.g., `1-1.1-database-schema-setup.md`)
- One agent per task file to avoid conflicts

## Task File Format

```markdown
# Task [TRACK].[ID]: [Title]

## Status

🟢 AVAILABLE | 🟡 ASSIGNED | 🔵 IN_PROGRESS | ✅ COMPLETED | ⏸️ BLOCKED

## Assignment

- **Agent**: [Agent Name or "None"]
- **Estimated Time**: X hours
- **Dependencies**: [List of task IDs]
- **Started**: [Timestamp]
- **Completed**: [Timestamp]

## Description

[Detailed task description]

## Deliverables

- [ ] Deliverable 1
- [ ] Deliverable 2
- [ ] Deliverable 3

## Implementation Notes

[Agent notes during implementation]

## Testing Requirements

[How to verify completion]

## Files Modified

[List of files created/modified]
```

## Agent Workflow

1. **Find Available Task**: Browse for tasks with 🟢 AVAILABLE status
2. **Claim Task**: Edit task file, set status to 🟡 ASSIGNED, add agent name
3. **Start Work**: Change status to 🔵 IN_PROGRESS
4. **Complete**: Set status to ✅ COMPLETED, update completion timestamp
5. **Notify Dependencies**: Check which tasks can now become available
