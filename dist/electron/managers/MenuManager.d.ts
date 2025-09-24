/**
 * Menu Manager
 * Handles application menu creation and management
 */
import { Menu, MenuItemConstructorOptions } from 'electron';
export declare class MenuManager {
    private windowManager;
    private applicationMenu;
    constructor();
    initialize(): Promise<void>;
    createApplicationMenu(): void;
    createContextMenu(options: MenuItemConstructorOptions[]): Menu;
    private getMenuTemplate;
    private getRecentProjectsMenu;
    private handleNewProject;
    private handleOpenProject;
    private handleSave;
    private handleSaveAs;
    private handleSaveAll;
    private handleCloseFile;
    private handleCloseProject;
    private handleFind;
    private handleFindReplace;
    private handleFindInFiles;
    private handleCommandPalette;
    private handleToggleExplorer;
    private handleToggleAgentPanel;
    private handleToggleTaskPanel;
    private handleToggleTerminal;
    private handleSplitEditor;
    private handleCreateAgent;
    private handleStartAllAgents;
    private handleStopAllAgents;
    private handleAgentSettings;
    private handleCreateTask;
    private handleTaskBoard;
    private handleTaskTimeline;
    private handleKeyboardShortcuts;
    private handleCheckUpdates;
    private handleAbout;
}
