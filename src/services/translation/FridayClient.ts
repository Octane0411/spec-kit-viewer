import OpenAI from 'openai';
import * as vscode from 'vscode';
import * as crypto from 'crypto';
import { TranslationService } from './TranslationService';

/**
 * Real implementation of TranslationService using FRIDAY API via OpenAI SDK
 */
export class FridayClient implements TranslationService {
  private client: OpenAI | undefined;
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;

  constructor() {
    this.loadConfiguration();
    this.setupSSLBypass();
    this.initializeClient();
  }

  /**
   * Sets up SSL bypass if configured
   */
  private setupSSLBypass(): void {
    const config = vscode.workspace.getConfiguration('specKit.translation');
    const skipSslVerification = config.get('skipSslVerification', false);

    if (skipSslVerification) {
      console.log('🔓 Setting up SSL bypass for FridayClient');

      // Force disable SSL verification for this process
      process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

      // Override the global HTTPS agent
      const https = require('https');
      const originalAgent = https.globalAgent;

      https.globalAgent = new https.Agent({
        rejectUnauthorized: false,
        checkServerIdentity: () => undefined,
        secureProtocol: 'TLSv1_2_method'
      });

      console.log('🔓 SSL verification disabled globally');
    }
  }

  /**
   * Loads configuration from VSCode settings
   */
  private loadConfiguration(): void {
    const config = vscode.workspace.getConfiguration('specKit.translation');

    this.apiKey = config.get('apiKey', '');
    this.baseUrl = config.get('baseUrl', 'https://friday-api.example.com');
    this.defaultModel = config.get('model', 'LongCat-Flash-Chat-2512');
    const skipSslVerification = config.get('skipSslVerification', false);

    console.log('🔧 FRIDAY API Configuration:');
    console.log('  - Base URL:', this.baseUrl);
    console.log('  - Model:', this.defaultModel);
    console.log('  - API Key configured:', this.apiKey ? '✅ Yes' : '❌ No');
    console.log('  - Skip SSL Verification:', skipSslVerification ? '✅ Yes' : '❌ No');

    if (!this.apiKey) {
      console.warn('⚠️ FRIDAY API key not configured. Translation service will not work.');
    }
  }

  /**
   * Initializes the OpenAI client
   */
  private initializeClient(): void {
    if (this.apiKey && this.baseUrl) {
      const config = vscode.workspace.getConfiguration('specKit.translation');
      const skipSslVerification = config.get('skipSslVerification', false);

      console.log('🔧 SSL Configuration:', skipSslVerification ? 'Skip verification' : 'Verify certificates');

      // Set global SSL settings if needed
      if (skipSslVerification) {
        console.log('⚠️ Disabling SSL verification globally for this session');
        process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
      }

      const https = require('https');
      const agent = skipSslVerification ? new https.Agent({
        rejectUnauthorized: false,
        checkServerIdentity: () => undefined
      }) : undefined;

      this.client = new OpenAI({
        apiKey: this.apiKey,
        baseURL: this.baseUrl,
        timeout: 30000, // 30 seconds default timeout
        maxRetries: 2,
        httpAgent: agent,
        fetch: skipSslVerification ? async (url: string, init: any = {}) => {
          // Custom fetch with SSL disabled
          const httpsAgent = new https.Agent({
            rejectUnauthorized: false,
            checkServerIdentity: () => undefined
          });

          return fetch(url, {
            ...init,
            agent: httpsAgent
          });
        } : undefined
      });
    }
  }

  /**
   * Translates text using streaming API
   */
  async *translate(text: string, model?: string): AsyncIterable<string> {
    console.log('🔄 FridayClient.translate() called');
    console.log('  - Text length:', text.length);
    console.log('  - Model requested:', model);

    if (!this.isAvailable() || !this.client) {
      console.error('❌ FRIDAY API not available');
      throw new Error('FRIDAY API is not configured. Please set your API key in settings.');
    }

    const modelToUse = model || this.defaultModel;
    console.log('  - Using model:', modelToUse);

    try {
      console.log('🌐 Making API request to FRIDAY...');
      const stream = await this.client.chat.completions.create({
        model: modelToUse,
        messages: [
          {
            role: 'system',
            content: 'You are a professional translator. Translate the following English text to Chinese. Maintain the original formatting, structure, and markdown syntax. Only return the translated content without any additional comments or explanations.'
          },
          {
            role: 'user',
            content: text
          }
        ],
        stream: true,
        temperature: 0.3,
        max_tokens: 8000 // Increased for longer documents
      }, {
        headers: {
          'M-TraceId': crypto.randomUUID()
        },
        timeout: 120000 // 2 minutes for streaming
      });

      console.log('✅ API request successful, starting to process stream...');

      let chunkCount = 0;
      let totalContent = '';

      for await (const chunk of stream) {
        chunkCount++;
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          totalContent += content;
          console.log(`📦 Chunk ${chunkCount} (${content.length} chars):`, content.substring(0, 30) + '...');
          yield content;
        }

        // Check if stream ended
        if (chunk.choices[0]?.finish_reason) {
          console.log(`🏁 Stream ended with reason: ${chunk.choices[0].finish_reason}`);
          break;
        }
      }

      console.log(`🎉 Stream processing complete! Total chunks: ${chunkCount}, Total content: ${totalContent.length} chars`);

    } catch (error) {
      console.error('❌ Error calling FRIDAY API:', error);

      if (error instanceof OpenAI.APIError) {
        console.error('  - OpenAI API Error:', {
          status: error.status,
          code: error.code,
          message: error.message
        });

        if (error.status === 401) {
          throw new Error('Invalid API key. Please check your FRIDAY API configuration.');
        } else if (error.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        } else if (error.code === 'ECONNABORTED') {
          throw new Error('Translation request timed out. Please try again.');
        }
      }

      // Handle SSL certificate errors
      if (error.message && error.message.includes('unable to get issuer certificate')) {
        throw new Error('SSL certificate error. Try enabling "Skip SSL Verification" in settings or contact your network administrator.');
      }

      // Handle other network errors
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new Error(`Network error: Cannot connect to ${this.baseUrl}. Please check the URL and your network connection.`);
      }

      throw new Error(`Translation failed: ${error.message || error}`);
    }
  }

  /**
   * Checks if the service is available/configured
   */
  isAvailable(): boolean {
    return Boolean(this.apiKey && this.baseUrl && this.client);
  }

  /**
   * Gets the default model to use for translation
   */
  getDefaultModel(): string {
    return this.defaultModel;
  }

  /**
   * Tests the API connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      // Test with a simple translation
      const testIterator = this.translate('Hello', this.defaultModel);

      // Get the iterator and try to get the first value
      for await (const _ of testIterator) {
        // If we get any chunk, the connection works
        return true;
      }

      return false;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  /**
   * Updates configuration (useful when settings change)
   */
  updateConfiguration(): void {
    this.loadConfiguration();
    this.initializeClient();
  }
}