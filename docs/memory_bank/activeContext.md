# MeshWrite: Active Context

## What We're Working On Now

We are currently in the initial phase of adapting RooCode (an AI agent coding assistant) into MeshWrite (an AI assistant for fiction writers). The project is just starting, and we're focusing on:

1. Understanding the RooCode codebase structure and functionality
2. Planning the necessary UI changes to make it writer-friendly
3. Designing the Task Cards feature for writers

## Current Task

Implementing Task Card feature for better task tracking and context management.

### Goals

1. Task Mode Initialization

    - Add "Enable Task Cards" setting to Roo settings
    - Create task_card.json in the same directory as conversation history
    - Initialize task card with metadata and initial context

2. Task Card Integration
    - Append task card content to system prompt
    - Allow model to read and update task card during task execution
    - Maintain task card throughout task lifecycle

### Recent Changes

- Created task card template and example
- Defined structure for task cards
- Simplified context field to string array format
- Added task card initialization in Cline.ts
- Implemented task card file creation alongside conversation history
- Standardized task card format with metadata, task_title, description, steps, context, notes, and changes fields

## Next Steps

Our immediate next steps are:

1. **Task Card System Prompt Integration**:

    - Investigate how the system prompt is currently constructed
    - Design a way to include task card content in the system prompt
    - Ensure task card updates are reflected in the system prompt
    - Handle task card state persistence between prompt updates

2. **UI Changes**:

    - Update terminology throughout the UI to be writer-focused
    - Modify the visual design to appeal to creative writers
    - Change icons and labels to reflect writing tasks rather than coding tasks

3. **Task Cards Feature**:

    - Design and implement a Task Cards system for managing writing projects
    - Create UI components for creating, editing, and organizing Task Cards
    - Implement functionality to link Task Cards to specific parts of a writing project

4. **Testing**:
    - Test the adapted UI with sample writing tasks
    - Ensure all existing functionality works with our modifications
    - Gather feedback on the writer experience

We will focus on integrating the task card into the system prompt to enable the model to maintain context and track progress effectively.

### Questions to Investigate

1. How is the system prompt currently constructed and where is it defined?
2. What's the best way to format task card content for the system prompt?
3. How should we handle task card updates during task execution?
4. How can we ensure task card state persists between prompt updates?
5. What's the best way to handle file operations in the extension?
