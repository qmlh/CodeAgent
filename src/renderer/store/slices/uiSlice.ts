/**
 * UI State Slice
 * Manages UI layout and component states
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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
    shortcuts: boolean;
    plugins: boolean;
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

const initialState: UIState = {
  theme: 'dark',
  activeSidebarPanel: 'explorer',
  sidebarWidth: 300,
  sidebarCollapsed: false,
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
        { id: 'git', title: 'Git', visible: true },
        { id: 'plugins', title: 'Plugins', visible: true },
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
        { id: 'debug', title: 'Debug Console', visible: true },
        { id: 'git', title: 'Git', visible: true }
      ]
    },
    statusBar: {
      visible: true
    }
  },
  modals: {
    commandPalette: false,
    settings: false,
    about: false,
    createAgent: false,
    createTask: false,
    shortcuts: false,
    plugins: false
  },
  notifications: []
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Theme actions
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
    },

    // Sidebar actions
    toggleSidebar: (state) => {
      state.layout.sidebar.visible = !state.layout.sidebar.visible;
    },
    setSidebarWidth: (state, action: PayloadAction<number>) => {
      state.layout.sidebar.width = action.payload;
      state.sidebarWidth = action.payload;
    },
    setSidebarActivePanel: (state, action: PayloadAction<string>) => {
      state.layout.sidebar.activePanel = action.payload;
      state.activeSidebarPanel = action.payload;
    },
    setActiveSidebarPanel: (state, action: PayloadAction<string>) => {
      state.activeSidebarPanel = action.payload;
      state.layout.sidebar.activePanel = action.payload;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    toggleSidebarPanel: (state, action: PayloadAction<string>) => {
      const panel = state.layout.sidebar.panels.find(p => p.id === action.payload);
      if (panel) {
        panel.visible = !panel.visible;
      }
    },

    // Editor actions
    setEditorSplitLayout: (state, action: PayloadAction<'single' | 'horizontal' | 'vertical'>) => {
      state.layout.editor.splitLayout = action.payload;
    },
    setActiveEditorGroup: (state, action: PayloadAction<number>) => {
      state.layout.editor.activeGroup = action.payload;
    },
    addEditorGroup: (state) => {
      const newGroupId = `group-${state.layout.editor.groups.length}`;
      state.layout.editor.groups.push({
        id: newGroupId,
        activeFile: null,
        files: []
      });
    },
    removeEditorGroup: (state, action: PayloadAction<number>) => {
      if (state.layout.editor.groups.length > 1) {
        state.layout.editor.groups.splice(action.payload, 1);
        if (state.layout.editor.activeGroup >= state.layout.editor.groups.length) {
          state.layout.editor.activeGroup = state.layout.editor.groups.length - 1;
        }
      }
    },

    // Panel actions
    togglePanel: (state) => {
      state.layout.panel.visible = !state.layout.panel.visible;
    },
    setPanelHeight: (state, action: PayloadAction<number>) => {
      state.layout.panel.height = action.payload;
    },
    setPanelActivePanel: (state, action: PayloadAction<string>) => {
      state.layout.panel.activePanel = action.payload;
    },
    togglePanelPanel: (state, action: PayloadAction<string>) => {
      const panel = state.layout.panel.panels.find(p => p.id === action.payload);
      if (panel) {
        panel.visible = !panel.visible;
      }
    },

    // Status bar actions
    toggleStatusBar: (state) => {
      state.layout.statusBar.visible = !state.layout.statusBar.visible;
    },

    // Modal actions
    openModal: (state, action: PayloadAction<keyof UIState['modals']>) => {
      state.modals[action.payload] = true;
    },
    closeModal: (state, action: PayloadAction<keyof UIState['modals']>) => {
      state.modals[action.payload] = false;
    },
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(key => {
        state.modals[key as keyof UIState['modals']] = false;
      });
    },

    // Notification actions
    addNotification: (state, action: PayloadAction<{
      type: 'info' | 'success' | 'warning' | 'error';
      title: string;
      message: string;
      duration?: number;
    }>) => {
      const notification = {
        id: `notification-${Date.now()}`,
        timestamp: Date.now(),
        ...action.payload
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },

    // Layout presets
    resetLayout: (state) => {
      state.layout = initialState.layout;
    },
    loadLayout: (state, action: PayloadAction<UIState['layout']>) => {
      state.layout = action.payload;
    }
  }
});

export const {
  setTheme,
  toggleTheme,
  toggleSidebar,
  setSidebarWidth,
  setSidebarActivePanel,
  setActiveSidebarPanel,
  setSidebarCollapsed,
  toggleSidebarPanel,
  setEditorSplitLayout,
  setActiveEditorGroup,
  addEditorGroup,
  removeEditorGroup,
  togglePanel,
  setPanelHeight,
  setPanelActivePanel,
  togglePanelPanel,
  toggleStatusBar,
  openModal,
  closeModal,
  closeAllModals,
  addNotification,
  removeNotification,
  clearNotifications,
  resetLayout,
  loadLayout
} = uiSlice.actions;