/**
 * File Tree Component
 * Main file tree with drag and drop, search, and context menu support
 */
import React from 'react';
import { FileItem } from '../../store/slices/fileSlice';
interface FileTreeProps {
    files: FileItem[];
    selectedFile: string | null;
    expandedDirectories: Set<string>;
    onFileSelect: (file: FileItem) => void;
    onDirectoryExpand: (path: string) => void;
    onDirectoryCollapse: (path: string) => void;
    onFileCreate: (parentPath: string, fileName: string) => void;
    onDirectoryCreate: (parentPath: string, dirName: string) => void;
    onFileRename: (oldPath: string, newPath: string) => void;
    onFileDelete: (path: string) => void;
    onFileCopy: (sourcePath: string, targetPath: string) => void;
    onFileMove: (sourcePath: string, targetPath: string) => void;
    onRefresh: () => void;
    workspacePath: string | null;
}
export declare const FileTree: React.FC<FileTreeProps>;
export {};
