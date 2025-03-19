import { ToolArgs } from "./types"
import { EXPERIMENT_IDS } from "../../../shared/experiments"

export function getNewTaskDescription(args: ToolArgs): string {
	// Check if task cards experiment is enabled
	const taskCardsEnabled = args.experiments?.[EXPERIMENT_IDS.TASK_CARDS] === true

	// Base description that's always shown
	const baseDescription = `## new_task
Description: Create a new task with a specified starting mode and initial message. This tool instructs the system to create a new Cline instance in the given mode with the provided message.

Parameters:
- mode: (required) The slug of the mode to start the new task in (e.g., "code", "ask", "architect").
- message: (required) The initial user message or instructions for this new task.`

	// Additional parameter that's only shown when task cards are enabled
	const taskCardParameter = taskCardsEnabled
		? `
- parent_step_number: (optional) The step number in the parent task's task card that this subtask is for. When provided, the parent task card will be updated with this subtask's ID.`
		: ``

	// Usage and examples, with conditional task card content
	const usageAndExamples = `
Usage:
<new_task>
<mode>your-mode-slug-here</mode>
<message>Your initial instructions here</message>${
		taskCardsEnabled
			? `
<parent_step_number>2</parent_step_number>`
			: ``
	}
</new_task>

Example:
<new_task>
<mode>code</mode>
<message>Implement a new feature for the application.</message>${
		taskCardsEnabled
			? `
<parent_step_number>3</parent_step_number>`
			: ``
	}
</new_task>${
		taskCardsEnabled
			? `

When a parent_step_number is provided, the new task will be linked to that step in the parent task card, and the parent task card will be updated automatically.`
			: ``
	}`

	return `${baseDescription}${taskCardParameter}${usageAndExamples}`
}
