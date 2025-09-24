/**
 * UI State Slice
 * Manages UI layout and component states
 */
import { PayloadAction } from '@reduxjs/toolkit';
export interface Panel {
    id: string;
    title: string;
    visible: boolean;
    width?: number;
    height?: number;
}
export type Theme = 'light' | 'dark' | 'auto';
export interface UIState {
    theme: Theme;
    activeSidebarPanel: string;
    sidebarWidth: number;
    sidebarCollapsed: boolean;
    layout: {
        sidebar: {
            visible: boolean;
            width: number;
            activePanel: string;
            panels: Panel[];
        };
        editor: {
            splitLayout: 'single' | 'horizontal' | 'vertical';
            activeGroup: number;
            groups: Array<{
                id: string;
                activeFile: string | null;
                files: string[];
            }>;
        };
        panel: {
            visible: boolean;
            height: number;
            activePanel: string;
            panels: Panel[];
        };
        statusBar: {
            visible: boolean;
        };
    };
    modals: {
        commandPalette: boolean;
        settings: boolean;
        about: boolean;
        createAgent: boolean;
        createTask: boolean;
    };
    notifications: Array<{
        id: string;
        type: 'info' | 'success' | 'warning' | 'error';
        title: string;
        message: string;
        timestamp: number;
        duration?: number;
    }>;
}
export declare const uiSlice: import("@reduxjs/toolkit").Slice<UIState, {
    setTheme: (state: import("immer").WritableDraft<UIState>, action: PayloadAction<Theme>) => void;
    toggleTheme: (state: import("immer").WritableDraft<UIState>) => void;
    toggleSidebar: (state: import("immer").WritableDraft<UIState>) => void;
    setSidebarWidth: (state: import("immer").WritableDraft<UIState>, action: PayloadAction<number>) => void;
    setSidebarActivePanel: (state: import("immer").WritableDraft<UIState>, action: PayloadAction<string>) => void;
    setActiveSidebarPanel: (state: import("immer").WritableDraft<UIState>, action: PayloadAction<string>) => void;
    setSidebarCollapsed: (state: import("immer").WritableDraft<UIState>, action: PayloadAction<boolean>) => void;
    toggleSidebarPanel: (state: import("immer").WritableDraft<UIState>, action: PayloadAction<string>) => void;
    setEditorSplitLayout: (state: import("immer").WritableDraft<UIState>, action: PayloadAction<"single" | "horizontal" | "vertical">) => void;
    setActiveEditorGroup: (state: import("immer").WritableDraft<UIState>, action: PayloadAction<number>) => void;
    addEditorGroup: (state: import("immer").WritableDraft<UIState>) => void;
    removeEditorGroup: (state: import("immer").WritableDraft<UIState>, action: PayloadAction<number>) => void;
    togglePanel: (state: import("immer").WritableDraft<UIState>) => void;
    setPanelHeight: (state: import("immer").WritableDraft<UIState>, action: PayloadAction<number>) => void;
    setPanelActivePanel: (state: import("immer").WritableDraft<UIState>, action: PayloadAction<string>) => void;
    togglePanelPanel: (state: import("immer").WritableDraft<UIState>, action: PayloadAction<string>) => void;
    toggleStatusBar: (state: import("immer").WritableDraft<UIState>) => void;
    openModal: (state: import("immer").WritableDraft<UIState>, action: PayloadAction<keyof UIState["modals"]>) => void;
    closeModal: (state: import("immer").WritableDraft<UIState>, action: PayloadAction<keyof UIState["modals"]>) => void;
    closeAllModals: (state: import("immer").WritableDraft<UIState>) => void;
    addNotification: (state: import("immer").WritableDraft<UIState>, action: PayloadAction<{
        type: "info" | "success" | "warning" | "error";
        title: string;
        message: string;
        duration?: number;
    }>) => void;
    removeNotification: (state: import("immer").WritableDraft<UIState>, action: PayloadAction<string>) => void;
    clearNotifications: (state: import("immer").WritableDraft<UIState>) => void;
    resetLayout: (state: import("immer").WritableDraft<UIState>) => void;
    loadLayout: (state: import("immer").WritableDraft<UIState>, action: PayloadAction<UIState["layout"]>) => void;
}, "ui", "ui", import("@reduxjs/toolkit").SliceSelectors<UIState>>;
export declare const setTheme: import("@reduxjs/toolkit").ActionCreatorWithPayload<Theme, "ui/setTheme">, toggleTheme: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"ui/toggleTheme">, toggleSidebar: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"ui/toggleSidebar">, setSidebarWidth: import("@reduxjs/toolkit").ActionCreatorWithPayload<number, "ui/setSidebarWidth">, setSidebarActivePanel: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "ui/setSidebarActivePanel">, setActiveSidebarPanel: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "ui/setActiveSidebarPanel">, setSidebarCollapsed: import("@reduxjs/toolkit").ActionCreatorWithPayload<boolean, "ui/setSidebarCollapsed">, toggleSidebarPanel: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "ui/toggleSidebarPanel">, setEditorSplitLayout: import("@reduxjs/toolkit").ActionCreatorWithPayload<"single" | "horizontal" | "vertical", "ui/setEditorSplitLayout">, setActiveEditorGroup: import("@reduxjs/toolkit").ActionCreatorWithPayload<number, "ui/setActiveEditorGroup">, addEditorGroup: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"ui/addEditorGroup">, removeEditorGroup: import("@reduxjs/toolkit").ActionCreatorWithPayload<number, "ui/removeEditorGroup">, togglePanel: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"ui/togglePanel">, setPanelHeight: import("@reduxjs/toolkit").ActionCreatorWithPayload<number, "ui/setPanelHeight">, setPanelActivePanel: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "ui/setPanelActivePanel">, togglePanelPanel: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "ui/togglePanelPanel">, toggleStatusBar: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"ui/toggleStatusBar">, openModal: import("@reduxjs/toolkit").ActionCreatorWithPayload<"about" | "settings" | "commandPalette" | "createAgent" | "createTask", "ui/openModal">, closeModal: import("@reduxjs/toolkit").ActionCreatorWithPayload<"about" | "settings" | "commandPalette" | "createAgent" | "createTask", "ui/closeModal">, closeAllModals: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"ui/closeAllModals">, addNotification: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    type: "info" | "success" | "warning" | "error";
    title: string;
    message: string;
    duration?: number;
}, "ui/addNotification">, removeNotification: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "ui/removeNotification">, clearNotifications: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"ui/clearNotifications">, resetLayout: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"ui/resetLayout">, loadLayout: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    sidebar: {
        visible: boolean;
        width: number;
        activePanel: string;
        panels: Panel[];
    };
    editor: {
        splitLayout: "single" | "horizontal" | "vertical";
        activeGroup: number;
        groups: Array<{
            id: string;
            activeFile: string | null;
            files: string[];
        }>;
    };
    panel: {
        visible: boolean;
        height: number;
        activePanel: string;
        panels: Panel[];
    };
    statusBar: {
        visible: boolean;
    };
}, "ui/loadLayout">;
