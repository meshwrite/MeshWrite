import {
	Mode,
	modes,
	CustomModePrompts,
	PromptComponent,
	getRoleDefinition,
	defaultModeSlug,
	ModeConfig,
	getModeBySlug,
	getGroupName,
} from "../../shared/modes"
import { DiffStrategy } from "../diff/DiffStrategy"
import { McpHub } from "../../services/mcp/McpHub"
import { getToolDescriptionsForMode } from "./tools"
import * as vscode from "vscode"
import {
	getRulesSection,
	getSystemInfoSection,
	getObjectiveSection,
	getSharedToolUseSection,
	getMcpServersSection,
	getToolUseGuidelinesSection,
	getCapabilitiesSection,
	getModesSection,
	addCustomInstructions,
	getTaskCardGuidelinesSection,
} from "./sections"
import { loadSystemPromptFile } from "./sections/custom-system-prompt"
import { formatLanguage } from "../../shared/language"
import * as fs from "fs/promises"
import * as path from "path"
import { GlobalFileNames } from "../../shared/globalFileNames"
import { EXPERIMENT_IDS } from "../../shared/experiments"

async function getTaskCardSection(cwd: string, taskId: string): Promise<string> {
	try {
		const taskDir = path.join(cwd, ".roo", "tasks", taskId)
		const taskCardPath = path.join(taskDir, GlobalFileNames.taskCard)
		const taskCardContent = await fs.readFile(taskCardPath, "utf-8")
		const taskCard = JSON.parse(taskCardContent)

		// Format task card content for the system prompt
		const formattedContent = `====

TASK CARD

Task Title: ${taskCard.task_title}
Description: ${taskCard.description}

Current Status: ${taskCard.metadata.status}
Created: ${taskCard.metadata.created_at}
Last Updated: ${taskCard.metadata.updated_at}

Steps:
${taskCard.steps.map((step: any) => `- [${step.status}] Step ${step.step_number}: ${step.description}`).join("\n")}

Context:
${taskCard.context.map((ctx: string) => `- ${ctx}`).join("\n")}

Notes:
${taskCard.notes.map((note: string) => `- ${note}`).join("\n")}`

		return formattedContent
	} catch (error) {
		// If task card doesn't exist or can't be read, return empty string
		return ""
	}
}

async function generatePrompt(
	context: vscode.ExtensionContext,
	cwd: string,
	supportsComputerUse: boolean,
	mode: Mode,
	mcpHub?: McpHub,
	diffStrategy?: DiffStrategy,
	browserViewportSize?: string,
	promptComponent?: PromptComponent,
	customModeConfigs?: ModeConfig[],
	globalCustomInstructions?: string,
	diffEnabled?: boolean,
	experiments?: Record<string, boolean>,
	enableMcpServerCreation?: boolean,
	rooIgnoreInstructions?: string,
	taskId?: string,
): Promise<string> {
	if (!context) {
		throw new Error("Extension context is required for generating system prompt")
	}

	// If diff is disabled, don't pass the diffStrategy
	const effectiveDiffStrategy = diffEnabled ? diffStrategy : undefined

	// Get the full mode config to ensure we have the role definition
	const modeConfig = getModeBySlug(mode, customModeConfigs) || modes.find((m) => m.slug === mode) || modes[0]
	const roleDefinition = promptComponent?.roleDefinition || modeConfig.roleDefinition

	// Only include task card section if TASK_CARDS experiment is enabled
	const shouldIncludeTaskCard = experiments?.[EXPERIMENT_IDS.TASK_CARDS] === true && taskId

	const [modesSection, mcpServersSection, taskCardSection] = await Promise.all([
		getModesSection(context),
		modeConfig.groups.some((groupEntry) => getGroupName(groupEntry) === "mcp")
			? getMcpServersSection(mcpHub, effectiveDiffStrategy, enableMcpServerCreation)
			: Promise.resolve(""),
		shouldIncludeTaskCard ? getTaskCardSection(cwd, taskId) : Promise.resolve(""),
	])

	const basePrompt = `${roleDefinition}

${getSharedToolUseSection()}

${getToolDescriptionsForMode(
	mode,
	cwd,
	supportsComputerUse,
	effectiveDiffStrategy,
	browserViewportSize,
	mcpHub,
	customModeConfigs,
	experiments,
)}

${getToolUseGuidelinesSection()}

${mcpServersSection}

${getCapabilitiesSection(cwd, supportsComputerUse, mcpHub, effectiveDiffStrategy)}

${modesSection}

${getRulesSection(cwd, supportsComputerUse, effectiveDiffStrategy, experiments)}

${getSystemInfoSection(cwd, mode, customModeConfigs)}

${taskCardSection}

${getTaskCardGuidelinesSection(experiments)}

${getObjectiveSection(experiments)}

${await addCustomInstructions(promptComponent?.customInstructions || modeConfig.customInstructions || "", globalCustomInstructions || "", cwd, mode, { language: formatLanguage(vscode.env.language), rooIgnoreInstructions })}`

	return basePrompt
}

export const SYSTEM_PROMPT = async (
	context: vscode.ExtensionContext,
	cwd: string,
	supportsComputerUse: boolean,
	mcpHub?: McpHub,
	diffStrategy?: DiffStrategy,
	browserViewportSize?: string,
	mode: Mode = defaultModeSlug,
	customModePrompts?: CustomModePrompts,
	customModes?: ModeConfig[],
	globalCustomInstructions?: string,
	diffEnabled?: boolean,
	experiments?: Record<string, boolean>,
	enableMcpServerCreation?: boolean,
	rooIgnoreInstructions?: string,
	taskId?: string,
): Promise<string> => {
	if (!context) {
		throw new Error("Extension context is required for generating system prompt")
	}

	const getPromptComponent = (value: unknown) => {
		if (typeof value === "object" && value !== null) {
			return value as PromptComponent
		}
		return undefined
	}

	// Try to load custom system prompt from file
	const fileCustomSystemPrompt = await loadSystemPromptFile(cwd, mode)

	// Check if it's a custom mode
	const promptComponent = getPromptComponent(customModePrompts?.[mode])

	// Get full mode config from custom modes or fall back to built-in modes
	const currentMode = getModeBySlug(mode, customModes) || modes.find((m) => m.slug === mode) || modes[0]

	// If a file-based custom system prompt exists, use it
	if (fileCustomSystemPrompt) {
		const roleDefinition = promptComponent?.roleDefinition || currentMode.roleDefinition
		const customInstructions = await addCustomInstructions(
			promptComponent?.customInstructions || currentMode.customInstructions || "",
			globalCustomInstructions || "",
			cwd,
			mode,
			{ language: formatLanguage(vscode.env.language), rooIgnoreInstructions },
		)
		// For file-based prompts, don't include the tool sections
		return `${roleDefinition}

${fileCustomSystemPrompt}

${customInstructions}`
	}

	// If diff is disabled, don't pass the diffStrategy
	const effectiveDiffStrategy = diffEnabled ? diffStrategy : undefined

	return generatePrompt(
		context,
		cwd,
		supportsComputerUse,
		currentMode.slug,
		mcpHub,
		effectiveDiffStrategy,
		browserViewportSize,
		promptComponent,
		customModes,
		globalCustomInstructions,
		diffEnabled,
		experiments,
		enableMcpServerCreation,
		rooIgnoreInstructions,
		taskId,
	)
}
