/**
 * Browser State Management
 * Redux slice for managing browser tabs, bookmarks, and preview settings
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { 
  BrowserState, 
  BrowserTab, 
  PreviewSettings, 
  BookmarkCategory, 
  Bookmark,
  DeviceEmulation,
  DEVICE_PRESETS 
} from '../../types/browser';

const initialState: BrowserState = {
  tabs: [],
  activeTabId: null,
  previewSettings: {
    autoRefresh: true,
    hotReload: true,
    syncScroll: false,
    deviceEmulation: {
      enabled: false,
      device: DEVICE_PRESETS[0], // Desktop by default
    },
  },
  bookmarks: [
    {
      id: 'default',
      name: 'General',
      color: '#1890ff',
      bookmarks: [],
    },
  ],
  history: [],
  isVisible: false,
};

const browserSlice = createSlice({
  name: 'browser',
  initialState,
  reducers: {
    // Tab management
    createTab: (state, action: PayloadAction<{ url: string; title?: string }>) => {
      const newTab: BrowserTab = {
        id: `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url: action.payload.url,
        title: action.payload.title || 'New Tab',
        isLoading: true,
        canGoBack: false,
        canGoForward: false,
        isDevToolsOpen: false,
        lastUpdated: new Date(),
      };
      state.tabs.push(newTab);
      state.activeTabId = newTab.id;
    },

    closeTab: (state, action: PayloadAction<string>) => {
      const tabIndex = state.tabs.findIndex(tab => tab.id === action.payload);
      if (tabIndex !== -1) {
        state.tabs.splice(tabIndex, 1);
        
        // If closing active tab, switch to another tab
        if (state.activeTabId === action.payload) {
          if (state.tabs.length > 0) {
            const newActiveIndex = Math.min(tabIndex, state.tabs.length - 1);
            state.activeTabId = state.tabs[newActiveIndex]?.id || null;
          } else {
            state.activeTabId = null;
          }
        }
      }
    },

    setActiveTab: (state, action: PayloadAction<string>) => {
      const tab = state.tabs.find(tab => tab.id === action.payload);
      if (tab) {
        state.activeTabId = action.payload;
      }
    },

    updateTab: (state, action: PayloadAction<{ id: string; updates: Partial<BrowserTab> }>) => {
      const tab = state.tabs.find(tab => tab.id === action.payload.id);
      if (tab) {
        Object.assign(tab, action.payload.updates);
        tab.lastUpdated = new Date();
      }
    },

    navigateTab: (state, action: PayloadAction<{ id: string; url: string }>) => {
      const tab = state.tabs.find(tab => tab.id === action.payload.id);
      if (tab) {
        tab.url = action.payload.url;
        tab.isLoading = true;
        tab.lastUpdated = new Date();
        
        // Add to history if not already there
        if (!state.history.includes(action.payload.url)) {
          state.history.unshift(action.payload.url);
          // Keep only last 100 entries
          if (state.history.length > 100) {
            state.history = state.history.slice(0, 100);
          }
        }
      }
    },

    toggleDevTools: (state, action: PayloadAction<string>) => {
      const tab = state.tabs.find(tab => tab.id === action.payload);
      if (tab) {
        tab.isDevToolsOpen = !tab.isDevToolsOpen;
      }
    },

    // Preview settings
    updatePreviewSettings: (state, action: PayloadAction<Partial<PreviewSettings>>) => {
      state.previewSettings = { ...state.previewSettings, ...action.payload };
    },

    setDeviceEmulation: (state, action: PayloadAction<DeviceEmulation>) => {
      state.previewSettings.deviceEmulation = action.payload;
    },

    toggleAutoRefresh: (state) => {
      state.previewSettings.autoRefresh = !state.previewSettings.autoRefresh;
    },

    toggleHotReload: (state) => {
      state.previewSettings.hotReload = !state.previewSettings.hotReload;
    },

    toggleSyncScroll: (state) => {
      state.previewSettings.syncScroll = !state.previewSettings.syncScroll;
    },

    // Bookmark management
    addBookmark: (state, action: PayloadAction<{ bookmark: Omit<Bookmark, 'id' | 'createdAt'>; categoryId?: string }>) => {
      const categoryId = action.payload.categoryId || 'default';
      const category = state.bookmarks.find(cat => cat.id === categoryId);
      
      if (category) {
        const newBookmark: Bookmark = {
          ...action.payload.bookmark,
          id: `bookmark-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
        };
        category.bookmarks.push(newBookmark);
      }
    },

    removeBookmark: (state, action: PayloadAction<{ bookmarkId: string; categoryId: string }>) => {
      const category = state.bookmarks.find(cat => cat.id === action.payload.categoryId);
      if (category) {
        const bookmarkIndex = category.bookmarks.findIndex(bookmark => bookmark.id === action.payload.bookmarkId);
        if (bookmarkIndex !== -1) {
          category.bookmarks.splice(bookmarkIndex, 1);
        }
      }
    },

    updateBookmark: (state, action: PayloadAction<{ bookmarkId: string; categoryId: string; updates: Partial<Bookmark> }>) => {
      const category = state.bookmarks.find(cat => cat.id === action.payload.categoryId);
      if (category) {
        const bookmark = category.bookmarks.find(bookmark => bookmark.id === action.payload.bookmarkId);
        if (bookmark) {
          Object.assign(bookmark, action.payload.updates);
        }
      }
    },

    createBookmarkCategory: (state, action: PayloadAction<{ name: string; color: string }>) => {
      const newCategory: BookmarkCategory = {
        id: `category-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: action.payload.name,
        color: action.payload.color,
        bookmarks: [],
      };
      state.bookmarks.push(newCategory);
    },

    removeBookmarkCategory: (state, action: PayloadAction<string>) => {
      const categoryIndex = state.bookmarks.findIndex(cat => cat.id === action.payload);
      if (categoryIndex !== -1 && action.payload !== 'default') {
        state.bookmarks.splice(categoryIndex, 1);
      }
    },

    // Browser visibility
    setBrowserVisible: (state, action: PayloadAction<boolean>) => {
      state.isVisible = action.payload;
    },

    // History management
    clearHistory: (state) => {
      state.history = [];
    },

    removeFromHistory: (state, action: PayloadAction<string>) => {
      const index = state.history.indexOf(action.payload);
      if (index !== -1) {
        state.history.splice(index, 1);
      }
    },
  },
});

export const {
  createTab,
  closeTab,
  setActiveTab,
  updateTab,
  navigateTab,
  toggleDevTools,
  updatePreviewSettings,
  setDeviceEmulation,
  toggleAutoRefresh,
  toggleHotReload,
  toggleSyncScroll,
  addBookmark,
  removeBookmark,
  updateBookmark,
  createBookmarkCategory,
  removeBookmarkCategory,
  setBrowserVisible,
  clearHistory,
  removeFromHistory,
} = browserSlice.actions;

export default browserSlice.reducer;