/**
 * Task Assignment Modal Component
 * Modal for assigning tasks to agents with intelligent suggestions
 */
import React from 'react';
export interface TaskAssignmentModalProps {
    open: boolean;
    taskId: string | null;
    onClose: () => void;
    onAssign: () => void;
}
export declare const TaskAssignmentModal: React.FC<TaskAssignmentModalProps>;
