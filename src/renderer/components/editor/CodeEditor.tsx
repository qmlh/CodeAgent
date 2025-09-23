/**
 * Code Editor Component
 * Monaco Editor wrapper for code editing
 */

import React, { useRef, useEffect } from 'react';
import * as monaco from 'monaco-editor';
import { useAppDispatch } from '../../hooks/redux';
import { updateFileContent, markFileSaved } from '../../store/slices/fileSlice';
import { OpenFile } from '../../store/slices/fileSlice';

interface CodeEditorProps {
  file: OpenFile;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ file }) => {
  const dispatch = useAppDispatch();
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    // Create Monaco editor instance
    const editor = monaco.editor.create(editorRef.current, {
      value: file.content,
      language: file.language,
      theme: 'vs-dark',
      automaticLayout: true,
      fontSize: 14,
      fontFamily: 'Monaco, Consolas, "Courier New", monospace',
      lineNumbers: 'on',
      wordWrap: 'on',
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      readOnly: file.isReadonly,
      tabSize: 2,
      insertSpaces: true,
      detectIndentation: true,
      folding: true,
      foldingStrategy: 'indentation',
      showFoldingControls: 'always',
      unfoldOnClickAfterEndOfLine: false,
      contextmenu: true,
      mouseWheelZoom: true,
      cursorBlinking: 'blink',
      cursorSmoothCaretAnimation: true,
      renderWhitespace: 'selection',
      renderControlCharacters: false,
      renderIndentGuides: true,
      highlightActiveIndentGuide: true,
      bracketPairColorization: { enabled: true },
      guides: {
        bracketPairs: true,
        bracketPairsHorizontal: true,
        highlightActiveBracketPair: true,
        indentation: true,
        highlightActiveIndentation: true
      }
    });

    monacoEditorRef.current = editor;

    // Handle content changes
    const disposable = editor.onDidChangeModelContent(() => {
      const content = editor.getValue();
      dispatch(updateFileContent({ 
        filePath: file.path, 
        content 
      }));
    });

    // Handle save shortcut (Ctrl+S)
    const saveCommand = editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
      async () => {
        try {
          const content = editor.getValue();
          await window.electronAPI?.fs.writeFile(file.path, content);
          dispatch(markFileSaved(file.path));
        } catch (error) {
          console.error('Failed to save file:', error);
        }
      }
    );

    // Cleanup
    return () => {
      disposable.dispose();
      if (saveCommand) {
        editor.removeCommand(saveCommand);
      }
      editor.dispose();
    };
  }, [file.path, dispatch]);

  // Update editor content when file content changes externally
  useEffect(() => {
    if (monacoEditorRef.current) {
      const currentContent = monacoEditorRef.current.getValue();
      if (currentContent !== file.content) {
        monacoEditorRef.current.setValue(file.content);
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
      monacoEditorRef.current.updateOptions({ readOnly: file.isReadonly });
    }
  }, [file.isReadonly]);

  return (
    <div 
      ref={editorRef} 
      style={{ 
        height: '100%', 
        width: '100%',
        position: 'relative'
      }} 
    />
  );
};