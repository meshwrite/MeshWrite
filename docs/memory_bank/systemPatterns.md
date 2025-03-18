# MeshWrite: System Patterns

## How the System is Built

MeshWrite is built on top of RooCode, a VSCode extension that provides an AI agent framework for coding tasks. The system follows a client-server architecture within the VSCode extension environment:

1. **Backend (Extension Host)**: Written in TypeScript, runs in the VSCode extension host process

    - Handles communication with VSCode APIs
    - Manages file system operations
    - Coordinates AI model interactions
    - Processes commands and operations

2. **Frontend (Webview UI)**: React-based UI that runs in a VSCode webview

    - Provides the chat interface
    - Displays task management components
    - Renders writing assistance tools
    - Manages user interactions

3. **Communication**: Uses the VSCode webview messaging API to communicate between frontend and backend

## Key Technical Decisions

1. **Leveraging RooCode's Architecture**: We're maintaining the core architecture of RooCode while adapting it for fiction writing purposes.

2. **React for UI**: The frontend uses React with TypeScript for a responsive and maintainable UI.

3. **AI Integration**: Maintaining RooCode's flexible AI provider system, allowing writers to use different AI models.

4. **VSCode Extension Framework**: Built as a VSCode extension to integrate directly with the writing environment.

5. **Modular Design**: Components are designed to be modular and reusable, making it easier to add new writing-specific features.

## Architecture Patterns

1. **Model-View-Controller (MVC)**:

    - Model: Data structures for writing projects, tasks, and AI interactions
    - View: React components in the webview UI
    - Controller: Extension host logic that processes commands and updates the model

2. **Event-Driven Architecture**:

    - Components communicate through events
    - UI updates are triggered by state changes
    - Extension host responds to VSCode events and webview messages

3. **Command Pattern**:

    - User actions are translated into commands
    - Commands are processed by appropriate handlers
    - Results are reflected back to the UI

4. **Provider Pattern**:

    - Different AI providers can be plugged in
    - Services are abstracted behind interfaces
    - Allows for flexibility in implementation details

5. **Context System**:
    - React contexts manage state across components
    - Global state is managed through context providers
    - Reduces prop drilling and simplifies component communication

The system maintains a clear separation between the UI layer and the business logic, making it easier to adapt the interface for writers while preserving the powerful AI capabilities of the original RooCode system.
