/**
 * Initialize Mock Data for Development
 */

import { store } from '../store/store';
import { mockAgents, mockTasks, mockFiles, mockMessages, mockCollaborationSessions } from './mockData';

export const initializeMockData = () => {
  const { dispatch } = store;

  // Load mock agents
  mockAgents.forEach(agent => {
    dispatch({
      type: 'agent/createAgent/fulfilled',
      payload: agent
    });
  });

  // Load mock tasks
  mockTasks.forEach(task => {
    dispatch({
      type: 'task/createTask/fulfilled',
      payload: task
    });
  });

  // Load mock messages
  mockMessages.forEach(message => {
    dispatch({
      type: 'agent/addAgentMessage',
      payload: message
    });
  });

  // Load mock collaboration sessions
  mockCollaborationSessions.forEach(session => {
    dispatch({
      type: 'agent/startCollaborationSession',
      payload: {
        participants: session.participants,
        sharedFiles: session.sharedFiles
      }
    });
  });

  // Load mock files when workspace is loaded
  const unsubscribe = store.subscribe(() => {
    const state = store.getState();
    if (state.file.currentWorkspace && state.file.openFiles.length === 0) {
      mockFiles.forEach(file => {
        dispatch({
          type: 'file/openFile/fulfilled',
          payload: file
        });
      });
      unsubscribe(); // Only load once
    }
  });

  console.log('Mock data initialized for development');
};