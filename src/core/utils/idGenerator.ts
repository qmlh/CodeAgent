/**
 * ID generation utilities
 */

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Generate a short ID (8 characters)
 */
export function generateShortId(): string {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * Generate a task ID with prefix
 */
export function generateTaskId(): string {
  return `task-${generateShortId()}`;
}

/**
 * Generate an agent ID with prefix
 */
export function generateAgentId(): string {
  return `agent-${generateShortId()}`;
}

/**
 * Generate a session ID with prefix
 */
export function generateSessionId(): string {
  return `session-${generateShortId()}`;
}

/**
 * Generate a message ID with prefix
 */
export function generateMessageId(): string {
  return `msg-${generateShortId()}`;
}