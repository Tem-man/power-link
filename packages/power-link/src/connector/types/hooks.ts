/**
 * @fileoverview 钩子类型定义
 */

import type { NodeModel, DotModel, ConnectionModel } from '../model';
import type { Point, ViewState, DotPosition, ConnectionInfo } from './index';

// ==================== 序列化状态类型 ====================

/**
 * 节点状态（用于序列化）
 */
export interface NodeState {
  /** 节点 ID */
  id: string;
  /** 节点位置 */
  position: Point;
  /** 触点位置配置 */
  dotPositions: DotPosition[];
  /** 节点附加信息 */
  info?: Record<string, any>;
}

/**
 * 连接状态（用于序列化）
 */
export interface ConnectionState {
  /** 连接 ID */
  id: string;
  /** 起始节点 ID */
  fromNodeId: string;
  /** 目标节点 ID */
  toNodeId: string;
  /** 起始触点位置 */
  fromDot: DotPosition;
  /** 目标触点位置 */
  toDot: DotPosition;
}

/**
 * 连接器状态（用于序列化）
 */
export interface ConnectorState {
  /** 版本号 */
  version: string;
  /** 节点状态列表 */
  nodes: NodeState[];
  /** 连接状态列表 */
  connections: ConnectionState[];
  /** 视图状态 */
  viewState: ViewState;
}

// ==================== 钩子参数类型 ====================

/**
 * 节点注册参数
 */
export interface NodeRegisterParams {
  id: string;
  element: HTMLElement;
  options: {
    dotPositions?: DotPosition[] | 'both';
    info?: Record<string, any>;
  };
}

/**
 * 连接参数
 */
export interface ConnectionParams {
  fromNode: NodeModel;
  toNode: NodeModel;
  fromDot: DotModel;
  toDot: DotModel;
}

/**
 * 视图变化参数
 */
export interface ViewChangeParams {
  oldState: ViewState;
  newState: ViewState;
}

/**
 * 节点拖拽参数
 */
export interface NodeDragParams {
  node: NodeModel;
  startPosition: Point;
  currentPosition: Point;
}

// ==================== 钩子映射类型 ====================

/**
 * Connector 钩子映射
 * 定义所有可用的钩子及其数据类型
 */
export interface ConnectorHooksDefinition {
  // 序列化钩子
  'save': ConnectorState;
  'load': ConnectorState;

  // 节点钩子（可阻止）
  'node:beforeRegister': NodeRegisterParams;
  'node:afterRegister': NodeModel;
  'node:beforeRemove': NodeModel;
  'node:afterRemove': string;

  // 连接钩子（可阻止）
  'connection:beforeCreate': ConnectionParams;
  'connection:afterCreate': ConnectionModel;
  'connection:beforeRemove': ConnectionModel;
  'connection:afterRemove': ConnectionInfo;

  // 视图钩子（可阻止）
  'view:beforeChange': ViewChangeParams;
  'view:afterChange': ViewState;

  // 拖拽钩子
  'drag:beforeStart': NodeModel;
  'drag:move': NodeDragParams;
  'drag:afterEnd': { node: NodeModel; position: Point };

  // 渲染钩子
  'render:connection': { connection: ConnectionModel; element: SVGPathElement };
  'render:dot': { dot: DotModel; element: HTMLElement };
}

