# Sample Specification Document

This is a test document for the Spec-Kit-Viewer extension translation feature.

## Overview

The Spec-Kit-Viewer extension provides real-time Chinese translation of English specification documents. This feature helps developers who prefer reading documentation in Chinese to understand requirements more quickly.

## Key Features

### Translation CodeLens
- Shows "🌏 Translate to Chinese" action at the beginning of documents
- Shows "🌏 Translate Section" action for major headings
- Provides instant access to translation functionality

### Streaming Translation
The extension supports streaming translation, which means:
1. Translation starts appearing immediately
2. Text is delivered in chunks for better user experience
3. Users don't have to wait for the entire document to be translated

### Caching System
To improve performance and reduce API calls:
- Translations are cached locally using VSCode's Memento API
- Cached translations appear instantly (under 200ms)
- Cache is automatically managed with size limits and TTL

## Technical Implementation

The extension uses the FRIDAY API for translation services. It supports:
- Multiple models (configurable)
- Streaming responses
- Error handling and retry logic
- Rate limiting compliance

## Usage Instructions

1. Open any Markdown file in VSCode
2. Look for the CodeLens actions at the top of the document
3. Click "🌏 Translate to Chinese" to translate the entire document
4. Or click "🌏 Translate Section" on any major heading
5. The translation will open in a side panel with streaming updates

## Configuration

To use the translation feature, configure your FRIDAY API settings:

```json
{
  "specKit.translation.apiKey": "your-api-key-here",
  "specKit.translation.baseUrl": "https://friday-api.example.com",
  "specKit.translation.model": "LongCat-Flash-Chat-2512"
}
```

## Testing

This document serves as a test case for the translation functionality. Try translating different sections to verify:
- CodeLens actions appear correctly
- Translation panel opens properly
- Streaming translation works as expected
- Caching behavior functions correctly