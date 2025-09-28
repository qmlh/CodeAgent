/**
 * Browser and Preview System Type Definitions
 */

export interface BrowserTab {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  isDevToolsOpen: boolean;
  lastUpdated: Date;
}

export interface PreviewSettings {
  autoRefresh: boolean;
  hotReload: boolean;
  syncScroll: boolean;
  deviceEmulation: DeviceEmulation;
}

export interface DeviceEmulation {
  enabled: boolean;
  device: DevicePreset;
  customWidth?: number;
  customHeight?: number;
  userAgent?: string;
}

export interface DevicePreset {
  name: string;
  width: number;
  height: number;
  userAgent: string;
  pixelRatio: number;
  touch: boolean;
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  category: string;
  tags: string[];
  createdAt: Date;
  favicon?: string;
}

export interface BookmarkCategory {
  id: string;
  name: string;
  color: string;
  bookmarks: Bookmark[];
}

export interface ScreenshotOptions {
  type: 'fullpage' | 'viewport' | 'selection';
  format: 'png' | 'jpeg' | 'webp';
  quality?: number;
  selector?: string;
}

export interface RecordingOptions {
  duration?: number;
  fps: number;
  format: 'webm' | 'mp4';
  includeAudio: boolean;
}

export interface BrowserState {
  tabs: BrowserTab[];
  activeTabId: string | null;
  previewSettings: PreviewSettings;
  bookmarks: BookmarkCategory[];
  history: string[];
  isVisible: boolean;
}

// Device presets for responsive testing
export const DEVICE_PRESETS: DevicePreset[] = [
  {
    name: 'Desktop',
    width: 1920,
    height: 1080,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    pixelRatio: 1,
    touch: false,
  },
  {
    name: 'Laptop',
    width: 1366,
    height: 768,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    pixelRatio: 1,
    touch: false,
  },
  {
    name: 'Tablet',
    width: 768,
    height: 1024,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    pixelRatio: 2,
    touch: true,
  },
  {
    name: 'Mobile',
    width: 375,
    height: 667,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    pixelRatio: 2,
    touch: true,
  },
  {
    name: 'Mobile Large',
    width: 414,
    height: 896,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    pixelRatio: 3,
    touch: true,
  },
];