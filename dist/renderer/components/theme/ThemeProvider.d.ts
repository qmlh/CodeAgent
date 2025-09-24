/**
 * Theme Provider Component
 * Provides theme context and manages theme switching
 */
import React from 'react';
import { Theme } from '../../store/slices/uiSlice';
interface ThemeContextType {
    currentTheme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}
export declare const useTheme: () => ThemeContextType;
interface ThemeProviderProps {
    children: React.ReactNode;
}
export declare const ThemeProvider: React.FC<ThemeProviderProps>;
export {};
