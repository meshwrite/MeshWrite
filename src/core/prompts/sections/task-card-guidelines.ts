import { EXPERIMENT_IDS } from "../../../shared/experiments"

export function getTaskCardGuidelinesSection(experiments?: Record<string, boolean>): string {
	// Only return task card guidelines if TASK_CARDS experiment is enabled
	if (!experiments?.[EXPERIMENT_IDS.TASK_CARDS]) {
		return ""
	}

	return `====

TASK CARD MANAGEMENT

The task card provides essential context for your work. Treat it as a source of truth for ongoing tasks and maintain it progressively:

1. INITIAL SETUP - For new tasks:
   - First identify the core task from the user's initial message
   - Don't try to populate all task card details immediately
   - Start with minimal information: task title and a brief description
   - Add initial steps focused on information gathering (reading files, searching code, asking questions)
   - Update the task card as you learn more about the project

2. INFORMATION GATHERING:
   - Use read_file, search_files, and other tools to understand the codebase
   - Add what you learn to the context field
   - Ask clarifying questions when needed instead of making assumptions
   - Gradually refine the task description and steps as your understanding improves

3. PROGRESSIVE UPDATES - Use update_task_card regularly:
   - Start with broad investigative steps, then refine into specific implementation steps
   - Mark steps as "in_progress" when working on them
   - Mark steps as "completed" when finished
   - Add step comments to document key findings or decisions
   - Add notes for important observations
   - Add new context items as you discover relevant information

4. JSON FORMATTING - Careful attention required:
   - Ensure valid JSON when updating task cards
   - Do not include any metadata fields - they are handled automatically
   - Use double quotes for all strings and property names
   - Escape special characters in strings using backslashes
   - Especially escape any double quotes within strings using \\"
   - If you encounter JSON errors, simplify your content and try again

5. RETRIEVE AND REFERENCE - Use get_task_card to check current state

6. PROGRESS TRACKING:
   - Individual step status values can be "planned", "in_progress", or "completed"
   - Step comments document important details about each step's execution

Remember: Build the task card incrementally. Prioritize accuracy over completeness - it's better to have a partially complete but accurate task card than one filled with guesses or hallucinated details. The task card serves as a persistent memory, ensuring continuity across sessions.`
}
