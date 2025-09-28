import React from 'react';
import { Provider } from 'react-redux';
import { store } from '../../store/store';
import SettingsDemo from './SettingsDemo';

const SettingsTest: React.FC = () => {
  return (
    <Provider store={store}>
      <div style={{ padding: '20px' }}>
        <SettingsDemo />
      </div>
    </Provider>
  );
};

export default SettingsTest;