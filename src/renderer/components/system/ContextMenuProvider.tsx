/**
 * Context Menu Provider
 * Global context menu system with dynamic menu items
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Dropdown } from 'antd';
import { ContextMenuItem, ContextMenuConfig } from '../../types/system';
import { useAppSelector } from '../../hooks/redux';

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
}

interface ContextMenuContextType {
  showContextMenu: (x: number, y: number, context: string, data?: any) => void;
  hideContextMenu: () => void;
}

const ContextMenuContext = createContext<ContextMenuContextType | null>(null);

export const useContextMenu = () => {
  const context = useContext(ContextMenuContext);
  if (!context) {
    throw new Error('useContextMenu must be used within ContextMenuProvider');
  }
  return context;
};

interface ContextMenuProviderProps {
  children: React.ReactNode;
}

export const ContextMenuProvider: React.FC<ContextMenuProviderProps> = ({ children }) => {
  const { contextMenus } = useAppSelector(state => state.system);
  const [menuState, setMenuState] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    items: []
  });

  const showContextMenu = useCallback((x: number, y: number, context: string, data?: any) => {
    const contextConfig = contextMenus.find(c => c.context === context);
    if (!contextConfig) return;

    // Filter items based on visibility and enabled state
    const visibleItems = contextConfig.items.filter(item => {
      if (item.visible === false) return false;
      if (typeof item.when === 'function') {
        return item.when(data);
      }
      return true;
    });

    setMenuState({
      visible: true,
      x,
      y,
      items: visibleItems
    });
  }, [contextMenus]);

  const hideContextMenu = useCallback(() => {
    setMenuState(prev => ({ ...prev, visible: false }));
  }, []);

  const handleMenuClick = (item: ContextMenuItem, data?: any) => {
    if (item.action && typeof item.action === 'function') {
      (item.action as (data?: any) => void)(data);
    }
    hideContextMenu();
  };

  const convertToAntdMenuItems = (items: ContextMenuItem[], data?: any): any[] => {
    return items.map(item => {
      if (item.separator) {
        return { type: 'divider' as const, key: `separator-${Math.random()}` };
      }

      return {
        key: item.id,
        label: item.label,
        icon: item.icon,
        disabled: item.enabled === false,
        onClick: () => handleMenuClick(item, data),
        children: item.submenu ? convertToAntdMenuItems(item.submenu, data) : undefined
      };
    });
  };

  return (
    <ContextMenuContext.Provider value={{ showContextMenu, hideContextMenu }}>
      <div
        style={{ width: '100%', height: '100%' }}
        onContextMenu={(e) => {
          // Prevent default browser context menu
          e.preventDefault();
        }}
      >
        {children}
        
        {menuState.visible && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 9999,
              pointerEvents: 'none'
            }}
          >
            <Dropdown
              menu={{
                items: convertToAntdMenuItems(menuState.items)
              }}
              open={menuState.visible}
              onOpenChange={(open) => {
                if (!open) hideContextMenu();
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: menuState.x,
                  top: menuState.y,
                  width: 1,
                  height: 1,
                  pointerEvents: 'auto'
                }}
              />
            </Dropdown>
          </div>
        )}
      </div>
    </ContextMenuContext.Provider>
  );
};

// Hook for adding context menu to components
export const useContextMenuHandler = (context: string, getData?: () => any) => {
  const { showContextMenu } = useContextMenu();

  return useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const data = getData ? getData() : undefined;
    showContextMenu(e.clientX, e.clientY, context, data);
  }, [showContextMenu, context, getData]);
};