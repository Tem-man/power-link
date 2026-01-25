/**
 * 连线交互处理器
 * 负责处理连线的拖拽创建交互
 */
import { EventEmitter } from '../core/EventEmitter';
import type { Point, ViewState, DotPosition } from '../types';
import type { NodeModel, DotModel } from '../model';
import type { SnapResult } from './SnapHandler';

/**
 * ConnectionHandler 事件映射
 */
export interface ConnectionEventMap {
  /** 连线拖拽开始 */
  'connection:drag:start': { node: NodeModel; dot: DotModel };
  /** 连线拖拽中 */
  'connection:drag:move': { position: Point; snapped: boolean; snapResult?: SnapResult };
  /** 连线拖拽结束 */
  'connection:drag:end': {
    startNode: NodeModel;
    startDot: DotModel;
    endNode: NodeModel | null;
    endDot: DotModel | null;
    connected: boolean;
  };
  /** 请求创建连接 */
  'connection:request': {
    fromNode: NodeModel;
    toNode: NodeModel;
    fromDot: DotModel;
    toDot: DotModel | null;
  };
}

/**
 * ConnectionHandler 配置
 */
export interface ConnectionHandlerConfig {
  /** 是否启用 */
  enabled: boolean;
}

/**
 * 连线交互处理器类
 */
export class ConnectionHandler extends EventEmitter<ConnectionEventMap> {
  /** 配置 */
  private config: ConnectionHandlerConfig;

  /** 是否正在拖拽连线 */
  private isDragging: boolean = false;

  /** 起始节点 */
  private startNode: NodeModel | null = null;

  /** 起始触点 */
  private startDot: DotModel | null = null;

  /** 临时连线元素 */
  private tempLine: SVGPathElement | null = null;

  /** 获取视图状态的函数 */
  private getViewState: () => ViewState;

  /** 获取容器的函数 */
  private getContainer: () => HTMLElement;

  /** 获取触点位置的函数 */
  private getDotPosition: (element: HTMLElement, position: DotPosition) => Point;

  /** 检查吸附的函数 */
  public checkSnap: ((position: Point, excludeNode: NodeModel) => SnapResult | null) | null = null;

  /** 清除吸附状态的函数 */
  public clearSnap: (() => void) | null = null;

  /** 根据位置获取节点的函数 */
  public getNodeAtPosition: ((x: number, y: number) => NodeModel | null) | null = null;

  /** 创建临时连线的回调 */
  public onCreateTempLine: (() => SVGPathElement) | null = null;

  /** 移除临时连线的回调 */
  public onRemoveTempLine: ((line: SVGPathElement) => void) | null = null;

  /** 更新临时连线的回调 */
  public onUpdateTempLine: ((
    line: SVGPathElement,
    start: Point,
    end: Point,
    startDotPosition: DotPosition
  ) => void) | null = null;

  /** 事件处理函数引用 */
  private handleMouseMove: ((e: MouseEvent) => void) | null = null;
  private handleMouseUp: ((e: MouseEvent) => void) | null = null;

  constructor(
    config: Partial<ConnectionHandlerConfig> = {},
    getViewState: () => ViewState,
    getContainer: () => HTMLElement,
    getDotPosition: (element: HTMLElement, position: DotPosition) => Point
  ) {
    super();

    this.config = {
      enabled: config.enabled !== false,
    };

    this.getViewState = getViewState;
    this.getContainer = getContainer;
    this.getDotPosition = getDotPosition;

    // 绑定事件处理函数
    this.handleMouseMove = this.onMouseMove.bind(this);
    this.handleMouseUp = this.onMouseUp.bind(this);
  }

  /**
   * 检查是否启用
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * 设置启用状态
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * 检查是否正在拖拽
   */
  getIsDragging(): boolean {
    return this.isDragging;
  }

  /**
   * 获取起始节点
   */
  getStartNode(): NodeModel | null {
    return this.startNode;
  }

  /**
   * 获取起始触点
   */
  getStartDot(): DotModel | null {
    return this.startDot;
  }

  /**
   * 为触点绑定连线事件
   */
  bindDotEvents(node: NodeModel, dot: DotModel): void {
    const dotElement = dot.element;

    const handleMouseDown = (e: MouseEvent) => {
      if (!this.config.enabled) return;

      e.preventDefault();
      e.stopPropagation();

      this.startConnectionDrag(node, dot);
    };

    dotElement.addEventListener('mousedown', handleMouseDown);

    // 存储事件处理函数以便后续移除
    (dotElement as any).__connectionHandler = handleMouseDown;
  }

  /**
   * 移除触点的连线事件
   */
  unbindDotEvents(dot: DotModel): void {
    const dotElement = dot.element;
    const handler = (dotElement as any).__connectionHandler;

    if (handler) {
      dotElement.removeEventListener('mousedown', handler);
      delete (dotElement as any).__connectionHandler;
    }
  }

  /**
   * 开始连线拖拽
   */
  private startConnectionDrag(node: NodeModel, dot: DotModel): void {
    this.isDragging = true;
    this.startNode = node;
    this.startDot = dot;

    // 创建临时连线
    if (this.onCreateTempLine) {
      this.tempLine = this.onCreateTempLine();
    }

    // 绑定全局事件
    document.addEventListener('mousemove', this.handleMouseMove!);
    document.addEventListener('mouseup', this.handleMouseUp!);

    // 触发事件
    this.emit('connection:drag:start', { node, dot });
  }

  /**
   * 拖拽移动
   */
  private onMouseMove(e: MouseEvent): void {
    if (!this.isDragging || !this.startNode || !this.startDot) return;

    const startPos = this.getDotPosition(this.startNode.element, this.startDot.position);

    // 将鼠标位置转换为世界坐标
    const container = this.getContainer();
    const containerRect = container.getBoundingClientRect();
    const screenX = e.clientX - containerRect.left;
    const screenY = e.clientY - containerRect.top;

    const viewState = this.getViewState();
    const { scale, translateX, translateY } = viewState;
    let endPos: Point = {
      x: (screenX - translateX) / scale,
      y: (screenY - translateY) / scale,
    };

    // 检查吸附
    let snapped = false;
    let snapResult: SnapResult | undefined;

    if (this.checkSnap) {
      snapResult = this.checkSnap(endPos, this.startNode) ?? undefined;
      if (snapResult) {
        endPos = snapResult.position;
        snapped = true;
      }
    }

    // 更新临时连线
    if (this.tempLine && this.onUpdateTempLine) {
      this.onUpdateTempLine(this.tempLine, startPos, endPos, this.startDot.position);
    }

    // 触发事件
    this.emit('connection:drag:move', { position: endPos, snapped, snapResult });
  }

  /**
   * 拖拽结束
   */
  private onMouseUp(e: MouseEvent): void {
    if (!this.isDragging || !this.startNode || !this.startDot) return;

    const startNode = this.startNode;
    const startDot = this.startDot;

    this.isDragging = false;

    // 获取吸附目标或鼠标位置的目标节点
    let targetNode: NodeModel | null = null;
    let targetDot: DotModel | null = null;

    // 优先使用吸附的目标
    if (this.checkSnap) {
      const viewState = this.getViewState();
      const container = this.getContainer();
      const containerRect = container.getBoundingClientRect();
      const screenX = e.clientX - containerRect.left;
      const screenY = e.clientY - containerRect.top;
      const { scale, translateX, translateY } = viewState;
      const worldPos: Point = {
        x: (screenX - translateX) / scale,
        y: (screenY - translateY) / scale,
      };

      const snapResult = this.checkSnap(worldPos, startNode);
      if (snapResult) {
        targetNode = snapResult.node;
        targetDot = snapResult.dot;
      }
    }

    // 如果没有吸附，尝试获取鼠标位置的节点
    if (!targetNode && this.getNodeAtPosition) {
      targetNode = this.getNodeAtPosition(e.clientX, e.clientY);
    }

    // 清除吸附状态
    if (this.clearSnap) {
      this.clearSnap();
    }

    // 移除临时连线
    if (this.tempLine && this.onRemoveTempLine) {
      this.onRemoveTempLine(this.tempLine);
      this.tempLine = null;
    }

    // 移除全局事件
    document.removeEventListener('mousemove', this.handleMouseMove!);
    document.removeEventListener('mouseup', this.handleMouseUp!);

    // 检查是否成功连接
    const connected = targetNode !== null && targetNode.id !== startNode.id;

    // 触发事件
    this.emit('connection:drag:end', {
      startNode,
      startDot,
      endNode: targetNode,
      endDot: targetDot,
      connected,
    });

    // 如果成功连接，触发创建连接请求
    if (connected && targetNode) {
      this.emit('connection:request', {
        fromNode: startNode,
        toNode: targetNode,
        fromDot: startDot,
        toDot: targetDot,
      });
    }

    // 清理状态
    this.startNode = null;
    this.startDot = null;
  }

  /**
   * 强制停止拖拽
   */
  stopDrag(): void {
    if (this.isDragging) {
      this.isDragging = false;

      // 清除吸附状态
      if (this.clearSnap) {
        this.clearSnap();
      }

      // 移除临时连线
      if (this.tempLine && this.onRemoveTempLine) {
        this.onRemoveTempLine(this.tempLine);
        this.tempLine = null;
      }

      // 移除全局事件
      document.removeEventListener('mousemove', this.handleMouseMove!);
      document.removeEventListener('mouseup', this.handleMouseUp!);

      this.startNode = null;
      this.startDot = null;
    }
  }

  /**
   * 销毁处理器
   */
  destroy(): void {
    this.stopDrag();

    // 移除可能残留的全局事件
    if (this.handleMouseMove) {
      document.removeEventListener('mousemove', this.handleMouseMove);
    }
    if (this.handleMouseUp) {
      document.removeEventListener('mouseup', this.handleMouseUp);
    }

    this.removeAllListeners();
    this.checkSnap = null;
    this.clearSnap = null;
    this.getNodeAtPosition = null;
    this.onCreateTempLine = null;
    this.onRemoveTempLine = null;
    this.onUpdateTempLine = null;
  }
}

export default ConnectionHandler;

