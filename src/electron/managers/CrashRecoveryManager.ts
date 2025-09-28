/**
 * Crash Recovery Manager
 * Handles application crash detection, reporting, and recovery
 */

import { app, dialog, BrowserWindow } from 'electron';
import * as fs from 'fs-extra';
import * as path from 'path';
import { EventEmitter } from 'events';

export interface CrashReport {
  timestamp: Date;
  version: string;
  platform: string;
  error: string;
  stack?: string;
  userAgent?: string;
  sessionData?: any;
}

export interface RecoveryData {
  windowStates: any[];
  openFiles: string[];
  projectPath?: string;
  userPreferences: any;
  lastSaveTime: Date;
}

export class CrashRecoveryManager extends EventEmitter {
  private crashReportsDir: string;
  private recoveryDataPath: string;
  private sessionDataPath: string;
  private isRecovering: boolean = false;
  private saveInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    
    const userDataPath = app.getPath('userData');
    this.crashReportsDir = path.join(userDataPath, 'crash-reports');
    this.recoveryDataPath = path.join(userDataPath, 'recovery-data.json');
    this.sessionDataPath = path.join(userDataPath, 'session-data.json');
  }

  async initialize(): Promise<void> {
    try {
      // Ensure crash reports directory exists
      await fs.ensureDir(this.crashReportsDir);
      
      // Check for previous crash
      await this.checkForPreviousCrash();
      
      // Set up crash handlers
      this.setupCrashHandlers();
      
      // Start periodic session data saving
      this.startSessionDataSaving();
      
      console.log('Crash recovery manager initialized');
    } catch (error) {
      console.error('Failed to initialize crash recovery manager:', error);
      throw error;
    }
  }

  async saveRecoveryData(data: Partial<RecoveryData>): Promise<void> {
    try {
      const existingData = await this.loadRecoveryData();
      const updatedData: RecoveryData = {
        windowStates: [],
        openFiles: [],
        userPreferences: {},
        ...existingData,
        ...data,
        lastSaveTime: new Date()
      };
      
      await fs.writeJson(this.recoveryDataPath, updatedData, { spaces: 2 });
    } catch (error) {
      console.error('Failed to save recovery data:', error);
    }
  }

  async loadRecoveryData(): Promise<RecoveryData | null> {
    try {
      if (await fs.pathExists(this.recoveryDataPath)) {
        return await fs.readJson(this.recoveryDataPath);
      }
      return null;
    } catch (error) {
      console.error('Failed to load recovery data:', error);
      return null;
    }
  }

  async clearRecoveryData(): Promise<void> {
    try {
      if (await fs.pathExists(this.recoveryDataPath)) {
        await fs.remove(this.recoveryDataPath);
      }
    } catch (error) {
      console.error('Failed to clear recovery data:', error);
    }
  }

  async reportCrash(error: Error, additionalData?: any): Promise<void> {
    try {
      const crashReport: CrashReport = {
        timestamp: new Date(),
        version: app.getVersion(),
        platform: process.platform,
        error: error.message,
        stack: error.stack,
        userAgent: process.versions.electron,
        sessionData: additionalData
      };

      const reportPath = path.join(
        this.crashReportsDir,
        `crash-${Date.now()}.json`
      );

      await fs.writeJson(reportPath, crashReport, { spaces: 2 });
      
      console.log('Crash report saved:', reportPath);
      this.emit('crash-reported', crashReport);
      
      // Show crash dialog
      await this.showCrashDialog(crashReport);
      
    } catch (reportError) {
      console.error('Failed to report crash:', reportError);
    }
  }

  async getCrashReports(): Promise<CrashReport[]> {
    try {
      const files = await fs.readdir(this.crashReportsDir);
      const crashFiles = files.filter(file => file.startsWith('crash-') && file.endsWith('.json'));
      
      const reports: CrashReport[] = [];
      for (const file of crashFiles) {
        try {
          const report = await fs.readJson(path.join(this.crashReportsDir, file));
          reports.push(report);
        } catch (error) {
          console.error(`Failed to read crash report ${file}:`, error);
        }
      }
      
      return reports.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Failed to get crash reports:', error);
      return [];
    }
  }

  async cleanupOldCrashReports(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const files = await fs.readdir(this.crashReportsDir);
      const now = Date.now();
      
      for (const file of files) {
        const filePath = path.join(this.crashReportsDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.remove(filePath);
          console.log('Removed old crash report:', file);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old crash reports:', error);
    }
  }

  async showRecoveryDialog(): Promise<boolean> {
    try {
      const result = await dialog.showMessageBox({
        type: 'question',
        title: 'Application Recovery',
        message: 'The application was not closed properly last time.',
        detail: 'Would you like to restore your previous session?',
        buttons: ['Restore Session', 'Start Fresh'],
        defaultId: 0,
        cancelId: 1
      });

      return result.response === 0;
    } catch (error) {
      console.error('Failed to show recovery dialog:', error);
      return false;
    }
  }

  private async checkForPreviousCrash(): Promise<void> {
    try {
      const recoveryData = await this.loadRecoveryData();
      
      if (recoveryData) {
        const timeSinceLastSave = Date.now() - new Date(recoveryData.lastSaveTime).getTime();
        
        // If last save was more than 5 minutes ago, consider it a crash
        if (timeSinceLastSave > 5 * 60 * 1000) {
          this.isRecovering = true;
          this.emit('crash-detected', recoveryData);
          
          // Show recovery dialog
          const shouldRecover = await this.showRecoveryDialog();
          
          if (shouldRecover) {
            this.emit('recovery-requested', recoveryData);
          } else {
            await this.clearRecoveryData();
          }
        } else {
          // Normal shutdown, clear recovery data
          await this.clearRecoveryData();
        }
      }
    } catch (error) {
      console.error('Failed to check for previous crash:', error);
    }
  }

  private setupCrashHandlers(): void {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      this.reportCrash(error).finally(() => {
        process.exit(1);
      });
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.reportCrash(error);
    });

    // Handle app crashes
    app.on('render-process-gone', (event, webContents, details) => {
      console.error('Renderer process gone:', details);
      const error = new Error(`Renderer process crashed: ${details.reason}`);
      this.reportCrash(error, { details });
    });

    app.on('child-process-gone', (event, details) => {
      console.error('Child process gone:', details);
      const error = new Error(`Child process crashed: ${details.reason}`);
      this.reportCrash(error, { details });
    });

    // Handle app before quit
    app.on('before-quit', () => {
      this.cleanup();
    });
  }

  private startSessionDataSaving(): void {
    // Save session data every 30 seconds
    this.saveInterval = setInterval(() => {
      this.saveCurrentSession();
    }, 30 * 1000);
  }

  private async saveCurrentSession(): Promise<void> {
    try {
      const windows = BrowserWindow.getAllWindows();
      const windowStates = windows.map(window => ({
        id: window.id,
        bounds: window.getBounds(),
        isMaximized: window.isMaximized(),
        isMinimized: window.isMinimized(),
        isFullScreen: window.isFullScreen()
      }));

      await this.saveRecoveryData({
        windowStates,
        openFiles: [], // TODO: Get from file manager
        userPreferences: {} // TODO: Get from settings
      });
    } catch (error) {
      console.error('Failed to save current session:', error);
    }
  }

  private async showCrashDialog(crashReport: CrashReport): Promise<void> {
    try {
      const result = await dialog.showMessageBox({
        type: 'error',
        title: 'Application Crashed',
        message: 'The application has encountered an unexpected error.',
        detail: `Error: ${crashReport.error}\n\nA crash report has been saved. Would you like to restart the application?`,
        buttons: ['Restart', 'Close'],
        defaultId: 0,
        cancelId: 1
      });

      if (result.response === 0) {
        app.relaunch();
        app.exit(0);
      }
    } catch (error) {
      console.error('Failed to show crash dialog:', error);
    }
  }

  async cleanup(): Promise<void> {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      this.saveInterval = null;
    }
    
    // Clear recovery data on normal shutdown
    try {
      await this.clearRecoveryData();
      console.log('Recovery data cleared on normal shutdown');
    } catch (error) {
      console.error('Failed to clear recovery data:', error);
    }
  }

  isInRecoveryMode(): boolean {
    return this.isRecovering;
  }
}