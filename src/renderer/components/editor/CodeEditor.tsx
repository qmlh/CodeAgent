/**
 * Enhanced Monaco Code Editor Component
 * Advanced code editor with full IDE features
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import * as monaco from 'monaco-editor';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { updateFileContent, markFileSaved } from '../../store/slices/fileSlice';
import { OpenFile } from '../../store/slices/fileSlice';
import { message } from 'antd';

interface CodeEditorProps {
  file: OpenFile;
  onFindReplace?: (isVisible: boolean) => void;
}

export interface CodeEditorRef {
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
  getSelection: () => monaco.ISelection | null;
  setSelection: (selection: monaco.ISelection) => void;
  revealLine: (lineNumber: number) => void;
  revealPosition: (position: monaco.IPosition) => void;
}

export const CodeEditor = React.forwardRef<CodeEditorRef, CodeEditorProps>(({ file, onFindReplace }, ref) => {
  const dispatch = useAppDispatch();
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  // Get theme from app state
  const theme = useAppSelector(state => state.theme?.current || 'vs-dark');

  // Initialize Monaco Editor with enhanced features
  useEffect(() => {
    if (!editorRef.current) return;

    // Configure Monaco environment
    monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);
    monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);

    // Enhanced editor configuration
    const editor = monaco.editor.create(editorRef.current, {
      value: file.content,
      language: file.language,
      theme: theme,
      automaticLayout: true,
      fontSize: 14,
      fontFamily: 'JetBrains Mono, Monaco, Consolas, "Courier New", monospace',
      fontLigatures: true,
      lineNumbers: 'on',
      lineNumbersMinChars: 4,
      wordWrap: 'on',
      wordWrapColumn: 120,
      minimap: { 
        enabled: true,
        maxColumn: 120,
        renderCharacters: true,
        showSlider: 'mouseover'
      },
      scrollBeyondLastLine: false,
      readOnly: file.isReadonly,
      tabSize: 2,
      insertSpaces: true,
      detectIndentation: true,
      
      // Code folding
      folding: true,
      foldingStrategy: 'indentation',
      showFoldingControls: 'always',
      unfoldOnClickAfterEndOfLine: false,
      foldingHighlight: true,
      
      // Context menu and interactions
      contextmenu: true,
      mouseWheelZoom: true,
      multiCursorModifier: 'ctrlCmd',
      
      // Cursor and selection
      cursorBlinking: 'blink',
      cursorSmoothCaretAnimation: 'on',
      cursorWidth: 2,
      selectOnLineNumbers: true,
      
      // Rendering options
      renderWhitespace: 'selection',
      renderControlCharacters: false,
      renderLineHighlight: 'all',
      // renderIndentGuides: true, // This option is deprecated in newer Monaco versions
      
      // Bracket matching and colorization
      guides: {
        bracketPairs: true,
        bracketPairsHorizontal: true,
        highlightActiveBracketPair: true,
        indentation: true,
        highlightActiveIndentation: true
      },
      bracketPairColorization: { enabled: true },
      matchBrackets: 'always',
      
      // IntelliSense and suggestions
      quickSuggestions: {
        other: true,
        comments: false,
        strings: false
      },
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnCommitCharacter: true,
      acceptSuggestionOnEnter: 'on',
      wordBasedSuggestions: 'matchingDocuments',
      
      // Hover and parameter hints
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
      lightbulb: {
        enabled: true
      },
      
      // Find and replace
      find: {
        seedSearchStringFromSelection: 'selection',
        autoFindInSelection: 'never',
        addExtraSpaceOnTop: true,
        loop: true
      },
      
      // Scrollbar
      scrollbar: {
        vertical: 'visible',
        horizontal: 'visible',
        arrowSize: 11,
        useShadows: false,
        verticalHasArrows: false,
        horizontalHasArrows: false,
        verticalScrollbarSize: 14,
        horizontalScrollbarSize: 14,
        verticalSliderSize: 14,
        horizontalSliderSize: 14
      },
      
      // Performance
      smoothScrolling: true,
      fastScrollSensitivity: 5,
      mouseWheelScrollSensitivity: 1,
      
      // Accessibility
      accessibilitySupport: 'auto',
      
      // Diff editor options (these are for diff editor, not standalone editor)
      // ignoreTrimWhitespace: true,
      // renderSideBySide: true,
      
      // Format on paste and type
      formatOnPaste: true,
      formatOnType: true,
      
      // Auto closing
      autoClosingBrackets: 'always',
      autoClosingQuotes: 'always',
      autoClosingOvertype: 'always',
      autoSurround: 'languageDefined',
      
      // Indentation
      autoIndent: 'full',
      
      // Links
      links: true,
      
      // Color decorators
      colorDecorators: true,
      
      // Sticky scroll
      stickyScroll: {
        enabled: true,
        maxLineCount: 5
      }
    });

    monacoEditorRef.current = editor;

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
      }, 300); // Debounce for 300ms
    });

    // Enhanced keyboard shortcuts
    const shortcuts: (string | null)[] = [
      // Save file (Ctrl+S)
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
        async () => {
          try {
            const content = editor.getValue();
            await window.electronAPI?.fs.writeFile(file.path, content);
            dispatch(markFileSaved(file.path));
            message.success('File saved successfully');
          } catch (error) {
            console.error('Failed to save file:', error);
            message.error('Failed to save file');
          }
        }
      ),

      // Format document (Shift+Alt+F)
      editor.addCommand(
        monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF,
        () => {
          editor.getAction('editor.action.formatDocument')?.run();
        }
      ),

      // Toggle comment (Ctrl+/)
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash,
        () => {
          editor.getAction('editor.action.commentLine')?.run();
        }
      ),

      // Go to definition (F12)
      editor.addCommand(
        monaco.KeyCode.F12,
        () => {
          editor.getAction('editor.action.revealDefinition')?.run();
        }
      ),

      // Find references (Shift+F12)
      editor.addCommand(
        monaco.KeyMod.Shift | monaco.KeyCode.F12,
        () => {
          editor.getAction('editor.action.goToReferences')?.run();
        }
      ),

      // Rename symbol (F2)
      editor.addCommand(
        monaco.KeyCode.F2,
        () => {
          editor.getAction('editor.action.rename')?.run();
        }
      ),

      // Quick fix (Ctrl+.)
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Period,
        () => {
          editor.getAction('editor.action.quickFix')?.run();
        }
      ),

      // Duplicate line (Shift+Alt+Down)
      editor.addCommand(
        monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.DownArrow,
        () => {
          editor.getAction('editor.action.copyLinesDownAction')?.run();
        }
      ),

      // Move line up (Alt+Up)
      editor.addCommand(
        monaco.KeyMod.Alt | monaco.KeyCode.UpArrow,
        () => {
          editor.getAction('editor.action.moveLinesUpAction')?.run();
        }
      ),

      // Move line down (Alt+Down)
      editor.addCommand(
        monaco.KeyMod.Alt | monaco.KeyCode.DownArrow,
        () => {
          editor.getAction('editor.action.moveLinesDownAction')?.run();
        }
      ),

      // Multi-cursor (Ctrl+Alt+Down)
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.DownArrow,
        () => {
          editor.getAction('editor.action.insertCursorBelow')?.run();
        }
      ),

      // Multi-cursor (Ctrl+Alt+Up)
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.UpArrow,
        () => {
          editor.getAction('editor.action.insertCursorAbove')?.run();
        }
      ),

      // Select all occurrences (Ctrl+Shift+L)
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyL,
        () => {
          editor.getAction('editor.action.selectHighlights')?.run();
        }
      ),

      // Fold all (Ctrl+K Ctrl+0)
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK,
        () => {
          editor.getAction('editor.foldAll')?.run();
        }
      ),

      // Unfold all (Ctrl+K Ctrl+J)
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyJ,
        () => {
          editor.getAction('editor.unfoldAll')?.run();
        }
      )
    ];

    // Handle find/replace widget visibility
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

    // Error and warning markers
    const updateMarkers = () => {
      const model = editor.getModel();
      if (!model) return;

      // This would typically integrate with a language server
      // For now, we'll just clear any existing markers
      monaco.editor.setModelMarkers(model, 'owner', []);
    };

    // Update markers when content changes
    const markerDisposable = editor.onDidChangeModelContent(() => {
      setTimeout(updateMarkers, 1000); // Debounce marker updates
    });

    // Handle cursor position changes for status bar
    const cursorDisposable = editor.onDidChangeCursorPosition((e) => {
      // This could be used to update a status bar with cursor position
      console.log(`Line: ${e.position.lineNumber}, Column: ${e.position.column}`);
    });

    // Handle selection changes
    const selectionDisposable = editor.onDidChangeCursorSelection((e) => {
      // This could be used to update selection info in status bar
      const selection = e.selection;
      if (!selection.isEmpty()) {
        const model = editor.getModel();
        if (model) {
          const selectedText = model.getValueInRange(selection);
          console.log(`Selected: ${selectedText.length} characters`);
        }
      }
    });

    // Cleanup function
    return () => {
      clearTimeout(contentChangeTimeout);
      contentChangeDisposable.dispose();
      markerDisposable.dispose();
      cursorDisposable.dispose();
      selectionDisposable.dispose();
      // Shortcuts are automatically disposed with the editor
      editor.dispose();
    };
  }, [file.path, dispatch, theme, onFindReplace]);

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

  // Update readonly state and show lock indicator
  useEffect(() => {
    if (monacoEditorRef.current) {
      monacoEditorRef.current.updateOptions({ 
        readOnly: file.isReadonly,
        // Add visual indication for readonly files
        renderValidationDecorations: file.isReadonly ? 'off' : 'on'
      });

      // Add readonly overlay if file is locked
      if (file.isReadonly) {
        const model = monacoEditorRef.current.getModel();
        if (model) {
          // Add a decoration to indicate the file is locked
          const decorations = monacoEditorRef.current.deltaDecorations([], [
            {
              range: new monaco.Range(1, 1, 1, 1),
              options: {
                isWholeLine: false,
                className: 'readonly-file-indicator',
                glyphMarginClassName: 'readonly-glyph-margin',
                hoverMessage: { value: 'This file is currently locked by another agent' }
              }
            }
          ]);
        }
      }
    }
  }, [file.isReadonly]);

  // Update theme
  useEffect(() => {
    if (monacoEditorRef.current) {
      monaco.editor.setTheme(theme);
    }
  }, [theme]);

  // Expose editor actions through ref
  React.useImperativeHandle(ref, () => ({
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
    getSelection: () => monacoEditorRef.current?.getSelection() || null,
    setSelection: (selection: monaco.ISelection) => monacoEditorRef.current?.setSelection(selection),
    revealLine: (lineNumber: number) => monacoEditorRef.current?.revealLine(lineNumber),
    revealPosition: (position: monaco.IPosition) => monacoEditorRef.current?.revealPosition(position)
  }), []);

  return (
    <div 
      ref={editorRef} 
      style={{ 
        height: '100%', 
        width: '100%',
        position: 'relative'
      }}
      className={`monaco-editor-container ${file.isReadonly ? 'readonly' : ''}`}
    />
  );
});