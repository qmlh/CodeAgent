/**
 * File Preview Component
 * Shows preview of selected files (text, images, etc.)
 */
import React from 'react';
import { FileItem } from '../../store/slices/fileSlice';
interface FilePreviewProps {
    file: FileItem | null;
    style?: React.CSSProperties;
}
export declare const FilePreview: React.FC<FilePreviewProps>;
export {};
