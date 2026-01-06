import * as vscode from 'vscode';
import { SpecTranslationProvider } from './providers/SpecTranslationProvider';
import { TranslationPanel } from './panels/TranslationPanel';
import { TranslationCache } from './services/translation/TranslationCache';

let translationCache: TranslationCache;

/**
 * Extension activation
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('Spec-Kit-Viewer extension is now active!');

  // Check if SSL verification should be disabled globally
  const config = vscode.workspace.getConfiguration('specKit.translation');
  const skipSslVerification = config.get('skipSslVerification', false);

  if (skipSslVerification) {
    console.log('⚠️ SSL verification disabled globally for this session');
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
  }

  // Initialize translation cache
  translationCache = new TranslationCache(context.globalState);

  // Register CodeLens provider for translation
  const translationProvider = new SpecTranslationProvider();
  const codeLensDisposable = vscode.languages.registerCodeLensProvider(
    { language: 'markdown', scheme: 'file' },
    translationProvider
  );

  // Register commands
  const openTranslationPreviewCommand = vscode.commands.registerCommand(
    'specKit.openTranslationPreview',
    (uri?: vscode.Uri) => {
      const sourceUri = uri || vscode.window.activeTextEditor?.document.uri;
      if (sourceUri) {
        TranslationPanel.createOrShow(context.extensionUri, translationCache, sourceUri);
      } else {
        vscode.window.showWarningMessage('No active document to translate');
      }
    }
  );

  const translateSectionCommand = vscode.commands.registerCommand(
    'specKit.translateSection',
    async (uri: vscode.Uri, lineNumber: number) => {
      try {
        const document = await vscode.workspace.openTextDocument(uri);
        const sectionText = extractSection(document, lineNumber);

        if (sectionText) {
          // Create a temporary document with just the section
          const tempDoc = await vscode.workspace.openTextDocument({
            content: sectionText,
            language: 'markdown'
          });

          TranslationPanel.createOrShow(context.extensionUri, translationCache, tempDoc.uri);
        } else {
          vscode.window.showWarningMessage('Could not extract section for translation');
        }
      } catch (error) {
        console.error('Error translating section:', error);
        vscode.window.showErrorMessage(`Failed to translate section: ${error}`);
      }
    }
  );

  const showGraphCommand = vscode.commands.registerCommand(
    'specKit.showGraph',
    () => {
      vscode.window.showInformationMessage('Graph visualization will be implemented in Phase 4 (User Story 2)');
      // TODO: Implement in Phase 4 for User Story 2
    }
  );

  const checkSettingsCommand = vscode.commands.registerCommand(
    'specKit.checkSettings',
    async () => {
      const config = vscode.workspace.getConfiguration('specKit.translation');

      const settings = [
        `🔑 API Key: ${config.get('apiKey') ? 'Configured ✅' : 'Missing ❌'}`,
        `🌐 Base URL: ${config.get('baseUrl') || 'Not set'}`,
        `🤖 Model: ${config.get('model') || 'Not set'}`,
        `🔒 Skip SSL: ${config.get('skipSslVerification') ? 'Yes ✅' : 'No ❌'}`
      ].join('\n\n');

      vscode.window.showInformationMessage(`SpecKit Settings:\n\n${settings}`);
    }
  );

  const clearCacheCommand = vscode.commands.registerCommand(
    'specKit.clearCache',
    async () => {
      try {
        console.log('🧹 Clearing translation cache...');
        await translationCache.clear();

        // Get cache stats to verify clearing
        const stats = await translationCache.getStats();
        console.log('📊 Cache stats after clearing:', stats);

        vscode.window.showInformationMessage(`✅ Translation cache cleared! Entries: ${stats.entryCount}`);
      } catch (error) {
        console.error('❌ Error clearing cache:', error);
        vscode.window.showErrorMessage(`❌ Failed to clear cache: ${error.message}`);
      }
    }
  );

  const forceTranslateCommand = vscode.commands.registerCommand(
    'specKit.forceTranslate',
    (uri?: vscode.Uri) => {
      const sourceUri = uri || vscode.window.activeTextEditor?.document.uri;
      if (sourceUri) {
        console.log('🚀 Force translating (skipping cache):', sourceUri.fsPath);
        TranslationPanel.createOrShow(context.extensionUri, translationCache, sourceUri, true);
      } else {
        vscode.window.showWarningMessage('No active document to translate');
      }
    }
  );

  const testApiConnectionCommand = vscode.commands.registerCommand(
    'specKit.testApiConnection',
    async () => {
      try {
        // Check current configuration
        const config = vscode.workspace.getConfiguration('specKit.translation');

        const configInfo = [
          `API Key: ${config.get('apiKey') ? 'Configured ✅' : 'Missing ❌'}`,
          `Base URL: ${config.get('baseUrl')}`,
          `Model: ${config.get('model')}`,
          `Skip SSL: ${config.get('skipSslVerification') ? 'Yes ✅' : 'No ❌'}`
        ].join('\n');

        // Show config in popup
        const showConfig = await vscode.window.showInformationMessage(
          'Current Configuration:\n' + configInfo + '\n\nProceed with connection test?',
          'Yes', 'Cancel'
        );

        if (showConfig !== 'Yes') {
          return;
        }

        const { FridayClient } = require('./services/translation/FridayClient');
        const client = new FridayClient();

        if (!client.isAvailable()) {
          vscode.window.showErrorMessage('❌ API not configured. Please set your API key in settings.');
          return;
        }

        vscode.window.showInformationMessage('Testing API connection...');

        const testResult = await client.testConnection();
        if (testResult) {
          vscode.window.showInformationMessage('✅ API connection successful!');
        } else {
          vscode.window.showErrorMessage('❌ API connection failed. See next popup for details.');
        }
      } catch (error) {
        // Show detailed error in popup
        const errorDetails = [
          `Error: ${error.message}`,
          `Type: ${error.name || 'Unknown'}`,
          `Code: ${error.code || 'N/A'}`
        ].join('\n');

        vscode.window.showErrorMessage(`API Test Failed:\n${errorDetails}`);
      }
    }
  );

  // Register configuration change listener
  const configChangeDisposable = vscode.workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration('specKit.translation')) {
      // Refresh translation service configuration
      vscode.window.showInformationMessage('Translation configuration updated');
    }
  });

  // Add to disposables
  context.subscriptions.push(
    codeLensDisposable,
    openTranslationPreviewCommand,
    translateSectionCommand,
    showGraphCommand,
    checkSettingsCommand,
    clearCacheCommand,
    forceTranslateCommand,
    testApiConnectionCommand,
    configChangeDisposable
  );

  // Set up configuration schema
  setupConfigurationSchema();
}

/**
 * Extension deactivation
 */
export function deactivate() {
  console.log('Spec-Kit-Viewer extension is deactivated');

  // Restore SSL verification if it was disabled
  if (process.env['NODE_TLS_REJECT_UNAUTHORIZED'] === '0') {
    delete process.env['NODE_TLS_REJECT_UNAUTHORIZED'];
    console.log('🔒 SSL verification restored');
  }
}

/**
 * Extracts a section from a document starting at the given line
 */
function extractSection(document: vscode.TextDocument, startLine: number): string | undefined {
  const lines: string[] = [];
  const startLineText = document.lineAt(startLine).text;

  // Determine the heading level
  const headingMatch = startLineText.match(/^(#+)\s/);
  if (!headingMatch) {
    return undefined;
  }

  const headingLevel = headingMatch[1].length;
  lines.push(startLineText);

  // Extract lines until we hit another heading of the same or higher level
  for (let i = startLine + 1; i < document.lineCount; i++) {
    const line = document.lineAt(i);
    const lineText = line.text;

    // Check if this is a heading
    const lineHeadingMatch = lineText.match(/^(#+)\s/);
    if (lineHeadingMatch) {
      const lineHeadingLevel = lineHeadingMatch[1].length;
      // Stop if we hit a heading of the same or higher level
      if (lineHeadingLevel <= headingLevel) {
        break;
      }
    }

    lines.push(lineText);
  }

  return lines.join('\n');
}

/**
 * Sets up configuration schema for the extension
 */
function setupConfigurationSchema() {
  // This would typically be done in package.json, but we can also set defaults here
  const config = vscode.workspace.getConfiguration('specKit');

  // Set default values if not already configured
  if (!config.has('translation.apiKey')) {
    // Don't set a default API key for security reasons
  }

  if (!config.has('translation.baseUrl')) {
    config.update('translation.baseUrl', 'https://friday-api.example.com', vscode.ConfigurationTarget.Global);
  }

  if (!config.has('translation.model')) {
    config.update('translation.model', 'LongCat-Flash-Chat-2512', vscode.ConfigurationTarget.Global);
  }
}