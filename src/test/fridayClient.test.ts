import * as assert from 'assert';
import * as sinon from 'sinon';
import { FridayClient } from '../services/translation/FridayClient';

// Mock VSCode workspace configuration
const mockConfig = {
  get: sinon.stub()
};

const mockWorkspace = {
  getConfiguration: sinon.stub().returns(mockConfig)
};

// Mock the vscode module
const mockVscode = {
  workspace: mockWorkspace
};

// Mock OpenAI SDK
class MockOpenAI {
  chat: {
    completions: {
      create: sinon.SinonStub;
    };
  };

  constructor(config: any) {
    this.chat = {
      completions: {
        create: sinon.stub()
      }
    };
  }
}

// Mock the OpenAI module
const mockOpenAIModule = {
  default: MockOpenAI,
  APIError: class extends Error {
    status?: number;
    code?: string;

    constructor(message: string, status?: number, code?: string) {
      super(message);
      this.status = status;
      this.code = code;
      this.name = 'APIError';
    }
  }
};

describe('FridayClient', () => {
  let client: FridayClient;
  let mockOpenAI: MockOpenAI;

  beforeEach(() => {
    // Reset all stubs
    sinon.restore();

    // Setup default config responses
    mockConfig.get.withArgs('apiKey', '').returns('test-api-key');
    mockConfig.get.withArgs('baseUrl', sinon.match.string).returns('https://test-api.example.com');
    mockConfig.get.withArgs('model', sinon.match.string).returns('test-model');
    mockConfig.get.withArgs('skipSslVerification', false).returns(false);

    // Mock the require calls
    const originalRequire = require;
    const requireStub = sinon.stub();
    requireStub.withArgs('openai').returns(mockOpenAIModule);
    require = requireStub as any;

    // Create client instance
    client = new FridayClient();

    // Get reference to the mocked OpenAI instance
    mockOpenAI = (client as any).client as MockOpenAI;

    // Restore require
    require = originalRequire;
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Configuration', () => {
    it('should load configuration from VSCode settings', () => {
      assert.ok(mockWorkspace.getConfiguration.calledWith('specKit.translation'));
      assert.ok(mockConfig.get.calledWith('apiKey', ''));
      assert.ok(mockConfig.get.calledWith('baseUrl', sinon.match.string));
      assert.ok(mockConfig.get.calledWith('model', sinon.match.string));
    });

    it('should report availability when properly configured', () => {
      assert.strictEqual(client.isAvailable(), true);
    });

    it('should report unavailability when API key is missing', () => {
      mockConfig.get.withArgs('apiKey', '').returns('');
      const clientWithoutKey = new FridayClient();
      assert.strictEqual(clientWithoutKey.isAvailable(), false);
    });

    it('should return configured default model', () => {
      const model = client.getDefaultModel();
      assert.strictEqual(model, 'test-model');
    });
  });

  describe('Translation', () => {
    it('should translate text using streaming API', async () => {
      const testText = 'Hello world';
      const expectedTranslation = 'Hello world translated';

      // Mock streaming response
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield {
            choices: [{
              delta: { content: 'Hello ' },
              finish_reason: null
            }]
          };
          yield {
            choices: [{
              delta: { content: 'world ' },
              finish_reason: null
            }]
          };
          yield {
            choices: [{
              delta: { content: 'translated' },
              finish_reason: 'stop'
            }]
          };
        }
      };

      mockOpenAI.chat.completions.create.resolves(mockStream);

      const result: string[] = [];
      for await (const chunk of client.translate(testText)) {
        result.push(chunk);
      }

      const fullTranslation = result.join('');
      assert.strictEqual(fullTranslation, expectedTranslation);

      // Verify API call
      assert.ok(mockOpenAI.chat.completions.create.calledOnce);
      const apiCall = mockOpenAI.chat.completions.create.getCall(0);
      const apiArgs = apiCall.args[0];

      assert.strictEqual(apiArgs.model, 'test-model');
      assert.strictEqual(apiArgs.stream, true);
      assert.strictEqual(apiArgs.messages.length, 2);
      assert.strictEqual(apiArgs.messages[1].content, testText);
    });

    it('should use custom model when specified', async () => {
      const customModel = 'custom-model';
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield {
            choices: [{
              delta: { content: 'test' },
              finish_reason: 'stop'
            }]
          };
        }
      };

      mockOpenAI.chat.completions.create.resolves(mockStream);

      const result = [];
      for await (const chunk of client.translate('test', customModel)) {
        result.push(chunk);
      }

      const apiCall = mockOpenAI.chat.completions.create.getCall(0);
      assert.strictEqual(apiCall.args[0].model, customModel);
    });

    it('should handle empty chunks gracefully', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield {
            choices: [{
              delta: { content: '' }, // Empty content
              finish_reason: null
            }]
          };
          yield {
            choices: [{
              delta: { content: 'actual content' },
              finish_reason: 'stop'
            }]
          };
        }
      };

      mockOpenAI.chat.completions.create.resolves(mockStream);

      const result: string[] = [];
      for await (const chunk of client.translate('test')) {
        result.push(chunk);
      }

      assert.strictEqual(result.join(''), 'actual content');
    });

    it('should handle chunks without content', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield {
            choices: [{
              delta: {}, // No content property
              finish_reason: null
            }]
          };
          yield {
            choices: [{
              delta: { content: 'real content' },
              finish_reason: 'stop'
            }]
          };
        }
      };

      mockOpenAI.chat.completions.create.resolves(mockStream);

      const result: string[] = [];
      for await (const chunk of client.translate('test')) {
        result.push(chunk);
      }

      assert.strictEqual(result.join(''), 'real content');
    });
  });

  describe('Error Handling', () => {
    it('should throw error when not configured', async () => {
      mockConfig.get.withArgs('apiKey', '').returns('');
      const unconfiguredClient = new FridayClient();

      try {
        const translation = unconfiguredClient.translate('test');
        for await (const chunk of translation) {
          // Should not reach here
          assert.fail('Should have thrown an error');
        }
      } catch (error) {
        assert.ok(error.message.includes('not configured'));
      }
    });

    it('should handle 401 authentication errors', async () => {
      const apiError = new mockOpenAIModule.APIError('Invalid API key', 401);
      mockOpenAI.chat.completions.create.rejects(apiError);

      try {
        const translation = client.translate('test');
        for await (const chunk of translation) {
          // Should not reach here
          assert.fail('Should have thrown an error');
        }
      } catch (error) {
        assert.ok(error.message.includes('Invalid API key'));
      }
    });

    it('should handle 429 rate limit errors', async () => {
      const apiError = new mockOpenAIModule.APIError('Rate limit exceeded', 429);
      mockOpenAI.chat.completions.create.rejects(apiError);

      try {
        const translation = client.translate('test');
        for await (const chunk of translation) {
          // Should not reach here
          assert.fail('Should have thrown an error');
        }
      } catch (error) {
        assert.ok(error.message.includes('Rate limit exceeded'));
      }
    });

    it('should handle timeout errors', async () => {
      const apiError = new mockOpenAIModule.APIError('Request timeout', undefined, 'ECONNABORTED');
      mockOpenAI.chat.completions.create.rejects(apiError);

      try {
        const translation = client.translate('test');
        for await (const chunk of translation) {
          // Should not reach here
          assert.fail('Should have thrown an error');
        }
      } catch (error) {
        assert.ok(error.message.includes('timed out'));
      }
    });

    it('should handle SSL certificate errors', async () => {
      const sslError = new Error('unable to get issuer certificate');
      mockOpenAI.chat.completions.create.rejects(sslError);

      try {
        const translation = client.translate('test');
        for await (const chunk of translation) {
          // Should not reach here
          assert.fail('Should have thrown an error');
        }
      } catch (error) {
        assert.ok(error.message.includes('SSL certificate error'));
      }
    });

    it('should handle network connection errors', async () => {
      const networkError = new Error('Network error') as Error & { code: string };
      networkError.code = 'ENOTFOUND';
      mockOpenAI.chat.completions.create.rejects(networkError);

      try {
        const translation = client.translate('test');
        for await (const chunk of translation) {
          // Should not reach here
          assert.fail('Should have thrown an error');
        }
      } catch (error) {
        assert.ok(error.message.includes('Network error'));
      }
    });

    it('should handle generic errors', async () => {
      const genericError = new Error('Something went wrong');
      mockOpenAI.chat.completions.create.rejects(genericError);

      try {
        const translation = client.translate('test');
        for await (const chunk of translation) {
          // Should not reach here
          assert.fail('Should have thrown an error');
        }
      } catch (error) {
        assert.ok(error.message.includes('Translation failed'));
      }
    });
  });

  describe('Connection Testing', () => {
    it('should return false when not configured', async () => {
      mockConfig.get.withArgs('apiKey', '').returns('');
      const unconfiguredClient = new FridayClient();

      const result = await unconfiguredClient.testConnection();
      assert.strictEqual(result, false);
    });

    it('should return true when connection succeeds', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield {
            choices: [{
              delta: { content: 'test response' },
              finish_reason: 'stop'
            }]
          };
        }
      };

      mockOpenAI.chat.completions.create.resolves(mockStream);

      const result = await client.testConnection();
      assert.strictEqual(result, true);
    });

    it('should return false when connection fails', async () => {
      mockOpenAI.chat.completions.create.rejects(new Error('Connection failed'));

      const result = await client.testConnection();
      assert.strictEqual(result, false);
    });
  });

  describe('Configuration Updates', () => {
    it('should reload configuration when updated', () => {
      // Change config
      mockConfig.get.withArgs('model', sinon.match.string).returns('new-model');

      client.updateConfiguration();

      const newModel = client.getDefaultModel();
      assert.strictEqual(newModel, 'new-model');
    });
  });

  describe('API Request Format', () => {
    it('should send correct system prompt for translation', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield {
            choices: [{
              delta: { content: 'test' },
              finish_reason: 'stop'
            }]
          };
        }
      };

      mockOpenAI.chat.completions.create.resolves(mockStream);

      const translation = client.translate('Hello world');
      for await (const chunk of translation) {
        break; // Just need to trigger the call
      }

      const apiCall = mockOpenAI.chat.completions.create.getCall(0);
      const messages = apiCall.args[0].messages;

      assert.strictEqual(messages[0].role, 'system');
      assert.ok(messages[0].content.includes('professional translator'));
      assert.ok(messages[0].content.includes('Chinese'));

      assert.strictEqual(messages[1].role, 'user');
      assert.strictEqual(messages[1].content, 'Hello world');
    });

    it('should set appropriate API parameters', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield {
            choices: [{
              delta: { content: 'test' },
              finish_reason: 'stop'
            }]
          };
        }
      };

      mockOpenAI.chat.completions.create.resolves(mockStream);

      const translation = client.translate('test');
      for await (const chunk of translation) {
        break; // Just need to trigger the call
      }

      const apiCall = mockOpenAI.chat.completions.create.getCall(0);
      const apiArgs = apiCall.args[0];

      assert.strictEqual(apiArgs.stream, true);
      assert.strictEqual(apiArgs.temperature, 0.3);
      assert.strictEqual(apiArgs.max_tokens, 8000);

      // Check request options
      const requestOptions = apiCall.args[1];
      assert.ok(requestOptions.headers['M-TraceId']);
      assert.strictEqual(requestOptions.timeout, 120000);
    });
  });
});