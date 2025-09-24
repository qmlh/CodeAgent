/**
 * Monaco Editor Utilities
 * Helper functions and utilities for Monaco Editor integration
 */
import * as monaco from 'monaco-editor';
export interface SearchResult {
    range: monaco.Range;
    text: string;
    lineNumber: number;
    column: number;
}
export interface ReplaceOptions {
    matchCase?: boolean;
    matchWholeWord?: boolean;
    useRegex?: boolean;
    preserveCase?: boolean;
}
export interface EditorPosition {
    lineNumber: number;
    column: number;
}
export interface EditorSelection {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
}
export declare class MonacoUtils {
    /**
     * Find all occurrences of a search term in the editor
     */
    static findInEditor(editor: monaco.editor.IStandaloneCodeEditor, searchTerm: string, options?: ReplaceOptions): SearchResult[];
    /**
     * Replace all occurrences of a search term in the editor
     */
    static replaceInEditor(editor: monaco.editor.IStandaloneCodeEditor, searchTerm: string, replaceTerm: string, options?: ReplaceOptions): number;
    /**
     * Go to a specific line and column in the editor
     */
    static goToPosition(editor: monaco.editor.IStandaloneCodeEditor, lineNumber: number, column?: number): void;
    /**
     * Go to definition of symbol at current position
     */
    static goToDefinition(editor: monaco.editor.IStandaloneCodeEditor): Promise<void>;
    /**
     * Find all references to symbol at current position
     */
    static findReferences(editor: monaco.editor.IStandaloneCodeEditor): Promise<void>;
    /**
     * Get hover information at current position
     */
    static showHover(editor: monaco.editor.IStandaloneCodeEditor): Promise<void>;
    /**
     * Format the entire document
     */
    static formatDocument(editor: monaco.editor.IStandaloneCodeEditor): Promise<void>;
    /**
     * Format the current selection
     */
    static formatSelection(editor: monaco.editor.IStandaloneCodeEditor): Promise<void>;
    /**
     * Toggle line comment for current line or selection
     */
    static toggleLineComment(editor: monaco.editor.IStandaloneCodeEditor): void;
    /**
     * Toggle block comment for selection
     */
    static toggleBlockComment(editor: monaco.editor.IStandaloneCodeEditor): void;
    /**
     * Duplicate current line or selection
     */
    static duplicateSelection(editor: monaco.editor.IStandaloneCodeEditor): void;
    /**
     * Move line(s) up
     */
    static moveLinesUp(editor: monaco.editor.IStandaloneCodeEditor): void;
    /**
     * Move line(s) down
     */
    static moveLinesDown(editor: monaco.editor.IStandaloneCodeEditor): void;
    /**
     * Get editor statistics
     */
    static getEditorStats(editor: monaco.editor.IStandaloneCodeEditor): {
        lines: number;
        characters: number;
        charactersWithoutSpaces: number;
        words: number;
        selection?: {
            lines: number;
            characters: number;
            words: number;
        };
    };
    /**
     * Get comment configuration for a language
     */
    private static getCommentConfig;
    /**
     * Preserve case when replacing text
     */
    private static preserveCase;
    /**
     * Get language from file extension
     */
    static getLanguageFromPath(filePath: string): string;
}
export default MonacoUtils;
