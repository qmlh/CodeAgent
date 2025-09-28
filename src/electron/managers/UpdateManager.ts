/**
 * Update Manager
 * Handles application updates with UI feedback
 */

import { autoUpdater, UpdateInfo, ProgressInfo } from 'electron-updater';
import { BrowserWindow, dialog, app } from 'electron';
import { EventEmitter } from 'events';

export interface UpdateStatus {
  available: boolean;
  downloading: boolean;
  downloaded: boolean;
  error: string | null;
  info?: UpdateInfo;
  progress?: ProgressInfo;
}

export class UpdateManager extends EventEmitter {
  private updateStatus: UpdateStatus;
  private isDevelopment: boolean;
  private checkInterval: NodeJS.Timeout | null = null;
  private updateWindow: BrowserWindow | null = null;

  constructor() {
    super();
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.updateStatus = {
      available: false,
      downloading: false,
      downloaded: false,
      error: null
    };
    
    this.setupAutoUpdater();
  }

  async initialize(): Promise<void> {
    if (this.isDevelopment) {
      console.log('Update manager initialized (development mode - updates disabled)');
      return;
    }

    try {
      // Configure auto updater
      autoUpdater.autoDownload = false;
      autoUpdater.autoInstallOnAppQuit = false;
      
      // Check for updates on startup
      await this.checkForUpdates();
      
      // Set up periodic checks (every 4 hours)
      this.checkInterval = setInterval(() => {
        this.checkForUpdates();
      }, 4 * 60 * 60 * 1000);
      
      console.log('Update manager initialized');
    } catch (error) {
      console.error('Failed to initialize update manager:', error);
    }
  }

  async checkForUpdates(): Promise<void> {
    if (this.isDevelopment) {
      return;
    }

    try {
      console.log('Checking for updates...');
      await autoUpdater.checkForUpdates();
    } catch (error) {
      console.error('Failed to check for updates:', error);
      this.updateStatus.error = (error as Error).message;
      this.emit('error', error);
    }
  }

  async downloadUpdate(): Promise<void> {
    if (this.isDevelopment || !this.updateStatus.available) {
      return;
    }

    try {
      this.updateStatus.downloading = true;
      this.emit('download-started');
      
      await autoUpdater.downloadUpdate();
    } catch (error) {
      console.error('Failed to download update:', error);
      this.updateStatus.downloading = false;
      this.updateStatus.error = (error as Error).message;
      this.emit('error', error);
    }
  }

  async installUpdate(): Promise<void> {
    if (!this.updateStatus.downloaded) {
      return;
    }

    try {
      // Show confirmation dialog
      const result = await this.showInstallConfirmation();
      
      if (result) {
        autoUpdater.quitAndInstall();
      }
    } catch (error) {
      console.error('Failed to install update:', error);
      this.updateStatus.error = (error as Error).message;
      this.emit('error', error);
    }
  }

  getUpdateStatus(): UpdateStatus {
    return { ...this.updateStatus };
  }

  async showUpdateDialog(): Promise<void> {
    if (!this.updateStatus.available || this.updateWindow) {
      return;
    }

    try {
      this.updateWindow = new BrowserWindow({
        width: 500,
        height: 400,
        resizable: false,
        minimizable: false,
        maximizable: false,
        modal: true,
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      });

      // Load update dialog content
      await this.updateWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(this.getUpdateDialogHTML()));

      this.updateWindow.once('ready-to-show', () => {
        if (this.updateWindow) {
          this.updateWindow.show();
        }
      });

      this.updateWindow.on('closed', () => {
        this.updateWindow = null;
      });

      // Handle update dialog actions
      this.updateWindow.webContents.on('ipc-message', (event, channel, ...args) => {
        switch (channel) {
          case 'download-update':
            this.downloadUpdate();
            break;
          case 'install-update':
            this.installUpdate();
            break;
          case 'skip-update':
            if (this.updateWindow) {
              this.updateWindow.close();
            }
            break;
        }
      });

    } catch (error) {
      console.error('Failed to show update dialog:', error);
    }
  }

  private setupAutoUpdater(): void {
    if (this.isDevelopment) {
      return;
    }

    autoUpdater.on('checking-for-update', () => {
      console.log('Checking for update...');
      this.emit('checking');
    });

    autoUpdater.on('update-available', (info: UpdateInfo) => {
      console.log('Update available:', info.version);
      this.updateStatus.available = true;
      this.updateStatus.info = info;
      this.updateStatus.error = null;
      this.emit('available', info);
      
      // Show update notification
      this.showUpdateNotification(info);
    });

    autoUpdater.on('update-not-available', (info: UpdateInfo) => {
      console.log('Update not available');
      this.updateStatus.available = false;
      this.updateStatus.info = info;
      this.emit('not-available', info);
    });

    autoUpdater.on('error', (error: Error) => {
      console.error('Auto updater error:', error);
      this.updateStatus.error = error.message;
      this.updateStatus.downloading = false;
      this.emit('error', error);
    });

    autoUpdater.on('download-progress', (progress: ProgressInfo) => {
      this.updateStatus.progress = progress;
      this.emit('download-progress', progress);
      
      // Update progress in update window if open
      if (this.updateWindow) {
        this.updateWindow.webContents.send('download-progress', progress);
      }
    });

    autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
      console.log('Update downloaded:', info.version);
      this.updateStatus.downloading = false;
      this.updateStatus.downloaded = true;
      this.emit('downloaded', info);
      
      // Show install confirmation
      this.showInstallNotification();
    });
  }

  private async showUpdateNotification(info: UpdateInfo): Promise<void> {
    try {
      const result = await dialog.showMessageBox({
        type: 'info',
        title: 'Update Available',
        message: `A new version (${info.version}) is available!`,
        detail: 'Would you like to download and install it now?',
        buttons: ['Download Now', 'Download Later', 'Skip This Version'],
        defaultId: 0,
        cancelId: 2
      });

      switch (result.response) {
        case 0: // Download Now
          await this.downloadUpdate();
          break;
        case 1: // Download Later
          // User will be notified again later
          break;
        case 2: // Skip This Version
          // Don't notify for this version again
          break;
      }
    } catch (error) {
      console.error('Failed to show update notification:', error);
    }
  }

  private async showInstallNotification(): Promise<void> {
    try {
      const result = await dialog.showMessageBox({
        type: 'info',
        title: 'Update Ready',
        message: 'Update has been downloaded and is ready to install.',
        detail: 'The application will restart to complete the installation.',
        buttons: ['Install Now', 'Install on Next Restart'],
        defaultId: 0,
        cancelId: 1
      });

      if (result.response === 0) {
        await this.installUpdate();
      }
    } catch (error) {
      console.error('Failed to show install notification:', error);
    }
  }

  private async showInstallConfirmation(): Promise<boolean> {
    try {
      const result = await dialog.showMessageBox({
        type: 'question',
        title: 'Install Update',
        message: 'Are you sure you want to install the update now?',
        detail: 'The application will close and restart automatically.',
        buttons: ['Install', 'Cancel'],
        defaultId: 0,
        cancelId: 1
      });

      return result.response === 0;
    } catch (error) {
      console.error('Failed to show install confirmation:', error);
      return false;
    }
  }

  private getUpdateDialogHTML(): string {
    const info = this.updateStatus.info;
    const progress = this.updateStatus.progress;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Update Available</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
          }
          .container {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
          }
          .version {
            font-size: 24px;
            font-weight: bold;
            color: #007acc;
          }
          .details {
            margin: 20px 0;
          }
          .progress {
            width: 100%;
            height: 20px;
            background: #e0e0e0;
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
          }
          .progress-bar {
            height: 100%;
            background: #007acc;
            transition: width 0.3s ease;
          }
          .buttons {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
          }
          button {
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
          }
          .primary {
            background: #007acc;
            color: white;
          }
          .secondary {
            background: #e0e0e0;
            color: #333;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Update Available</h2>
            <div class="version">Version ${info?.version || 'Unknown'}</div>
          </div>
          
          <div class="details">
            <p>A new version of Multi-Agent IDE is available.</p>
            ${info?.releaseNotes ? `<p><strong>Release Notes:</strong></p><p>${info.releaseNotes}</p>` : ''}
          </div>
          
          ${this.updateStatus.downloading ? `
            <div class="progress">
              <div class="progress-bar" style="width: ${progress?.percent || 0}%"></div>
            </div>
            <p>Downloading... ${Math.round(progress?.percent || 0)}%</p>
          ` : ''}
          
          <div class="buttons">
            <button class="secondary" onclick="skipUpdate()">Skip</button>
            ${!this.updateStatus.downloading && !this.updateStatus.downloaded ? 
              '<button class="primary" onclick="downloadUpdate()">Download</button>' : ''}
            ${this.updateStatus.downloaded ? 
              '<button class="primary" onclick="installUpdate()">Install</button>' : ''}
          </div>
        </div>
        
        <script>
          function downloadUpdate() {
            require('electron').ipcRenderer.send('download-update');
          }
          
          function installUpdate() {
            require('electron').ipcRenderer.send('install-update');
          }
          
          function skipUpdate() {
            require('electron').ipcRenderer.send('skip-update');
          }
          
          require('electron').ipcRenderer.on('download-progress', (event, progress) => {
            const progressBar = document.querySelector('.progress-bar');
            if (progressBar) {
              progressBar.style.width = progress.percent + '%';
            }
          });
        </script>
      </body>
      </html>
    `;
  }

  cleanup(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    if (this.updateWindow && !this.updateWindow.isDestroyed()) {
      this.updateWindow.close();
      this.updateWindow = null;
    }
  }
}