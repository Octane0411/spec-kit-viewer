import * as assert from 'assert';
import * as sinon from 'sinon';
import './testSetup'; // Import test setup first
import { createTranslationService, BaseTranslationService } from '../services/translation/TranslationService';

describe('TranslationService Factory', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('Service Creation', () => {
    it('should return a service that implements TranslationService interface', () => {
      const service = createTranslationService();

      // Check interface methods exist
      assert.ok(typeof service.translate === 'function');
      assert.ok(typeof service.isAvailable === 'function');
      assert.ok(typeof service.getDefaultModel === 'function');
    });
  });
});

describe('BaseTranslationService', () => {
  let service: BaseTranslationService;

  beforeEach(() => {
    service = new BaseTranslationService();
  });

  describe('Availability', () => {
    it('should report as not available', () => {
      assert.strictEqual(service.isAvailable(), false);
    });

    it('should return default model name', () => {
      const model = service.getDefaultModel();
      assert.ok(typeof model === 'string');
      assert.ok(model.length > 0);
    });
  });

  describe('Model Configuration', () => {
    it('should provide a default model name', () => {
      const model = service.getDefaultModel();
      assert.ok(typeof model === 'string');
      assert.ok(model.length > 0);
    });
  });

  describe('Translation', () => {
    it('should yield mock translation chunks', async () => {
      const testText = 'Hello world';
      const chunks: string[] = [];

      for await (const chunk of service.translate(testText, 'test-model')) {
        chunks.push(chunk);
      }

      assert.ok(chunks.length > 0, 'Should yield at least one chunk');
      assert.ok(chunks.join('').includes('模拟翻译'), 'Should contain mock translation');
    });

    it('should handle empty input', async () => {
      const chunks: string[] = [];

      for await (const chunk of service.translate('', 'test-model')) {
        chunks.push(chunk);
      }

      assert.ok(chunks.length > 0, 'Should yield chunks even for empty input');
    });
  });

  describe('Streaming Behavior', () => {
    it('should simulate streaming with delays', async () => {
      const testText = 'Test streaming behavior';
      const chunks: string[] = [];
      const startTime = Date.now();

      for await (const chunk of service.translate(testText, 'test-model')) {
        chunks.push(chunk);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      assert.ok(duration > 0, 'Should take some time to simulate streaming');
      assert.ok(chunks.length > 0, 'Should produce chunks');
    });
  });
});