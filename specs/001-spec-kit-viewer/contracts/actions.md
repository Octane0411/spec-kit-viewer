# API Contracts & Message Protocols

## Extension <-> Webview Protocol

Communication between the VSCode Extension Host and the React Webview.

### To Webview (Commands)

#### `updateGraph`
Updates the graph data.
```json
{
  "command": "updateGraph",
  "payload": {
    "nodes": [
      { "id": "/path/to/file.md", "label": "file.md", "type": "spec" }
    ],
    "edges": [
      { "source": "/path/to/a.md", "target": "/path/to/b.md" }
    ]
  }
}
```

#### `updateTranslation`
Updates the translation preview content.
```json
{
  "command": "updateTranslation",
  "payload": {
    "text": "Translated content...",
    "isStreaming": true
  }
}
```

### From Webview (Events)

#### `nodeSelected`
Triggered when a user clicks a node in the graph.
```json
{
  "command": "nodeSelected",
  "payload": {
    "path": "/path/to/file.md"
  }
}
```

#### `requestTranslation`
Triggered when user requests translation from the preview view.
```json
{
  "command": "requestTranslation",
  "payload": {
    "path": "/path/to/file.md"
  }
}
```

## Internal Services

### TranslationService

#### `translate(text: string, model: string): AsyncIterable<string>`
Streams the translation of the given text.

- **Input**:
  - `text`: English text to translate.
  - `model`: Model identifier (e.g., "LongCat-Flash-Chat-2512").
- **Output**: Stream of translated text chunks.

### ParserService

#### `parseWorkspace(rootPath: string): Promise<SpecFile[]>`
Scans and parses all relevant Markdown files in the workspace.

#### `parseFile(path: string, content: string): SpecFile`
Parses a single file to extract dependencies.