/**
 * Task Gantt View Component
 * Displays tasks in a Gantt chart with timeline and dependencies
 */
import React from 'react';
import { Task } from '../../store/slices/taskSlice';
export interface TaskGanttViewProps {
    tasks: Task[];
    onAssignTask: (taskId: string) => void;
}
export declare const TaskGanttView: React.FC<TaskGanttViewProps>;
