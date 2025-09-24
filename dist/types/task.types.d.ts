/**
 * Task system type definitions
 */
export declare enum TaskStatus {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    FAILED = "failed",
    BLOCKED = "blocked"
}
export declare enum TaskPriority {
    LOW = 1,
    MEDIUM = 2,
    HIGH = 3,
    CRITICAL = 4
}
export interface Task {
    id: string;
    title: string;
    description: string;
    type: string;
    status: TaskStatus;
    priority: TaskPriority;
    assignedAgent?: string;
    dependencies: string[];
    estimatedTime: number;
    files: string[];
    requirements: string[];
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
}
export interface TaskResult {
    taskId: string;
    success: boolean;
    output?: any;
    error?: string;
    filesModified: string[];
    executionTime: number;
    completedAt: Date;
}
