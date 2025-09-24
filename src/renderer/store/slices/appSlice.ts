/**
 * App State Slice
 * Manages global application state
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

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

const initialState: AppState = {
  isInitialized: false,
  version: '1.0.0',
  platform: 'unknown',
  theme: 'dark',
  currentProject: null,
  recentProjects: [],
  settings: {
    autoSave: true,
    autoSaveInterval: 5000,
    showLineNumbers: true,
    wordWrap: true,
    fontSize: 14,
    fontFamily: 'Monaco, Consolas, "Courier New", monospace'
  },
  status: 'idle',
  error: null
};

// Async thunks
export const initializeApp = createAsyncThunk(
  'app/initialize',
  async () => {
    console.log('Initializing app with fallback values...');
    
    // Use simple fallback values to avoid hanging
    const result = {
      platform: (typeof process !== 'undefined' && process.platform) || 'win32',
      version: '1.0.0'
    };
    
    // Try to get real values if electronAPI is available, but don't wait
    if (window.electronAPI) {
      try {
        const systemInfoPromise = window.electronAPI.system?.getInfo();
        const versionPromise = window.electronAPI.app?.getVersion();
        
        if (systemInfoPromise) {
          systemInfoPromise.then(info => {
            console.log('System info retrieved:', info);
          }).catch(err => {
            console.warn('Failed to get system info:', err);
          });
        }
        
        if (versionPromise) {
          versionPromise.then(ver => {
            console.log('Version retrieved:', ver);
          }).catch(err => {
            console.warn('Failed to get version:', err);
          });
        }
      } catch (error) {
        console.warn('ElectronAPI calls failed:', error);
      }
    }
    
    console.log('App initialization result:', result);
    return result;
  }
);

export const loadSettings = createAsyncThunk(
  'app/loadSettings',
  async () => {
    // TODO: Load settings from storage
    return {};
  }
);

export const saveSettings = createAsyncThunk(
  'app/saveSettings',
  async (settings: Partial<AppState['settings']>) => {
    // TODO: Save settings to storage
    return settings;
  }
);

export const openProject = createAsyncThunk(
  'app/openProject',
  async (projectPath: string) => {
    // TODO: Validate and open project
    return projectPath;
  }
);

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
    updateSettings: (state, action: PayloadAction<Partial<AppState['settings']>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    addRecentProject: (state, action: PayloadAction<string>) => {
      const projectPath = action.payload;
      state.recentProjects = [
        projectPath,
        ...state.recentProjects.filter(p => p !== projectPath)
      ].slice(0, 10); // Keep only 10 recent projects
    },
    removeRecentProject: (state, action: PayloadAction<string>) => {
      state.recentProjects = state.recentProjects.filter(p => p !== action.payload);
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Initialize app
      .addCase(initializeApp.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(initializeApp.fulfilled, (state, action) => {
        state.status = 'idle';
        state.isInitialized = true;
        state.platform = action.payload.platform;
        state.version = action.payload.version;
      })
      .addCase(initializeApp.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.error.message || 'Failed to initialize app';
      })
      
      // Load settings
      .addCase(loadSettings.fulfilled, (state, action) => {
        state.settings = { ...state.settings, ...action.payload };
      })
      
      // Save settings
      .addCase(saveSettings.fulfilled, (state, action) => {
        state.settings = { ...state.settings, ...action.payload };
      })
      
      // Open project
      .addCase(openProject.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(openProject.fulfilled, (state, action) => {
        state.status = 'idle';
        state.currentProject = action.payload;
        // Add to recent projects
        const projectPath = action.payload;
        state.recentProjects = [
          projectPath,
          ...state.recentProjects.filter(p => p !== projectPath)
        ].slice(0, 10);
      })
      .addCase(openProject.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.error.message || 'Failed to open project';
      });
  }
});

export const {
  setTheme,
  updateSettings,
  addRecentProject,
  removeRecentProject,
  clearError
} = appSlice.actions;