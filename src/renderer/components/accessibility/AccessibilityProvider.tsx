/**
 * Accessibility Provider Component
 * Provides comprehensive accessibility support including keyboard navigation,
 * screen reader support, and high contrast mode
 */

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { setThemePreferences } from '../../store/slices/themeSlice';

interface AccessibilityContextType {
  // Keyboard navigation
  focusedElement: string | null;
  setFocusedElement: (elementId: string | null) => void;
  navigateToNext: () => void;
  navigateToPrevious: () => void;
  
  // Screen reader
  announceMessage: (message: string, priority?: 'polite' | 'assertive') => void;
  setAriaLabel: (elementId: string, label: string) => void;
  
  // High contrast
  isHighContrast: boolean;
  toggleHighContrast: () => void;
  
  // Focus management
  trapFocus: (containerId: string) => void;
  releaseFocus: () => void;
  
  // Reduced motion
  prefersReducedMotion: boolean;
  
  // Font scaling
  fontSize: number;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(state => state.theme);
  
  const [focusedElement, setFocusedElement] = useState<string | null>(null);
  const [focusableElements, setFocusableElements] = useState<HTMLElement[]>([]);
  const [focusTrapContainer, setFocusTrapContainer] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(theme.fontSize);
  
  const announcementRef = useRef<HTMLDivElement>(null);
  const focusHistoryRef = useRef<string[]>([]);

  // Detect system preferences
  useEffect(() => {
    const mediaQueries = {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
      highContrast: window.matchMedia('(prefers-contrast: high)'),
      colorScheme: window.matchMedia('(prefers-color-scheme: dark)')
    };

    const updatePreferences = () => {
      dispatch(setThemePreferences({
        reducedMotion: mediaQueries.reducedMotion.matches,
        highContrast: mediaQueries.highContrast.matches
      }));
    };

    // Initial check
    updatePreferences();

    // Listen for changes
    Object.values(mediaQueries).forEach(mq => {
      mq.addEventListener('change', updatePreferences);
    });

    return () => {
      Object.values(mediaQueries).forEach(mq => {
        mq.removeEventListener('change', updatePreferences);
      });
    };
  }, [dispatch]);

  // Update focusable elements
  useEffect(() => {
    const updateFocusableElements = () => {
      const selector = [
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        'a[href]',
        '[tabindex]:not([tabindex="-1"])',
        '[role="button"]:not([disabled])',
        '[role="link"]:not([disabled])',
        '[role="menuitem"]:not([disabled])',
        '[role="tab"]:not([disabled])'
      ].join(', ');

      const container = focusTrapContainer 
        ? document.getElementById(focusTrapContainer)
        : document.body;

      if (container) {
        const elements = Array.from(container.querySelectorAll(selector)) as HTMLElement[];
        setFocusableElements(elements.filter(el => {
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden';
        }));
      }
    };

    updateFocusableElements();
    
    // Update when DOM changes
    const observer = new MutationObserver(updateFocusableElements);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['disabled', 'tabindex', 'hidden']
    });

    return () => observer.disconnect();
  }, [focusTrapContainer]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'Tab':
          if (!e.shiftKey) {
            e.preventDefault();
            navigateToNext();
          } else {
            e.preventDefault();
            navigateToPrevious();
          }
          break;
        
        case 'Escape':
          if (focusTrapContainer) {
            releaseFocus();
          }
          break;
        
        case 'Enter':
        case ' ':
          if (focusedElement) {
            const element = document.getElementById(focusedElement);
            if (element && (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button')) {
              e.preventDefault();
              element.click();
            }
          }
          break;
        
        // Arrow key navigation for specific contexts
        case 'ArrowDown':
        case 'ArrowUp':
          if (focusedElement) {
            const element = document.getElementById(focusedElement);
            const role = element?.getAttribute('role');
            if (role === 'menuitem' || role === 'tab' || role === 'option') {
              e.preventDefault();
              if (e.key === 'ArrowDown') {
                navigateToNext();
              } else {
                navigateToPrevious();
              }
            }
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [focusedElement, focusTrapContainer]);

  // Focus management functions
  const navigateToNext = () => {
    if (focusableElements.length === 0) return;
    
    const currentIndex = focusedElement 
      ? focusableElements.findIndex(el => el.id === focusedElement)
      : -1;
    
    const nextIndex = (currentIndex + 1) % focusableElements.length;
    const nextElement = focusableElements[nextIndex];
    
    if (nextElement) {
      nextElement.focus();
      setFocusedElement(nextElement.id);
      announceMessage(`聚焦到 ${getElementDescription(nextElement)}`);
    }
  };

  const navigateToPrevious = () => {
    if (focusableElements.length === 0) return;
    
    const currentIndex = focusedElement 
      ? focusableElements.findIndex(el => el.id === focusedElement)
      : 0;
    
    const prevIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
    const prevElement = focusableElements[prevIndex];
    
    if (prevElement) {
      prevElement.focus();
      setFocusedElement(prevElement.id);
      announceMessage(`聚焦到 ${getElementDescription(prevElement)}`);
    }
  };

  const trapFocus = (containerId: string) => {
    setFocusTrapContainer(containerId);
    announceMessage('进入焦点陷阱模式');
  };

  const releaseFocus = () => {
    setFocusTrapContainer(null);
    announceMessage('退出焦点陷阱模式');
  };

  // Screen reader support
  const announceMessage = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (announcementRef.current) {
      announcementRef.current.setAttribute('aria-live', priority);
      announcementRef.current.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        if (announcementRef.current) {
          announcementRef.current.textContent = '';
        }
      }, 1000);
    }
  };

  const setAriaLabel = (elementId: string, label: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.setAttribute('aria-label', label);
    }
  };

  // High contrast mode
  const toggleHighContrast = () => {
    const newHighContrast = !theme.preferences.highContrast;
    dispatch(setThemePreferences({ highContrast: newHighContrast }));
    announceMessage(newHighContrast ? '已启用高对比度模式' : '已禁用高对比度模式');
  };

  // Font scaling
  const increaseFontSize = () => {
    const newSize = Math.min(fontSize + 2, 24);
    setFontSize(newSize);
    document.documentElement.style.fontSize = `${newSize}px`;
    announceMessage(`字体大小增加到 ${newSize} 像素`);
  };

  const decreaseFontSize = () => {
    const newSize = Math.max(fontSize - 2, 10);
    setFontSize(newSize);
    document.documentElement.style.fontSize = `${newSize}px`;
    announceMessage(`字体大小减少到 ${newSize} 像素`);
  };

  const resetFontSize = () => {
    const defaultSize = 14;
    setFontSize(defaultSize);
    document.documentElement.style.fontSize = `${defaultSize}px`;
    announceMessage(`字体大小重置到 ${defaultSize} 像素`);
  };

  // Helper function to get element description
  const getElementDescription = (element: HTMLElement): string => {
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;
    
    const title = element.getAttribute('title');
    if (title) return title;
    
    const textContent = element.textContent?.trim();
    if (textContent) return textContent;
    
    const role = element.getAttribute('role');
    const tagName = element.tagName.toLowerCase();
    
    return role || tagName;
  };

  // Apply accessibility styles
  useEffect(() => {
    const root = document.documentElement;
    
    // High contrast mode
    if (theme.preferences.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Reduced motion
    if (theme.preferences.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
    
    // Font size
    root.style.fontSize = `${fontSize}px`;
  }, [theme.preferences.highContrast, theme.preferences.reducedMotion, fontSize]);

  const contextValue: AccessibilityContextType = {
    focusedElement,
    setFocusedElement,
    navigateToNext,
    navigateToPrevious,
    announceMessage,
    setAriaLabel,
    isHighContrast: theme.preferences.highContrast,
    toggleHighContrast,
    trapFocus,
    releaseFocus,
    prefersReducedMotion: theme.preferences.reducedMotion,
    fontSize,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
      
      {/* Screen reader announcements */}
      <div
        ref={announcementRef}
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'absolute',
          left: '-10000px',
          width: '1px',
          height: '1px',
          overflow: 'hidden'
        }}
      />
      
      {/* Skip links */}
      <div className="skip-links">
        <a
          href="#main-content"
          className="skip-link"
          onFocus={() => announceMessage('跳转到主内容')}
        >
          跳转到主内容
        </a>
        <a
          href="#sidebar"
          className="skip-link"
          onFocus={() => announceMessage('跳转到侧边栏')}
        >
          跳转到侧边栏
        </a>
        <a
          href="#menu"
          className="skip-link"
          onFocus={() => announceMessage('跳转到菜单')}
        >
          跳转到菜单
        </a>
      </div>
      
      <style>{`
        /* Skip links */
        .skip-links {
          position: absolute;
          top: -40px;
          left: 6px;
          z-index: 10000;
        }
        
        .skip-link {
          position: absolute;
          left: -10000px;
          top: auto;
          width: 1px;
          height: 1px;
          overflow: hidden;
          background: var(--bg-primary);
          color: var(--text-primary);
          padding: 8px 16px;
          text-decoration: none;
          border-radius: 4px;
          border: 2px solid var(--accent-color);
        }
        
        .skip-link:focus {
          position: static;
          width: auto;
          height: auto;
          overflow: visible;
        }
        
        /* High contrast mode */
        .high-contrast {
          --bg-primary: #000000;
          --bg-secondary: #1a1a1a;
          --bg-tertiary: #333333;
          --border-color: #ffffff;
          --text-primary: #ffffff;
          --text-secondary: #cccccc;
          --accent-color: #00ffff;
          --success-color: #00ff00;
          --warning-color: #ffff00;
          --error-color: #ff0000;
        }
        
        .high-contrast * {
          border-color: var(--border-color) !important;
        }
        
        .high-contrast button,
        .high-contrast input,
        .high-contrast select,
        .high-contrast textarea {
          border: 2px solid var(--border-color) !important;
        }
        
        .high-contrast :focus {
          outline: 3px solid var(--accent-color) !important;
          outline-offset: 2px !important;
        }
        
        /* Reduced motion */
        .reduced-motion *,
        .reduced-motion *::before,
        .reduced-motion *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
        
        /* Focus indicators */
        *:focus {
          outline: 2px solid var(--accent-color);
          outline-offset: 2px;
        }
        
        /* Ensure interactive elements are large enough */
        button,
        input,
        select,
        textarea,
        a,
        [role="button"],
        [role="link"] {
          min-height: 44px;
          min-width: 44px;
        }
        
        /* Improve text readability */
        body {
          line-height: 1.5;
        }
        
        /* Ensure sufficient color contrast */
        .high-contrast .ant-btn {
          background: var(--bg-secondary) !important;
          color: var(--text-primary) !important;
          border: 2px solid var(--border-color) !important;
        }
        
        .high-contrast .ant-btn:hover {
          background: var(--bg-tertiary) !important;
          color: var(--accent-color) !important;
        }
        
        .high-contrast .ant-input {
          background: var(--bg-secondary) !important;
          color: var(--text-primary) !important;
          border: 2px solid var(--border-color) !important;
        }
      `}</style>
    </AccessibilityContext.Provider>
  );
};