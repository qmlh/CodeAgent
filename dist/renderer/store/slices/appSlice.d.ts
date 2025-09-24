/**
 * App State Slice
 * Manages global application state
 */
import { PayloadAction } from '@reduxjs/toolkit';
export interface AppState {
    isInitialized: boolean;
    version: string;
    platform: string;
    theme: 'light' | 'dark' | 'system';
    currentProject: string | null;
    recentProjects: string[];
    settings: {
        autoSave: boolean;
        autoSaveInterval: number;
        showLineNumbers: boolean;
        wordWrap: boolean;
        fontSize: number;
        fontFamily: string;
    };
    status: 'idle' | 'loading' | 'error';
    error: string | null;
}
export declare const initializeApp: import("@reduxjs/toolkit").AsyncThunk<{
    platform: NodeJS.Platform;
    version: string;
}, void, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const loadSettings: import("@reduxjs/toolkit").AsyncThunk<{}, void, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const saveSettings: import("@reduxjs/toolkit").AsyncThunk<Partial<{
    autoSave: boolean;
    autoSaveInterval: number;
    showLineNumbers: boolean;
    wordWrap: boolean;
    fontSize: number;
    fontFamily: string;
}>, Partial<{
    autoSave: boolean;
    autoSaveInterval: number;
    showLineNumbers: boolean;
    wordWrap: boolean;
    fontSize: number;
    fontFamily: string;
}>, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const openProject: import("@reduxjs/toolkit").AsyncThunk<string, string, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const appSlice: import("@reduxjs/toolkit").Slice<AppState, {
    setTheme: (state: import("immer").WritableDraft<AppState>, action: PayloadAction<"light" | "dark" | "system">) => void;
    updateSettings: (state: import("immer").WritableDraft<AppState>, action: PayloadAction<Partial<AppState["settings"]>>) => void;
    addRecentProject: (state: import("immer").WritableDraft<AppState>, action: PayloadAction<string>) => void;
    removeRecentProject: (state: import("immer").WritableDraft<AppState>, action: PayloadAction<string>) => void;
    clearError: (state: import("immer").WritableDraft<AppState>) => void;
}, "app", "app", import("@reduxjs/toolkit").SliceSelectors<AppState>>;
export declare const setTheme: import("@reduxjs/toolkit").ActionCreatorWithPayload<"system" | "light" | "dark", "app/setTheme">, updateSettings: import("@reduxjs/toolkit").ActionCreatorWithPayload<Partial<{
    autoSave: boolean;
    autoSaveInterval: number;
    showLineNumbers: boolean;
    wordWrap: boolean;
    fontSize: number;
    fontFamily: string;
}>, "app/updateSettings">, addRecentProject: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "app/addRecentProject">, removeRecentProject: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "app/removeRecentProject">, clearError: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"app/clearError">;
