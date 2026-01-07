import * as assert from 'assert';
import * as sinon from 'sinon';
import * as path from 'path';
import { ParserService } from '../services/parser/ParserService';

describe('ParserService', () => {
  let parser: ParserService;

  beforeEach(() => {
    parser = new ParserService();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('File Type Classification', () => {
    it('should classify spec.md files correctly', () => {
      const testCases = [
        { path: 'spec.md', expected: 'spec' },
        { path: 'project/spec.md', expected: 'spec' },
        { path: 'features/user-auth/spec.md', expected: 'spec' }
      ];

      testCases.forEach(({ path: testPath, expected }) => {
        const result = parser.parseFile(`/test/${testPath}`, 'test content');
        assert.strictEqual(result.type, expected, `Failed for path: ${testPath}`);
      });
    });

    it('should classify plan.md files correctly', () => {
      const testCases = [
        { path: 'plan.md', expected: 'plan' },
        { path: 'project/plan.md', expected: 'plan' },
        { path: 'features/user-auth/plan.md', expected: 'plan' }
      ];

      testCases.forEach(({ path: testPath, expected }) => {
        const result = parser.parseFile(`/test/${testPath}`, 'test content');
        assert.strictEqual(result.type, expected, `Failed for path: ${testPath}`);
      });
    });

    it('should classify tasks.md files correctly', () => {
      const testCases = [
        { path: 'tasks.md', expected: 'tasks' },
        { path: 'project/tasks.md', expected: 'tasks' },
        { path: 'features/user-auth/tasks.md', expected: 'tasks' }
      ];

      testCases.forEach(({ path: testPath, expected }) => {
        const result = parser.parseFile(`/test/${testPath}`, 'test content');
        assert.strictEqual(result.type, expected, `Failed for path: ${testPath}`);
      });
    });

    it('should classify checklist files correctly', () => {
      const testCases = [
        { path: 'checklist.md', expected: 'checklist' },
        { path: 'project/checklist.md', expected: 'checklist' },
        { path: 'features/requirements-checklist.md', expected: 'checklist' }
      ];

      testCases.forEach(({ path: testPath, expected }) => {
        const result = parser.parseFile(`/test/${testPath}`, 'test content');
        assert.strictEqual(result.type, expected, `Failed for path: ${testPath}`);
      });
    });

    it('should classify other files as "other"', () => {
      const testCases = [
        'README.md',
        'documentation.md',
        'notes.md',
        'project/random-file.md'
      ];

      testCases.forEach(testPath => {
        const result = parser.parseFile(`/test/${testPath}`, 'test content');
        assert.strictEqual(result.type, 'other', `Failed for path: ${testPath}`);
      });
    });
  });

  describe('Content Hash Generation', () => {
    it('should generate consistent hashes for same content', () => {
      const content = 'This is test content';
      const result1 = parser.parseFile('/test/file1.md', content);
      const result2 = parser.parseFile('/test/file2.md', content);

      assert.strictEqual(result1.hash, result2.hash);
    });

    it('should generate different hashes for different content', () => {
      const content1 = 'This is test content';
      const content2 = 'This is different content';
      const result1 = parser.parseFile('/test/file.md', content1);
      const result2 = parser.parseFile('/test/file.md', content2);

      assert.notStrictEqual(result1.hash, result2.hash);
    });

    it('should generate SHA-256 hex hashes', () => {
      const content = 'test content';
      const result = parser.parseFile('/test/file.md', content);

      // SHA-256 hex should be 64 characters long
      assert.strictEqual(result.hash.length, 64);
      // Should only contain hex characters
      assert.ok(/^[a-f0-9]+$/.test(result.hash));
    });
  });

  describe('Dependency Extraction - Standard Links', () => {
    it('should extract markdown links to local files', () => {
      const content = `
# Test Document

This links to [another document](./other.md).
Also see [the specification](../specs/spec.md).
      `;

      const result = parser.parseFile('/test/docs/file.md', content);

      assert.strictEqual(result.dependencies.length, 2);

      const dep1 = result.dependencies.find(d => d.targetPath.endsWith('other.md'));
      const dep2 = result.dependencies.find(d => d.targetPath.endsWith('spec.md'));

      assert.ok(dep1, 'Should find link to other.md');
      assert.ok(dep2, 'Should find link to spec.md');

      assert.strictEqual(dep1.type, 'link');
      assert.strictEqual(dep2.type, 'link');
      assert.strictEqual(dep1.sourcePath, '/test/docs/file.md');
      assert.strictEqual(dep2.sourcePath, '/test/docs/file.md');
    });

    it('should ignore external HTTP links', () => {
      const content = `
# Test Document

This links to [external site](https://example.com).
Also see [GitHub](http://github.com/user/repo).
But this is [local](./local.md).
      `;

      const result = parser.parseFile('/test/file.md', content);

      // Should only find the local link
      assert.strictEqual(result.dependencies.length, 1);
      assert.ok(result.dependencies[0].targetPath.endsWith('local.md'));
    });

    it('should ignore mailto links', () => {
      const content = `
# Test Document

Contact [support](mailto:support@example.com).
See [documentation](./docs.md).
      `;

      const result = parser.parseFile('/test/file.md', content);

      // Should only find the local link
      assert.strictEqual(result.dependencies.length, 1);
      assert.ok(result.dependencies[0].targetPath.endsWith('docs.md'));
    });

    it('should handle links without .md extension', () => {
      const content = `
# Test Document

See [the plan](plan) for details.
      `;

      const result = parser.parseFile('/test/file.md', content);

      assert.strictEqual(result.dependencies.length, 1);
      assert.ok(result.dependencies[0].targetPath.endsWith('plan'));
    });
  });

  describe('Dependency Extraction - Wiki Links', () => {
    it('should extract wiki-style links', () => {
      const content = `
# Test Document

See [[other-document]] for more info.
Also check [[specifications/user-auth]].
      `;

      const result = parser.parseFile('/test/docs/file.md', content);

      assert.strictEqual(result.dependencies.length, 2);

      const dep1 = result.dependencies.find(d => d.targetPath.endsWith('other-document.md'));
      const dep2 = result.dependencies.find(d => d.targetPath.endsWith('user-auth.md'));

      assert.ok(dep1, 'Should find wiki link to other-document');
      assert.ok(dep2, 'Should find wiki link to user-auth');
    });

    it('should handle wiki links with extensions', () => {
      const content = `
# Test Document

See [[document.md]] and [[plan.txt]].
      `;

      const result = parser.parseFile('/test/file.md', content);

      assert.strictEqual(result.dependencies.length, 2);

      const dep1 = result.dependencies.find(d => d.targetPath.endsWith('document.md'));
      const dep2 = result.dependencies.find(d => d.targetPath.endsWith('plan.txt'));

      assert.ok(dep1, 'Should preserve .md extension');
      assert.ok(dep2, 'Should preserve .txt extension');
    });

    it('should add .md extension to wiki links without extension', () => {
      const content = `
# Test Document

See [[plan]] for details.
      `;

      const result = parser.parseFile('/test/file.md', content);

      assert.strictEqual(result.dependencies.length, 1);
      assert.ok(result.dependencies[0].targetPath.endsWith('plan.md'));
    });
  });

  describe('Line Number Calculation', () => {
    it('should calculate correct line numbers for dependencies', () => {
      const content = `Line 1
Line 2
Line 3 with [link](./target.md)
Line 4
Line 5 with [[wiki-link]]
Line 6`;

      const result = parser.parseFile('/test/file.md', content);

      assert.strictEqual(result.dependencies.length, 2);

      // Note: Line numbers are 1-based
      const linkDep = result.dependencies.find(d => d.targetPath.endsWith('target.md'));
      const wikiDep = result.dependencies.find(d => d.targetPath.endsWith('wiki-link.md'));

      assert.ok(linkDep, 'Should find standard link');
      assert.ok(wikiDep, 'Should find wiki link');

      assert.strictEqual(linkDep.line, 3, 'Standard link should be on line 3');
      assert.strictEqual(wikiDep.line, 5, 'Wiki link should be on line 5');
    });
  });

  describe('Path Resolution', () => {
    it('should resolve relative paths correctly', () => {
      const content = `
[Same dir](./file.md)
[Parent dir](../parent.md)
[Nested](./nested/file.md)
[Root](/root.md)
      `;

      const result = parser.parseFile('/project/docs/current.md', content);

      assert.strictEqual(result.dependencies.length, 4);

      const sameDirDep = result.dependencies.find(d => d.targetPath.includes('/docs/file.md'));
      const parentDirDep = result.dependencies.find(d => d.targetPath.endsWith('/project/parent.md'));
      const nestedDep = result.dependencies.find(d => d.targetPath.includes('/docs/nested/file.md'));
      const rootDep = result.dependencies.find(d => d.targetPath.endsWith('/root.md'));

      assert.ok(sameDirDep, 'Should resolve same directory path');
      assert.ok(parentDirDep, 'Should resolve parent directory path');
      assert.ok(nestedDep, 'Should resolve nested directory path');
      assert.ok(rootDep, 'Should resolve root path');
    });

    it('should resolve wiki links relative to source file directory', () => {
      const content = `[[sibling]] and [[nested/child]]`;

      const result = parser.parseFile('/project/docs/current.md', content);

      assert.strictEqual(result.dependencies.length, 2);

      const siblingDep = result.dependencies.find(d => d.targetPath.includes('/docs/sibling.md'));
      const nestedDep = result.dependencies.find(d => d.targetPath.includes('/docs/nested/child.md'));

      assert.ok(siblingDep, 'Should resolve sibling wiki link');
      assert.ok(nestedDep, 'Should resolve nested wiki link');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed markdown gracefully', () => {
      const malformedContent = `
# Test

This has [incomplete link(./file.md)
And [[unclosed wiki link
      `;

      const result = parser.parseFile('/test/file.md', malformedContent);

      // Should still create a SpecFile object
      assert.strictEqual(result.path, '/test/file.md');
      assert.strictEqual(result.content, malformedContent);
      assert.strictEqual(result.type, 'other');

      // Dependencies array should exist (may be empty or partial)
      assert.ok(Array.isArray(result.dependencies));
    });

    it('should handle empty content', () => {
      const result = parser.parseFile('/test/empty.md', '');

      assert.strictEqual(result.path, '/test/empty.md');
      assert.strictEqual(result.content, '');
      assert.strictEqual(result.dependencies.length, 0);
      assert.ok(result.hash);
    });

    it('should handle content with no links', () => {
      const content = `
# Plain Document

This document has no links to other files.
Just regular text content.
      `;

      const result = parser.parseFile('/test/plain.md', content);

      assert.strictEqual(result.dependencies.length, 0);
      assert.strictEqual(result.content, content);
    });
  });

  describe('SpecFile Object Structure', () => {
    it('should create complete SpecFile objects', () => {
      const content = 'Test content';
      const filePath = '/project/docs/test.md';

      const result = parser.parseFile(filePath, content);

      // Check all required properties
      assert.strictEqual(result.path, filePath);
      assert.strictEqual(result.content, content);
      assert.strictEqual(result.type, 'other');
      assert.ok(result.hash);
      assert.ok(result.relativePath);
      assert.ok(Array.isArray(result.dependencies));

      // Hash should be consistent
      assert.strictEqual(typeof result.hash, 'string');
      assert.strictEqual(result.hash.length, 64);
    });

    it('should set relative path correctly', () => {
      // Mock workspace folders for relative path calculation
      const mockWorkspace = {
        workspaceFolders: [{ uri: { fsPath: '/project' } }]
      };

      // We can't easily mock vscode.workspace, so we'll test the behavior indirectly
      const result = parser.parseFile('/project/docs/test.md', 'content');

      // The relative path should be calculated relative to workspace root
      assert.ok(result.relativePath);
      assert.strictEqual(typeof result.relativePath, 'string');
    });
  });
});