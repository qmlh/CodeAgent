/**
 * Frontend Development Agent
 * Specialized agent for frontend development tasks
 */
import { BaseAgent } from './BaseAgent';
import { AgentConfig, Task, TaskResult } from '../core';
export interface FrontendAgentConfig extends AgentConfig {
    frameworks: string[];
    buildTools: string[];
    testingLibraries: string[];
    codeStyle: {
        prettier: boolean;
        eslint: boolean;
        typescript: boolean;
    };
    optimization: {
        bundleAnalysis: boolean;
        performanceMetrics: boolean;
        codesplitting: boolean;
    };
}
/**
 * Frontend Agent specialized for frontend development tasks
 */
export declare class FrontendAgent extends BaseAgent {
    private frontendConfig;
    constructor(id: string, name: string, config: FrontendAgentConfig);
    protected onInitialize(): Promise<void>;
    protected onExecuteTask(task: Task): Promise<TaskResult>;
    protected onShutdown(): Promise<void>;
    protected onConfigUpdate(newConfig: AgentConfig): Promise<void>;
    private handleComponentCreation;
    private handleUIImplementation;
    private handleStyling;
    private handleStateManagement;
    private handleRouting;
    private handleAPIIntegration;
    private handlePerformanceOptimization;
    private handleFrontendTesting;
    private handleBuildOptimization;
    private handleGenericFrontendTask;
    private validateFrontendConfig;
    private setupFrontendCapabilities;
    private validateFrontendTask;
    private isFrontendConfig;
    private parseComponentRequirements;
    private parseUIRequirements;
    private parseStyleRequirements;
    private parseStateRequirements;
    private parseRoutingRequirements;
    private parseAPIRequirements;
    private generateComponentCode;
    private generateComponentTests;
    private generateComponentStyles;
    private generateUILayout;
    private generateResponsiveStyles;
    private generateAccessibilityFeatures;
    private generateStyles;
    private applyDesignTokens;
    private generateThemeVariations;
    private generateStateManagement;
    private generateActions;
    private generateSelectors;
    private generateRouteConfiguration;
    private generateRouteGuards;
    private generateNavigationComponents;
    private generateAPIClient;
    private generateDataHooks;
    private generateAPIErrorHandling;
    private analyzePerformance;
    private applyCodeSplitting;
    private optimizeBundleSize;
    private implementLazyLoading;
    private generateUnitTests;
    private generateIntegrationTests;
    private generateE2ETests;
    private generateVisualTests;
    private optimizeBuildConfiguration;
    private setupTreeShaking;
    private configureAssetOptimization;
    private analyzeTaskRequirements;
    private generateGenericFrontendCode;
    private extractComponentName;
    private extractComponentProps;
    private extractComponentState;
    private extractRequiredHooks;
    private extractStylingRequirements;
    private extractLayoutRequirements;
    private extractResponsiveRequirements;
    private extractA11yRequirements;
    private extractStyleFramework;
    private extractDesignTokens;
    private extractThemeRequirements;
    private extractStateType;
    private extractActions;
    private extractSelectors;
    private extractRoutes;
    private extractRouteGuards;
    private extractNavigationRequirements;
    private extractAPIEndpoints;
    private extractHTTPMethods;
    private extractAuthRequirements;
    private getTestFiles;
}
