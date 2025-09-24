/**
 * Theme State Slice
 * Manages application theme and Monaco Editor theme synchronization
 */
import { PayloadAction } from '@reduxjs/toolkit';
export type ThemeMode = 'light' | 'dark' | 'auto';
export type MonacoTheme = 'vs' | 'vs-dark' | 'hc-black' | 'multi-agent-light' | 'multi-agent-dark' | 'multi-agent-hc';
export interface ThemeState {
    mode: ThemeMode;
    current: 'light' | 'dark';
    monacoTheme: MonacoTheme;
    customColors: Record<string, string>;
    fontSize: number;
    fontFamily: string;
    lineHeight: number;
    preferences: {
        enableAnimations: boolean;
        enableTransitions: boolean;
        reducedMotion: boolean;
        highContrast: boolean;
    };
}
export declare const themeSlice: import("@reduxjs/toolkit").Slice<ThemeState, {
    setThemeMode: (state: import("immer").WritableDraft<ThemeState>, action: PayloadAction<ThemeMode>) => void;
    setCurrentTheme: (state: import("immer").WritableDraft<ThemeState>, action: PayloadAction<"light" | "dark">) => void;
    setMonacoTheme: (state: import("immer").WritableDraft<ThemeState>, action: PayloadAction<MonacoTheme>) => void;
    setCustomColor: (state: import("immer").WritableDraft<ThemeState>, action: PayloadAction<{
        key: string;
        value: string;
    }>) => void;
    setCustomColors: (state: import("immer").WritableDraft<ThemeState>, action: PayloadAction<Record<string, string>>) => void;
    setFontSize: (state: import("immer").WritableDraft<ThemeState>, action: PayloadAction<number>) => void;
    setFontFamily: (state: import("immer").WritableDraft<ThemeState>, action: PayloadAction<string>) => void;
    setLineHeight: (state: import("immer").WritableDraft<ThemeState>, action: PayloadAction<number>) => void;
    setThemePreferences: (state: import("immer").WritableDraft<ThemeState>, action: PayloadAction<Partial<ThemeState["preferences"]>>) => void;
    toggleHighContrast: (state: import("immer").WritableDraft<ThemeState>) => void;
    detectSystemTheme: (state: import("immer").WritableDraft<ThemeState>) => void;
    resetTheme: (state: import("immer").WritableDraft<ThemeState>) => {
        mode: ThemeMode;
        current: "light" | "dark";
        monacoTheme: MonacoTheme;
        customColors: Record<string, string>;
        fontSize: number;
        fontFamily: string;
        lineHeight: number;
        preferences: {
            enableAnimations: boolean;
            enableTransitions: boolean;
            reducedMotion: boolean;
            highContrast: boolean;
        };
    };
}, "theme", "theme", import("@reduxjs/toolkit").SliceSelectors<ThemeState>>;
export declare const setThemeMode: import("@reduxjs/toolkit").ActionCreatorWithPayload<ThemeMode, "theme/setThemeMode">, setCurrentTheme: import("@reduxjs/toolkit").ActionCreatorWithPayload<"light" | "dark", "theme/setCurrentTheme">, setMonacoTheme: import("@reduxjs/toolkit").ActionCreatorWithPayload<MonacoTheme, "theme/setMonacoTheme">, setCustomColor: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    key: string;
    value: string;
}, "theme/setCustomColor">, setCustomColors: import("@reduxjs/toolkit").ActionCreatorWithPayload<Record<string, string>, "theme/setCustomColors">, setFontSize: import("@reduxjs/toolkit").ActionCreatorWithPayload<number, "theme/setFontSize">, setFontFamily: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "theme/setFontFamily">, setLineHeight: import("@reduxjs/toolkit").ActionCreatorWithPayload<number, "theme/setLineHeight">, setThemePreferences: import("@reduxjs/toolkit").ActionCreatorWithPayload<Partial<{
    enableAnimations: boolean;
    enableTransitions: boolean;
    reducedMotion: boolean;
    highContrast: boolean;
}>, "theme/setThemePreferences">, toggleHighContrast: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"theme/toggleHighContrast">, detectSystemTheme: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"theme/detectSystemTheme">, resetTheme: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"theme/resetTheme">;
declare const _default: import("redux").Reducer<ThemeState>;
export default _default;
