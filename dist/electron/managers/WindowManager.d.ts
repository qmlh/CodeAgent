/**
 * Window Manager
 * Handles creation and management of application windows
 */
import { BrowserWindow } from 'electron';
import { WindowConfig, WindowState } from '../types/window.types';
export declare class WindowManager {
    private mainWindow;
    private windows;
    private isDevelopment;
    constructor();
    initialize(): Promise<void>;
    createMainWindow(): Promise<BrowserWindow>;
    createChildWindow(parentId: string, config: Partial<WindowConfig>): Promise<BrowserWindow>;
    getMainWindow(): BrowserWindow | null;
    getWindow(id: string): BrowserWindow | undefined;
    getAllWindows(): BrowserWindow[];
    closeWindow(id: string): void;
    closeAllWindows(): void;
    saveWindowState(window: BrowserWindow): WindowState;
    restoreWindowState(window: BrowserWindow, state: WindowState): void;
    private loadApplication;
    private setupWindowEvents;
    private getAppIcon;
}
