import * as assert from 'assert';
import * as sinon from 'sinon';
import './testSetup';
import { mockMemento } from './testSetup';
import { TranslationCache } from '../services/translation/TranslationCache';

describe('TranslationCache', () => {
  let cache: TranslationCache;

  beforeEach(() => {
    // Reset mock memento storage
    sinon.resetHistory();

    // Create fresh cache instance
    cache = new TranslationCache(mockMemento);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Basic Operations', () => {
    it('should store and retrieve translations', async () => {
      const text = 'Hello world';
      const translation = 'Hola mundo';
      const model = 'test-model';

      await cache.set(text, translation, model);
      const cached = await cache.get(text, model);

      assert.strictEqual(cached, translation);
    });

    it('should return null for non-existent entries', async () => {
      const cached = await cache.get('non-existent', 'model');
      assert.strictEqual(cached, null);
    });

    it('should handle different models separately', async () => {
      const text = 'Hello';
      const translation1 = 'Hola';
      const translation2 = 'Bonjour';
      const model1 = 'spanish-model';
      const model2 = 'french-model';

      await cache.set(text, translation1, model1);
      await cache.set(text, translation2, model2);

      const cached1 = await cache.get(text, model1);
      const cached2 = await cache.get(text, model2);

      assert.strictEqual(cached1, translation1);
      assert.strictEqual(cached2, translation2);
    });
  });

  describe('Cache Management', () => {
    it('should clear all cache entries', async () => {
      await cache.set('text1', 'translation1', 'model1');
      await cache.set('text2', 'translation2', 'model2');

      await cache.clear();

      const cached1 = await cache.get('text1', 'model1');
      const cached2 = await cache.get('text2', 'model2');

      assert.strictEqual(cached1, null);
      assert.strictEqual(cached2, null);
    });

    it('should provide cache statistics', async () => {
      await cache.set('text1', 'translation1', 'model1');
      await cache.set('text2', 'translation2', 'model2');

      const stats = await cache.getStats();
      assert.ok(typeof stats === 'object');
      assert.ok(typeof stats.totalSize === 'number');
      assert.ok(stats.totalSize >= 0);
    });
  });
});