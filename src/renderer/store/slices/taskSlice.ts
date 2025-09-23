/**
 * Task State Slice
 * Manages task state and operations
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Task {
  id: string;
  title: string;
  description: string;
  type: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedAgent?: string;
  dependencies: string[];
  estimatedTime: number;
  actualTime?: number;
  files: string[];
  requirements: string[];
  tags: string[];
  progress: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  dueDate?: Date;
  createdBy: string;
}

export interface TaskState {
  tasks: Task[];
  selectedTask: string | null;
  filterStatus: Task['status'] | 'all';
  filterPriority: Task['priority'] | 'all';
  filterAssignee: string | 'all';
  sortBy: 'createdAt' | 'priority' | 'dueDate' | 'status';
  sortOrder: 'asc' | 'desc';
  searchQuery: string;
  status: 'idle' | 'loading' | 'error';
  error: string | null;
}

const initialState: TaskState = {
  tasks: [],
  selectedTask: null,
  filterStatus: 'all',
  filterPriority: 'all',
  filterAssignee: 'all',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  searchQuery: '',
  status: 'idle',
  error: null
};

// Async thunks
export const loadTasks = createAsyncThunk(
  'task/loadTasks',
  async () => {
    const result = await window.electronAPI?.task.list();
    if (!result?.success) {
      throw new Error(result?.error || 'Failed to load tasks');
    }
    return result.tasks;
  }
);

export const createTask = createAsyncThunk(
  'task/createTask',
  async (taskData: {
    title: string;
    description: string;
    type: string;
    priority: Task['priority'];
    dependencies?: string[];
    estimatedTime: number;
    files?: string[];
    requirements?: string[];
    tags?: string[];
    dueDate?: Date;
  }) => {
    const result = await window.electronAPI?.task.create(taskData);
    if (!result?.success) {
      throw new Error(result?.error || 'Failed to create task');
    }
    
    // Return the created task data
    const newTask: Task = {
      id: result.taskId,
      title: taskData.title,
      description: taskData.description,
      type: taskData.type,
      status: 'pending',
      priority: taskData.priority,
      dependencies: taskData.dependencies || [],
      estimatedTime: taskData.estimatedTime,
      files: taskData.files || [],
      requirements: taskData.requirements || [],
      tags: taskData.tags || [],
      progress: 0,
      createdAt: new Date(),
      dueDate: taskData.dueDate,
      createdBy: 'user' // TODO: Get actual user
    };
    
    return newTask;
  }
);

export const assignTask = createAsyncThunk(
  'task/assignTask',
  async ({ taskId, agentId }: { taskId: string; agentId: string }) => {
    const result = await window.electronAPI?.task.assign(taskId, agentId);
    if (!result?.success) {
      throw new Error(result?.error || 'Failed to assign task');
    }
    return { taskId, agentId };
  }
);

export const getTaskStatus = createAsyncThunk(
  'task/getTaskStatus',
  async (taskId: string) => {
    const result = await window.electronAPI?.task.getStatus(taskId);
    if (!result?.success) {
      throw new Error(result?.error || 'Failed to get task status');
    }
    return { taskId, status: result.status };
  }
);

export const taskSlice = createSlice({
  name: 'task',
  initialState,
  reducers: {
    setSelectedTask: (state, action: PayloadAction<string | null>) => {
      state.selectedTask = action.payload;
    },
    
    updateTaskStatus: (state, action: PayloadAction<{ taskId: string; status: Task['status'] }>) => {
      const { taskId, status } = action.payload;
      const task = state.tasks.find(t => t.id === taskId);
      
      if (task) {
        const oldStatus = task.status;
        task.status = status;
        
        // Update timestamps based on status changes
        if (status === 'in_progress' && oldStatus === 'pending') {
          task.startedAt = new Date();
        } else if (status === 'completed' || status === 'failed') {
          task.completedAt = new Date();
          task.progress = status === 'completed' ? 100 : task.progress;
          
          // Calculate actual time if started
          if (task.startedAt) {
            task.actualTime = Date.now() - task.startedAt.getTime();
          }
        }
      }
    },
    
    updateTaskProgress: (state, action: PayloadAction<{ taskId: string; progress: number }>) => {
      const { taskId, progress } = action.payload;
      const task = state.tasks.find(t => t.id === taskId);
      
      if (task) {
        task.progress = Math.max(0, Math.min(100, progress));
        
        // Auto-complete if progress reaches 100%
        if (task.progress === 100 && task.status !== 'completed') {
          task.status = 'completed';
          task.completedAt = new Date();
        }
      }
    },
    
    assignTaskToAgent: (state, action: PayloadAction<{ taskId: string; agentId: string }>) => {
      const { taskId, agentId } = action.payload;
      const task = state.tasks.find(t => t.id === taskId);
      
      if (task) {
        task.assignedAgent = agentId;
        
        // Auto-start task if it was pending
        if (task.status === 'pending') {
          task.status = 'in_progress';
          task.startedAt = new Date();
        }
      }
    },
    
    unassignTask: (state, action: PayloadAction<string>) => {
      const taskId = action.payload;
      const task = state.tasks.find(t => t.id === taskId);
      
      if (task) {
        task.assignedAgent = undefined;
        
        // Reset to pending if it was in progress
        if (task.status === 'in_progress') {
          task.status = 'pending';
          task.startedAt = undefined;
        }
      }
    },
    
    updateTask: (state, action: PayloadAction<{ taskId: string; updates: Partial<Task> }>) => {
      const { taskId, updates } = action.payload;
      const task = state.tasks.find(t => t.id === taskId);
      
      if (task) {
        Object.assign(task, updates);
      }
    },
    
    deleteTask: (state, action: PayloadAction<string>) => {
      const taskId = action.payload;
      state.tasks = state.tasks.filter(t => t.id !== taskId);
      
      if (state.selectedTask === taskId) {
        state.selectedTask = null;
      }
    },
    
    addTaskDependency: (state, action: PayloadAction<{ taskId: string; dependencyId: string }>) => {
      const { taskId, dependencyId } = action.payload;
      const task = state.tasks.find(t => t.id === taskId);
      
      if (task && !task.dependencies.includes(dependencyId)) {
        task.dependencies.push(dependencyId);
      }
    },
    
    removeTaskDependency: (state, action: PayloadAction<{ taskId: string; dependencyId: string }>) => {
      const { taskId, dependencyId } = action.payload;
      const task = state.tasks.find(t => t.id === taskId);
      
      if (task) {
        task.dependencies = task.dependencies.filter(d => d !== dependencyId);
      }
    },
    
    addTaskFile: (state, action: PayloadAction<{ taskId: string; filePath: string }>) => {
      const { taskId, filePath } = action.payload;
      const task = state.tasks.find(t => t.id === taskId);
      
      if (task && !task.files.includes(filePath)) {
        task.files.push(filePath);
      }
    },
    
    removeTaskFile: (state, action: PayloadAction<{ taskId: string; filePath: string }>) => {
      const { taskId, filePath } = action.payload;
      const task = state.tasks.find(t => t.id === taskId);
      
      if (task) {
        task.files = task.files.filter(f => f !== filePath);
      }
    },
    
    addTaskTag: (state, action: PayloadAction<{ taskId: string; tag: string }>) => {
      const { taskId, tag } = action.payload;
      const task = state.tasks.find(t => t.id === taskId);
      
      if (task && !task.tags.includes(tag)) {
        task.tags.push(tag);
      }
    },
    
    removeTaskTag: (state, action: PayloadAction<{ taskId: string; tag: string }>) => {
      const { taskId, tag } = action.payload;
      const task = state.tasks.find(t => t.id === taskId);
      
      if (task) {
        task.tags = task.tags.filter(t => t !== tag);
      }
    },
    
    // Filter and sort actions
    setFilterStatus: (state, action: PayloadAction<Task['status'] | 'all'>) => {
      state.filterStatus = action.payload;
    },
    
    setFilterPriority: (state, action: PayloadAction<Task['priority'] | 'all'>) => {
      state.filterPriority = action.payload;
    },
    
    setFilterAssignee: (state, action: PayloadAction<string | 'all'>) => {
      state.filterAssignee = action.payload;
    },
    
    setSortBy: (state, action: PayloadAction<TaskState['sortBy']>) => {
      state.sortBy = action.payload;
    },
    
    setSortOrder: (state, action: PayloadAction<'asc' | 'desc'>) => {
      state.sortOrder = action.payload;
    },
    
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    
    clearFilters: (state) => {
      state.filterStatus = 'all';
      state.filterPriority = 'all';
      state.filterAssignee = 'all';
      state.searchQuery = '';
    },
    
    clearError: (state) => {
      state.error = null;
    }
  },
  
  extraReducers: (builder) => {
    builder
      // Load tasks
      .addCase(loadTasks.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(loadTasks.fulfilled, (state, action) => {
        state.status = 'idle';
        state.tasks = action.payload;
      })
      .addCase(loadTasks.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.error.message || 'Failed to load tasks';
      })
      
      // Create task
      .addCase(createTask.fulfilled, (state, action) => {
        state.tasks.push(action.payload);
      })
      
      // Assign task
      .addCase(assignTask.fulfilled, (state, action) => {
        const { taskId, agentId } = action.payload;
        const task = state.tasks.find(t => t.id === taskId);
        
        if (task) {
          task.assignedAgent = agentId;
          
          if (task.status === 'pending') {
            task.status = 'in_progress';
            task.startedAt = new Date();
          }
        }
      })
      
      // Get task status
      .addCase(getTaskStatus.fulfilled, (state, action) => {
        const { taskId, status } = action.payload;
        const task = state.tasks.find(t => t.id === taskId);
        
        if (task) {
          task.status = status;
        }
      });
  }
});

export const {
  setSelectedTask,
  updateTaskStatus,
  updateTaskProgress,
  assignTaskToAgent,
  unassignTask,
  updateTask,
  deleteTask,
  addTaskDependency,
  removeTaskDependency,
  addTaskFile,
  removeTaskFile,
  addTaskTag,
  removeTaskTag,
  setFilterStatus,
  setFilterPriority,
  setFilterAssignee,
  setSortBy,
  setSortOrder,
  setSearchQuery,
  clearFilters,
  clearError
} = taskSlice.actions;