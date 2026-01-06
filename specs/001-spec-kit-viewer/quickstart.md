# Quickstart: Spec-Kit-Viewer

## Prerequisites

- Node.js 18+
- VSCode 1.80+
- `pnpm` (recommended) or `npm`

## Setup

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd spec-kit-viewer
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Configure Environment**:
   - Ensure you have `FRIDAY_APP_ID` set in your environment or VSCode settings (once implemented).

## Running the Extension

1. Open the project in VSCode:
   ```bash
   code .
   ```

2. Press `F5` to start the Extension Development Host.

3. In the new window:
   - Open a folder containing `.md` files (e.g., `specs/`).
   - Run command `SpecKit: Show Graph` to view the dependency graph.
   - Open a `.md` file and look for "Translate" CodeLens or hover over text.

## Testing

- **Unit Tests**:
  ```bash
  pnpm test
  ```

- **Integration Tests**:
  Run via the "Extension Tests" launch configuration in VSCode.