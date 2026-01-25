/**
 * @fileoverview 历史记录插件
 * 提供撤销/重做功能
 *
 * 使用基于钩子系统的方式实现
 */

import type { PowerLinkPlugin, PluginContext, ConnectionInfo } from '../connector/types';
import type { ConnectionModel } from '../connector/model';

/**
 * 历史记录项类型
 */
type HistoryAction =
  | { type: 'connect'; data: { from: string; to: string; fromDot: string; toDot: string } }
  | { type: 'disconnect'; data: ConnectionInfo };

/**
 * 历史记录插件选项
 */
export interface HistoryPluginOptions {
  /** 最大历史记录数 */
  maxHistory?: number;
}

/**
 * 历史记录插件
 *
 * 使用示例：
 * ```typescript
 * import { Connector, HistoryPlugin } from 'power-link';
 *
 * const connector = new Connector({ container });
 * connector.use(HistoryPlugin, { maxHistory: 50 });
 *
 * // 获取插件实例进行操作
 * const plugin = connector.getPlugin('HistoryPlugin');
 * plugin.undo();
 * plugin.redo();
 * ```
 */
export const HistoryPlugin: PowerLinkPlugin<HistoryPluginOptions> & {
  /** 历史记录栈 */
  history: HistoryAction[];
  /** 重做栈 */
  redoStack: HistoryAction[];
  /** 最大历史记录数 */
  maxHistory: number;
  /** 是否正在执行撤销/重做 */
  isUndoRedo: boolean;
  /** 插件上下文 */
  ctx: PluginContext | null;
  /** 撤销 */
  undo(): boolean;
  /** 重做 */
  redo(): boolean;
  /** 清空历史 */
  clear(): void;
  /** 是否可以撤销 */
  canUndo(): boolean;
  /** 是否可以重做 */
  canRedo(): boolean;
  /** 获取历史记录数 */
  getHistoryCount(): number;
} = {
  name: 'HistoryPlugin',
  version: '1.0.0',

  // 内部状态
  history: [],
  redoStack: [],
  maxHistory: 100,
  isUndoRedo: false,
  ctx: null,

  install(context, options) {
    this.ctx = context;
    this.history = [];
    this.redoStack = [];
    this.maxHistory = options?.maxHistory ?? 100;
    this.isUndoRedo = false;

    // 使用钩子系统注册 afterConnect 钩子
    context.hooks.afterConnect.tap((connection: ConnectionModel) => {
      if (this.isUndoRedo) return connection;

      // 记录连接操作
      this.history.push({
        type: 'connect',
        data: {
          from: connection.fromNode.id,
          to: connection.toNode.id,
          fromDot: connection.fromDot.position,
          toDot: connection.toDot.position,
        },
      });

      // 清空重做栈
      this.redoStack = [];

      // 限制历史记录数量
      if (this.history.length > this.maxHistory) {
        this.history.shift();
      }

      return connection;
    });

    // 使用钩子系统注册 afterDisconnect 钩子
    context.hooks.afterDisconnect.tap((info: ConnectionInfo) => {
      if (this.isUndoRedo) return info;

      // 记录断开操作
      this.history.push({
        type: 'disconnect',
        data: info,
      });

      // 清空重做栈
      this.redoStack = [];

      // 限制历史记录数量
      if (this.history.length > this.maxHistory) {
        this.history.shift();
      }

      return info;
    });

    console.log('[HistoryPlugin] 已安装，最大历史记录:', this.maxHistory);
  },

  uninstall() {
    // 钩子会在 PluginManager 卸载时自动取消注册
    this.history = [];
    this.redoStack = [];
    this.ctx = null;
    console.log('[HistoryPlugin] 已卸载');
  },

  /**
   * 撤销上一步操作
   */
  undo(): boolean {
    if (this.history.length === 0 || !this.ctx) return false;

    const action = this.history.pop()!;
    this.isUndoRedo = true;

    try {
      if (action.type === 'connect') {
        // 撤销连接 = 断开连接
        const connections = this.ctx.getConnections();
        const target = connections.find(
          (c) =>
            c.fromNode.id === action.data.from &&
            c.toNode.id === action.data.to &&
            c.fromDot.position === action.data.fromDot &&
            c.toDot.position === action.data.toDot
        );
        if (target) {
          this.ctx.emit('disconnect:request', target.id);
        }
      } else {
        // 撤销断开 = 重新连接
        this.ctx.emit('connect:request', {
          fromNodeId: action.data.from,
          toNodeId: action.data.to,
          fromDot: action.data.fromDot,
          toDot: action.data.toDot,
        });
      }

      // 加入重做栈
      this.redoStack.push(action);
      return true;
    } finally {
      this.isUndoRedo = false;
    }
  },

  /**
   * 重做
   */
  redo(): boolean {
    if (this.redoStack.length === 0 || !this.ctx) return false;

    const action = this.redoStack.pop()!;
    this.isUndoRedo = true;

    try {
      if (action.type === 'connect') {
        // 重做连接
        this.ctx.emit('connect:request', {
          fromNodeId: action.data.from,
          toNodeId: action.data.to,
          fromDot: action.data.fromDot,
          toDot: action.data.toDot,
        });
      } else {
        // 重做断开
        const connections = this.ctx.getConnections();
        const target = connections.find(
          (c) =>
            c.fromNode.id === action.data.from &&
            c.toNode.id === action.data.to
        );
        if (target) {
          this.ctx.emit('disconnect:request', target.id);
        }
      }

      // 加入历史栈
      this.history.push(action);
      return true;
    } finally {
      this.isUndoRedo = false;
    }
  },

  /**
   * 清空历史记录
   */
  clear(): void {
    this.history = [];
    this.redoStack = [];
  },

  /**
   * 是否可以撤销
   */
  canUndo(): boolean {
    return this.history.length > 0;
  },

  /**
   * 是否可以重做
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  },

  /**
   * 获取历史记录数量
   */
  getHistoryCount(): number {
    return this.history.length;
  },
};
