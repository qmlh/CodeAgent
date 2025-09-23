/**
 * Menu Manager
 * Handles application menu creation and management
 */

import { Menu, MenuItem, MenuItemConstructorOptions, app, shell, dialog } from 'electron';
import { WindowManager } from './WindowManager';

export class MenuManager {
  private windowManager: WindowManager;
  private applicationMenu: Menu | null = null;

  constructor() {
    this.windowManager = new WindowManager();
  }

  async initialize(): Promise<void> {
    console.log('MenuManager initialized');
  }

  createApplicationMenu(): void {
    const template = this.getMenuTemplate();
    this.applicationMenu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(this.applicationMenu);
  }

  createContextMenu(options: MenuItemConstructorOptions[]): Menu {
    return Menu.buildFromTemplate(options);
  }

  private getMenuTemplate(): MenuItemConstructorOptions[] {
    const isMac = process.platform === 'darwin';

    const template: MenuItemConstructorOptions[] = [
      // App Menu (macOS only)
      ...(isMac ? [{
        label: app.getName(),
        submenu: [
          { role: 'about' as const },
          { type: 'separator' as const },
          { role: 'services' as const },
          { type: 'separator' as const },
          { role: 'hide' as const },
          { role: 'hideothers' as const },
          { role: 'unhide' as const },
          { type: 'separator' as const },
          { role: 'quit' as const }
        ]
      }] : []),

      // File Menu
      {
        label: 'File',
        submenu: [
          {
            label: 'New Project',
            accelerator: 'CmdOrCtrl+N',
            click: () => this.handleNewProject()
          },
          {
            label: 'Open Project',
            accelerator: 'CmdOrCtrl+O',
            click: () => this.handleOpenProject()
          },
          {
            label: 'Open Recent',
            submenu: this.getRecentProjectsMenu()
          },
          { type: 'separator' },
          {
            label: 'Save',
            accelerator: 'CmdOrCtrl+S',
            click: () => this.handleSave()
          },
          {
            label: 'Save As...',
            accelerator: 'CmdOrCtrl+Shift+S',
            click: () => this.handleSaveAs()
          },
          {
            label: 'Save All',
            accelerator: 'CmdOrCtrl+Alt+S',
            click: () => this.handleSaveAll()
          },
          { type: 'separator' },
          {
            label: 'Close File',
            accelerator: 'CmdOrCtrl+W',
            click: () => this.handleCloseFile()
          },
          {
            label: 'Close Project',
            accelerator: 'CmdOrCtrl+Shift+W',
            click: () => this.handleCloseProject()
          },
          { type: 'separator' },
          ...(isMac ? [] : [{
            label: 'Exit',
            accelerator: 'CmdOrCtrl+Q',
            click: () => app.quit()
          }])
        ]
      },

      // Edit Menu
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' as const },
          { role: 'redo' as const },
          { type: 'separator' },
          { role: 'cut' as const },
          { role: 'copy' as const },
          { role: 'paste' as const },
          { role: 'selectall' as const },
          { type: 'separator' },
          {
            label: 'Find',
            accelerator: 'CmdOrCtrl+F',
            click: () => this.handleFind()
          },
          {
            label: 'Find and Replace',
            accelerator: 'CmdOrCtrl+H',
            click: () => this.handleFindReplace()
          },
          {
            label: 'Find in Files',
            accelerator: 'CmdOrCtrl+Shift+F',
            click: () => this.handleFindInFiles()
          }
        ]
      },

      // View Menu
      {
        label: 'View',
        submenu: [
          {
            label: 'Command Palette',
            accelerator: 'CmdOrCtrl+Shift+P',
            click: () => this.handleCommandPalette()
          },
          { type: 'separator' },
          {
            label: 'Explorer',
            accelerator: 'CmdOrCtrl+Shift+E',
            click: () => this.handleToggleExplorer()
          },
          {
            label: 'Agent Panel',
            accelerator: 'CmdOrCtrl+Shift+A',
            click: () => this.handleToggleAgentPanel()
          },
          {
            label: 'Task Panel',
            accelerator: 'CmdOrCtrl+Shift+T',
            click: () => this.handleToggleTaskPanel()
          },
          {
            label: 'Terminal',
            accelerator: 'CmdOrCtrl+`',
            click: () => this.handleToggleTerminal()
          },
          { type: 'separator' },
          {
            label: 'Split Editor Right',
            accelerator: 'CmdOrCtrl+\\',
            click: () => this.handleSplitEditor('right')
          },
          {
            label: 'Split Editor Down',
            accelerator: 'CmdOrCtrl+Shift+\\',
            click: () => this.handleSplitEditor('down')
          },
          { type: 'separator' },
          { role: 'reload' as const },
          { role: 'forceReload' as const },
          { role: 'toggleDevTools' as const },
          { type: 'separator' },
          { role: 'resetZoom' as const },
          { role: 'zoomIn' as const },
          { role: 'zoomOut' as const },
          { type: 'separator' },
          { role: 'togglefullscreen' as const }
        ]
      },

      // Agents Menu
      {
        label: 'Agents',
        submenu: [
          {
            label: 'Create New Agent',
            accelerator: 'CmdOrCtrl+Shift+N',
            click: () => this.handleCreateAgent()
          },
          {
            label: 'Start All Agents',
            click: () => this.handleStartAllAgents()
          },
          {
            label: 'Stop All Agents',
            click: () => this.handleStopAllAgents()
          },
          { type: 'separator' },
          {
            label: 'Agent Settings',
            click: () => this.handleAgentSettings()
          }
        ]
      },

      // Tasks Menu
      {
        label: 'Tasks',
        submenu: [
          {
            label: 'Create Task',
            accelerator: 'CmdOrCtrl+Shift+K',
            click: () => this.handleCreateTask()
          },
          {
            label: 'Task Board',
            accelerator: 'CmdOrCtrl+Shift+B',
            click: () => this.handleTaskBoard()
          },
          {
            label: 'Task Timeline',
            click: () => this.handleTaskTimeline()
          }
        ]
      },

      // Window Menu
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' as const },
          { role: 'close' as const },
          ...(isMac ? [
            { type: 'separator' as const },
            { role: 'front' as const }
          ] : [])
        ]
      },

      // Help Menu
      {
        label: 'Help',
        submenu: [
          {
            label: 'Documentation',
            click: () => shell.openExternal('https://github.com/multi-agent-ide/docs')
          },
          {
            label: 'Keyboard Shortcuts',
            accelerator: 'CmdOrCtrl+K CmdOrCtrl+S',
            click: () => this.handleKeyboardShortcuts()
          },
          {
            label: 'Report Issue',
            click: () => shell.openExternal('https://github.com/multi-agent-ide/issues')
          },
          { type: 'separator' },
          {
            label: 'Check for Updates',
            click: () => this.handleCheckUpdates()
          },
          ...(isMac ? [] : [{
            label: 'About',
            click: () => this.handleAbout()
          }])
        ]
      }
    ];

    return template;
  }

  private getRecentProjectsMenu(): MenuItemConstructorOptions[] {
    // TODO: Implement recent projects from storage
    return [
      {
        label: 'No recent projects',
        enabled: false
      }
    ];
  }

  // Menu action handlers
  private handleNewProject(): void {
    const mainWindow = this.windowManager.getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('menu-action', { action: 'new-project' });
    }
  }

  private async handleOpenProject(): Promise<void> {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Open Project Folder'
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const mainWindow = this.windowManager.getMainWindow();
      if (mainWindow) {
        mainWindow.webContents.send('menu-action', {
          action: 'open-project',
          path: result.filePaths[0]
        });
      }
    }
  }

  private handleSave(): void {
    const mainWindow = this.windowManager.getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('menu-action', { action: 'save' });
    }
  }

  private handleSaveAs(): void {
    const mainWindow = this.windowManager.getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('menu-action', { action: 'save-as' });
    }
  }

  private handleSaveAll(): void {
    const mainWindow = this.windowManager.getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('menu-action', { action: 'save-all' });
    }
  }

  private handleCloseFile(): void {
    const mainWindow = this.windowManager.getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('menu-action', { action: 'close-file' });
    }
  }

  private handleCloseProject(): void {
    const mainWindow = this.windowManager.getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('menu-action', { action: 'close-project' });
    }
  }

  private handleFind(): void {
    const mainWindow = this.windowManager.getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('menu-action', { action: 'find' });
    }
  }

  private handleFindReplace(): void {
    const mainWindow = this.windowManager.getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('menu-action', { action: 'find-replace' });
    }
  }

  private handleFindInFiles(): void {
    const mainWindow = this.windowManager.getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('menu-action', { action: 'find-in-files' });
    }
  }

  private handleCommandPalette(): void {
    const mainWindow = this.windowManager.getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('menu-action', { action: 'command-palette' });
    }
  }

  private handleToggleExplorer(): void {
    const mainWindow = this.windowManager.getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('menu-action', { action: 'toggle-explorer' });
    }
  }

  private handleToggleAgentPanel(): void {
    const mainWindow = this.windowManager.getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('menu-action', { action: 'toggle-agent-panel' });
    }
  }

  private handleToggleTaskPanel(): void {
    const mainWindow = this.windowManager.getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('menu-action', { action: 'toggle-task-panel' });
    }
  }

  private handleToggleTerminal(): void {
    const mainWindow = this.windowManager.getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('menu-action', { action: 'toggle-terminal' });
    }
  }

  private handleSplitEditor(direction: 'right' | 'down'): void {
    const mainWindow = this.windowManager.getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('menu-action', {
        action: 'split-editor',
        direction
      });
    }
  }

  private handleCreateAgent(): void {
    const mainWindow = this.windowManager.getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('menu-action', { action: 'create-agent' });
    }
  }

  private handleStartAllAgents(): void {
    const mainWindow = this.windowManager.getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('menu-action', { action: 'start-all-agents' });
    }
  }

  private handleStopAllAgents(): void {
    const mainWindow = this.windowManager.getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('menu-action', { action: 'stop-all-agents' });
    }
  }

  private handleAgentSettings(): void {
    const mainWindow = this.windowManager.getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('menu-action', { action: 'agent-settings' });
    }
  }

  private handleCreateTask(): void {
    const mainWindow = this.windowManager.getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('menu-action', { action: 'create-task' });
    }
  }

  private handleTaskBoard(): void {
    const mainWindow = this.windowManager.getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('menu-action', { action: 'task-board' });
    }
  }

  private handleTaskTimeline(): void {
    const mainWindow = this.windowManager.getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('menu-action', { action: 'task-timeline' });
    }
  }

  private handleKeyboardShortcuts(): void {
    const mainWindow = this.windowManager.getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('menu-action', { action: 'keyboard-shortcuts' });
    }
  }

  private handleCheckUpdates(): void {
    const mainWindow = this.windowManager.getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('menu-action', { action: 'check-updates' });
    }
  }

  private handleAbout(): void {
    dialog.showMessageBox({
      type: 'info',
      title: 'About Multi-Agent IDE',
      message: 'Multi-Agent IDE',
      detail: 'A collaborative IDE with multiple AI agents\nVersion 1.0.0'
    });
  }
}