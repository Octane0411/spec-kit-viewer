import * as sinon from 'sinon';

// Mock VSCode module
const mockVscode = {
  workspace: {
    getConfiguration: sinon.stub(),
    workspaceFolders: [{ uri: { fsPath: '/test/workspace' } }],
    findFiles: sinon.stub(),
    openTextDocument: sinon.stub()
  },
  window: {
    showErrorMessage: sinon.stub(),
    showWarningMessage: sinon.stub(),
    showInformationMessage: sinon.stub(),
    activeTextEditor: undefined,
    createWebviewPanel: sinon.stub()
  },
  ViewColumn: {
    One: 1,
    Two: 2,
    Beside: -1
  },
  Uri: {
    file: (path: string) => ({ fsPath: path, toString: () => path }),
    joinPath: (base: any, ...paths: string[]) => ({ fsPath: paths.join('/') })
  },
  RelativePattern: function(base: string, pattern: string) {
    return { base, pattern };
  },
  ConfigurationTarget: {
    Global: 1,
    Workspace: 2,
    WorkspaceFolder: 3
  }
};

// Mock the vscode module globally
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(id: string) {
  if (id === 'vscode') {
    return mockVscode;
  }
  return originalRequire.apply(this, arguments);
};

export { mockVscode };