/**
 * System Tools State Slice
 * Manages state for system integration and development tools
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { 
  Terminal, 
  GitStatus, 
  Plugin, 
  KeyboardShortcut, 
  ContextMenuConfig,
  Command,
  PanelLayout,
  SystemResources,
  StatusBarItem
} from '../../types/system';

export interface SystemState {
  // Terminal state
  terminals: Terminal[];
  activeTerminalId: string | null;
  terminalTheme: string;
  
  // Git state
  gitStatus: GitStatus | null;
  gitBranches: string[];
  gitCommits: any[];
  
  // Plugin state
  plugins: Plugin[];
  pluginCategories: string[];
  
  // Keyboard shortcuts
  shortcuts: KeyboardShortcut[];
  shortcutConflicts: string[];
  
  // Context menus
  contextMenus: ContextMenuConfig[];
  
  // Command palette
  commands: Command[];
  commandPaletteVisible: boolean;
  
  // Panel management
  panelLayouts: PanelLayout[];
  currentLayout: string | null;
  
  // System resources
  systemResources: SystemResources | null;
  
  // Status bar
  statusBarItems: StatusBarItem[];
}

const initialState: SystemState = {
  terminals: [],
  activeTerminalId: null,
  terminalTheme: 'dark',
  gitStatus: null,
  gitBranches: [],
  gitCommits: [],
  plugins: [],
  pluginCategories: [],
  shortcuts: [],
  shortcutConflicts: [],
  contextMenus: [],
  commands: [],
  commandPaletteVisible: false,
  panelLayouts: [],
  currentLayout: null,
  systemResources: null,
  statusBarItems: []
};

export const systemSlice = createSlice({
  name: 'system',
  initialState,
  reducers: {
    // Terminal actions
    addTerminal: (state, action: PayloadAction<Terminal>) => {
      state.terminals.push(action.payload);
      state.activeTerminalId = action.payload.id;
    },
    removeTerminal: (state, action: PayloadAction<string>) => {
      state.terminals = state.terminals.filter(t => t.id !== action.payload);
      if (state.activeTerminalId === action.payload) {
        state.activeTerminalId = state.terminals.length > 0 ? state.terminals[0].id : null;
      }
    },
    setActiveTerminal: (state, action: PayloadAction<string>) => {
      state.activeTerminalId = action.payload;
    },
    updateTerminal: (state, action: PayloadAction<Partial<Terminal> & { id: string }>) => {
      const index = state.terminals.findIndex(t => t.id === action.payload.id);
      if (index !== -1) {
        state.terminals[index] = { ...state.terminals[index], ...action.payload };
      }
    },
    setTerminalTheme: (state, action: PayloadAction<string>) => {
      state.terminalTheme = action.payload;
    },

    // Git actions
    setGitStatus: (state, action: PayloadAction<GitStatus>) => {
      state.gitStatus = action.payload;
    },
    setGitBranches: (state, action: PayloadAction<string[]>) => {
      state.gitBranches = action.payload;
    },
    setGitCommits: (state, action: PayloadAction<any[]>) => {
      state.gitCommits = action.payload;
    },

    // Plugin actions
    setPlugins: (state, action: PayloadAction<Plugin[]>) => {
      state.plugins = action.payload;
    },
    updatePlugin: (state, action: PayloadAction<Partial<Plugin> & { id: string }>) => {
      const index = state.plugins.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.plugins[index] = { ...state.plugins[index], ...action.payload };
      }
    },
    togglePlugin: (state, action: PayloadAction<string>) => {
      const plugin = state.plugins.find(p => p.id === action.payload);
      if (plugin) {
        plugin.enabled = !plugin.enabled;
      }
    },

    // Keyboard shortcut actions
    setShortcuts: (state, action: PayloadAction<KeyboardShortcut[]>) => {
      state.shortcuts = action.payload;
    },
    updateShortcut: (state, action: PayloadAction<Partial<KeyboardShortcut> & { id: string }>) => {
      const index = state.shortcuts.findIndex(s => s.id === action.payload.id);
      if (index !== -1) {
        state.shortcuts[index] = { ...state.shortcuts[index], ...action.payload };
      }
    },
    setShortcutConflicts: (state, action: PayloadAction<string[]>) => {
      state.shortcutConflicts = action.payload;
    },

    // Context menu actions
    setContextMenus: (state, action: PayloadAction<ContextMenuConfig[]>) => {
      state.contextMenus = action.payload;
    },
    updateContextMenu: (state, action: PayloadAction<ContextMenuConfig>) => {
      const index = state.contextMenus.findIndex(c => c.context === action.payload.context);
      if (index !== -1) {
        state.contextMenus[index] = action.payload;
      } else {
        state.contextMenus.push(action.payload);
      }
    },

    // Command palette actions
    setCommands: (state, action: PayloadAction<Command[]>) => {
      state.commands = action.payload;
    },
    toggleCommandPalette: (state) => {
      state.commandPaletteVisible = !state.commandPaletteVisible;
    },
    setCommandPaletteVisible: (state, action: PayloadAction<boolean>) => {
      state.commandPaletteVisible = action.payload;
    },

    // Panel layout actions
    setPanelLayouts: (state, action: PayloadAction<PanelLayout[]>) => {
      state.panelLayouts = action.payload;
    },
    addPanelLayout: (state, action: PayloadAction<PanelLayout>) => {
      state.panelLayouts.push(action.payload);
    },
    updatePanelLayout: (state, action: PayloadAction<PanelLayout>) => {
      const index = state.panelLayouts.findIndex(l => l.id === action.payload.id);
      if (index !== -1) {
        state.panelLayouts[index] = action.payload;
      }
    },
    setCurrentLayout: (state, action: PayloadAction<string>) => {
      state.currentLayout = action.payload;
    },

    // System resources actions
    setSystemResources: (state, action: PayloadAction<SystemResources>) => {
      state.systemResources = action.payload;
    },

    // Status bar actions
    setStatusBarItems: (state, action: PayloadAction<StatusBarItem[]>) => {
      state.statusBarItems = action.payload;
    },
    addStatusBarItem: (state, action: PayloadAction<StatusBarItem>) => {
      state.statusBarItems.push(action.payload);
      state.statusBarItems.sort((a, b) => b.priority - a.priority);
    },
    updateStatusBarItem: (state, action: PayloadAction<Partial<StatusBarItem> & { id: string }>) => {
      const index = state.statusBarItems.findIndex(i => i.id === action.payload.id);
      if (index !== -1) {
        state.statusBarItems[index] = { ...state.statusBarItems[index], ...action.payload };
      }
    },
    removeStatusBarItem: (state, action: PayloadAction<string>) => {
      state.statusBarItems = state.statusBarItems.filter(i => i.id !== action.payload);
    }
  }
});

export const {
  addTerminal,
  removeTerminal,
  setActiveTerminal,
  updateTerminal,
  setTerminalTheme,
  setGitStatus,
  setGitBranches,
  setGitCommits,
  setPlugins,
  updatePlugin,
  togglePlugin,
  setShortcuts,
  updateShortcut,
  setShortcutConflicts,
  setContextMenus,
  updateContextMenu,
  setCommands,
  toggleCommandPalette,
  setCommandPaletteVisible,
  setPanelLayouts,
  addPanelLayout,
  updatePanelLayout,
  setCurrentLayout,
  setSystemResources,
  setStatusBarItems,
  addStatusBarItem,
  updateStatusBarItem,
  removeStatusBarItem
} = systemSlice.actions;