/**
 * Task State Slice
 * Manages task state and operations
 */
import { PayloadAction } from '@reduxjs/toolkit';
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
export declare const loadTasks: import("@reduxjs/toolkit").AsyncThunk<any, void, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const createTask: import("@reduxjs/toolkit").AsyncThunk<Task, {
    title: string;
    description: string;
    type: string;
    priority: Task["priority"];
    dependencies?: string[];
    estimatedTime: number;
    files?: string[];
    requirements?: string[];
    tags?: string[];
    dueDate?: Date;
}, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const assignTask: import("@reduxjs/toolkit").AsyncThunk<{
    taskId: string;
    agentId: string;
}, {
    taskId: string;
    agentId: string;
}, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const getTaskStatus: import("@reduxjs/toolkit").AsyncThunk<{
    taskId: string;
    status: any;
}, string, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const taskSlice: import("@reduxjs/toolkit").Slice<TaskState, {
    setSelectedTask: (state: import("immer").WritableDraft<TaskState>, action: PayloadAction<string | null>) => void;
    updateTaskStatus: (state: import("immer").WritableDraft<TaskState>, action: PayloadAction<{
        taskId: string;
        status: Task["status"];
    }>) => void;
    updateTaskProgress: (state: import("immer").WritableDraft<TaskState>, action: PayloadAction<{
        taskId: string;
        progress: number;
    }>) => void;
    assignTaskToAgent: (state: import("immer").WritableDraft<TaskState>, action: PayloadAction<{
        taskId: string;
        agentId: string;
    }>) => void;
    unassignTask: (state: import("immer").WritableDraft<TaskState>, action: PayloadAction<string>) => void;
    updateTask: (state: import("immer").WritableDraft<TaskState>, action: PayloadAction<{
        taskId: string;
        updates: Partial<Task>;
    }>) => void;
    deleteTask: (state: import("immer").WritableDraft<TaskState>, action: PayloadAction<string>) => void;
    addTaskDependency: (state: import("immer").WritableDraft<TaskState>, action: PayloadAction<{
        taskId: string;
        dependencyId: string;
    }>) => void;
    removeTaskDependency: (state: import("immer").WritableDraft<TaskState>, action: PayloadAction<{
        taskId: string;
        dependencyId: string;
    }>) => void;
    addTaskFile: (state: import("immer").WritableDraft<TaskState>, action: PayloadAction<{
        taskId: string;
        filePath: string;
    }>) => void;
    removeTaskFile: (state: import("immer").WritableDraft<TaskState>, action: PayloadAction<{
        taskId: string;
        filePath: string;
    }>) => void;
    addTaskTag: (state: import("immer").WritableDraft<TaskState>, action: PayloadAction<{
        taskId: string;
        tag: string;
    }>) => void;
    removeTaskTag: (state: import("immer").WritableDraft<TaskState>, action: PayloadAction<{
        taskId: string;
        tag: string;
    }>) => void;
    setFilterStatus: (state: import("immer").WritableDraft<TaskState>, action: PayloadAction<Task["status"] | "all">) => void;
    setFilterPriority: (state: import("immer").WritableDraft<TaskState>, action: PayloadAction<Task["priority"] | "all">) => void;
    setFilterAssignee: (state: import("immer").WritableDraft<TaskState>, action: PayloadAction<string | "all">) => void;
    setSortBy: (state: import("immer").WritableDraft<TaskState>, action: PayloadAction<TaskState["sortBy"]>) => void;
    setSortOrder: (state: import("immer").WritableDraft<TaskState>, action: PayloadAction<"asc" | "desc">) => void;
    setSearchQuery: (state: import("immer").WritableDraft<TaskState>, action: PayloadAction<string>) => void;
    clearFilters: (state: import("immer").WritableDraft<TaskState>) => void;
    clearError: (state: import("immer").WritableDraft<TaskState>) => void;
}, "task", "task", import("@reduxjs/toolkit").SliceSelectors<TaskState>>;
export declare const setSelectedTask: import("@reduxjs/toolkit").ActionCreatorWithPayload<string | null, "task/setSelectedTask">, updateTaskStatus: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    taskId: string;
    status: Task["status"];
}, "task/updateTaskStatus">, updateTaskProgress: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    taskId: string;
    progress: number;
}, "task/updateTaskProgress">, assignTaskToAgent: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    taskId: string;
    agentId: string;
}, "task/assignTaskToAgent">, unassignTask: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "task/unassignTask">, updateTask: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    taskId: string;
    updates: Partial<Task>;
}, "task/updateTask">, deleteTask: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "task/deleteTask">, addTaskDependency: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    taskId: string;
    dependencyId: string;
}, "task/addTaskDependency">, removeTaskDependency: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    taskId: string;
    dependencyId: string;
}, "task/removeTaskDependency">, addTaskFile: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    taskId: string;
    filePath: string;
}, "task/addTaskFile">, removeTaskFile: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    taskId: string;
    filePath: string;
}, "task/removeTaskFile">, addTaskTag: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    taskId: string;
    tag: string;
}, "task/addTaskTag">, removeTaskTag: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    taskId: string;
    tag: string;
}, "task/removeTaskTag">, setFilterStatus: import("@reduxjs/toolkit").ActionCreatorWithPayload<"all" | "pending" | "failed" | "completed" | "in_progress" | "blocked", "task/setFilterStatus">, setFilterPriority: import("@reduxjs/toolkit").ActionCreatorWithPayload<"all" | "critical" | "high" | "low" | "medium", "task/setFilterPriority">, setFilterAssignee: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "task/setFilterAssignee">, setSortBy: import("@reduxjs/toolkit").ActionCreatorWithPayload<"status" | "createdAt" | "priority" | "dueDate", "task/setSortBy">, setSortOrder: import("@reduxjs/toolkit").ActionCreatorWithPayload<"asc" | "desc", "task/setSortOrder">, setSearchQuery: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "task/setSearchQuery">, clearFilters: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"task/clearFilters">, clearError: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"task/clearError">;
