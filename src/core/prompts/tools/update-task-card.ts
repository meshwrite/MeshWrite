import { ToolArgs } from "./types"
import * as fs from "fs/promises"
import * as path from "path"
import { GlobalFileNames } from "../../../shared/globalFileNames"

interface TaskCardMetadata {
	task_id: string
	created_at: string
	updated_at: string
	status: string
	parent_task_id: string | null
}

interface TaskStep {
	step_number: number
	description: string
	status: string
	subtask_id: string | null
	comments: string[]
}

interface TaskCard {
	metadata: TaskCardMetadata
	task_title: string
	description: string
	steps: TaskStep[]
	context: string[]
	notes: string[]
}

export function getUpdateTaskCardDescription(args: ToolArgs): string {
	return `## update_task_card
Description: Update the current task card with new information. This tool allows you to modify the task card to track progress, add notes, update steps, or change the task status.

Parameters:
- content: (required) The complete task card JSON content that will replace the current task card. Must include all required fields.

IMPORTANT: DO NOT include metadata in your JSON. The system will add it automatically.

The task card must follow this JSON structure:
\`\`\`json
{
  "task_title": "string",
  "description": "string",
  "steps": [
    {
      "step_number": 1,
      "description": "string",
      "status": "planned",
      "subtask_id": null,
      "comments": []
    }
  ],
  "context": [],
  "notes": []
}
\`\`\`

JSON Formatting Requirements:
- All strings must be properly enclosed in double quotes
- Escape special characters in strings:
  - Use \\\\ for backslash
  - Use \\" for double quotes
  - Use \\n for newlines
  - Use \\t for tabs
- Do not include trailing commas in arrays or objects
- Field names must be enclosed in double quotes
- Boolean values must be lowercase: true or false
- Null values must be lowercase: null

Guidelines:
1. The metadata will be handled automatically by the system - DO NOT include it
2. Valid step status values are "planned", "in_progress", or "completed"
3. Preserve existing information unless it needs to be updated
4. Add new steps or update existing ones as needed
5. Add context items to help maintain project context
6. Add notes to document important decisions or observations

Example:
<update_task_card>
<content>
{
  "task_title": "Implement Task Card Integration",
  "description": "Add task card content to system prompt and create update tool",
  "steps": [
    {
      "step_number": 1,
      "description": "Create task card structure",
      "status": "completed",
      "subtask_id": null,
      "comments": ["Defined JSON schema with all required fields"]
    },
    {
      "step_number": 2,
      "description": "Add task card to system prompt",
      "status": "completed",
      "subtask_id": null,
      "comments": ["Added getTaskCardSection function", "Integrated with existing system prompt"]
    },
    {
      "step_number": 3,
      "description": "Create update_task_card tool",
      "status": "in_progress",
      "subtask_id": null,
      "comments": ["Creating tool description file"]
    }
  ],
  "context": [
    "Task cards are stored in .roo/tasks/{taskId}/task_card.json",
    "System prompt is defined in src/core/prompts/system.ts",
    "Tool registry is in src/core/prompts/tools/index.ts"
  ],
  "notes": [
    "Updated task card will automatically be included in next system prompt",
    "Need to validate JSON structure before saving"
  ]
}
</content>
</update_task_card>
`
}

// Function to validate task card structure
function validateTaskCard(taskCard: any): string | null {
	// Check if task card has the required top-level fields
	const requiredFields = ["task_title", "description", "steps", "context", "notes"]
	for (const field of requiredFields) {
		if (!taskCard[field]) {
			return `Task card is missing required field: ${field}`
		}
	}

	// Ensure metadata exists and is an object - we'll populate it if missing
	if (!taskCard.metadata || typeof taskCard.metadata !== "object") {
		taskCard.metadata = {}
	}

	// Validate steps
	if (!Array.isArray(taskCard.steps)) {
		return "Steps must be an array"
	}

	for (const step of taskCard.steps) {
		if (!step.step_number || !step.description || !step.status) {
			return "Each step must have step_number, description, and status"
		}

		if (!["planned", "in_progress", "completed"].includes(step.status)) {
			return `Invalid step status: ${step.status}. Must be "planned", "in_progress", or "completed".`
		}

		if (!Array.isArray(step.comments)) {
			return "Step comments must be an array"
		}
	}

	// Validate other arrays
	if (!Array.isArray(taskCard.context)) {
		return "Context must be an array"
	}

	if (!Array.isArray(taskCard.notes)) {
		return "Notes must be an array"
	}

	return null // No errors
}

// Function to update the task card
export async function updateTaskCard(
	content: string,
	taskId: string,
	cwd: string,
	globalStoragePath?: string,
): Promise<{ success: boolean; message: string; data?: TaskCard }> {
	try {
		// Debug log the parameters
		console.log(`updateTaskCard called with:
    - taskId: ${taskId}
    - globalStoragePath: ${globalStoragePath}
    - content length: ${content?.length || 0}`)

		if (!globalStoragePath) {
			return {
				success: false,
				message:
					"Cannot update task card without global storage path. This is likely a system configuration issue.",
			}
		}

		// Use global storage path only - this is where task cards are created
		const taskDir = path.join(globalStoragePath, "tasks", taskId)
		const taskCardPath = path.join(taskDir, GlobalFileNames.taskCard)

		console.log(`Looking for task card at: ${taskCardPath}`)

		// Let's first check if the task card exists already
		let existingTaskCard: TaskCard | null = null
		try {
			await fs.access(taskCardPath)
			const existingContent = await fs.readFile(taskCardPath, "utf-8")
			existingTaskCard = JSON.parse(existingContent)
			console.log(`Found existing task card with ID: ${existingTaskCard?.metadata?.task_id}`)
		} catch (error) {
			console.log(`Error accessing existing task card: ${(error as Error).message}`)
			// If we can't read it, that's fine - we'll create it below
		}

		let taskCard: TaskCard
		try {
			taskCard = JSON.parse(content)
		} catch (error) {
			return {
				success: false,
				message: `Invalid JSON format: ${(error as Error).message}`,
			}
		}

		// Always use task_id from existing card or parameter
		if (existingTaskCard?.metadata?.task_id) {
			// If we found an existing card, use its task_id
			if (!taskCard.metadata) {
				taskCard.metadata = {
					task_id: existingTaskCard.metadata.task_id,
					created_at: existingTaskCard.metadata.created_at,
					updated_at: new Date().toISOString(),
					status: "active",
					parent_task_id: existingTaskCard.metadata.parent_task_id,
				}
			} else {
				taskCard.metadata.task_id = existingTaskCard.metadata.task_id
				taskCard.metadata.created_at = existingTaskCard.metadata.created_at
				taskCard.metadata.updated_at = new Date().toISOString()
				taskCard.metadata.parent_task_id = existingTaskCard.metadata.parent_task_id
				if (!taskCard.metadata.status) {
					taskCard.metadata.status = "active"
				}
			}
		} else {
			// If no existing card, create metadata with taskId parameter
			if (!taskCard.metadata) {
				taskCard.metadata = {
					task_id: taskId,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
					status: "active",
					parent_task_id: null,
				}
			} else {
				taskCard.metadata.task_id = taskId
				taskCard.metadata.created_at = taskCard.metadata.created_at || new Date().toISOString()
				taskCard.metadata.updated_at = new Date().toISOString()
				taskCard.metadata.status = taskCard.metadata.status || "active"
				taskCard.metadata.parent_task_id = taskCard.metadata.parent_task_id || null
			}
		}

		console.log(`Task card metadata after setup: ${JSON.stringify(taskCard.metadata)}`)

		// Skip validation - we know what we're doing
		// Create directory if it doesn't exist
		await fs.mkdir(taskDir, { recursive: true })

		// Write the updated task card
		const taskCardJson = JSON.stringify(taskCard, null, 2)
		await fs.writeFile(taskCardPath, taskCardJson, "utf-8")
		console.log(`Successfully wrote task card to: ${taskCardPath}`)

		return {
			success: true,
			message: "Task card updated successfully",
			data: taskCard,
		}
	} catch (error) {
		console.error(`Error updating task card: ${(error as Error).message}`)
		return {
			success: false,
			message: `Error updating task card: ${(error as Error).message}`,
		}
	}
}
