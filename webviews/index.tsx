import React from 'react';
import { createRoot } from 'react-dom/client';
import { TranslationView } from './pages/TranslationView';

// This will be the entry point for our webviews
// Individual pages will be rendered based on the view type passed by the extension

const App: React.FC = () => {
  // Get view type from window global variable set by the extension
  const viewType = (window as any).viewType || 'default';

  switch (viewType) {
    case 'translation':
      return <TranslationView />;
    default:
      return (
        <div>
          <h1>Spec-Kit Viewer</h1>
          <p>Webview components will be rendered here</p>
          <p>View type: {viewType}</p>
        </div>
      );
  }
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}