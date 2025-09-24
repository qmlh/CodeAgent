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

export class MonacoUtils {
  /**
   * Find all occurrences of a search term in the editor
   */
  static findInEditor(
    editor: monaco.editor.IStandaloneCodeEditor,
    searchTerm: string,
    options: ReplaceOptions = {}
  ): SearchResult[] {
    const model = editor.getModel();
    if (!model) return [];

    const results: SearchResult[] = [];

    const matches = model.findMatches(
      searchTerm,
      true, // searchOnlyEditableRange
      options.useRegex || false,
      options.matchCase || false,
      options.matchWholeWord ? '\\b' + searchTerm + '\\b' : null,
      true // captureMatches
    );

    matches.forEach(match => {
      results.push({
        range: match.range,
        text: model.getValueInRange(match.range),
        lineNumber: match.range.startLineNumber,
        column: match.range.startColumn
      });
    });

    return results;
  }

  /**
   * Replace all occurrences of a search term in the editor
   */
  static replaceInEditor(
    editor: monaco.editor.IStandaloneCodeEditor,
    searchTerm: string,
    replaceTerm: string,
    options: ReplaceOptions = {}
  ): number {
    const model = editor.getModel();
    if (!model) return 0;

    const searchResults = this.findInEditor(editor, searchTerm, options);
    if (searchResults.length === 0) return 0;

    const edits: monaco.editor.IIdentifiedSingleEditOperation[] = searchResults.map(result => ({
      range: result.range,
      text: options.preserveCase ? this.preserveCase(result.text, replaceTerm) : replaceTerm
    }));

    editor.executeEdits('replace-all', edits);
    return searchResults.length;
  }

  /**
   * Go to a specific line and column in the editor
   */
  static goToPosition(
    editor: monaco.editor.IStandaloneCodeEditor,
    lineNumber: number,
    column: number = 1
  ): void {
    const position = { lineNumber, column };
    editor.setPosition(position);
    editor.revealPositionInCenter(position);
    editor.focus();
  }

  /**
   * Go to definition of symbol at current position
   */
  static async goToDefinition(
    editor: monaco.editor.IStandaloneCodeEditor
  ): Promise<void> {
    try {
      const action = editor.getAction('editor.action.revealDefinition');
      if (action) {
        await action.run();
      }
    } catch (error) {
      console.error('Error going to definition:', error);
    }
  }

  /**
   * Find all references to symbol at current position
   */
  static async findReferences(
    editor: monaco.editor.IStandaloneCodeEditor
  ): Promise<void> {
    try {
      const action = editor.getAction('editor.action.goToReferences');
      if (action) {
        await action.run();
      }
    } catch (error) {
      console.error('Error finding references:', error);
    }
  }

  /**
   * Get hover information at current position
   */
  static async showHover(
    editor: monaco.editor.IStandaloneCodeEditor
  ): Promise<void> {
    try {
      const action = editor.getAction('editor.action.showHover');
      if (action) {
        await action.run();
      }
    } catch (error) {
      console.error('Error showing hover:', error);
    }
  }

  /**
   * Format the entire document
   */
  static async formatDocument(
    editor: monaco.editor.IStandaloneCodeEditor
  ): Promise<void> {
    try {
      const action = editor.getAction('editor.action.formatDocument');
      if (action) {
        await action.run();
      }
    } catch (error) {
      console.error('Error formatting document:', error);
    }
  }

  /**
   * Format the current selection
   */
  static async formatSelection(
    editor: monaco.editor.IStandaloneCodeEditor
  ): Promise<void> {
    try {
      const action = editor.getAction('editor.action.formatSelection');
      if (action) {
        await action.run();
      }
    } catch (error) {
      console.error('Error formatting selection:', error);
    }
  }

  /**
   * Toggle line comment for current line or selection
   */
  static toggleLineComment(
    editor: monaco.editor.IStandaloneCodeEditor
  ): void {
    const selection = editor.getSelection();
    if (!selection) return;

    const model = editor.getModel();
    if (!model) return;

    const language = model.getLanguageId();
    const commentConfig = this.getCommentConfig(language);
    
    if (!commentConfig.lineComment) return;

    const startLine = selection.startLineNumber;
    const endLine = selection.endLineNumber;
    const edits: monaco.editor.IIdentifiedSingleEditOperation[] = [];

    for (let lineNumber = startLine; lineNumber <= endLine; lineNumber++) {
      const line = model.getLineContent(lineNumber);
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith(commentConfig.lineComment)) {
        // Remove comment
        const commentIndex = line.indexOf(commentConfig.lineComment);
        const range = new monaco.Range(lineNumber, commentIndex + 1, lineNumber, commentIndex + commentConfig.lineComment.length + 1);
        edits.push({
          range,
          text: ''
        });
      } else if (trimmedLine.length > 0) {
        // Add comment
        const firstNonWhitespace = line.search(/\S/);
        const insertPosition = firstNonWhitespace === -1 ? line.length : firstNonWhitespace;
        edits.push({
          range: new monaco.Range(lineNumber, insertPosition + 1, lineNumber, insertPosition + 1),
          text: commentConfig.lineComment + ' '
        });
      }
    }

    if (edits.length > 0) {
      editor.executeEdits('toggle-line-comment', edits);
    }
  }

  /**
   * Toggle block comment for selection
   */
  static toggleBlockComment(
    editor: monaco.editor.IStandaloneCodeEditor
  ): void {
    const selection = editor.getSelection();
    if (!selection || selection.isEmpty()) return;

    const model = editor.getModel();
    if (!model) return;

    const language = model.getLanguageId();
    const commentConfig = this.getCommentConfig(language);
    
    if (!commentConfig.blockComment) return;

    const selectedText = model.getValueInRange(selection);
    const [start, end] = commentConfig.blockComment;

    if (selectedText.startsWith(start) && selectedText.endsWith(end)) {
      // Remove block comment
      const newText = selectedText.slice(start.length, -end.length);
      editor.executeEdits('toggle-block-comment', [{
        range: selection,
        text: newText
      }]);
    } else {
      // Add block comment
      const newText = start + selectedText + end;
      editor.executeEdits('toggle-block-comment', [{
        range: selection,
        text: newText
      }]);
    }
  }

  /**
   * Duplicate current line or selection
   */
  static duplicateSelection(
    editor: monaco.editor.IStandaloneCodeEditor
  ): void {
    const selection = editor.getSelection();
    if (!selection) return;

    const model = editor.getModel();
    if (!model) return;

    if (selection.isEmpty()) {
      // Duplicate line
      const lineNumber = selection.startLineNumber;
      const lineContent = model.getLineContent(lineNumber);
      const lineEnd = model.getLineMaxColumn(lineNumber);
      
      editor.executeEdits('duplicate-line', [{
        range: new monaco.Range(lineNumber, lineEnd, lineNumber, lineEnd),
        text: '\n' + lineContent
      }]);
      
      // Move cursor to duplicated line
      editor.setPosition({
        lineNumber: lineNumber + 1,
        column: selection.startColumn
      });
    } else {
      // Duplicate selection
      const selectedText = model.getValueInRange(selection);
      editor.executeEdits('duplicate-selection', [{
        range: new monaco.Range(
          selection.endLineNumber,
          selection.endColumn,
          selection.endLineNumber,
          selection.endColumn
        ),
        text: selectedText
      }]);
    }
  }

  /**
   * Move line(s) up
   */
  static moveLinesUp(
    editor: monaco.editor.IStandaloneCodeEditor
  ): void {
    const selection = editor.getSelection();
    if (!selection) return;

    const model = editor.getModel();
    if (!model) return;

    const startLine = selection.startLineNumber;
    const endLine = selection.endLineNumber;

    if (startLine === 1) return; // Can't move up from first line

    const linesToMove: string[] = [];
    for (let i = startLine; i <= endLine; i++) {
      linesToMove.push(model.getLineContent(i));
    }

    const lineAbove = model.getLineContent(startLine - 1);
    const edits: monaco.editor.IIdentifiedSingleEditOperation[] = [];

    // Replace the line above with the lines to move
    edits.push({
      range: new monaco.Range(startLine - 1, 1, startLine - 1, model.getLineMaxColumn(startLine - 1)),
      text: linesToMove.join('\n')
    });

    // Replace the moved lines with the line that was above
    edits.push({
      range: new monaco.Range(startLine, 1, endLine, model.getLineMaxColumn(endLine)),
      text: lineAbove
    });

    editor.executeEdits('move-lines-up', edits);

    // Update selection
    editor.setSelection(new monaco.Selection(
      startLine - 1,
      selection.startColumn,
      endLine - 1,
      selection.endColumn
    ));
  }

  /**
   * Move line(s) down
   */
  static moveLinesDown(
    editor: monaco.editor.IStandaloneCodeEditor
  ): void {
    const selection = editor.getSelection();
    if (!selection) return;

    const model = editor.getModel();
    if (!model) return;

    const startLine = selection.startLineNumber;
    const endLine = selection.endLineNumber;
    const totalLines = model.getLineCount();

    if (endLine === totalLines) return; // Can't move down from last line

    const linesToMove: string[] = [];
    for (let i = startLine; i <= endLine; i++) {
      linesToMove.push(model.getLineContent(i));
    }

    const lineBelow = model.getLineContent(endLine + 1);
    const edits: monaco.editor.IIdentifiedSingleEditOperation[] = [];

    // Replace the moved lines with the line that was below
    edits.push({
      range: new monaco.Range(startLine, 1, endLine, model.getLineMaxColumn(endLine)),
      text: lineBelow
    });

    // Replace the line below with the lines to move
    edits.push({
      range: new monaco.Range(endLine + 1, 1, endLine + 1, model.getLineMaxColumn(endLine + 1)),
      text: linesToMove.join('\n')
    });

    editor.executeEdits('move-lines-down', edits);

    // Update selection
    editor.setSelection(new monaco.Selection(
      startLine + 1,
      selection.startColumn,
      endLine + 1,
      selection.endColumn
    ));
  }

  /**
   * Get editor statistics
   */
  static getEditorStats(
    editor: monaco.editor.IStandaloneCodeEditor
  ): {
    lines: number;
    characters: number;
    charactersWithoutSpaces: number;
    words: number;
    selection?: {
      lines: number;
      characters: number;
      words: number;
    };
  } {
    const model = editor.getModel();
    if (!model) {
      return { lines: 0, characters: 0, charactersWithoutSpaces: 0, words: 0 };
    }

    const content = model.getValue();
    const lines = model.getLineCount();
    const characters = content.length;
    const charactersWithoutSpaces = content.replace(/\s/g, '').length;
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;

    const selection = editor.getSelection();
    let selectionStats;

    if (selection && !selection.isEmpty()) {
      const selectedText = model.getValueInRange(selection);
      selectionStats = {
        lines: selection.endLineNumber - selection.startLineNumber + 1,
        characters: selectedText.length,
        words: selectedText.trim() ? selectedText.trim().split(/\s+/).length : 0
      };
    }

    return {
      lines,
      characters,
      charactersWithoutSpaces,
      words,
      selection: selectionStats
    };
  }

  /**
   * Get comment configuration for a language
   */
  private static getCommentConfig(language: string): {
    lineComment?: string;
    blockComment?: [string, string];
  } {
    const configs: Record<string, any> = {
      javascript: { lineComment: '//', blockComment: ['/*', '*/'] },
      typescript: { lineComment: '//', blockComment: ['/*', '*/'] },
      python: { lineComment: '#', blockComment: ['"""', '"""'] },
      html: { blockComment: ['<!--', '-->'] },
      css: { blockComment: ['/*', '*/'] },
      scss: { lineComment: '//', blockComment: ['/*', '*/'] },
      less: { lineComment: '//', blockComment: ['/*', '*/'] },
      json: {},
      xml: { blockComment: ['<!--', '-->'] },
      yaml: { lineComment: '#' },
      markdown: { blockComment: ['<!--', '-->'] },
      sql: { lineComment: '--', blockComment: ['/*', '*/'] },
      shell: { lineComment: '#' },
      bash: { lineComment: '#' },
      powershell: { lineComment: '#', blockComment: ['<#', '#>'] }
    };

    return configs[language] || {};
  }

  /**
   * Preserve case when replacing text
   */
  private static preserveCase(original: string, replacement: string): string {
    if (original === original.toLowerCase()) {
      return replacement.toLowerCase();
    }
    if (original === original.toUpperCase()) {
      return replacement.toUpperCase();
    }
    if (original[0] === original[0].toUpperCase()) {
      return replacement[0].toUpperCase() + replacement.slice(1).toLowerCase();
    }
    return replacement;
  }

  /**
   * Get language from file extension
   */
  static getLanguageFromPath(filePath: string): string {
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
      'htm': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'less': 'less',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'sql': 'sql',
      'sh': 'shell',
      'bash': 'shell',
      'zsh': 'shell',
      'ps1': 'powershell',
      'dockerfile': 'dockerfile',
      'gitignore': 'ignore',
      'env': 'dotenv'
    };
    
    return languageMap[extension || ''] || 'plaintext';
  }
}

export default MonacoUtils;