# Implementation Plan: Spec-Kit-Viewer VSCode Extension

**Branch**: `001-spec-kit-viewer` | **Date**: 2026-01-06 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/001-spec-kit-viewer/spec.md`

## Summary

Develop a VSCode extension to visualize dependencies between Spec-Kit Markdown files and provide real-time Chinese translation using the FRIDAY API.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: `vscode`, `react`, `reactflow`, `remark` (Markdown parser), `axios` (API)
**Storage**: VSCode `Memento` (Local Storage) for caching
**Testing**: `mocha` (Unit/Integration), `vscode-test`
**Target Platform**: VSCode Desktop (macOS/Windows/Linux) & Web
**Project Type**: VSCode Extension
**Performance Goals**: Graph render < 5s (100 nodes), Translation stream start < 2s
**Constraints**: VSCode Sandbox, Network required for Translation
**Scale/Scope**: Single extension, multiple webviews

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Library-First**: Core logic (parsing, graph building) separated from VSCode UI.
- **Test-First**: Unit tests for parsers and services required.
- **Integration Testing**: End-to-end tests for extension activation and commands.

## Project Structure

### Documentation (this feature)

```text
specs/001-spec-kit-viewer/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
src/
├── extension.ts         # Entry point
├── commands/            # Command handlers
├── panels/              # Webview panels (React)
├── services/            # Core logic
│   ├── translation/     # FRIDAY API client
│   ├── graph/           # Graph builder
│   └── parser/          # Markdown parser
├── types/               # Shared types
└── utils/               # Helpers

webviews/                # React source for Webviews
├── components/
├── pages/
└── index.tsx

test/
├── suite/               # VSCode integration tests
└── unit/                # Unit tests
```

**Structure Decision**: Standard VSCode extension layout with separate `webviews` folder for React code to be bundled separately (e.g., via Webpack/Esbuild).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| React for UI | Interactive Graph (ReactFlow) | HTML/Vanilla JS is too complex for interactive node-link diagrams. |