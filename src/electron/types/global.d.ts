/**
 * Global type declarations for Electron API
 */

import { ElectronAPI } from '../preload/preload';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};