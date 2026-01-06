import React, { useState, useEffect } from 'react';

// Singleton to manage VS Code API
const getVsCodeApi = (() => {
  let api: any;
  return () => {
    if (!api) {
      try {
        api = (window as any).acquireVsCodeApi();
      } catch (e) {
        console.warn('VS Code API already acquired or not available', e);
      }
    }
    return api;
  };
})();

interface TranslationViewProps {
  // Props will be passed from the parent App component
}

interface TranslationState {
  translatedText: string;
  isStreaming: boolean;
  isLoading: boolean;
  error?: string;
}

export const TranslationView: React.FC<TranslationViewProps> = () => {
  const [state, setState] = useState<TranslationState>({
    translatedText: '',
    isStreaming: false,
    isLoading: true
  });

  useEffect(() => {
    // Listen for messages from the extension
    const messageListener = (event: MessageEvent) => {
      const message = event.data;
      console.log('📥 Received message in TranslationView:', message);

      switch (message.command) {
        case 'updateTranslation':
          console.log('🔄 Updating translation state:', {
            textLength: message.payload.text?.length || 0,
            isStreaming: message.payload.isStreaming
          });

          setState(prev => ({
            ...prev,
            translatedText: message.payload.text,
            isStreaming: message.payload.isStreaming,
            isLoading: false,
            error: undefined
          }));
          break;

        case 'translationError':
          console.log('❌ Translation error received:', message.payload.error);
          setState(prev => ({
            ...prev,
            error: message.payload.error,
            isStreaming: false,
            isLoading: false
          }));
          break;

        default:
          console.warn('❓ Unknown message:', message);
      }
    };

    window.addEventListener('message', messageListener);

    // Notify extension that webview is ready
    const vscode = getVsCodeApi();
    if (vscode) {
      console.log('Webview mounted, sending webviewReady message');
      vscode.postMessage({ command: 'webviewReady' });
    }

    return () => {
      window.removeEventListener('message', messageListener);
    };
  }, []);

  const handleRequestTranslation = (filePath: string) => {
    // Send message to extension to request translation
    const vscode = getVsCodeApi();
    if (vscode) {
      vscode.postMessage({
        command: 'requestTranslation',
        payload: { path: filePath }
      });
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: undefined
    }));
  };

  if (state.isLoading && !state.translatedText) {
    return (
      <div className="container">
        <div className="loading">
          <p>Loading translation...</p>
          <div className="spinner">⏳</div>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="container">
        <div className="error">
          <h2>Translation Error</h2>
          <p>{state.error}</p>
          <button onClick={() => setState(prev => ({ ...prev, error: undefined, isLoading: false }))}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {state.isStreaming && (
        <div className="streaming-indicator">
          🔄 Translating...
        </div>
      )}

      <div className="content">
        <div className="translation-content">
          {state.translatedText || 'No translation available'}
          {state.isStreaming && (
            <span className="cursor">|</span>
          )}
        </div>

        <div className="actions">
          <button
            className="action-button"
            onClick={() => {
              navigator.clipboard.writeText(state.translatedText);
            }}
            disabled={!state.translatedText}
          >
            📋 Copy Translation
          </button>

          <button
            className="action-button"
            onClick={() => handleRequestTranslation('')}
            disabled={state.isStreaming}
          >
            🔄 Refresh Translation
          </button>
        </div>
      </div>

      <style>{`
        .container {
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
          font-family: var(--vscode-font-family);
        }

        .streaming-indicator {
          color: var(--vscode-textPreformat-foreground);
          font-style: italic;
          font-size: 14px;
          animation: pulse 1.5s ease-in-out infinite;
          margin-bottom: 15px;
          padding: 8px 12px;
          background-color: var(--vscode-editor-inactiveSelectionBackground);
          border-radius: 4px;
          border-left: 3px solid var(--vscode-textLink-foreground);
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .content {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .translation-content {
          background-color: var(--vscode-editor-background);
          border: 1px solid var(--vscode-panel-border);
          border-radius: 4px;
          padding: 15px;
          min-height: 200px;
          white-space: pre-wrap;
          line-height: 1.6;
          font-family: var(--vscode-editor-font-family);
          overflow-y: auto;
          max-height: 400px;
        }

        .cursor {
          animation: blink 1s infinite;
          color: var(--vscode-editorCursor-foreground);
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        .actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .action-button {
          background-color: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.2s;
        }

        .action-button:hover:not(:disabled) {
          background-color: var(--vscode-button-hoverBackground);
        }

        .action-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .loading {
          text-align: center;
          padding: 40px;
        }

        .spinner {
          font-size: 24px;
          animation: spin 2s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .error {
          text-align: center;
          padding: 40px;
          color: var(--vscode-errorForeground);
        }

        .error h2 {
          color: var(--vscode-errorForeground);
          margin-bottom: 10px;
        }

        .error button {
          background-color: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 10px;
        }
      `}</style>
    </div>
  );
};