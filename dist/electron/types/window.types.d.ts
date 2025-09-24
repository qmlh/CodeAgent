/**
 * Window-related type definitions for Electron
 */
import { BrowserWindowConstructorOptions } from 'electron';
export interface WindowConfig extends BrowserWindowConstructorOptions {
    id?: string;
    modal?: boolean;
}
export interface WindowState {
    x: number;
    y: number;
    width: number;
    height: number;
    isMaximized: boolean;
    isFullScreen: boolean;
}
export interface WindowBounds {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface WindowPreferences {
    theme: 'light' | 'dark' | 'system';
    zoomLevel: number;
    sidebarWidth: number;
    panelHeight: number;
    showStatusBar: boolean;
    showActivityBar: boolean;
}
export interface WindowLayout {
    sidebar: {
        visible: boolean;
        width: number;
        activePanel: string;
    };
    editor: {
        splitLayout: 'single' | 'horizontal' | 'vertical';
        activeGroup: number;
    };
    panel: {
        visible: boolean;
        height: number;
        activePanel: string;
    };
    statusBar: {
        visible: boolean;
    };
}
