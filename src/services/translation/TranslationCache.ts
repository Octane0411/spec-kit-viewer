import * as vscode from 'vscode';
import { createHash } from 'crypto';
import { TranslationCacheEntry } from '../../types';

export class TranslationCache {
  private memento: vscode.Memento;
  private static readonly CACHE_KEY_PREFIX = 'translation_cache_';
  private static readonly MAX_CACHE_SIZE = 1000; // Maximum number of cached entries
  private static readonly CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

  constructor(memento: vscode.Memento) {
    this.memento = memento;
  }

  /**
   * Retrieves cached translation for the given text and model
   */
  async get(sourceText: string, model: string): Promise<string | null> {
    const key = this.generateKey(sourceText, model);
    const cacheKey = `${TranslationCache.CACHE_KEY_PREFIX}${key}`;

    try {
      const entry: TranslationCacheEntry | undefined = await this.memento.get(cacheKey);

      if (!entry) {
        return null;
      }

      // Check if entry is expired
      if (Date.now() - entry.timestamp > TranslationCache.CACHE_TTL) {
        await this.memento.update(cacheKey, undefined);
        return null;
      }

      return entry.translatedText;
    } catch (error) {
      const err = error as Error;
      console.error('Error retrieving from translation cache:', err.message);
      return null;
    }
  }

  /**
   * Stores translation result in cache
   */
  async set(sourceText: string, translatedText: string, model: string): Promise<void> {
    const key = this.generateKey(sourceText, model);
    const cacheKey = `${TranslationCache.CACHE_KEY_PREFIX}${key}`;

    const entry: TranslationCacheEntry = {
      key,
      sourceText,
      translatedText,
      model,
      timestamp: Date.now()
    };

    try {
      await this.memento.update(cacheKey, entry);
      await this.updateIndex(key);
      await this.cleanupOldEntries();
    } catch (error) {
      const err = error as Error;
      console.error('Error storing in translation cache:', err.message);
    }
  }

  /**
   * Checks if translation exists in cache
   */
  async has(sourceText: string, model: string): Promise<boolean> {
    const cached = await this.get(sourceText, model);
    return cached !== null;
  }

  /**
   * Clears all cached translations
   */
  async clear(): Promise<void> {
    try {
      const keys = await this.getAllCacheKeys();
      for (const key of keys) {
        await this.memento.update(key, undefined);
      }
    } catch (error) {
      const err = error as Error;
      console.error('Error clearing translation cache:', err.message);
    }
  }

  /**
   * Gets cache statistics
   */
  async getStats(): Promise<{ entryCount: number; totalSize: number }> {
    try {
      const keys = await this.getAllCacheKeys();
      let totalSize = 0;

      for (const key of keys) {
        const entry: TranslationCacheEntry | undefined = await this.memento.get(key);
        if (entry) {
          totalSize += entry.sourceText.length + entry.translatedText.length;
        }
      }

      return {
        entryCount: keys.length,
        totalSize
      };
    } catch (error) {
      const err = error as Error;
      console.error('Error getting cache stats:', err.message);
      return { entryCount: 0, totalSize: 0 };
    }
  }

  /**
   * Generates cache key from source text and model
   */
  private generateKey(sourceText: string, model: string): string {
    const content = `${sourceText}:${model}`;
    return createHash('sha256').update(content, 'utf8').digest('hex');
  }

  /**
   * Gets all cache keys from memento
   */
  private async getAllCacheKeys(): Promise<string[]> {
    // Note: VSCode Memento doesn't provide a way to list all keys
    // This is a limitation we'll have to work with
    // For now, we'll maintain a separate index of keys
    const indexKey = `${TranslationCache.CACHE_KEY_PREFIX}index`;
    const index: string[] = this.memento.get(indexKey, []);
    return index.map(key => `${TranslationCache.CACHE_KEY_PREFIX}${key}`);
  }

  /**
   * Updates the cache key index
   */
  private async updateIndex(key: string): Promise<void> {
    const indexKey = `${TranslationCache.CACHE_KEY_PREFIX}index`;
    const index: string[] = this.memento.get(indexKey, []);

    if (!index.includes(key)) {
      index.push(key);
      await this.memento.update(indexKey, index);
    }
  }

  /**
   * Cleans up old or excessive cache entries
   */
  private async cleanupOldEntries(): Promise<void> {
    try {
      const keys = await this.getAllCacheKeys();

      if (keys.length <= TranslationCache.MAX_CACHE_SIZE) {
        return;
      }

      // Get all entries with timestamps
      const entries: Array<{ key: string; timestamp: number }> = [];

      for (const key of keys) {
        const entry: TranslationCacheEntry | undefined = await this.memento.get(key);
        if (entry) {
          entries.push({ key, timestamp: entry.timestamp });
        }
      }

      // Sort by timestamp (oldest first)
      entries.sort((a, b) => a.timestamp - b.timestamp);

      // Remove oldest entries to get under the limit
      const entriesToRemove = entries.slice(0, entries.length - TranslationCache.MAX_CACHE_SIZE);

      for (const entry of entriesToRemove) {
        await this.memento.update(entry.key, undefined);
      }

      // Update index
      const remainingKeys = entries.slice(entriesToRemove.length).map(e => e.key.replace(TranslationCache.CACHE_KEY_PREFIX, ''));
      const indexKey = `${TranslationCache.CACHE_KEY_PREFIX}index`;
      await this.memento.update(indexKey, remainingKeys);
    } catch (error) {
      const err = error as Error;
      console.error('Error cleaning up cache:', err.message);
    }
  }
}