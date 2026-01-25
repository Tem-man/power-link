/**
 * @fileoverview 插件系统类型定义
 */

import type { ConnectionModel, NodeModel, DotModel } from '../model';
import type { ConnectionInfo, ViewState, Point } from './index';
import type { IConnectorHooks } from '../core/ConnectorHooks';

/**
 * 插件上下文 - 提供给插件的 API
 */
export interface PluginContext {
  /** 获取所有节点 */
  getNodes(): NodeModel[];
  /** 获取节点 */
  getNode(id: string): NodeModel | undefined;
  /** 获取所有连接 */
  getConnections(): ConnectionModel[];
  /** 获取连接 */
  getConnection(id: string): ConnectionModel | undefined;
  /** 获取视图状态 */
  getViewState(): ViewState;
  /** 设置视图状态 */
  setViewState(state: Partial<ViewState>): void;
  /** 获取容器元素 */
  getContainer(): HTMLElement;
  /** 获取 SVG 元素 */
  getSVG(): SVGSVGElement | null;
  /** 触发事件 */
  emit(event: string, data?: any): void;
  /** 监听事件 */
  on(event: string, callback: (data: any) => void): void;
  /** 取消监听 */
  off(event: string, callback?: (data: any) => void): void;

  /**
   * 钩子系统 - 插件可以通过这个对象注册钩子
   *
   * @example
   * ```typescript
   * install(context) {
   *   // 注册连接前钩子
   *   context.hooks.beforeConnect.tap((params, connector) => {
   *     if (params.fromNode.id === params.toNode.id) {
   *       return false; // 阻止自连接
   *     }
   *     return params;
   *   });
   *
   *   // 注册保存钩子
   *   context.hooks.save.tap((state, connector) => {
   *     return { ...state, pluginData: { ... } };
   *   });
   * }
   * ```
   */
  hooks: IConnectorHooks<any>;
}

/**
 * 插件选项（用户传入的配置）
 */
export type PluginOptions = Record<string, any>;

/**
 * 连接钩子参数
 */
export interface ConnectionHookParams {
  fromNode: NodeModel;
  toNode: NodeModel;
  fromDot: DotModel;
  toDot: DotModel;
}

/**
 * 拖拽钩子参数
 */
export interface DragHookParams {
  node: NodeModel;
  startPosition: Point;
  currentPosition: Point;
}

/**
 * 插件钩子返回值
 * - void/undefined: 继续执行
 * - false: 阻止默认行为
 * - 修改后的参数对象: 使用修改后的参数继续执行
 */
export type HookResult<T = void> = T | false | void;

/**
 * 插件接口
 *
 * 插件可以通过两种方式注册钩子：
 *
 * **方式 1（推荐）：在 install 中通过 context.hooks 注册**
 * ```typescript
 * const MyPlugin: PowerLinkPlugin = {
 *   name: 'MyPlugin',
 *   install(context) {
 *     // 通过钩子系统注册，支持取消注册
 *     const unsubscribe = context.hooks.beforeConnect.tap((params, connector) => {
 *       if (params.fromNode.id === params.toNode.id) return false;
 *       return params;
 *     });
 *     // 保存取消函数，在 uninstall 时调用
 *   }
 * };
 * ```
 *
 * **方式 2（简写）：直接在插件对象上定义钩子方法**
 * PluginManager 会自动将这些方法注册到钩子系统
 * ```typescript
 * const MyPlugin: PowerLinkPlugin = {
 *   name: 'MyPlugin',
 *   beforeConnect(context, params) {
 *     if (params.fromNode.id === params.toNode.id) return false;
 *     return params;
 *   }
 * };
 * ```
 */
export interface PowerLinkPlugin<T extends PluginOptions = PluginOptions> {
  /** 插件名称（必须唯一） */
  name: string;

  /** 插件版本 */
  version?: string;

  /** 插件依赖（其他插件名称） */
  dependencies?: string[];

  // ==================== 生命周期钩子 ====================

  /**
   * 插件安装时调用
   * 推荐在此方法中通过 context.hooks 注册钩子
   * @param context 插件上下文（包含 hooks 属性）
   * @param options 用户传入的选项
   */
  install?(context: PluginContext, options?: T): void;

  /**
   * 插件卸载时调用
   * @param context 插件上下文
   */
  uninstall?(context: PluginContext): void;

  // ==================== 简写钩子方法（可选） ====================
  // 以下方法会在安装时自动注册到对应的钩子上
  // 如果在 install 中手动注册了钩子，可以不定义这些方法

  /** 节点注册前 */
  beforeNodeRegister?(
    context: PluginContext,
    params: { id: string; element: HTMLElement; options: any }
  ): HookResult;

  /** 节点注册后 */
  afterNodeRegister?(context: PluginContext, node: NodeModel): void;

  /** 节点移除前 */
  beforeNodeRemove?(context: PluginContext, node: NodeModel): HookResult<boolean>;

  /** 节点移除后 */
  afterNodeRemove?(context: PluginContext, nodeId: string): void;

  /** 连接创建前 */
  beforeConnect?(
    context: PluginContext,
    params: ConnectionHookParams
  ): HookResult<ConnectionHookParams>;

  /** 连接创建后 */
  afterConnect?(context: PluginContext, connection: ConnectionModel): void;

  /** 连接断开前 */
  beforeDisconnect?(context: PluginContext, connection: ConnectionModel): HookResult<boolean>;

  /** 连接断开后 */
  afterDisconnect?(context: PluginContext, info: ConnectionInfo): void;

  /** 节点拖拽开始前 */
  beforeDragStart?(context: PluginContext, node: NodeModel): HookResult<boolean>;

  /** 节点拖拽中 */
  onDrag?(context: PluginContext, params: DragHookParams): HookResult<Point>;

  /** 节点拖拽结束后 */
  afterDragEnd?(context: PluginContext, node: NodeModel, finalPosition: Point): void;

  /** 视图变化前 */
  beforeViewChange?(
    context: PluginContext,
    newState: ViewState,
    oldState: ViewState
  ): HookResult<ViewState>;

  /** 视图变化后 */
  afterViewChange?(context: PluginContext, state: ViewState): void;

  /** 连接线渲染后 */
  onRenderConnection?(
    context: PluginContext,
    connection: ConnectionModel,
    pathElement: SVGPathElement
  ): void;

  /** 触点渲染后 */
  onRenderDot?(
    context: PluginContext,
    dot: DotModel,
    dotElement: HTMLElement
  ): void;
}

/**
 * 插件实例（安装后的插件）
 */
export interface PluginInstance<T extends PluginOptions = PluginOptions> {
  plugin: PowerLinkPlugin<T>;
  options: T;
  installed: boolean;
}

/**
 * 插件管理器事件
 */
export interface PluginManagerEventMap {
  'plugin:install': { name: string; plugin: PowerLinkPlugin };
  'plugin:uninstall': { name: string };
  'plugin:error': { name: string; error: Error; hook: string };
}

