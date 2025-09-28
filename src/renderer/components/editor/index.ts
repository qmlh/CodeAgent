/**
 * Enhanced Editor Components Export
 * Exports all enhanced Monaco editor components for task 17
 */

export { EnhancedMonacoEditor } from './EnhancedMonacoEditor';
export type { EnhancedMonacoEditorRef } from './EnhancedMonacoEditor';

export { EnhancedTabManager } from './EnhancedTabManager';
export { SplitScreenEditor } from './SplitScreenEditor';
export { CollaborationVisualization } from './CollaborationVisualization';
export { EditorPersonalization } from './EditorPersonalization';

export { EditorArea } from './EditorArea';
export { CodeEditor } from './CodeEditor';
export type { CodeEditorRef } from './CodeEditor';

// Re-export for backward compatibility
export { EditorArea as default } from './EditorArea';