/**
 * Enhanced Resizable Panel Component
 * Provides advanced resizable functionality with drag preview and docking
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAppDispatch } from '../../hooks/redux';
import { setSidebarWidth } from '../../store/slices/uiSlice';

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
  // Legacy props for backward compatibility
  direction?: 'horizontal' | 'vertical';
  initialSize?: number;
  minSize?: number;
  maxSize?: number;
}

export const ResizablePanel: React.FC<ResizablePanelProps> = ({
  children,
  width: propWidth,
  height: propHeight,
  minWidth: propMinWidth,
  maxWidth: propMaxWidth,
  minHeight: propMinHeight,
  maxHeight: propMaxHeight,
  onResize,
  onResizeStart,
  onResizeEnd,
  className = '',
  style = {},
  resizeHandle = 'corner',
  showPreview = true,
  snapToGrid = 0,
  disabled = false,
  // Legacy props
  direction,
  initialSize,
  minSize,
  maxSize
}) => {
  const dispatch = useAppDispatch();

  // Handle legacy props
  const width = propWidth ?? (direction === 'horizontal' ? initialSize : 300) ?? 300;
  const height = propHeight ?? (direction === 'vertical' ? initialSize : 200) ?? 200;
  const minWidth = propMinWidth ?? (direction === 'horizontal' ? minSize : 100) ?? 100;
  const maxWidth = propMaxWidth ?? (direction === 'horizontal' ? maxSize : 800) ?? 800;
  const minHeight = propMinHeight ?? (direction === 'vertical' ? minSize : 100) ?? 100;
  const maxHeight = propMaxHeight ?? (direction === 'vertical' ? maxSize : 600) ?? 600;

  const [currentWidth, setCurrentWidth] = useState(width);
  const [currentHeight, setCurrentHeight] = useState(height);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<'width' | 'height' | 'both'>('both');
  const [previewDimensions, setPreviewDimensions] = useState<{ width: number; height: number } | null>(null);
  
  const panelRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef<{ x: number; y: number; width: number; height: number }>({ x: 0, y: 0, width: 0, height: 0 });

  const snapToGridValue = useCallback((value: number) => {
    if (snapToGrid <= 0) return value;
    return Math.round(value / snapToGrid) * snapToGrid;
  }, [snapToGrid]);

  const handleMouseDown = useCallback((e: React.MouseEvent, resizeDir: 'width' | 'height' | 'both') => {
    if (disabled) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setResizeDirection(resizeDir);
    
    startPosRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: currentWidth,
      height: currentHeight
    };

    if (onResizeStart) {
      onResizeStart();
    }
  }, [disabled, currentWidth, currentHeight, onResizeStart]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !panelRef.current) return;

    const deltaX = e.clientX - startPosRef.current.x;
    const deltaY = e.clientY - startPosRef.current.y;

    let newWidth = currentWidth;
    let newHeight = currentHeight;

    if (resizeDirection === 'width' || resizeDirection === 'both') {
      newWidth = Math.max(minWidth, Math.min(maxWidth, startPosRef.current.width + deltaX));
      newWidth = snapToGridValue(newWidth);
    }

    if (resizeDirection === 'height' || resizeDirection === 'both') {
      newHeight = Math.max(minHeight, Math.min(maxHeight, startPosRef.current.height + deltaY));
      newHeight = snapToGridValue(newHeight);
    }

    if (showPreview) {
      setPreviewDimensions({ width: newWidth, height: newHeight });
    } else {
      setCurrentWidth(newWidth);
      setCurrentHeight(newHeight);
      
      if (onResize) {
        onResize(newWidth, newHeight);
      }

      // Legacy support for sidebar width
      if (direction === 'horizontal') {
        dispatch(setSidebarWidth(newWidth));
      }
    }
  }, [isResizing, resizeDirection, minWidth, maxWidth, minHeight, maxHeight, snapToGridValue, showPreview, onResize, currentWidth, currentHeight, direction, dispatch]);

  const handleMouseUp = useCallback(() => {
    if (!isResizing) return;

    setIsResizing(false);
    
    if (showPreview && previewDimensions) {
      setCurrentWidth(previewDimensions.width);
      setCurrentHeight(previewDimensions.height);
      
      if (onResize) {
        onResize(previewDimensions.width, previewDimensions.height);
      }

      // Legacy support for sidebar width
      if (direction === 'horizontal') {
        dispatch(setSidebarWidth(previewDimensions.width));
      }
      
      setPreviewDimensions(null);
    }

    if (onResizeEnd) {
      onResizeEnd();
    }
  }, [isResizing, showPreview, previewDimensions, onResize, onResizeEnd, direction, dispatch]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.pointerEvents = 'none';
      
      // Add resize cursor to body
      const cursorMap = {
        width: 'col-resize',
        height: 'row-resize',
        both: 'nw-resize'
      };
      document.body.style.cursor = cursorMap[resizeDirection];
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.pointerEvents = '';
      document.body.style.cursor = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.pointerEvents = '';
      document.body.style.cursor = '';
    };
  }, [isResizing, resizeDirection, handleMouseMove, handleMouseUp]);

  // Update dimensions when props change
  useEffect(() => {
    setCurrentWidth(width);
  }, [width]);

  useEffect(() => {
    setCurrentHeight(height);
  }, [height]);

  const displayWidth = previewDimensions?.width ?? currentWidth;
  const displayHeight = previewDimensions?.height ?? currentHeight;

  // Legacy style for backward compatibility
  const legacyStyle: React.CSSProperties = direction ? {
    [direction === 'horizontal' ? 'width' : 'height']: `${displayWidth}px`,
    position: 'relative',
    flexShrink: 0,
  } : {};

  return (
    <div
      ref={panelRef}
      className={`enhanced-resizable-panel ${className} ${isResizing ? 'resizing' : ''}`}
      style={{
        width: direction === 'horizontal' ? displayWidth : (direction ? 'auto' : displayWidth),
        height: direction === 'vertical' ? displayWidth : (direction ? 'auto' : displayHeight),
        position: 'relative',
        transition: isResizing ? 'none' : 'width 0.1s ease, height 0.1s ease',
        ...legacyStyle,
        ...style
      }}
    >
      {children}
      
      {!disabled && (
        <>
          {/* Right resize handle */}
          {(resizeHandle === 'right' || resizeHandle === 'all' || direction === 'horizontal') && (
            <div
              className="resize-handle resize-handle-right"
              onMouseDown={(e) => handleMouseDown(e, 'width')}
              onDoubleClick={() => {
                // Double-click to reset to initial size
                const resetWidth = propWidth ?? initialSize ?? 300;
                setCurrentWidth(resetWidth);
                if (onResize) onResize(resetWidth, currentHeight);
                if (direction === 'horizontal') dispatch(setSidebarWidth(resetWidth));
              }}
              style={{
                position: 'absolute',
                right: -2,
                top: 0,
                bottom: 0,
                width: 4,
                cursor: 'col-resize',
                background: isResizing && resizeDirection === 'width' ? 'var(--accent-color)' : 'transparent',
                transition: 'background 0.2s ease',
                zIndex: 10
              }}
              onMouseEnter={(e) => {
                if (!isResizing) {
                  e.currentTarget.style.background = 'rgba(24, 144, 255, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isResizing) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            />
          )}

          {/* Bottom resize handle */}
          {(resizeHandle === 'bottom' || resizeHandle === 'all' || direction === 'vertical') && (
            <div
              className="resize-handle resize-handle-bottom"
              onMouseDown={(e) => handleMouseDown(e, 'height')}
              onDoubleClick={() => {
                // Double-click to reset to initial size
                const resetHeight = propHeight ?? initialSize ?? 200;
                setCurrentHeight(resetHeight);
                if (onResize) onResize(currentWidth, resetHeight);
                if (direction === 'vertical') dispatch(setSidebarWidth(resetHeight));
              }}
              style={{
                position: 'absolute',
                bottom: -2,
                left: 0,
                right: 0,
                height: 4,
                cursor: 'row-resize',
                background: isResizing && resizeDirection === 'height' ? 'var(--accent-color)' : 'transparent',
                transition: 'background 0.2s ease',
                zIndex: 10
              }}
              onMouseEnter={(e) => {
                if (!isResizing) {
                  e.currentTarget.style.background = 'rgba(24, 144, 255, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isResizing) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            />
          )}

          {/* Corner resize handle */}
          {(resizeHandle === 'corner' || resizeHandle === 'all') && !direction && (
            <div
              className="resize-handle resize-handle-corner"
              onMouseDown={(e) => handleMouseDown(e, 'both')}
              style={{
                position: 'absolute',
                right: -2,
                bottom: -2,
                width: 8,
                height: 8,
                cursor: 'nw-resize',
                background: isResizing && resizeDirection === 'both' ? 'var(--accent-color)' : 'transparent',
                transition: 'background 0.2s ease',
                zIndex: 11
              }}
              onMouseEnter={(e) => {
                if (!isResizing) {
                  e.currentTarget.style.background = 'rgba(24, 144, 255, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isResizing) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            />
          )}
        </>
      )}

      {/* Resize preview overlay */}
      {showPreview && isResizing && previewDimensions && (
        <div
          className="resize-preview-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            border: '2px dashed var(--accent-color)',
            background: 'rgba(24, 144, 255, 0.1)',
            pointerEvents: 'none',
            zIndex: 20
          }}
        />
      )}

      {/* Dimension tooltip during resize */}
      {isResizing && (
        <div
          className="resize-tooltip"
          style={{
            position: 'absolute',
            top: -30,
            right: 0,
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontFamily: 'monospace',
            border: '1px solid var(--border-color)',
            whiteSpace: 'nowrap',
            zIndex: 30,
            pointerEvents: 'none'
          }}
        >
          {Math.round(displayWidth)} × {Math.round(displayHeight)}
        </div>
      )}
    </div>
  );
};