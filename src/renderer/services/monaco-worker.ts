/**
 * Monaco Editor Web Worker Configuration
 * Handles proper initialization of Monaco Editor workers
 */

import * as monaco from 'monaco-editor';
import { initializeMonacoForElectron, registerElectronThemes } from './monaco-electron';
import { initializeMonacoSafe, registerSafeTheme } from './monaco-safe';

// Configure Monaco Editor environment for web workers
export function configureMonacoWorkers() {
  // Set up the Monaco environment
  (self as any).MonacoEnvironment = {
    getWorkerUrl: function (moduleId: string, label: string) {
      if (label === 'json') {
        return './json.worker.bundle.js';
      }
      if (label === 'css' || label === 'scss' || label === 'less') {
        return './css.worker.bundle.js';
      }
      if (label === 'html' || label === 'handlebars' || label === 'razor') {
        return './html.worker.bundle.js';
      }
      if (label === 'typescript' || label === 'javascript') {
        return './ts.worker.bundle.js';
      }
      return './editor.worker.bundle.js';
    }
  };
}

// Alternative configuration for Electron environment
export function configureMonacoForElectron() {
  // In Electron, we can use a simpler approach
  (self as any).MonacoEnvironment = {
    getWorkerUrl: function (moduleId: string, label: string) {
      // Use relative paths that webpack will resolve
      switch (label) {
        case 'json':
          return './json.worker.js';
        case 'css':
        case 'scss':
        case 'less':
          return './css.worker.js';
        case 'html':
        case 'handlebars':
        case 'razor':
          return './html.worker.js';
        case 'typescript':
        case 'javascript':
          return './ts.worker.js';
        default:
          return './editor.worker.js';
      }
    }
  };
}

// Fallback configuration that disables workers
export function configureMonacoWithoutWorkers() {
  // Disable workers entirely as a fallback
  (self as any).MonacoEnvironment = {
    getWorker: function () {
      return {
        postMessage: () => {},
        terminate: () => {},
        addEventListener: () => {},
        removeEventListener: () => {}
      };
    }
  };

  // Configure TypeScript/JavaScript with minimal validation
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: false,  // Keep basic syntax validation
    noSuggestionDiagnostics: true
  });

  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: false,  // Keep basic syntax validation
    noSuggestionDiagnostics: true
  });

  // Set up basic compiler options without advanced features
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    allowNonTsExtensions: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    module: monaco.languages.typescript.ModuleKind.ESNext,
    noEmit: true,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
    skipLibCheck: true
  });

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

  console.log('Monaco configured without workers - basic editing features available');
}

// Initialize Monaco with proper error handling
export async function initializeMonaco() {
  try {
    // Try the ultra-safe configuration first
    const success = initializeMonacoSafe();
    
    if (success) {
      registerSafeTheme();
      console.log('Monaco Editor initialized in ultra-safe mode');
      return true;
    } else {
      throw new Error('Safe configuration failed');
    }
  } catch (error) {
    console.warn('Safe configuration failed, trying Electron config:', error);
    
    try {
      // Fallback to Electron configuration
      const electronSuccess = initializeMonacoForElectron();
      if (electronSuccess) {
        registerElectronThemes();
        console.log('Monaco Editor initialized with Electron configuration');
        return true;
      } else {
        throw new Error('Electron configuration failed');
      }
    } catch (electronError) {
      console.warn('Electron configuration failed, trying final fallback:', electronError);
      
      try {
        // Final fallback
        configureMonacoWithoutWorkers();
        console.log('Monaco Editor initialized with final fallback');
        return true;
      } catch (finalError) {
        console.error('All Monaco configurations failed:', finalError);
        return false;
      }
    }
  }
}