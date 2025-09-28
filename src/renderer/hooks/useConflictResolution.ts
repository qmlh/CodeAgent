/**
 * Conflict Resolution Hook
 * Custom hook for managing conflict resolution operations
 */

import { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { message } from 'antd';
import { RootState } from '../store/store';
import {
  loadActiveConflicts,
  loadConflictHistory,
  loadFileLocks,
  setCurrentConflict,
  setResolutionDialogVisible,
  showResolutionWizard,
  addPreventionAlert,
  updateFileLock,
  removeFileLock
} from '../store/slices/conflictSlice';
import { ConflictPreventionAlert, ConflictResolutionWizardStep } from '../types/conflict';
import { v4 as uuidv4 } from 'uuid';

export const useConflictResolution = () => {
  const dispatch = useDispatch();
  const conflictState = useSelector((state: RootState) => state.conflict);

  // Load initial data
  useEffect(() => {
    (dispatch as any)(loadActiveConflicts());
    (dispatch as any)(loadConflictHistory({}));
    (dispatch as any)(loadFileLocks());
  }, [dispatch]);

  // Refresh data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      (dispatch as any)(loadActiveConflicts());
      (dispatch as any)(loadFileLocks());
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [dispatch]);

  // Open conflict resolution dialog
  const openConflictResolution = useCallback((conflictId: string) => {
    dispatch(setCurrentConflict(conflictId));
    dispatch(setResolutionDialogVisible(true));
  }, [dispatch]);

  // Open conflict resolution wizard
  const openConflictWizard = useCallback((conflictId: string) => {
    const wizardSteps: ConflictResolutionWizardStep[] = [
      {
        id: 'analysis',
        title: 'Analyze Conflict',
        description: 'Understand the nature and scope of the conflict',
        component: () => null, // Will be replaced with actual components
        isCompleted: false,
        isOptional: false
      },
      {
        id: 'strategy',
        title: 'Choose Strategy',
        description: 'Select the best resolution approach',
        component: () => null,
        isCompleted: false,
        isOptional: false
      },
      {
        id: 'validation',
        title: 'Validate Result',
        description: 'Review and validate the merged result',
        component: () => null,
        isCompleted: false,
        isOptional: false
      },
      {
        id: 'completion',
        title: 'Complete',
        description: 'Finalize the resolution',
        component: () => null,
        isCompleted: false,
        isOptional: false
      }
    ];

    dispatch(showResolutionWizard({ conflictId, steps: wizardSteps }));
  }, [dispatch]);

  // Show prevention alert
  const showPreventionAlert = useCallback((
    filePath: string,
    message: string,
    severity: 'info' | 'warning' | 'error',
    involvedAgents: any[]
  ) => {
    const alert: ConflictPreventionAlert = {
      id: uuidv4(),
      filePath,
      message,
      severity,
      involvedAgents,
      timestamp: new Date(),
      dismissed: false
    };

    dispatch(addPreventionAlert(alert));

    // Auto-dismiss info alerts after 10 seconds
    if (severity === 'info') {
      setTimeout(() => {
        dispatch(addPreventionAlert({ ...alert, dismissed: true }));
      }, 10000);
    }
  }, [dispatch]);

  // Update file lock status
  const updateFileLockStatus = useCallback((filePath: string, lockInfo: any) => {
    if (lockInfo) {
      dispatch(updateFileLock({
        filePath,
        isLocked: true,
        lockedBy: lockInfo.agent,
        lockType: lockInfo.type,
        lockedAt: lockInfo.lockedAt,
        expiresAt: lockInfo.expiresAt
      }));
    } else {
      dispatch(removeFileLock(filePath));
    }
  }, [dispatch]);

  // Check for potential conflicts when agents start working on files
  const checkForPotentialConflicts = useCallback((filePath: string, agentId: string) => {
    const existingLock = conflictState.fileLocks.find((lock: any) => lock.filePath === filePath);
    
    if (existingLock && existingLock.lockedBy?.id !== agentId) {
      showPreventionAlert(
        filePath,
        `Another agent (${existingLock.lockedBy?.name}) is currently working on this file. Potential conflict detected.`,
        'warning',
        [existingLock.lockedBy]
      );
    }
  }, [conflictState.fileLocks, showPreventionAlert]);

  // Simulate conflict detection (in a real app, this would come from the backend)
  const simulateConflictDetection = useCallback(() => {
    // This is for testing purposes
    const mockAgents = [
      { id: 'agent-1', name: 'Frontend Agent', type: 'frontend' },
      { id: 'agent-2', name: 'Backend Agent', type: 'backend' }
    ];

    showPreventionAlert(
      'src/components/TestComponent.tsx',
      'Multiple agents are attempting to modify the same file simultaneously.',
      'warning',
      mockAgents
    );
  }, [showPreventionAlert]);

  return {
    // State
    ...conflictState,
    
    // Actions
    openConflictResolution,
    openConflictWizard,
    showPreventionAlert,
    updateFileLockStatus,
    checkForPotentialConflicts,
    simulateConflictDetection,
    
    // Computed values
    hasActiveConflicts: conflictState.activeConflicts.length > 0,
    hasUnresolvedAlerts: conflictState.preventionAlerts.filter((a: any) => !a.dismissed).length > 0,
    totalConflictsResolved: conflictState.conflictHistory.length
  };
};