/**
 * 节点模型
 * 表示可连接的节点
 */
import type { DotPosition } from '../types';
import { DotModel } from './DotModel';
import type { ConnectionModel } from './ConnectionModel';

/**
 * 节点模型配置
 */
export interface NodeModelOptions {
  /** 节点唯一标识 */
  id: string;
  /** 节点 DOM 元素 */
  element: HTMLElement;
  /** 节点附加信息 */
  info?: Record<string, any>;
  /** 触点位置配置 */
  dotPositions?: DotPosition[];
}

/**
 * 节点模型类
 */
export class NodeModel {
  /** 节点唯一标识 */
  readonly id: string;

  /** 节点 DOM 元素 */
  readonly element: HTMLElement;

  /** 节点附加信息 */
  info?: Record<string, any>;

  /** 触点映射 */
  private _dots: Map<DotPosition, DotModel> = new Map();

  /** 触点位置列表 */
  private _dotPositions: DotPosition[] = [];

  /** 节点的所有连接 */
  private _connections: ConnectionModel[] = [];

  constructor(options: NodeModelOptions) {
    this.id = options.id;
    this.element = options.element;
    this.info = options.info;
    this._dotPositions = options.dotPositions ?? [];
  }

  /**
   * 获取所有触点位置
   */
  get dotPositions(): DotPosition[] {
    return [...this._dotPositions];
  }

  /**
   * 获取所有触点（只读）
   */
  get dots(): ReadonlyMap<DotPosition, DotModel> {
    return this._dots;
  }

  /**
   * 获取触点对象（兼容旧 API）
   */
  get dotsObject(): Record<DotPosition, DotModel> {
    const result: Partial<Record<DotPosition, DotModel>> = {};
    this._dots.forEach((dot, position) => {
      result[position] = dot;
    });
    return result as Record<DotPosition, DotModel>;
  }

  /**
   * 获取所有连接（只读）
   */
  get connections(): readonly ConnectionModel[] {
    return this._connections;
  }

  /**
   * 添加触点
   */
  addDot(position: DotPosition, element: HTMLDivElement): DotModel {
    if (this._dots.has(position)) {
      throw new Error(`触点 ${position} 已存在`);
    }

    const dot = new DotModel({ position, element });
    this._dots.set(position, dot);

    if (!this._dotPositions.includes(position)) {
      this._dotPositions.push(position);
    }

    return dot;
  }

  /**
   * 获取指定位置的触点
   */
  getDot(position: DotPosition): DotModel | undefined {
    return this._dots.get(position);
  }

  /**
   * 获取左侧触点
   */
  getLeftDot(): DotModel | undefined {
    return this._dots.get('left');
  }

  /**
   * 获取右侧触点
   */
  getRightDot(): DotModel | undefined {
    return this._dots.get('right');
  }

  /**
   * 获取第一个可用的触点
   */
  getFirstDot(): DotModel | undefined {
    return this._dots.values().next().value;
  }

  /**
   * 检查是否有指定位置的触点
   */
  hasDot(position: DotPosition): boolean {
    return this._dots.has(position);
  }

  /**
   * 获取触点数量
   */
  getDotCount(): number {
    return this._dots.size;
  }

  /**
   * 添加连接
   */
  addConnection(connection: ConnectionModel): void {
    if (!this._connections.includes(connection)) {
      this._connections.push(connection);
    }
  }

  /**
   * 移除连接
   */
  removeConnection(connection: ConnectionModel): void {
    const index = this._connections.indexOf(connection);
    if (index !== -1) {
      this._connections.splice(index, 1);
    }
  }

  /**
   * 移除指定 ID 的连接
   */
  removeConnectionById(connectionId: string): void {
    this._connections = this._connections.filter(c => c.id !== connectionId);
  }

  /**
   * 获取连接数量
   */
  getConnectionCount(): number {
    return this._connections.length;
  }

  /**
   * 检查是否已连接到指定节点
   */
  isConnectedTo(nodeId: string): boolean {
    return this._connections.some(
      c => c.fromNode.id === nodeId || c.toNode.id === nodeId
    );
  }

  /**
   * 获取与指定节点的所有连接
   */
  getConnectionsTo(nodeId: string): ConnectionModel[] {
    return this._connections.filter(
      c => c.fromNode.id === nodeId || c.toNode.id === nodeId
    );
  }

  /**
   * 清除所有触点的坐标缓存
   */
  clearDotCoordsCache(): void {
    this._dots.forEach(dot => dot.clearCoordsCache());
  }

  /**
   * 遍历所有触点
   */
  forEachDot(callback: (dot: DotModel, position: DotPosition) => void): void {
    this._dots.forEach((dot, position) => callback(dot, position));
  }

  /**
   * 序列化为普通对象
   */
  toJSON(): {
    id: string;
    info?: Record<string, any>;
    dotPositions: DotPosition[];
    connectionCount: number;
  } {
    return {
      id: this.id,
      info: this.info,
      dotPositions: this._dotPositions,
      connectionCount: this._connections.length,
    };
  }
}

export default NodeModel;

