/**
 * File System Integration Tests
 * Tests for the file system integration components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { FileManager } from '../FileManager';
import { FileTree } from '../FileTree';
import { FilePreview } from '../FilePreview';
import { fileSlice } from '../../../store/slices/fileSlice';

// Mock the electron API
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

// Mock window.electronAPI
Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true,
});

// Create a test store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      file: fileSlice.reducer,
    },
    preloadedState: {
      file: {
        currentWorkspace: null,
        fileTree: [],
        openFiles: [],
        activeFile: null,
        recentFiles: [],
        watchedDirectories: [],
        searchResults: [],
        status: 'idle',
        error: null,
        ...initialState,
      },
    },
  });
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode; store?: any }> = ({ 
  children, 
  store = createTestStore() 
}) => (
  <Provider store={store}>
    {children}
  </Provider>
);

describe('File System Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('FileManager Component', () => {
    it('should render without crashing', () => {
      render(
        <TestWrapper>
          <FileManager />
        </TestWrapper>
      );
      
      expect(screen.getByText('Open')).toBeInTheDocument();
    });

    it('should handle workspace opening', async () => {
      mockElectronAPI.app.showOpenDialog.mockResolvedValue({
        success: true,
        canceled: false,
        filePaths: ['/test/workspace'],
      });

      mockElectronAPI.fs.listDirectory.mockResolvedValue({
        success: true,
        items: [
          { name: 'test.txt', path: '/test/workspace/test.txt', isDirectory: false, isFile: true },
          { name: 'folder', path: '/test/workspace/folder', isDirectory: true, isFile: false },
        ],
      });

      mockElectronAPI.fs.watchDirectory.mockResolvedValue({
        success: true,
        watcherId: 'watcher-1',
      });

      render(
        <TestWrapper>
          <FileManager />
        </TestWrapper>
      );

      const openButton = screen.getByText('Open');
      fireEvent.click(openButton);

      await waitFor(() => {
        expect(mockElectronAPI.app.showOpenDialog).toHaveBeenCalledWith({
          title: 'Open Workspace',
          properties: ['openDirectory'],
          buttonLabel: 'Open Workspace',
        });
      });
    });
  });

  describe('FileTree Component', () => {
    const mockFiles = [
      {
        name: 'test.txt',
        path: '/test/workspace/test.txt',
        isDirectory: false,
        isFile: true,
      },
      {
        name: 'folder',
        path: '/test/workspace/folder',
        isDirectory: true,
        isFile: false,
        children: [],
      },
    ];

    it('should render file tree with files', () => {
      const mockProps = {
        files: mockFiles,
        selectedFile: null,
        expandedDirectories: new Set<string>(),
        onFileSelect: jest.fn(),
        onDirectoryExpand: jest.fn(),
        onDirectoryCollapse: jest.fn(),
        onFileCreate: jest.fn(),
        onDirectoryCreate: jest.fn(),
        onFileRename: jest.fn(),
        onFileDelete: jest.fn(),
        onFileCopy: jest.fn(),
        onFileMove: jest.fn(),
        onRefresh: jest.fn(),
        workspacePath: '/test/workspace',
      };

      render(
        <TestWrapper>
          <FileTree {...mockProps} />
        </TestWrapper>
      );

      expect(screen.getByText('test.txt')).toBeInTheDocument();
      expect(screen.getByText('folder')).toBeInTheDocument();
    });

    it('should handle file selection', () => {
      const mockOnFileSelect = jest.fn();
      const mockProps = {
        files: mockFiles,
        selectedFile: null,
        expandedDirectories: new Set<string>(),
        onFileSelect: mockOnFileSelect,
        onDirectoryExpand: jest.fn(),
        onDirectoryCollapse: jest.fn(),
        onFileCreate: jest.fn(),
        onDirectoryCreate: jest.fn(),
        onFileRename: jest.fn(),
        onFileDelete: jest.fn(),
        onFileCopy: jest.fn(),
        onFileMove: jest.fn(),
        onRefresh: jest.fn(),
        workspacePath: '/test/workspace',
      };

      render(
        <TestWrapper>
          <FileTree {...mockProps} />
        </TestWrapper>
      );

      const fileElement = screen.getByText('test.txt');
      fireEvent.click(fileElement);

      expect(mockOnFileSelect).toHaveBeenCalledWith(mockFiles[0]);
    });

    it('should handle file creation', async () => {
      mockElectronAPI.fs.validateName.mockResolvedValue({
        success: true,
        validation: { valid: true },
      });

      const mockOnFileCreate = jest.fn();
      const mockProps = {
        files: mockFiles,
        selectedFile: null,
        expandedDirectories: new Set<string>(),
        onFileSelect: jest.fn(),
        onDirectoryExpand: jest.fn(),
        onDirectoryCollapse: jest.fn(),
        onFileCreate: mockOnFileCreate,
        onDirectoryCreate: jest.fn(),
        onFileRename: jest.fn(),
        onFileDelete: jest.fn(),
        onFileCopy: jest.fn(),
        onFileMove: jest.fn(),
        onRefresh: jest.fn(),
        workspacePath: '/test/workspace',
      };

      render(
        <TestWrapper>
          <FileTree {...mockProps} />
        </TestWrapper>
      );

      // Click new file button
      const newFileButton = screen.getByTitle('New File');
      fireEvent.click(newFileButton);

      // Wait for modal to appear and fill in name
      await waitFor(() => {
        expect(screen.getByText('Create File')).toBeInTheDocument();
      });

      const nameInput = screen.getByPlaceholderText('Enter file name');
      fireEvent.change(nameInput, { target: { value: 'newfile.txt' } });

      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockOnFileCreate).toHaveBeenCalledWith('/test/workspace', 'newfile.txt');
      });
    });
  });

  describe('FilePreview Component', () => {
    it('should render preview for text file', async () => {
      const mockFile = {
        name: 'test.txt',
        path: '/test/workspace/test.txt',
        isDirectory: false,
        isFile: true,
      };

      mockElectronAPI.fs.getPreview.mockResolvedValue({
        success: true,
        preview: {
          type: 'text',
          content: 'Hello, World!',
          size: 13,
          mtime: new Date(),
          encoding: 'utf-8',
        },
      });

      render(
        <TestWrapper>
          <FilePreview file={mockFile} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('test.txt')).toBeInTheDocument();
        expect(screen.getByText('Hello, World!')).toBeInTheDocument();
      });
    });

    it('should show message when no file is selected', () => {
      render(
        <TestWrapper>
          <FilePreview file={null} />
        </TestWrapper>
      );

      expect(screen.getByText('Select a file to preview')).toBeInTheDocument();
    });

    it('should show directory message for directories', () => {
      const mockDirectory = {
        name: 'folder',
        path: '/test/workspace/folder',
        isDirectory: true,
        isFile: false,
      };

      render(
        <TestWrapper>
          <FilePreview file={mockDirectory} />
        </TestWrapper>
      );

      expect(screen.getByText('Directory selected')).toBeInTheDocument();
      expect(screen.getByText('folder')).toBeInTheDocument();
    });
  });

  describe('File Operations Integration', () => {
    it('should handle file operations with progress tracking', async () => {
      // This test would verify that file operations are properly integrated
      // with the progress tracking system
      
      const store = createTestStore({
        currentWorkspace: '/test/workspace',
        fileTree: [
          {
            name: 'test.txt',
            path: '/test/workspace/test.txt',
            isDirectory: false,
            isFile: true,
          },
        ],
      });

      mockElectronAPI.fs.copy.mockResolvedValue({
        success: true,
      });

      render(
        <TestWrapper store={store}>
          <FileManager />
        </TestWrapper>
      );

      // This would test the integration with FileOperationsService
      // In a real test, we would trigger a copy operation and verify
      // that progress events are properly handled
    });

    it('should handle file watching events', async () => {
      const store = createTestStore({
        currentWorkspace: '/test/workspace',
      });

      render(
        <TestWrapper store={store}>
          <FileManager />
        </TestWrapper>
      );

      // Simulate a file system event
      const mockEvent = {
        eventType: 'add',
        filename: 'newfile.txt',
        path: '/test/workspace/newfile.txt',
      };

      // In a real test, we would trigger the file watcher callback
      // and verify that the Redux store is updated accordingly
    });
  });
});