import * as sinon from 'sinon';

// Create a proper mock configuration
const mockConfig = {
  get: sinon.stub()
};

// Set up default mock responses
mockConfig.get.withArgs('apiKey', '').returns('test-api-key');
mockConfig.get.withArgs('baseUrl', sinon.match.string).returns('https://test-api.example.com');
mockConfig.get.withArgs('model', sinon.match.string).returns('test-model');
mockConfig.get.withArgs('skipSslVerification', false).returns(false);

// Mock OpenAI SDK to prevent real HTTP requests
const mockOpenAIInstance = {
  chat: {
    completions: {
      create: sinon.stub().resolves({
        choices: [{ message: { content: 'Mocked translation result' } }],
        usage: { total_tokens: 100 }
      })
    }
  }
};

const MockOpenAI = function(_config: any) {
  return mockOpenAIInstance;
};
const MockAPIError = class extends Error {
  status?: number;
  code?: string;
  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = 'APIError';
  }
};

// Mock Memento (VSCode storage) - with actual storage simulation
const mementoStorage = new Map<string, any>();
const mockMemento = {
  get: sinon.stub().callsFake((key: string, defaultValue?: any) => {
    return mementoStorage.get(key) ?? defaultValue;
  }),
  update: sinon.stub().callsFake(async (key: string, value: any) => {
    mementoStorage.set(key, value);
  }),
  keys: sinon.stub().callsFake(() => {
    return Array.from(mementoStorage.keys());
  })
};

// Mock ExtensionContext
const mockExtensionContext = {
  globalState: mockMemento,
  workspaceState: mockMemento
};

// Mock VSCode module
const mockVscode = {
  workspace: {
    getConfiguration: sinon.stub().returns(mockConfig),
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
  if (id === 'openai') {
    return { OpenAI: MockOpenAI, default: MockOpenAI, APIError: MockAPIError };
  }
  return originalRequire.apply(this, arguments);
};

export { mockVscode, mockOpenAIInstance, MockOpenAI, mockExtensionContext, mockMemento, mementoStorage };