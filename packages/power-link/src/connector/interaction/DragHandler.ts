/**
 * 节点拖拽处理器
 * 负责处理节点的拖拽交互
 */
import { EventEmitter } from '../core/EventEmitter';
import type { Point, ViewState } from '../types';
import type { NodeModel } from '../model';

/**
 * DragHandler 事件映射
 */
export interface DragEventMap {
  /** 拖拽开始 */
  'drag:start': { node: NodeModel; position: Point };
  /** 拖拽中 */
  'drag:move': { node: NodeModel; position: Point };
  /** 拖拽结束 */
  'drag:end': { node: NodeModel; position: Point };
}

/**
 * DragHandler 配置
 */
export interface DragHandlerConfig {
  /** 是否启用节点拖拽 */
  enabled: boolean;
}

/**
 * 节点拖拽处理器类
 */
export class DragHandler extends EventEmitter<DragEventMap> {
  /** 配置 */
  private config: DragHandlerConfig;

  /** 是否正在拖拽节点 */
  private isDragging: boolean = false;

  /** 当前拖拽的节点 */
  private draggedNode: NodeModel | null = null;

  /** 拖拽偏移量 */
  private dragOffset: Point = { x: 0, y: 0 };

  /** 获取视图状态的函数 */
  private getViewState: () => ViewState;

  /** 获取内容包装器的函数 */
  private getContentWrapper: () => HTMLElement | null;

  /** 节点连接更新回调 */
  public onNodePositionChange: ((nodeId: string) => void) | null = null;

  /** 事件处理函数引用 */
  private handleMouseMove: ((e: MouseEvent) => void) | null = null;
  private handleMouseUp: (() => void) | null = null;

  constructor(
    config: Partial<DragHandlerConfig> = {},
    getViewState: () => ViewState,
    getContentWrapper: () => HTMLElement | null
  ) {
    super();

    this.config = {
      enabled: config.enabled !== false,
    };

    this.getViewState = getViewState;
    this.getContentWrapper = getContentWrapper;

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
   * 获取当前拖拽的节点
   */
  getDraggedNode(): NodeModel | null {
    return this.draggedNode;
  }

  /**
   * 为节点绑定拖拽事件
   */
  bindNodeDragEvents(node: NodeModel): void {
    if (!this.config.enabled) return;

    const element = node.element;

    const handleMouseDown = (e: MouseEvent) => {
      // 如果点击的是连接点，不处理节点拖拽
      if ((e.target as HTMLElement).classList.contains('connector-dot')) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      this.startDrag(node, e);
    };

    element.addEventListener('mousedown', handleMouseDown);

    // 存储事件处理函数以便后续移除
    (element as any).__dragHandler = handleMouseDown;
  }

  /**
   * 移除节点的拖拽事件
   */
  unbindNodeDragEvents(node: NodeModel): void {
    const element = node.element;
    const handler = (element as any).__dragHandler;

    if (handler) {
      element.removeEventListener('mousedown', handler);
      delete (element as any).__dragHandler;
    }
  }

  /**
   * 开始拖拽
   */
  private startDrag(node: NodeModel, e: MouseEvent): void {
    const contentWrapper = this.getContentWrapper();
    if (!contentWrapper) return;

    const viewState = this.getViewState();
    const element = node.element;
    const rect = element.getBoundingClientRect();
    const wrapperRect = contentWrapper.getBoundingClientRect();
    const { scale } = viewState;

    this.isDragging = true;
    this.draggedNode = node;

    // 计算鼠标在节点内的偏移量（相对于节点左上角，需要除以缩放比例）
    this.dragOffset = {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };

    // 将当前位置转换为 left/top 定位，避免拖拽时跳动
    const currentLeft = (rect.left - wrapperRect.left) / scale;
    const currentTop = (rect.top - wrapperRect.top) / scale;

    element.style.left = `${currentLeft}px`;
    element.style.top = `${currentTop}px`;
    element.style.right = '';
    element.style.bottom = '';

    // 绑定全局事件
    document.addEventListener('mousemove', this.handleMouseMove!);
    document.addEventListener('mouseup', this.handleMouseUp!);

    // 触发事件
    this.emit('drag:start', {
      node,
      position: { x: currentLeft, y: currentTop }
    });
  }

  /**
   * 拖拽移动
   */
  private onMouseMove(e: MouseEvent): void {
    if (!this.isDragging || !this.draggedNode) return;

    const contentWrapper = this.getContentWrapper();
    if (!contentWrapper) return;

    const viewState = this.getViewState();
    const wrapperRect = contentWrapper.getBoundingClientRect();
    const { scale } = viewState;

    // 计算新位置：(鼠标位置 - wrapper偏移) / 缩放比例 - 鼠标在节点内的偏移
    const newX = (e.clientX - wrapperRect.left) / scale - this.dragOffset.x;
    const newY = (e.clientY - wrapperRect.top) / scale - this.dragOffset.y;

    // 更新节点位置
    this.draggedNode.element.style.left = `${newX}px`;
    this.draggedNode.element.style.top = `${newY}px`;

    // 触发位置变化回调
    if (this.onNodePositionChange) {
      this.onNodePositionChange(this.draggedNode.id);
    }

    // 触发事件
    this.emit('drag:move', {
      node: this.draggedNode,
      position: { x: newX, y: newY }
    });
  }

  /**
   * 拖拽结束
   */
  private onMouseUp(): void {
    if (!this.isDragging || !this.draggedNode) return;

    const node = this.draggedNode;
    const element = node.element;
    const position = {
      x: parseFloat(element.style.left) || 0,
      y: parseFloat(element.style.top) || 0,
    };

    this.isDragging = false;
    this.draggedNode = null;

    // 移除全局事件
    document.removeEventListener('mousemove', this.handleMouseMove!);
    document.removeEventListener('mouseup', this.handleMouseUp!);

    // 触发事件
    this.emit('drag:end', { node, position });
  }

  /**
   * 强制停止拖拽
   */
  stopDrag(): void {
    if (this.isDragging) {
      this.onMouseUp();
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
    this.onNodePositionChange = null;
  }
}

export default DragHandler;

