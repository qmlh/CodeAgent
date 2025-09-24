/**
 * Layout Persistence Utilities
 * Save and restore UI layout preferences
 */
import { UIState } from '../store/slices/uiSlice';
export interface LayoutPreferences {
    theme: UIState['theme'];
    sidebarWidth: number;
    sidebarCollapsed: boolean;
    activeSidebarPanel: string;
    layout: UIState['layout'];
}
export declare const saveLayoutPreferences: (preferences: LayoutPreferences) => void;
export declare const loadLayoutPreferences: () => LayoutPreferences | null;
export declare const clearLayoutPreferences: () => void;
export declare const getDefaultLayoutPreferences: () => LayoutPreferences;
