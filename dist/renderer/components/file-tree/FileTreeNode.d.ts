/**
 * File Tree Node Component
 * Individual node in the file tree with drag and drop support
 */
import React from 'react';
import { FileItem } from '../../store/slices/fileSlice';
interface FileTreeNodeProps {
    file: FileItem;
    level: number;
    isSelected: boolean;
    isExpanded: boolean;
    onSelect: (file: FileItem) => void;
    onExpand: (file: FileItem) => void;
    onCollapse: (file: FileItem) => void;
    onRename: (file: FileItem, newName: string) => void;
    onDelete: (file: FileItem) => void;
    onCopy: (file: FileItem) => void;
    onCut: (file: FileItem) => void;
    onPaste: (targetFile: FileItem) => void;
    onCreateFile: (parentFile: FileItem) => void;
    onCreateFolder: (parentFile: FileItem) => void;
    onShowInExplorer: (file: FileItem) => void;
}
export declare const FileTreeNode: React.FC<FileTreeNodeProps>;
export {};
