import * as vscode from 'vscode';
import * as path from 'path';
import { createTranslationService, TranslationService } from '../services/translation/TranslationService';
import { TranslationCache } from '../services/translation/TranslationCache';
import { UpdateTranslationMessage, RequestTranslationMessage, WebviewMessage } from '../types';

/**
 * Manages the Translation webview panel
 */
export class TranslationPanel {
  public static currentPanel: TranslationPanel | undefined;
  public static readonly viewType = 'specKitTranslation';

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private readonly _translationService: TranslationService;
  private readonly _translationCache: TranslationCache;
  private _currentUri?: vscode.Uri;

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, translationCache: TranslationCache) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._translationCache = translationCache;
    this._translationService = createTranslationService();

    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Update the content based on view changes
    this._panel.onDidChangeViewState(
      e => {
        if (this._panel.visible) {
          this._update();
        }
      },
      null,
      this._disposables
    );

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      (message: WebviewMessage) => {
        this._handleMessage(message);
      },
      null,
      this._disposables
    );
  }

  /**
   * Creates or shows the translation panel
   */
  public static createOrShow(extensionUri: vscode.Uri, translationCache: TranslationCache, sourceUri?: vscode.Uri, skipCache: boolean = false): void {
    const column = vscode.window.activeTextEditor
      ? vscode.ViewColumn.Beside
      : undefined;

    // If we already have a panel, show it
    if (TranslationPanel.currentPanel) {
      TranslationPanel.currentPanel._panel.reveal(column);
      if (sourceUri) {
        TranslationPanel.currentPanel._loadDocument(sourceUri, skipCache);
      }
      return;
    }

    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      TranslationPanel.viewType,
      'Translation Preview',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'out', 'webviews')
        ]
      }
    );

    TranslationPanel.currentPanel = new TranslationPanel(panel, extensionUri, translationCache);

    if (sourceUri) {
      TranslationPanel.currentPanel._loadDocument(sourceUri, skipCache);
    }
  }

  /**
   * Loads and translates a document
   */
  private async _loadDocument(uri: vscode.Uri, skipCache: boolean = false): Promise<void> {
    try {
      this._currentUri = uri;
      console.log('🔄 Loading document for translation:', uri.fsPath);
      
      let document: vscode.TextDocument;
      // Try to find if document is already open to avoid reloading/hanging
      const openDoc = vscode.workspace.textDocuments.find(doc => doc.uri.toString() === uri.toString());
      if (openDoc) {
        console.log('📄 Using already open document');
        document = openDoc;
      } else {
        console.log('📂 Opening document from disk...');
        document = await vscode.workspace.openTextDocument(uri);
      }

      const content = document.getText();
      console.log('📄 Document content length:', content.length);

      // Check cache first (unless skipCache is true)
      const model = this._translationService.getDefaultModel();
      console.log('🤖 Using model:', model);
      console.log('🔄 Skip cache:', skipCache);

      let cachedTranslation = null;
      if (!skipCache) {
        cachedTranslation = await this._translationCache.get(content, model);
      }

      // Check for "poisoned" cache (mock content cached under real model name)
      // This happens if user ran without API key first (getting mock), then added API key
      if (cachedTranslation && !skipCache) {
        const isMockContent = cachedTranslation.startsWith('[模拟翻译]');
        const isRealService = model !== 'mock-model';

        if (isMockContent && isRealService) {
          console.log('⚠️ Detected cached mock content while using real service. Invalidating cache.');
          cachedTranslation = null; // Force re-translation
        }
      }

      if (cachedTranslation && !skipCache) {
        console.log('⚡ Found cached translation, length:', cachedTranslation.length);
        console.log('📤 Sending cached translation to webview...');
        // Send cached result immediately
        this._sendTranslationUpdate(cachedTranslation, false);
      } else {
        console.log('🌐 Starting new translation...');
        // Start streaming translation
        await this._streamTranslation(content, model);
      }
    } catch (error) {
      console.error('❌ Error loading document for translation:', error);
      vscode.window.showErrorMessage(`Failed to load document: ${error}`);
    }
  }

  /**
   * Streams translation from the service
   */
  private async _streamTranslation(text: string, model: string): Promise<void> {
    let fullTranslation = '';

    try {
      console.log('🚀 Starting translation service...');
      console.log('📝 Text to translate (first 100 chars):', text.substring(0, 100) + '...');

      // Check if translation service is available
      if (!this._translationService.isAvailable()) {
        console.log('⚠️ Translation service not available, using fallback');
      }

      let chunkCount = 0;
      for await (const chunk of this._translationService.translate(text, model)) {
        chunkCount++;
        fullTranslation += chunk;
        console.log(`📦 Received chunk ${chunkCount}:`, chunk.substring(0, 50) + '...');
        this._sendTranslationUpdate(fullTranslation, true);
      }

      console.log(`✅ Translation complete! Total chunks: ${chunkCount}, Length: ${fullTranslation.length}`);

      // Translation complete, save to cache
      await this._translationCache.set(text, fullTranslation, model);
      this._sendTranslationUpdate(fullTranslation, false);
    } catch (error) {
      console.error('❌ Error during translation:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      vscode.window.showErrorMessage(`Translation failed: ${error.message || error}`);
    }
  }

  /**
   * Sends translation update to webview
   */
  private _sendTranslationUpdate(text: string, isStreaming: boolean): void {
    console.log(`📨 Sending translation update to webview: ${text.length} chars, streaming: ${isStreaming}`);

    const message: UpdateTranslationMessage = {
      command: 'updateTranslation',
      payload: {
        text,
        isStreaming
      }
    };

    console.log('📬 Posting message to webview:', message);
    this._panel.webview.postMessage(message);
  }

  /**
   * Handles messages from the webview
   */
  private async _handleMessage(message: WebviewMessage): Promise<void> {
    switch (message.command) {
      case 'requestTranslation':
        const requestMsg = message as RequestTranslationMessage;
        const uri = vscode.Uri.file(requestMsg.payload.path);
        await this._loadDocument(uri);
        break;

      case 'webviewReady':
        console.log('📨 Received webviewReady message from Webview');
        if (this._currentUri) {
          console.log('🔄 Reloading content for:', this._currentUri.fsPath);
          await this._loadDocument(this._currentUri);
        } else {
          console.log('⚠️ No current URI to reload');
        }
        break;

      default:
        console.warn('Unknown message from webview:', message);
    }
  }

  /**
   * Updates the webview content
   */
  private _update(): void {
    const webview = this._panel.webview;
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  /**
   * Generates HTML content for the webview
   */
  private _getHtmlForWebview(webview: vscode.Webview): string {
    // Get the local path to main script run in the webview
    const scriptPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'out', 'webviews', 'bundle.js');
    const scriptUri = webview.asWebviewUri(scriptPathOnDisk);

    // Use a nonce to only allow specific scripts to be run
    const nonce = getNonce();

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Chinese Translation</title>
        <style>
          body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
          }
          .streaming-indicator {
            color: var(--vscode-textPreformat-foreground);
            font-style: italic;
            margin-bottom: 10px;
          }
          .translation-content {
            white-space: pre-wrap;
            line-height: 1.6;
            border: 1px solid var(--vscode-panel-border);
            padding: 15px;
            border-radius: 4px;
            background-color: var(--vscode-editor-background);
          }
        </style>
      </head>
      <body>
        <div id="root">
          <p>Loading translation...</p>
        </div>
        <script nonce="${nonce}" src="${scriptUri}"></script>
        <script nonce="${nonce}">
          window.viewType = 'translation';
        </script>
      </body>
      </html>`;
  }

  /**
   * Disposes of the panel
   */
  public dispose(): void {
    TranslationPanel.currentPanel = undefined;

    // Clean up our resources
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}