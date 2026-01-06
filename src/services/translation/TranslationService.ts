/**
 * Translation service interface and base implementation
 */

export interface TranslationService {
  /**
   * Translates text from English to Chinese using streaming API
   * @param text English text to translate
   * @param model Model identifier (e.g., "LongCat-Flash-Chat-2512")
   * @returns AsyncIterable stream of translated text chunks
   */
  translate(text: string, model: string): AsyncIterable<string>;

  /**
   * Checks if the service is available/configured
   */
  isAvailable(): boolean;

  /**
   * Gets the default model to use for translation
   */
  getDefaultModel(): string;
}

/**
 * Base implementation with stub functionality
 * Real implementation will be in FridayClient.ts
 */
export class BaseTranslationService implements TranslationService {

  async *translate(text: string, model: string): AsyncIterable<string> {
    // Stub implementation - yields mock translation
    const mockTranslation = `[模拟翻译] ${text}`;

    // Simulate streaming by yielding chunks
    const chunks = this.splitIntoChunks(mockTranslation, 20);

    for (const chunk of chunks) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 100));
      yield chunk;
    }
  }

  isAvailable(): boolean {
    // For stub implementation, always return true
    return true;
  }

  getDefaultModel(): string {
    return 'mock-model';
  }

  /**
   * Splits text into chunks for simulating streaming
   */
  private splitIntoChunks(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];

    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }

    return chunks;
  }
}

/**
 * Factory function to create the appropriate translation service
 */
export function createTranslationService(): TranslationService {
  console.log('🏭 Creating translation service...');

  // Try to import FridayClient dynamically to avoid circular dependencies
  try {
    const { FridayClient } = require('./FridayClient');
    const fridayClient = new FridayClient();

    console.log('📡 FridayClient created, checking availability...');

    // Use FridayClient if it's properly configured, otherwise fall back to base implementation
    if (fridayClient.isAvailable()) {
      console.log('✅ Using FridayClient (real API)');
      return fridayClient;
    } else {
      console.log('❌ FridayClient not available, using mock service');
    }
  } catch (error) {
    console.warn('❌ Failed to load FridayClient, using base implementation:', error);
  }

  console.log('🎭 Using BaseTranslationService (mock)');
  return new BaseTranslationService();
}