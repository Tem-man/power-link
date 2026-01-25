/**
 * @fileoverview 插件管理器
 * 负责插件的注册、生命周期管理
 *
 * 重构后：
 * - 插件通过 context.hooks 注册钩子（推荐）
 * - 或者在插件对象上定义简写方法，PluginManager 自动注册到钩子系统
 * - 移除了所有 callXxx 方法，钩子调用由 Connector 通过 hooks 对象直接完成
 */

import { EventEmitter } from './EventEmitter';
import type {
  PowerLinkPlugin,
  PluginInstance,
  PluginOptions,
  PluginContext,
  PluginManagerEventMap,
} from '../types/plugin';

/**
 * 简写钩子方法名称映射
 * 插件对象上的方法名 -> hooks 对象上的属性名
 */
const HOOK_METHOD_MAPPINGS: Record<string, { hook: string; isPreventable: boolean }> = {
  beforeNodeRegister: { hook: 'beforeNodeRegister', isPreventable: true },
  afterNodeRegister: { hook: 'afterNodeRegister', isPreventable: false },
  beforeNodeRemove: { hook: 'beforeNodeRemove', isPreventable: true },
  afterNodeRemove: { hook: 'afterNodeRemove', isPreventable: false },
  beforeConnect: { hook: 'beforeConnect', isPreventable: true },
  afterConnect: { hook: 'afterConnect', isPreventable: false },
  beforeDisconnect: { hook: 'beforeDisconnect', isPreventable: true },
  afterDisconnect: { hook: 'afterDisconnect', isPreventable: false },
  beforeDragStart: { hook: 'beforeDragStart', isPreventable: true },
  onDrag: { hook: 'onDrag', isPreventable: false },
  afterDragEnd: { hook: 'afterDragEnd', isPreventable: false },
  beforeViewChange: { hook: 'beforeViewChange', isPreventable: true },
  afterViewChange: { hook: 'afterViewChange', isPreventable: false },
  onRenderConnection: { hook: 'onRenderConnection', isPreventable: false },
  onRenderDot: { hook: 'onRenderDot', isPreventable: false },
};

/**
 * 插件管理器
 */
export class PluginManager extends EventEmitter<PluginManagerEventMap> {
  /** 已安装的插件 */
  private plugins: Map<string, PluginInstance> = new Map();

  /** 插件上下文（延迟设置） */
  private context: PluginContext | null = null;

  /** 插件的钩子取消函数 */
  private hookUnsubscribers: Map<string, Array<() => void>> = new Map();

  /**
   * 设置插件上下文
   */
  setContext(context: PluginContext): void {
    this.context = context;
  }

  /**
   * 获取插件上下文
   */
  getContext(): PluginContext | null {
    return this.context;
  }

  /**
   * 注册并安装插件
   */
  use<T extends PluginOptions>(
    plugin: PowerLinkPlugin<T>,
    options?: T
  ): this {
    if (!plugin.name) {
      throw new Error('Plugin must have a name');
    }

    if (this.plugins.has(plugin.name)) {
      console.warn(`Plugin "${plugin.name}" is already installed`);
      return this;
    }

    // 检查依赖
    if (plugin.dependencies) {
      for (const dep of plugin.dependencies) {
        if (!this.plugins.has(dep)) {
          throw new Error(
            `Plugin "${plugin.name}" requires "${dep}" to be installed first`
          );
        }
      }
    }

    // 创建插件实例
    const instance: PluginInstance<T> = {
      plugin,
      options: options || ({} as T),
      installed: false,
    };

    this.plugins.set(plugin.name, instance);

    // 如果上下文已设置，立即安装
    if (this.context) {
      this.installPlugin(instance);
    }

    return this;
  }

  /**
   * 卸载插件
   */
  unuse(pluginName: string): this {
    const instance = this.plugins.get(pluginName);
    if (!instance) {
      console.warn(`Plugin "${pluginName}" is not installed`);
      return this;
    }

    // 检查是否有其他插件依赖此插件
    for (const [name, inst] of this.plugins) {
      if (inst.plugin.dependencies?.includes(pluginName)) {
        throw new Error(
          `Cannot uninstall "${pluginName}": "${name}" depends on it`
        );
      }
    }

    // 取消所有钩子订阅
    const unsubscribers = this.hookUnsubscribers.get(pluginName);
    if (unsubscribers) {
      unsubscribers.forEach((unsub) => unsub());
      this.hookUnsubscribers.delete(pluginName);
    }

    // 调用卸载钩子
    if (instance.installed && instance.plugin.uninstall && this.context) {
      try {
        instance.plugin.uninstall(this.context);
      } catch (error) {
        this.handlePluginError(pluginName, 'uninstall', error as Error);
      }
    }

    this.plugins.delete(pluginName);
    this.emit('plugin:uninstall', { name: pluginName });

    return this;
  }

  /**
   * 获取已安装的插件
   */
  getPlugin<T extends PluginOptions>(
    name: string
  ): PowerLinkPlugin<T> | undefined {
    return this.plugins.get(name)?.plugin as PowerLinkPlugin<T> | undefined;
  }

  /**
   * 获取所有已安装的插件名称
   */
  getPluginNames(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * 检查插件是否已安装
   */
  hasPlugin(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * 安装所有待安装的插件（上下文设置后调用）
   */
  installAll(): void {
    if (!this.context) {
      throw new Error('Plugin context is not set');
    }

    for (const instance of this.plugins.values()) {
      if (!instance.installed) {
        this.installPlugin(instance);
      }
    }
  }

  /**
   * 安装单个插件
   */
  private installPlugin(instance: PluginInstance): void {
    if (!this.context) return;

    const unsubscribers: Array<() => void> = [];

    try {
      // 1. 自动注册插件对象上的简写钩子方法
      this.registerShorthandHooks(instance.plugin, unsubscribers);

      // 2. 调用 install 方法（插件可以在这里手动注册钩子）
      if (instance.plugin.install) {
        instance.plugin.install(this.context, instance.options);
      }

      // 保存取消函数
      this.hookUnsubscribers.set(instance.plugin.name, unsubscribers);

      instance.installed = true;
      this.emit('plugin:install', {
        name: instance.plugin.name,
        plugin: instance.plugin,
      });
    } catch (error) {
      // 安装失败，取消已注册的钩子
      unsubscribers.forEach((unsub) => unsub());
      this.handlePluginError(instance.plugin.name, 'install', error as Error);
    }
  }

  /**
   * 注册插件的简写钩子方法到钩子系统
   */
  private registerShorthandHooks(
    plugin: PowerLinkPlugin,
    unsubscribers: Array<() => void>
  ): void {
    if (!this.context) return;

    const hooks = this.context.hooks;

    for (const [methodName, config] of Object.entries(HOOK_METHOD_MAPPINGS)) {
      const method = (plugin as any)[methodName];
      if (typeof method !== 'function') continue;

      const hook = (hooks as any)[config.hook];
      if (!hook || typeof hook.tap !== 'function') {
        console.warn(
          `[PluginManager] Hook "${config.hook}" not found on context.hooks`
        );
        continue;
      }

      // 创建包装函数，将钩子系统的参数格式转换为插件方法的格式
      const wrapper = (data: any, _entity: any) => {
        try {
          const result = method.call(plugin, this.context, data);

          // 对于可阻止的钩子，返回 false 表示阻止
          if (config.isPreventable && result === false) {
            return false;
          }

          // 返回修改后的数据，或原数据
          return result !== undefined ? result : data;
        } catch (error) {
          this.handlePluginError(plugin.name, methodName, error as Error);
          return data;
        }
      };

      const unsub = hook.tap(wrapper);
      if (typeof unsub === 'function') {
        unsubscribers.push(unsub);
      }
    }
  }

  /**
   * 处理插件错误
   */
  private handlePluginError(name: string, hook: string, error: Error): void {
    console.error(`[PowerLink] Plugin "${name}" error in ${hook}:`, error);
    this.emit('plugin:error', { name, error, hook });
  }

  /**
   * 销毁插件管理器
   */
  destroy(): void {
    // 按安装顺序逆序卸载
    const names = Array.from(this.plugins.keys()).reverse();
    for (const name of names) {
      try {
        this.unuse(name);
      } catch (e) {
        // 忽略卸载时的依赖错误
      }
    }

    this.plugins.clear();
    this.hookUnsubscribers.clear();
    this.context = null;
    this.removeAllListeners();
  }
}
