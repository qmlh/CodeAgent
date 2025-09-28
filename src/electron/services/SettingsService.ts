import { app, dialog } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { AppSettings, BackupInfo, UpdateInfo } from '../../renderer/types/settings';

export class SettingsService {
  private settingsPath: string;
  private backupsPath: string;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.settingsPath = path.join(userDataPath, 'settings.json');
    this.backupsPath = path.join(userDataPath, 'backups');
    this.ensureDirectories();
  }

  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.backupsPath, { recursive: true });
    } catch (error) {
      console.error('Failed to create directories:', error);
    }
  }

  async loadSettings(): Promise<Partial<AppSettings>> {
    try {
      const data = await fs.readFile(this.settingsPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.log('Settings file not found, using defaults');
      return {};
    }
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await fs.writeFile(this.settingsPath, JSON.stringify(settings, null, 2));
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  async exportSettings(filePath: string, settings: AppSettings): Promise<void> {
    try {
      await fs.writeFile(filePath, JSON.stringify(settings, null, 2));
    } catch (error) {
      console.error('Failed to export settings:', error);
      throw error;
    }
  }

  async importSettings(filePath: string): Promise<AppSettings> {
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to import settings:', error);
      throw error;
    }
  }

  async createBackup(name: string): Promise<BackupInfo> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupId = `backup_${timestamp}`;
      const backupPath = path.join(this.backupsPath, `${backupId}.json`);

      // Read current settings
      const settings = await this.loadSettings();
      
      // Create backup file
      await fs.writeFile(backupPath, JSON.stringify(settings, null, 2));
      
      // Get file stats
      const stats = await fs.stat(backupPath);
      
      const backupInfo: BackupInfo = {
        id: backupId,
        name: name || `Backup ${new Date().toLocaleString()}`,
        size: stats.size,
        createdAt: new Date(),
        type: 'manual'
      };

      return backupInfo;
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw error;
    }
  }

  async restoreBackup(backupId: string): Promise<AppSettings> {
    try {
      const backupPath = path.join(this.backupsPath, `${backupId}.json`);
      const data = await fs.readFile(backupPath, 'utf-8');
      const settings = JSON.parse(data);
      
      // Save restored settings as current
      await this.saveSettings(settings);
      
      return settings;
    } catch (error) {
      console.error('Failed to restore backup:', error);
      throw error;
    }
  }

  async listBackups(): Promise<BackupInfo[]> {
    try {
      const files = await fs.readdir(this.backupsPath);
      const backups: BackupInfo[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.backupsPath, file);
          const stats = await fs.stat(filePath);
          const backupId = file.replace('.json', '');
          
          backups.push({
            id: backupId,
            name: `Backup ${stats.birthtime.toLocaleString()}`,
            size: stats.size,
            createdAt: stats.birthtime,
            type: backupId.includes('auto') ? 'auto' : 'manual'
          });
        }
      }

      return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Failed to list backups:', error);
      return [];
    }
  }

  async deleteBackup(backupId: string): Promise<void> {
    try {
      const backupPath = path.join(this.backupsPath, `${backupId}.json`);
      await fs.unlink(backupPath);
    } catch (error) {
      console.error('Failed to delete backup:', error);
      throw error;
    }
  }

  async checkForUpdates(): Promise<UpdateInfo[]> {
    // Mock implementation - in real app, this would check update server
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockUpdates: UpdateInfo[] = [
          {
            version: '1.1.0',
            releaseDate: new Date('2024-02-01'),
            downloadUrl: 'https://example.com/update/1.1.0',
            changelog: `新功能:
- 改进的Agent协作算法
- 新增代码审查Agent
- 性能优化

修复:
- 修复文件锁定问题
- 修复内存泄漏
- 修复UI响应问题`,
            size: 45 * 1024 * 1024, // 45MB
            isSecurityUpdate: false,
            isCritical: false
          }
        ];
        resolve(mockUpdates);
      }, 1000);
    });
  }

  async downloadUpdate(updateInfo: UpdateInfo): Promise<void> {
    // Mock implementation - in real app, this would download the update
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Downloaded update ${updateInfo.version}`);
        resolve();
      }, 2000);
    });
  }

  async showSelectDirectoryDialog(): Promise<string | null> {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select Backup Directory'
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  }

  async showSaveDialog(defaultName: string): Promise<string | null> {
    const result = await dialog.showSaveDialog({
      title: 'Export Settings',
      defaultPath: defaultName,
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (result.canceled || !result.filePath) {
      return null;
    }

    return result.filePath;
  }

  async showOpenDialog(): Promise<string | null> {
    const result = await dialog.showOpenDialog({
      title: 'Import Settings',
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  }
}