/**
 * Shortcut Settings Component
 * Manages keyboard shortcuts and hotkeys
 */

import React from 'react';
import { Card, Typography } from 'antd';

const { Title, Text } = Typography;

interface ShortcutSettingsProps {
  onSettingsChange?: (settings: any) => void;
}

const ShortcutSettings: React.FC<ShortcutSettingsProps> = ({ onSettingsChange }) => {
  return (
    <Card title="Keyboard Shortcuts" style={{ marginBottom: '16px' }}>
      <div>
        <Title level={5}>Shortcut Settings</Title>
        <Text type="secondary">
          Keyboard shortcut configuration is coming soon.
        </Text>
      </div>
    </Card>
  );
};

export default ShortcutSettings;