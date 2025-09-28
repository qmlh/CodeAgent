/**
 * Agent State Slice
 * Manages AI agent state and operations
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Agent {
  id: string;
  name: string;
  type: 'frontend' | 'backend' | 'testing' | 'documentation' | 'code_review' | 'devops';
  status: 'idle' | 'working' | 'waiting' | 'error' | 'offline';
  capabilities: string[];
  currentTask?: string;
  workload: number;
  lastActive: Date;
  performance: {
    tasksCompleted: number;
    averageTaskTime: number;
    successRate: number;
  };
  config: {
    maxConcurrentTasks: number;
    specializations: string[];
    preferences: Record<string, any>;
  };
  createdAt: Date;
}

export interface AgentMessage {
  id: string;
  from: string;
  to: string | string[];
  type: 'info' | 'request' | 'response' | 'alert';
  content: any;
  timestamp: Date;
  requiresResponse: boolean;
}

export interface CollaborationSession {
  id: string;
  participants: string[];
  sharedFiles: string[];
  communicationChannel: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'paused' | 'completed';
}

export interface AgentState {
  agents: Agent[];
  messages: AgentMessage[];
  collaborationSessions: CollaborationSession[];
  selectedAgent: string | null;
  agentLogs: Record<string, Array<{
    timestamp: Date;
    level: 'info' | 'warn' | 'error';
    message: string;
  }>>;
  status: 'idle' | 'loading' | 'error';
  error: string | null;
}

const initialState: AgentState = {
  agents: [],
  messages: [],
  collaborationSessions: [],
  selectedAgent: null,
  agentLogs: {},
  status: 'idle',
  error: null
};

// Async thunks
export const loadAgents = createAsyncThunk(
  'agent/loadAgents',
  async () => {
    const result = await window.electronAPI?.agent.list();
    if (!result?.success) {
      throw new Error(result?.error || 'Failed to load agents');
    }
    return result.agents;
  }
);

export const createAgent = createAsyncThunk(
  'agent/createAgent',
  async (config: {
    name: string;
    type: Agent['type'];
    capabilities: string[];
    specializations: string[];
    preferences: Record<string, any>;
  }) => {
    const result = await window.electronAPI?.agent.create(config);
    if (!result?.success) {
      throw new Error(result?.error || 'Failed to create agent');
    }
    
    // Return the created agent data
    const newAgent: Agent = {
      id: result.agentId,
      name: config.name,
      type: config.type,
      status: 'idle',
      capabilities: config.capabilities,
      workload: 0,
      lastActive: new Date(),
      performance: {
        tasksCompleted: 0,
        averageTaskTime: 0,
        successRate: 0
      },
      config: {
        maxConcurrentTasks: 3,
        specializations: config.specializations,
        preferences: config.preferences
      },
      createdAt: new Date()
    };
    
    return newAgent;
  }
);

export const startAgent = createAsyncThunk(
  'agent/startAgent',
  async (agentId: string) => {
    const result = await window.electronAPI?.agent.start(agentId);
    if (!result?.success) {
      throw new Error(result?.error || 'Failed to start agent');
    }
    return agentId;
  }
);

export const stopAgent = createAsyncThunk(
  'agent/stopAgent',
  async (agentId: string) => {
    const result = await window.electronAPI?.agent.stop(agentId);
    if (!result?.success) {
      throw new Error(result?.error || 'Failed to stop agent');
    }
    return agentId;
  }
);

export const getAgentStatus = createAsyncThunk(
  'agent/getAgentStatus',
  async (agentId: string) => {
    const result = await window.electronAPI?.agent.getStatus(agentId);
    if (!result?.success) {
      throw new Error(result?.error || 'Failed to get agent status');
    }
    return { agentId, status: result.status };
  }
);

export const agentSlice = createSlice({
  name: 'agent',
  initialState,
  reducers: {
    setSelectedAgent: (state, action: PayloadAction<string | null>) => {
      state.selectedAgent = action.payload;
    },
    
    updateAgentStatus: (state, action: PayloadAction<{ agentId: string; status: Agent['status'] }>) => {
      const { agentId, status } = action.payload;
      const agent = state.agents.find(a => a.id === agentId);
      if (agent) {
        agent.status = status;
        agent.lastActive = new Date();
      }
    },
    
    updateAgentWorkload: (state, action: PayloadAction<{ agentId: string; workload: number }>) => {
      const { agentId, workload } = action.payload;
      const agent = state.agents.find(a => a.id === agentId);
      if (agent) {
        agent.workload = workload;
      }
    },
    
    assignTaskToAgent: (state, action: PayloadAction<{ agentId: string; taskId: string }>) => {
      const { agentId, taskId } = action.payload;
      const agent = state.agents.find(a => a.id === agentId);
      if (agent) {
        agent.currentTask = taskId;
        agent.status = 'working';
        agent.workload += 1;
      }
    },
    
    completeAgentTask: (state, action: PayloadAction<{ 
      agentId: string; 
      taskId: string; 
      success: boolean; 
      duration: number; 
    }>) => {
      const { agentId, success, duration } = action.payload;
      const agent = state.agents.find(a => a.id === agentId);
      
      if (agent) {
        agent.currentTask = undefined;
        agent.status = 'idle';
        agent.workload = Math.max(0, agent.workload - 1);
        
        // Update performance metrics
        agent.performance.tasksCompleted += 1;
        agent.performance.averageTaskTime = 
          (agent.performance.averageTaskTime * (agent.performance.tasksCompleted - 1) + duration) / 
          agent.performance.tasksCompleted;
        
        if (success) {
          const totalTasks = agent.performance.tasksCompleted;
          const successfulTasks = Math.round(agent.performance.successRate * (totalTasks - 1)) + 1;
          agent.performance.successRate = successfulTasks / totalTasks;
        }
        
        agent.lastActive = new Date();
      }
    },
    
    addAgentMessage: (state, action: PayloadAction<Omit<AgentMessage, 'id' | 'timestamp'>>) => {
      const message: AgentMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        ...action.payload
      };
      state.messages.push(message);
    },
    
    removeAgentMessage: (state, action: PayloadAction<string>) => {
      state.messages = state.messages.filter(m => m.id !== action.payload);
    },
    
    clearAgentMessages: (state) => {
      state.messages = [];
    },
    
    startCollaborationSession: (state, action: PayloadAction<{
      participants: string[];
      sharedFiles: string[];
    }>) => {
      const session: CollaborationSession = {
        id: `session-${Date.now()}`,
        participants: action.payload.participants,
        sharedFiles: action.payload.sharedFiles,
        communicationChannel: `channel-${Date.now()}`,
        startTime: new Date(),
        status: 'active'
      };
      state.collaborationSessions.push(session);
    },
    
    endCollaborationSession: (state, action: PayloadAction<string>) => {
      const session = state.collaborationSessions.find(s => s.id === action.payload);
      if (session) {
        session.status = 'completed';
        session.endTime = new Date();
      }
    },
    
    addAgentLog: (state, action: PayloadAction<{
      agentId: string;
      level: 'info' | 'warn' | 'error';
      message: string;
    }>) => {
      const { agentId, level, message } = action.payload;
      
      if (!state.agentLogs[agentId]) {
        state.agentLogs[agentId] = [];
      }
      
      state.agentLogs[agentId].push({
        timestamp: new Date(),
        level,
        message
      });
      
      // Keep only last 1000 log entries per agent
      if (state.agentLogs[agentId].length > 1000) {
        state.agentLogs[agentId] = state.agentLogs[agentId].slice(-1000);
      }
    },
    
    clearAgentLogs: (state, action: PayloadAction<string>) => {
      delete state.agentLogs[action.payload];
    },
    
    clearError: (state) => {
      state.error = null;
    }
  },
  
  extraReducers: (builder) => {
    builder
      // Load agents
      .addCase(loadAgents.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(loadAgents.fulfilled, (state, action) => {
        state.status = 'idle';
        state.agents = action.payload;
      })
      .addCase(loadAgents.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.error.message || 'Failed to load agents';
      })
      
      // Create agent
      .addCase(createAgent.fulfilled, (state, action) => {
        state.agents.push(action.payload);
      })
      
      // Start agent
      .addCase(startAgent.fulfilled, (state, action) => {
        const agent = state.agents.find(a => a.id === action.payload);
        if (agent) {
          agent.status = 'idle';
        }
      })
      
      // Stop agent
      .addCase(stopAgent.fulfilled, (state, action) => {
        const agent = state.agents.find(a => a.id === action.payload);
        if (agent) {
          agent.status = 'offline';
          agent.currentTask = undefined;
        }
      })
      
      // Get agent status
      .addCase(getAgentStatus.fulfilled, (state, action) => {
        const { agentId, status } = action.payload;
        const agent = state.agents.find(a => a.id === agentId);
        if (agent) {
          agent.status = status;
          agent.lastActive = new Date();
        }
      });
  }
});

export const {
  setSelectedAgent,
  updateAgentStatus,
  updateAgentWorkload,
  assignTaskToAgent,
  completeAgentTask,
  addAgentMessage,
  removeAgentMessage,
  clearAgentMessages,
  startCollaborationSession,
  endCollaborationSession,
  addAgentLog,
  clearAgentLogs,
  clearError
} = agentSlice.actions;