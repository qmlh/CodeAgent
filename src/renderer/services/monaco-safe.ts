/**
 * Monaco Editor Safe Configuration
 * Ultra-minimal configuration to avoid all rendering issues
 */

import * as monaco from 'monaco-editor';

// Initialize Monaco in the safest possible way
export function initializeMonacoSafe(): boolean {
  try {
    // Completely disable workers
    (self as any).MonacoEnvironment = {
      getWorker: () => ({
        postMessage: () => {},
        terminate: () => {},
        addEventListener: () => {},
        removeEventListener: () => {}
      })
    };

    // Disable all language services
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
      noSuggestionDiagnostics: true
    });

    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
      noSuggestionDiagnostics: true
    });

    // Disable eager model sync
    monaco.languages.typescript.typescriptDefaults.setEagerModelSync(false);
    monaco.languages.typescript.javascriptDefaults.setEagerModelSync(false);

    // Disable all other language validations
    monaco.languages.css.cssDefaults.setOptions({ validate: false });
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({ validate: false });

    console.log('Monaco initialized in ultra-safe mode');
    return true;
  } catch (error) {
    console.error('Failed to initialize Monaco in safe mode:', error);
    return false;
  }
}

// Get the most minimal editor options possible
export function getSafeEditorOptions(): monaco.editor.IStandaloneEditorConstructionOptions {
  return {
    // Basic functionality only
    automaticLayout: true,
    wordWrap: 'on' as const,
    lineNumbers: 'on' as const,
    scrollBeyondLastLine: false,
    
    // Disable all advanced features
    minimap: { enabled: false },
    folding: false,
    bracketPairColorization: { enabled: false },
    matchBrackets: 'never' as const,
    
    // Disable all guides and overlays
    guides: {
      bracketPairs: false,
      bracketPairsHorizontal: false,
      highlightActiveBracketPair: false,
      indentation: false,
      highlightActiveIndentation: false
    },
    
    // Disable suggestions and hover
    quickSuggestions: false,
    suggestOnTriggerCharacters: false,
    acceptSuggestionOnCommitCharacter: false,
    parameterHints: { enabled: false },
    hover: { enabled: false },
    
    // Disable rendering features that might cause issues
    renderWhitespace: 'none' as const,
    renderControlCharacters: false,
    renderLineHighlight: 'none' as const,
    
    // Basic font settings
    fontSize: 14,
    fontFamily: 'Monaco, Consolas, "Courier New", monospace',
    fontLigatures: false,
    
    // Disable context menu to avoid potential issues
    contextmenu: false,
    
    // Disable mouse wheel zoom
    mouseWheelZoom: false
  };
}

// Register only the most basic theme
export function registerSafeTheme() {
  try {
    monaco.editor.defineTheme('safe-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4'
      }
    });

    monaco.editor.defineTheme('safe-light', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#000000'
      }
    });
  } catch (error) {
    console.warn('Failed to register safe themes:', error);
  }
}