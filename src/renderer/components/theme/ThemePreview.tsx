/**
 * Theme Preview Component
 * Provides real-time theme preview and custom theme editing
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Slider, ColorPicker, Input, Space, Divider, Switch, Tooltip } from 'antd';
import { 
  BgColorsOutlined, 
  EyeOutlined, 
  SaveOutlined, 
  ReloadOutlined,
  SunOutlined,
  MoonOutlined,
  HighlightOutlined,
  FontSizeOutlined
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { 
  setThemeMode, 
  setCustomColor, 
  setCustomColors, 
  setFontSize, 
  setFontFamily, 
  setLineHeight,
  setThemePreferences,
  toggleHighContrast,
  resetTheme,
  ThemeMode
} from '../../store/slices/themeSlice';

interface ThemePreviewProps {
  visible?: boolean;
  onClose?: () => void;
}

interface CustomTheme {
  name: string;
  colors: Record<string, string>;
  typography: {
    fontSize: number;
    fontFamily: string;
    lineHeight: number;
  };
  preferences: {
    enableAnimations: boolean;
    enableTransitions: boolean;
    reducedMotion: boolean;
    highContrast: boolean;
  };
}

const defaultThemes: Record<string, CustomTheme> = {
  'vs-code-dark': {
    name: 'VS Code Dark',
    colors: {
      'bg-primary': '#1e1e1e',
      'bg-secondary': '#252526',
      'bg-tertiary': '#2d2d30',
      'border-color': '#3e3e42',
      'text-primary': '#cccccc',
      'text-secondary': '#888888',
      'accent-color': '#007acc'
    },
    typography: { fontSize: 14, fontFamily: 'Consolas, Monaco, monospace', lineHeight: 1.5 },
    preferences: { enableAnimations: true, enableTransitions: true, reducedMotion: false, highContrast: false }
  },
  'github-dark': {
    name: 'GitHub Dark',
    colors: {
      'bg-primary': '#0d1117',
      'bg-secondary': '#161b22',
      'bg-tertiary': '#21262d',
      'border-color': '#30363d',
      'text-primary': '#f0f6fc',
      'text-secondary': '#8b949e',
      'accent-color': '#58a6ff'
    },
    typography: { fontSize: 14, fontFamily: 'SFMono-Regular, Consolas, monospace', lineHeight: 1.5 },
    preferences: { enableAnimations: true, enableTransitions: true, reducedMotion: false, highContrast: false }
  },
  'monokai': {
    name: 'Monokai',
    colors: {
      'bg-primary': '#272822',
      'bg-secondary': '#3e3d32',
      'bg-tertiary': '#49483e',
      'border-color': '#75715e',
      'text-primary': '#f8f8f2',
      'text-secondary': '#75715e',
      'accent-color': '#a6e22e'
    },
    typography: { fontSize: 14, fontFamily: 'Monaco, Menlo, monospace', lineHeight: 1.5 },
    preferences: { enableAnimations: true, enableTransitions: true, reducedMotion: false, highContrast: false }
  }
};

export const ThemePreview: React.FC<ThemePreviewProps> = ({ visible = true, onClose }) => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(state => state.theme);
  const [previewTheme, setPreviewTheme] = useState<CustomTheme | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [customThemeName, setCustomThemeName] = useState('Custom Theme');

  useEffect(() => {
    // Initialize preview theme from current theme
    setPreviewTheme({
      name: 'Current Theme',
      colors: theme.customColors,
      typography: {
        fontSize: theme.fontSize,
        fontFamily: theme.fontFamily,
        lineHeight: theme.lineHeight
      },
      preferences: theme.preferences
    });
  }, [theme]);

  const handleThemeModeChange = (mode: ThemeMode) => {
    dispatch(setThemeMode(mode));
  };

  const handleColorChange = (colorKey: string, color: string) => {
    if (previewTheme) {
      const updatedTheme = {
        ...previewTheme,
        colors: { ...previewTheme.colors, [colorKey]: color }
      };
      setPreviewTheme(updatedTheme);
      
      // Apply preview immediately
      dispatch(setCustomColor({ key: colorKey, value: color }));
    }
  };

  const handleTypographyChange = (key: keyof CustomTheme['typography'], value: any) => {
    if (previewTheme) {
      const updatedTheme = {
        ...previewTheme,
        typography: { ...previewTheme.typography, [key]: value }
      };
      setPreviewTheme(updatedTheme);
      
      // Apply changes immediately
      switch (key) {
        case 'fontSize':
          dispatch(setFontSize(value));
          break;
        case 'fontFamily':
          dispatch(setFontFamily(value));
          break;
        case 'lineHeight':
          dispatch(setLineHeight(value));
          break;
      }
    }
  };

  const handlePreferenceChange = (key: keyof CustomTheme['preferences'], value: boolean) => {
    if (previewTheme) {
      const updatedTheme = {
        ...previewTheme,
        preferences: { ...previewTheme.preferences, [key]: value }
      };
      setPreviewTheme(updatedTheme);
      
      // Apply changes immediately
      dispatch(setThemePreferences({ [key]: value }));
    }
  };

  const handleApplyTheme = (themeKey: string) => {
    const selectedTheme = defaultThemes[themeKey];
    if (selectedTheme) {
      dispatch(setCustomColors(selectedTheme.colors));
      dispatch(setFontSize(selectedTheme.typography.fontSize));
      dispatch(setFontFamily(selectedTheme.typography.fontFamily));
      dispatch(setLineHeight(selectedTheme.typography.lineHeight));
      dispatch(setThemePreferences(selectedTheme.preferences));
      setPreviewTheme(selectedTheme);
    }
  };

  const handleSaveCustomTheme = () => {
    if (previewTheme) {
      // Save to localStorage for persistence
      const customThemes = JSON.parse(localStorage.getItem('customThemes') || '{}');
      customThemes[customThemeName] = previewTheme;
      localStorage.setItem('customThemes', JSON.stringify(customThemes));
      
      setIsEditing(false);
    }
  };

  const handleResetTheme = () => {
    dispatch(resetTheme());
    setPreviewTheme(null);
  };

  if (!visible) return null;

  return (
    <div className="theme-preview-container" style={{ padding: '16px', maxHeight: '80vh', overflowY: 'auto' }}>
      {/* Theme Mode Selection */}
      <Card title="主题模式" size="small" style={{ marginBottom: '16px' }}>
        <Space>
          <Button
            type={theme.mode === 'light' ? 'primary' : 'default'}
            icon={<SunOutlined />}
            onClick={() => handleThemeModeChange('light')}
          >
            浅色
          </Button>
          <Button
            type={theme.mode === 'dark' ? 'primary' : 'default'}
            icon={<MoonOutlined />}
            onClick={() => handleThemeModeChange('dark')}
          >
            深色
          </Button>
          <Button
            type={theme.mode === 'auto' ? 'primary' : 'default'}
            icon={<EyeOutlined />}
            onClick={() => handleThemeModeChange('auto')}
          >
            自动
          </Button>
        </Space>
      </Card>

      {/* Preset Themes */}
      <Card title="预设主题" size="small" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
          {Object.entries(defaultThemes).map(([key, themeData]) => (
            <Card
              key={key}
              size="small"
              hoverable
              onClick={() => handleApplyTheme(key)}
              style={{
                cursor: 'pointer',
                background: themeData.colors['bg-primary'],
                border: `1px solid ${themeData.colors['border-color']}`,
                color: themeData.colors['text-primary']
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', marginBottom: '4px' }}>{themeData.name}</div>
                <div style={{ display: 'flex', gap: '2px', justifyContent: 'center' }}>
                  {Object.values(themeData.colors || {}).slice(0, 5).map((color, index) => (
                    <div
                      key={index}
                      style={{
                        width: '16px',
                        height: '16px',
                        background: color,
                        borderRadius: '2px',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}
                    />
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Custom Theme Editor */}
      <Card 
        title="自定义主题" 
        size="small"
        style={{ marginBottom: '16px' }}
        extra={
          <Space>
            <Switch
              checked={isEditing}
              onChange={setIsEditing}
              checkedChildren="编辑"
              unCheckedChildren="预览"
            />
            {isEditing && (
              <Button
                type="primary"
                size="small"
                icon={<SaveOutlined />}
                onClick={handleSaveCustomTheme}
              >
                保存
              </Button>
            )}
          </Space>
        }
      >
        {isEditing && (
          <>
            <div style={{ marginBottom: '16px' }}>
              <Input
                placeholder="主题名称"
                value={customThemeName}
                onChange={(e) => setCustomThemeName(e.target.value)}
                style={{ marginBottom: '8px' }}
              />
            </div>

            {/* Color Customization */}
            <Divider orientation="left" style={{ fontSize: '12px' }}>颜色配置</Divider>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              {previewTheme && Object.entries(previewTheme.colors).map(([key, value]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', minWidth: '80px' }}>
                    {key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                  </span>
                  <ColorPicker
                    value={value}
                    onChange={(color) => handleColorChange(key, color.toHexString())}
                    size="small"
                  />
                  <Input
                    value={value}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    size="small"
                    style={{ width: '80px', fontSize: '11px' }}
                  />
                </div>
              ))}
            </div>

            {/* Typography Settings */}
            <Divider orientation="left" style={{ fontSize: '12px' }}>字体设置</Divider>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>字体大小: {previewTheme?.typography.fontSize}px</span>
                <Slider
                  min={8}
                  max={24}
                  value={previewTheme?.typography.fontSize}
                  onChange={(value) => handleTypographyChange('fontSize', value)}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>字体族</span>
                <Input
                  value={previewTheme?.typography.fontFamily}
                  onChange={(e) => handleTypographyChange('fontFamily', e.target.value)}
                  placeholder="字体族"
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>行高: {previewTheme?.typography.lineHeight}</span>
                <Slider
                  min={1.0}
                  max={2.5}
                  step={0.1}
                  value={previewTheme?.typography.lineHeight}
                  onChange={(value) => handleTypographyChange('lineHeight', value)}
                />
              </div>
            </div>

            {/* Accessibility & Preferences */}
            <Divider orientation="left" style={{ fontSize: '12px' }}>无障碍设置</Divider>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px' }}>启用动画</span>
                <Switch
                  size="small"
                  checked={previewTheme?.preferences.enableAnimations}
                  onChange={(checked) => handlePreferenceChange('enableAnimations', checked)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px' }}>启用过渡</span>
                <Switch
                  size="small"
                  checked={previewTheme?.preferences.enableTransitions}
                  onChange={(checked) => handlePreferenceChange('enableTransitions', checked)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px' }}>减少动效</span>
                <Switch
                  size="small"
                  checked={previewTheme?.preferences.reducedMotion}
                  onChange={(checked) => handlePreferenceChange('reducedMotion', checked)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Tooltip title="高对比度模式，提高可读性">
                  <span style={{ fontSize: '12px' }}>高对比度</span>
                </Tooltip>
                <Switch
                  size="small"
                  checked={previewTheme?.preferences.highContrast}
                  onChange={(checked) => handlePreferenceChange('highContrast', checked)}
                />
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Theme Actions */}
      <Card size="small">
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleResetTheme}>
            重置主题
          </Button>
          <Button 
            type="primary" 
            icon={<HighlightOutlined />} 
            onClick={() => dispatch(toggleHighContrast())}
          >
            切换高对比度
          </Button>
        </Space>
      </Card>

      {/* Live Preview */}
      <Card title="实时预览" size="small" style={{ marginTop: '16px' }}>
        <div 
          style={{
            background: previewTheme?.colors['bg-primary'] || 'var(--bg-primary)',
            color: previewTheme?.colors['text-primary'] || 'var(--text-primary)',
            padding: '16px',
            borderRadius: '4px',
            border: `1px solid ${previewTheme?.colors['border-color'] || 'var(--border-color)'}`,
            fontFamily: previewTheme?.typography.fontFamily || theme.fontFamily,
            fontSize: `${previewTheme?.typography.fontSize || theme.fontSize}px`,
            lineHeight: previewTheme?.typography.lineHeight || theme.lineHeight
          }}
        >
          <h4 style={{ color: previewTheme?.colors['accent-color'] || 'var(--accent-color)', margin: '0 0 8px 0' }}>
            Multi-Agent IDE
          </h4>
          <p style={{ color: previewTheme?.colors['text-secondary'] || 'var(--text-secondary)', margin: '0 0 8px 0', fontSize: '12px' }}>
            这是主题预览示例文本。您可以看到当前主题的颜色和字体设置效果。
          </p>
          <div style={{ 
            background: previewTheme?.colors['bg-secondary'] || 'var(--bg-secondary)', 
            padding: '8px', 
            borderRadius: '2px',
            fontFamily: 'monospace',
            fontSize: '11px'
          }}>
            <span style={{ color: previewTheme?.colors['accent-color'] || 'var(--accent-color)' }}>function</span>{' '}
            <span style={{ color: previewTheme?.colors['text-primary'] || 'var(--text-primary)' }}>example</span>() {'{'}
            <br />
            &nbsp;&nbsp;<span style={{ color: previewTheme?.colors['text-secondary'] || 'var(--text-secondary)' }}>// 代码示例</span>
            <br />
            &nbsp;&nbsp;<span style={{ color: previewTheme?.colors['accent-color'] || 'var(--accent-color)' }}>return</span>{' '}
            <span style={{ color: '#a6e22e' }}>'Hello World'</span>;
            <br />
            {'}'}
          </div>
        </div>
      </Card>
    </div>
  );
};