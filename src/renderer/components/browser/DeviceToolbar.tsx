/**
 * Device Toolbar Component
 * Responsive preview controls for device emulation
 */

import React from 'react';
import { Button, Select, InputNumber, Space, Typography, Tooltip } from 'antd';
import { 
  MobileOutlined, 
  TabletOutlined, 
  DesktopOutlined, 
  RotateRightOutlined,
  CloseOutlined 
} from '@ant-design/icons';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { setDeviceEmulation } from '../../store/slices/browserSlice';
import { DEVICE_PRESETS, DevicePreset } from '../../types/browser';

const { Text } = Typography;
const { Option } = Select;

export const DeviceToolbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { deviceEmulation } = useAppSelector(state => state.browser.previewSettings);

  const handleDeviceChange = (deviceName: string) => {
    const device = DEVICE_PRESETS.find(d => d.name === deviceName);
    if (device) {
      dispatch(setDeviceEmulation({
        ...deviceEmulation,
        device,
      }));
    }
  };

  const handleCustomSize = (width?: number, height?: number) => {
    dispatch(setDeviceEmulation({
      ...deviceEmulation,
      customWidth: width,
      customHeight: height,
      device: {
        ...deviceEmulation.device,
        width: width || deviceEmulation.device.width,
        height: height || deviceEmulation.device.height,
      },
    }));
  };

  const handleRotate = () => {
    const { device } = deviceEmulation;
    dispatch(setDeviceEmulation({
      ...deviceEmulation,
      device: {
        ...device,
        width: device.height,
        height: device.width,
      },
    }));
  };

  const handleDisable = () => {
    dispatch(setDeviceEmulation({
      enabled: false,
      device: DEVICE_PRESETS[0],
    }));
  };

  const getDeviceIcon = (deviceName: string) => {
    if (deviceName.includes('Mobile')) return <MobileOutlined />;
    if (deviceName === 'Tablet') return <TabletOutlined />;
    return <DesktopOutlined />;
  };

  return (
    <div className="device-toolbar">
      <Space size="middle" style={{ padding: '8px 16px', background: '#f5f5f5', borderBottom: '1px solid #d9d9d9' }}>
        <Space >
          <Text strong>Device:</Text>
          <Select
            value={deviceEmulation.device.name}
            onChange={handleDeviceChange}
            style={{ width: 120 }}
            
          >
            {DEVICE_PRESETS.map(device => (
              <Option key={device.name} value={device.name}>
                <Space >
                  {getDeviceIcon(device.name)}
                  {device.name}
                </Space>
              </Option>
            ))}
          </Select>
        </Space>

        <Space >
          <Text>Size:</Text>
          <InputNumber
            value={deviceEmulation.device.width}
            onChange={(value) => handleCustomSize(value || undefined)}
            
            style={{ width: 80 }}
            min={320}
            max={3840}
          />
          <Text>×</Text>
          <InputNumber
            value={deviceEmulation.device.height}
            onChange={(value) => handleCustomSize(undefined, value || undefined)}
            
            style={{ width: 80 }}
            min={240}
            max={2160}
          />
        </Space>

        <Space >
          <Text>Ratio:</Text>
          <Text code>{deviceEmulation.device.pixelRatio}x</Text>
        </Space>

        <Space >
          <Tooltip title="Rotate Device">
            <Button  icon={<RotateRightOutlined />} onClick={handleRotate} />
          </Tooltip>
          
          <Tooltip title="Disable Device Emulation">
            <Button  icon={<CloseOutlined />} onClick={handleDisable} />
          </Tooltip>
        </Space>

        <div style={{ marginLeft: 'auto' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {deviceEmulation.device.touch ? 'Touch Device' : 'Mouse Device'}
          </Text>
        </div>
      </Space>
    </div>
  );
};