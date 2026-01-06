# Data Model: Spec-Kit-Viewer

## Core Entities

### SpecFile
Represents a Markdown file in the workspace.

| Field | Type | Description |
|-------|------|-------------|
| `path` | `string` | Absolute path to the file (Unique ID). |
| `relativePath` | `string` | Path relative to workspace root. |
| `content` | `string` | Raw file content. |
| `hash` | `string` | SHA-256 hash of content for change detection. |
| `type` | `enum` | `spec`, `plan`, `tasks`, `checklist`, `other`. |
| `dependencies` | `Dependency[]` | List of outgoing references. |

### Dependency
Represents a link from one file to another.

| Field | Type | Description |
|-------|------|-------------|
| `sourcePath` | `string` | Path of the file containing the link. |
| `targetPath` | `string` | Path of the referenced file. |
| `type` | `enum` | `link` (standard), `import` (if applicable). |
| `line` | `number` | Line number where the link appears. |

### TranslationCache
Stores translation results to avoid re-fetching.

| Field | Type | Description |
|-------|------|-------------|
| `key` | `string` | Hash of the source text segment. |
| `sourceText` | `string` | Original English text. |
| `translatedText` | `string` | Translated Chinese text. |
| `model` | `string` | Model used for translation. |
| `timestamp` | `number` | Unix timestamp of translation. |

## State Management

### GraphState (Webview)
| Field | Type | Description |
|-------|------|-------------|
| `nodes` | `Node[]` | ReactFlow nodes (SpecFiles). |
| `edges` | `Edge[]` | ReactFlow edges (Dependencies). |
| `selectedNode` | `string?` | Currently selected node ID. |

### ExtensionState
| Field | Type | Description |
|-------|------|-------------|
| `files` | `Map<string, SpecFile>` | In-memory cache of parsed files. |
| `isScanning` | `boolean` | Whether a workspace scan is in progress. |