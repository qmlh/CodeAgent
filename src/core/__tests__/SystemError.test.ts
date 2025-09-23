/**
 * Tests for SystemError classes
 */

import { SystemError, AgentError, TaskError, FileError, CommunicationError, ValidationError } from '../errors/SystemError';
import { ErrorType, ErrorSeverity } from '../../types/error.types';

describe('SystemError', () => {
  it('should create a basic system error', () => {
    const error = new SystemError('Test error', ErrorType.SYSTEM_ERROR);
    
    expect(error.message).toBe('Test error');
    expect(error.type).toBe(ErrorType.SYSTEM_ERROR);
    expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    expect(error.recoverable).toBe(true);
    expect(error.timestamp).toBeInstanceOf(Date);
  });

  it('should create an agent error with context', () => {
    const agentId = 'agent-123';
    const error = new AgentError('Agent failed', agentId, ErrorSeverity.HIGH);
    
    expect(error.type).toBe(ErrorType.AGENT_ERROR);
    expect(error.agentId).toBe(agentId);
    expect(error.severity).toBe(ErrorSeverity.HIGH);
  });

  it('should create a task error', () => {
    const taskId = 'task-456';
    const agentId = 'agent-123';
    const error = new TaskError('Task execution failed', taskId, agentId);
    
    expect(error.type).toBe(ErrorType.TASK_ERROR);
    expect(error.taskId).toBe(taskId);
    expect(error.agentId).toBe(agentId);
  });

  it('should create a file error', () => {
    const filePath = '/path/to/file.ts';
    const agentId = 'agent-123';
    const error = new FileError('File access denied', filePath, agentId);
    
    expect(error.type).toBe(ErrorType.FILE_ERROR);
    expect(error.agentId).toBe(agentId);
    expect(error.context?.filePath).toBe(filePath);
  });

  it('should serialize to JSON correctly', () => {
    const error = new SystemError('Test error', ErrorType.SYSTEM_ERROR, ErrorSeverity.HIGH);
    const json = error.toJSON();
    
    expect(json.name).toBe('SystemError');
    expect(json.message).toBe('Test error');
    expect(json.type).toBe(ErrorType.SYSTEM_ERROR);
    expect(json.severity).toBe(ErrorSeverity.HIGH);
    expect(json.timestamp).toBeInstanceOf(Date);
  });
});