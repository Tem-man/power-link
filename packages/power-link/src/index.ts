/**
 * @fileoverview power-link 连线器工具库入口文件
 * @description 导出 Connector 类及相关工具函数、类型定义
 */

// 主类（TypeScript 重构版本）
import { Connector } from './connector/Connector';

// 核心模块
export {
  EventEmitter,
  DEFAULT_CONFIG,
  mergeConfig,
  validateConfig,
  PluginManager,
  // 钩子类
  SequentialHook,
  PreventableHook,
  ParallelHook,
  createConnectorHooks,
  clearAllHooks,
} from './connector/core';
export type {
  EventCallback,
  EventMap,
  // 钩子类型
  HookCallback,
  PreventableHookCallback,
  HookResult as CoreHookResult,
  IConnectorHooks,
} from './connector/core';

// 视图模块
export { ViewportController, SVGRenderer } from './connector/view';
export type { ViewportEventMap, ViewportConfig, LineConfig, DeleteButtonConfig, ConnectionElements } from './connector/view';

// 模型模块
export { DotModel, NodeModel, ConnectionModel } from './connector/model';
export type { DotModelOptions, NodeModelOptions, ConnectionModelOptions, ConnectionRenderElements } from './connector/model';

// 交互模块
export { DragHandler, SnapHandler, ConnectionHandler } from './connector/interaction';
export type {
  DragEventMap, DragHandlerConfig,
  SnapResult, SnapEventMap, SnapHandlerConfig,
  ConnectionEventMap, ConnectionHandlerConfig,
} from './connector/interaction';

// 类型定义
export type {
  // 基础类型
  Point,
  Rect,
  DotPosition,
  // 配置类型
  ConnectorConfig,
  ConnectorOptions,
  // 视图状态
  ViewState,
  // 节点相关
  DotInfo,
  NodeOptions,
  // 连接相关
  ConnectionInfo,
  ConnectionData,
  // 事件类型
  ConnectorEventMap,
  // 工具类型
  BezierControlPoints,
  Direction,
  // 兼容类型
  INodeModelLegacy,
  IConnectionModelLegacy,
  // 插件类型
  PowerLinkPlugin,
  PluginContext,
  PluginOptions,
  PluginInstance,
  PluginManagerEventMap,
  ConnectionHookParams,
  DragHookParams,
  HookResult,
  // 序列化类型
  NodeState,
  ConnectionState,
  ConnectorState,
  // 钩子参数类型
  NodeRegisterParams,
  ConnectionParams,
  ViewChangeParams,
  NodeDragParams,
  ConnectorHooksDefinition,
} from './connector/types';

// 工具函数
export {
  // 几何计算
  calculateDistance,
  getBezierControlPoints,
  createBezierPath,
  getPointOnBezier,
  getBezierMidPoint,
  isPointInRect,
  clamp,
  lerp,
  lerpPoint,
  // DOM 工具
  getElementCenter,
  getDotPosition,
  screenToSVG,
  svgToScreen,
  getMousePosition,
  createSVGElement,
  setStyles,
  hasClass,
  isPointInElement,
  getComputedPosition,
  ensurePositioned,
  removeElement,
  debounce,
} from './connector/utils';

// 官方插件
export {
  HistoryPlugin,
  ValidationPlugin,
  createValidationPlugin,
} from './plugins';
export type { HistoryPluginOptions, ValidationPluginOptions, ValidationRule } from './plugins';

// 导出 Connector（同时支持默认导出和命名导出）
export { Connector };
export default Connector;
