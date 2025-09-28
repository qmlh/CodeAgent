/**
 * Appearance Settings Component
 * Theme, color, and visual appearance settings
 */

import React from 'react';
import { Card, Switch, Slider, Select, Space, Button, Divider } from 'antd';
import { EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../../../hooks/redux';
import { 
  setThemeMode, 
  setFontSize, 
  setFontFamily, 
  setLineHeight,
  setThemePreferences,
  toggleHighContrast,
  resetTheme,
  ThemeMode 
} from '../../../store/slices/themeSlice';

const AppearanceSettings: React.FC = () => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(state => state.theme);

  const handleThemeModeChange = (mode: ThemeMode) => {
    dispatch(setThemeMode(mode));
  };

  const handleFontSizeChange = (size: number) => {
    dispatch(setFontSize(size));
  };

  const handleFontFamilyChange = (family: string) => {
    dispatch(setFontFamily(family));
  };

  const handleLineHeightChange = (height: number) => {
    dispatch(setLineHeight(height));
  };

  const handlePreferenceChange = (key: string, value: boolean) => {
    dispatch(setThemePreferences({ [key]: value }));
  };

  const handleResetTheme = () => {
    dispatch(resetTheme());
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Card title="主题设置" >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <label>主题模式:</label>
            <Select
              value={theme.mode}
              onChange={handleThemeModeChange}
              style={{ width: '100%', marginTop: 8 }}
            >
              <Select.Option value="light">浅色</Select.Option>
              <Select.Option value="dark">深色</Select.Option>
              <Select.Option value="auto">跟随系统</Select.Option>
            </Select>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>高对比度模式:</span>
            <Switch
              checked={theme.preferences.highContrast}
              onChange={() => dispatch(toggleHighContrast())}
            />
          </div>

          <div>
            <label>当前主题: {theme.current === 'dark' ? '深色' : '浅色'}</label>
            <div style={{ marginTop: 8, padding: 12, borderRadius: 4, background: 'var(--bg-secondary)' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ width: 16, height: 16, background: 'var(--bg-primary)', borderRadius: 2, border: '1px solid var(--border-color)' }} />
                <div style={{ width: 16, height: 16, background: 'var(--bg-secondary)', borderRadius: 2, border: '1px solid var(--border-color)' }} />
                <div style={{ width: 16, height: 16, background: 'var(--accent-color)', borderRadius: 2 }} />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>主题预览</span>
              </div>
            </div>
          </div>
        </Space>
      </Card>

      <Card title="字体设置" >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <label>字体大小: {theme.fontSize}px</label>
            <Slider
              min={8}
              max={24}
              value={theme.fontSize}
              onChange={handleFontSizeChange}
              style={{ marginTop: 8 }}
            />
          </div>
          
          <div>
            <label>字体�?</label>
            <Select
              value={theme.fontFamily}
              onChange={handleFontFamilyChange}
              style={{ width: '100%', marginTop: 8 }}
            >
              <Select.Option value="JetBrains Mono, Monaco, Consolas, monospace">JetBrains Mono</Select.Option>
              <Select.Option value="Monaco, Menlo, monospace">Monaco</Select.Option>
              <Select.Option value="Consolas, Monaco, monospace">Consolas</Select.Option>
              <Select.Option value="'Courier New', monospace">Courier New</Select.Option>
              <Select.Option value="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif">系统默认</Select.Option>
            </Select>
          </div>
          
          <div>
            <label>行高: {theme.lineHeight}</label>
            <Slider
              min={1.0}
              max={2.5}
              step={0.1}
              value={theme.lineHeight}
              onChange={handleLineHeightChange}
              style={{ marginTop: 8 }}
            />
          </div>

          <div style={{ marginTop: 12, padding: 12, background: 'var(--bg-secondary)', borderRadius: 4 }}>
            <div style={{ 
              fontFamily: theme.fontFamily, 
              fontSize: theme.fontSize, 
              lineHeight: theme.lineHeight,
              color: 'var(--text-primary)'
            }}>
              字体预览 Font Preview 123
            </div>
          </div>
        </Space>
      </Card>

      <Card title="动画设置" >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>启用动画</span>
            <Switch
              checked={theme.preferences.enableAnimations}
              onChange={(checked) => handlePreferenceChange('enableAnimations', checked)}
            />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>启用过渡效果</span>
            <Switch
              checked={theme.preferences.enableTransitions}
              onChange={(checked) => handlePreferenceChange('enableTransitions', checked)}
            />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>减少动效</span>
            <Switch
              checked={theme.preferences.reducedMotion}
              onChange={(checked) => handlePreferenceChange('reducedMotion', checked)}
            />
          </div>
        </Space>
      </Card>

      <Card title="操作" >
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleResetTheme}>
            重置主题
          </Button>
        </Space>
      </Card>
    </Space>
  );
};

export default AppearanceSettings;