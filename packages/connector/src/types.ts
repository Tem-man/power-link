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
  element: HTMLElement;
  info?: Record<string, unknown>;
  dots: Partial<Record<DotPosition, Dot>>;
  dotPositions: DotPosition[];
  connections: Connection[];
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
  deleteButton: HTMLDivElement;
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
}

/** 构造函数选项 */
export interface ConnectorOptions extends Partial<ConnectorConfig> {
  container: HTMLElement;
  onConnect?: (info: ConnectionInfo) => void;
  onDisconnect?: (info: ConnectionInfo) => void;
  onViewChange?: (state: ViewState) => void;
  config?: Partial<ConnectorConfig>;
}

/** 节点注册选项 */
export interface RegisterNodeOptions {
  info?: Record<string, unknown>;
  dotPositions?: 'both' | DotPosition[];
}

/** 静默操作选项 */
export interface SilentOptions {
  silent?: boolean;
}

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
}

