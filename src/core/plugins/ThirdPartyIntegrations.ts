/**
 * Third-Party Integrations
 * Built-in implementations for common third-party services
 */

import { IThirdPartyIntegration, IAPIIntegration } from './IAgentPlugin';
import { SystemError, ValidationError } from '../errors/SystemError';
import { ErrorType, ErrorSeverity } from '../../types/error.types';

/**
 * Base API Integration class
 */
export abstract class BaseAPIIntegration implements IAPIIntegration {
  public readonly name: string;
  public readonly version: string;
  public readonly baseUrl: string;
  public readonly apiKey?: string;

  protected _isInitialized: boolean = false;
  protected _config: Record<string, any> = {};
  protected _rateLimits: { remaining: number; resetTime: Date } = {
    remaining: 1000,
    resetTime: new Date(Date.now() + 3600000) // 1 hour from now
  };

  constructor(name: string, version: string, baseUrl: string, apiKey?: string) {
    this.name = name;
    this.version = version;
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  public async initialize(config: Record<string, any>): Promise<void> {
    this._config = { ...config };
    
    // Validate required configuration
    await this.validateConfig(config);
    
    // Perform initialization
    await this.onInitialize();
    
    this._isInitialized = true;
  }

  public async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this._isInitialized) {
      return { success: false, message: 'Integration not initialized' };
    }

    try {
      await this.onTestConnection();
      return { success: true, message: 'Connection successful' };
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Connection failed' 
      };
    }
  }

  public abstract getCapabilities(): string[];

  public async execute(operation: string, params: Record<string, any>): Promise<any> {
    if (!this._isInitialized) {
      throw new SystemError('Integration not initialized', ErrorType.SYSTEM_ERROR, ErrorSeverity.MEDIUM);
    }

    return this.onExecute(operation, params);
  }

  public async makeRequest(
    method: string,
    endpoint: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<any> {
    if (!this._isInitialized) {
      throw new SystemError('Integration not initialized', ErrorType.SYSTEM_ERROR, ErrorSeverity.MEDIUM);
    }

    const url = `${this.baseUrl}${endpoint}`;
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers
    };

    if (this.apiKey) {
      requestHeaders['Authorization'] = `Bearer ${this.apiKey}`;
    }

    try {
      const response = await fetch(url, {
        method: method.toUpperCase(),
        headers: requestHeaders,
        body: data ? JSON.stringify(data) : undefined
      });

      // Update rate limits from response headers
      this.updateRateLimits(response);

      if (!response.ok) {
        throw new SystemError(`API request failed: ${response.status} ${response.statusText}`, ErrorType.COMMUNICATION_ERROR, ErrorSeverity.MEDIUM);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }

    } catch (error) {
      throw new SystemError(`API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`, ErrorType.COMMUNICATION_ERROR, ErrorSeverity.MEDIUM);
    }
  }

  public async getRateLimits(): Promise<{ remaining: number; resetTime: Date }> {
    return { ...this._rateLimits };
  }

  public async authenticate(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      await this.onAuthenticate();
      return true;
    } catch (error) {
      return false;
    }
  }

  public async cleanup(): Promise<void> {
    await this.onCleanup();
    this._isInitialized = false;
    this._config = {};
  }

  // Abstract methods to be implemented by concrete integrations
  protected abstract validateConfig(config: Record<string, any>): Promise<void>;
  protected abstract onInitialize(): Promise<void>;
  protected abstract onTestConnection(): Promise<void>;
  protected abstract onExecute(operation: string, params: Record<string, any>): Promise<any>;
  protected abstract onAuthenticate(): Promise<void>;
  protected abstract onCleanup(): Promise<void>;

  // Helper methods
  protected updateRateLimits(response: Response): void {
    const remaining = response.headers.get('x-ratelimit-remaining');
    const reset = response.headers.get('x-ratelimit-reset');

    if (remaining) {
      this._rateLimits.remaining = parseInt(remaining, 10);
    }

    if (reset) {
      this._rateLimits.resetTime = new Date(parseInt(reset, 10) * 1000);
    }
  }
}

/**
 * OpenAI API Integration
 */
export class OpenAIIntegration extends BaseAPIIntegration {
  constructor(apiKey?: string) {
    super('OpenAI', '1.0.0', 'https://api.openai.com/v1', apiKey);
  }

  public getCapabilities(): string[] {
    return [
      'text-generation',
      'code-generation',
      'code-completion',
      'text-analysis',
      'language-translation',
      'summarization'
    ];
  }

  protected async validateConfig(config: Record<string, any>): Promise<void> {
    if (!config.apiKey && !this.apiKey) {
      throw new ValidationError('OpenAI API key is required');
    }
  }

  protected async onInitialize(): Promise<void> {
    if (this._config.apiKey) {
      (this as any).apiKey = this._config.apiKey;
    }
  }

  protected async onTestConnection(): Promise<void> {
    await this.makeRequest('GET', '/models');
  }

  protected async onExecute(operation: string, params: Record<string, any>): Promise<any> {
    switch (operation) {
      case 'generate-text':
        return this.generateText(params as { prompt: string; maxTokens?: number; temperature?: number });
      case 'generate-code':
        return this.generateCode(params as { prompt: string; language?: string; maxTokens?: number });
      case 'complete-code':
        return this.completeCode(params as { code: string; language?: string });
      default:
        throw new ValidationError(`Unsupported operation: ${operation}`);
    }
  }

  protected async onAuthenticate(): Promise<void> {
    // OpenAI uses API key authentication, which is handled in makeRequest
    await this.makeRequest('GET', '/models');
  }

  protected async onCleanup(): Promise<void> {
    // No specific cleanup needed for OpenAI
  }

  private async generateText(params: { prompt: string; maxTokens?: number; temperature?: number }): Promise<any> {
    return this.makeRequest('POST', '/completions', {
      model: 'gpt-3.5-turbo-instruct',
      prompt: params.prompt,
      max_tokens: params.maxTokens || 150,
      temperature: params.temperature || 0.7
    });
  }

  private async generateCode(params: { prompt: string; language?: string; maxTokens?: number }): Promise<any> {
    const codePrompt = params.language 
      ? `Generate ${params.language} code for: ${params.prompt}`
      : `Generate code for: ${params.prompt}`;

    return this.makeRequest('POST', '/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful coding assistant.' },
        { role: 'user', content: codePrompt }
      ],
      max_tokens: params.maxTokens || 500,
      temperature: 0.3
    });
  }

  private async completeCode(params: { code: string; language?: string }): Promise<any> {
    return this.makeRequest('POST', '/completions', {
      model: 'code-davinci-002',
      prompt: params.code,
      max_tokens: 100,
      temperature: 0.1,
      stop: ['\n\n']
    });
  }
}

/**
 * GitHub API Integration
 */
export class GitHubIntegration extends BaseAPIIntegration {
  constructor(apiKey?: string) {
    super('GitHub', '1.0.0', 'https://api.github.com', apiKey);
  }

  public getCapabilities(): string[] {
    return [
      'repository-management',
      'issue-tracking',
      'pull-requests',
      'code-search',
      'user-management',
      'webhook-management'
    ];
  }

  protected async validateConfig(config: Record<string, any>): Promise<void> {
    if (!config.token && !this.apiKey) {
      throw new ValidationError('GitHub token is required');
    }
  }

  protected async onInitialize(): Promise<void> {
    if (this._config.token) {
      (this as any).apiKey = this._config.token;
    }
  }

  protected async onTestConnection(): Promise<void> {
    await this.makeRequest('GET', '/user');
  }

  protected async onExecute(operation: string, params: Record<string, any>): Promise<any> {
    switch (operation) {
      case 'get-repositories':
        return this.getRepositories(params as { user?: string; org?: string; type?: string });
      case 'create-issue':
        return this.createIssue(params as { owner: string; repo: string; title: string; body?: string; labels?: string[] });
      case 'get-pull-requests':
        return this.getPullRequests(params as { owner: string; repo: string; state?: string });
      case 'search-code':
        return this.searchCode(params as { query: string; sort?: string; order?: string });
      default:
        throw new ValidationError(`Unsupported operation: ${operation}`);
    }
  }

  protected async onAuthenticate(): Promise<void> {
    await this.makeRequest('GET', '/user');
  }

  protected async onCleanup(): Promise<void> {
    // No specific cleanup needed for GitHub
  }

  public async makeRequest(
    method: string,
    endpoint: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<any> {
    if (!this._isInitialized) {
      throw new SystemError('Integration not initialized', ErrorType.SYSTEM_ERROR, ErrorSeverity.MEDIUM);
    }

    const url = `${this.baseUrl}${endpoint}`;
    const requestHeaders: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Multi-Agent-IDE/1.0.0',
      'Content-Type': 'application/json',
      ...headers
    };

    if (this.apiKey) {
      requestHeaders['Authorization'] = `token ${this.apiKey}`;
    }

    try {
      const response = await fetch(url, {
        method: method.toUpperCase(),
        headers: requestHeaders,
        body: data ? JSON.stringify(data) : undefined
      });

      // Update rate limits from response headers
      this.updateRateLimits(response);

      if (!response.ok) {
        throw new SystemError(`API request failed: ${response.status} ${response.statusText}`, ErrorType.COMMUNICATION_ERROR, ErrorSeverity.MEDIUM);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }

    } catch (error) {
      throw new SystemError(`API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`, ErrorType.COMMUNICATION_ERROR, ErrorSeverity.MEDIUM);
    }
  }

  private async getRepositories(params: { user?: string; org?: string; type?: string }): Promise<any> {
    let endpoint = '/user/repos';
    
    if (params.user) {
      endpoint = `/users/${params.user}/repos`;
    } else if (params.org) {
      endpoint = `/orgs/${params.org}/repos`;
    }

    const queryParams = new URLSearchParams();
    if (params.type) {
      queryParams.append('type', params.type);
    }

    const fullEndpoint = queryParams.toString() ? `${endpoint}?${queryParams}` : endpoint;
    return this.makeRequest('GET', fullEndpoint);
  }

  private async createIssue(params: { owner: string; repo: string; title: string; body?: string; labels?: string[] }): Promise<any> {
    return this.makeRequest('POST', `/repos/${params.owner}/${params.repo}/issues`, {
      title: params.title,
      body: params.body,
      labels: params.labels
    });
  }

  private async getPullRequests(params: { owner: string; repo: string; state?: string }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params.state) {
      queryParams.append('state', params.state);
    }

    const endpoint = `/repos/${params.owner}/${params.repo}/pulls`;
    const fullEndpoint = queryParams.toString() ? `${endpoint}?${queryParams}` : endpoint;
    return this.makeRequest('GET', fullEndpoint);
  }

  private async searchCode(params: { query: string; sort?: string; order?: string }): Promise<any> {
    const queryParams = new URLSearchParams();
    queryParams.append('q', params.query);
    if (params.sort) {
      queryParams.append('sort', params.sort);
    }
    if (params.order) {
      queryParams.append('order', params.order);
    }

    return this.makeRequest('GET', `/search/code?${queryParams}`);
  }
}

/**
 * Slack Integration
 */
export class SlackIntegration extends BaseAPIIntegration {
  constructor(apiKey?: string) {
    super('Slack', '1.0.0', 'https://slack.com/api', apiKey);
  }

  public getCapabilities(): string[] {
    return [
      'messaging',
      'channel-management',
      'user-management',
      'file-sharing',
      'notifications',
      'bot-interactions'
    ];
  }

  protected async validateConfig(config: Record<string, any>): Promise<void> {
    if (!config.botToken && !this.apiKey) {
      throw new ValidationError('Slack bot token is required');
    }
  }

  protected async onInitialize(): Promise<void> {
    if (this._config.botToken) {
      (this as any).apiKey = this._config.botToken;
    }
  }

  protected async onTestConnection(): Promise<void> {
    await this.makeRequest('GET', '/auth.test');
  }

  protected async onExecute(operation: string, params: Record<string, any>): Promise<any> {
    switch (operation) {
      case 'send-message':
        return this.sendMessage(params as { channel: string; text: string; attachments?: any[] });
      case 'get-channels':
        return this.getChannels(params as { excludeArchived?: boolean; types?: string });
      case 'upload-file':
        return this.uploadFile(params as { channels: string; file: Buffer; filename: string; title?: string });
      default:
        throw new ValidationError(`Unsupported operation: ${operation}`);
    }
  }

  protected async onAuthenticate(): Promise<void> {
    await this.makeRequest('GET', '/auth.test');
  }

  protected async onCleanup(): Promise<void> {
    // No specific cleanup needed for Slack
  }

  public async makeRequest(
    method: string,
    endpoint: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<any> {
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers
    };

    if (this.apiKey) {
      requestHeaders['Authorization'] = `Bearer ${this.apiKey}`;
    }

    return super.makeRequest(method, endpoint, data, requestHeaders);
  }

  private async sendMessage(params: { channel: string; text: string; attachments?: any[] }): Promise<any> {
    return this.makeRequest('POST', '/chat.postMessage', {
      channel: params.channel,
      text: params.text,
      attachments: params.attachments
    });
  }

  private async getChannels(params: { excludeArchived?: boolean; types?: string }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params.excludeArchived !== undefined) {
      queryParams.append('exclude_archived', params.excludeArchived.toString());
    }
    if (params.types) {
      queryParams.append('types', params.types);
    }

    const endpoint = '/conversations.list';
    const fullEndpoint = queryParams.toString() ? `${endpoint}?${queryParams}` : endpoint;
    return this.makeRequest('GET', fullEndpoint);
  }

  private async uploadFile(params: { channels: string; file: Buffer; filename: string; title?: string }): Promise<any> {
    // Note: This is a simplified implementation. In practice, you'd need to handle multipart/form-data
    return this.makeRequest('POST', '/files.upload', {
      channels: params.channels,
      content: params.file.toString('base64'),
      filename: params.filename,
      title: params.title
    });
  }
}

/**
 * Integration factory for creating built-in integrations
 */
export class IntegrationFactory {
  private static _integrationTypes: Map<string, new (apiKey?: string) => BaseAPIIntegration> = new Map();

  static {
    this._integrationTypes.set('openai', OpenAIIntegration);
    this._integrationTypes.set('github', GitHubIntegration);
    this._integrationTypes.set('slack', SlackIntegration);
  }

  /**
   * Create integration instance
   */
  public static createIntegration(type: string, apiKey?: string): BaseAPIIntegration {
    const IntegrationClass = this._integrationTypes.get(type.toLowerCase());
    if (!IntegrationClass) {
      throw new ValidationError(`Unknown integration type: ${type}. Available types: ${Array.from(this._integrationTypes.keys()).join(', ')}`);
    }

    return new IntegrationClass(apiKey);
  }

  /**
   * Get available integration types
   */
  public static getAvailableTypes(): string[] {
    return Array.from(this._integrationTypes.keys());
  }

  /**
   * Register custom integration type
   */
  public static registerIntegrationType(
    name: string,
    integrationClass: new (apiKey?: string) => BaseAPIIntegration
  ): void {
    this._integrationTypes.set(name.toLowerCase(), integrationClass);
  }

  /**
   * Check if integration type is available
   */
  public static isTypeAvailable(type: string): boolean {
    return this._integrationTypes.has(type.toLowerCase());
  }
}

