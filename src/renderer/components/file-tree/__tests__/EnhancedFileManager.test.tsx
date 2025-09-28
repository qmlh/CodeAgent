/**
 * Enhanced File Manager Integration Tests
 */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { VirtualizedFileTree } from '../VirtualizedFileTree';
import { EnhancedFilePreview } from '../EnhancedFilePreview';
import { AdvancedFileSearch } from '../AdvancedFileSearch';
import { FileFavorites } from '../FileFavorites';
import { FileOperationHistory } from '../FileOperationHistory';
import { fileSlice } from '../../../store/slices/fileSlice';

// Mock window.electronAPI
const mockElectronAPI = {
    fs: {
        validateName: jest.fn().mockResolvedValue({ success: true, validation: { valid: true } }),
        getDirectoryName: jest.fn().mockResolvedValue({ success: true, dirName: '/test' }),
        joinPath: jest.fn().mockResolvedValue({ success: true, path: '/test/file.txt' }),
        getPreview: jest.fn().mockResolvedValue({
            success: true,
            preview: {
                type: 'text',
                content: 'Test content',
                size: 100,
                mtime: new Date(),
                encoding: 'utf-8'
            }
        })
    },
    app: {
        showOpenDialog: jest.fn(),
        showSaveDialog: jest.fn(),
        showMessageBox: jest.fn()
    }
};

(global as any).window.electronAPI = mockElectronAPI;

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};
(global as any).localStorage = localStorageMock;

// Create test store
const createTestStore = () => {
    return configureStore({
        reducer: {
            file: fileSlice.reducer
        },
        preloadedState: {
            file: {
                currentWorkspace: '/test/workspace',
                fileTree: [
                    {
                        path: '/test/workspace/file1.txt',
                        name: 'file1.txt',
                        isDirectory: false,
                        isFile: true,
                        children: []
                    },
                    {
                        path: '/test/workspace/folder1',
                        name: 'folder1',
                        isDirectory: true,
                        isFile: false,
                        children: [
                            {
                                path: '/test/workspace/folder1/file2.txt',
                                name: 'file2.txt',
                                isDirectory: false,
                                isFile: true,
                                children: []
                            }
                        ]
                    }
                ],
                openFiles: [],
                activeFile: null,
                recentFiles: [],
                watchedDirectories: [],
                searchResults: [],
                status: 'idle' as const,
                error: null
            }
        }
    });
};

describe('Enhanced File Manager Components', () => {
    let store: ReturnType<typeof createTestStore>;

    beforeEach(() => {
        store = createTestStore();
        jest.clearAllMocks();
        localStorageMock.getItem.mockReturnValue(null);
    });

    describe('VirtualizedFileTree', () => {
        const defaultProps = {
            files: [
                {
                    path: '/test/file1.txt',
                    name: 'file1.txt',
                    isDirectory: false,
                    isFile: true,
                    children: []
                }
            ],
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
            workspacePath: '/test/workspace'
        };

        it('renders file tree with virtualization', () => {
            render(<VirtualizedFileTree {...defaultProps} />);

            expect(screen.getByPlaceholderText('Search files...')).toBeInTheDocument();
            expect(screen.getByTitle('New File')).toBeInTheDocument();
            expect(screen.getByTitle('New Folder')).toBeInTheDocument();
            expect(screen.getByTitle('Refresh')).toBeInTheDocument();
        });

        it('handles search functionality', async () => {
            render(<VirtualizedFileTree {...defaultProps} />);

            const searchInput = screen.getByPlaceholderText('Search files...');
            fireEvent.change(searchInput, { target: { value: 'file1' } });

            await waitFor(() => {
                expect(searchInput).toHaveValue('file1');
            });
        });

        it('shows empty state when no workspace', () => {
            render(<VirtualizedFileTree {...defaultProps} workspacePath={null} />);

            expect(screen.getByText('No workspace opened')).toBeInTheDocument();
        });

        it('shows loading state', () => {
            render(<VirtualizedFileTree {...defaultProps} loading={true} />);

            expect(screen.getByRole('img', { name: /loading/i })).toBeInTheDocument();
        });
    });

    describe('EnhancedFilePreview', () => {
        const testFile = {
            path: '/test/file.txt',
            name: 'file.txt',
            isDirectory: false,
            isFile: true,
            children: []
        };

        it('renders preview for selected file', async () => {
            render(<EnhancedFilePreview file={testFile} />);

            expect(screen.getByText('File Preview')).toBeInTheDocument();

            await waitFor(() => {
                expect(mockElectronAPI.fs.getPreview).toHaveBeenCalledWith('/test/file.txt');
            });
        });

        it('shows directory message for directories', () => {
            const directory = { ...testFile, isDirectory: true, isFile: false };
            render(<EnhancedFilePreview file={directory} />);

            expect(screen.getByText('Directory selected')).toBeInTheDocument();
        });

        it('shows select file message when no file selected', () => {
            render(<EnhancedFilePreview file={null} />);

            expect(screen.getByText('Select a file to preview')).toBeInTheDocument();
        });

        it('has refresh functionality', () => {
            render(<EnhancedFilePreview file={testFile} />);

            const refreshButton = screen.getByTitle('Refresh');
            expect(refreshButton).toBeInTheDocument();

            fireEvent.click(refreshButton);
            // Should trigger another preview load
        });
    });

    describe('AdvancedFileSearch', () => {
        it('renders search interface', () => {
            render(
                <Provider store={store}>
                    <AdvancedFileSearch />
                </Provider>
            );

            expect(screen.getByPlaceholderText('Search files and content...')).toBeInTheDocument();
            expect(screen.getByText('Filters')).toBeInTheDocument();
        });

        it('shows empty state when no workspace', () => {
            const emptyStore = configureStore({
                reducer: { file: fileSlice.reducer },
                preloadedState: {
                    file: {
                        currentWorkspace: null,
                        fileTree: [],
                        openFiles: [],
                        activeFile: null,
                        recentFiles: [],
                        watchedDirectories: [],
                        searchResults: [],
                        status: 'idle' as const,
                        error: null
                    }
                }
            });

            render(
                <Provider store={emptyStore}>
                    <AdvancedFileSearch />
                </Provider>
            );

            expect(screen.getByText('Open a workspace to search files')).toBeInTheDocument();
        });
    });

    describe('FileFavorites', () => {
        it('renders favorites interface', () => {
            render(<FileFavorites currentWorkspace="/test/workspace" />);

            expect(screen.getByText(/Favorites \(0\)/)).toBeInTheDocument();
        });

        it('shows empty state when no favorites', () => {
            render(<FileFavorites currentWorkspace="/test/workspace" />);

            expect(screen.getByText('No favorites yet')).toBeInTheDocument();
            expect(screen.getByText('Right-click on files or folders to add them to favorites')).toBeInTheDocument();
        });
    });

    describe('FileOperationHistory', () => {
        it('renders history interface', () => {
            render(<FileOperationHistory />);

            expect(screen.getByTitle('Undo (Ctrl+Z)')).toBeInTheDocument();
            expect(screen.getByTitle('Redo (Ctrl+Y)')).toBeInTheDocument();
            expect(screen.getByTitle('Show History')).toBeInTheDocument();
        });

        it('disables undo/redo when no operations', () => {
            render(<FileOperationHistory />);

            const undoButton = screen.getByTitle('Undo (Ctrl+Z)');
            const redoButton = screen.getByTitle('Redo (Ctrl+Y)');

            expect(undoButton).toBeDisabled();
            expect(redoButton).toBeDisabled();
        });

        it('shows history panel when clicked', () => {
            render(<FileOperationHistory />);

            const historyButton = screen.getByTitle('Show History');
            fireEvent.click(historyButton);

            expect(screen.getByText('Operation History')).toBeInTheDocument();
            expect(screen.getByText('No operations in history')).toBeInTheDocument();
        });
    });
});

describe('Integration Tests', () => {
    it('components work together without errors', () => {
        const store = createTestStore();

        // This test ensures all components can be rendered together without throwing errors
        expect(() => {
            render(
                <Provider store={store}>
                    <div>
                        <VirtualizedFileTree
                            files={[]}
                            selectedFile={null}
                            expandedDirectories={new Set()}
                            onFileSelect={jest.fn()}
                            onDirectoryExpand={jest.fn()}
                            onDirectoryCollapse={jest.fn()}
                            onFileCreate={jest.fn()}
                            onDirectoryCreate={jest.fn()}
                            onFileRename={jest.fn()}
                            onFileDelete={jest.fn()}
                            onFileCopy={jest.fn()}
                            onFileMove={jest.fn()}
                            onRefresh={jest.fn()}
                            workspacePath="/test"
                        />
                        <EnhancedFilePreview file={null} />
                        <AdvancedFileSearch />
                        <FileFavorites />
                        <FileOperationHistory />
                    </div>
                </Provider>
            );
        }).not.toThrow();
    });
});