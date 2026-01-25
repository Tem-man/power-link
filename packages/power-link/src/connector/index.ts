/**
 * Connector 模块统一导出
 *
 * 架构说明：
 * - core/: 核心模块（事件系统、配置管理）
 * - types/: TypeScript 类型定义
 * - utils/: 工具函数（几何计算、DOM 操作）
 * - view/: 视图层（视图控制器、SVG 渲染器）
 * - model/: 数据模型层（节点、连接、触点）
 * - interaction/: 交互层（待实现）
 */

// 核心模块
export { EventEmitter, DEFAULT_CONFIG, mergeConfig, validateConfig } from './core';
export type { EventCallback, EventMap } from './core';

// 视图模块
export { ViewportController, SVGRenderer } from './view';
export type { ViewportEventMap, ViewportConfig, LineConfig, DeleteButtonConfig, ConnectionElements } from './view';

// 模型模块
export { DotModel, NodeModel, ConnectionModel } from './model';
export type { DotModelOptions, NodeModelOptions, ConnectionModelOptions, ConnectionRenderElements } from './model';

// 交互模块
export { DragHandler, SnapHandler, ConnectionHandler } from './interaction';
export type {
  DragEventMap, DragHandlerConfig,
  SnapResult, SnapEventMap, SnapHandlerConfig,
  ConnectionEventMap, ConnectionHandlerConfig,
} from './interaction';

// 类型定义
export * from './types';

// 工具函数
export * from './utils';

// 主类（TypeScript 重构版本）
export { Connector } from './Connector';
export { Connector as default } from './Connector';
