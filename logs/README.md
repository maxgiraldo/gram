# Agent Activity Logs

This directory tracks the work and progress of all agents working on the Gram project.

## Log Structure

Each agent has their own log file: `{AGENT_NAME}-log.md`

### Log Format
- **Agent Status**: Current availability (🟢 AVAILABLE | 🟡 ASSIGNED | 🔵 IN_PROGRESS)
- **Current Assignment**: Active task details
- **Work Log**: Chronological activity entries
- **Task History**: Completed tasks with outcomes
- **Performance Metrics**: Productivity and quality tracking

### Status Legend
- 🟢 **AVAILABLE**: Ready for new task assignment
- 🟡 **ASSIGNED**: Task claimed but not started
- 🔵 **IN_PROGRESS**: Actively working on task
- ✅ **TASK_COMPLETED**: Just finished a task, updating logs
- 🚫 **OFFLINE**: Agent not active

## Current Active Agents

### ZenCoder
- **File**: [`ZenCoder-log.md`](./ZenCoder-log.md)
- **Status**: 🟢 AVAILABLE
- **Specialization**: TBD
- **Current Task**: None

## Coordination Notes

- Check agent logs before assigning overlapping tasks
- Agents should update their own logs when taking/completing tasks
- Engineering Manager monitors all logs for bottlenecks and coordination
