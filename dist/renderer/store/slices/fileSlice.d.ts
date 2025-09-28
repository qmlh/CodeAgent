/**
 * File State Slice
 * Manages file system state and operations
 */
import { PayloadAction } from '@reduxjs/toolkit';
export interface FileItem {
    name: string;
    path: string;
    isDirectory: boolean;
    isFile: boolean;
    size?: number;
    mtime?: Date;
    children?: FileItem[];
    expanded?: boolean;
}
export interface OpenFile {
    path: string;
    name: string;
    content: string;
    isDirty: boolean;
    isReadonly: boolean;
    language: string;
    encoding: string;
    lineEnding: 'lf' | 'crlf';
    lastModified: Date;
    isBinary?: boolean;
}
export interface FileState {
    currentWorkspace: string | null;
    fileTree: FileItem[];
    openFiles: OpenFile[];
    activeFile: string | null;
    recentFiles: string[];
    watchedDirectories: string[];
    searchResults: Array<{
        path: string;
        name: string;
        matches?: Array<{
            line: number;
            content: string;
        }>;
    }>;
    status: 'idle' | 'loading' | 'error';
    error: string | null;
}
export declare const loadWorkspace: import("@reduxjs/toolkit").AsyncThunk<{
    workspacePath: string;
    files: any;
}, string, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const loadDirectory: import("@reduxjs/toolkit").AsyncThunk<{
    directoryPath: string;
    files: any;
}, string, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const openFile: import("@reduxjs/toolkit").AsyncThunk<{
    path: string;
    name: string;
    content: any;
    lastModified: Date;
    isBinary: any;
}, string, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const saveFile: import("@reduxjs/toolkit").AsyncThunk<{
    filePath: string;
    content: string;
}, {
    filePath: string;
    content: string;
}, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const createFile: import("@reduxjs/toolkit").AsyncThunk<{
    filePath: string;
    content: string;
}, {
    filePath: string;
    content?: string;
}, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const deleteFile: import("@reduxjs/toolkit").AsyncThunk<string, string, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const createDirectory: import("@reduxjs/toolkit").AsyncThunk<string, string, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const searchFiles: import("@reduxjs/toolkit").AsyncThunk<any, {
    query: string;
    includeContent?: boolean;
    fileExtensions?: string[];
}, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const copyFile: import("@reduxjs/toolkit").AsyncThunk<{
    sourcePath: string;
    targetPath: string;
}, {
    sourcePath: string;
    targetPath: string;
}, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const moveFile: import("@reduxjs/toolkit").AsyncThunk<{
    sourcePath: string;
    targetPath: string;
}, {
    sourcePath: string;
    targetPath: string;
}, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const renameFile: import("@reduxjs/toolkit").AsyncThunk<{
    oldPath: string;
    newPath: string;
}, {
    oldPath: string;
    newPath: string;
}, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const fileSlice: import("@reduxjs/toolkit").Slice<FileState, {
    setActiveFile: (state: import("immer").WritableDraft<FileState>, action: PayloadAction<string | null>) => void;
    closeFile: (state: import("immer").WritableDraft<FileState>, action: PayloadAction<string>) => void;
    updateFileContent: (state: import("immer").WritableDraft<FileState>, action: PayloadAction<{
        filePath: string;
        content: string;
    }>) => void;
    markFileSaved: (state: import("immer").WritableDraft<FileState>, action: PayloadAction<string>) => void;
    expandDirectory: (state: import("immer").WritableDraft<FileState>, action: PayloadAction<string>) => void;
    collapseDirectory: (state: import("immer").WritableDraft<FileState>, action: PayloadAction<string>) => void;
    addRecentFile: (state: import("immer").WritableDraft<FileState>, action: PayloadAction<string>) => void;
    clearSearchResults: (state: import("immer").WritableDraft<FileState>) => void;
    clearError: (state: import("immer").WritableDraft<FileState>) => void;
    handleFileSystemEvent: (state: import("immer").WritableDraft<FileState>, action: PayloadAction<{
        eventType: string;
        filename: string;
        path: string;
    }>) => void;
}, "file", "file", import("@reduxjs/toolkit").SliceSelectors<FileState>>;
export declare const setActiveFile: import("@reduxjs/toolkit").ActionCreatorWithPayload<string | null, "file/setActiveFile">, closeFile: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "file/closeFile">, updateFileContent: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    filePath: string;
    content: string;
}, "file/updateFileContent">, markFileSaved: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "file/markFileSaved">, expandDirectory: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "file/expandDirectory">, collapseDirectory: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "file/collapseDirectory">, addRecentFile: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "file/addRecentFile">, clearSearchResults: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"file/clearSearchResults">, clearError: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"file/clearError">, handleFileSystemEvent: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    eventType: string;
    filename: string;
    path: string;
}, "file/handleFileSystemEvent">;
