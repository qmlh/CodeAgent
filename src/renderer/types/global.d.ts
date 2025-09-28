/**
 * Global type declarations for the renderer process
 */

import { ElectronAPI } from '../../electron/preload/preload';

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};