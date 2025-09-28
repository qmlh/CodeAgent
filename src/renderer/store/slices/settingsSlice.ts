import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  AppSettings,
  ThemeConfig,
  LayoutConfig,
  AgentSettings,
  EditorSettings,
  DataManagementSettings,
  UpdateSettings,
  UsageStatistics,
  BackupInfo,
  UpdateInfo,
  WorkspaceTemplate
} from '../../types/settings';

interface SettingsState {
  settings: AppSettings;
  usageStatistics: UsageStatistics;
  backups: BackupInfo[];
  availableUpdates: UpdateInfo[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  activeCategory: string;
  isDirty: boolean;
  lastSaved: Date | null;
}

// Default settings
const defaultSettings: AppSettings = {
  theme: {
    mode: 'dark',
    primaryColor: '#1890ff',
    accentColor: '#52c41a',
    fontSize: 14,
    fontFamily: 'Consolas, Monaco, monospace'
  },
  layout: {
    panels: {
      explorer: { visible: true, position: 'left', size: 300, order: 0 },
      agents: { visible: true, position: 'left', size: 300, order: 1 },
      tasks: { visible: true, position: 'right', size: 350, order: 0 },
      terminal: { visible: true, position: 'bottom', size: 200, order: 0 }
    },
    workspaceTemplates: [],
    multiMonitor: {
      enabled: false,
      primaryDisplay: '',
      secondaryLayouts: {}
    }
  },
  agents: {
    enabledTypes: ['frontend', 'backend', 'testing', 'code_review'],
    performanceSettings: {
      maxConcurrentAgents: 4,
      taskTimeout: 300000, // 5 minutes
      memoryLimit: 1024, // MB
      cpuThreshold: 80 // percentage
    },
    behaviorSettings: {
      autoAssignTasks: true,
      collaborationMode: 'balanced',
      errorHandling: 'retry',
      communicationLevel: 'normal'
    }
  },
  editor: {
    tabSize: 2,
    insertSpaces: true,
    wordWrap: true,
    lineNumbers: true,
    minimap: true,
    autoSave: true,
    formatOnSave: true,
    theme: 'vs-dark',
    keyBindings: {}
  },
  dataManagement: {
    autoBackup: true,
    backupInterval: 60, // minutes
    maxBackups: 10,
    backupLocation: '',
    syncEnabled: false,
    syncProvider: 'local',
    encryptBackups: false
  },
  updates: {
    autoCheck: true,
    checkInterval: 24, // hours
    autoDownload: false,
    autoInstall: false,
    channel: 'stable',
    notifyOnUpdate: true
  },
  shortcuts: {
    'file.new': 'Ctrl+N',
    'file.open': 'Ctrl+O',
    'file.save': 'Ctrl+S',
    'edit.undo': 'Ctrl+Z',
    'edit.redo': 'Ctrl+Y',
    'view.command-palette': 'Ctrl+Shift+P'
  },
  advanced: {
    debugMode: false,
    logLevel: 'info',
    experimentalFeatures: [],
    performanceMode: 'balanced'
  }
};

const initialState: SettingsState = {
  settings: defaultSettings,
  usageStatistics: {
    totalUsageTime: 0,
    featureUsage: {},
    performanceMetrics: {
      averageStartupTime: 0,
      averageResponseTime: 0,
      memoryUsage: [],
      cpuUsage: []
    },
    agentStatistics: {}
  },
  backups: [],
  availableUpdates: [],
  isLoading: false,
  error: null,
  searchQuery: '',
  activeCategory: 'appearance',
  isDirty: false,
  lastSaved: null
};

// Async thunks
export const loadSettings = createAsyncThunk(
  'settings/loadSettings',
  async () => {
    const settings = await window.electronAPI.settings.load();
    return settings;
  }
);

export const saveSettings = createAsyncThunk(
  'settings/saveSettings',
  async (settings: AppSettings) => {
    await window.electronAPI.settings.save(settings);
    return settings;
  }
);

export const exportSettings = createAsyncThunk(
  'settings/exportSettings',
  async (filePath: string, { getState }) => {
    const state = getState() as { settings: SettingsState };
    await window.electronAPI.settings.export(filePath, state.settings.settings);
    return filePath;
  }
);

export const importSettings = createAsyncThunk(
  'settings/importSettings',
  async (filePath: string) => {
    const settings = await window.electronAPI.settings.import(filePath);
    return settings;
  }
);

export const createBackup = createAsyncThunk(
  'settings/createBackup',
  async (name: string) => {
    const backup = await window.electronAPI.settings.createBackup(name);
    return backup;
  }
);

export const restoreBackup = createAsyncThunk(
  'settings/restoreBackup',
  async (backupId: string) => {
    const settings = await window.electronAPI.settings.restoreBackup(backupId);
    return settings;
  }
);

export const checkForUpdates = createAsyncThunk(
  'settings/checkForUpdates',
  async () => {
    const updates = await window.electronAPI.updates.check();
    return updates;
  }
);

export const downloadUpdate = createAsyncThunk(
  'settings/downloadUpdate',
  async (updateInfo: UpdateInfo) => {
    await window.electronAPI.updates.download(updateInfo);
    return updateInfo;
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateThemeSettings: (state, action: PayloadAction<Partial<ThemeConfig>>) => {
      state.settings.theme = { ...state.settings.theme, ...action.payload };
      state.isDirty = true;
    },
    updateLayoutSettings: (state, action: PayloadAction<Partial<LayoutConfig>>) => {
      state.settings.layout = { ...state.settings.layout, ...action.payload };
      state.isDirty = true;
    },
    updateAgentSettings: (state, action: PayloadAction<Partial<AgentSettings>>) => {
      state.settings.agents = { ...state.settings.agents, ...action.payload };
      state.isDirty = true;
    },
    updateEditorSettings: (state, action: PayloadAction<Partial<EditorSettings>>) => {
      state.settings.editor = { ...state.settings.editor, ...action.payload };
      state.isDirty = true;
    },
    updateDataManagementSettings: (state, action: PayloadAction<Partial<DataManagementSettings>>) => {
      state.settings.dataManagement = { ...state.settings.dataManagement, ...action.payload };
      state.isDirty = true;
    },
    updateUpdateSettings: (state, action: PayloadAction<Partial<UpdateSettings>>) => {
      state.settings.updates = { ...state.settings.updates, ...action.payload };
      state.isDirty = true;
    },
    updateShortcut: (state, action: PayloadAction<{ action: string; shortcut: string }>) => {
      state.settings.shortcuts[action.payload.action] = action.payload.shortcut;
      state.isDirty = true;
    },
    addWorkspaceTemplate: (state, action: PayloadAction<WorkspaceTemplate>) => {
      state.settings.layout.workspaceTemplates.push(action.payload);
      state.isDirty = true;
    },
    removeWorkspaceTemplate: (state, action: PayloadAction<string>) => {
      state.settings.layout.workspaceTemplates = state.settings.layout.workspaceTemplates.filter(
        template => template.id !== action.payload
      );
      state.isDirty = true;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setActiveCategory: (state, action: PayloadAction<string>) => {
      state.activeCategory = action.payload;
    },
    resetSettings: (state) => {
      state.settings = defaultSettings;
      state.isDirty = true;
    },
    markClean: (state) => {
      state.isDirty = false;
      state.lastSaved = new Date();
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings = { ...defaultSettings, ...action.payload };
        state.isDirty = false;
      })
      .addCase(loadSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to load settings';
      })
      .addCase(saveSettings.fulfilled, (state) => {
        state.isDirty = false;
        state.lastSaved = new Date();
      })
      .addCase(createBackup.fulfilled, (state, action) => {
        state.backups.unshift(action.payload);
      })
      .addCase(restoreBackup.fulfilled, (state, action) => {
        state.settings = action.payload;
        state.isDirty = true;
      })
      .addCase(checkForUpdates.fulfilled, (state, action) => {
        state.availableUpdates = action.payload;
      });
  }
});

export const {
  updateThemeSettings,
  updateLayoutSettings,
  updateAgentSettings,
  updateEditorSettings,
  updateDataManagementSettings,
  updateUpdateSettings,
  updateShortcut,
  addWorkspaceTemplate,
  removeWorkspaceTemplate,
  setSearchQuery,
  setActiveCategory,
  resetSettings,
  markClean
} = settingsSlice.actions;

export default settingsSlice.reducer;