import React, { useState } from "react"
import { ContextMenuOptionType } from "@/utils/context-mentions"

interface ContextBarProps {
	mentions: Array<{
		type: ContextMenuOptionType
		value: string
	}>
	onRemoveMention?: (mention: { type: ContextMenuOptionType; value: string }) => void
}

const ContextBar: React.FC<ContextBarProps> = ({ mentions, onRemoveMention }) => {
	const [hoveredMention, setHoveredMention] = useState<string | null>(null)

	if (mentions.length === 0) return null

	const handleClick = (mention: { type: ContextMenuOptionType; value: string }) => {
		setHoveredMention(null)
		onRemoveMention?.(mention)
	}

	return (
		<div className="flex flex-wrap gap-1.5 mb-1 px-1">
			{mentions.map((mention) => (
				<div
					key={`${mention.type}-${mention.value}`}
					className="flex items-center gap-1 px-1.5 py-0.5 text-[11px] rounded bg-vscode-input-background border border-vscode-editorGroup-border"
					onMouseEnter={() => setHoveredMention(mention.value)}
					onMouseLeave={() => setHoveredMention(null)}
					style={{ cursor: onRemoveMention ? "pointer" : "default" }}
					onClick={() => handleClick(mention)}>
					<i
						className={`codicon ${
							hoveredMention === mention.value
								? "codicon-close"
								: `codicon-${
										mention.type === ContextMenuOptionType.File
											? "file"
											: mention.type === ContextMenuOptionType.Folder
												? "folder"
												: mention.type === ContextMenuOptionType.Git
													? "git-commit"
													: mention.type === ContextMenuOptionType.Problems
														? "warning"
														: "terminal"
									}`
						}`}
						style={{ fontSize: "11px" }}
					/>
					<span className="truncate max-w-[150px]">{mention.value}</span>
				</div>
			))}
		</div>
	)
}

export default ContextBar
