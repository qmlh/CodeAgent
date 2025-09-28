/**
 * Resolution Suggestions Panel
 * Displays AI-generated suggestions for conflict resolution
 */

import React, { useEffect } from 'react';
import { Card, Button, List, Progress, Typography, Space, Tag, Empty, Spin } from 'antd';
import { 
  BulbOutlined, 
  CheckOutlined, 
  EyeOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import { generateResolutionSuggestions } from '../../store/slices/conflictSlice';
import { ResolutionSuggestion } from '../../types/conflict';
import './ResolutionSuggestionsPanel.css';

const { Text, Paragraph } = Typography;

interface ResolutionSuggestionsPanelProps {
  conflictId: string;
  suggestions: ResolutionSuggestion[];
  onApplySuggestion: (suggestion: ResolutionSuggestion) => void;
}

export const ResolutionSuggestionsPanel: React.FC<ResolutionSuggestionsPanelProps> = ({
  conflictId,
  suggestions,
  onApplySuggestion
}) => {
  const dispatch = useDispatch();
  const [isGenerating, setIsGenerating] = React.useState(false);

  useEffect(() => {
    if (suggestions.length === 0 && !isGenerating) {
      setIsGenerating(true);
      (dispatch as any)(generateResolutionSuggestions(conflictId))
        .finally(() => setIsGenerating(false));
    }
  }, [conflictId, suggestions.length, dispatch, isGenerating]);

  const getSuggestionIcon = (type: ResolutionSuggestion['type']) => {
    switch (type) {
      case 'auto_merge':
        return <RobotOutlined />;
      case 'accept_local':
        return <SafetyOutlined />;
      case 'accept_remote':
        return <ThunderboltOutlined />;
      case 'manual_edit':
        return <BulbOutlined />;
      default:
        return <BulbOutlined />;
    }
  };

  const getSuggestionColor = (confidence: number) => {
    if (confidence >= 0.8) return 'green';
    if (confidence >= 0.6) return 'orange';
    return 'red';
  };

  const getSuggestionTypeLabel = (type: ResolutionSuggestion['type']) => {
    switch (type) {
      case 'auto_merge':
        return 'Auto Merge';
      case 'accept_local':
        return 'Accept Local';
      case 'accept_remote':
        return 'Accept Remote';
      case 'manual_edit':
        return 'Manual Edit';
      default:
        return 'Unknown';
    }
  };

  const handleRefreshSuggestions = () => {
    setIsGenerating(true);
    (dispatch as any)(generateResolutionSuggestions(conflictId))
      .finally(() => setIsGenerating(false));
  };

  if (isGenerating) {
    return (
      <div className="suggestions-loading">
        <Spin size="large" />
        <Text>Generating resolution suggestions...</Text>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="suggestions-empty">
        <Empty
          image={<BulbOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
          description="No suggestions available"
        >
          <Button type="primary" onClick={handleRefreshSuggestions}>
            Generate Suggestions
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <div className="resolution-suggestions-panel">
      <div className="suggestions-header">
        <Space>
          <BulbOutlined />
          <Text strong>Resolution Suggestions</Text>
        </Space>
        <Button  onClick={handleRefreshSuggestions}>
          Refresh
        </Button>
      </div>

      <List
        className="suggestions-list"
        dataSource={suggestions.sort((a, b) => b.confidence - a.confidence)}
        renderItem={(suggestion) => (
          <List.Item className="suggestion-item">
            <Card
              
              className={`suggestion-card confidence-${getSuggestionColor(suggestion.confidence)}`}
              title={
                <div className="suggestion-title">
                  <Space>
                    {getSuggestionIcon(suggestion.type)}
                    <Text strong>{getSuggestionTypeLabel(suggestion.type)}</Text>
                    <Tag color={getSuggestionColor(suggestion.confidence)}>
                      {Math.round(suggestion.confidence * 100)}%
                    </Tag>
                  </Space>
                </div>
              }
              extra={
                <Space>
                  {suggestion.preview && (
                    <Button 
                       
                      icon={<EyeOutlined />}
                      onClick={() => {
                        // Show preview modal
                      }}
                    >
                      Preview
                    </Button>
                  )}
                  <Button 
                    type="primary" 
                    
                    icon={<CheckOutlined />}
                    onClick={() => onApplySuggestion(suggestion)}
                  >
                    Apply
                  </Button>
                </Space>
              }
            >
              <div className="suggestion-content">
                <Paragraph className="suggestion-description">
                  {suggestion.description}
                </Paragraph>
                
                <div className="suggestion-confidence">
                  <Text type="secondary">Confidence:</Text>
                  <Progress 
                    percent={Math.round(suggestion.confidence * 100)} 
                    
                    strokeColor={getSuggestionColor(suggestion.confidence)}
                    showInfo={false}
                  />
                </div>
                
                <div className="suggestion-reasoning">
                  <Text type="secondary" className="reasoning-label">Reasoning:</Text>
                  <Paragraph type="secondary" className="reasoning-text">
                    {suggestion.reasoning}
                  </Paragraph>
                </div>
              </div>
            </Card>
          </List.Item>
        )}
      />

      <div className="suggestions-footer">
        <Text type="secondary" style={{ fontSize: 12 }}>
          Suggestions are generated based on code analysis and conflict patterns.
          Always review before applying.
        </Text>
      </div>
    </div>
  );
};