/**
 * Simplified App Component for debugging
 */

import React from 'react';
import { ConfigProvider, theme } from 'antd';
import { Provider } from 'react-redux';
import { store } from './store/store';

const SimpleContent: React.FC = () => {
  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#1f1f1f',
      color: '#cccccc',
      fontSize: '18px',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <h1>Multi-Agent IDE</h1>
      <p>✅ React is working</p>
      <p>✅ Redux store is connected</p>
      <p>✅ Ant Design is loaded</p>
      <div style={{ 
        padding: '20px', 
        border: '1px solid #444', 
        borderRadius: '8px',
        backgroundColor: '#2d2d2d'
      }}>
        <p>Ready to load full IDE interface...</p>
      </div>
    </div>
  );
};

export const SimpleApp: React.FC = () => {
  return (
    <Provider store={store}>
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: '#1890ff',
            colorBgBase: '#1f1f1f',
            colorTextBase: '#cccccc'
          }
        }}
      >
        <SimpleContent />
      </ConfigProvider>
    </Provider>
  );
};