/**
 * Task List View Component
 * Displays tasks in a detailed list format with sorting and filtering
 */
import React from 'react';
import { Task } from '../../store/slices/taskSlice';
export interface TaskListViewProps {
    tasks: Task[];
    onAssignTask: (taskId: string) => void;
}
export declare const TaskListView: React.FC<TaskListViewProps>;
