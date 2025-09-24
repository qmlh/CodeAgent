/**
 * Code Review Agent
 * Specialized agent for automated code review tasks
 */
import { BaseAgent } from './BaseAgent';
import { AgentConfig, Task, TaskResult } from '../core';
export interface CodeReviewAgentConfig extends AgentConfig {
    reviewTypes: string[];
    languages: string[];
    linters: string[];
    qualityTools: string[];
    securityTools: string[];
    standards: {
        codingStandards: string[];
        documentationStandards: string[];
        testingStandards: string[];
        securityStandards: string[];
    };
    analysis: {
        staticAnalysis: boolean;
        securityAnalysis: boolean;
        performanceAnalysis: boolean;
        maintainabilityAnalysis: boolean;
        duplicateDetection: boolean;
    };
    thresholds: {
        complexityThreshold: number;
        duplicateThreshold: number;
        coverageThreshold: number;
        maintainabilityIndex: number;
    };
}
/**
 * Code Review Agent specialized for automated code review tasks
 */
export declare class CodeReviewAgent extends BaseAgent {
    private reviewConfig;
    constructor(id: string, name: string, config: CodeReviewAgentConfig);
    protected onInitialize(): Promise<void>;
    protected onExecuteTask(task: Task): Promise<TaskResult>;
    protected onShutdown(): Promise<void>;
    protected onConfigUpdate(newConfig: AgentConfig): Promise<void>;
    private handleStaticAnalysis;
    private handleSecurityReview;
    private handlePerformanceReview;
    private handleCodeQualityReview;
    private handleArchitectureReview;
    private handleDocumentationReview;
    private handleTestReview;
    private handleDependencyReview;
    private handleComplianceReview;
    private handlePullRequestReview;
    private handleCodeMetrics;
    private handleRefactoringSuggestions;
    private handleGenericCodeReviewTask;
    private validateCodeReviewConfig;
    private setupCodeReviewCapabilities;
    private validateCodeReviewTask;
    private isCodeReviewConfig;
    private parseStaticAnalysisRequirements;
    private parseSecurityReviewRequirements;
    private parsePerformanceReviewRequirements;
    private parseCodeQualityRequirements;
    private parseArchitectureRequirements;
    private parseDocumentationRequirements;
    private parseTestReviewRequirements;
    private parseDependencyRequirements;
    private parseComplianceRequirements;
    private parsePullRequestRequirements;
    private parseMetricsRequirements;
    private parseRefactoringRequirements;
    private runStaticAnalysis;
    private analyzeComplexity;
    private detectCodeSmells;
    private generateAnalysisReport;
    private runSecurityAnalysis;
    private checkVulnerabilities;
    private checkDependencySecurity;
    private generateSecurityReport;
    private analyzePerformance;
    private analyzeMemoryUsage;
    private identifyOptimizations;
    private generatePerformanceReport;
    private analyzeCodeQuality;
    private checkCodingStandards;
    private analyzeMaintainability;
    private detectDuplicateCode;
    private generateQualityReport;
    private analyzeArchitecture;
    private analyzeDesignPatterns;
    private analyzeDependencies;
    private generateArchitectureReport;
    private analyzeDocumentation;
    private analyzeAPIDocumentation;
    private checkDocumentationCompleteness;
    private generateDocumentationReport;
    private analyzeTestCoverage;
    private analyzeTestQuality;
    private analyzeTestPatterns;
    private generateTestReport;
    private analyzeDependencyUsage;
    private checkOutdatedDependencies;
    private analyzeLicenseCompliance;
    private generateDependencyReport;
    private checkRegulatoryCompliance;
    private checkPrivacyCompliance;
    private checkAccessibilityCompliance;
    private generateComplianceReport;
    private analyzeCodeChanges;
    private analyzeCommitMessages;
    private analyzeBreakingChanges;
    private generatePRFeedback;
    private calculateCodeMetrics;
    private analyzeTrends;
    private generateMetricsDashboard;
    private identifyRefactoringOpportunities;
    private generateRefactoringSuggestions;
    private analyzeRefactoringImpact;
    private analyzeCodeReviewTaskRequirements;
    private generateGenericReview;
    private extractArchitecturePatterns;
    private extractPRNumber;
    private extractMetricsTypes;
    private extractRefactoringTypes;
    private generateReportFiles;
    private generateFeedbackFiles;
    private generateSuggestionFiles;
}
