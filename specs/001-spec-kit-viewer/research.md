# Research & Technical Decisions

**Feature**: Spec-Kit-Viewer VSCode Extension
**Date**: 2026-01-06

## Technical Choices

### 1. Extension Architecture
- **Decision**: Use standard VSCode Extension API with Webviews for complex UI.
- **Rationale**: VSCode is the target platform. Webviews are required for the React-based Graph visualization and side-by-side translation preview.
- **Alternatives**: Custom Editor API (overkill for this), TreeView (insufficient for Graph).

### 2. Graph Visualization
- **Decision**: **ReactFlow**
- **Rationale**: Industry standard for React-based node-link diagrams. Highly customizable, supports interactive nodes/edges, and has good performance.
- **Integration**: Will run inside a VSCode Webview. Communication via `acquireVsCodeApi().postMessage`.

### 3. Markdown Parsing
- **Decision**: **remark** (or similar AST-based parser)
- **Rationale**: Robust parsing of Markdown syntax. We need to reliably extract links `[label](path)` even in complex documents. Regex is error-prone.
- **Implementation**: Run in the Extension Host (Node.js environment).

### 4. Translation Service
- **Decision**: **FRIDAY API** (Internal)
- **Rationale**: Mandated by requirements.
- **Protocol**: HTTP Streaming (Server-Sent Events or chunked response) for real-time feedback.
- **Caching**: Local Storage (Memento) or file-based cache in `.catpaw/cache` (or similar) to persist across sessions.

### 5. State Management
- **Decision**: **Zustand** (for React Webview) + **VSCode State** (Extension Host)
- **Rationale**: Lightweight and effective for managing graph state and translation data.

## Resolved Clarifications

- **Spec File Syntax**: Confirmed as Markdown (`.md`) using standard links.
- **Parsing Scope**: Focus on `spec`, `plan`, `tasks`, `checklist` templates.

## Open Questions / Risks

- **Large Workspaces**: Parsing hundreds of files might be slow.
- **Mitigation**: Implement incremental parsing (watch file changes) and caching of dependency trees.