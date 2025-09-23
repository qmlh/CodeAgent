/**
 * Data validation utilities
 */
import { AgentConfig, Agent } from '../../types/agent.types';
import { Task } from '../../types/task.types';
import { AgentMessage, CollaborationSession } from '../../types/message.types';
/**
 * Validation result interface
 */
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}
/**
 * Base validator class
 */
export declare abstract class BaseValidator<T> {
    abstract validate(data: T): ValidationResult;
    protected createError(message: string): ValidationResult;
    protected createSuccess(): ValidationResult;
    protected combineResults(...results: ValidationResult[]): ValidationResult;
}
/**
 * Agent configuration validator
 */
export declare class AgentConfigValidator extends BaseValidator<AgentConfig> {
    validate(config: AgentConfig): ValidationResult;
}
/**
 * Agent validator
 */
export declare class AgentValidator extends BaseValidator<Agent> {
    private configValidator;
    validate(agent: Agent): ValidationResult;
}
/**
 * Task validator
 */
export declare class TaskValidator extends BaseValidator<Task> {
    validate(task: Task): ValidationResult;
}
/**
 * Agent message validator
 */
export declare class AgentMessageValidator extends BaseValidator<AgentMessage> {
    validate(message: AgentMessage): ValidationResult;
}
/**
 * Collaboration session validator
 */
export declare class CollaborationSessionValidator extends BaseValidator<CollaborationSession> {
    validate(session: CollaborationSession): ValidationResult;
}
/**
 * Validation utility functions
 */
export declare class ValidationUtils {
    /**
     * Validate data and throw error if invalid
     */
    static validateOrThrow<T>(validator: BaseValidator<T>, data: T, context?: string): void;
    /**
     * Validate multiple items
     */
    static validateMany<T>(validator: BaseValidator<T>, items: T[]): ValidationResult;
    /**
     * Check if string is valid UUID format
     */
    static isValidUUID(uuid: string): boolean;
    /**
     * Sanitize string input
     */
    static sanitizeString(input: string): string;
    /**
     * Validate email format
     */
    static isValidEmail(email: string): boolean;
}
//# sourceMappingURL=validators.d.ts.map