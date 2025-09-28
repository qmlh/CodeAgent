/**
 * Enhanced Monaco Editor with Performance Optimizations and Advanced Features
 * Implements task 17 requirements for Monaco editor optimization
 */

import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import * as monaco from 'monaco-editor';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { updateFileContent, markFileSaved } from '../../store/slices/fileSlice';
import { OpenFile } from '../../store/slices/fileSlice';
import { message } from 'antd';
import { initializeMonaco } from '../../services/monaco-worker';
import { getSafeEditorOptions } from '../../services/monaco-safe';
import { MonacoUtils } from '../../services/monaco-utils';

interface EnhancedMonacoEditorProps {
  file: OpenFile;
  onFindReplace?: (isVisible: boolean) => void;
  onCollaborationUpdate?: (cursors: CollaborationCursor[]) => void;
  collaborationCursors?: CollaborationCursor[];
  isLargeFile?: boolean;
  enableAICompletion?: boolean;
  enablePerformanceMode?: boolean;
}

interface CollaborationCursor {
  agentId: string;
  agentName: string;
  position: monaco.IPosition;
  selection?: monaco.ISelection;
  color: string;
}

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  lineCount: number;
  characterCount: number;
}

export interface EnhancedMonacoEditorRef {
  // Basic editor actions
  format: () => void;
  find: () => void;
  replace: () => void;
  goToLine: () => void;
  toggleComment: () => void;
  foldAll: () => void;
  unfoldAll: () => void;
  selectAll: () => void;
  undo: () => void;
  redo: () => void;
  focus: () => void;
  
  // Enhanced actions
  duplicateLine: () => void;
  moveLinesUp: () => void;
  moveLinesDown: () => void;
  insertSnippet: (snippet: string) => void;
  showQuickFix: () => void;
  showParameterHints: () => void;
  
  // Navigation
  getSelection: () => monaco.ISelection | null;
  setSelection: (selection: monaco.ISelection) => void;
  revealLine: (lineNumber: number) => void;
  revealPosition: (position: monaco.IPosition) => void;
  
  // Performance and metrics
  getPerformanceMetrics: () => PerformanceMetrics;
  optimizeForLargeFile: () => void;
  
  // Collaboration
  addCollaborationCursor: (cursor: CollaborationCursor) => void;
  removeCollaborationCursor: (agentId: string) => void;
  updateCollaborationCursor: (cursor: CollaborationCursor) => void;
}

export const EnhancedMonacoEditor = React.forwardRef<EnhancedMonacoEditorRef, EnhancedMonacoEditorProps>(
  ({ 
    file, 
    onFindReplace, 
    onCollaborationUpdate,
    collaborationCursors = [],
    isLargeFile = false,
    enableAICompletion = true,
    enablePerformanceMode = false
  }, ref) => {
    const dispatch = useAppDispatch();
    const editorRef = useRef<HTMLDivElement>(null);
    const monacoEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
      renderTime: 0,
      memoryUsage: 0,
      lineCount: 0,
      characterCount: 0
    });
    
    // Collaboration state
    const [collaborationDecorations, setCollaborationDecorations] = useState<string[]>([]);
    
    // Performance optimization state
    const [syntaxHighlightCache, setSyntaxHighlightCache] = useState<Map<string, any>>(new Map());
    const [isOptimizedForLargeFile, setIsOptimizedForLargeFile] = useState(false);

    // Get theme from app state
    const theme = useAppSelector(state => state.theme?.current || 'vs-dark');
    const editorSettings = useAppSelector(state => (state.settings as any)?.editor || {});

    // Memoized editor options for performance
    const editorOptions = useMemo(() => {
      const baseOptions = getSafeEditorOptions();
      
      // Performance optimizations for large files
      if (isLargeFile || enablePerformanceMode) {
        return {
          ...baseOptions,
          // Large file optimizations
          minimap: { enabled: false },
          folding: false,
          wordWrap: 'off' as const,
          renderWhitespace: 'none' as const,
          renderControlCharacters: false,
          renderLineHighlight: 'none' as const,
          smoothScrolling: false,
          cursorSmoothCaretAnimation: 'off' as const,
          
          // Disable expensive features
          bracketPairColorization: { enabled: false },
          guides: {
            bracketPairs: false,
            bracketPairsHorizontal: false,
            highlightActiveBracketPair: false,
            indentation: false,
            highlightActiveIndentation: false
          },
          
          // Reduce suggestion overhead
          quickSuggestions: false,
          suggestOnTriggerCharacters: false,
          parameterHints: { enabled: false },
          hover: { enabled: false },
          
          // Optimize scrolling
          scrollBeyondLastLine: false,
          scrollbar: {
            vertical: 'auto' as const,
            horizontal: 'auto' as const,
            useShadows: false,
            verticalHasArrows: false,
            horizontalHasArrows: false
          }
        };
      }

      // Enhanced options for normal files
      return {
        ...baseOptions,
        // Apply user settings
        tabSize: editorSettings?.tabSize || 2,
        insertSpaces: editorSettings?.insertSpaces !== false,
        wordWrap: editorSettings?.wordWrap ? 'on' as const : 'off' as const,
        lineNumbers: editorSettings?.lineNumbers !== false ? 'on' as const : 'off' as const,
        minimap: { enabled: editorSettings?.minimap !== false },
        
        // Enhanced features
        bracketPairColorization: { enabled: true },
        guides: {
          bracketPairs: true,
          bracketPairsHorizontal: true,
          highlightActiveBracketPair: true,
          indentation: true,
          highlightActiveIndentation: true
        },
        
        // AI completion support
        quickSuggestions: enableAICompletion ? {
          other: true,
          comments: false,
          strings: false
        } : false,
        suggestOnTriggerCharacters: enableAICompletion,
        acceptSuggestionOnCommitCharacter: enableAICompletion,
        acceptSuggestionOnEnter: enableAICompletion ? 'on' as const : 'off' as const,
        
        // Enhanced hover and hints
        hover: {
          enabled: true,
          delay: 300,
          sticky: true
        },
        parameterHints: {
          enabled: true,
          cycle: true
        },
        
        // Code lens and lightbulb
        codeLens: true,
        lightbulb: { enabled: true },
        
        // Sticky scroll for better navigation
        stickyScroll: {
          enabled: true,
          maxLineCount: 5
        },
        
        // Enhanced find widget
        find: {
          seedSearchStringFromSelection: 'selection' as 'selection',
          autoFindInSelection: 'never' as 'never',
          addExtraSpaceOnTop: true,
          loop: true
        }
      };
    }, [isLargeFile, enablePerformanceMode, enableAICompletion, editorSettings]);

    // Performance monitoring
    const measurePerformance = useCallback(() => {
      if (!monacoEditorRef.current) return;
      
      const startTime = performance.now();
      const model = monacoEditorRef.current.getModel();
      
      if (model) {
        const lineCount = model.getLineCount();
        const characterCount = model.getValueLength();
        const renderTime = performance.now() - startTime;
        
        // Estimate memory usage (rough calculation)
        const memoryUsage = characterCount * 2 + lineCount * 50; // bytes
        
        setPerformanceMetrics({
          renderTime,
          memoryUsage,
          lineCount,
          characterCount
        });
      }
    }, []);

    // Initialize Monaco Editor with enhanced features
    useEffect(() => {
      if (!editorRef.current) return;

      const initEditor = async () => {
        try {
          if (!editorRef.current) return;

          await initializeMonaco();
          
          // Configure Monaco for enhanced features
          monaco.languages.typescript.javascriptDefaults.setEagerModelSync(false);
          monaco.languages.typescript.typescriptDefaults.setEagerModelSync(false);

          const startTime = performance.now();
          
          const editor = monaco.editor.create(editorRef.current, {
            value: file.content || '',
            language: file.language || 'plaintext',
            theme: theme === 'dark' ? 'multi-agent-dark' : 'multi-agent-light',
            readOnly: file.isReadonly || false,
            ...editorOptions
          });

          monacoEditorRef.current = editor;
          
          // Measure initial render time
          const renderTime = performance.now() - startTime;
          console.log(`Editor initialized in ${renderTime.toFixed(2)}ms`);

          // Enhanced content change handling with debouncing
          let contentChangeTimeout: NodeJS.Timeout;
          const contentChangeDisposable = editor.onDidChangeModelContent(() => {
            clearTimeout(contentChangeTimeout);
            contentChangeTimeout = setTimeout(() => {
              const content = editor.getValue();
              dispatch(updateFileContent({ 
                filePath: file.path, 
                content 
              }));
              
              // Update performance metrics
              measurePerformance();
              
              // Notify collaboration system
              const position = editor.getPosition();
              const selection = editor.getSelection();
              if (position && onCollaborationUpdate) {
                onCollaborationUpdate([{
                  agentId: 'user',
                  agentName: 'User',
                  position,
                  selection: selection || undefined,
                  color: '#007acc'
                }]);
              }
            }, 300);
          });

          // Enhanced keyboard shortcuts
          setupEnhancedShortcuts(editor);
          
          // Setup collaboration features
          setupCollaborationFeatures(editor);
          
          // Setup AI completion if enabled
          if (enableAICompletion) {
            setupAICompletion(editor);
          }
          
          // Setup performance monitoring
          setupPerformanceMonitoring(editor);
          
          // Handle find/replace widget visibility
          setupFindReplaceHandling(editor);
          
          // Initial performance measurement
          measurePerformance();

          return () => {
            clearTimeout(contentChangeTimeout);
            contentChangeDisposable.dispose();
            editor.dispose();
          };
        } catch (error) {
          console.error('Failed to initialize Enhanced Monaco Editor:', error);
          message.error('Failed to initialize code editor');
        }
      };

      initEditor();
    }, [file.path, dispatch, theme, editorOptions, enableAICompletion, measurePerformance, onCollaborationUpdate]);

    // Setup enhanced keyboard shortcuts
    const setupEnhancedShortcuts = useCallback((editor: monaco.editor.IStandaloneCodeEditor) => {
      // Duplicate line/selection (Ctrl+D)
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD,
        () => MonacoUtils.duplicateSelection(editor)
      );

      // Move lines up (Alt+Up)
      editor.addCommand(
        monaco.KeyMod.Alt | monaco.KeyCode.UpArrow,
        () => MonacoUtils.moveLinesUp(editor)
      );

      // Move lines down (Alt+Down)
      editor.addCommand(
        monaco.KeyMod.Alt | monaco.KeyCode.DownArrow,
        () => MonacoUtils.moveLinesDown(editor)
      );

      // Toggle block comment (Shift+Alt+A)
      editor.addCommand(
        monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyA,
        () => MonacoUtils.toggleBlockComment(editor)
      );

      // Show parameter hints (Ctrl+Shift+Space)
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Space,
        () => editor.trigger('keyboard', 'editor.action.triggerParameterHints', {})
      );

      // Quick fix (Ctrl+.)
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Period,
        () => editor.getAction('editor.action.quickFix')?.run()
      );
    }, []);

    // Setup collaboration features
    const setupCollaborationFeatures = useCallback((editor: monaco.editor.IStandaloneCodeEditor) => {
      // Listen for cursor position changes
      const cursorDisposable = editor.onDidChangeCursorPosition((e) => {
        if (onCollaborationUpdate) {
          const selection = editor.getSelection();
          onCollaborationUpdate([{
            agentId: 'user',
            agentName: 'User',
            position: e.position,
            selection: selection || undefined,
            color: '#007acc'
          }]);
        }
      });

      return () => {
        cursorDisposable.dispose();
      };
    }, [onCollaborationUpdate]);

    // Setup AI completion
    const setupAICompletion = useCallback((editor: monaco.editor.IStandaloneCodeEditor) => {
      // Register AI completion provider
      const completionProvider = monaco.languages.registerCompletionItemProvider(
        file.language || 'plaintext',
        {
          provideCompletionItems: async (model, position) => {
            // This would integrate with an AI service
            // For now, return enhanced built-in suggestions
            const word = model.getWordUntilPosition(position);
            const range = {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: word.startColumn,
              endColumn: word.endColumn
            };

            // Enhanced suggestions based on context
            const suggestions: monaco.languages.CompletionItem[] = [
              {
                label: 'console.log',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'console.log(${1:message});',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Log a message to the console',
                range
              },
              {
                label: 'function',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'function ${1:name}(${2:params}) {\n\t${3:// body}\n}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Create a function',
                range
              }
            ];

            return { suggestions };
          }
        }
      );

      return () => {
        completionProvider.dispose();
      };
    }, [file.language]);

    // Setup performance monitoring
    const setupPerformanceMonitoring = useCallback((editor: monaco.editor.IStandaloneCodeEditor) => {
      // Monitor scroll performance
      const scrollDisposable = editor.onDidScrollChange(() => {
        measurePerformance();
      });

      // Monitor model changes for performance impact
      const modelChangeDisposable = editor.onDidChangeModel(() => {
        measurePerformance();
      });

      return () => {
        scrollDisposable.dispose();
        modelChangeDisposable.dispose();
      };
    }, [measurePerformance]);

    // Setup find/replace handling
    const setupFindReplaceHandling = useCallback((editor: monaco.editor.IStandaloneCodeEditor) => {
      const findController = editor.getContribution('editor.contrib.findController') as any;
      if (findController) {
        const originalShow = findController.show;
        findController.show = function(...args: any[]) {
          setIsSearchVisible(true);
          onFindReplace?.(true);
          return originalShow.apply(this, args);
        };

        const originalHide = findController.hide;
        findController.hide = function(...args: any[]) {
          setIsSearchVisible(false);
          onFindReplace?.(false);
          return originalHide.apply(this, args);
        };
      }
    }, [onFindReplace]);

    // Update collaboration cursors
    useEffect(() => {
      if (!monacoEditorRef.current || !collaborationCursors.length) return;

      const editor = monacoEditorRef.current;
      const decorations: monaco.editor.IModelDeltaDecoration[] = [];

      collaborationCursors.forEach(cursor => {
        if (cursor.agentId === 'user') return; // Skip own cursor

        // Add cursor decoration
        decorations.push({
          range: new monaco.Range(
            cursor.position.lineNumber,
            cursor.position.column,
            cursor.position.lineNumber,
            cursor.position.column
          ),
          options: {
            className: 'collaboration-cursor',
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
            hoverMessage: { value: `${cursor.agentName} is here` }
          }
        });

        // Add selection decoration if present
        if (cursor.selection) {
          decorations.push({
            range: new monaco.Range(
              (cursor.selection as any).startLineNumber || 1,
              (cursor.selection as any).startColumn || 1,
              (cursor.selection as any).endLineNumber || 1,
              (cursor.selection as any).endColumn || 1
            ),
            options: {
              className: 'collaboration-selection',
              stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
            }
          });
        }
      });

      const newDecorations = editor.deltaDecorations(collaborationDecorations, decorations);
      setCollaborationDecorations(newDecorations);
    }, [collaborationCursors, collaborationDecorations]);

    // Update editor content when file content changes externally
    useEffect(() => {
      if (monacoEditorRef.current) {
        const currentContent = monacoEditorRef.current.getValue();
        if (currentContent !== file.content) {
          const position = monacoEditorRef.current.getPosition();
          monacoEditorRef.current.setValue(file.content);
          if (position) {
            monacoEditorRef.current.setPosition(position);
          }
        }
      }
    }, [file.content]);

    // Update editor language when file language changes
    useEffect(() => {
      if (monacoEditorRef.current) {
        const model = monacoEditorRef.current.getModel();
        if (model) {
          monaco.editor.setModelLanguage(model, file.language);
        }
      }
    }, [file.language]);

    // Update readonly state
    useEffect(() => {
      if (monacoEditorRef.current) {
        monacoEditorRef.current.updateOptions({ 
          readOnly: file.isReadonly
        });
      }
    }, [file.isReadonly]);

    // Update theme
    useEffect(() => {
      if (monacoEditorRef.current) {
        const themeName = theme === 'dark' ? 'multi-agent-dark' : 'multi-agent-light';
        monaco.editor.setTheme(themeName);
      }
    }, [theme]);

    // Optimize for large files
    const optimizeForLargeFile = useCallback(() => {
      if (!monacoEditorRef.current) return;

      const editor = monacoEditorRef.current;
      editor.updateOptions({
        minimap: { enabled: false },
        folding: false,
        wordWrap: 'off',
        renderWhitespace: 'none',
        renderControlCharacters: false,
        renderLineHighlight: 'none',
        smoothScrolling: false,
        cursorSmoothCaretAnimation: 'off',
        bracketPairColorization: { enabled: false },
        quickSuggestions: false,
        suggestOnTriggerCharacters: false,
        parameterHints: { enabled: false },
        hover: { enabled: false }
      });

      setIsOptimizedForLargeFile(true);
      message.info('Editor optimized for large file');
    }, []);

    // Expose editor actions through ref
    React.useImperativeHandle(ref, () => ({
      // Basic actions
      format: () => monacoEditorRef.current?.getAction('editor.action.formatDocument')?.run(),
      find: () => monacoEditorRef.current?.getAction('actions.find')?.run(),
      replace: () => monacoEditorRef.current?.getAction('editor.action.startFindReplaceAction')?.run(),
      goToLine: () => monacoEditorRef.current?.getAction('editor.action.gotoLine')?.run(),
      toggleComment: () => monacoEditorRef.current?.getAction('editor.action.commentLine')?.run(),
      foldAll: () => monacoEditorRef.current?.getAction('editor.foldAll')?.run(),
      unfoldAll: () => monacoEditorRef.current?.getAction('editor.unfoldAll')?.run(),
      selectAll: () => monacoEditorRef.current?.getAction('editor.action.selectAll')?.run(),
      undo: () => monacoEditorRef.current?.getAction('undo')?.run(),
      redo: () => monacoEditorRef.current?.getAction('redo')?.run(),
      focus: () => monacoEditorRef.current?.focus(),

      // Enhanced actions
      duplicateLine: () => monacoEditorRef.current && MonacoUtils.duplicateSelection(monacoEditorRef.current),
      moveLinesUp: () => monacoEditorRef.current && MonacoUtils.moveLinesUp(monacoEditorRef.current),
      moveLinesDown: () => monacoEditorRef.current && MonacoUtils.moveLinesDown(monacoEditorRef.current),
      insertSnippet: (snippet: string) => {
        if (monacoEditorRef.current) {
          const selection = monacoEditorRef.current.getSelection();
          if (selection) {
            monacoEditorRef.current.executeEdits('insert-snippet', [{
              range: selection,
              text: snippet
            }]);
          }
        }
      },
      showQuickFix: () => monacoEditorRef.current?.getAction('editor.action.quickFix')?.run(),
      showParameterHints: () => monacoEditorRef.current?.trigger('keyboard', 'editor.action.triggerParameterHints', {}),

      // Navigation
      getSelection: () => monacoEditorRef.current?.getSelection() || null,
      setSelection: (selection: monaco.ISelection) => monacoEditorRef.current?.setSelection(selection),
      revealLine: (lineNumber: number) => monacoEditorRef.current?.revealLine(lineNumber),
      revealPosition: (position: monaco.IPosition) => monacoEditorRef.current?.revealPosition(position),

      // Performance and metrics
      getPerformanceMetrics: () => performanceMetrics,
      optimizeForLargeFile,

      // Collaboration
      addCollaborationCursor: (cursor: CollaborationCursor) => {
        // This would be handled by the parent component
        console.log('Adding collaboration cursor:', cursor);
      },
      removeCollaborationCursor: (agentId: string) => {
        // This would be handled by the parent component
        console.log('Removing collaboration cursor:', agentId);
      },
      updateCollaborationCursor: (cursor: CollaborationCursor) => {
        // This would be handled by the parent component
        console.log('Updating collaboration cursor:', cursor);
      }
    }), [performanceMetrics, optimizeForLargeFile]);

    return (
      <div style={{ height: '100%', width: '100%', position: 'relative' }}>
        <div 
          ref={editorRef} 
          style={{ 
            height: '100%', 
            width: '100%',
            position: 'relative'
          }}
          className={`enhanced-monaco-editor-container ${file.isReadonly ? 'readonly' : ''} ${isOptimizedForLargeFile ? 'optimized' : ''}`}
        />
        
        {/* Performance indicator for large files */}
        {(isLargeFile || performanceMetrics.lineCount > 10000) && (
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            pointerEvents: 'none'
          }}>
            {performanceMetrics.lineCount.toLocaleString()} lines
            {isOptimizedForLargeFile && ' (Optimized)'}
          </div>
        )}
      </div>
    );
  }
);

EnhancedMonacoEditor.displayName = 'EnhancedMonacoEditor';