/**
 * Enhanced Window Manager
 * Handles creation and management of application windows with advanced features
 */
import { BrowserWindow } from 'electron';
import { WindowConfig, WindowState } from '../types/window.types';
export interface WindowMemoryState {
    bounds: Electron.Rectangle;
    isMaximized: boolean;
    isFullScreen: boolean;
    display: number;
    lastUsed: Date;
}
export interface WindowSnapZone {
    x: number;
    y: number;
    width: number;
    height: number;
    type: 'left' | 'right' | 'top' | 'bottom' | 'corner';
}
export declare class WindowManager {
    private mainWindow;
    private windows;
    private windowStates;
    private isDevelopment;
    private stateFilePath;
    private snapThreshold;
    private snapZones;
    private isInitialized;
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
    saveWindowStates(): Promise<void>;
    loadWindowStates(): Promise<void>;
    getOptimalDisplay(): Electron.Display;
    snapWindowToEdge(window: BrowserWindow, edge: 'left' | 'right' | 'top' | 'bottom'): void;
    centerWindowOnDisplay(window: BrowserWindow, displayId?: number): void;
    moveWindowToDisplay(window: BrowserWindow, displayId: number): void;
    getAllDisplays(): Electron.Display[];
    getWindowDisplay(window: BrowserWindow): Electron.Display;
    private initializeSnapZones;
    private setupDisplayHandlers;
    private updateWindowState;
    isWindowManagerInitialized(): boolean;
    private getAppIcon;
}
