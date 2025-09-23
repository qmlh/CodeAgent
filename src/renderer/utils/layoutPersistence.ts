/**
 * Layout Persistence Utilities
 * Save and restore UI layout preferences
 */

import { UIState } from '../store/slices/uiSlice';

const LAYOUT_STORAGE_KEY = 'multi-agent-ide-layout';

export interface LayoutPreferences {
  theme: UIState['theme'];
  sidebarWidth: number;
  sidebarCollapsed: boolean;
  activeSidebarPanel: string;
  layout: UIState['layout'];
}

export const saveLayoutPreferences = (preferences: LayoutPreferences): void => {
  try {
    const serialized = JSON.stringify(preferences);
    localStorage.setItem(LAYOUT_STORAGE_KEY, serialized);
  } catch (error) {
    console.warn('Failed to save layout preferences:', error);
  }
};

export const loadLayoutPreferences = (): LayoutPreferences | null => {
  try {
    const serialized = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!serialized) {
      return null;
    }
    
    const preferences = JSON.parse(serialized);
    
    // Validate the loaded preferences
    if (typeof preferences === 'object' && preferences !== null) {
      return preferences as LayoutPreferences;
    }
    
    return null;
  } catch (error) {
    console.warn('Failed to load layout preferences:', error);
    return null;
  }
};

export const clearLayoutPreferences = (): void => {
  try {
    localStorage.removeItem(LAYOUT_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear layout preferences:', error);
  }
};

export const getDefaultLayoutPreferences = (): LayoutPreferences => {
  return {
    theme: 'dark',
    sidebarWidth: 300,
    sidebarCollapsed: false,
    activeSidebarPanel: 'explorer',
    layout: {
      sidebar: {
        visible: true,
        width: 300,
        activePanel: 'explorer',
        panels: [
          { id: 'explorer', title: 'Explorer', visible: true },
          { id: 'search', title: 'Search', visible: true },
          { id: 'agents', title: 'Agents', visible: true },
          { id: 'tasks', title: 'Tasks', visible: true },
          { id: 'collaboration', title: 'Collaboration', visible: true },
          { id: 'settings', title: 'Settings', visible: true }
        ]
      },
      editor: {
        splitLayout: 'single',
        activeGroup: 0,
        groups: [
          {
            id: 'group-0',
            activeFile: null,
            files: []
          }
        ]
      },
      panel: {
        visible: false,
        height: 200,
        activePanel: 'terminal',
        panels: [
          { id: 'terminal', title: 'Terminal', visible: true },
          { id: 'output', title: 'Output', visible: true },
          { id: 'problems', title: 'Problems', visible: true },
          { id: 'debug', title: 'Debug Console', visible: true }
        ]
      },
      statusBar: {
        visible: true
      }
    }
  };
};