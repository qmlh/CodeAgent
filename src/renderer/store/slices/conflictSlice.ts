/**
 * Conflict Resolution State Slice
 * Manages state for file conflict resolution interface
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  ConflictUIState, 
  ConflictHistoryEntry, 
  FileLockIndicator, 
  ConflictPreventionAlert,
  ResolutionSuggestion,
  ConflictMetrics
} from '../../types/conflict';
import { Conflict, ConflictResolution } from '../../../types/file.types';

export interface ConflictState {
  // Active conflicts
  activeConflicts: ConflictUIState[];
  currentConflictId: string | null;
  
  // Conflict history
  conflictHistory: ConflictHistoryEntry[];
  historyFilter: {
    dateRange: [Date, Date] | null;
    agentFilter: string[];
    fileFilter: string[];
    resolutionTypeFilter: string[];
  };
  
  // File lock indicators
  fileLocks: FileLockIndicator[];
  
  // Prevention alerts
  preventionAlerts: ConflictPreventionAlert[];
  alertsVisible: boolean;
  
  // Resolution wizard
  wizardVisible: boolean;
  wizardCurrentStep: number;
  wizardSteps: any[];
  
  // UI state
  resolutionDialogVisible: boolean;
  diffViewMode: 'side-by-side' | 'unified' | 'three-way';
  showLineNumbers: boolean;
  showWhitespace: boolean;
  syntaxHighlighting: boolean;
  
  // Metrics
  metrics: ConflictMetrics | null;
  
  // Loading states
  isLoadingConflicts: boolean;
  isLoadingHistory: boolean;
  isResolvingConflict: boolean;
  
  // Error states
  error: string | null;
}

const initialState: ConflictState = {
  activeConflicts: [],
  currentConflictId: null,
  conflictHistory: [],
  historyFilter: {
    dateRange: null,
    agentFilter: [],
    fileFilter: [],
    resolutionTypeFilter: []
  },
  fileLocks: [],
  preventionAlerts: [],
  alertsVisible: true,
  wizardVisible: false,
  wizardCurrentStep: 0,
  wizardSteps: [],
  resolutionDialogVisible: false,
  diffViewMode: 'three-way',
  showLineNumbers: true,
  showWhitespace: false,
  syntaxHighlighting: true,
  metrics: null,
  isLoadingConflicts: false,
  isLoadingHistory: false,
  isResolvingConflict: false,
  error: null
};

// Async thunks
export const loadActiveConflicts = createAsyncThunk(
  'conflict/loadActiveConflicts',
  async () => {
    // Mock implementation for now - in real app this would call the actual service
    try {
      const response = await (window as any).electronAPI?.invoke?.('conflict:getActiveConflicts');
      return response || [];
    } catch (error) {
      console.warn('electronAPI not available, using mock data');
      return [];
    }
  }
);

export const loadConflictHistory = createAsyncThunk(
  'conflict/loadConflictHistory',
  async (filters?: any) => {
    try {
      const response = await (window as any).electronAPI?.invoke?.('conflict:getHistory', filters);
      return response || [];
    } catch (error) {
      console.warn('electronAPI not available, using mock data');
      return [];
    }
  }
);

export const resolveConflict = createAsyncThunk(
  'conflict/resolveConflict',
  async ({ conflictId, resolution }: { conflictId: string; resolution: any }) => {
    try {
      const response = await (window as any).electronAPI?.invoke?.('conflict:resolve', { conflictId, resolution });
      return response;
    } catch (error) {
      console.warn('electronAPI not available, using mock resolution');
      return { conflictId, resolved: true };
    }
  }
);

export const loadFileLocks = createAsyncThunk(
  'conflict/loadFileLocks',
  async () => {
    try {
      const response = await (window as any).electronAPI?.invoke?.('file:getActiveLocks');
      return response || [];
    } catch (error) {
      console.warn('electronAPI not available, using mock data');
      return [];
    }
  }
);

export const generateResolutionSuggestions = createAsyncThunk(
  'conflict/generateSuggestions',
  async (conflictId: string) => {
    try {
      const response = await (window as any).electronAPI?.invoke?.('conflict:generateSuggestions', conflictId);
      return { conflictId, suggestions: response || [] };
    } catch (error) {
      console.warn('electronAPI not available, using mock suggestions');
      return { conflictId, suggestions: [] };
    }
  }
);

export const conflictSlice = createSlice({
  name: 'conflict',
  initialState,
  reducers: {
    // Conflict management
    setCurrentConflict: (state, action: PayloadAction<string | null>) => {
      state.currentConflictId = action.payload;
    },
    
    updateConflictContent: (state, action: PayloadAction<{
      conflictId: string;
      type: 'local' | 'remote' | 'merged';
      content: string;
    }>) => {
      const conflict = state.activeConflicts.find(c => c.id === action.payload.conflictId);
      if (conflict) {
        switch (action.payload.type) {
          case 'local':
            conflict.localContent = action.payload.content;
            break;
          case 'remote':
            conflict.remoteContent = action.payload.content;
            break;
          case 'merged':
            conflict.mergedContent = action.payload.content;
            conflict.hasUnsavedChanges = true;
            break;
        }
      }
    },
    
    markConflictAsResolving: (state, action: PayloadAction<string>) => {
      const conflict = state.activeConflicts.find(c => c.id === action.payload);
      if (conflict) {
        conflict.isResolving = true;
      }
    },
    
    removeResolvedConflict: (state, action: PayloadAction<string>) => {
      state.activeConflicts = state.activeConflicts.filter(c => c.id !== action.payload);
      if (state.currentConflictId === action.payload) {
        state.currentConflictId = null;
      }
    },
    
    // File locks
    updateFileLock: (state, action: PayloadAction<FileLockIndicator>) => {
      const index = state.fileLocks.findIndex(lock => lock.filePath === action.payload.filePath);
      if (index !== -1) {
        state.fileLocks[index] = action.payload;
      } else {
        state.fileLocks.push(action.payload);
      }
    },
    
    removeFileLock: (state, action: PayloadAction<string>) => {
      state.fileLocks = state.fileLocks.filter(lock => lock.filePath !== action.payload);
    },
    
    // Prevention alerts
    addPreventionAlert: (state, action: PayloadAction<ConflictPreventionAlert>) => {
      state.preventionAlerts.unshift(action.payload);
      // Keep only the last 50 alerts
      if (state.preventionAlerts.length > 50) {
        state.preventionAlerts = state.preventionAlerts.slice(0, 50);
      }
    },
    
    dismissAlert: (state, action: PayloadAction<string>) => {
      const alert = state.preventionAlerts.find(a => a.id === action.payload);
      if (alert) {
        alert.dismissed = true;
      }
    },
    
    clearDismissedAlerts: (state) => {
      state.preventionAlerts = state.preventionAlerts.filter(a => !a.dismissed);
    },
    
    setAlertsVisible: (state, action: PayloadAction<boolean>) => {
      state.alertsVisible = action.payload;
    },
    
    // Resolution wizard
    showResolutionWizard: (state, action: PayloadAction<{ conflictId: string; steps: any[] }>) => {
      state.wizardVisible = true;
      state.wizardCurrentStep = 0;
      state.wizardSteps = action.payload.steps;
      state.currentConflictId = action.payload.conflictId;
    },
    
    hideResolutionWizard: (state) => {
      state.wizardVisible = false;
      state.wizardCurrentStep = 0;
      state.wizardSteps = [];
    },
    
    setWizardStep: (state, action: PayloadAction<number>) => {
      state.wizardCurrentStep = action.payload;
    },
    
    completeWizardStep: (state, action: PayloadAction<{ stepIndex: number; data?: any }>) => {
      if (state.wizardSteps[action.payload.stepIndex]) {
        state.wizardSteps[action.payload.stepIndex].isCompleted = true;
        if (action.payload.data) {
          state.wizardSteps[action.payload.stepIndex].data = action.payload.data;
        }
      }
    },
    
    // UI settings
    setResolutionDialogVisible: (state, action: PayloadAction<boolean>) => {
      state.resolutionDialogVisible = action.payload;
    },
    
    setDiffViewMode: (state, action: PayloadAction<'side-by-side' | 'unified' | 'three-way'>) => {
      state.diffViewMode = action.payload;
    },
    
    toggleLineNumbers: (state) => {
      state.showLineNumbers = !state.showLineNumbers;
    },
    
    toggleWhitespace: (state) => {
      state.showWhitespace = !state.showWhitespace;
    },
    
    toggleSyntaxHighlighting: (state) => {
      state.syntaxHighlighting = !state.syntaxHighlighting;
    },
    
    // History filters
    setHistoryFilter: (state, action: PayloadAction<Partial<ConflictState['historyFilter']>>) => {
      state.historyFilter = { ...state.historyFilter, ...action.payload };
    },
    
    clearHistoryFilters: (state) => {
      state.historyFilter = {
        dateRange: null,
        agentFilter: [],
        fileFilter: [],
        resolutionTypeFilter: []
      };
    },
    
    // Error handling
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    }
  },
  
  extraReducers: (builder) => {
    // Load active conflicts
    builder
      .addCase(loadActiveConflicts.pending, (state) => {
        state.isLoadingConflicts = true;
        state.error = null;
      })
      .addCase(loadActiveConflicts.fulfilled, (state, action) => {
        state.isLoadingConflicts = false;
        state.activeConflicts = action.payload;
      })
      .addCase(loadActiveConflicts.rejected, (state, action) => {
        state.isLoadingConflicts = false;
        state.error = action.error.message || 'Failed to load conflicts';
      });
    
    // Load conflict history
    builder
      .addCase(loadConflictHistory.pending, (state) => {
        state.isLoadingHistory = true;
        state.error = null;
      })
      .addCase(loadConflictHistory.fulfilled, (state, action) => {
        state.isLoadingHistory = false;
        state.conflictHistory = action.payload;
      })
      .addCase(loadConflictHistory.rejected, (state, action) => {
        state.isLoadingHistory = false;
        state.error = action.error.message || 'Failed to load conflict history';
      });
    
    // Resolve conflict
    builder
      .addCase(resolveConflict.pending, (state) => {
        state.isResolvingConflict = true;
        state.error = null;
      })
      .addCase(resolveConflict.fulfilled, (state, action) => {
        state.isResolvingConflict = false;
        // Remove the resolved conflict from active conflicts
        const conflictId = action.meta.arg.conflictId;
        state.activeConflicts = state.activeConflicts.filter(c => c.id !== conflictId);
        if (state.currentConflictId === conflictId) {
          state.currentConflictId = null;
        }
        // Add to history
        if (action.payload) {
          state.conflictHistory.unshift(action.payload);
        }
      })
      .addCase(resolveConflict.rejected, (state, action) => {
        state.isResolvingConflict = false;
        state.error = action.error.message || 'Failed to resolve conflict';
      });
    
    // Load file locks
    builder
      .addCase(loadFileLocks.fulfilled, (state, action) => {
        state.fileLocks = action.payload;
      });
    
    // Generate resolution suggestions
    builder
      .addCase(generateResolutionSuggestions.fulfilled, (state, action) => {
        const conflict = state.activeConflicts.find(c => c.id === action.payload.conflictId);
        if (conflict) {
          conflict.resolutionSuggestions = action.payload.suggestions;
        }
      });
  }
});

export const {
  setCurrentConflict,
  updateConflictContent,
  markConflictAsResolving,
  removeResolvedConflict,
  updateFileLock,
  removeFileLock,
  addPreventionAlert,
  dismissAlert,
  clearDismissedAlerts,
  setAlertsVisible,
  showResolutionWizard,
  hideResolutionWizard,
  setWizardStep,
  completeWizardStep,
  setResolutionDialogVisible,
  setDiffViewMode,
  toggleLineNumbers,
  toggleWhitespace,
  toggleSyntaxHighlighting,
  setHistoryFilter,
  clearHistoryFilters,
  setError,
  clearError
} = conflictSlice.actions;