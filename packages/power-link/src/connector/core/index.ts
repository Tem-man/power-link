/**
 * Core 模块统一导出
 */

export { EventEmitter } from './EventEmitter';
export type { EventCallback, EventMap } from './EventEmitter';

export { DEFAULT_CONFIG, mergeConfig, validateConfig } from './Config';

export { PluginManager } from './PluginManager';

export { SequentialHook, PreventableHook, ParallelHook } from './Hook';
export type { HookCallback, PreventableHookCallback, HookResult } from './Hook';

export { createConnectorHooks, clearAllHooks } from './ConnectorHooks';
export type { IConnectorHooks } from './ConnectorHooks';

