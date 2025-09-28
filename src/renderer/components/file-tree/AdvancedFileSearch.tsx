/**
 * Advanced File Search Component
 * Enhanced search with suggestions, history, and advanced filters
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Input, 
  Button, 
  Checkbox, 
  Select, 
  Card, 
  List, 
  Typography, 
  Collapse,
  Tag,
  Space,
  Spin,
  AutoComplete,
  DatePicker,
  Slider,
  Tooltip,
  Empty
} from 'antd';
import { 
  SearchOutlined, 
  FileOutlined, 
  FolderOutlined,
  FilterOutlined,
  ClearOutlined,
  HistoryOutlined,
  StarOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { searchFiles, clearSearchResults } from '../../store/slices/fileSlice';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;
const { Text } = Typography;
const { Panel } = Collapse;
const { RangePicker } = DatePicker;

interface SearchResult {
  path: string;
  name: string;
  matches?: Array<{ line: number; content: string }>;
  size?: number;
  mtime?: Date;
  type: 'file' | 'directory';
}

interface SearchSuggestion {
  value: string;
  type: 'recent' | 'popular' | 'suggestion';
  count?: number;
}

interface SearchFilter {
  includeContent: boolean;
  fileExtensions: string[];
  sizeRange: [number, number];
  dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
  includeHidden: boolean;
  caseSensitive: boolean;
  useRegex: boolean;
}

const DEFAULT_FILTERS: SearchFilter = {
  includeContent: false,
  fileExtensions: [],
  sizeRange: [0, 1000], // MB
  dateRange: [null, null],
  includeHidden: false,
  caseSensitive: false,
  useRegex: false
};

export const AdvancedFileSearch: React.FC = () => {
  const dispatch = useAppDispatch();
  const { currentWorkspace, searchResults, status } = useAppSelector(state => state.file);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilter>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [savedSearches, setSavedSearches] = useState<Array<{
    name: string;
    query: string;
    filters: SearchFilter;
  }>>([]);

  const commonExtensions = [
    { label: 'JavaScript', value: '.js', color: 'gold' },
    { label: 'TypeScript', value: '.ts', color: 'blue' },
    { label: 'React JSX', value: '.jsx', color: 'cyan' },
    { label: 'React TSX', value: '.tsx', color: 'geekblue' },
    { label: 'Python', value: '.py', color: 'green' },
    { label: 'Java', value: '.java', color: 'orange' },
    { label: 'C++', value: '.cpp', color: 'red' },
    { label: 'C', value: '.c', color: 'volcano' },
    { label: 'C#', value: '.cs', color: 'purple' },
    { label: 'HTML', value: '.html', color: 'magenta' },
    { label: 'CSS', value: '.css', color: 'lime' },
    { label: 'JSON', value: '.json', color: 'yellow' },
    { label: 'Markdown', value: '.md', color: 'cyan' },
    { label: 'Text', value: '.txt', color: 'default' },
  ];

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('fileSearchHistory');
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch (e) {
        // Ignore invalid JSON
      }
    }

    const savedSearchesData = localStorage.getItem('savedFileSearches');
    if (savedSearchesData) {
      try {
        setSavedSearches(JSON.parse(savedSearchesData));
      } catch (e) {
        // Ignore invalid JSON
      }
    }
  }, []);

  // Generate search suggestions
  const generateSuggestions = useCallback((query: string): SearchSuggestion[] => {
    if (!query) return [];

    const suggestions: SearchSuggestion[] = [];

    // Recent searches
    const recentMatches = searchHistory
      .filter(h => h.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 3)
      .map(h => ({ value: h, type: 'recent' as const }));
    
    suggestions.push(...recentMatches);

    // File extension suggestions
    if (query.startsWith('.')) {
      const extMatches = commonExtensions
        .filter(ext => ext.value.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 3)
        .map(ext => ({ value: ext.value, type: 'suggestion' as const }));
      
      suggestions.push(...extMatches);
    }

    // Common search patterns
    const patterns = [
      'TODO',
      'FIXME',
      'console.log',
      'import',
      'export',
      'function',
      'class',
      'interface',
      'type'
    ];

    const patternMatches = patterns
      .filter(p => p.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 2)
      .map(p => ({ value: p, type: 'suggestion' as const }));

    suggestions.push(...patternMatches);

    return suggestions.slice(0, 8);
  }, [searchHistory]);

  // Update suggestions when query changes
  useEffect(() => {
    const suggestions = generateSuggestions(searchQuery);
    setSearchSuggestions(suggestions);
  }, [searchQuery, generateSuggestions]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || !currentWorkspace) return;

    try {
      await dispatch(searchFiles({
        query: searchQuery.trim(),
        includeContent: filters.includeContent,
        fileExtensions: filters.fileExtensions
      })).unwrap();

      // Add to search history
      const newHistory = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, 20);
      setSearchHistory(newHistory);
      localStorage.setItem('fileSearchHistory', JSON.stringify(newHistory));
    } catch (error) {
      console.error('Search failed:', error);
    }
  }, [searchQuery, currentWorkspace, filters, dispatch, searchHistory]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    dispatch(clearSearchResults());
  }, [dispatch]);

  const handleSaveSearch = useCallback(() => {
    if (!searchQuery.trim()) return;

    const name = prompt('Enter a name for this search:');
    if (!name) return;

    const newSavedSearch = {
      name,
      query: searchQuery,
      filters: { ...filters }
    };

    const newSavedSearches = [...savedSearches, newSavedSearch];
    setSavedSearches(newSavedSearches);
    localStorage.setItem('savedFileSearches', JSON.stringify(newSavedSearches));
  }, [searchQuery, filters, savedSearches]);

  const handleLoadSavedSearch = useCallback((savedSearch: typeof savedSearches[0]) => {
    setSearchQuery(savedSearch.query);
    setFilters(savedSearch.filters);
    setShowFilters(true);
  }, []);

  const handleFileClick = useCallback(async (filePath: string) => {
    try {
      // This would typically dispatch an action to open the file
      await window.electronAPI?.fs.readFile(filePath);
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  }, []);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const renderSearchResult = useCallback((result: SearchResult) => {
    const isDirectory = result.type === 'directory';
    
    return (
      <List.Item
        key={result.path}
        style={{ 
          cursor: 'pointer',
          padding: '8px 12px',
          borderRadius: '4px',
          margin: '2px 0'
        }}
        onClick={() => !isDirectory && handleFileClick(result.path)}
      >
        <List.Item.Meta
          avatar={
            isDirectory ? 
              <FolderOutlined style={{ color: '#dcb67a' }} /> : 
              <FileOutlined style={{ color: '#cccccc' }} />
          }
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Text style={{ color: '#cccccc', fontSize: '13px' }}>
                {result.name}
              </Text>
              {result.matches && result.matches.length > 0 && (
                <Tag color="blue">
                  {result.matches.length} match{result.matches.length > 1 ? 'es' : ''}
                </Tag>
              )}
              {result.size && (
                <Tag color="green">
                  {formatFileSize(result.size)}
                </Tag>
              )}
            </div>
          }
          description={
            <div>
              <Text type="secondary" style={{ fontSize: '11px' }}>
                {result.path}
              </Text>
              {result.mtime && (
                <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                  Modified: {new Date(result.mtime).toLocaleString()}
                </div>
              )}
              {result.matches && result.matches.length > 0 && (
                <div style={{ marginTop: '4px' }}>
                  {result.matches.slice(0, 3).map((match, index) => (
                    <div key={index} style={{ fontSize: '11px', color: '#888' }}>
                      <Text code style={{ fontSize: '10px' }}>
                        Line {match.line}:
                      </Text>{' '}
                      <Text style={{ fontSize: '11px' }}>
                        {match.content.length > 80 
                          ? match.content.substring(0, 80) + '...' 
                          : match.content
                        }
                      </Text>
                    </div>
                  ))}
                  {result.matches.length > 3 && (
                    <Text type="secondary" style={{ fontSize: '10px' }}>
                      ... and {result.matches.length - 3} more matches
                    </Text>
                  )}
                </div>
              )}
            </div>
          }
        />
      </List.Item>
    );
  }, [handleFileClick, formatFileSize]);

  const searchOptions = useMemo(() => {
    return searchSuggestions.map(suggestion => ({
      value: suggestion.value,
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {suggestion.type === 'recent' && <HistoryOutlined style={{ color: '#888' }} />}
          {suggestion.type === 'suggestion' && <SearchOutlined style={{ color: '#888' }} />}
          <span>{suggestion.value}</span>
          {suggestion.type === 'recent' && (
            <Tag  color="blue">Recent</Tag>
          )}
        </div>
      )
    }));
  }, [searchSuggestions]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Search Input */}
      <div style={{ padding: '12px', borderBottom: '1px solid #333' }}>
        <AutoComplete
          options={searchOptions}
          value={searchQuery}
          onChange={setSearchQuery}
          onSelect={setSearchQuery}
          style={{ width: '100%', marginBottom: '8px' }}
        >
          <Search
            placeholder="Search files and content..."
            onSearch={handleSearch}
            enterButton={<SearchOutlined />}
            
            disabled={!currentWorkspace}
          />
        </AutoComplete>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            
            icon={<FilterOutlined />}
            onClick={() => setShowFilters(!showFilters)}
            type={showFilters ? 'primary' : 'default'}
          >
            Filters
          </Button>
          
          {searchQuery && (
            <Button
              
              icon={<StarOutlined />}
              onClick={handleSaveSearch}
              title="Save Search"
            />
          )}
          
          {searchResults.length > 0 && (
            <Button
              
              icon={<ClearOutlined />}
              onClick={handleClearSearch}
            >
              Clear
            </Button>
          )}
          
          <Text type="secondary" style={{ fontSize: '11px', marginLeft: 'auto' }}>
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
          </Text>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div style={{ 
          padding: '12px', 
          borderBottom: '1px solid #333', 
          backgroundColor: '#2a2a2a',
          maxHeight: '300px',
          overflow: 'auto'
        }}>
          <Collapse  ghost>
            <Panel header="Search Options" key="options">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Checkbox
                  checked={filters.includeContent}
                  onChange={(e) => setFilters(prev => ({ ...prev, includeContent: e.target.checked }))}
                >
                  <Text style={{ fontSize: '12px' }}>Search file content</Text>
                </Checkbox>
                
                <Checkbox
                  checked={filters.includeHidden}
                  onChange={(e) => setFilters(prev => ({ ...prev, includeHidden: e.target.checked }))}
                >
                  <Text style={{ fontSize: '12px' }}>Include hidden files</Text>
                </Checkbox>
                
                <Checkbox
                  checked={filters.caseSensitive}
                  onChange={(e) => setFilters(prev => ({ ...prev, caseSensitive: e.target.checked }))}
                >
                  <Text style={{ fontSize: '12px' }}>Case sensitive</Text>
                </Checkbox>
                
                <Checkbox
                  checked={filters.useRegex}
                  onChange={(e) => setFilters(prev => ({ ...prev, useRegex: e.target.checked }))}
                >
                  <Text style={{ fontSize: '12px' }}>Use regular expressions</Text>
                </Checkbox>
              </Space>
            </Panel>
            
            <Panel header="File Types" key="types">
              <Select
                mode="multiple"
                placeholder="Select file extensions"
                value={filters.fileExtensions}
                onChange={(value) => setFilters(prev => ({ ...prev, fileExtensions: value }))}
                style={{ width: '100%' }}
                
                maxTagCount={3}
              >
                {commonExtensions.map(ext => (
                  <Option key={ext.value} value={ext.value}>
                    <Tag color={ext.color} >{ext.label}</Tag>
                    {ext.value}
                  </Option>
                ))}
              </Select>
            </Panel>
            
            <Panel header="File Size" key="size">
              <div>
                <Text style={{ fontSize: '12px', marginBottom: '8px', display: 'block' }}>
                  Size range (MB): {filters.sizeRange[0]} - {filters.sizeRange[1]}
                </Text>
                <Slider
                  range
                  min={0}
                  max={1000}
                  value={filters.sizeRange}
                  onChange={(value) => setFilters(prev => ({ ...prev, sizeRange: value as [number, number] }))}
                />
              </div>
            </Panel>
            
            <Panel header="Date Modified" key="date">
              <RangePicker
                value={filters.dateRange}
                onChange={(dates) => setFilters(prev => ({ ...prev, dateRange: dates || [null, null] }))}
                
                style={{ width: '100%' }}
              />
            </Panel>
          </Collapse>
        </div>
      )}

      {/* Saved Searches */}
      {savedSearches.length > 0 && (
        <div style={{ 
          padding: '8px 12px', 
          borderBottom: '1px solid #333',
          backgroundColor: '#1e1e1e'
        }}>
          <Text style={{ fontSize: '11px', color: '#888', marginBottom: '4px', display: 'block' }}>
            Saved Searches:
          </Text>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {savedSearches.map((saved, index) => (
              <Tooltip key={index} title={`Query: ${saved.query}`}>
                <Tag
                  
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleLoadSavedSearch(saved)}
                >
                  <ClockCircleOutlined style={{ marginRight: '4px' }} />
                  {saved.name}
                </Tag>
              </Tooltip>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {!currentWorkspace ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
            <Empty 
              description="Open a workspace to search files"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : status === 'loading' ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <Spin />
            <div style={{ marginTop: '8px' }}>
              <Text type="secondary">Searching...</Text>
            </div>
          </div>
        ) : searchResults.length === 0 && searchQuery ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
            <Empty 
              description={`No results found for "${searchQuery}"`}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : searchResults.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
            <Text type="secondary">Enter a search query to find files</Text>
          </div>
        ) : (
          <List
            
            dataSource={searchResults.map(result => ({ ...result, type: 'file' as const }))}
            renderItem={renderSearchResult}
            style={{ padding: '4px' }}
          />
        )}
      </div>
    </div>
  );
};