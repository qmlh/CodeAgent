/**
 * Third-Party Integrations Tests
 */

import { 
  BaseAPIIntegration, 
  OpenAIIntegration, 
  GitHubIntegration, 
  SlackIntegration,
  IntegrationFactory 
} from '../ThirdPartyIntegrations';

// Mock fetch for testing
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock response helper
const createMockResponse = (data: any, status = 200, headers: Record<string, string> = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: status === 200 ? 'OK' : 'Error',
  headers: {
    get: (name: string) => headers[name.toLowerCase()] || null
  },
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(JSON.stringify(data))
});

// Test implementation of BaseAPIIntegration
class TestAPIIntegration extends BaseAPIIntegration {
  constructor() {
    super('test-api', '1.0.0', 'https://api.test.com', 'test-key');
  }

  getCapabilities(): string[] {
    return ['test-capability'];
  }

  protected async validateConfig(config: Record<string, any>): Promise<void> {
    if (!config.required) {
      throw new Error('Required config missing');
    }
  }

  protected async onInitialize(): Promise<void> {
    // Test initialization
  }

  protected async onTestConnection(): Promise<void> {
    await this.makeRequest('GET', '/health');
  }

  protected async onExecute(operation: string, params: Record<string, any>): Promise<any> {
    return { operation, params, result: 'test-result' };
  }

  protected async onAuthenticate(): Promise<void> {
    await this.makeRequest('GET', '/auth');
  }

  protected async onCleanup(): Promise<void> {
    // Test cleanup
  }
}

describe('BaseAPIIntegration', () => {
  let integration: TestAPIIntegration;

  beforeEach(() => {
    integration = new TestAPIIntegration();
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize successfully with valid config', async () => {
      await integration.initialize({ required: 'value' });

      expect(integration['_isInitialized']).toBe(true);
    });

    it('should fail initialization with invalid config', async () => {
      await expect(integration.initialize({})).rejects.toThrow('Required config missing');
    });
  });

  describe('connection testing', () => {
    beforeEach(async () => {
      await integration.initialize({ required: 'value' });
    });

    it('should test connection successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ status: 'healthy' }) as any);

      const result = await integration.testConnection();

      expect(result.success).toBe(true);
      expect(result.message).toBe('Connection successful');
    });

    it('should handle connection test failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await integration.testConnection();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Network error');
    });

    it('should fail if not initialized', async () => {
      const uninitializedIntegration = new TestAPIIntegration();
      
      const result = await uninitializedIntegration.testConnection();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Integration not initialized');
    });
  });

  describe('API requests', () => {
    beforeEach(async () => {
      await integration.initialize({ required: 'value' });
    });

    it('should make successful API request', async () => {
      const responseData = { data: 'test' };
      mockFetch.mockResolvedValueOnce(createMockResponse(responseData, 200, {
        'content-type': 'application/json'
      }) as any);

      const result = await integration.makeRequest('GET', '/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-key',
            'Content-Type': 'application/json'
          })
        })
      );
      expect(result).toEqual(responseData);
    });

    it('should handle API request with data', async () => {
      const requestData = { input: 'test' };
      const responseData = { output: 'result' };
      mockFetch.mockResolvedValueOnce(createMockResponse(responseData) as any);

      await integration.makeRequest('POST', '/process', requestData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/process',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestData)
        })
      );
    });

    it('should handle API request failure', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({}, 404) as any);

      await expect(integration.makeRequest('GET', '/notfound')).rejects.toThrow('API request failed: 404');
    });

    it('should update rate limits from response headers', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({}, 200, {
        'x-ratelimit-remaining': '50',
        'x-ratelimit-reset': '1640995200'
      }) as any);

      await integration.makeRequest('GET', '/test');

      const rateLimits = await integration.getRateLimits();
      expect(rateLimits.remaining).toBe(50);
    });
  });

  describe('authentication', () => {
    beforeEach(async () => {
      await integration.initialize({ required: 'value' });
    });

    it('should authenticate successfully', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({ authenticated: true }) as any);

      const result = await integration.authenticate();

      expect(result).toBe(true);
    });

    it('should handle authentication failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Auth failed'));

      const result = await integration.authenticate();

      expect(result).toBe(false);
    });
  });

  describe('operation execution', () => {
    beforeEach(async () => {
      await integration.initialize({ required: 'value' });
    });

    it('should execute operation successfully', async () => {
      const result = await integration.execute('test-op', { param: 'value' });

      expect(result.operation).toBe('test-op');
      expect(result.params).toEqual({ param: 'value' });
    });

    it('should fail execution if not initialized', async () => {
      const uninitializedIntegration = new TestAPIIntegration();

      await expect(uninitializedIntegration.execute('test-op', {})).rejects.toThrow('not initialized');
    });
  });
});

describe('OpenAIIntegration', () => {
  let integration: OpenAIIntegration;

  beforeEach(async () => {
    integration = new OpenAIIntegration('test-api-key');
    await integration.initialize({ apiKey: 'test-api-key' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should have correct capabilities', () => {
    const capabilities = integration.getCapabilities();
    expect(capabilities).toContain('text-generation');
    expect(capabilities).toContain('code-generation');
    expect(capabilities).toContain('code-completion');
  });

  it('should generate text', async () => {
    const responseData = { choices: [{ text: 'Generated text' }] };
    mockFetch.mockResolvedValueOnce(createMockResponse(responseData) as any);

    const result = await integration.execute('generate-text', {
      prompt: 'Test prompt',
      maxTokens: 100
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/completions',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('Test prompt')
      })
    );
  });

  it('should generate code', async () => {
    const responseData = { choices: [{ message: { content: 'Generated code' } }] };
    mockFetch.mockResolvedValueOnce(createMockResponse(responseData) as any);

    const result = await integration.execute('generate-code', {
      prompt: 'Create a function',
      language: 'javascript'
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST'
      })
    );
  });

  it('should complete code', async () => {
    const responseData = { choices: [{ text: 'completed code' }] };
    mockFetch.mockResolvedValueOnce(createMockResponse(responseData) as any);

    const result = await integration.execute('complete-code', {
      code: 'function test() {',
      language: 'javascript'
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/completions',
      expect.objectContaining({
        method: 'POST'
      })
    );
  });
});

describe('GitHubIntegration', () => {
  let integration: GitHubIntegration;

  beforeEach(async () => {
    integration = new GitHubIntegration('test-token');
    await integration.initialize({ token: 'test-token' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should have correct capabilities', () => {
    const capabilities = integration.getCapabilities();
    expect(capabilities).toContain('repository-management');
    expect(capabilities).toContain('issue-tracking');
    expect(capabilities).toContain('pull-requests');
  });

  it('should get repositories', async () => {
    const responseData = [{ name: 'test-repo', full_name: 'user/test-repo' }];
    mockFetch.mockResolvedValueOnce(createMockResponse(responseData) as any);

    const result = await integration.execute('get-repositories', { user: 'testuser' });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.github.com/users/testuser/repos',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'token test-token',
          'Accept': 'application/vnd.github.v3+json'
        })
      })
    );
  });

  it('should create issue', async () => {
    const responseData = { id: 1, number: 123, title: 'Test Issue' };
    mockFetch.mockResolvedValueOnce(createMockResponse(responseData) as any);

    const result = await integration.execute('create-issue', {
      owner: 'testuser',
      repo: 'testrepo',
      title: 'Test Issue',
      body: 'Issue description'
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/testuser/testrepo/issues',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('Test Issue')
      })
    );
  });

  it('should search code', async () => {
    const responseData = { items: [{ name: 'test.js', repository: { name: 'test-repo' } }] };
    mockFetch.mockResolvedValueOnce(createMockResponse(responseData) as any);

    const result = await integration.execute('search-code', {
      query: 'function test',
      sort: 'indexed'
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/search/code'),
      expect.any(Object)
    );
  });
});

describe('SlackIntegration', () => {
  let integration: SlackIntegration;

  beforeEach(async () => {
    integration = new SlackIntegration('test-bot-token');
    await integration.initialize({ botToken: 'test-bot-token' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should have correct capabilities', () => {
    const capabilities = integration.getCapabilities();
    expect(capabilities).toContain('messaging');
    expect(capabilities).toContain('channel-management');
    expect(capabilities).toContain('notifications');
  });

  it('should send message', async () => {
    const responseData = { ok: true, ts: '1234567890.123456' };
    mockFetch.mockResolvedValueOnce(createMockResponse(responseData) as any);

    const result = await integration.execute('send-message', {
      channel: '#general',
      text: 'Hello, world!'
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://slack.com/api/chat.postMessage',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-bot-token'
        }),
        body: expect.stringContaining('Hello, world!')
      })
    );
  });

  it('should get channels', async () => {
    const responseData = { ok: true, channels: [{ id: 'C1234', name: 'general' }] };
    mockFetch.mockResolvedValueOnce(createMockResponse(responseData) as any);

    const result = await integration.execute('get-channels', {
      excludeArchived: true,
      types: 'public_channel'
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/conversations.list?exclude_archived=true&types=public_channel'),
      expect.any(Object)
    );
  });
});

describe('IntegrationFactory', () => {
  it('should create OpenAI integration', () => {
    const integration = IntegrationFactory.createIntegration('openai', 'test-key');
    expect(integration).toBeInstanceOf(OpenAIIntegration);
  });

  it('should create GitHub integration', () => {
    const integration = IntegrationFactory.createIntegration('github', 'test-token');
    expect(integration).toBeInstanceOf(GitHubIntegration);
  });

  it('should create Slack integration', () => {
    const integration = IntegrationFactory.createIntegration('slack', 'test-token');
    expect(integration).toBeInstanceOf(SlackIntegration);
  });

  it('should throw error for unknown integration type', () => {
    expect(() => {
      IntegrationFactory.createIntegration('unknown', 'test-key');
    }).toThrow('Unknown integration type: unknown');
  });

  it('should get available types', () => {
    const types = IntegrationFactory.getAvailableTypes();
    expect(types).toContain('openai');
    expect(types).toContain('github');
    expect(types).toContain('slack');
  });

  it('should check if type is available', () => {
    expect(IntegrationFactory.isTypeAvailable('openai')).toBe(true);
    expect(IntegrationFactory.isTypeAvailable('unknown')).toBe(false);
  });

  it('should register custom integration type', () => {
    class CustomIntegration extends BaseAPIIntegration {
      constructor() {
        super('custom', '1.0.0', 'https://api.custom.com');
      }
      getCapabilities(): string[] { return []; }
      protected async validateConfig(): Promise<void> {}
      protected async onInitialize(): Promise<void> {}
      protected async onTestConnection(): Promise<void> {}
      protected async onExecute(): Promise<any> { return {}; }
      protected async onAuthenticate(): Promise<void> {}
      protected async onCleanup(): Promise<void> {}
    }

    IntegrationFactory.registerIntegrationType('custom', CustomIntegration);

    expect(IntegrationFactory.isTypeAvailable('custom')).toBe(true);
    
    const integration = IntegrationFactory.createIntegration('custom');
    expect(integration).toBeInstanceOf(CustomIntegration);
  });
});