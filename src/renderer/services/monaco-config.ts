/**
 * Monaco Editor Configuration Service
 * Handles Monaco Editor setup, language services, and custom features
 */

import * as monaco from 'monaco-editor';

export interface MonacoTheme {
  name: string;
  base: 'vs' | 'vs-dark' | 'hc-black';
  inherit: boolean;
  rules: monaco.editor.ITokenThemeRule[];
  colors: { [colorId: string]: string };
}

export class MonacoConfigService {
  private static instance: MonacoConfigService;
  private initialized = false;

  static getInstance(): MonacoConfigService {
    if (!MonacoConfigService.instance) {
      MonacoConfigService.instance = new MonacoConfigService();
    }
    return MonacoConfigService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('Configuring Monaco environment...');
      // Configure Monaco environment
      this.configureEnvironment();
      
      console.log('Setting up language services...');
      // Setup language services
      this.setupLanguageServices();
      
      console.log('Registering custom themes...');
      // Register custom themes
      this.registerCustomThemes();
      
      console.log('Setting up custom commands...');
      // Setup custom commands
      this.setupCustomCommands();
      
      console.log('Configuring diagnostics...');
      // Configure diagnostics
      this.configureDiagnostics();

      this.initialized = true;
      console.log('Monaco configuration completed successfully');
    } catch (error) {
      console.error('Monaco configuration failed:', error);
      // Mark as initialized even if some parts failed to prevent hanging
      this.initialized = true;
      throw error;
    }
  }

  private configureEnvironment(): void {
    // Configure TypeScript/JavaScript language features
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      reactNamespace: 'React',
      allowJs: true,
      typeRoots: ['node_modules/@types']
    });

    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      noEmit: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
      strict: true,
      skipLibCheck: true,
      typeRoots: ['node_modules/@types']
    });

    // Configure diagnostics options
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
      noSuggestionDiagnostics: false
    });

    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
      noSuggestionDiagnostics: false
    });
  }

  private setupLanguageServices(): void {
    // Enhanced HTML language features
    monaco.languages.html.htmlDefaults.setOptions({
      format: {
        tabSize: 2,
        insertSpaces: true,
        wrapLineLength: 120,
        unformatted: 'default"',
        contentUnformatted: 'pre,code,textarea',
        indentInnerHtml: false,
        preserveNewLines: true,
        maxPreserveNewLines: undefined,
        indentHandlebars: false,
        endWithNewline: false,
        extraLiners: 'head, body, /html',
        wrapAttributes: 'auto'
      },
      suggest: { html5: true, angular1: true, ionic: true }
    });

    // Enhanced CSS language features
    monaco.languages.css.cssDefaults.setOptions({
      validate: true,
      lint: {
        compatibleVendorPrefixes: 'ignore',
        vendorPrefix: 'warning',
        duplicateProperties: 'warning',
        emptyRules: 'warning',
        importStatement: 'ignore',
        boxModel: 'ignore',
        universalSelector: 'ignore',
        zeroUnits: 'ignore',
        fontFaceProperties: 'warning',
        hexColorLength: 'error',
        argumentsInColorFunction: 'error',
        unknownProperties: 'warning',
        ieHack: 'ignore',
        unknownVendorSpecificProperties: 'ignore',
        propertyIgnoredDueToDisplay: 'warning',
        important: 'ignore',
        float: 'ignore',
        idSelector: 'ignore'
      }
    });

    // Enhanced JSON language features
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: false,
      schemas: [],
      enableSchemaRequest: true
    });
  }

  private registerCustomThemes(): void {
    // Dark theme with enhanced colors
    const darkTheme: MonacoTheme = {
      name: 'multi-agent-dark',
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: '569CD6' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'regexp', foreground: 'D16969' },
        { token: 'type', foreground: '4EC9B0' },
        { token: 'class', foreground: '4EC9B0' },
        { token: 'function', foreground: 'DCDCAA' },
        { token: 'variable', foreground: '9CDCFE' },
        { token: 'constant', foreground: '4FC1FF' },
        { token: 'property', foreground: '9CDCFE' },
        { token: 'operator', foreground: 'D4D4D4' },
        { token: 'delimiter', foreground: 'D4D4D4' }
      ],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
        'editor.lineHighlightBackground': '#2d2d30',
        'editor.selectionBackground': '#264f78',
        'editor.selectionHighlightBackground': '#add6ff26',
        'editor.wordHighlightBackground': '#575757b8',
        'editor.wordHighlightStrongBackground': '#004972b8',
        'editor.findMatchBackground': '#515c6a',
        'editor.findMatchHighlightBackground': '#ea5c0055',
        'editor.findRangeHighlightBackground': '#3a3d4166',
        'editorCursor.foreground': '#aeafad',
        'editorWhitespace.foreground': '#404040',
        'editorIndentGuide.background': '#404040',
        'editorIndentGuide.activeBackground': '#707070',
        'editorLineNumber.foreground': '#858585',
        'editorLineNumber.activeForeground': '#c6c6c6'
      }
    };

    // Light theme with enhanced colors
    const lightTheme: MonacoTheme = {
      name: 'multi-agent-light',
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '008000', fontStyle: 'italic' },
        { token: 'keyword', foreground: '0000FF' },
        { token: 'string', foreground: 'A31515' },
        { token: 'number', foreground: '098658' },
        { token: 'regexp', foreground: '811F3F' },
        { token: 'type', foreground: '267F99' },
        { token: 'class', foreground: '267F99' },
        { token: 'function', foreground: '795E26' },
        { token: 'variable', foreground: '001080' },
        { token: 'constant', foreground: '0070C1' },
        { token: 'property', foreground: '001080' },
        { token: 'operator', foreground: '000000' },
        { token: 'delimiter', foreground: '000000' }
      ],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#000000',
        'editor.lineHighlightBackground': '#f7f7f7',
        'editor.selectionBackground': '#add6ff',
        'editor.selectionHighlightBackground': '#add6ff80',
        'editor.wordHighlightBackground': '#57575740',
        'editor.wordHighlightStrongBackground': '#00497240',
        'editor.findMatchBackground': '#a8ac94',
        'editor.findMatchHighlightBackground': '#ea5c0040',
        'editor.findRangeHighlightBackground': '#3a3d4140',
        'editorCursor.foreground': '#000000',
        'editorWhitespace.foreground': '#33333333',
        'editorIndentGuide.background': '#d3d3d3',
        'editorIndentGuide.activeBackground': '#939393',
        'editorLineNumber.foreground': '#237893',
        'editorLineNumber.activeForeground': '#0b216f'
      }
    };

    // High contrast theme
    const highContrastTheme: MonacoTheme = {
      name: 'multi-agent-hc',
      base: 'hc-black',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '7CA668' },
        { token: 'keyword', foreground: '569CD6' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'regexp', foreground: 'D16969' },
        { token: 'type', foreground: '4EC9B0' },
        { token: 'class', foreground: '4EC9B0' },
        { token: 'function', foreground: 'DCDCAA' },
        { token: 'variable', foreground: '9CDCFE' },
        { token: 'constant', foreground: '4FC1FF' },
        { token: 'property', foreground: '9CDCFE' },
        { token: 'operator', foreground: 'FFFFFF' },
        { token: 'delimiter', foreground: 'FFFFFF' }
      ],
      colors: {
        'editor.background': '#000000',
        'editor.foreground': '#FFFFFF',
        'editor.lineHighlightBackground': '#0000FF',
        'editor.selectionBackground': '#FFFFFF',
        'editor.selectionHighlightBackground': '#FFFFFF80',
        'editorCursor.foreground': '#FFFFFF',
        'editorWhitespace.foreground': '#FFFFFF80',
        'editorLineNumber.foreground': '#FFFFFF',
        'editorLineNumber.activeForeground': '#FFFFFF'
      }
    };

    // Register themes
    monaco.editor.defineTheme('multi-agent-dark', darkTheme as any);
    monaco.editor.defineTheme('multi-agent-light', lightTheme as any);
    monaco.editor.defineTheme('multi-agent-hc', highContrastTheme as any);
  }

  private setupCustomCommands(): void {
    // Register custom actions
    monaco.editor.addEditorAction({
      id: 'multi-agent.saveAll',
      label: 'Save All Files',
      precondition: undefined,
      keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyS
      ],
      contextMenuGroupId: 'navigation',
      contextMenuOrder: 1.5,
      run: (editor) => {
        // This will be handled by the parent component
        window.dispatchEvent(new CustomEvent('monaco-save-all'));
      }
    });

    monaco.editor.addEditorAction({
      id: 'multi-agent.formatAll',
      label: 'Format All Open Files',
      precondition: undefined,
      keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF
      ],
      contextMenuGroupId: 'edit',
      contextMenuOrder: 1.5,
      run: (editor) => {
        window.dispatchEvent(new CustomEvent('monaco-format-all'));
      }
    });

    monaco.editor.addEditorAction({
      id: 'multi-agent.duplicateSelection',
      label: 'Duplicate Selection',
      precondition: undefined,
      keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD
      ],
      contextMenuGroupId: 'edit',
      contextMenuOrder: 2.5,
      run: (editor) => {
        const selection = editor.getSelection();
        if (selection && !selection.isEmpty()) {
          const model = editor.getModel();
          if (model) {
            const selectedText = model.getValueInRange(selection);
            editor.executeEdits('duplicate-selection', [
              {
                range: selection,
                text: selectedText + selectedText
              }
            ]);
          }
        }
      }
    });
  }

  private configureDiagnostics(): void {
    // Configure marker severity mapping
    const markerSeverityMap = {
      error: monaco.MarkerSeverity.Error,
      warning: monaco.MarkerSeverity.Warning,
      info: monaco.MarkerSeverity.Info,
      hint: monaco.MarkerSeverity.Hint
    };

    // Setup diagnostic providers for different languages
    this.setupTypeScriptDiagnostics();
    this.setupJavaScriptDiagnostics();
    this.setupCSSLintDiagnostics();
    this.setupHTMLValidation();
  }

  private setupTypeScriptDiagnostics(): void {
    // Enhanced TypeScript diagnostics
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
      noSuggestionDiagnostics: false,
      diagnosticCodesToIgnore: [
        1108, // Return statement in constructor
        1109, // Expression expected
        1005  // Expected token
      ]
    });
  }

  private setupJavaScriptDiagnostics(): void {
    // Enhanced JavaScript diagnostics
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
      noSuggestionDiagnostics: false,
      diagnosticCodesToIgnore: [
        7016, // Could not find declaration file
        7006  // Parameter implicitly has an 'any' type
      ]
    });
  }

  private setupCSSLintDiagnostics(): void {
    // Enhanced CSS linting
    monaco.languages.css.cssDefaults.setOptions({
      validate: true,
      lint: {
        compatibleVendorPrefixes: 'ignore',
        vendorPrefix: 'warning',
        duplicateProperties: 'warning',
        emptyRules: 'warning',
        importStatement: 'ignore',
        boxModel: 'ignore',
        universalSelector: 'ignore',
        zeroUnits: 'ignore',
        fontFaceProperties: 'warning',
        hexColorLength: 'error',
        argumentsInColorFunction: 'error',
        unknownProperties: 'warning',
        ieHack: 'ignore',
        unknownVendorSpecificProperties: 'ignore',
        propertyIgnoredDueToDisplay: 'warning',
        important: 'ignore',
        float: 'ignore',
        idSelector: 'ignore'
      }
    });
  }

  private setupHTMLValidation(): void {
    // Enhanced HTML validation
    monaco.languages.html.htmlDefaults.setOptions({
      suggest: {
        html5: true,
        angular1: true,
        ionic: true
      }
    });
  }

  // Public methods for external configuration
  setTheme(themeName: string): void {
    monaco.editor.setTheme(themeName);
  }

  addCustomLanguage(languageId: string, configuration: any): void {
    monaco.languages.register({ id: languageId });
    monaco.languages.setMonarchTokensProvider(languageId, configuration);
  }

  addCustomCompletionProvider(
    languageId: string, 
    provider: monaco.languages.CompletionItemProvider
  ): void {
    monaco.languages.registerCompletionItemProvider(languageId, provider);
  }

  addCustomHoverProvider(
    languageId: string,
    provider: monaco.languages.HoverProvider
  ): void {
    monaco.languages.registerHoverProvider(languageId, provider);
  }

  addCustomCodeActionProvider(
    languageId: string,
    provider: monaco.languages.CodeActionProvider
  ): void {
    monaco.languages.registerCodeActionProvider(languageId, provider);
  }

  updateMarkers(
    modelUri: string,
    markers: monaco.editor.IMarkerData[]
  ): void {
    const model = monaco.editor.getModel(monaco.Uri.parse(modelUri));
    if (model) {
      monaco.editor.setModelMarkers(model, 'multi-agent-ide', markers);
    }
  }

  clearMarkers(modelUri: string): void {
    const model = monaco.editor.getModel(monaco.Uri.parse(modelUri));
    if (model) {
      monaco.editor.setModelMarkers(model, 'multi-agent-ide', []);
    }
  }

  getAvailableThemes(): string[] {
    return ['vs', 'vs-dark', 'hc-black', 'multi-agent-dark', 'multi-agent-light', 'multi-agent-hc'];
  }

  dispose(): void {
    // Cleanup resources
    this.initialized = false;
  }
}

// Export singleton instance
export const monacoConfig = MonacoConfigService.getInstance();