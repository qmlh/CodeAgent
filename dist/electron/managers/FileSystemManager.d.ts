/**
 * File System Manager
 * Handles file system operations and monitoring
 */
import * as chokidar from 'chokidar';
export interface FileWatcher {
    id: string;
    watcher: chokidar.FSWatcher;
    path: string;
    callback: (eventType: string, filename: string) => void;
}
export declare class FileSystemManager {
    private watchers;
    initialize(): Promise<void>;
    readFile(filePath: string): Promise<string>;
    writeFile(filePath: string, content: string): Promise<void>;
    deleteFile(filePath: string): Promise<void>;
    createDirectory(dirPath: string): Promise<void>;
    listDirectory(dirPath: string): Promise<Array<{
        name: string;
        isDirectory: boolean;
        isFile: boolean;
        path: string;
        size?: number;
        mtime?: Date;
    }>>;
    copyFile(sourcePath: string, destinationPath: string): Promise<void>;
    moveFile(sourcePath: string, destinationPath: string): Promise<void>;
    renameFile(oldPath: string, newPath: string): Promise<void>;
    getFileStats(filePath: string): Promise<{
        size: number;
        isDirectory: boolean;
        isFile: boolean;
        mtime: Date;
        ctime: Date;
        atime: Date;
    }>;
    exists(filePath: string): Promise<boolean>;
    watchDirectory(dirPath: string, callback: (eventType: string, filename: string) => void): Promise<string>;
    unwatchDirectory(watcherId: string): void;
    searchFiles(dirPath: string, pattern: string, options?: {
        includeContent?: boolean;
        fileExtensions?: string[];
        maxResults?: number;
    }): Promise<Array<{
        path: string;
        name: string;
        matches?: Array<{
            line: number;
            content: string;
        }>;
    }>>;
    isDirectory(filePath: string): Promise<boolean>;
    isFile(filePath: string): Promise<boolean>;
    getFileExtension(filePath: string): Promise<string>;
    getFileName(filePath: string): Promise<string>;
    getDirectoryName(filePath: string): Promise<string>;
    joinPath(...paths: string[]): Promise<string>;
    resolvePath(filePath: string): Promise<string>;
    getRelativePath(from: string, to: string): Promise<string>;
    isImageFile(filePath: string): Promise<boolean>;
    isTextFile(filePath: string): Promise<boolean>;
    getFilePreview(filePath: string): Promise<{
        type: 'text' | 'image' | 'binary' | 'code';
        content?: string;
        size: number;
        mtime: Date;
        language?: string;
        encoding?: string;
        lineCount?: number;
    }>;
    private isCodeFile;
    private getLanguageFromExtension;
    validateFileName(fileName: string): Promise<{
        valid: boolean;
        error?: string;
    }>;
    createUniqueFileName(dirPath: string, baseName: string, extension?: string): Promise<string>;
    cleanup(): void;
}
