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

export class FileOperationsService extends EventEmitter {
  private operations: Map<string, FileOperation> = new Map();
  private batchOperations: Map<string, BatchOperation> = new Map();
  private operationQueue: string[] = [];
  private isProcessing = false;
  private maxConcurrentOperations = 3;

  constructor() {
    super();
  }

  /**
   * Validate file name
   */
  async validateFileName(fileName: string): Promise<FileValidationResult> {
    const result: FileValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    try {
      const validation = await window.electronAPI?.fs.validateName(fileName);
      
      if (validation?.success) {
        if (!validation.validation.valid) {
          result.valid = false;
          result.errors.push(validation.validation.error || 'Invalid file name');
        }
      } else {
        result.valid = false;
        result.errors.push('Failed to validate file name');
      }
    } catch (error) {
      result.valid = false;
      result.errors.push(error instanceof Error ? error.message : 'Validation failed');
    }

    // Additional client-side validations
    if (fileName.length === 0) {
      result.valid = false;
      result.errors.push('File name cannot be empty');
    }

    if (fileName.length > 255) {
      result.valid = false;
      result.errors.push('File name is too long (max 255 characters)');
    }

    // Check for potentially problematic characters
    const problematicChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (problematicChars.test(fileName)) {
      result.valid = false;
      result.errors.push('File name contains invalid characters');
    }

    // Warnings for best practices
    if (fileName.startsWith('.')) {
      result.warnings.push('File name starts with a dot (hidden file)');
    }

    if (fileName.includes(' ')) {
      result.warnings.push('File name contains spaces');
    }

    return result;
  }

  /**
   * Create a new file operation
   */
  private createOperation(
    type: FileOperation['type'],
    source?: string,
    target?: string
  ): FileOperation {
    const operation: FileOperation = {
      id: this.generateId(),
      type,
      source,
      target,
      progress: 0,
      status: 'pending',
      startTime: new Date()
    };

    this.operations.set(operation.id, operation);
    this.emit('operationCreated', operation);
    
    return operation;
  }

  /**
   * Update operation progress
   */
  private updateOperation(id: string, updates: Partial<FileOperation>): void {
    const operation = this.operations.get(id);
    if (!operation) return;

    Object.assign(operation, updates);
    this.emit('operationUpdated', operation);

    if (updates.status === 'completed' || updates.status === 'failed') {
      operation.endTime = new Date();
      this.emit('operationCompleted', operation);
    }
  }

  /**
   * Copy file with progress tracking
   */
  async copyFile(sourcePath: string, targetPath: string): Promise<string> {
    const operation = this.createOperation('copy', sourcePath, targetPath);
    
    try {
      this.updateOperation(operation.id, { status: 'running' });
      
      // Get source file size for progress calculation
      const stats = await window.electronAPI?.fs.getStats(sourcePath);
      if (stats?.success) {
        this.updateOperation(operation.id, { totalSize: stats.stats.size });
      }

      const result = await window.electronAPI?.fs.copy(sourcePath, targetPath);
      
      if (result?.success) {
        this.updateOperation(operation.id, { 
          status: 'completed', 
          progress: 100 
        });
      } else {
        throw new Error(result?.error || 'Copy operation failed');
      }
      
      return operation.id;
    } catch (error) {
      this.updateOperation(operation.id, { 
        status: 'failed', 
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Move file with progress tracking
   */
  async moveFile(sourcePath: string, targetPath: string): Promise<string> {
    const operation = this.createOperation('move', sourcePath, targetPath);
    
    try {
      this.updateOperation(operation.id, { status: 'running' });
      
      const result = await window.electronAPI?.fs.move(sourcePath, targetPath);
      
      if (result?.success) {
        this.updateOperation(operation.id, { 
          status: 'completed', 
          progress: 100 
        });
      } else {
        throw new Error(result?.error || 'Move operation failed');
      }
      
      return operation.id;
    } catch (error) {
      this.updateOperation(operation.id, { 
        status: 'failed', 
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Delete file with confirmation
   */
  async deleteFile(filePath: string, skipConfirmation = false): Promise<string> {
    const operation = this.createOperation('delete', filePath);
    
    try {
      if (!skipConfirmation) {
        const confirmed = await this.confirmDeletion(filePath);
        if (!confirmed) {
          this.updateOperation(operation.id, { 
            status: 'cancelled' 
          });
          throw new Error('Operation cancelled by user');
        }
      }

      this.updateOperation(operation.id, { status: 'running' });
      
      const result = await window.electronAPI?.fs.deleteFile(filePath);
      
      if (result?.success) {
        this.updateOperation(operation.id, { 
          status: 'completed', 
          progress: 100 
        });
      } else {
        throw new Error(result?.error || 'Delete operation failed');
      }
      
      return operation.id;
    } catch (error) {
      this.updateOperation(operation.id, { 
        status: 'failed', 
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Create file with content
   */
  async createFile(filePath: string, content = ''): Promise<string> {
    const operation = this.createOperation('create', undefined, filePath);
    
    try {
      // Validate file name
      const fileName = await window.electronAPI?.fs.getFileName(filePath);
      if (fileName?.success) {
        const validation = await this.validateFileName(fileName.fileName);
        if (!validation.valid) {
          throw new Error(validation.errors.join(', '));
        }
      }

      this.updateOperation(operation.id, { status: 'running' });
      
      const result = await window.electronAPI?.fs.writeFile(filePath, content);
      
      if (result?.success) {
        this.updateOperation(operation.id, { 
          status: 'completed', 
          progress: 100 
        });
      } else {
        throw new Error(result?.error || 'Create operation failed');
      }
      
      return operation.id;
    } catch (error) {
      this.updateOperation(operation.id, { 
        status: 'failed', 
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Rename file
   */
  async renameFile(oldPath: string, newPath: string): Promise<string> {
    const operation = this.createOperation('rename', oldPath, newPath);
    
    try {
      // Validate new file name
      const fileName = await window.electronAPI?.fs.getFileName(newPath);
      if (fileName?.success) {
        const validation = await this.validateFileName(fileName.fileName);
        if (!validation.valid) {
          throw new Error(validation.errors.join(', '));
        }
      }

      this.updateOperation(operation.id, { status: 'running' });
      
      const result = await window.electronAPI?.fs.rename(oldPath, newPath);
      
      if (result?.success) {
        this.updateOperation(operation.id, { 
          status: 'completed', 
          progress: 100 
        });
      } else {
        throw new Error(result?.error || 'Rename operation failed');
      }
      
      return operation.id;
    } catch (error) {
      this.updateOperation(operation.id, { 
        status: 'failed', 
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Batch operations
   */
  async executeBatchOperation(
    operations: Array<{
      type: FileOperation['type'];
      source?: string;
      target?: string;
    }>
  ): Promise<string> {
    const batchId = this.generateId();
    const batch: BatchOperation = {
      id: batchId,
      operations: [],
      progress: 0,
      status: 'pending',
      startTime: new Date()
    };

    // Create individual operations
    for (const op of operations) {
      const operation = this.createOperation(op.type, op.source, op.target);
      batch.operations.push(operation);
    }

    this.batchOperations.set(batchId, batch);
    this.emit('batchOperationCreated', batch);

    try {
      batch.status = 'running';
      this.emit('batchOperationUpdated', batch);

      let completedOperations = 0;
      
      for (const operation of batch.operations) {
        try {
          switch (operation.type) {
            case 'copy':
              if (operation.source && operation.target) {
                await this.copyFile(operation.source, operation.target);
              }
              break;
            case 'move':
              if (operation.source && operation.target) {
                await this.moveFile(operation.source, operation.target);
              }
              break;
            case 'delete':
              if (operation.source) {
                await this.deleteFile(operation.source, true);
              }
              break;
            case 'create':
              if (operation.target) {
                await this.createFile(operation.target);
              }
              break;
            case 'rename':
              if (operation.source && operation.target) {
                await this.renameFile(operation.source, operation.target);
              }
              break;
          }
          
          completedOperations++;
          batch.progress = Math.round((completedOperations / batch.operations.length) * 100);
          this.emit('batchOperationUpdated', batch);
          
        } catch (error) {
          console.error(`Batch operation failed for ${operation.type}:`, error);
        }
      }

      batch.status = 'completed';
      batch.endTime = new Date();
      this.emit('batchOperationCompleted', batch);
      
      return batchId;
    } catch (error) {
      batch.status = 'failed';
      batch.endTime = new Date();
      this.emit('batchOperationCompleted', batch);
      throw error;
    }
  }

  /**
   * Get operation status
   */
  getOperation(id: string): FileOperation | undefined {
    return this.operations.get(id);
  }

  /**
   * Get batch operation status
   */
  getBatchOperation(id: string): BatchOperation | undefined {
    return this.batchOperations.get(id);
  }

  /**
   * Get all operations
   */
  getAllOperations(): FileOperation[] {
    return Array.from(this.operations.values());
  }

  /**
   * Get active operations
   */
  getActiveOperations(): FileOperation[] {
    return Array.from(this.operations.values()).filter(
      op => op.status === 'running' || op.status === 'pending'
    );
  }

  /**
   * Cancel operation
   */
  cancelOperation(id: string): void {
    const operation = this.operations.get(id);
    if (operation && (operation.status === 'pending' || operation.status === 'running')) {
      this.updateOperation(id, { status: 'cancelled' });
    }
  }

  /**
   * Clear completed operations
   */
  clearCompletedOperations(): void {
    const completedIds: string[] = [];
    
    for (const [id, operation] of this.operations.entries()) {
      if (operation.status === 'completed' || operation.status === 'failed') {
        completedIds.push(id);
      }
    }
    
    completedIds.forEach(id => {
      this.operations.delete(id);
    });
    
    this.emit('operationsCleared', completedIds);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Confirm deletion dialog
   */
  private async confirmDeletion(filePath: string): Promise<boolean> {
    try {
      const fileName = await window.electronAPI?.fs.getFileName(filePath);
      const result = await window.electronAPI?.app.showMessageBox({
        type: 'warning',
        buttons: ['Delete', 'Cancel'],
        defaultId: 1,
        title: 'Confirm Deletion',
        message: `Are you sure you want to delete "${fileName?.success ? fileName.fileName : filePath}"?`,
        detail: 'This action cannot be undone.'
      });

      return result?.success && result.response === 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Cleanup service
   */
  cleanup(): void {
    this.operations.clear();
    this.batchOperations.clear();
    this.operationQueue = [];
    this.removeAllListeners();
  }
}

// Create singleton instance
export const fileOperationsService = new FileOperationsService();