import * as vscode from 'vscode';

/**
 * Provides CodeLens actions for translation in Markdown files
 */
export class SpecTranslationProvider implements vscode.CodeLensProvider {

  private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

  constructor() {
    // Listen for configuration changes
    vscode.workspace.onDidChangeConfiguration(() => {
      this._onDidChangeCodeLenses.fire();
    });
  }

  /**
   * Provides CodeLens for Markdown files
   */
  provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CodeLens[]> {
    if (document.languageId !== 'markdown') {
      return [];
    }

    const codeLenses: vscode.CodeLens[] = [];

    // Add CodeLens at the beginning of the document for full translation
    const firstLine = document.lineAt(0);
    const range = new vscode.Range(firstLine.range.start, firstLine.range.end);

    const translateCommand: vscode.Command = {
      title: "🌏 Translate to Chinese",
      command: 'specKit.openTranslationPreview',
      arguments: [document.uri]
    };

    codeLenses.push(new vscode.CodeLens(range, translateCommand));

    // Add CodeLens for each major heading (## or #)
    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i);
      const text = line.text.trim();

      // Check if line is a heading
      if (text.startsWith('#') && text.length > 1) {
        const headingLevel = text.match(/^#+/)?.[0].length || 0;

        // Only add CodeLens for major headings (# and ##)
        if (headingLevel <= 2) {
          const range = new vscode.Range(line.range.start, line.range.end);

          const translateSectionCommand: vscode.Command = {
            title: "🌏 Translate Section",
            command: 'specKit.translateSection',
            arguments: [document.uri, i]
          };

          codeLenses.push(new vscode.CodeLens(range, translateSectionCommand));
        }
      }
    }

    return codeLenses;
  }

  /**
   * Resolves a CodeLens (optional implementation)
   */
  resolveCodeLens(codeLens: vscode.CodeLens, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CodeLens> {
    return codeLens;
  }

  /**
   * Refresh CodeLenses
   */
  refresh(): void {
    this._onDidChangeCodeLenses.fire();
  }
}