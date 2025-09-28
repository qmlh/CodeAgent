/**
 * Enhanced Resizable Panel Component
 * Provides advanced resizable functionality with drag preview and docking
 */
import React from 'react';
interface ResizablePanelProps {
    children: React.ReactNode;
    width?: number;
    height?: number;
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    onResize?: (width: number, height?: number) => void;
    onResizeStart?: () => void;
    onResizeEnd?: () => void;
    className?: string;
    style?: React.CSSProperties;
    resizeHandle?: 'right' | 'bottom' | 'corner' | 'all';
    showPreview?: boolean;
    snapToGrid?: number;
    disabled?: boolean;
    direction?: 'horizontal' | 'vertical';
    initialSize?: number;
    minSize?: number;
    maxSize?: number;
}
export declare const ResizablePanel: React.FC<ResizablePanelProps>;
export {};
