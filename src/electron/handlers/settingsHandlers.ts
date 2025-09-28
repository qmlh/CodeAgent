import { ipcMain, dialog } from 'electron';
import { SettingsService } from '../services/SettingsService';

export class SettingsHandlers {
  private settingsService: SettingsService;

  constructor() {
    this.settingsService = new SettingsService();
    this.registerHandlers();
  }

  private registerHandlers(): void {
    // Settings operations
    ipcMain.handle('settings:load', async () => {
      try {
        return await this.settingsService.loadSettings();
      } catch (error) {
        console.error('Failed to load settings:', error);
        throw error;
      }
    });

    ipcMain.handle('settings:save', async (event, settings) => {
      try {
        await this.settingsService.saveSettings(settings);
        return { success: true };
      } catch (error) {
        console.error('Failed to save settings:', error);
        throw error;
      }
    });

    ipcMain.handle('settings:export', async (event, filePath, settings) => {
      try {
        await this.settingsService.exportSettings(filePath, settings);
        return { success: true };
      } catch (error) {
        console.error('Failed to export settings:', error);
        throw error;
      }
    });

    ipcMain.handle('settings:import', async (event, filePath) => {
      try {
        return await this.settingsService.importSettings(filePath);
      } catch (error) {
        console.error('Failed to import settings:', error);
        throw error;
      }
    });

    // Backup operations
    ipcMain.handle('settings:create-backup', async (event, name) => {
      try {
        return await this.settingsService.createBackup(name);
      } catch (error) {
        console.error('Failed to create backup:', error);
        throw error;
      }
    });

    ipcMain.handle('settings:restore-backup', async (event, backupId) => {
      try {
        return await this.settingsService.restoreBackup(backupId);
      } catch (error) {
        console.error('Failed to restore backup:', error);
        throw error;
      }
    });

    ipcMain.handle('settings:list-backups', async () => {
      try {
        return await this.settingsService.listBackups();
      } catch (error) {
        console.error('Failed to list backups:', error);
        throw error;
      }
    });

    ipcMain.handle('settings:delete-backup', async (event, backupId) => {
      try {
        await this.settingsService.deleteBackup(backupId);
        return { success: true };
      } catch (error) {
        console.error('Failed to delete backup:', error);
        throw error;
      }
    });

    // Update operations
    ipcMain.handle('updates:check', async () => {
      try {
        return await this.settingsService.checkForUpdates();
      } catch (error) {
        console.error('Failed to check for updates:', error);
        throw error;
      }
    });

    ipcMain.handle('updates:download', async (event, updateInfo) => {
      try {
        await this.settingsService.downloadUpdate(updateInfo);
        return { success: true };
      } catch (error) {
        console.error('Failed to download update:', error);
        throw error;
      }
    });

    ipcMain.handle('updates:install', async (event, updateInfo) => {
      try {
        // TODO: Implement update installation
        console.log('Installing update:', updateInfo.version);
        return { success: true };
      } catch (error) {
        console.error('Failed to install update:', error);
        throw error;
      }
    });

    // Dialog operations
    ipcMain.handle('dialog:show-open-dialog', async (event, options) => {
      try {
        return await dialog.showOpenDialog(options);
      } catch (error) {
        console.error('Failed to show open dialog:', error);
        throw error;
      }
    });

    ipcMain.handle('dialog:show-save-dialog', async (event, options) => {
      try {
        return await dialog.showSaveDialog(options);
      } catch (error) {
        console.error('Failed to show save dialog:', error);
        throw error;
      }
    });

    ipcMain.handle('dialog:show-message-box', async (event, options) => {
      try {
        return await dialog.showMessageBox(options);
      } catch (error) {
        console.error('Failed to show message box:', error);
        throw error;
      }
    });
  }
}