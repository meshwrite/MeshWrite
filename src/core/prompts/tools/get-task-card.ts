import { ToolArgs } from "./types"
import * as fs from "fs/promises"
import * as path from "path"
import { GlobalFileNames } from "../../../shared/globalFileNames"

// Reusing the same interfaces for consistency
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

export function getGetTaskCardDescription(args: ToolArgs): string {
	return `## get_task_card
Description: Retrieve a task card by its ID. This tool allows you to access task card information for the current task or a specific task.

Parameters:
- task_id: (optional) The ID of the task card to retrieve. If not provided, the current task's card will be returned.

The retrieved task card will have the following structure:
\`\`\`json
{
  "task_title": "Task title",
  "description": "Detailed task description",
  "steps": [
    {
      "step_number": 1,
      "description": "Step description",
      "status": "planned",                  // Can be "planned", "in_progress", or "completed"
      "subtask_id": null,
      "comments": ["Comment 1", "Comment 2"]
    }
  ],
  "context": ["Context item 1", "Context item 2"],
  "notes": ["Note 1", "Note 2"]
}
\`\`\`

Note: The system automatically manages metadata for the task card.

Example:
<get_task_card>
</get_task_card>

Or to get a specific task card:
<get_task_card>
<task_id>550e8400-e29b-41d4-a716-446655440000</task_id>
</get_task_card>
`
}

// Function to get the task card
export async function getTaskCard(
	task_id: string | undefined,
	currentTaskId: string,
	cwd: string,
	globalStoragePath?: string,
): Promise<{ success: boolean; message: string; data?: TaskCard }> {
	try {
		// If task_id is not provided, use the current task id
		const targetTaskId = task_id || currentTaskId

		console.log(`getTaskCard called with:
    - task_id: ${task_id}
    - currentTaskId: ${currentTaskId}
    - globalStoragePath: ${globalStoragePath}`)

		if (!globalStoragePath) {
			console.log("ERROR: globalStoragePath is undefined")
			return {
				success: false,
				message:
					"Cannot access task card without global storage path. This is likely a system configuration issue.",
			}
		}

		// Try to load from both possible locations
		// 1. Global storage path (VS Code extension data)
		const vsCodeTaskDir = path.join(globalStoragePath, "tasks", targetTaskId)
		const vsCodeTaskCardPath = path.join(vsCodeTaskDir, GlobalFileNames.taskCard)

		console.log(`Looking for task card at: ${vsCodeTaskCardPath}`)

		// 2. Workspace path (legacy location)
		const workspaceTaskDir = path.join(cwd, ".roo", "tasks", targetTaskId)
		const workspaceTaskCardPath = path.join(workspaceTaskDir, GlobalFileNames.taskCard)

		console.log(`Also checking workspace location: ${workspaceTaskCardPath}`)

		// Try to read from VS Code storage first
		try {
			await fs.access(vsCodeTaskCardPath)
			console.log(`Found task card at VS Code location: ${vsCodeTaskCardPath}`)
			const content = await fs.readFile(vsCodeTaskCardPath, "utf-8")
			const taskCard: TaskCard = JSON.parse(content)

			return {
				success: true,
				message: `Task card retrieved successfully from VS Code storage`,
				data: taskCard,
			}
		} catch (error) {
			console.log(`Could not find task card in VS Code storage: ${(error as Error).message}`)

			// Try workspace location as fallback
			try {
				await fs.access(workspaceTaskCardPath)
				console.log(`Found task card at workspace location: ${workspaceTaskCardPath}`)
				const content = await fs.readFile(workspaceTaskCardPath, "utf-8")
				const taskCard: TaskCard = JSON.parse(content)

				return {
					success: true,
					message: `Task card retrieved successfully from workspace storage`,
					data: taskCard,
				}
			} catch (wsError) {
				console.log(`Could not find task card in workspace either: ${(wsError as Error).message}`)
				return {
					success: false,
					message: `Task card not found in either location. VS Code path: ${vsCodeTaskCardPath}, Workspace path: ${workspaceTaskCardPath}`,
				}
			}
		}
	} catch (error) {
		console.error(`Error retrieving task card: ${(error as Error).message}`)
		return {
			success: false,
			message: `Error retrieving task card: ${(error as Error).message}`,
		}
	}
}
