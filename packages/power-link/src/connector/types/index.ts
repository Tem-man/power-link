/**
 * Connector 类型定义
 */

// ==================== 基础类型 ====================

/**
 * 二维坐标点
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * 矩形区域
 */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 触点位置
 */
export type DotPosition = 'left' | 'right';

// ==================== 配置类型 ====================

/**
 * 连接器配置选项
 */
export interface ConnectorConfig {
  /** 连线颜色 */
  lineColor: string;
  /** 连线宽度 */
  lineWidth: number;
  /** 触点大小 */
  dotSize: number;
  /** 触点颜色 */
  dotColor: string;
  /** 触点悬浮缩放比例 */
  dotHoverScale: number;
  /** 删除按钮大小 */
  deleteButtonSize: number;
  /** 是否启用节点拖拽 */
  enableNodeDrag: boolean;
  /** 吸附距离（像素） */
  snapDistance: number;
  /** 是否启用吸附 */
  enableSnap: boolean;
  /** 是否启用缩放 */
  enableZoom: boolean;
  /** 是否启用平移 */
  enablePan: boolean;
  /** 最小缩放比例 */
  minZoom: number;
  /** 最大缩放比例 */
  maxZoom: number;
  /** 缩放步长 */
  zoomStep: number;
}

/**
 * 连接器初始化选项
 */
export interface ConnectorOptions extends Partial<ConnectorConfig> {
  /** 容器元素 */
  container: HTMLElement;
  /** 连接建立回调 */
  onConnect?: (info: ConnectionInfo) => void;
  /** 连接断开回调 */
  onDisconnect?: (info: ConnectionInfo) => void;
  /** 视图变化回调 */
  onViewChange?: (state: ViewState) => void;
  /** 额外配置 */
  config?: Partial<ConnectorConfig>;
}

// ==================== 视图状态 ====================

/**
 * 视图变换状态
 */
export interface ViewState {
  /** 缩放比例 */
  scale: number;
  /** X 轴平移 */
  translateX: number;
  /** Y 轴平移 */
  translateY: number;
}

// ==================== 节点相关 ====================

/**
 * 触点信息
 */
export interface DotInfo {
  /** 触点 DOM 元素 */
  element: HTMLDivElement;
  /** 触点位置 */
  position: DotPosition;
  /** 触点坐标（可选，用于缓存） */
  coords?: Point;
}

/**
 * 节点注册选项
 */
export interface NodeOptions {
  /** 节点附加信息 */
  info?: Record<string, any>;
  /**
   * 触点位置配置
   * - 'both': 左右都有触点
   * - ['left', 'right']: 数组形式
   * - ['left']: 只有左侧触点
   * - ['right']: 只有右侧触点
   */
  dotPositions?: 'both' | DotPosition[];
}

// 注意：NodeModel 和 ConnectionModel 类已在 model/ 目录中定义
// 以下接口仅用于兼容旧代码的类型检查

/**
 * 节点模型接口（兼容类型）
 * @deprecated 请使用 model/NodeModel 类
 */
export interface INodeModelLegacy {
  /** 节点唯一标识 */
  id: string;
  /** 节点 DOM 元素 */
  element: HTMLElement;
  /** 节点附加信息 */
  info?: Record<string, any>;
  /** 触点映射 */
  dots: Record<DotPosition, DotInfo>;
  /** 触点位置列表 */
  dotPositions: DotPosition[];
}

// ==================== 连接相关 ====================

/**
 * 连接模型接口（兼容类型）
 * @deprecated 请使用 model/ConnectionModel 类
 */
export interface IConnectionModelLegacy {
  /** 连接唯一标识 */
  id: string;
  /** 起始触点 */
  fromDot: DotInfo;
  /** 目标触点 */
  toDot: DotInfo;
  /** 连接线 SVG 元素 */
  line: SVGPathElement;
  /** 悬浮检测路径 */
  hoverPath?: SVGPathElement;
  /** 删除按钮 */
  deleteButton: HTMLDivElement;
}

/**
 * 连接信息（用于回调）
 */
export interface ConnectionInfo {
  /** 起始节点 ID */
  from: string;
  /** 起始节点附加信息 */
  fromInfo?: Record<string, any>;
  /** 目标节点 ID */
  to: string;
  /** 目标节点附加信息 */
  toInfo?: Record<string, any>;
  /** 起始触点位置 */
  fromDot: DotPosition;
  /** 目标触点位置 */
  toDot: DotPosition;
}

/**
 * 连接数据（简化版，用于导出）
 */
export interface ConnectionData {
  /** 连接唯一标识 */
  id: string;
  /** 起始节点 ID */
  from: string;
  /** 目标节点 ID */
  to: string;
  /** 起始触点位置 */
  fromDot: DotPosition;
  /** 目标触点位置 */
  toDot: DotPosition;
}

// ==================== 吸附相关 ====================

// 注意：SnapResult 已在 interaction/SnapHandler 中定义

// ==================== 事件类型 ====================

/**
 * Connector 事件映射
 * 注意：node 和 dot 类型使用 any 以兼容 model 中的类
 */
export interface ConnectorEventMap {
  /** 连接建立 */
  'connect': ConnectionInfo;
  /** 连接断开 */
  'disconnect': ConnectionInfo;
  /** 视图变化 */
  'view:change': ViewState;
  /** 节点注册 */
  'node:register': { id: string; node: any };
  /** 节点移除 */
  'node:unregister': { id: string };
  /** 节点拖拽开始 */
  'node:drag:start': { node: any; position: Point };
  /** 节点拖拽中 */
  'node:drag:move': { node: any; position: Point };
  /** 节点拖拽结束 */
  'node:drag:end': { node: any; position: Point };
  /** 连线拖拽开始 */
  'connection:drag:start': { node: any; dot: any };
  /** 连线拖拽中 */
  'connection:drag:move': { position: Point; snapped: boolean };
  /** 连线拖拽结束 */
  'connection:drag:end': { connected: boolean };
}

// ==================== 工具类型 ====================

/**
 * 贝塞尔曲线控制点
 */
export interface BezierControlPoints {
  /** 起点 */
  start: Point;
  /** 控制点1 */
  cp1: Point;
  /** 控制点2 */
  cp2: Point;
  /** 终点 */
  end: Point;
}

/**
 * 方向向量
 */
export type Direction = 1 | -1;

// ==================== 插件类型 ====================

export type {
  PowerLinkPlugin,
  PluginContext,
  PluginOptions,
  PluginInstance,
  PluginManagerEventMap,
  ConnectionHookParams,
  DragHookParams,
  HookResult,
} from './plugin';

// ==================== 钩子类型 ====================

export type {
  NodeState,
  ConnectionState,
  ConnectorState,
  NodeRegisterParams,
  ConnectionParams,
  ViewChangeParams,
  NodeDragParams,
  ConnectorHooksDefinition,
} from './hooks';

