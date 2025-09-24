/**
 * File Operations Service
 * Advanced file management operations with progress tracking and error handling
 */
import { EventEmitter } from 'eventemitter3';
export interface FileOperation {
    id: string;
    type: 'copy' | 'move' | 'delete' | 'create' | 'rename' | 'upload' | 'download';
    source?: string;
    target?: string;
    progress: number;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    error?: string;
    startTime?: Date;
    endTime?: Date;
    totalSize?: number;
    processedSize?: number;
}
export interface BatchOperation {
    id: string;
    operations: FileOperation[];
    progress: number;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    startTime?: Date;
    endTime?: Date;
}
export interface FileValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
export declare class FileOperationsService extends EventEmitter {
    private operations;
    private batchOperations;
    private operationQueue;
    private isProcessing;
    private maxConcurrentOperations;
    constructor();
    /**
     * Validate file name
     */
    validateFileName(fileName: string): Promise<FileValidationResult>;
    /**
     * Create a new file operation
     */
    private createOperation;
    /**
     * Update operation progress
     */
    private updateOperation;
    /**
     * Copy file with progress tracking
     */
    copyFile(sourcePath: string, targetPath: string): Promise<string>;
    /**
     * Move file with progress tracking
     */
    moveFile(sourcePath: string, targetPath: string): Promise<string>;
    /**
     * Delete file with confirmation
     */
    deleteFile(filePath: string, skipConfirmation?: boolean): Promise<string>;
    /**
     * Create file with content
     */
    createFile(filePath: string, content?: string): Promise<string>;
    /**
     * Rename file
     */
    renameFile(oldPath: string, newPath: string): Promise<string>;
    /**
     * Batch operations
     */
    executeBatchOperation(operations: Array<{
        type: FileOperation['type'];
        source?: string;
        target?: string;
    }>): Promise<string>;
    /**
     * Get operation status
     */
    getOperation(id: string): FileOperation | undefined;
    /**
     * Get batch operation status
     */
    getBatchOperation(id: string): BatchOperation | undefined;
    /**
     * Get all operations
     */
    getAllOperations(): FileOperation[];
    /**
     * Get active operations
     */
    getActiveOperations(): FileOperation[];
    /**
     * Cancel operation
     */
    cancelOperation(id: string): void;
    /**
     * Clear completed operations
     */
    clearCompletedOperations(): void;
    /**
     * Generate unique ID
     */
    private generateId;
    /**
     * Confirm deletion dialog
     */
    private confirmDeletion;
    /**
     * Cleanup service
     */
    cleanup(): void;
}
export declare const fileOperationsService: FileOperationsService;
