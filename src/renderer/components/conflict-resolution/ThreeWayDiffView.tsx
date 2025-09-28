/**
 * Three-Way Diff View Component
 * Displays local, remote, and merged versions with syntax highlighting
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Typography, Spin } from 'antd';
import * as monaco from 'monaco-editor';
import { DiffLine, DiffSection } from '../../types/conflict';
import './ThreeWayDiffView.css';

const { Text } = Typography;

interface ThreeWayDiffViewProps {
  localContent: string;
  remoteContent: string;
  mergedContent: string;
  baseContent?: string;
  filePath: string;
  viewMode: 'side-by-side' | 'unified' | 'three-way';
  showLineNumbers: boolean;
  showWhitespace: boolean;
  syntaxHighlighting: boolean;
  onMergedContentChange: (content: string) => void;
}

export const ThreeWayDiffView: React.FC<ThreeWayDiffViewProps> = ({
  localContent,
  remoteContent,
  mergedContent,
  baseContent,
  filePath,
  viewMode,
  showLineNumbers,
  showWhitespace,
  syntaxHighlighting,
  onMergedContentChange
}) => {
  const localEditorRef = useRef<HTMLDivElement>(null);
  const remoteEditorRef = useRef<HTMLDivElement>(null);
  const mergedEditorRef = useRef<HTMLDivElement>(null);
  
  const [localEditor, setLocalEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [remoteEditor, setRemoteEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [mergedEditor, setMergedEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [diffSections, setDiffSections] = useState<DiffSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get language from file extension
  const getLanguage = useCallback((filePath: string): string => {
    const extension = filePath.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'less': 'less',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'sql': 'sql',
      'sh': 'shell',
      'bash': 'shell'
    };
    return languageMap[extension || ''] || 'plaintext';
  }, []);

  // Initialize editors
  useEffect(() => {
    if (!localEditorRef.current || !remoteEditorRef.current || !mergedEditorRef.current) {
      return;
    }

    const language = syntaxHighlighting ? getLanguage(filePath) : 'plaintext';
    
    const commonOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
      theme: 'vs-dark',
      fontSize: 14,
      lineNumbers: showLineNumbers ? 'on' : 'off',
      renderWhitespace: showWhitespace ? 'all' : 'none',
      readOnly: false,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      automaticLayout: true
    };

    // Create local editor (read-only)
    const localEd = monaco.editor.create(localEditorRef.current, {
      ...commonOptions,
      value: localContent,
      language,
      readOnly: true
    });

    // Create remote editor (read-only)
    const remoteEd = monaco.editor.create(remoteEditorRef.current, {
      ...commonOptions,
      value: remoteContent,
      language,
      readOnly: true
    });

    // Create merged editor (editable)
    const mergedEd = monaco.editor.create(mergedEditorRef.current, {
      ...commonOptions,
      value: mergedContent,
      language,
      readOnly: false
    });

    // Set up content change listener for merged editor
    const disposable = mergedEd.onDidChangeModelContent(() => {
      const content = mergedEd.getValue();
      onMergedContentChange(content);
    });

    setLocalEditor(localEd);
    setRemoteEditor(remoteEd);
    setMergedEditor(mergedEd);
    setIsLoading(false);

    return () => {
      disposable.dispose();
      localEd.dispose();
      remoteEd.dispose();
      mergedEd.dispose();
    };
  }, [filePath, syntaxHighlighting, getLanguage]);

  // Update editor options when props change
  useEffect(() => {
    if (!localEditor || !remoteEditor || !mergedEditor) return;

    const options = {
      lineNumbers: showLineNumbers ? 'on' as const : 'off' as const,
      renderWhitespace: showWhitespace ? 'all' as const : 'none' as const
    };

    localEditor.updateOptions(options);
    remoteEditor.updateOptions(options);
    mergedEditor.updateOptions(options);
  }, [localEditor, remoteEditor, mergedEditor, showLineNumbers, showWhitespace]);

  // Update editor content when props change
  useEffect(() => {
    if (localEditor && localEditor.getValue() !== localContent) {
      localEditor.setValue(localContent);
    }
  }, [localEditor, localContent]);

  useEffect(() => {
    if (remoteEditor && remoteEditor.getValue() !== remoteContent) {
      remoteEditor.setValue(remoteContent);
    }
  }, [remoteEditor, remoteContent]);

  useEffect(() => {
    if (mergedEditor && mergedEditor.getValue() !== mergedContent) {
      const position = mergedEditor.getPosition();
      mergedEditor.setValue(mergedContent);
      if (position) {
        mergedEditor.setPosition(position);
      }
    }
  }, [mergedEditor, mergedContent]);

  // Compute diff sections
  useEffect(() => {
    const computeDiffSections = () => {
      // This is a simplified diff computation
      // In a real implementation, you'd use a proper diff algorithm
      const localLines = localContent.split('\n');
      const remoteLines = remoteContent.split('\n');
      const mergedLines = mergedContent.split('\n');
      
      const sections: DiffSection[] = [];
      const maxLines = Math.max(localLines.length, remoteLines.length, mergedLines.length);
      
      for (let i = 0; i < maxLines; i++) {
        const localLine = localLines[i] || '';
        const remoteLine = remoteLines[i] || '';
        const mergedLine = mergedLines[i] || '';
        
        let sectionType: 'conflict' | 'change' | 'unchanged' = 'unchanged';
        
        if (localLine !== remoteLine) {
          sectionType = 'conflict';
        } else if (localLine !== mergedLine) {
          sectionType = 'change';
        }
        
        sections.push({
          id: `section-${i}`,
          type: sectionType,
          localLines: [{
            lineNumber: i + 1,
            type: localLine !== remoteLine ? 'modified' : 'unchanged',
            content: localLine
          }],
          remoteLines: [{
            lineNumber: i + 1,
            type: localLine !== remoteLine ? 'modified' : 'unchanged',
            content: remoteLine
          }],
          mergedLines: [{
            lineNumber: i + 1,
            type: mergedLine !== localLine ? 'modified' : 'unchanged',
            content: mergedLine
          }],
          isResolved: sectionType !== 'conflict' || mergedLine !== ''
        });
      }
      
      setDiffSections(sections);
    };

    computeDiffSections();
  }, [localContent, remoteContent, mergedContent]);

  // Sync scrolling between editors
  useEffect(() => {
    if (!localEditor || !remoteEditor || !mergedEditor) return;

    const syncScroll = (sourceEditor: monaco.editor.IStandaloneCodeEditor) => {
      return sourceEditor.onDidScrollChange((e) => {
        const scrollTop = e.scrollTop;
        const scrollLeft = e.scrollLeft;
        
        [localEditor, remoteEditor, mergedEditor].forEach(editor => {
          if (editor !== sourceEditor) {
            editor.setScrollTop(scrollTop);
            editor.setScrollLeft(scrollLeft);
          }
        });
      });
    };

    const disposables = [
      syncScroll(localEditor),
      syncScroll(remoteEditor),
      syncScroll(mergedEditor)
    ];

    return () => {
      disposables.forEach(d => d.dispose());
    };
  }, [localEditor, remoteEditor, mergedEditor]);

  if (isLoading) {
    return (
      <div className="diff-loading">
        <Spin size="large" />
        <Text>Loading diff view...</Text>
      </div>
    );
  }

  const renderThreeWayView = () => (
    <div className="three-way-diff">
      <div className="diff-pane">
        <div className="diff-pane-header local-header">
          <Text strong>Local (Your Changes)</Text>
        </div>
        <div ref={localEditorRef} className="diff-editor" />
      </div>
      
      <div className="diff-pane">
        <div className="diff-pane-header remote-header">
          <Text strong>Remote (Their Changes)</Text>
        </div>
        <div ref={remoteEditorRef} className="diff-editor" />
      </div>
      
      <div className="diff-pane">
        <div className="diff-pane-header merged-header">
          <Text strong>Merged Result</Text>
        </div>
        <div ref={mergedEditorRef} className="diff-editor" />
      </div>
    </div>
  );

  const renderSideBySideView = () => (
    <div className="side-by-side-diff">
      <div className="diff-pane">
        <div className="diff-pane-header local-header">
          <Text strong>Local</Text>
        </div>
        <div ref={localEditorRef} className="diff-editor" />
      </div>
      
      <div className="diff-pane">
        <div className="diff-pane-header merged-header">
          <Text strong>Merged</Text>
        </div>
        <div ref={mergedEditorRef} className="diff-editor" />
      </div>
    </div>
  );

  const renderUnifiedView = () => (
    <div className="unified-diff">
      <div className="diff-pane">
        <div className="diff-pane-header merged-header">
          <Text strong>Unified View</Text>
        </div>
        <div ref={mergedEditorRef} className="diff-editor" />
      </div>
    </div>
  );

  return (
    <div className="three-way-diff-view">
      {viewMode === 'three-way' && renderThreeWayView()}
      {viewMode === 'side-by-side' && renderSideBySideView()}
      {viewMode === 'unified' && renderUnifiedView()}
    </div>
  );
};