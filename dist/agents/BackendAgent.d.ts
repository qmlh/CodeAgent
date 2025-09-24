/**
 * Backend Development Agent
 * Specialized agent for backend development tasks
 */
import { BaseAgent } from './BaseAgent';
import { AgentConfig, Task, TaskResult } from '../core';
export interface BackendAgentConfig extends AgentConfig {
    frameworks: string[];
    databases: string[];
    apiTypes: string[];
    deploymentTargets: string[];
    testingFrameworks: string[];
    codeQuality: {
        linting: boolean;
        formatting: boolean;
        typeChecking: boolean;
        documentation: boolean;
    };
    security: {
        authentication: boolean;
        authorization: boolean;
        dataValidation: boolean;
        encryption: boolean;
    };
}
/**
 * Backend Agent specialized for backend development tasks
 */
export declare class BackendAgent extends BaseAgent {
    private backendConfig;
    constructor(id: string, name: string, config: BackendAgentConfig);
    protected onInitialize(): Promise<void>;
    protected onExecuteTask(task: Task): Promise<TaskResult>;
    protected onShutdown(): Promise<void>;
    protected onConfigUpdate(newConfig: AgentConfig): Promise<void>;
    private handleAPIDesign;
    private handleDatabaseDesign;
    private handleServiceImplementation;
    private handleAuthentication;
    private handleAuthorization;
    private handleDataValidation;
    private handleBusinessLogic;
    private handleIntegration;
    private handlePerformanceOptimization;
    private handleBackendTesting;
    private handleDeployment;
    private handleMonitoring;
    private handleGenericBackendTask;
    private validateBackendConfig;
    private setupBackendCapabilities;
    private validateBackendTask;
    private isBackendConfig;
    private parseAPIRequirements;
    private parseDatabaseRequirements;
    private parseServiceRequirements;
    private parseAuthRequirements;
    private parseAuthzRequirements;
    private parseValidationRequirements;
    private parseBusinessRequirements;
    private parseIntegrationRequirements;
    private generateAPISpecification;
    private generateAPIRoutes;
    private generateAPIMiddleware;
    private generateAPIDocumentation;
    private generateDatabaseSchema;
    private generateMigrations;
    private generateDataModels;
    private generateRepositories;
    private generateServiceInterfaces;
    private generateServiceImplementations;
    private generateDIConfiguration;
    private generateServiceTests;
    private generateAuthService;
    private generateTokenHandling;
    private generatePasswordSecurity;
    private generateAuthMiddleware;
    private generateRBAC;
    private generatePermissionSystem;
    private generateAuthzMiddleware;
    private generateValidationSchemas;
    private generateValidationMiddleware;
    private generateCustomValidators;
    private generateBusinessServices;
    private generateDomainModels;
    private generateBusinessRules;
    private generateWorkflows;
    private generateAPIClients;
    private generateMessageHandlers;
    private generateWebhookHandlers;
    private generateIntegrationTests;
    private analyzeBackendPerformance;
    private implementCaching;
    private optimizeDatabaseQueries;
    private implementConnectionPooling;
    private addPerformanceMonitoring;
    private generateBackendUnitTests;
    private generateBackendIntegrationTests;
    private generateAPITests;
    private generateLoadTests;
    private generateTestFixtures;
    private generateDeploymentConfig;
    private generateDockerConfig;
    private generateCICDPipelines;
    private generateEnvironmentConfigs;
    private generateLoggingConfig;
    private generateMetricsCollection;
    private generateHealthChecks;
    private generateAlerting;
    private analyzeBackendTaskRequirements;
    private generateGenericBackendCode;
    private extractAPIEndpoints;
    private extractHTTPMethods;
    private extractAuthRequirements;
    private extractValidationRequirements;
    private extractEntities;
    private extractRelationships;
    private extractIndexes;
    private extractConstraints;
    private extractServiceName;
    private extractServiceDependencies;
    private extractServiceInterfaces;
    private extractAuthType;
    private extractAuthProviders;
    private extractTokenType;
    private extractRoles;
    private extractPermissions;
    private extractResources;
    private extractValidationSchemas;
    private extractValidationRules;
    private extractCustomValidators;
    private extractDomain;
    private extractBusinessEntities;
    private extractBusinessRules;
    private extractWorkflows;
    private extractExternalAPIs;
    private extractMessageQueues;
    private extractWebhooks;
    private getBackendTestFiles;
}
