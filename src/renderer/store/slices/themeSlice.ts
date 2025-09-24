/**
 * Theme State Slice
 * Manages application theme and Monaco Editor theme synchronization
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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

const initialState: ThemeState = {
  mode: 'auto',
  current: 'dark',
  monacoTheme: 'multi-agent-dark',
  customColors: {},
  fontSize: 14,
  fontFamily: 'JetBrains Mono, Monaco, Consolas, "Courier New", monospace',
  lineHeight: 1.5,
  preferences: {
    enableAnimations: true,
    enableTransitions: true,
    reducedMotion: false,
    highContrast: false
  }
};

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setThemeMode: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload;
      
      if (action.payload === 'auto') {
        // Detect system theme
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        state.current = prefersDark ? 'dark' : 'light';
        state.monacoTheme = prefersDark ? 'multi-agent-dark' : 'multi-agent-light';
      } else {
        state.current = action.payload;
        state.monacoTheme = action.payload === 'dark' ? 'multi-agent-dark' : 'multi-agent-light';
      }
    },

    setCurrentTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.current = action.payload;
      state.monacoTheme = action.payload === 'dark' ? 'multi-agent-dark' : 'multi-agent-light';
    },

    setMonacoTheme: (state, action: PayloadAction<MonacoTheme>) => {
      state.monacoTheme = action.payload;
    },

    setCustomColor: (state, action: PayloadAction<{ key: string; value: string }>) => {
      state.customColors[action.payload.key] = action.payload.value;
    },

    setCustomColors: (state, action: PayloadAction<Record<string, string>>) => {
      state.customColors = action.payload;
    },

    setFontSize: (state, action: PayloadAction<number>) => {
      state.fontSize = Math.max(8, Math.min(72, action.payload));
    },

    setFontFamily: (state, action: PayloadAction<string>) => {
      state.fontFamily = action.payload;
    },

    setLineHeight: (state, action: PayloadAction<number>) => {
      state.lineHeight = Math.max(1.0, Math.min(3.0, action.payload));
    },

    setThemePreferences: (state, action: PayloadAction<Partial<ThemeState['preferences']>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },

    toggleHighContrast: (state) => {
      state.preferences.highContrast = !state.preferences.highContrast;
      
      if (state.preferences.highContrast) {
        state.monacoTheme = 'multi-agent-hc';
      } else {
        state.monacoTheme = state.current === 'dark' ? 'multi-agent-dark' : 'multi-agent-light';
      }
    },

    detectSystemTheme: (state) => {
      if (state.mode === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const preferencesReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const preferencesHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
        
        state.current = prefersDark ? 'dark' : 'light';
        state.preferences.reducedMotion = preferencesReducedMotion;
        state.preferences.highContrast = preferencesHighContrast;
        
        if (preferencesHighContrast) {
          state.monacoTheme = 'multi-agent-hc';
        } else {
          state.monacoTheme = prefersDark ? 'multi-agent-dark' : 'multi-agent-light';
        }
      }
    },

    resetTheme: (state) => {
      return { ...initialState };
    }
  }
});

export const {
  setThemeMode,
  setCurrentTheme,
  setMonacoTheme,
  setCustomColor,
  setCustomColors,
  setFontSize,
  setFontFamily,
  setLineHeight,
  setThemePreferences,
  toggleHighContrast,
  detectSystemTheme,
  resetTheme
} = themeSlice.actions;

export default themeSlice.reducer;