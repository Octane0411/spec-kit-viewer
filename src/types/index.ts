/**
 * Core data types for Spec-Kit-Viewer extension
 */

export interface SpecFile {
  /** Absolute path to the file (Unique ID) */
  path: string;
  /** Path relative to workspace root */
  relativePath: string;
  /** Raw file content */
  content: string;
  /** SHA-256 hash of content for change detection */
  hash: string;
  /** File type classification */
  type: 'spec' | 'plan' | 'tasks' | 'checklist' | 'other';
  /** List of outgoing references */
  dependencies: Dependency[];
}

export interface Dependency {
  /** Path of the file containing the link */
  sourcePath: string;
  /** Path of the referenced file */
  targetPath: string;
  /** Type of dependency */
  type: 'link' | 'import';
  /** Line number where the link appears */
  line: number;
}

export interface TranslationCacheEntry {
  /** Hash of the source text segment */
  key: string;
  /** Original English text */
  sourceText: string;
  /** Translated Chinese text */
  translatedText: string;
  /** Model used for translation */
  model: string;
  /** Unix timestamp of translation */
  timestamp: number;
}

// State management types

export interface GraphState {
  /** ReactFlow nodes (SpecFiles) */
  nodes: GraphNode[];
  /** ReactFlow edges (Dependencies) */
  edges: GraphEdge[];
  /** Currently selected node ID */
  selectedNode?: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'spec' | 'plan' | 'tasks' | 'checklist' | 'other';
  position?: { x: number; y: number };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
}

export interface ExtensionState {
  /** In-memory cache of parsed files */
  files: Map<string, SpecFile>;
  /** Whether a workspace scan is in progress */
  isScanning: boolean;
}

// Message protocol types for webview communication

export interface WebviewMessage {
  command: string;
  payload?: any;
}

export interface UpdateGraphMessage extends WebviewMessage {
  command: 'updateGraph';
  payload: {
    nodes: GraphNode[];
    edges: GraphEdge[];
  };
}

export interface UpdateTranslationMessage extends WebviewMessage {
  command: 'updateTranslation';
  payload: {
    text: string;
    isStreaming: boolean;
  };
}

export interface NodeSelectedMessage extends WebviewMessage {
  command: 'nodeSelected';
  payload: {
    path: string;
  };
}

export interface RequestTranslationMessage extends WebviewMessage {
  command: 'requestTranslation';
  payload: {
    path: string;
  };
}