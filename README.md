# Spec-Kit-Viewer VSCode Extension

A VSCode extension for visualizing dependencies between Spec-Kit Markdown files and providing real-time Chinese translation.

## Features

### ✅ User Story 1 - Live Translation of Specs (IMPLEMENTED)

- **CodeLens Integration**: Shows "🌏 Translate to Chinese" and "🌏 Translate Section" actions in Markdown files
- **Side-by-Side Translation**: Opens a webview panel with real-time Chinese translation
- **Streaming Translation**: Supports streaming translation using the FRIDAY API
- **Translation Caching**: Caches translations locally to avoid redundant API calls
- **Section Translation**: Translate individual sections of documents

### 🚧 User Story 2 - Spec Dependency Visualization (PLANNED)

- Interactive graph visualization of spec dependencies
- Node-based navigation to source files
- ReactFlow-based interactive diagrams

## Implementation Status

### Phase 1: Setup ✅
- [x] Project structure (src, webviews, test)
- [x] package.json with dependencies
- [x] TypeScript configuration
- [x] Webpack configuration for webviews

### Phase 2: Foundational ✅
- [x] Core types (SpecFile, Dependency, TranslationCache)
- [x] ParserService for Markdown parsing
- [x] TranslationCache using VSCode Memento
- [x] TranslationService interface and implementations

### Phase 3: User Story 1 ✅
- [x] SpecTranslationProvider (CodeLens)
- [x] TranslationPanel (Webview management)
- [x] TranslationView (React component)
- [x] FridayClient (Real API integration)
- [x] Extension registration and commands

### Phase 4: User Story 2 (Not implemented)
- [ ] GraphPanel class
- [ ] GraphView React component
- [ ] GraphBuilder service
- [ ] Message passing for graph interactions

## Usage

1. **Install Dependencies**: `npm install`
2. **Compile**: `npm run compile`
3. **Configure Translation API**:
   - Open VSCode Settings
   - Search for "Spec-Kit Viewer"
   - Set your FRIDAY API key and base URL

4. **Use Translation Features**:
   - Open any Markdown file
   - Look for CodeLens actions: "🌏 Translate to Chinese" and "🌏 Translate Section"
   - Click to open translation preview in a side panel

## Commands

- `SpecKit: Open Translation Preview` - Opens translation for the active document
- `SpecKit: Show Graph` - (Planned) Shows dependency graph visualization

## Configuration

```json
{
  "specKit.translation.apiKey": "your-friday-api-key",
  "specKit.translation.baseUrl": "https://friday-api.example.com",
  "specKit.translation.model": "LongCat-Flash-Chat-2512"
}
```

## Architecture

### Core Components

- **ParserService**: Extracts dependencies from Markdown files using remark
- **TranslationService**: Handles streaming translation via FRIDAY API
- **TranslationCache**: Caches translations using VSCode's Memento API
- **SpecTranslationProvider**: Provides CodeLens actions for translation
- **TranslationPanel**: Manages webview for translation preview

### Data Flow

1. User clicks CodeLens action in Markdown file
2. TranslationPanel opens and requests translation
3. TranslationService checks cache, then calls FRIDAY API if needed
4. Translation streams to React component in webview
5. Result is cached for future use

## Development

- **Extension Host**: TypeScript code in `src/`
- **Webviews**: React components in `webviews/`
- **Build**: Webpack bundles webviews, TypeScript compiles extension

## Next Steps

To complete User Story 2 (Dependency Visualization):

1. Implement GraphPanel class
2. Create GraphView React component with ReactFlow
3. Implement GraphBuilder service for dependency analysis
4. Add graph interaction and navigation features

## Testing

The implementation follows the MVP approach with User Story 1 fully functional and independently testable. Users can:

- Open any `.spec` file
- Click "Translate" CodeLens action
- See results in side-by-side translation view
- Experience streaming translation with caching