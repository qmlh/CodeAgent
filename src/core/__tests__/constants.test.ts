/**
 * Tests for system constants
 */

import { SYSTEM_CONSTANTS, EVENT_NAMES, DEFAULT_AGENT_CAPABILITIES } from '../constants';
import { AgentType } from '../../types/agent.types';

describe('System Constants', () => {
  it('should have valid system constants', () => {
    expect(SYSTEM_CONSTANTS.MAX_AGENTS).toBeGreaterThan(0);
    expect(SYSTEM_CONSTANTS.MAX_CONCURRENT_TASKS_PER_AGENT).toBeGreaterThan(0);
    expect(SYSTEM_CONSTANTS.AGENT_HEARTBEAT_INTERVAL).toBeGreaterThan(0);
    expect(SYSTEM_CONSTANTS.DEFAULT_TASK_TIMEOUT).toBeGreaterThan(0);
  });

  it('should have all required event names', () => {
    expect(EVENT_NAMES.AGENT_CREATED).toBe('agent:created');
    expect(EVENT_NAMES.TASK_ASSIGNED).toBe('task:assigned');
    expect(EVENT_NAMES.FILE_LOCKED).toBe('file:locked');
    expect(EVENT_NAMES.COLLABORATION_STARTED).toBe('collaboration:started');
  });

  it('should have capabilities for all agent types', () => {
    const agentTypes = Object.values(AgentType);
    
    agentTypes.forEach(type => {
      expect(DEFAULT_AGENT_CAPABILITIES[type]).toBeDefined();
      expect(Array.isArray(DEFAULT_AGENT_CAPABILITIES[type])).toBe(true);
      expect(DEFAULT_AGENT_CAPABILITIES[type].length).toBeGreaterThan(0);
    });
  });

  it('should have reasonable timeout values', () => {
    expect(SYSTEM_CONSTANTS.AGENT_TIMEOUT).toBeGreaterThan(SYSTEM_CONSTANTS.AGENT_HEARTBEAT_INTERVAL);
    expect(SYSTEM_CONSTANTS.FILE_LOCK_TIMEOUT).toBeGreaterThan(0);
    expect(SYSTEM_CONSTANTS.MESSAGE_TIMEOUT).toBeGreaterThan(0);
  });
});