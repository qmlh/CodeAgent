/**
 * File State Slice
 * Manages file system state and operations
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  isFile: boolean;
  size?: number;
  mtime?: Date;
  children?: FileItem[];
  expanded?: boolean;
}

export interface OpenFile {
  path: string;
  name: string;
  content: string;
  isDirty: boolean;
  isReadonly: boolean;
  language: string;
  encoding: string;
  lineEnding: 'lf' | 'crlf';
  lastModified: Date;
}

export interface FileState {
  currentWorkspace: string | null;
  fileTree: FileItem[];
  openFiles: OpenFile[];
  activeFile: string | null;
  recentFiles: string[];
  watchedDirectories: string[];
  searchResults: Array<{
    path: string;
    name: string;
    matches?: Array<{ line: number; content: string }>;
  }>;
  status: 'idle' | 'loading' | 'error';
  error: string | null;
}

const initialState: FileState = {
  currentWorkspace: null,
  fileTree: [],
  openFiles: [],
  activeFile: null,
  recentFiles: [],
  watchedDirectories: [],
  searchResults: [],
  status: 'idle',
  error: null
};

// Async thunks
export const loadWorkspace = createAsyncThunk(
  'file/loadWorkspace',
  async (workspacePath: string) => {
    const result = await window.electronAPI?.fs.listDirectory(workspacePath);
    if (!result?.success) {
      throw new Error(result?.error || 'Failed to load workspace');
    }
    
    // Start watching the workspace
    await window.electronAPI?.fs.watchDirectory(workspacePath);
    
    return {
      workspacePath,
      files: result.items
    };
  }
);

export const loadDirectory = createAsyncThunk(
  'file/loadDirectory',
  async (directoryPath: string) => {
    const result = await window.electronAPI?.fs.listDirectory(directoryPath);
    if (!result?.success) {
      throw new Error(result?.error || 'Failed to load directory');
    }
    
    return {
      directoryPath,
      files: result.items
    };
  }
);

export const openFile = createAsyncThunk(
  'file/openFile',
  async (filePath: string) => {
    const result = await window.electronAPI?.fs.readFile(filePath);
    if (!result?.success) {
      throw new Error(result?.error || 'Failed to open file');
    }
    
    const stats = await window.electronAPI?.fs.getStats(filePath);
    
    return {
      path: filePath,
      name: filePath.split('/').pop() || filePath,
      content: result.content,
      lastModified: stats?.success ? new Date(stats.stats.mtime) : new Date()
    };
  }
);

export const saveFile = createAsyncThunk(
  'file/saveFile',
  async ({ filePath, content }: { filePath: string; content: string }) => {
    const result = await window.electronAPI?.fs.writeFile(filePath, content);
    if (!result?.success) {
      throw new Error(result?.error || 'Failed to save file');
    }
    
    return { filePath, content };
  }
);

export const createFile = createAsyncThunk(
  'file/createFile',
  async ({ filePath, content = '' }: { filePath: string; content?: string }) => {
    const result = await window.electronAPI?.fs.writeFile(filePath, content);
    if (!result?.success) {
      throw new Error(result?.error || 'Failed to create file');
    }
    
    return { filePath, content };
  }
);

export const deleteFile = createAsyncThunk(
  'file/deleteFile',
  async (filePath: string) => {
    const result = await window.electronAPI?.fs.deleteFile(filePath);
    if (!result?.success) {
      throw new Error(result?.error || 'Failed to delete file');
    }
    
    return filePath;
  }
);

export const createDirectory = createAsyncThunk(
  'file/createDirectory',
  async (directoryPath: string) => {
    const result = await window.electronAPI?.fs.createDirectory(directoryPath);
    if (!result?.success) {
      throw new Error(result?.error || 'Failed to create directory');
    }
    
    return directoryPath;
  }
);

export const searchFiles = createAsyncThunk(
  'file/searchFiles',
  async ({ 
    query, 
    includeContent = false, 
    fileExtensions = [] 
  }: { 
    query: string; 
    includeContent?: boolean; 
    fileExtensions?: string[]; 
  }) => {
    // TODO: Implement file search via IPC
    // For now, return empty results
    return [];
  }
);

export const fileSlice = createSlice({
  name: 'file',
  initialState,
  reducers: {
    setActiveFile: (state, action: PayloadAction<string | null>) => {
      state.activeFile = action.payload;
    },
    
    closeFile: (state, action: PayloadAction<string>) => {
      const filePath = action.payload;
      state.openFiles = state.openFiles.filter(f => f.path !== filePath);
      
      if (state.activeFile === filePath) {
        state.activeFile = state.openFiles.length > 0 ? state.openFiles[0].path : null;
      }
      
      // Remove from recent files
      state.recentFiles = state.recentFiles.filter(f => f !== filePath);
    },
    
    updateFileContent: (state, action: PayloadAction<{ filePath: string; content: string }>) => {
      const { filePath, content } = action.payload;
      const file = state.openFiles.find(f => f.path === filePath);
      
      if (file) {
        file.content = content;
        file.isDirty = true;
      }
    },
    
    markFileSaved: (state, action: PayloadAction<string>) => {
      const filePath = action.payload;
      const file = state.openFiles.find(f => f.path === filePath);
      
      if (file) {
        file.isDirty = false;
        file.lastModified = new Date();
      }
    },
    
    expandDirectory: (state, action: PayloadAction<string>) => {
      const directoryPath = action.payload;
      
      const updateExpanded = (items: FileItem[]): void => {
        items.forEach(item => {
          if (item.path === directoryPath && item.isDirectory) {
            item.expanded = true;
          } else if (item.children) {
            updateExpanded(item.children);
          }
        });
      };
      
      updateExpanded(state.fileTree);
    },
    
    collapseDirectory: (state, action: PayloadAction<string>) => {
      const directoryPath = action.payload;
      
      const updateExpanded = (items: FileItem[]): void => {
        items.forEach(item => {
          if (item.path === directoryPath && item.isDirectory) {
            item.expanded = false;
          } else if (item.children) {
            updateExpanded(item.children);
          }
        });
      };
      
      updateExpanded(state.fileTree);
    },
    
    addRecentFile: (state, action: PayloadAction<string>) => {
      const filePath = action.payload;
      state.recentFiles = [
        filePath,
        ...state.recentFiles.filter(f => f !== filePath)
      ].slice(0, 20); // Keep only 20 recent files
    },
    
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    
    clearError: (state) => {
      state.error = null;
    }
  },
  
  extraReducers: (builder) => {
    builder
      // Load workspace
      .addCase(loadWorkspace.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(loadWorkspace.fulfilled, (state, action) => {
        state.status = 'idle';
        state.currentWorkspace = action.payload.workspacePath;
        state.fileTree = action.payload.files.map(file => ({
          ...file,
          expanded: false
        }));
        state.watchedDirectories.push(action.payload.workspacePath);
      })
      .addCase(loadWorkspace.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.error.message || 'Failed to load workspace';
      })
      
      // Load directory
      .addCase(loadDirectory.fulfilled, (state, action) => {
        const { directoryPath, files } = action.payload;
        
        const updateFileTree = (items: FileItem[]): void => {
          items.forEach(item => {
            if (item.path === directoryPath && item.isDirectory) {
              item.children = files.map(file => ({
                ...file,
                expanded: false
              }));
            } else if (item.children) {
              updateFileTree(item.children);
            }
          });
        };
        
        updateFileTree(state.fileTree);
      })
      
      // Open file
      .addCase(openFile.fulfilled, (state, action) => {
        const { path, name, content, lastModified } = action.payload;
        
        // Check if file is already open
        const existingFile = state.openFiles.find(f => f.path === path);
        
        if (!existingFile) {
          const newFile: OpenFile = {
            path,
            name,
            content,
            isDirty: false,
            isReadonly: false,
            language: getLanguageFromExtension(path),
            encoding: 'utf-8',
            lineEnding: 'lf',
            lastModified
          };
          
          state.openFiles.push(newFile);
        }
        
        state.activeFile = path;
        
        // Add to recent files
        state.recentFiles = [
          path,
          ...state.recentFiles.filter(f => f !== path)
        ].slice(0, 20);
      })
      
      // Save file
      .addCase(saveFile.fulfilled, (state, action) => {
        const { filePath } = action.payload;
        const file = state.openFiles.find(f => f.path === filePath);
        
        if (file) {
          file.isDirty = false;
          file.lastModified = new Date();
        }
      })
      
      // Create file
      .addCase(createFile.fulfilled, (state, action) => {
        const { filePath } = action.payload;
        // File tree will be updated via file watcher
      })
      
      // Delete file
      .addCase(deleteFile.fulfilled, (state, action) => {
        const filePath = action.payload;
        
        // Remove from open files
        state.openFiles = state.openFiles.filter(f => f.path !== filePath);
        
        // Update active file
        if (state.activeFile === filePath) {
          state.activeFile = state.openFiles.length > 0 ? state.openFiles[0].path : null;
        }
        
        // Remove from recent files
        state.recentFiles = state.recentFiles.filter(f => f !== filePath);
      })
      
      // Search files
      .addCase(searchFiles.fulfilled, (state, action) => {
        state.searchResults = action.payload;
      });
  }
});

// Helper function to determine language from file extension
function getLanguageFromExtension(filePath: string): string {
  const extension = filePath.split('.').pop()?.toLowerCase();
  
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'cs': 'csharp',
    'php': 'php',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'less': 'less',
    'json': 'json',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
    'md': 'markdown',
    'sql': 'sql',
    'sh': 'shell',
    'bash': 'shell',
    'zsh': 'shell'
  };
  
  return languageMap[extension || ''] || 'plaintext';
}

export const {
  setActiveFile,
  closeFile,
  updateFileContent,
  markFileSaved,
  expandDirectory,
  collapseDirectory,
  addRecentFile,
  clearSearchResults,
  clearError
} = fileSlice.actions;