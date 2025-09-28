/**
 * Editor Personalization Component
 * Provides font configuration, themes, and shortcut customization
 */

import React, { useState, useCallback, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Select, 
  Slider, 
  Switch, 
  Button, 
  Input, 
  ColorPicker, 
  Tabs, 
  Space, 
  Divider,
  Modal,
  List,
  Tag,
  Tooltip,
  message,
  Upload,
  Typography
} from 'antd';
import { 
  FontSizeOutlined, 
  BgColorsOutlined, 
  SettingOutlined,
  KeyOutlined,
  ImportOutlined,
  ExportOutlined,
  ReloadOutlined,
  SaveOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import * as monaco from 'monaco-editor';

const { TextArea } = Input;
const { Text, Title } = Typography;

interface FontSettings {
  family: string;
  size: number;
  weight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  lineHeight: number;
  letterSpacing: number;
  ligatures: boolean;
}

interface ThemeSettings {
  name: string;
  base: 'vs' | 'vs-dark' | 'hc-black';
  colors: { [key: string]: string };
  tokenColors: { [key: string]: string };
  isCustom: boolean;
}

interface ShortcutBinding {
  command: string;
  key: string;
  when?: string;
  description: string;
  category: string;
}

interface EditorPersonalizationProps {
  onSettingsChange?: (settings: any) => void;
  onThemeChange?: (theme: string) => void;
  onShortcutChange?: (shortcuts: ShortcutBinding[]) => void;
}

const FONT_FAMILIES = [
  'Monaco',
  'Consolas',
  'Courier New',
  'Fira Code',
  'Source Code Pro',
  'JetBrains Mono',
  'Cascadia Code',
  'SF Mono',
  'Menlo',
  'Ubuntu Mono',
  'Roboto Mono',
  'Inconsolata'
];

const PRESET_THEMES = [
  { name: 'Visual Studio Dark', key: 'vs-dark', base: 'vs-dark' },
  { name: 'Visual Studio Light', key: 'vs', base: 'vs' },
  { name: 'High Contrast', key: 'hc-black', base: 'hc-black' },
  { name: 'Multi-Agent Dark', key: 'multi-agent-dark', base: 'vs-dark' },
  { name: 'Multi-Agent Light', key: 'multi-agent-light', base: 'vs' },
  { name: 'GitHub Dark', key: 'github-dark', base: 'vs-dark' },
  { name: 'Monokai', key: 'monokai', base: 'vs-dark' },
  { name: 'Solarized Dark', key: 'solarized-dark', base: 'vs-dark' },
  { name: 'Solarized Light', key: 'solarized-light', base: 'vs' }
];

const DEFAULT_SHORTCUTS: ShortcutBinding[] = [
  { command: 'editor.action.formatDocument', key: 'Shift+Alt+F', description: 'Format Document', category: 'Editing' },
  { command: 'editor.action.commentLine', key: 'Ctrl+/', description: 'Toggle Line Comment', category: 'Editing' },
  { command: 'editor.action.duplicateSelection', key: 'Ctrl+D', description: 'Duplicate Selection', category: 'Editing' },
  { command: 'editor.action.moveLinesUpAction', key: 'Alt+Up', description: 'Move Line Up', category: 'Editing' },
  { command: 'editor.action.moveLinesDownAction', key: 'Alt+Down', description: 'Move Line Down', category: 'Editing' },
  { command: 'actions.find', key: 'Ctrl+F', description: 'Find', category: 'Navigation' },
  { command: 'editor.action.startFindReplaceAction', key: 'Ctrl+H', description: 'Replace', category: 'Navigation' },
  { command: 'editor.action.gotoLine', key: 'Ctrl+G', description: 'Go to Line', category: 'Navigation' },
  { command: 'editor.action.revealDefinition', key: 'F12', description: 'Go to Definition', category: 'Navigation' },
  { command: 'editor.action.goToReferences', key: 'Shift+F12', description: 'Find References', category: 'Navigation' },
  { command: 'editor.action.quickFix', key: 'Ctrl+.', description: 'Quick Fix', category: 'IntelliSense' },
  { command: 'editor.action.triggerSuggest', key: 'Ctrl+Space', description: 'Trigger Suggest', category: 'IntelliSense' },
  { command: 'editor.action.triggerParameterHints', key: 'Ctrl+Shift+Space', description: 'Parameter Hints', category: 'IntelliSense' }
];

export const EditorPersonalization: React.FC<EditorPersonalizationProps> = ({
  onSettingsChange,
  onThemeChange,
  onShortcutChange
}) => {
  const dispatch = useAppDispatch();
  const currentTheme = useAppSelector(state => state.theme?.current || 'vs-dark');
  const editorSettings = useAppSelector(state => (state.settings as any)?.editor || {});

  // Font settings state
  const [fontSettings, setFontSettings] = useState<FontSettings>({
    family: editorSettings?.fontFamily || 'Monaco',
    size: editorSettings?.fontSize || 14,
    weight: 'normal',
    lineHeight: 1.5,
    letterSpacing: 0,
    ligatures: true
  });

  // Theme settings state
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);
  const [customTheme, setCustomTheme] = useState<ThemeSettings>({
    name: 'Custom Theme',
    base: 'vs-dark',
    colors: {
      'editor.background': '#1e1e1e',
      'editor.foreground': '#d4d4d4',
      'editor.lineHighlightBackground': '#2d2d30',
      'editor.selectionBackground': '#264f78'
    },
    tokenColors: {
      'comment': '#6A9955',
      'keyword': '#569CD6',
      'string': '#CE9178',
      'number': '#B5CEA8'
    },
    isCustom: true
  });

  // Shortcut settings state
  const [shortcuts, setShortcuts] = useState<ShortcutBinding[]>(DEFAULT_SHORTCUTS);
  const [editingShortcut, setEditingShortcut] = useState<ShortcutBinding | null>(null);
  const [isShortcutModalVisible, setIsShortcutModalVisible] = useState(false);

  // Preview state
  const [previewCode] = useState(`// Preview your editor settings
function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

/* Multi-line comment
   showing syntax highlighting */
const result = fibonacci(10);
console.log(\`Result: \${result}\`);

// TODO: Add error handling
export default fibonacci;`);

  // Handle font settings change
  const handleFontChange = useCallback((key: keyof FontSettings, value: any) => {
    setFontSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      onSettingsChange?.({ font: newSettings });
      return newSettings;
    });
  }, [onSettingsChange]);

  // Handle theme change
  const handleThemeChange = useCallback((themeName: string) => {
    setSelectedTheme(themeName as 'light' | 'dark');
    onThemeChange?.(themeName);
    
    // Apply theme to Monaco
    if (monaco.editor) {
      monaco.editor.setTheme(themeName);
    }
  }, [onThemeChange]);

  // Create custom theme
  const createCustomTheme = useCallback(() => {
    const themeData = {
      base: customTheme.base,
      inherit: true,
      rules: Object.entries(customTheme.tokenColors).map(([token, color]) => ({
        token,
        foreground: color.replace('#', '')
      })),
      colors: customTheme.colors
    };

    monaco.editor.defineTheme('custom-theme', themeData as any);
    handleThemeChange('custom-theme');
    message.success('Custom theme created and applied');
  }, [customTheme, handleThemeChange]);

  // Handle shortcut edit
  const handleShortcutEdit = useCallback((shortcut: ShortcutBinding) => {
    setEditingShortcut({ ...shortcut });
    setIsShortcutModalVisible(true);
  }, []);

  // Save shortcut changes
  const saveShortcutChanges = useCallback(() => {
    if (!editingShortcut) return;

    setShortcuts(prev => {
      const newShortcuts = prev.map(s => 
        s.command === editingShortcut.command ? editingShortcut : s
      );
      onShortcutChange?.(newShortcuts);
      return newShortcuts;
    });

    setIsShortcutModalVisible(false);
    setEditingShortcut(null);
    message.success('Shortcut updated');
  }, [editingShortcut, onShortcutChange]);

  // Export settings
  const exportSettings = useCallback(() => {
    const settings = {
      font: fontSettings,
      theme: selectedTheme,
      customTheme: customTheme,
      shortcuts: shortcuts
    };

    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'editor-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [fontSettings, selectedTheme, customTheme, shortcuts]);

  // Import settings
  const importSettings = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target?.result as string);
        
        if (settings.font) {
          setFontSettings(settings.font);
        }
        if (settings.theme) {
          setSelectedTheme(settings.theme);
          handleThemeChange(settings.theme);
        }
        if (settings.customTheme) {
          setCustomTheme(settings.customTheme);
        }
        if (settings.shortcuts) {
          setShortcuts(settings.shortcuts);
        }
        
        message.success('Settings imported successfully');
      } catch (error) {
        message.error('Failed to import settings');
      }
    };
    reader.readAsText(file);
  }, [handleThemeChange]);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    setFontSettings({
      family: 'Monaco',
      size: 14,
      weight: 'normal',
      lineHeight: 1.5,
      letterSpacing: 0,
      ligatures: true
    });
    setSelectedTheme('dark');
    setShortcuts(DEFAULT_SHORTCUTS);
    handleThemeChange('vs-dark');
    message.success('Settings reset to defaults');
  }, [handleThemeChange]);

  // Render font settings
  const renderFontSettings = () => (
    <Card title="Font Settings" >
      <Form layout="vertical">
        <Form.Item label="Font Family">
          <Select
            value={fontSettings.family}
            onChange={(value) => handleFontChange('family', value)}
            style={{ width: '100%' }}
          >
            {FONT_FAMILIES.map(font => (
              <Select.Option key={font} value={font}>
                <span style={{ fontFamily: font }}>{font}</span>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label={`Font Size: ${fontSettings.size}px`}>
          <Slider
            min={8}
            max={32}
            value={fontSettings.size}
            onChange={(value) => handleFontChange('size', value)}
            marks={{ 8: '8px', 14: '14px', 18: '18px', 24: '24px', 32: '32px' }}
          />
        </Form.Item>

        <Form.Item label="Font Weight">
          <Select
            value={fontSettings.weight}
            onChange={(value) => handleFontChange('weight', value)}
          >
            <Select.Option value="normal">Normal</Select.Option>
            <Select.Option value="bold">Bold</Select.Option>
            <Select.Option value="300">Light</Select.Option>
            <Select.Option value="500">Medium</Select.Option>
            <Select.Option value="600">Semi Bold</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label={`Line Height: ${fontSettings.lineHeight}`}>
          <Slider
            min={1.0}
            max={2.0}
            step={0.1}
            value={fontSettings.lineHeight}
            onChange={(value) => handleFontChange('lineHeight', value)}
            marks={{ 1.0: '1.0', 1.5: '1.5', 2.0: '2.0' }}
          />
        </Form.Item>

        <Form.Item label={`Letter Spacing: ${fontSettings.letterSpacing}px`}>
          <Slider
            min={-2}
            max={4}
            step={0.1}
            value={fontSettings.letterSpacing}
            onChange={(value) => handleFontChange('letterSpacing', value)}
            marks={{ '-2': '-2px', 0: '0px', 2: '2px', 4: '4px' }}
          />
        </Form.Item>

        <Form.Item>
          <Space>
            <span>Font Ligatures:</span>
            <Switch
              checked={fontSettings.ligatures}
              onChange={(checked) => handleFontChange('ligatures', checked)}
            />
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );

  // Render theme settings
  const renderThemeSettings = () => (
    <Card title="Theme Settings" >
      <Form layout="vertical">
        <Form.Item label="Preset Themes">
          <Select
            value={selectedTheme}
            onChange={handleThemeChange}
            style={{ width: '100%' }}
          >
            {PRESET_THEMES.map(theme => (
              <Select.Option key={theme.key} value={theme.key}>
                {theme.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Divider>Custom Theme</Divider>

        <Form.Item label="Theme Name">
          <Input
            value={customTheme.name}
            onChange={(e) => setCustomTheme(prev => ({ ...prev, name: e.target.value }))}
          />
        </Form.Item>

        <Form.Item label="Base Theme">
          <Select
            value={customTheme.base}
            onChange={(value) => setCustomTheme(prev => ({ ...prev, base: value }))}
          >
            <Select.Option value="vs">Light</Select.Option>
            <Select.Option value="vs-dark">Dark</Select.Option>
            <Select.Option value="hc-black">High Contrast</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label="Editor Colors">
          <Space direction="vertical" style={{ width: '100%' }}>
            {Object.entries(customTheme.colors).map(([key, color]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Text style={{ minWidth: '150px', fontSize: '12px' }}>{key}:</Text>
                <ColorPicker
                  value={color}
                  onChange={(_, hex) => setCustomTheme(prev => ({
                    ...prev,
                    colors: { ...prev.colors, [key]: hex }
                  }))}
                />
                <Text code style={{ fontSize: '11px' }}>{color}</Text>
              </div>
            ))}
          </Space>
        </Form.Item>

        <Form.Item label="Token Colors">
          <Space direction="vertical" style={{ width: '100%' }}>
            {Object.entries(customTheme.tokenColors).map(([key, color]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Text style={{ minWidth: '100px', fontSize: '12px' }}>{key}:</Text>
                <ColorPicker
                  value={color}
                  onChange={(_, hex) => setCustomTheme(prev => ({
                    ...prev,
                    tokenColors: { ...prev.tokenColors, [key]: hex }
                  }))}
                />
                <Text code style={{ fontSize: '11px' }}>{color}</Text>
              </div>
            ))}
          </Space>
        </Form.Item>

        <Form.Item>
          <Button type="primary" onClick={createCustomTheme} block>
            Apply Custom Theme
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );

  // Render shortcut settings
  const renderShortcutSettings = () => (
    <Card title="Keyboard Shortcuts" >
      <List
        
        dataSource={shortcuts}
        renderItem={(shortcut) => (
          <List.Item
            actions={[
              <Button
                type="link"
                
                onClick={() => handleShortcutEdit(shortcut)}
              >
                Edit
              </Button>
            ]}
          >
            <List.Item.Meta
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{shortcut.description}</span>
                  <Tag>{shortcut.key}</Tag>
                </div>
              }
              description={
                <div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {shortcut.command}
                  </Text>
                  {shortcut.category && (
                    <Tag  style={{ marginLeft: '8px' }}>
                      {shortcut.category}
                    </Tag>
                  )}
                </div>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );

  // Render preview
  const renderPreview = () => (
    <Card title="Preview" >
      <div
        style={{
          fontFamily: fontSettings.family,
          fontSize: `${fontSettings.size}px`,
          fontWeight: fontSettings.weight,
          lineHeight: fontSettings.lineHeight,
          letterSpacing: `${fontSettings.letterSpacing}px`,
          background: customTheme.colors['editor.background'] || '#1e1e1e',
          color: customTheme.colors['editor.foreground'] || '#d4d4d4',
          padding: '16px',
          borderRadius: '4px',
          border: '1px solid #3e3e42',
          whiteSpace: 'pre-wrap',
          fontFeatureSettings: fontSettings.ligatures ? '"liga" 1, "calt" 1' : '"liga" 0, "calt" 0'
        }}
      >
        {previewCode}
      </div>
    </Card>
  );

  const tabItems = [
    {
      key: 'font',
      label: (
        <span>
          <FontSizeOutlined />
          Font
        </span>
      ),
      children: renderFontSettings()
    },
    {
      key: 'theme',
      label: (
        <span>
          <BgColorsOutlined />
          Theme
        </span>
      ),
      children: renderThemeSettings()
    },
    {
      key: 'shortcuts',
      label: (
        <span>
          <KeyOutlined />
          Shortcuts
        </span>
      ),
      children: renderShortcutSettings()
    },
    {
      key: 'preview',
      label: (
        <span>
          <EyeOutlined />
          Preview
        </span>
      ),
      children: renderPreview()
    }
  ];

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4}>Editor Personalization</Title>
        <Space>
          <Upload
            accept=".json"
            showUploadList={false}
            beforeUpload={(file) => {
              importSettings(file);
              return false;
            }}
          >
            <Button icon={<ImportOutlined />}>Import</Button>
          </Upload>
          <Button icon={<ExportOutlined />} onClick={exportSettings}>
            Export
          </Button>
          <Button icon={<ReloadOutlined />} onClick={resetToDefaults}>
            Reset
          </Button>
        </Space>
      </div>

      <Tabs items={tabItems} />

      {/* Shortcut Edit Modal */}
      <Modal
        title="Edit Keyboard Shortcut"
        open={isShortcutModalVisible}
        onOk={saveShortcutChanges}
        onCancel={() => {
          setIsShortcutModalVisible(false);
          setEditingShortcut(null);
        }}
        width={500}
      >
        {editingShortcut && (
          <Form layout="vertical">
            <Form.Item label="Command">
              <Input value={editingShortcut.command} disabled />
            </Form.Item>
            <Form.Item label="Description">
              <Input
                value={editingShortcut.description}
                onChange={(e) => setEditingShortcut(prev => prev ? { ...prev, description: e.target.value } : null)}
              />
            </Form.Item>
            <Form.Item label="Key Binding">
              <Input
                value={editingShortcut.key}
                onChange={(e) => setEditingShortcut(prev => prev ? { ...prev, key: e.target.value } : null)}
                placeholder="e.g., Ctrl+Shift+F"
              />
            </Form.Item>
            <Form.Item label="Category">
              <Input
                value={editingShortcut.category}
                onChange={(e) => setEditingShortcut(prev => prev ? { ...prev, category: e.target.value } : null)}
              />
            </Form.Item>
            <Form.Item label="When (Context)">
              <Input
                value={editingShortcut.when || ''}
                onChange={(e) => setEditingShortcut(prev => prev ? { ...prev, when: e.target.value } : null)}
                placeholder="e.g., editorTextFocus"
              />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default EditorPersonalization;