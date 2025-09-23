/**
 * Resizable Panel Component
 * Provides resizable panels with drag handles
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAppDispatch } from '../../hooks/redux';
import { setSidebarWidth } from '../../store/slices/uiSlice';

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

export const ResizablePanel: React.FC<ResizablePanelProps> = ({
  children,
  direction,
  initialSize,
  minSize = 200,
  maxSize = 600,
  onResize,
  className = '',
  disabled = false
}) => {
  const dispatch = useAppDispatch();
  const [size, setSize] = useState(initialSize);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef(0);
  const startSizeRef = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    setIsResizing(true);
    
    startPosRef.current = direction === 'horizontal' ? e.clientX : e.clientY;
    startSizeRef.current = size;
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  }, [direction, size, disabled]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
    const delta = currentPos - startPosRef.current;
    const newSize = Math.max(minSize, Math.min(maxSize, startSizeRef.current + delta));
    
    setSize(newSize);
    onResize?.(newSize);
    
    // Update Redux store for sidebar width
    if (direction === 'horizontal') {
      dispatch(setSidebarWidth(newSize));
    }
  }, [isResizing, direction, minSize, maxSize, onResize, dispatch]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, [handleMouseMove]);

  // Cleanup event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [handleMouseMove, handleMouseUp]);

  const panelStyle: React.CSSProperties = {
    [direction === 'horizontal' ? 'width' : 'height']: `${size}px`,
    position: 'relative',
    flexShrink: 0,
  };

  const handleStyle: React.CSSProperties = {
    position: 'absolute',
    [direction === 'horizontal' ? 'right' : 'bottom']: 0,
    [direction === 'horizontal' ? 'top' : 'left']: 0,
    [direction === 'horizontal' ? 'width' : 'height']: '4px',
    [direction === 'horizontal' ? 'height' : 'width']: '100%',
    cursor: direction === 'horizontal' ? 'col-resize' : 'row-resize',
    backgroundColor: isResizing ? 'var(--color-accent)' : 'transparent',
    transition: 'background-color 0.2s ease',
    zIndex: 10,
  };

  return (
    <div
      ref={panelRef}
      className={`resizable-panel ${className}`}
      style={panelStyle}
    >
      {children}
      {!disabled && (
        <div
          className="resize-handle"
          style={handleStyle}
          onMouseDown={handleMouseDown}
          onDoubleClick={() => {
            // Double-click to reset to initial size
            setSize(initialSize);
            onResize?.(initialSize);
            if (direction === 'horizontal') {
              dispatch(setSidebarWidth(initialSize));
            }
          }}
        />
      )}
    </div>
  );
};