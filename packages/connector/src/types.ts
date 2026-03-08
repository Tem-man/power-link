/**
 * @fileoverview Connector 类型定义
 */

// ==================== 基础类型 ====================

/** 触点位置 */
export type DotPosition = 'left' | 'right';

/** 坐标点 */
export interface Point {
  x: number;
  y: number;
}

/** 视图状态 */
export interface ViewState {
  scale: number;
  translateX: number;
  translateY: number;
}

// ==================== 节点相关 ====================

/** 触点对象 */
export interface Dot {
  element: HTMLDivElement;
  position: DotPosition;
  coords?: Point;
}

/** 节点对象 */
export interface ConnectorNode {
  id: string;
  /** 节点名称 */
  label?: string;
  element: HTMLElement;
  info?: Record<string, unknown>;
  dots: Partial<Record<DotPosition, Dot>>;
  dotPositions: DotPosition[];
  connections: Connection[];
  /** 节点相对于 contentWrapper 的 x 坐标（由库内部维护） */
  x: number;
  /** 节点相对于 contentWrapper 的 y 坐标（由库内部维护） */
  y: number;
}

// ==================== 连接相关 ====================

/** 连接对象 */
export interface Connection {
  id: string;
  fromNode: ConnectorNode;
  toNode: ConnectorNode;
  fromDot: Dot;
  toDot: Dot;
  line: SVGPathElement;
  hoverPath?: SVGPathElement;
  deleteButton: SVGGElement;
}

/** 连接信息（回调 / API 返回用） */
export interface ConnectionInfo {
  id?: string;
  from: string;
  fromInfo?: Record<string, unknown>;
  to: string;
  toInfo?: Record<string, unknown>;
  fromDot: DotPosition;
  toDot: DotPosition;
}

// ==================== 配置相关 ====================

/** 样式与行为配置 */
export interface ConnectorConfig {
  lineColor: string;
  lineWidth: number;
  dotSize: number;
  dotColor: string;
  dotHoverScale: number;
  deleteButtonSize: number;
  enableNodeDrag: boolean;
  snapDistance: number;
  enableSnap: boolean;
  enableZoom: boolean;
  enablePan: boolean;
  minZoom: number;
  maxZoom: number;
  zoomStep: number;
  /** 节点选中时的高亮颜色 */
  selectedBorderColor: string;
}

/** 节点移动信息（拖拽回调用） */
export interface NodeMoveInfo {
  id: string;
  x: number;
  y: number;
}

/** 节点选中信息 */
export interface NodeSelectInfo {
  id: string;
  info?: Record<string, unknown>;
}

/** 节点删除信息 */
export interface NodeDeleteInfo {
  id: string;
  info?: Record<string, unknown>;
}

/** 构造函数选项 */
export interface ConnectorOptions extends Partial<ConnectorConfig> {
  container: HTMLElement;
  onConnect?: (info: ConnectionInfo) => void;
  onDisconnect?: (info: ConnectionInfo) => void;
  onViewChange?: (state: ViewState) => void;
  onNodeMove?: (info: NodeMoveInfo) => void;
  /** 节点被选中/取消选中时触发，取消选中时 info 为 null */
  onNodeSelect?: (info: NodeSelectInfo | null) => void;
  /** 节点被删除时触发 */
  onNodeDelete?: (info: NodeDeleteInfo) => void;
  config?: Partial<ConnectorConfig>;
}

/** 节点注册选项 */
export interface RegisterNodeOptions {
  /** 节点名称 */
  label?: string;
  info?: Record<string, unknown>;
  dotPositions?: 'both' | DotPosition | DotPosition[];
}

/** 静默操作选项 */
export interface SilentOptions {
  silent?: boolean;
}

// ==================== 导入导出相关 ====================

/** 导出的单个节点数据 */
export interface ExportNodeData {
  id: string;
  /** 节点名称 */
  label?: string;
  x: number;
  y: number;
  info?: Record<string, unknown>;
  dotPositions: DotPosition[];
}

/** 导出的单条连接数据 */
export interface ExportConnectionData {
  from: string;
  /** from 节点名称 */
  fromLabel?: string;
  /** from 节点附加信息 */
  fromInfo?: Record<string, unknown>;
  to: string;
  /** to 节点名称 */
  toLabel?: string;
  /** to 节点附加信息 */
  toInfo?: Record<string, unknown>;
  fromDot: DotPosition;
  toDot: DotPosition;
}

/** export() 返回的完整拓扑数据 */
export interface ExportData {
  nodes: ExportNodeData[];
  connections: ExportConnectionData[];
  /** 视图状态（缩放、平移），可选 */
  viewState?: ViewState;
}

/**
 * 节点工厂函数（用于 import() 的原生 JS 场景）
 * 接收节点数据，返回对应的 HTMLElement（或 Promise）
 * 库会负责定位和挂载，工厂只需构建元素结构
 */
export type NodeFactory = (
  nodeData: ExportNodeData,
) => HTMLElement | Promise<HTMLElement>;

// ==================== 吸附相关 ====================

/** 吸附检测结果 */
export interface SnapResult {
  node: ConnectorNode;
  dot: Dot;
  position: Point;
}

// ==================== 共享上下文 ====================

/** 共享上下文（模块间通信） */
export interface ConnectorContext {
  container: HTMLElement;
  contentWrapper: HTMLDivElement;
  svg: SVGSVGElement;
  nodes: ConnectorNode[];
  connections: Connection[];
  viewState: ViewState;
  config: ConnectorConfig;
  /** 连接回调 */
  onConnect: (info: ConnectionInfo) => void;
  /** 断开回调 */
  onDisconnect: (info: ConnectionInfo) => void;
  /** 视图变化回调 */
  onViewChange: (state: ViewState) => void;
  /** 节点移动回调 */
  onNodeMove: (info: NodeMoveInfo) => void;
  /** 节点选中/取消选中回调 */
  onNodeSelect: (info: NodeSelectInfo | null) => void;
  /** 节点删除回调 */
  onNodeDelete: (info: NodeDeleteInfo) => void;
}
