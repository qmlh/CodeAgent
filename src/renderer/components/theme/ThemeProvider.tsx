/**
 * Theme Provider Component
 * Provides theme context and manages theme switching
 */

import React, { createContext, useContext, useEffect } from 'react';
import { ConfigProvider, theme } from 'antd';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { setTheme, Theme } from '../../store/slices/uiSlice';

interface ThemeContextType {
  currentTheme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const currentTheme = useAppSelector(state => state.ui.theme);

  // Apply theme to document root
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('theme-light', 'theme-dark');
    
    // Determine actual theme (handle 'auto' mode)
    let actualTheme = currentTheme;
    if (currentTheme === 'auto') {
      actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    // Apply theme class
    root.classList.add(`theme-${actualTheme}`);
    
    // Update CSS custom properties
    if (actualTheme === 'dark') {
      root.style.setProperty('--color-bg-primary', '#1e1e1e');
      root.style.setProperty('--color-bg-secondary', '#252526');
      root.style.setProperty('--color-bg-tertiary', '#2d2d30');
      root.style.setProperty('--color-border', '#3e3e42');
      root.style.setProperty('--color-text-primary', '#cccccc');
      root.style.setProperty('--color-text-secondary', '#888888');
      root.style.setProperty('--color-accent', '#007acc');
      root.style.setProperty('--color-accent-hover', '#1177bb');
    } else {
      root.style.setProperty('--color-bg-primary', '#ffffff');
      root.style.setProperty('--color-bg-secondary', '#f8f8f8');
      root.style.setProperty('--color-bg-tertiary', '#f0f0f0');
      root.style.setProperty('--color-border', '#e0e0e0');
      root.style.setProperty('--color-text-primary', '#333333');
      root.style.setProperty('--color-text-secondary', '#666666');
      root.style.setProperty('--color-accent', '#0066cc');
      root.style.setProperty('--color-accent-hover', '#0052a3');
    }
  }, [currentTheme]);

  // Listen for system theme changes when in auto mode
  useEffect(() => {
    if (currentTheme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        // Trigger re-render by updating a dummy state or force theme recalculation
        const root = document.documentElement;
        root.classList.remove('theme-light', 'theme-dark');
        const actualTheme = mediaQuery.matches ? 'dark' : 'light';
        root.classList.add(`theme-${actualTheme}`);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [currentTheme]);

  const handleToggleTheme = () => {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    dispatch(setTheme(newTheme));
  };

  const handleSetTheme = (newTheme: Theme) => {
    dispatch(setTheme(newTheme));
  };

  // Determine Ant Design theme
  const getAntdTheme = () => {
    let actualTheme = currentTheme;
    if (currentTheme === 'auto') {
      actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    return {
      algorithm: actualTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
      token: {
        colorPrimary: '#007acc',
        colorBgContainer: actualTheme === 'dark' ? '#1e1e1e' : '#ffffff',
        colorBgElevated: actualTheme === 'dark' ? '#252526' : '#ffffff',
        colorBorder: actualTheme === 'dark' ? '#3e3e42' : '#e0e0e0',
        colorText: actualTheme === 'dark' ? '#cccccc' : '#333333',
        colorTextSecondary: actualTheme === 'dark' ? '#888888' : '#666666',
        borderRadius: 4,
        fontSize: 14,
      },
      components: {
        Layout: {
          bodyBg: actualTheme === 'dark' ? '#1e1e1e' : '#ffffff',
          headerBg: actualTheme === 'dark' ? '#2d2d30' : '#f0f0f0',
          siderBg: actualTheme === 'dark' ? '#252526' : '#f8f8f8',
          footerBg: actualTheme === 'dark' ? '#007acc' : '#007acc',
        },
        Menu: {
          darkItemBg: 'transparent',
          darkItemSelectedBg: '#37373d',
          darkItemHoverBg: '#2a2d2e',
        },
        Button: {
          primaryColor: '#ffffff',
          primaryBg: '#007acc',
        },
        Input: {
          colorBgContainer: actualTheme === 'dark' ? '#2d2d30' : '#ffffff',
          colorBorder: actualTheme === 'dark' ? '#3e3e42' : '#e0e0e0',
        },
        Select: {
          colorBgContainer: actualTheme === 'dark' ? '#2d2d30' : '#ffffff',
          colorBorder: actualTheme === 'dark' ? '#3e3e42' : '#e0e0e0',
        },
        Tabs: {
          cardBg: actualTheme === 'dark' ? '#2d2d30' : '#f0f0f0',
          itemSelectedColor: actualTheme === 'dark' ? '#ffffff' : '#333333',
        }
      }
    };
  };

  const contextValue: ThemeContextType = {
    currentTheme,
    toggleTheme: handleToggleTheme,
    setTheme: handleSetTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <ConfigProvider theme={getAntdTheme()}>
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};