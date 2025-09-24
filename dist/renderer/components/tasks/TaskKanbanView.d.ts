/**
 * Task Kanban View Component
 * Displays tasks in a Kanban board with drag and drop support
 */
import React from 'react';
import { Task } from '../../store/slices/taskSlice';
export interface TaskKanbanViewProps {
    tasks: Task[];
    onAssignTask: (taskId: string) => void;
}
export declare const TaskKanbanView: React.FC<TaskKanbanViewProps>;
