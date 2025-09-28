/**
 * Search Panel Component
 * Global search functionality for files and content
 */

import React, { useState } from 'react';
import { 
  Input, 
  List, 
  Button, 
  Checkbox, 
  Collapse, 
  Tag, 
  Space,
  Empty
} from 'antd';
import { 
  SearchOutlined, 
  FileOutlined, 
  SettingOutlined,
  ClearOutlined
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { searchFiles, openFile } from '../../store/slices/fileSlice';

const { Search } = Input;
const { Panel } = Collapse;

interface SearchResult {
  id: string;
  type: 'file' | 'content';
  filePath: string;
  fileName: string;
  line?: number;
  column?: number;
  content?: string;
  context?: string;
  matches: number;
}

export const SearchPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const { currentWorkspace, searchResults: fileSearchResults, status } = useAppSelector(state => state.file);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchOptions, setSearchOptions] = useState({
    caseSensitive: false,
    wholeWord: false,
    useRegex: false,
    includeFiles: true,
    includeContent: true,
    excludeNodeModules: true,
    excludeGitIgnored: true
  });

  const handleSearch = async (value: string) => {
    if (!value.trim() || !currentWorkspace) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setSearchTerm(value);

    try {
      // Use the file system search functionality
      await dispatch(searchFiles({
        query: value,
        includeContent: searchOptions.includeContent,
        fileExtensions: []
      })).unwrap();
      
      // Convert file search results to our format
      const convertedResults: SearchResult[] = fileSearchResults.map((result, index) => ({
        id: `${index}`,
        type: result.matches && result.matches.length > 0 ? 'content' : 'file',
        filePath: result.path,
        fileName: result.name,
        matches: result.matches ? result.matches.length : 1,
        ...(result.matches && result.matches.length > 0 && {
          line: result.matches[0].line,
          content: result.matches[0].content
        })
      }));
      
      setSearchResults(convertedResults);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = async (result: SearchResult) => {
    try {
      await dispatch(openFile(result.filePath)).unwrap();
      // TODO: Navigate to specific line/column if available
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
  };

  const renderSearchResult = (result: SearchResult) => {
    const isFileResult = result.type === 'file';
    
    return (
      <List.Item
        className="search-result-item"
        onClick={() => handleResultClick(result)}
      >
        <List.Item.Meta
          avatar={isFileResult ? <FileOutlined /> : <SearchOutlined />}
          title={
            <div className="search-result-title">
              <span className="result-filename">{result.fileName}</span>
              {!isFileResult && result.line && (
                <span className="result-location">:{result.line}:{result.column}</span>
              )}
              <Tag>{result.matches} match{result.matches > 1 ? 'es' : ''}</Tag>
            </div>
          }
          description={
            <div className="search-result-description">
              <div className="result-path">{result.filePath}</div>
              {result.content && (
                <div className="result-content">
                  <code>{result.content}</code>
                </div>
              )}
              {result.context && (
                <div className="result-context">{result.context}</div>
              )}
            </div>
          }
        />
      </List.Item>
    );
  };

  const groupedResults = searchResults.reduce((groups, result) => {
    const key = result.filePath;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(result);
    return groups;
  }, {} as Record<string, SearchResult[]>);

  return (
    <div className="search-panel">
      {/* Panel Header */}
      <div className="panel-header">
        <div className="panel-title">Search</div>
      </div>

      {/* Search Input */}
      <div className="search-input-container">
        <Search
          placeholder="Search files and content..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onSearch={handleSearch}
          loading={isSearching}
          enterButton={<SearchOutlined />}
          suffix={
            searchTerm && (
              <Button 
                type="text" 
                 
                icon={<ClearOutlined />}
                onClick={handleClearSearch}
              />
            )
          }
        />
      </div>

      {/* Search Options */}
      <Collapse ghost  className="search-options">
        <Panel 
          header={
            <Space>
              <SettingOutlined />
              <span>Search Options</span>
            </Space>
          } 
          key="options"
        >
          <div className="search-option-group">
            <Checkbox
              checked={searchOptions.caseSensitive}
              onChange={(e) => setSearchOptions(prev => ({ 
                ...prev, 
                caseSensitive: e.target.checked 
              }))}
            >
              Case Sensitive
            </Checkbox>
            
            <Checkbox
              checked={searchOptions.wholeWord}
              onChange={(e) => setSearchOptions(prev => ({ 
                ...prev, 
                wholeWord: e.target.checked 
              }))}
            >
              Whole Word
            </Checkbox>
            
            <Checkbox
              checked={searchOptions.useRegex}
              onChange={(e) => setSearchOptions(prev => ({ 
                ...prev, 
                useRegex: e.target.checked 
              }))}
            >
              Use Regex
            </Checkbox>
          </div>
          
          <div className="search-option-group">
            <Checkbox
              checked={searchOptions.includeFiles}
              onChange={(e) => setSearchOptions(prev => ({ 
                ...prev, 
                includeFiles: e.target.checked 
              }))}
            >
              Include Files
            </Checkbox>
            
            <Checkbox
              checked={searchOptions.includeContent}
              onChange={(e) => setSearchOptions(prev => ({ 
                ...prev, 
                includeContent: e.target.checked 
              }))}
            >
              Include Content
            </Checkbox>
          </div>
          
          <div className="search-option-group">
            <Checkbox
              checked={searchOptions.excludeNodeModules}
              onChange={(e) => setSearchOptions(prev => ({ 
                ...prev, 
                excludeNodeModules: e.target.checked 
              }))}
            >
              Exclude node_modules
            </Checkbox>
            
            <Checkbox
              checked={searchOptions.excludeGitIgnored}
              onChange={(e) => setSearchOptions(prev => ({ 
                ...prev, 
                excludeGitIgnored: e.target.checked 
              }))}
            >
              Exclude .gitignore files
            </Checkbox>
          </div>
        </Panel>
      </Collapse>

      {/* Search Results */}
      <div className="panel-content">
        {searchResults.length === 0 && searchTerm && !isSearching && (
          <Empty 
            description="No results found"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
        
        {searchResults.length === 0 && !searchTerm && (
          <Empty 
            description="Enter search term to find files and content"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}

        {searchResults.length > 0 && (
          <div className="search-results">
            <div className="search-results-header">
              <span>{searchResults.length} result{searchResults.length > 1 ? 's' : ''}</span>
              {currentWorkspace && (
                <span className="search-scope">in {currentWorkspace.split('/').pop()}</span>
              )}
            </div>
            
            <Collapse ghost className="search-results-collapse">
              {Object.entries(groupedResults).map(([filePath, results]) => (
                <Panel
                  key={filePath}
                  header={
                    <div className="search-file-header">
                      <FileOutlined />
                      <span className="file-name">{filePath.split('/').pop()}</span>
                      <span className="file-path">{filePath}</span>
                      <Tag>{results.length}</Tag>
                    </div>
                  }
                >
                  <List
                    
                    dataSource={results}
                    renderItem={renderSearchResult}
                  />
                </Panel>
              ))}
            </Collapse>
          </div>
        )}
      </div>
    </div>
  );
};