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
          { role: 'hideOthers' as const },
          { role: 'unhide' as const },
          { type: 'separator' as const },
          { role: 'quit' as const }
        ]
      }] : []),

      // 文件菜单
      {
        label: '文件',
        submenu: [
          {
            label: '新建项目',
            accelerator: 'CmdOrCtrl+N',
            click: () => this.handleNewProject()
          },
          {
            label: '打开项目',
            accelerator: 'CmdOrCtrl+O',
            click: () => this.handleOpenProject()
          },
          {
            label: '最近打开',
            submenu: this.getRecentProjectsMenu()
          },
          { type: 'separator' },
          {
            label: '保存',
            accelerator: 'CmdOrCtrl+S',
            click: () => this.handleSave()
          },
          {
            label: '另存为...',
            accelerator: 'CmdOrCtrl+Shift+S',
            click: () => this.handleSaveAs()
          },
          {
            label: '全部保存',
            accelerator: 'CmdOrCtrl+Alt+S',
            click: () => this.handleSaveAll()
          },
          { type: 'separator' },
          {
            label: '关闭文件',
            accelerator: 'CmdOrCtrl+W',
            click: () => this.handleCloseFile()
          },
          {
            label: '关闭项目',
            accelerator: 'CmdOrCtrl+Shift+W',
            click: () => this.handleCloseProject()
          },
          { type: 'separator' },
          ...(isMac ? [] : [{
            label: '退出',
            accelerator: 'CmdOrCtrl+Q',
            click: () => app.quit()
          }])
        ]
      },

      // 编辑菜单
      {
        label: '编辑',
        submenu: [
          { role: 'undo' as const },
          { role: 'redo' as const },
          { type: 'separator' },
          { role: 'cut' as const },
          { role: 'copy' as const },
          { role: 'paste' as const },
          { role: 'selectAll' as const },
          { type: 'separator' },
          {
            label: '查找',
            accelerator: 'CmdOrCtrl+F',
            click: () => this.handleFind()
          },
          {
            label: '查找和替换',
            accelerator: 'CmdOrCtrl+H',
            click: () => this.handleFindReplace()
          },
          {
            label: '在文件中查找',
            accelerator: 'CmdOrCtrl+Shift+F',
            click: () => this.handleFindInFiles()
          }
        ]
      },

      // 视图菜单
      {
        label: '视图',
        submenu: [
          {
            label: '命令面板',
            accelerator: 'CmdOrCtrl+Shift+P',
            click: () => this.handleCommandPalette()
          },
          { type: 'separator' },
          {
            label: '资源管理器',
            accelerator: 'CmdOrCtrl+Shift+E',
            click: () => this.handleToggleExplorer()
          },
          {
            label: 'Agent面板',
            accelerator: 'CmdOrCtrl+Shift+A',
            click: () => this.handleToggleAgentPanel()
          },
          {
            label: '任务面板',
            accelerator: 'CmdOrCtrl+Shift+T',
            click: () => this.handleToggleTaskPanel()
          },
          {
            label: '终端',
            accelerator: 'CmdOrCtrl+`',
            click: () => this.handleToggleTerminal()
          },
          { type: 'separator' },
          {
            label: '向右拆分编辑器',
            accelerator: 'CmdOrCtrl+\\',
            click: () => this.handleSplitEditor('right')
          },
          {
            label: '向下拆分编辑器',
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

      // Agent菜单
      {
        label: 'Agent',
        submenu: [
          {
            label: '创建新Agent',
            accelerator: 'CmdOrCtrl+Shift+N',
            click: () => this.handleCreateAgent()
          },
          {
            label: '启动所有Agent',
            click: () => this.handleStartAllAgents()
          },
          {
            label: '停止所有Agent',
            click: () => this.handleStopAllAgents()
          },
          { type: 'separator' },
          {
            label: 'Agent设置',
            click: () => this.handleAgentSettings()
          }
        ]
      },

      // 任务菜单
      {
        label: '任务',
        submenu: [
          {
            label: '创建任务',
            accelerator: 'CmdOrCtrl+Shift+K',
            click: () => this.handleCreateTask()
          },
          {
            label: '任务看板',
            accelerator: 'CmdOrCtrl+Shift+B',
            click: () => this.handleTaskBoard()
          },
          {
            label: '任务时间线',
            click: () => this.handleTaskTimeline()
          }
        ]
      },

      // 窗口菜单
      {
        label: '窗口',
        submenu: [
          { role: 'minimize' as const },
          { role: 'close' as const },
          ...(isMac ? [
            { type: 'separator' as const },
            { role: 'front' as const }
          ] : [])
        ]
      },

      // 帮助菜单
      {
        label: '帮助',
        submenu: [
          {
            label: '文档',
            click: () => shell.openExternal('https://github.com/multi-agent-ide/docs')
          },
          {
            label: '键盘快捷键',
            accelerator: 'CmdOrCtrl+K CmdOrCtrl+S',
            click: () => this.handleKeyboardShortcuts()
          },
          {
            label: '报告问题',
            click: () => shell.openExternal('https://github.com/multi-agent-ide/issues')
          },
          { type: 'separator' },
          {
            label: '检查更新',
            click: () => this.handleCheckUpdates()
          },
          ...(isMac ? [] : [{
            label: '关于',
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
        label: '没有最近的项目',
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
      title: '打开项目文件夹'
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
      title: '关于多Agent IDE',
      message: '多Agent IDE',
      detail: '一个支持多个AI Agent协作的集成开发环境\n版本 1.0.0'
    });
  }
}