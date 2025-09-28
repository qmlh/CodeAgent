/**
 * System Integration Types
 * Type definitions for system tools and development interfaces
 */

// Terminal types
export interface Terminal {
  id: string;
  title: string;
  cwd: string;
  process?: string;
  isActive: boolean;
  history: string[];
  output: TerminalOutput[];
}

export interface TerminalOutput {
  id: string;
  content: string;
  type: 'input' | 'output' | 'error';
  timestamp: number;
}

export interface TerminalTheme {
  background: string;
  foreground: string;
  cursor: string;
  selection: string;
  black: string;
  red: string;
  green: string;
  yellow: string;
  blue: string;
  magenta: string;
  cyan: string;
  white: string;
  brightBlack: string;
  brightRed: string;
  brightGreen: string;
  brightYellow: string;
  brightBlue: string;
  brightMagenta: string;
  brightCyan: string;
  brightWhite: string;
}

// Git types
export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  staged: GitFileStatus[];
  unstaged: GitFileStatus[];
  untracked: string[];
  conflicted: string[];
}

export interface GitFileStatus {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed' | 'copied' | 'unmerged';
  staged: boolean;
}

export interface GitCommit {
  hash: string;
  author: string;
  email: string;
  date: Date;
  message: string;
  parents: string[];
  refs: string[];
}

export interface GitBranch {
  name: string;
  current: boolean;
  remote?: string;
  ahead?: number;
  behind?: number;
}

// Plugin types
export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  homepage?: string;
  repository?: string;
  keywords: string[];
  enabled: boolean;
  installed: boolean;
  updateAvailable?: string;
  dependencies?: Record<string, string>;
  config?: Record<string, any>;
}

export interface PluginCategory {
  id: string;
  name: string;
  description: string;
  plugins: Plugin[];
}

// Keyboard shortcut types
export interface KeyboardShortcut {
  id: string;
  command: string;
  key: string;
  when?: string;
  description: string;
  category: string;
  conflicts?: string[];
}

export interface ShortcutCategory {
  id: string;
  name: string;
  shortcuts: KeyboardShortcut[];
}

// Context menu types
export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  action?: ((data?: any) => void) | string;
  enabled?: boolean;
  visible?: boolean;
  submenu?: ContextMenuItem[];
  separator?: boolean;
  when?: (data?: any) => boolean;
}

export interface ContextMenuConfig {
  context: string;
  items: ContextMenuItem[];
}

// Command palette types
export interface Command {
  id: string;
  title: string;
  category: string;
  description?: string;
  icon?: string;
  shortcut?: string;
  action: () => void | Promise<void>;
  when?: () => boolean;
}

export interface CommandCategory {
  id: string;
  name: string;
  commands: Command[];
}

// Panel management types
export interface PanelLayout {
  id: string;
  name: string;
  description?: string;
  panels: PanelConfig[];
  created: Date;
  modified: Date;
}

export interface PanelConfig {
  id: string;
  type: string;
  position: 'left' | 'right' | 'bottom' | 'top';
  size: number;
  visible: boolean;
  order: number;
  config?: Record<string, any>;
}

// System resource types
export interface SystemResources {
  cpu: {
    usage: number;
    cores: number;
    model: string;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  network: {
    upload: number;
    download: number;
  };
}

// Status bar types
export interface StatusBarItem {
  id: string;
  text: string;
  tooltip?: string;
  icon?: string;
  color?: string;
  backgroundColor?: string;
  priority: number;
  alignment: 'left' | 'right';
  command?: string;
  visible: boolean;
}