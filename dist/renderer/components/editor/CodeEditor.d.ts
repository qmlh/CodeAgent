/**
 * Enhanced Monaco Code Editor Component
 * Advanced code editor with full IDE features
 */
import React from 'react';
import * as monaco from 'monaco-editor';
import { OpenFile } from '../../store/slices/fileSlice';
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
export declare const CodeEditor: React.ForwardRefExoticComponent<CodeEditorProps & React.RefAttributes<CodeEditorRef>>;
export {};
