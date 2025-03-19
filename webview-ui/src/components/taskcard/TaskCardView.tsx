import React, { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog"
import { vscode } from "../../utils/vscode"
import { VSCodeButton, VSCodeDivider } from "@vscode/webview-ui-toolkit/react"

// Define Task Card interfaces based on the backend structure
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

interface TaskCardViewProps {
	isOpen: boolean
	onClose: () => void
	taskId: string
}

// Used only as fallback when real data fails to load
const DEMO_TASK_CARD: TaskCard = {
	metadata: {
		task_id: "demo-123",
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
		status: "active",
		parent_task_id: null,
	},
	task_title: "Demo Task Card",
	description: "This is a demo task card for testing the UI",
	steps: [
		{
			step_number: 1,
			description: "Create task card UI",
			status: "completed",
			subtask_id: null,
			comments: ["Created basic UI layout", "Added styling for different sections"],
		},
		{
			step_number: 2,
			description: "Implement task card data loading",
			status: "in_progress",
			subtask_id: null,
			comments: ["Working on fetching data from backend", "Handling error cases"],
		},
		{
			step_number: 3,
			description: "Add editing capabilities",
			status: "planned",
			subtask_id: null,
			comments: [],
		},
	],
	context: ["Task cards help track progress in a project", "They provide context for the AI assistant"],
	notes: ["The UI should match the BeanVoyage example", "UI should be responsive and user-friendly"],
}

const TaskCardView = ({ isOpen, onClose, taskId }: TaskCardViewProps) => {
	const [taskCard, setTaskCard] = useState<TaskCard | null>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [useDirectData, setUseDirectData] = useState(false)
	const [currentTaskId, setCurrentTaskId] = useState<string>(taskId)
	const requestSentRef = useRef<boolean>(false)
	// Track expanded steps
	const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({})

	// Toggle step expansion when clicked
	const toggleStepExpansion = (stepNumber: number) => {
		setExpandedSteps((prev) => ({
			...prev,
			[stepNumber]: !prev[stepNumber],
		}))
	}

	// Reset expanded steps when task card changes
	useEffect(() => {
		if (taskCard) {
			setExpandedSteps({})
		}
	}, [taskCard])

	// Reset the request flag when dialog is closed
	useEffect(() => {
		if (!isOpen) {
			requestSentRef.current = false
		}
	}, [isOpen, currentTaskId])

	// Keep taskId up to date in state
	useEffect(() => {
		if (taskId !== currentTaskId) {
			// Reset all state when task ID changes
			setCurrentTaskId(taskId)
			setUseDirectData(false)
			setTaskCard(null)
			setLoading(true)
			setError(null)
			// Reset the request flag when task ID changes
			requestSentRef.current = false

			// Immediately request new task card data
			if (taskId && isOpen) {
				requestSentRef.current = true
				try {
					vscode.postMessage({
						type: "getTaskCardData",
						text: taskId,
					})
					console.log("Task card data request sent after task ID change:", taskId)
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : String(error)
					setError(`Failed to send request to extension: ${errorMessage}`)
					setLoading(false)
					requestSentRef.current = false
				}
			}
		}
	}, [taskId, currentTaskId, isOpen])

	// Log whenever the dialog opens
	useEffect(() => {
		if (isOpen) {
			console.log(`TaskCardView opened for task ID: ${currentTaskId}`)

			// Only refresh if we don't already have a matching card or if we haven't sent a request yet
			const needsRefresh = !taskCard || taskCard.metadata.task_id !== currentTaskId || !requestSentRef.current

			if (needsRefresh) {
				console.log("Refreshing task card data")
				// Reset card if opened with different task than last time
				if (taskCard && taskCard.metadata.task_id !== currentTaskId) {
					console.log("Task ID mismatch, resetting card:", taskCard.metadata.task_id, "vs", currentTaskId)
					setTaskCard(null)
				}

				// Request fresh data
				setLoading(true)
				setError(null)
				requestSentRef.current = true

				try {
					vscode.postMessage({
						type: "getTaskCardData",
						text: currentTaskId,
						forceRefresh: true,
					})
					console.log("Task card data request sent with force refresh:", currentTaskId)
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : String(error)
					setError(`Failed to send request to extension: ${errorMessage}`)
					setLoading(false)
					requestSentRef.current = false
				}
			}
		}
	}, [isOpen, currentTaskId, taskCard])

	// Use direct data approach only if explicitly set to true
	useEffect(() => {
		if (isOpen && useDirectData) {
			// Set demo data immediately without loading state
			const customDemoCard = {
				...DEMO_TASK_CARD,
				metadata: {
					...DEMO_TASK_CARD.metadata,
					task_id: currentTaskId || DEMO_TASK_CARD.metadata.task_id,
				},
				task_title: `Demo Task Card (${currentTaskId})`,
			}

			setTaskCard(customDemoCard)
			setLoading(false)
		}
	}, [isOpen, useDirectData, currentTaskId])

	// Event handler for messages from extension
	useEffect(() => {
		if (useDirectData) return // Skip if using direct data

		// Set up timeout for waiting for response
		let timeoutId: NodeJS.Timeout | null = null
		if (loading && isOpen && currentTaskId) {
			timeoutId = setTimeout(() => {
				if (loading && !taskCard) {
					console.log("Timeout reached waiting for task card data")
					setError("Timeout reached while waiting for task card data")
					setLoading(false)
				}
			}, 10000)
		}

		const messageHandler = (event: MessageEvent) => {
			const message = event.data

			if (message && message.type === "taskCardData" && message.text) {
				try {
					const data = JSON.parse(message.text)

					if (data.success && data.task_card) {
						// Only update if this response is for the current task ID
						if (
							data.task_card.metadata.task_id === currentTaskId ||
							data.task_card.metadata.task_id.startsWith(currentTaskId)
						) {
							console.log("Received task card data for current task:", currentTaskId)
							setTaskCard(data.task_card)
							setLoading(false)
						} else {
							console.log(
								"Received task card data for wrong task:",
								data.task_card.metadata.task_id,
								"expecting:",
								currentTaskId,
							)
						}
					} else {
						setError(data.message || "Failed to load task card data")
						setLoading(false)
					}
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : String(error)
					setError(`Error parsing task card data: ${errorMessage}`)
					setLoading(false)
				}
			}
		}

		// Add the event listener
		window.addEventListener("message", messageHandler)

		return () => {
			window.removeEventListener("message", messageHandler)
			if (timeoutId) clearTimeout(timeoutId)
		}
	}, [isOpen, currentTaskId, useDirectData, loading, taskCard])

	// Group steps by status
	const getGroupedSteps = () => {
		if (!taskCard) return { todo: [], inProgress: [], done: [] }

		return {
			todo: taskCard.steps.filter((s) => ["planned", "to do", "todo"].includes(s.status.toLowerCase())),
			inProgress: taskCard.steps.filter((s) => ["in_progress", "in progress"].includes(s.status.toLowerCase())),
			done: taskCard.steps.filter((s) => ["completed", "done"].includes(s.status.toLowerCase())),
		}
	}

	// Render a single step with expandable details
	const renderStep = (step: TaskStep, color: string) => {
		const isExpanded = expandedSteps[step.step_number] || false
		const hasDetails = step.comments.length > 0 || step.subtask_id !== null

		return (
			<div
				key={step.step_number}
				className={`mb-3 py-2 border-l-2 pl-4 ${hasDetails ? "cursor-pointer hover:bg-[#1A172C]" : ""} transition-colors duration-150`}
				style={{ borderColor: color }}
				onClick={hasDetails ? () => toggleStepExpansion(step.step_number) : undefined}>
				<div className="flex items-center">
					<div className="text-xs bg-[#1F1C33] px-2 py-1 rounded mr-3">
						{taskCard?.metadata.task_id.split("-")[0] || "task"}-{step.step_number}
					</div>
					<div className="flex-1">{step.description}</div>
					{hasDetails && (
						<div className="text-xs ml-2 mr-1">
							<span className={`codicon codicon-chevron-${isExpanded ? "down" : "right"}`}></span>
						</div>
					)}
				</div>

				{/* Expandable content */}
				{isExpanded && hasDetails && (
					<div className="pl-6 mt-2 text-sm text-gray-400">
						{step.subtask_id && (
							<div className="mb-1">
								<span className="font-medium text-gray-300">Subtask ID:</span> {step.subtask_id}
							</div>
						)}

						{step.comments.length > 0 && (
							<div>
								<span className="font-medium text-gray-300">Comments:</span>
								<ul className="list-disc pl-5 mt-1">
									{step.comments.map((comment, idx) => (
										<li key={idx} className="mb-1">
											{comment}
										</li>
									))}
								</ul>
							</div>
						)}
					</div>
				)}
			</div>
		)
	}

	const groupedSteps = getGroupedSteps()

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => !open && onClose()}
			// Force the Dialog to fully unmount and recreate when taskId changes
			key={`taskcard-dialog-${currentTaskId}`}>
			<DialogContent className="w-[calc(100%-3rem)] max-w-[800px] p-0 bg-[#13111E] border border-gray-700 overflow-hidden relative mx-auto my-auto max-h-[80vh] h-auto rounded-lg shadow-xl fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col">
				{/* Header with dark background and title */}
				<div
					style={{
						background: "linear-gradient(to right, #13111E, #1A172C)",
						padding: "20px 24px",
						color: "white",
						position: "sticky",
						top: 0,
						zIndex: 10,
					}}>
					<DialogTitle className="text-2xl font-bold text-white">
						{taskCard?.task_title || "Task Card"}
					</DialogTitle>
					{taskCard && <p className="text-gray-300 mt-2">{taskCard.description}</p>}
					{taskCard && (
						<div className="text-xs text-gray-400 mt-2">
							Last updated: {new Date(taskCard.metadata.updated_at).toLocaleString()}
						</div>
					)}
				</div>

				{/* Task card content */}
				<div className="p-6 overflow-y-auto flex-1" style={{ minHeight: "200px" }}>
					{/* Empty/loading state */}
					{!taskCard && !error && (
						<div className="flex flex-col justify-center items-center h-60 text-center">
							<p className="text-gray-400 mb-4">
								{loading ? "Loading task card..." : "No task card loaded"}
							</p>
							{!loading && (
								<VSCodeButton appearance="secondary" onClick={() => setUseDirectData(true)}>
									Use Demo Data
								</VSCodeButton>
							)}
						</div>
					)}

					{/* Error state */}
					{error && (
						<div className="flex flex-col items-center justify-center h-60">
							<div className="text-red-500 p-4 text-center mb-4">{error}</div>
							<p className="text-center text-gray-400 max-w-md mb-4">
								This task might not have a task card yet. You can create one by asking Roo to track your
								task progress.
							</p>
							<VSCodeButton
								appearance="primary"
								onClick={() => {
									// Request to create a task card via Roo
									vscode.postMessage({
										type: "requestEditTaskCard",
										text: taskId,
									})
									onClose()
								}}>
								Create Task Card with Roo
							</VSCodeButton>
						</div>
					)}

					{/* Task card content when loaded */}
					{taskCard && (
						<div className="flex flex-col gap-6">
							{/* IN PROGRESS section */}
							{groupedSteps.inProgress.length > 0 && (
								<div>
									<div className="flex items-center gap-2 mb-4">
										<div
											className="w-3 h-3 rounded-full"
											style={{ backgroundColor: "#3F51B5" }}></div>
										<h3 className="font-semibold text-md">IN PROGRESS</h3>
									</div>
									<div className="pl-5">
										{groupedSteps.inProgress.map((step) => renderStep(step, "#3F51B5"))}
									</div>
								</div>
							)}

							{/* TO DO section */}
							{groupedSteps.todo.length > 0 && (
								<div>
									<div className="flex items-center gap-2 mb-4">
										<div
											className="w-3 h-3 rounded-full"
											style={{ backgroundColor: "#9E9E9E" }}></div>
										<h3 className="font-semibold text-md">TO DO</h3>
									</div>
									<div className="pl-5">
										{groupedSteps.todo.map((step) => renderStep(step, "#9E9E9E"))}
									</div>
								</div>
							)}

							{/* DONE section */}
							{groupedSteps.done.length > 0 && (
								<div>
									<div className="flex items-center gap-2 mb-4">
										<div
											className="w-3 h-3 rounded-full"
											style={{ backgroundColor: "#4CAF50" }}></div>
										<h3 className="font-semibold text-md">DONE ({groupedSteps.done.length})</h3>
									</div>
									<div className="pl-5">
										{groupedSteps.done.map((step) => renderStep(step, "#4CAF50"))}
									</div>
								</div>
							)}

							{/* Context section */}
							{taskCard.context && taskCard.context.length > 0 && (
								<div className="mt-4">
									<VSCodeDivider />
									<h3 className="font-semibold text-md mt-4 mb-2">Context</h3>
									<ul className="list-disc pl-5">
										{taskCard.context.map((ctx, idx) => (
											<li key={idx} className="mb-1">
												{ctx}
											</li>
										))}
									</ul>
								</div>
							)}

							{/* Notes section */}
							{taskCard.notes && taskCard.notes.length > 0 && (
								<div className="mt-4">
									<VSCodeDivider />
									<h3 className="font-semibold text-md mt-4 mb-2">Notes</h3>
									<ul className="list-disc pl-5">
										{taskCard.notes.map((note, idx) => (
											<li key={idx} className="mb-1">
												{note}
											</li>
										))}
									</ul>
								</div>
							)}
						</div>
					)}
				</div>

				{/* Footer with buttons */}
				<div className="p-4 border-t border-gray-700 flex justify-between bg-[#13111E] sticky bottom-0 z-10 w-full">
					{taskCard && (
						<VSCodeButton
							appearance="secondary"
							onClick={() => {
								// Request to edit the task card via Roo
								vscode.postMessage({
									type: "requestEditTaskCard",
									text: taskId,
								})
								onClose()
							}}>
							Edit with Roo
						</VSCodeButton>
					)}

					<VSCodeButton appearance="secondary" onClick={onClose}>
						Close
					</VSCodeButton>
				</div>
			</DialogContent>
		</Dialog>
	)
}

export default TaskCardView
