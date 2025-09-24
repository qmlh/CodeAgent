/**
 * Task Create Form Component
 * Form for creating new tasks with all necessary fields
 */
import React from 'react';
import { Task } from '../../store/slices/taskSlice';
export interface TaskCreateFormProps {
    onSubmit: (taskData: any) => void;
    onCancel: () => void;
    initialData?: Partial<Task>;
}
export declare const TaskCreateForm: React.FC<TaskCreateFormProps>;
