/**
 * 连接模型
 * 表示两个节点之间的连接
 */
import type { DotPosition, ConnectionInfo, ConnectionData } from '../types';
import type { NodeModel } from './NodeModel';
import type { DotModel } from './DotModel';

/**
 * 连接模型配置
 */
export interface ConnectionModelOptions {
  /** 连接唯一标识 */
  id: string;
  /** 起始节点 */
  fromNode: NodeModel;
  /** 目标节点 */
  toNode: NodeModel;
  /** 起始触点 */
  fromDot: DotModel;
  /** 目标触点 */
  toDot: DotModel;
}

/**
 * 连接元素（渲染相关）
 */
export interface ConnectionRenderElements {
  /** 连接线 SVG 元素 */
  line: SVGPathElement;
  /** 悬浮检测路径 */
  hoverPath: SVGPathElement;
  /** 删除按钮 */
  deleteButton: HTMLDivElement;
}

/**
 * 连接模型类
 */
export class ConnectionModel {
  /** 连接唯一标识 */
  readonly id: string;

  /** 起始节点 */
  readonly fromNode: NodeModel;

  /** 目标节点 */
  readonly toNode: NodeModel;

  /** 起始触点 */
  readonly fromDot: DotModel;

  /** 目标触点 */
  readonly toDot: DotModel;

  /** 渲染元素（可选，由渲染层管理） */
  private _renderElements: ConnectionRenderElements | null = null;

  constructor(options: ConnectionModelOptions) {
    this.id = options.id;
    this.fromNode = options.fromNode;
    this.toNode = options.toNode;
    this.fromDot = options.fromDot;
    this.toDot = options.toDot;
  }

  /**
   * 获取起始触点位置
   */
  get fromDotPosition(): DotPosition {
    return this.fromDot.position;
  }

  /**
   * 获取目标触点位置
   */
  get toDotPosition(): DotPosition {
    return this.toDot.position;
  }

  /**
   * 获取渲染元素
   */
  get renderElements(): ConnectionRenderElements | null {
    return this._renderElements;
  }

  /**
   * 设置渲染元素
   */
  setRenderElements(elements: ConnectionRenderElements): void {
    this._renderElements = elements;
  }

  /**
   * 清除渲染元素
   */
  clearRenderElements(): void {
    this._renderElements = null;
  }

  /**
   * 获取连接线元素
   */
  get line(): SVGPathElement | null {
    return this._renderElements?.line ?? null;
  }

  /**
   * 获取悬浮路径元素
   */
  get hoverPath(): SVGPathElement | null {
    return this._renderElements?.hoverPath ?? null;
  }

  /**
   * 获取删除按钮元素
   */
  get deleteButton(): HTMLDivElement | null {
    return this._renderElements?.deleteButton ?? null;
  }

  /**
   * 检查连接是否涉及指定节点
   */
  involvesNode(nodeId: string): boolean {
    return this.fromNode.id === nodeId || this.toNode.id === nodeId;
  }

  /**
   * 检查连接是否连接两个指定节点
   */
  connectsNodes(nodeId1: string, nodeId2: string): boolean {
    return (
      (this.fromNode.id === nodeId1 && this.toNode.id === nodeId2) ||
      (this.fromNode.id === nodeId2 && this.toNode.id === nodeId1)
    );
  }

  /**
   * 获取连接中的另一个节点
   */
  getOtherNode(nodeId: string): NodeModel | null {
    if (this.fromNode.id === nodeId) return this.toNode;
    if (this.toNode.id === nodeId) return this.fromNode;
    return null;
  }

  /**
   * 检查是否与另一个连接相同（同样的节点和触点）
   */
  equals(other: ConnectionModel): boolean {
    return (
      (this.fromNode.id === other.fromNode.id &&
        this.toNode.id === other.toNode.id &&
        this.fromDot.position === other.fromDot.position &&
        this.toDot.position === other.toDot.position) ||
      (this.fromNode.id === other.toNode.id &&
        this.toNode.id === other.fromNode.id &&
        this.fromDot.position === other.toDot.position &&
        this.toDot.position === other.fromDot.position)
    );
  }

  /**
   * 检查是否与指定参数匹配（用于查找重复连接）
   */
  matches(
    fromNodeId: string,
    toNodeId: string,
    fromDotPosition: DotPosition,
    toDotPosition: DotPosition
  ): boolean {
    return (
      (this.fromNode.id === fromNodeId &&
        this.toNode.id === toNodeId &&
        this.fromDot.position === fromDotPosition &&
        this.toDot.position === toDotPosition) ||
      (this.fromNode.id === toNodeId &&
        this.toNode.id === fromNodeId &&
        this.fromDot.position === toDotPosition &&
        this.toDot.position === fromDotPosition)
    );
  }

  /**
   * 转换为连接信息（用于回调）
   */
  toConnectionInfo(): ConnectionInfo {
    return {
      from: this.fromNode.id,
      fromInfo: this.fromNode.info,
      to: this.toNode.id,
      toInfo: this.toNode.info,
      fromDot: this.fromDot.position,
      toDot: this.toDot.position,
    };
  }

  /**
   * 转换为连接数据（简化版，用于导出）
   */
  toConnectionData(): ConnectionData {
    return {
      id: this.id,
      from: this.fromNode.id,
      to: this.toNode.id,
      fromDot: this.fromDot.position,
      toDot: this.toDot.position,
    };
  }

  /**
   * 序列化为普通对象
   */
  toJSON(): ConnectionData {
    return this.toConnectionData();
  }

  /**
   * 生成连接 ID
   */
  static generateId(
    fromNodeId: string,
    toNodeId: string,
    fromDotPosition: DotPosition,
    toDotPosition: DotPosition
  ): string {
    return `${fromNodeId}-${toNodeId}-${fromDotPosition}-${toDotPosition}-${Date.now()}`;
  }
}

export default ConnectionModel;

