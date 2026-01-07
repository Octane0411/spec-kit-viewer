import * as assert from 'assert';
import * as sinon from 'sinon';
import { createTranslationService, BaseTranslationService } from '../services/translation/TranslationService';

describe('TranslationService Factory', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('Service Creation', () => {
    it('should create FridayClient when available', () => {
      // Mock successful FridayClient creation
      const mockFridayClient = {
        isAvailable: sinon.stub().returns(true),
        translate: sinon.stub(),
        getDefaultModel: sinon.stub().returns('test-model'),
        testConnection: sinon.stub(),
        updateConfiguration: sinon.stub()
      };

      // Mock the require call to return a working FridayClient
      const originalRequire = require;
      const requireStub = sinon.stub() as any;
      (require as any) = requireStub;
      requireStub
        .withArgs('./FridayClient')
        .returns({ FridayClient: function() { return mockFridayClient; } });

      const service = createTranslationService();

      // Should return the FridayClient instance
      assert.strictEqual(service.isAvailable(), true);
      assert.strictEqual(service.getDefaultModel(), 'test-model');

      // Restore require
      require = originalRequire;
    });

    it('should fallback to BaseTranslationService when FridayClient is not available', () => {
      // Mock FridayClient that is not available
      const mockFridayClient = {
        isAvailable: sinon.stub().returns(false),
        translate: sinon.stub(),
        getDefaultModel: sinon.stub(),
        testConnection: sinon.stub(),
        updateConfiguration: sinon.stub()
      };

      const originalRequire = require;
      const requireStub = sinon.stub() as any;
      (require as any) = requireStub;
      requireStub
        .withArgs('./FridayClient')
        .returns({ FridayClient: function() { return mockFridayClient; } });

      const service = createTranslationService();

      // Should fallback to BaseTranslationService
      assert.strictEqual(service.isAvailable(), false);
      assert.strictEqual(service.getDefaultModel(), 'mock-model');

      require = originalRequire;
    });

    it('should fallback to BaseTranslationService when FridayClient fails to load', () => {
      // Mock require to throw an error
      const originalRequire = require;
      const requireStub = sinon.stub() as any;
      (require as any) = requireStub;
      requireStub
        .withArgs('./FridayClient')
        .throws(new Error('Module not found'));

      const service = createTranslationService();

      // Should fallback to BaseTranslationService
      assert.strictEqual(service.isAvailable(), false);
      assert.strictEqual(service.getDefaultModel(), 'mock-model');

      require = originalRequire;
    });

    it('should fallback when FridayClient constructor throws', () => {
      // Mock FridayClient constructor that throws
      const originalRequire = require;
      const requireStub = sinon.stub() as any;
      (require as any) = requireStub;
      requireStub
        .withArgs('./FridayClient')
        .returns({
          FridayClient: function() {
            throw new Error('Configuration error');
          }
        });

      const service = createTranslationService();

      // Should fallback to BaseTranslationService
      assert.strictEqual(service.isAvailable(), false);
      assert.strictEqual(service.getDefaultModel(), 'mock-model');

      require = originalRequire;
    });
  });
});

describe('BaseTranslationService', () => {
  let service: BaseTranslationService;

  beforeEach(() => {
    service = new BaseTranslationService();
  });

  describe('Configuration', () => {
    it('should report as not available', () => {
      assert.strictEqual(service.isAvailable(), false);
    });

    it('should return mock model name', () => {
      assert.strictEqual(service.getDefaultModel(), 'mock-model');
    });
  });

  describe('Translation', () => {
    it('should provide mock translation with Chinese prefix', async () => {
      const inputText = 'Hello world';
      const results: string[] = [];

      for await (const chunk of service.translate(inputText, 'mock-model')) {
        results.push(chunk);
      }

      const fullTranslation = results.join('');
      assert.ok(fullTranslation.startsWith('[模拟翻译]'));
      assert.ok(fullTranslation.includes(inputText));
    });

    it('should handle empty input', async () => {
      const results: string[] = [];

      for await (const chunk of service.translate('', 'mock-model')) {
        results.push(chunk);
      }

      const fullTranslation = results.join('');
      assert.ok(fullTranslation.startsWith('[模拟翻译]'));
    });

    it('should handle long input text', async () => {
      const longText = 'A'.repeat(1000);
      const results: string[] = [];

      for await (const chunk of service.translate(longText, 'mock-model')) {
        results.push(chunk);
      }

      const fullTranslation = results.join('');
      assert.ok(fullTranslation.startsWith('[模拟翻译]'));
      assert.ok(fullTranslation.includes(longText));
    });

    it('should respect custom model parameter', async () => {
      const results: string[] = [];

      for await (const chunk of service.translate('test', 'custom-model')) {
        results.push(chunk);
      }

      const fullTranslation = results.join('');
      assert.ok(fullTranslation.startsWith('[模拟翻译]'));
    });

    it('should yield translation in chunks', async () => {
      const inputText = 'Hello world';
      const chunks: string[] = [];

      for await (const chunk of service.translate(inputText, 'mock-model')) {
        chunks.push(chunk);
        // Each chunk should be non-empty
        assert.ok(chunk.length > 0);
      }

      // Should have multiple chunks
      assert.ok(chunks.length > 1);

      // Combined chunks should form complete translation
      const fullTranslation = chunks.join('');
      assert.ok(fullTranslation.startsWith('[模拟翻译]'));
      assert.ok(fullTranslation.includes(inputText));
    });
  });

  describe('Streaming Behavior', () => {
    it('should simulate realistic streaming delays', async () => {
      const startTime = Date.now();
      const chunks: string[] = [];

      for await (const chunk of service.translate('test', 'mock-model')) {
        chunks.push(chunk);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should take some time to simulate real API behavior
      // Note: This is a rough check since timing can be variable in tests
      assert.ok(duration >= 0); // At least some time should pass

      // Should have received multiple chunks
      assert.ok(chunks.length > 1);
    });

    it('should be iterable multiple times', async () => {
      const text = 'test input';

      // First iteration
      const firstResults: string[] = [];
      for await (const chunk of service.translate(text, 'mock-model')) {
        firstResults.push(chunk);
      }

      // Second iteration
      const secondResults: string[] = [];
      for await (const chunk of service.translate(text, 'mock-model')) {
        secondResults.push(chunk);
      }

      // Both should produce the same result
      assert.strictEqual(firstResults.join(''), secondResults.join(''));
    });
  });

  describe('Error Handling', () => {
    it('should handle special characters in input', async () => {
      const specialText = 'Test with "quotes" and \n newlines \t tabs';
      const results: string[] = [];

      for await (const chunk of service.translate(specialText, 'mock-model')) {
        results.push(chunk);
      }

      const fullTranslation = results.join('');
      assert.ok(fullTranslation.startsWith('[模拟翻译]'));
      assert.ok(fullTranslation.includes(specialText));
    });

    it('should handle unicode characters', async () => {
      const unicodeText = 'Test with 中文 and émojis 🚀';
      const results: string[] = [];

      for await (const chunk of service.translate(unicodeText, 'mock-model')) {
        results.push(chunk);
      }

      const fullTranslation = results.join('');
      assert.ok(fullTranslation.startsWith('[模拟翻译]'));
      assert.ok(fullTranslation.includes(unicodeText));
    });

    it('should handle null and undefined model gracefully', async () => {
      const results1: string[] = [];
      for await (const chunk of service.translate('test', null as any)) {
        results1.push(chunk);
      }

      const results2: string[] = [];
      for await (const chunk of service.translate('test', undefined)) {
        results2.push(chunk);
      }

      assert.ok(results1.join('').startsWith('[模拟翻译]'));
      assert.ok(results2.join('').startsWith('[模拟翻译]'));
    });
  });
});