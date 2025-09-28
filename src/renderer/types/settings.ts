export interface ThemeConfig {
  mode: 'light' | 'dark' | 'auto';
  primaryColor: string;
  accentColor: string;
  fontSize: number;
  fontFamily: string;
  customColors?: {
    background: string;
    foreground: string;
    border: string;
    accent: string;
  };
}

export interface LayoutConfig {
  panels: {
    [key: string]: {
      visible: boolean;
      position: 'left' | 'right' | 'bottom' | 'top';
      size: number;
      order: number;
    };
  };
  workspaceTemplates: WorkspaceTemplate[];
  multiMonitor: {
    enabled: boolean;
    primaryDisplay: string;
    secondaryLayouts: { [displayId: string]: LayoutConfig };
  };
}

export interface WorkspaceTemplate {
  id: string;
  name: string;
  description: string;
  layout: LayoutConfig;
  isDefault: boolean;
  createdAt: Date;
}

export interface AgentSettings {
  enabledTypes: string[];
  performanceSettings: {
    maxConcurrentAgents: number;
    taskTimeout: number;
    memoryLimit: number;
    cpuThreshold: number;
  };
  behaviorSettings: {
    autoAssignTasks: boolean;
    collaborationMode: 'aggressive' | 'conservative' | 'balanced';
    errorHandling: 'retry' | 'escalate' | 'ignore';
    communicationLevel: 'minimal' | 'normal' | 'verbose';
  };
}

export interface EditorSettings {
  tabSize: number;
  insertSpaces: boolean;
  wordWrap: boolean;
  lineNumbers: boolean;
  minimap: boolean;
  autoSave: boolean;
  formatOnSave: boolean;
  theme: string;
  keyBindings: { [key: string]: string };
}

export interface DataManagementSettings {
  autoBackup: boolean;
  backupInterval: number; // minutes
  maxBackups: number;
  backupLocation: string;
  syncEnabled: boolean;
  syncProvider: 'local' | 'cloud' | 'custom';
  encryptBackups: boolean;
}

export interface UpdateSettings {
  autoCheck: boolean;
  checkInterval: number; // hours
  autoDownload: boolean;
  autoInstall: boolean;
  channel: 'stable' | 'beta' | 'alpha';
  notifyOnUpdate: boolean;
}

export interface UsageStatistics {
  totalUsageTime: number;
  featureUsage: { [feature: string]: number };
  performanceMetrics: {
    averageStartupTime: number;
    averageResponseTime: number;
    memoryUsage: number[];
    cpuUsage: number[];
  };
  agentStatistics: {
    [agentType: string]: {
      tasksCompleted: number;
      averageTaskTime: number;
      successRate: number;
    };
  };
}

export interface AppSettings {
  theme: ThemeConfig;
  layout: LayoutConfig;
  agents: AgentSettings;
  editor: EditorSettings;
  dataManagement: DataManagementSettings;
  updates: UpdateSettings;
  shortcuts: { [action: string]: string };
  advanced: {
    debugMode: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    experimentalFeatures: string[];
    performanceMode: 'balanced' | 'performance' | 'battery';
  };
}

export interface SettingsCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  component: React.ComponentType<any>;
}

export interface BackupInfo {
  id: string;
  name: string;
  size: number;
  createdAt: Date;
  type: 'manual' | 'auto';
  description?: string;
}

export interface UpdateInfo {
  version: string;
  releaseDate: Date;
  downloadUrl: string;
  changelog: string;
  size: number;
  isSecurityUpdate: boolean;
  isCritical: boolean;
}