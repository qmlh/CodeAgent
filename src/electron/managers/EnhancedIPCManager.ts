/**
 * Enhanced IPC Manager
 * Handles Inter-Process Communication with performance optimizations and monitoring
 */

import { ipcMain, BrowserWindow } from 'electron';
import { EventEmitter } from 'events';
import { IPCManager } from './IPCManager';

export interface IPCMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  activeConnections: number;
  lastActivity: Date;
}

export interface IPCRequest {
  id: string;
  channel: string;
  timestamp: Date;
  responseTime?: number;
  success?: boolean;
  error?: string;
}

export interface IPCConnectionStatus {
  connected: boolean;
  lastPing: Date;
  latency: number;
  retryCount: number;
}

export class EnhancedIPCManager extends EventEmitter {
  private baseIPCManager: IPCManager;
  private metrics: IPCMetrics;
  private activeRequests: Map<string, IPCRequest> = new Map();
  private connectionStatus: Map<number, IPCConnectionStatus> = new Map();
  private requestTimeout: number = 30000; // 30 seconds
  private retryAttempts: number = 3;
  private retryDelay: number = 1000; // 1 second
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.baseIPCManager = new IPCManager();
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      activeConnections: 0,
      lastActivity: new Date()
    };
  }

  async initialize(): Promise<void> {
    try {
      // Initialize base IPC manager
      await this.baseIPCManager.initialize();
      
      // Set up enhanced IPC handlers
      this.setupEnhancedHandlers();
      
      // Start monitoring
      this.startMonitoring();
      
      console.log('Enhanced IPC Manager initialized');
    } catch (error) {
      console.error('Failed to initialize Enhanced IPC Manager:', error);
      throw error;
    }
  }

  setupHandlers(): void {
    // Set up base handlers
    this.baseIPCManager.setupHandlers();
    
    // Set up enhanced handlers
    this.setupEnhancedHandlers();
  }

  private setupEnhancedHandlers(): void {
    // IPC health check
    ipcMain.handle('ipc:health-check', async (event) => {
      const webContentsId = event.sender.id;
      const startTime = Date.now();
      
      try {
        // Update connection status
        this.updateConnectionStatus(webContentsId, true, Date.now() - startTime);
        
        return {
          success: true,
          timestamp: new Date(),
          metrics: this.getMetrics(),
          latency: Date.now() - startTime
        };
      } catch (error) {
        this.updateConnectionStatus(webContentsId, false, 0);
        return { success: false, error: (error as Error).message };
      }
    });

    // IPC metrics
    ipcMain.handle('ipc:get-metrics', async () => {
      return { success: true, metrics: this.getMetrics() };
    });

    // IPC connection status
    ipcMain.handle('ipc:get-connection-status', async (event) => {
      const webContentsId = event.sender.id;
      const status = this.connectionStatus.get(webContentsId);
      
      return {
        success: true,
        status: status || {
          connected: false,
          lastPing: new Date(0),
          latency: 0,
          retryCount: 0
        }
      };
    });

    // Enhanced request with retry logic
    ipcMain.handle('ipc:enhanced-request', async (event, requestData) => {
      return this.handleEnhancedRequest(event, requestData);
    });

    // Batch requests
    ipcMain.handle('ipc:batch-request', async (event, requests) => {
      return this.handleBatchRequest(event, requests);
    });

    // Connection monitoring
    this.setupConnectionMonitoring();
  }

  private async handleEnhancedRequest(event: Electron.IpcMainInvokeEvent, requestData: any): Promise<any> {
    const requestId = this.generateRequestId();
    const request: IPCRequest = {
      id: requestId,
      channel: requestData.channel,
      timestamp: new Date()
    };

    this.activeRequests.set(requestId, request);
    this.metrics.totalRequests++;

    try {
      const result = await this.executeWithRetry(async () => {
        return await this.processRequest(requestData);
      });

      // Update metrics
      request.responseTime = Date.now() - request.timestamp.getTime();
      request.success = true;
      this.metrics.successfulRequests++;
      this.updateAverageResponseTime(request.responseTime);

      return { success: true, data: result, requestId };

    } catch (error) {
      request.success = false;
      request.error = (error as Error).message;
      this.metrics.failedRequests++;

      console.error(`Enhanced IPC request failed: ${requestId}`, error);
      return { success: false, error: (error as Error).message, requestId };

    } finally {
      this.activeRequests.delete(requestId);
      this.metrics.lastActivity = new Date();
    }
  }

  private async handleBatchRequest(event: Electron.IpcMainInvokeEvent, requests: any[]): Promise<any> {
    const batchId = this.generateRequestId();
    const results = [];

    try {
      // Process requests in parallel with concurrency limit
      const concurrencyLimit = 5;
      const chunks = this.chunkArray(requests, concurrencyLimit);

      for (const chunk of chunks) {
        const chunkResults = await Promise.allSettled(
          chunk.map(request => this.handleEnhancedRequest(event, request))
        );

        results.push(...chunkResults.map(result => 
          result.status === 'fulfilled' ? result.value : { success: false, error: result.reason }
        ));
      }

      return { success: true, results, batchId };

    } catch (error) {
      console.error(`Batch request failed: ${batchId}`, error);
      return { success: false, error: (error as Error).message, batchId };
    }
  }

  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
      try {
        return await Promise.race([
          operation(),
          this.createTimeoutPromise<T>()
        ]);
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.retryAttempts - 1) {
          await this.delay(this.retryDelay * Math.pow(2, attempt)); // Exponential backoff
        }
      }
    }
    
    throw lastError!;
  }

  private async processRequest(requestData: any): Promise<any> {
    // This would route to the appropriate handler based on the request type
    // For now, we'll simulate processing
    await this.delay(Math.random() * 100); // Simulate processing time
    return { processed: true, data: requestData };
  }

  private createTimeoutPromise<T>(): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timeout after ${this.requestTimeout}ms`));
      }, this.requestTimeout);
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateConnectionStatus(webContentsId: number, connected: boolean, latency: number): void {
    const existing = this.connectionStatus.get(webContentsId) || {
      connected: false,
      lastPing: new Date(0),
      latency: 0,
      retryCount: 0
    };

    this.connectionStatus.set(webContentsId, {
      connected,
      lastPing: new Date(),
      latency,
      retryCount: connected ? 0 : existing.retryCount + 1
    });

    this.updateActiveConnections();
  }

  private updateActiveConnections(): void {
    this.metrics.activeConnections = Array.from(this.connectionStatus.values())
      .filter(status => status.connected).length;
  }

  private updateAverageResponseTime(responseTime: number): void {
    const totalResponseTime = this.metrics.averageResponseTime * (this.metrics.successfulRequests - 1);
    this.metrics.averageResponseTime = (totalResponseTime + responseTime) / this.metrics.successfulRequests;
  }

  private setupConnectionMonitoring(): void {
    // Monitor renderer process connections
    BrowserWindow.getAllWindows().forEach(window => {
      const webContentsId = window.webContents.id;
      
      window.webContents.on('destroyed', () => {
        this.connectionStatus.delete(webContentsId);
        this.updateActiveConnections();
      });

      window.on('closed', () => {
        this.connectionStatus.delete(webContentsId);
        this.updateActiveConnections();
      });
    });
  }

  private startMonitoring(): void {
    // Monitor IPC health every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, 30000);
  }

  private async performHealthCheck(): Promise<void> {
    try {
      const windows = BrowserWindow.getAllWindows();
      
      for (const window of windows) {
        if (!window.isDestroyed()) {
          const webContentsId = window.webContents.id;
          const startTime = Date.now();
          
          try {
            // Send ping to renderer
            window.webContents.send('ipc:ping', { timestamp: startTime });
            
            // Wait for pong response (handled separately)
            this.updateConnectionStatus(webContentsId, true, Date.now() - startTime);
          } catch (error) {
            this.updateConnectionStatus(webContentsId, false, 0);
          }
        }
      }
      
      // Clean up old connection statuses
      this.cleanupOldConnections();
      
    } catch (error) {
      console.error('Health check failed:', error);
    }
  }

  private cleanupOldConnections(): void {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    
    for (const [webContentsId, status] of this.connectionStatus.entries()) {
      if (now - status.lastPing.getTime() > maxAge) {
        this.connectionStatus.delete(webContentsId);
      }
    }
    
    this.updateActiveConnections();
  }

  getMetrics(): IPCMetrics {
    return { ...this.metrics };
  }

  getActiveRequests(): IPCRequest[] {
    return Array.from(this.activeRequests.values());
  }

  getConnectionStatuses(): Map<number, IPCConnectionStatus> {
    return new Map(this.connectionStatus);
  }

  cleanup(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.activeRequests.clear();
    this.connectionStatus.clear();
  }
}