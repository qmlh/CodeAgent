# Enhanced File Manager Components

This directory contains the enhanced file manager components that implement task 16 from the multi-agent IDE specification.

## Components Overview

### 1. VirtualizedFileTree
- **Purpose**: High-performance file tree with virtual scrolling for large directories
- **Features**:
  - Virtual scrolling using react-window for performance
  - Search functionality with real-time filtering
  - Lazy loading for large directories
  - Optimized rendering for thousands of files
  - Toolbar with file operations (New File, New Folder, Refresh)

### 2. DragDropFileTree
- **Purpose**: Enhanced file tree with advanced drag and drop capabilities
- **Features**:
  - Multi-select support (Ctrl/Cmd + click, Shift + click)
  - Drag and drop with visual feedback
  - Batch operations (delete, copy, move)
  - External file drop support (from OS)
  - Drag preview with item count
  - Drop zone highlighting

### 3. EnhancedFilePreview
- **Purpose**: Advanced file preview with caching, history, and multiple file type support
- **Features**:
  - Preview caching (5-minute cache duration)
  - Preview history (last 10 items)
  - Support for multiple file types:
    - Text files with syntax highlighting
    - Code files with language detection
    - JSON files with metadata analysis
    - Markdown files
    - Images with size information
    - Binary files with appropriate messaging
  - Refresh functionality
  - Tabbed interface (Preview + History)

### 4. AdvancedFileSearch
- **Purpose**: Enhanced search with suggestions, history, and advanced filters
- **Features**:
  - Search suggestions based on history and patterns
  - Search history (last 20 searches)
  - Saved searches with custom names
  - Advanced filters:
    - File content search
    - File type filtering
    - File size range
    - Date modified range
    - Hidden files inclusion
    - Case sensitivity
    - Regular expressions
  - AutoComplete with recent searches

### 5. FileFavorites
- **Purpose**: Bookmark and quick access to frequently used files and folders
- **Features**:
  - Add files/folders to favorites
  - Organize favorites into groups with colors
  - Access count tracking
  - Last accessed timestamp
  - Sorting options (name, date, access count)
  - Group filtering
  - Notes for favorites
  - Persistent storage in localStorage

### 6. FileOperationHistory
- **Purpose**: Undo/Redo functionality for file operations
- **Features**:
  - Operation history tracking (last 50 operations)
  - Undo/Redo support for:
    - File creation
    - File deletion
    - File renaming
    - File moving
    - File copying
  - Operation history panel
  - Persistent storage in localStorage
  - Visual operation timeline

### 7. Enhanced FileManager
- **Purpose**: Main file manager component that integrates all enhanced features
- **Features**:
  - Tabbed interface with all components
  - Performance mode toggle (virtualization on/off)
  - Drag and drop mode toggle
  - Bulk upload functionality
  - Workspace export (placeholder)
  - Progress tracking for operations

## Performance Optimizations

### Virtual Scrolling
- Uses react-window for efficient rendering of large file lists
- Only renders visible items plus a small buffer
- Handles thousands of files without performance degradation

### Caching
- File preview caching reduces redundant file reads
- Search history and favorites stored in localStorage
- Operation history persisted across sessions

### Lazy Loading
- Directory contents loaded on-demand
- File previews generated only when requested
- Search results paginated and filtered efficiently

## File Operation Features

### Drag and Drop
- Multi-file selection and dragging
- Visual drag preview with item count
- Drop zone highlighting
- External file import from OS
- Batch operations support

### Search and Filtering
- Real-time search with debouncing
- Advanced filtering options
- Search suggestions and history
- Saved search templates
- Regular expression support

### Favorites and Bookmarks
- Quick access to frequently used files
- Grouping and categorization
- Usage statistics tracking
- Persistent across sessions

### Undo/Redo System
- Comprehensive operation tracking
- Reversible file operations
- Visual operation history
- Persistent undo stack

## Integration

The enhanced file manager integrates with the existing Redux store and file system APIs. It maintains backward compatibility while providing significant performance and usability improvements.

### Usage Example

```tsx
import { FileManager } from './file-tree/FileManager';

// Use the enhanced file manager
<FileManager />
```

The FileManager component automatically detects the best rendering mode based on the number of files and user preferences.

## Testing

Comprehensive test suite included covering:
- Component rendering
- User interactions
- State management
- Error handling
- Performance scenarios

Run tests with:
```bash
npm test -- --testPathPattern="EnhancedFileManager"
```

## Future Enhancements

- Cloud storage integration
- Real-time collaboration indicators
- Advanced file type previews (PDF, video, audio)
- Keyboard navigation improvements
- Accessibility enhancements
- Plugin system for custom file operations