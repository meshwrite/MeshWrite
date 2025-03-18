# MeshWrite: Technical Context

## Technologies Used

MeshWrite is built using the following technologies:

1. **Core Technologies**:

    - **TypeScript**: Primary programming language for both frontend and backend
    - **Node.js**: Runtime environment for the extension
    - **VSCode Extension API**: For integrating with VSCode
    - **React**: Frontend UI library
    - **Vite**: Build tool for the frontend

2. **UI Components**:

    - **CSS/SCSS**: For styling components
    - **React Hooks**: For state management and side effects
    - **Context API**: For global state management

3. **Testing**:

    - **Jest**: For unit and integration testing
    - **React Testing Library**: For testing React components

4. **Build & Development**:

    - **esbuild**: Fast JavaScript bundler
    - **npm**: Package management
    - **ESLint**: Code linting
    - **Prettier**: Code formatting

5. **AI Integration**:
    - Support for various AI providers (OpenAI, Anthropic, etc.)
    - API integrations for different language models

## Development Setup

To set up the development environment:

1. **Prerequisites**:

    - Node.js (version specified in .nvmrc)
    - npm
    - VSCode

2. **Installation**:

    ```sh
    # Clone the repository
    git clone https://github.com/your-username/meshwrite-vsc.git

    # Install dependencies
    npm run install:all
    ```

3. **Development Workflow**:

    - Run `npm run dev` to start the webview development server
    - Press F5 in VSCode to launch the extension in debug mode
    - Changes to the webview will hot reload
    - Changes to the extension host require restarting the debug session

4. **Building**:
    - Run `npm run build` to build the extension
    - The .vsix file will be generated in the bin/ directory

## Technical Constraints

1. **VSCode Extension Limitations**:

    - Limited access to certain VSCode APIs
    - Webview sandbox restrictions
    - Performance considerations for extension host operations

2. **AI Model Constraints**:

    - Token limits for different AI models
    - API rate limits
    - Cost considerations for API usage

3. **Cross-Platform Compatibility**:

    - Must work across Windows, macOS, and Linux
    - File system path differences
    - Terminal command differences

4. **Performance Considerations**:

    - Minimize impact on VSCode performance
    - Efficient handling of large writing projects
    - Responsive UI even during AI processing

5. **Security**:

    - Safe handling of API keys
    - Secure communication with AI providers
    - Protection of user writing content

6. **Extensibility**:
    - Design must allow for adding new writing-specific features
    - Support for different writing workflows and genres
    - Flexibility to integrate with other writing tools
