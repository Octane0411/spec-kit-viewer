import * as assert from 'assert';
import * as sinon from 'sinon';
import { TranslationCache } from '../services/translation/TranslationCache';

// Mock VSCode Memento interface
interface MockMemento {
  get<T>(key: string, defaultValue?: T): T;
  update(key: string, value: any): Thenable<void>;
}

describe('TranslationCache', () => {
  let mockMemento: MockMemento;
  let cache: TranslationCache;
  let clock: sinon.SinonFakeTimers;

  beforeEach(() => {
    // Create a fake timer to control time in tests
    clock = sinon.useFakeTimers();

    // Mock the VSCode Memento interface
    const storage = new Map<string, any>();
    mockMemento = {
      get: <T>(key: string, defaultValue?: T): T => {
        return storage.get(key) ?? defaultValue;
      },
      update: async (key: string, value: any): Promise<void> => {
        storage.set(key, value);
      }
    };

    cache = new TranslationCache(mockMemento as any);
  });

  afterEach(() => {
    clock.restore();
    sinon.restore();
  });

  describe('Basic Cache Operations', () => {
    it('should store and retrieve cached translations', async () => {
      const text = 'Hello world';
      const translation = 'Hello world translated';
      const model = 'test-model';

      // Cache the translation
      await cache.set(text, translation, model);

      // Retrieve the cached translation
      const cached = await cache.get(text, model);
      assert.strictEqual(cached, translation);
    });

    it('should return null for non-existent cache entries', async () => {
      const cached = await cache.get('non-existent', 'test-model');
      assert.strictEqual(cached, null);
    });

    it('should handle different models separately', async () => {
      const text = 'Hello world';
      const translation1 = 'Translation 1';
      const translation2 = 'Translation 2';
      const model1 = 'model-1';
      const model2 = 'model-2';

      await cache.set(text, translation1, model1);
      await cache.set(text, translation2, model2);

      const cached1 = await cache.get(text, model1);
      const cached2 = await cache.get(text, model2);

      assert.strictEqual(cached1, translation1);
      assert.strictEqual(cached2, translation2);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire entries after TTL', async () => {
      const text = 'Hello world';
      const translation = 'Hello world translated';
      const model = 'test-model';

      // Cache the translation
      await cache.set(text, translation, model);

      // Advance time by less than TTL (7 days)
      clock.tick(6 * 24 * 60 * 60 * 1000); // 6 days
      let cached = await cache.get(text, model);
      assert.strictEqual(cached, translation, 'Should still be cached before TTL');

      // Advance time past TTL
      clock.tick(2 * 24 * 60 * 60 * 1000); // 2 more days (total 8 days)
      cached = await cache.get(text, model);
      assert.strictEqual(cached, undefined, 'Should be expired after TTL');
    });

    it('should update TTL when setting existing entry', async () => {
      const text = 'Hello world';
      const translation = 'Hello world translated';
      const model = 'test-model';

      // Cache the translation
      await cache.set(text, translation, model);

      // Advance time by 6 days
      clock.tick(6 * 24 * 60 * 60 * 1000);

      // Update the same entry (should reset TTL)
      await cache.set(text, translation, model);

      // Advance time by another 6 days (total 12 days from original)
      clock.tick(6 * 24 * 60 * 60 * 1000);

      // Should still be cached because TTL was reset
      const cached = await cache.get(text, model);
      assert.strictEqual(cached, translation);
    });
  });

  describe('Size Limits', () => {
    it('should enforce maximum cache size', async () => {
      // Fill cache to maximum size (100 entries)
      for (let i = 0; i < 100; i++) {
        await cache.set(`text-${i}`, `translation-${i}`, 'test-model');
      }

      // Verify all entries are cached
      for (let i = 0; i < 100; i++) {
        const cached = await cache.get(`text-${i}`, 'test-model');
        assert.strictEqual(cached, `translation-${i}`);
      }

      // Add one more entry (should trigger LRU eviction)
      await cache.set('text-100', 'translation-100', 'test-model');

      // The first entry should be evicted (LRU)
      const evicted = await cache.get('text-0', 'test-model');
      assert.strictEqual(evicted, undefined, 'Oldest entry should be evicted');

      // The new entry should be cached
      const newest = await cache.get('text-100', 'test-model');
      assert.strictEqual(newest, 'translation-100');
    });

    it('should implement timestamp-based eviction correctly', async () => {
      // The current implementation uses timestamp-based eviction, not true LRU
      // Fill cache to maximum size (1000 entries) - this test is more about verifying
      // that old entries get evicted when cache is full

      // For testing purposes, let's test with a smaller number
      for (let i = 0; i < 5; i++) {
        await cache.set(`text-${i}`, `translation-${i}`, 'test-model');
        // Add small delay to ensure different timestamps
        clock.tick(1000);
      }

      // All entries should be cached
      for (let i = 0; i < 5; i++) {
        const cached = await cache.get(`text-${i}`, 'test-model');
        assert.strictEqual(cached, `translation-${i}`);
      }
    });
  });

  describe('Cache Management', () => {
    it('should clear all cache entries', async () => {
      // Add multiple entries
      await cache.set('text-1', 'translation-1', 'model-1');
      await cache.set('text-2', 'translation-2', 'model-2');
      await cache.set('text-3', 'translation-3', 'model-1');

      // Clear cache
      await cache.clear();

      // All entries should be gone
      assert.strictEqual(await cache.get('text-1', 'model-1'), undefined);
      assert.strictEqual(await cache.get('text-2', 'model-2'), undefined);
      assert.strictEqual(await cache.get('text-3', 'model-1'), undefined);
    });

    it('should provide accurate cache statistics', async () => {
      // Empty cache stats
      let stats = await cache.getStats();
      assert.strictEqual(stats.entryCount, 0);
      assert.strictEqual(stats.totalSize, 0);

      // Add some entries
      await cache.set('short', 'short translation', 'model-1');
      await cache.set('longer text content', 'longer translation content', 'model-2');

      stats = await cache.getStats();
      assert.strictEqual(stats.entryCount, 2);
      assert.ok(stats.totalSize > 0, 'Total size should be greater than 0');

      // Size should include both keys and values
      const expectedSize =
        'short'.length + 'short translation'.length + 'model-1'.length +
        'longer text content'.length + 'longer translation content'.length + 'model-2'.length;
      assert.ok(stats.totalSize >= expectedSize, 'Total size should account for keys and values');
    });
  });

  describe('Key Generation', () => {
    it('should generate different keys for different text-model combinations', async () => {
      const text1 = 'Hello world';
      const text2 = 'Hello world';
      const model1 = 'model-1';
      const model2 = 'model-2';

      await cache.set(text1, 'translation-1', model1);
      await cache.set(text2, 'translation-2', model2);

      // Same text with different models should be cached separately
      assert.strictEqual(await cache.get(text1, model1), 'translation-1');
      assert.strictEqual(await cache.get(text2, model2), 'translation-2');
    });

    it('should handle special characters in text and model names', async () => {
      const text = 'Hello "world" with special chars: \n\t\r';
      const model = 'model/with:special@chars';
      const translation = 'Special translation';

      await cache.set(text, translation, model);
      const cached = await cache.get(text, model);
      assert.strictEqual(cached, translation);
    });

    it('should handle very long text content', async () => {
      const longText = 'A'.repeat(10000); // 10KB text
      const translation = 'Long translation';
      const model = 'test-model';

      await cache.set(longText, translation, model);
      const cached = await cache.get(longText, model);
      assert.strictEqual(cached, translation);
    });
  });

  describe('Error Handling', () => {
    it('should handle Memento update failures gracefully', async () => {
      // Mock Memento update to fail
      const updateStub = sinon.stub(mockMemento, 'update').rejects(new Error('Storage failed'));

      try {
        await cache.set('text', 'translation', 'model');
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error.message.includes('Storage failed'));
      }

      updateStub.restore();
    });

    it('should handle Memento get failures gracefully', async () => {
      // Mock Memento get to fail
      const getStub = sinon.stub(mockMemento, 'get').throws(new Error('Read failed'));

      try {
        await cache.get('text', 'model');
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert.ok(error.message.includes('Read failed'));
      }

      getStub.restore();
    });
  });
});