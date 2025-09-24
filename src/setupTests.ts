/**
 * Test Setup
 * Global test configuration and mocks
 */

import '@testing-library/jest-dom';

// Mock window.electronAPI globally
const mockElectronAPI = {
  fs: {
    listDirectory: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    deleteFile: jest.fn(),
    copy: jest.fn(),
    move: jest.fn(),
    rename: jest.fn(),
    createDirectory: jest.fn(),
    exists: jest.fn(),
    getStats: jest.fn(),
    getFileName: jest.fn(),
    getDirectoryName: jest.fn(),
    joinPath: jest.fn(),
    validateName: jest.fn(),
    getPreview: jest.fn(),
    watchDirectory: jest.fn(),
    unwatchDirectory: jest.fn(),
    onDirectoryChanged: jest.fn(),
    search: jest.fn(),
  },
  app: {
    showOpenDialog: jest.fn(),
    showSaveDialog: jest.fn(),
    showMessageBox: jest.fn(),
    showItemInFolder: jest.fn(),
  },
  removeAllListeners: jest.fn(),
};

Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true,
});

// Mock window.matchMedia for Ant Design components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.getComputedStyle for JSDOM
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: () => '',
  }),
});

// Mock react-dnd
jest.mock('react-dnd', () => ({
  DndProvider: ({ children }: { children: React.ReactNode }) => children,
  useDrag: () => [{ isDragging: false }, jest.fn(), jest.fn()],
  useDrop: () => [{ isOver: false, canDrop: false }, jest.fn()],
}));

jest.mock('react-dnd-html5-backend', () => ({
  HTML5Backend: {},
}));

// Mock file operations service
jest.mock('./renderer/services/FileOperationsService', () => ({
  fileOperationsService: {
    on: jest.fn(),
    off: jest.fn(),
    validateFileName: jest.fn(),
    createFile: jest.fn(),
    copyFile: jest.fn(),
    moveFile: jest.fn(),
    deleteFile: jest.fn(),
    renameFile: jest.fn(),
  },
}));

// Mock file watcher service
jest.mock('./renderer/services/FileWatcherService', () => ({
  fileWatcherService: {
    on: jest.fn(),
    off: jest.fn(),
    watchDirectory: jest.fn(),
    unwatchDirectory: jest.fn(),
    isWatching: jest.fn(),
    createDebouncedCallback: jest.fn((callback) => callback),
  },
}));