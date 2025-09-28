/**
 * Monaco Editor Electron-specific Configuration
 * Simplified configuration that avoids Worker-related issues
 */

import * as monaco from 'monaco-editor';

// Global flag to track initialization
let isInitialized = false;

export function initializeMonacoForElectron(): boolean {
  if (isInitialized) {
    return true;
  }

  try {
    // Set up global error handler for Monaco
    const originalConsoleError = console.error;
    console.error = function(...args) {
      // Filter out known Monaco rendering errors that don't affect functionality
      const message = args.join(' ');
      if (message.includes('Cannot read properties of null') && 
          (message.includes('IndentGuidesOverlay') || message.includes('prepareRender'))) {
        console.warn('Monaco rendering warning (non-critical):', ...args);
        return;
      }
      originalConsoleError.apply(console, args);
    };

    // Set up Monaco environment without workers
    (self as any).MonacoEnvironment = {
      getWorker: () => {
        // Return a mock worker that does nothing
        return {
          postMessage: () => {},
          terminate: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          onmessage: null,
          onerror: null
        };
      }
    };

    // Configure TypeScript defaults with minimal features
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      noEmit: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
      skipLibCheck: true,
      strict: false // Disable strict mode to reduce validation overhead
    });

    // Configure JavaScript defaults
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      allowJs: true,
      skipLibCheck: true
    });

    // Disable diagnostics that require workers
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false, // Keep basic syntax highlighting
      noSuggestionDiagnostics: true
    });

    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false, // Keep basic syntax highlighting
      noSuggestionDiagnostics: true
    });

    // Disable eager model sync to prevent worker initialization
    monaco.languages.typescript.typescriptDefaults.setEagerModelSync(false);
    monaco.languages.typescript.javascriptDefaults.setEagerModelSync(false);

    // Configure other languages with minimal features
    monaco.languages.css.cssDefaults.setOptions({
      validate: false, // Disable CSS validation to avoid worker issues
      lint: undefined
    });

    monaco.languages.html.htmlDefaults.setOptions({
      suggest: { html5: true }
    });

    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: false, // Disable JSON validation
      allowComments: true,
      schemas: []
    });

    isInitialized = true;
    console.log('Monaco Editor configured for Electron (safe mode)');
    return true;

  } catch (error) {
    console.error('Failed to configure Monaco for Electron:', error);
    return false;
  }
}

// Register custom themes optimized for Electron
export function registerElectronThemes() {
  try {
    // Dark theme optimized for Electron
    monaco.editor.defineTheme('electron-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: '569CD6' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'type', foreground: '4EC9B0' },
        { token: 'function', foreground: 'DCDCAA' },
        { token: 'variable', foreground: '9CDCFE' }
      ],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
        'editor.lineHighlightBackground': '#2d2d30',
        'editor.selectionBackground': '#264f78',
        'editorCursor.foreground': '#aeafad',
        'editorLineNumber.foreground': '#858585'
      }
    });

    // Light theme optimized for Electron
    monaco.editor.defineTheme('electron-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '008000', fontStyle: 'italic' },
        { token: 'keyword', foreground: '0000FF' },
        { token: 'string', foreground: 'A31515' },
        { token: 'number', foreground: '098658' },
        { token: 'type', foreground: '267F99' },
        { token: 'function', foreground: '795E26' },
        { token: 'variable', foreground: '001080' }
      ],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#000000',
        'editor.lineHighlightBackground': '#f7f7f7',
        'editor.selectionBackground': '#add6ff',
        'editorCursor.foreground': '#000000',
        'editorLineNumber.foreground': '#237893'
      }
    });

    console.log('Electron-optimized themes registered');
  } catch (error) {
    console.warn('Failed to register Electron themes:', error);
  }
}

// Get recommended editor options for Electron
export function getElectronEditorOptions(): monaco.editor.IStandaloneEditorConstructionOptions {
  return {
    // Disable features that might cause worker issues
    quickSuggestions: false,
    suggestOnTriggerCharacters: false,
    acceptSuggestionOnCommitCharacter: false,
    parameterHints: { enabled: false },
    hover: { enabled: false },
    
    // Enable basic editing features
    wordWrap: 'on' as const,
    lineNumbers: 'on' as const,
    minimap: { enabled: true },
    folding: true,
    bracketPairColorization: { enabled: true },
    matchBrackets: 'always' as const,
    
    // Performance optimizations
    renderWhitespace: 'selection' as const,
    renderControlCharacters: false,
    renderLineHighlight: 'line' as const,
    scrollBeyondLastLine: false,
    
    // Disable guides that might cause rendering issues
    guides: {
      bracketPairs: false,
      bracketPairsHorizontal: false,
      highlightActiveBracketPair: false,
      indentation: false,  // Disable indent guides to prevent the null error
      highlightActiveIndentation: false
    },
    
    // Font settings
    fontSize: 14,
    fontFamily: 'JetBrains Mono, Monaco, Consolas, "Courier New", monospace',
    fontLigatures: true
  };
}