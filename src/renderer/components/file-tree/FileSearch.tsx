/**
 * File Search Component
 * Advanced file search with filters and content search
 */

import React, { useState, useEffect } from 'react';
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
  Spin
} from 'antd';
import { 
  SearchOutlined, 
  FileOutlined, 
  FolderOutlined,
  FilterOutlined,
  ClearOutlined
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { searchFiles, clearSearchResults } from '../../store/slices/fileSlice';

const { Search } = Input;
const { Option } = Select;
const { Text } = Typography;
const { Panel } = Collapse;

interface SearchResult {
  path: string;
  name: string;
  matches?: Array<{ line: number; content: string }>;
}

export const FileSearch: React.FC = () => {
  const dispatch = useAppDispatch();
  const { currentWorkspace, searchResults, status } = useAppSelector(state => state.file);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [includeContent, setIncludeContent] = useState(false);
  const [selectedExtensions, setSelectedExtensions] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const commonExtensions = [
    { label: 'JavaScript', value: '.js' },
    { label: 'TypeScript', value: '.ts' },
    { label: 'React JSX', value: '.jsx' },
    { label: 'React TSX', value: '.tsx' },
    { label: 'Python', value: '.py' },
    { label: 'Java', value: '.java' },
    { label: 'C++', value: '.cpp' },
    { label: 'C', value: '.c' },
    { label: 'C#', value: '.cs' },
    { label: 'HTML', value: '.html' },
    { label: 'CSS', value: '.css' },
    { label: 'JSON', value: '.json' },
    { label: 'Markdown', value: '.md' },
    { label: 'Text', value: '.txt' },
  ];

  const handleSearch = async () => {
    if (!searchQuery.trim() || !currentWorkspace) return;

    try {
      await dispatch(searchFiles({
        query: searchQuery.trim(),
        includeContent,
        fileExtensions: selectedExtensions
      })).unwrap();
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    dispatch(clearSearchResults());
  };

  const handleFileClick = async (filePath: string) => {
    try {
      // Open file in editor
      await window.electronAPI?.fs.readFile(filePath);
      // You might want to dispatch an action to open the file in the editor
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  };

  const renderSearchResult = (result: SearchResult) => {
    const isDirectory = result.path.endsWith('/');
    
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
            </div>
          }
          description={
            <div>
              <Text type="secondary" style={{ fontSize: '11px' }}>
                {result.path}
              </Text>
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
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Search Input */}
      <div style={{ padding: '12px', borderBottom: '1px solid #333' }}>
        <Search
          placeholder="Search files and content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onSearch={handleSearch}
          enterButton={<SearchOutlined />}
          size="small"
          disabled={!currentWorkspace}
        />
        
        <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Button
            size="small"
            icon={<FilterOutlined />}
            onClick={() => setShowFilters(!showFilters)}
            type={showFilters ? 'primary' : 'default'}
          >
            Filters
          </Button>
          
          {searchResults.length > 0 && (
            <Button
              size="small"
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

      {/* Filters */}
      {showFilters && (
        <div style={{ padding: '12px', borderBottom: '1px solid #333', backgroundColor: '#2a2a2a' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Checkbox
              checked={includeContent}
              onChange={(e) => setIncludeContent(e.target.checked)}
            >
              <Text style={{ fontSize: '12px' }}>Search file content</Text>
            </Checkbox>
            
            <div>
              <Text style={{ fontSize: '12px', marginBottom: '4px', display: 'block' }}>
                File types:
              </Text>
              <Select
                mode="multiple"
                placeholder="Select file extensions"
                value={selectedExtensions}
                onChange={setSelectedExtensions}
                style={{ width: '100%' }}
                size="small"
                maxTagCount={3}
              >
                {commonExtensions.map(ext => (
                  <Option key={ext.value} value={ext.value}>
                    {ext.label} ({ext.value})
                  </Option>
                ))}
              </Select>
            </div>
          </Space>
        </div>
      )}

      {/* Search Results */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {!currentWorkspace ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
            <Text type="secondary">Open a workspace to search files</Text>
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
            <Text type="secondary">No results found for "{searchQuery}"</Text>
          </div>
        ) : searchResults.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
            <Text type="secondary">Enter a search query to find files</Text>
          </div>
        ) : (
          <List
            size="small"
            dataSource={searchResults}
            renderItem={renderSearchResult}
            style={{ padding: '4px' }}
          />
        )}
      </div>
    </div>
  );
};