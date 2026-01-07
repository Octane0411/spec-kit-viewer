import * as vscode from 'vscode';
import * as path from 'path';
import { createHash } from 'crypto';
// Use dynamic import for ESM modules to avoid CommonJS compatibility issues
// import { unified } from 'unified';
// import remarkParse from 'remark-parse';
// Note: visit function will be implemented manually since unist-util-visit may not be available
import { SpecFile, Dependency } from '../../types';

export class ParserService {

  /**
   * Scans and parses all relevant Markdown files in the workspace
   */
  async parseWorkspace(rootPath: string): Promise<SpecFile[]> {
    const files: SpecFile[] = [];

    // Find all markdown files in the workspace
    const pattern = new vscode.RelativePattern(rootPath, '**/*.md');
    const fileUris = await vscode.workspace.findFiles(pattern, '**/node_modules/**');

    for (const fileUri of fileUris) {
      try {
        const document = await vscode.workspace.openTextDocument(fileUri);
        const content = document.getText();
        const specFile = this.parseFile(fileUri.fsPath, content);
        files.push(specFile);
      } catch (error) {
        console.error(`Error parsing file ${fileUri.fsPath}:`, error);
      }
    }

    return files;
  }

  /**
   * Parses a single file to extract dependencies
   */
  parseFile(filePath: string, content: string): SpecFile {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
    const relativePath = path.relative(workspaceRoot, filePath);
    const hash = this.generateHash(content);
    const type = this.classifyFileType(relativePath);
    const dependencies = this.extractDependencies(filePath, content);

    return {
      path: filePath,
      relativePath,
      content,
      hash,
      type,
      dependencies
    };
  }

  /**
   * Extracts dependencies (links) from markdown content
   */
  private extractDependencies(sourcePath: string, content: string): Dependency[] {
    const dependencies: Dependency[] = [];

    try {
      // TODO: Re-enable unified parsing after fixing ESM compatibility
      // For now, use regex-based parsing as fallback

      // Parse standard markdown links [text](url)
      const linkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
      let match;
      while ((match = linkRegex.exec(content)) !== null) {
        const url = match[2];
        if (this.isLocalMarkdownFile(url)) {
          const targetPath = this.resolveRelativePath(sourcePath, url);
          const lineNumber = this.findLineNumber(content, match.index);

          dependencies.push({
            sourcePath,
            targetPath,
            type: 'link',
            line: lineNumber
          });
        }
      }

      // Also check for wiki-style links [[filename]]
      const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
      let wikiMatch;
      while ((wikiMatch = wikiLinkRegex.exec(content)) !== null) {
        const linkText = wikiMatch[1];
        const targetPath = this.resolveWikiLink(sourcePath, linkText);
        const lineNumber = this.findLineNumber(content, wikiMatch.index);

        dependencies.push({
          sourcePath,
          targetPath,
          type: 'link',
          line: lineNumber
        });
      }
    } catch (error) {
      console.error(`Error extracting dependencies from ${sourcePath}:`, error);
    }

    return dependencies;
  }

  // Note: visitNode method removed as we're using regex parsing instead of AST
  // TODO: Re-implement with proper AST parsing when ESM compatibility is resolved

  /**
   * Classifies file type based on path and content
   */
  private classifyFileType(relativePath: string): SpecFile['type'] {
    const filename = path.basename(relativePath).toLowerCase();

    if (filename === 'spec.md' || relativePath.includes('/spec.md')) {
      return 'spec';
    }
    if (filename === 'plan.md' || relativePath.includes('/plan.md')) {
      return 'plan';
    }
    if (filename === 'tasks.md' || relativePath.includes('/tasks.md')) {
      return 'tasks';
    }
    if (filename.includes('checklist') || relativePath.includes('/checklist')) {
      return 'checklist';
    }

    return 'other';
  }

  /**
   * Generates SHA-256 hash of content for change detection
   */
  private generateHash(content: string): string {
    return createHash('sha256').update(content, 'utf8').digest('hex');
  }

  /**
   * Checks if URL points to a local markdown file
   */
  private isLocalMarkdownFile(url: string): boolean {
    return !url.startsWith('http') &&
           !url.startsWith('mailto:') &&
           (url.endsWith('.md') || !url.includes('.'));
  }

  /**
   * Resolves relative path to absolute path
   */
  private resolveRelativePath(sourcePath: string, relativePath: string): string {
    const sourceDir = path.dirname(sourcePath);
    return path.resolve(sourceDir, relativePath);
  }

  /**
   * Resolves wiki-style links to file paths
   */
  private resolveWikiLink(sourcePath: string, linkText: string): string {
    const sourceDir = path.dirname(sourcePath);

    // If linkText doesn't have extension, assume .md
    const filename = linkText.includes('.') ? linkText : `${linkText}.md`;

    return path.resolve(sourceDir, filename);
  }

  /**
   * Finds line number for a given character offset
   */
  private findLineNumber(content: string, offset: number): number {
    const lines = content.substring(0, offset).split('\n');
    return lines.length;
  }
}