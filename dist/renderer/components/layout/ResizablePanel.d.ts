/**
 * Resizable Panel Component
 * Provides resizable panels with drag handles
 */
import React from 'react';
interface ResizablePanelProps {
    children: React.ReactNode;
    direction: 'horizontal' | 'vertical';
    initialSize: number;
    minSize?: number;
    maxSize?: number;
    onResize?: (size: number) => void;
    className?: string;
    disabled?: boolean;
}
export declare const ResizablePanel: React.FC<ResizablePanelProps>;
export {};
