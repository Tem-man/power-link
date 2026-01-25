/**
 * @fileoverview 连接验证插件
 * 提供连接规则验证功能
 *
 * 使用基于钩子系统的方式实现
 */

import type { PowerLinkPlugin, PluginContext } from '../connector/types';
import type { NodeModel, DotModel } from '../connector/model';
import type { ConnectionParams } from '../connector/types';

/**
 * 验证规则函数类型
 */
export type ValidationRule = (
  fromNode: NodeModel,
  toNode: NodeModel,
  fromDot: DotModel,
  toDot: DotModel
) => boolean | string;

/**
 * 验证插件选项
 */
export interface ValidationPluginOptions {
  /** 是否允许自连接（节点连接到自己） */
  allowSelfConnection?: boolean;
  /** 是否允许重复连接 */
  allowDuplicateConnection?: boolean;
  /** 最大连接数（每个节点） */
  maxConnectionsPerNode?: number;
  /** 自定义验证规则 */
  rules?: ValidationRule[];
  /** 验证失败时的回调 */
  onValidationFail?: (message: string) => void;
}

/**
 * 连接验证插件
 *
 * 使用示例：
 * ```typescript
 * import { Connector, ValidationPlugin } from 'power-link';
 *
 * const connector = new Connector({ container });
 * connector.use(ValidationPlugin, {
 *   allowSelfConnection: false,
 *   maxConnectionsPerNode: 5,
 *   rules: [
 *     (from, to) => from.info?.type !== to.info?.type || '不能连接相同类型的节点',
 *   ],
 *   onValidationFail: (msg) => alert(msg),
 * });
 * ```
 */
export const ValidationPlugin: PowerLinkPlugin<ValidationPluginOptions> = {
  name: 'ValidationPlugin',
  version: '1.0.0',

  install(context: PluginContext, options?: ValidationPluginOptions) {
    const opts: Required<ValidationPluginOptions> = {
      allowSelfConnection: options?.allowSelfConnection ?? false,
      allowDuplicateConnection: options?.allowDuplicateConnection ?? false,
      maxConnectionsPerNode: options?.maxConnectionsPerNode ?? Infinity,
      rules: options?.rules ?? [],
      onValidationFail: options?.onValidationFail ?? ((msg) => console.warn('[ValidationPlugin]', msg)),
    };

    // 处理验证失败
    const handleValidationFail = (message: string) => {
      opts.onValidationFail(message);
    };

    // 通过钩子系统注册 beforeConnect 钩子
    context.hooks.beforeConnect.tap((params: ConnectionParams) => {
      const { fromNode, toNode, fromDot, toDot } = params;

      // 检查自连接
      if (!opts.allowSelfConnection && fromNode.id === toNode.id) {
        handleValidationFail('不允许节点连接到自己');
        return false;
      }

      // 检查最大连接数
      if (opts.maxConnectionsPerNode !== Infinity) {
        const fromConnCount = fromNode.getConnectionCount();
        const toConnCount = toNode.getConnectionCount();

        if (fromConnCount >= opts.maxConnectionsPerNode) {
          handleValidationFail(`节点 ${fromNode.id} 已达到最大连接数 (${opts.maxConnectionsPerNode})`);
          return false;
        }

        if (toConnCount >= opts.maxConnectionsPerNode) {
          handleValidationFail(`节点 ${toNode.id} 已达到最大连接数 (${opts.maxConnectionsPerNode})`);
          return false;
        }
      }

      // 执行自定义规则
      for (const rule of opts.rules) {
        const result = rule(fromNode, toNode, fromDot, toDot);

        if (result === false) {
          handleValidationFail('连接验证失败');
          return false;
        }

        if (typeof result === 'string') {
          handleValidationFail(result);
          return false;
        }
      }

      // 验证通过，返回原参数继续执行
      return params;
    });

    console.log('[ValidationPlugin] 已安装');
  },

  uninstall() {
    // 钩子会在 PluginManager 卸载时自动取消注册
    console.log('[ValidationPlugin] 已卸载');
  },
};

/**
 * 创建验证插件实例（工厂函数）
 *
 * 如果需要动态添加/删除规则，使用此函数创建插件实例
 *
 * @example
 * ```typescript
 * const { plugin, addRule, removeRule, clearRules } = createValidationPlugin({
 *   allowSelfConnection: false,
 * });
 *
 * connector.use(plugin);
 *
 * // 动态添加规则
 * addRule((from, to) => from.info?.type !== to.info?.type || '不能连接相同类型');
 *
 * // 动态移除规则
 * removeRule(myRule);
 * ```
 */
export function createValidationPlugin(initialOptions?: ValidationPluginOptions) {
  const rules: ValidationRule[] = [...(initialOptions?.rules ?? [])];

  const plugin: PowerLinkPlugin<ValidationPluginOptions> = {
    name: 'ValidationPlugin',
    version: '1.0.0',

    install(context: PluginContext, options?: ValidationPluginOptions) {
      const opts: Required<ValidationPluginOptions> = {
        allowSelfConnection: options?.allowSelfConnection ?? initialOptions?.allowSelfConnection ?? false,
        allowDuplicateConnection: options?.allowDuplicateConnection ?? initialOptions?.allowDuplicateConnection ?? false,
        maxConnectionsPerNode: options?.maxConnectionsPerNode ?? initialOptions?.maxConnectionsPerNode ?? Infinity,
        rules: rules, // 使用可变的 rules 数组
        onValidationFail: options?.onValidationFail ?? initialOptions?.onValidationFail ?? ((msg) => console.warn('[ValidationPlugin]', msg)),
      };

      const handleValidationFail = (message: string) => {
        opts.onValidationFail(message);
      };

      context.hooks.beforeConnect.tap((params: ConnectionParams) => {
        const { fromNode, toNode, fromDot, toDot } = params;

        if (!opts.allowSelfConnection && fromNode.id === toNode.id) {
          handleValidationFail('不允许节点连接到自己');
          return false;
        }

        if (opts.maxConnectionsPerNode !== Infinity) {
          const fromConnCount = fromNode.getConnectionCount();
          const toConnCount = toNode.getConnectionCount();

          if (fromConnCount >= opts.maxConnectionsPerNode) {
            handleValidationFail(`节点 ${fromNode.id} 已达到最大连接数 (${opts.maxConnectionsPerNode})`);
            return false;
          }

          if (toConnCount >= opts.maxConnectionsPerNode) {
            handleValidationFail(`节点 ${toNode.id} 已达到最大连接数 (${opts.maxConnectionsPerNode})`);
            return false;
          }
        }

        for (const rule of rules) {
          const result = rule(fromNode, toNode, fromDot, toDot);

          if (result === false) {
            handleValidationFail('连接验证失败');
            return false;
          }

          if (typeof result === 'string') {
            handleValidationFail(result);
            return false;
          }
        }

        return params;
      });

      console.log('[ValidationPlugin] 已安装');
    },

    uninstall() {
      console.log('[ValidationPlugin] 已卸载');
    },
  };

  return {
    plugin,
    addRule(rule: ValidationRule) {
      rules.push(rule);
    },
    removeRule(rule: ValidationRule) {
      const index = rules.indexOf(rule);
      if (index !== -1) {
        rules.splice(index, 1);
      }
    },
    clearRules() {
      rules.length = 0;
    },
    getRules(): readonly ValidationRule[] {
      return rules;
    },
  };
}
