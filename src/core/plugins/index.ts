/**
 * Plugin and Extension System
 * Export all plugin-related interfaces and classes
 */

// Core plugin interfaces
export * from './IAgentPlugin';

// Plugin management
export * from './PluginManager';

// Extension registry
export * from './ExtensionRegistry';

// Third-party integrations
export * from './ThirdPartyIntegrations';

// Re-export commonly used types
export type {
  IAgentPlugin,
  IThirdPartyIntegration,
  IAPIIntegration,
  PluginMetadata,
  PluginConfig,
  PluginPermissions,
  PluginRegistryEntry,
  PluginDiscoveryResult,
  PluginInstallationResult,
  PluginEventData
} from './IAgentPlugin';

export {
  PluginEventType
} from './IAgentPlugin';