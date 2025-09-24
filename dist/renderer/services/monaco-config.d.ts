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
    colors: {
        [colorId: string]: string;
    };
}
export declare class MonacoConfigService {
    private static instance;
    private initialized;
    static getInstance(): MonacoConfigService;
    initialize(): Promise<void>;
    private configureEnvironment;
    private setupLanguageServices;
    private registerCustomThemes;
    private setupCustomCommands;
    private configureDiagnostics;
    private setupTypeScriptDiagnostics;
    private setupJavaScriptDiagnostics;
    private setupCSSLintDiagnostics;
    private setupHTMLValidation;
    setTheme(themeName: string): void;
    addCustomLanguage(languageId: string, configuration: any): void;
    addCustomCompletionProvider(languageId: string, provider: monaco.languages.CompletionItemProvider): void;
    addCustomHoverProvider(languageId: string, provider: monaco.languages.HoverProvider): void;
    addCustomCodeActionProvider(languageId: string, provider: monaco.languages.CodeActionProvider): void;
    updateMarkers(modelUri: string, markers: monaco.editor.IMarkerData[]): void;
    clearMarkers(modelUri: string): void;
    getAvailableThemes(): string[];
    dispose(): void;
}
export declare const monacoConfig: MonacoConfigService;
