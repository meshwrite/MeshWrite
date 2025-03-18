# Task Card Template

This document defines the exact format for task cards. All task cards must follow this structure.

```json
{
	"metadata": {
		"task_id": "unique-identifier", // UUID for the task
		"created_at": "timestamp", // ISO 8601 timestamp
		"updated_at": "timestamp", // ISO 8601 timestamp
		"status": "active", // active/completed/abandoned
		"parent_task_id": null // UUID of parent task if this is a subtask
	},
	"task_title": "string", // Concise, descriptive title
	"description": "string", // Brief overview of goals and requirements
	"steps": [
		{
			"step_number": 1, // Integer, starting from 1
			"description": "string", // Brief description of what this step accomplishes
			"status": "planned", // planned/in_progress/completed
			"subtask_id": null, // UUID of subtask if this step created one
			"comments": [
				// Array of strings
				"string" // Additional information or notes about this step
			]
		}
	],
	"context": [
		// Array of strings
		"string" // Important contextual information
	],
	"notes": [
		// Array of strings
		"string" // Important observations, decisions, or challenges
	]
}
```

## Guidelines

1. Keep all sections concise but informative
2. Update the card regularly as the task progresses
3. Include only essential information that helps maintain context
4. Use clear, specific language
5. Focus on actionable information
6. Remove outdated or irrelevant information
7. Maintain chronological order in steps and notes
8. The task card must not go over 200 lines, summarize if necessary

## Field Descriptions

### metadata

- `task_id`: Unique identifier for the task (UUID)
- `created_at`: When the task was created (ISO 8601)
- `updated_at`: When the task was last updated (ISO 8601)
- `status`: Current state of the task (active/completed/abandoned)
- `parent_task_id`: Reference to parent task if this is a subtask

### task_title

A concise, descriptive title that clearly identifies the task's purpose.

### description

A brief overview of:

- What the task aims to achieve
- The problem it's solving
- Key requirements or constraints

### steps

Ordered list of planned/executed steps:

- `step_number`: Sequential number starting from 1
- `description`: What this step accomplishes
- `status`: Current state of the step
- `subtask_id`: Reference to subtask if this step created one
- `comments`: Additional information about the step

### context

List of important contextual information, including:

- Related files and their purposes
- Dependencies required
- Environment requirements
- Specific configurations needed
- Any other relevant context that helps understand the task

### notes

List of important observations, decisions, and challenges encountered during the task.
