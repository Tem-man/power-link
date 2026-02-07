/**
 * @fileoverview 节点管理器
 * @description 负责节点注册、触点创建、节点拖拽、连线拖拽等
 */

import type {
  ConnectorContext,
  ConnectorNode,
  Dot,
  DotPosition,
  RegisterNodeOptions,
} from './types';
import type { PositionHelper } from './PositionHelper';
import type { ConnectionManager } from './ConnectionManager';
import type { SnapManager } from './SnapManager';
import type { ViewManager } from './ViewManager';

export class NodeManager {
  private ctx: ConnectorContext;
  private positionHelper: PositionHelper;
  private connectionManager!: ConnectionManager;
  private snapManager!: SnapManager;
  private viewManager!: ViewManager;

  // 连线拖拽状态
  private isDragging = false;
  private startNode: ConnectorNode | null = null;
  private startDot: Dot | null = null;
  private tempLine: SVGPathElement | null = null;

  // 节点拖拽状态
  private isDraggingNode = false;
  private draggedNode: ConnectorNode | null = null;
  private dragOffset: { x: number; y: number } = { x: 0, y: 0 };

  // 事件处理函数引用（箭头函数，用于移除监听）
  private handleMouseMove = (e: MouseEvent): void => {
    if (!this.isDragging) return;
    this.updateTempLine(e);
  };

  private handleMouseUp = (e: MouseEvent): void => {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.viewManager.isDragging = false;

    // 优先使用吸附的目标节点
    let targetNode = this.snapManager.isSnapped
      ? this.snapManager.snapTarget
      : this.positionHelper.getNodeAtPosition(e.clientX, e.clientY);
    const targetDot = this.snapManager.isSnapped ? this.snapManager.snapTargetDot : null;

    if (targetNode && this.startNode && targetNode.id !== this.startNode.id) {
      this.connectionManager.createConnection(
        this.startNode,
        targetNode,
        this.startDot,
        targetDot,
      );
    }

    // 清除吸附状态
    this.snapManager.resetState();
    this.startDot = null;

    // 移除临时连线
    if (this.tempLine) {
      this.ctx.svg.removeChild(this.tempLine);
      this.tempLine = null;
    }

    // 移除事件监听
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
  };

  private handleNodeDragMove = (e: MouseEvent): void => {
    if (!this.isDraggingNode || !this.draggedNode) return;

    const wrapperRect = this.ctx.contentWrapper.getBoundingClientRect();
    const { scale } = this.ctx.viewState;

    // 计算新位置
    const newX = (e.clientX - wrapperRect.left) / scale - this.dragOffset.x;
    const newY = (e.clientY - wrapperRect.top) / scale - this.dragOffset.y;

    // 更新节点位置
    this.draggedNode.element.style.left = `${newX}px`;
    this.draggedNode.element.style.top = `${newY}px`;

    // 更新所有与该节点相关的连线
    this.connectionManager.updateNodeConnections(this.draggedNode.id);
  };

  private handleNodeDragEnd = (): void => {
    this.isDraggingNode = false;
    this.viewManager.isDraggingNode = false;
    this.draggedNode = null;

    document.removeEventListener('mousemove', this.handleNodeDragMove);
    document.removeEventListener('mouseup', this.handleNodeDragEnd);
  };

  constructor(ctx: ConnectorContext, positionHelper: PositionHelper) {
    this.ctx = ctx;
    this.positionHelper = positionHelper;
  }

  /**
   * 延迟注入依赖，解决循环依赖
   */
  setManagers(
    connectionManager: ConnectionManager,
    snapManager: SnapManager,
    viewManager: ViewManager,
  ): void {
    this.connectionManager = connectionManager;
    this.snapManager = snapManager;
    this.viewManager = viewManager;
  }

  // ==================== 节点注册 ====================

  /**
   * 注册节点
   * @param id - 节点唯一标识
   * @param element - 节点 DOM 元素
   * @param options - 节点配置选项
   */
  registerNode(
    id: string,
    element: HTMLElement,
    options: RegisterNodeOptions = {},
  ): ConnectorNode | undefined {
    // 检查是否已存在
    if (this.ctx.nodes.find((n) => n.id === id)) {
      console.warn(`节点 ${id} 已存在`);
      return undefined;
    }

    // 处理触点位置配置
    let dotPositions: DotPosition[] = [];

    if (options.dotPositions === 'both') {
      dotPositions = ['left', 'right'];
    } else if (Array.isArray(options.dotPositions)) {
      dotPositions = options.dotPositions.filter(
        (pos): pos is DotPosition => pos === 'left' || pos === 'right',
      );
    } else {
      // 默认：第一个节点右侧，其他节点左侧
      dotPositions = [this.ctx.nodes.length === 0 ? 'right' : 'left'];
    }

    // 限制最多两个触点，且只能是 left 和 right（去重）
    dotPositions = [...new Set(dotPositions)].slice(0, 2) as DotPosition[];

    // 创建所有连接点
    const dots: Partial<Record<DotPosition, Dot>> = {};
    dotPositions.forEach((position) => {
      const dot = this.createDot(position);
      element.appendChild(dot);
      dots[position] = {
        element: dot,
        position,
      };
    });

    const node: ConnectorNode = {
      id,
      element,
      info: options.info,
      dots,
      dotPositions,
      connections: [],
    };

    this.ctx.nodes.push(node);

    // 为每个连接点绑定事件
    Object.values(dots).forEach((dot) => {
      if (dot) {
        this.bindDotEvents(node, dot);
      }
    });

    // 绑定节点拖拽事件
    if (this.ctx.config.enableNodeDrag) {
      this.bindNodeDragEvents(node);
    }

    return node;
  }

  // ==================== 触点 ====================

  /**
   * 创建连接点
   * @param dotPosition - 触点位置 'left' 或 'right'
   */
  private createDot(dotPosition: DotPosition): HTMLDivElement {
    const dot = document.createElement('div');
    dot.className = 'connector-dot';

    const position =
      dotPosition === 'right'
        ? `right: -${this.ctx.config.dotSize / 2}px;`
        : `left: -${this.ctx.config.dotSize / 2}px;`;

    dot.style.cssText = `
      position: absolute;
      width: ${this.ctx.config.dotSize}px;
      height: ${this.ctx.config.dotSize}px;
      background-color: ${this.ctx.config.dotColor};
      border: 2px solid white;
      border-radius: 50%;
      cursor: pointer;
      ${position}
      top: 50%;
      transform: translateY(-50%);
      z-index: 10;
      transition: transform 0.2s;
    `;

    // 保存基础 transform 用于悬浮效果
    dot.dataset.baseTransform = 'translateY(-50%)';

    // 悬浮效果
    dot.addEventListener('mouseenter', () => {
      dot.style.transform = `translateY(-50%) scale(${this.ctx.config.dotHoverScale})`;
    });
    dot.addEventListener('mouseleave', () => {
      dot.style.transform = 'translateY(-50%) scale(1)';
    });

    return dot;
  }

  // ==================== 事件绑定 ====================

  /**
   * 绑定连接点事件（开始拖拽连线）
   */
  private bindDotEvents(node: ConnectorNode, dot: Dot): void {
    const dotElement = dot.element;

    dotElement.addEventListener('mousedown', (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      this.isDragging = true;
      this.viewManager.isDragging = true;
      this.startNode = node;
      this.startDot = dot;

      // 创建临时连线
      this.tempLine = this.connectionManager.createLine();
      this.ctx.svg.appendChild(this.tempLine);

      // 更新临时连线
      this.updateTempLine(e);

      // 绑定移动和释放事件
      document.addEventListener('mousemove', this.handleMouseMove);
      document.addEventListener('mouseup', this.handleMouseUp);
    });
  }

  /**
   * 绑定节点拖拽事件
   */
  private bindNodeDragEvents(node: ConnectorNode): void {
    const { element } = node;

    element.addEventListener('mousedown', (e: MouseEvent) => {
      // 如果点击的是连接点，不处理节点拖拽
      if ((e.target as HTMLElement).classList.contains('connector-dot')) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      this.isDraggingNode = true;
      this.viewManager.isDraggingNode = true;
      this.draggedNode = node;

      const rect = element.getBoundingClientRect();
      const wrapperRect = this.ctx.contentWrapper.getBoundingClientRect();
      const { scale } = this.ctx.viewState;

      // 计算鼠标在节点内的偏移量
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

      // 绑定移动和释放事件
      document.addEventListener('mousemove', this.handleNodeDragMove);
      document.addEventListener('mouseup', this.handleNodeDragEnd);
    });
  }

  // ==================== 临时连线 ====================

  /**
   * 更新临时连线
   */
  private updateTempLine(e: MouseEvent): void {
    if (!this.tempLine || !this.startNode || !this.startDot) return;

    const startPos = this.positionHelper.getDotPosition(
      this.startNode.element,
      this.startDot.position,
    );

    // 将鼠标位置转换为 SVG 坐标
    const containerRect = this.ctx.container.getBoundingClientRect();
    const screenX = e.clientX - containerRect.left;
    const screenY = e.clientY - containerRect.top;

    const { scale, translateX, translateY } = this.ctx.viewState;
    let endPos = {
      x: (screenX - translateX) / scale,
      y: (screenY - translateY) / scale,
    };

    // 检查吸附
    if (this.ctx.config.enableSnap) {
      const snapResult = this.snapManager.checkSnap(endPos, this.startNode);
      if (snapResult) {
        endPos = snapResult.position;
        this.snapManager.snapTarget = snapResult.node;
        this.snapManager.snapTargetDot = snapResult.dot;
        this.snapManager.isSnapped = true;

        // 高亮吸附目标
        this.snapManager.highlightSnapTarget(snapResult.node, snapResult.dot);
      } else {
        this.snapManager.isSnapped = false;
        this.snapManager.clearSnapHighlight();
        this.snapManager.snapTarget = null;
        this.snapManager.snapTargetDot = null;
      }
    }

    this.connectionManager.updateLine(this.tempLine, startPos, endPos, this.startDot.position);
  }

  // ==================== 节点位置更新 ====================

  /**
   * 更新节点位置（当节点移动时调用）
   */
  updateNodePosition(nodeId: string): void {
    const node = this.ctx.nodes.find((n) => n.id === nodeId);
    if (node) {
      if (node.dots) {
        Object.values(node.dots).forEach((dot) => {
          if (dot) {
            dot.coords = this.positionHelper.getDotPosition(node.element, dot.position);
          }
        });
      }
      this.connectionManager.updateNodeConnections(nodeId);
    }
  }

  // ==================== 销毁 ====================

  /**
   * 销毁节点管理器，移除事件监听和触点元素
   */
  destroy(): void {
    // 移除所有连接点
    this.ctx.nodes.forEach((node) => {
      if (node.dots) {
        Object.values(node.dots).forEach((dot) => {
          if (dot && dot.element && dot.element.parentNode) {
            dot.element.parentNode.removeChild(dot.element);
          }
        });
      }
    });

    // 移除事件监听
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('mousemove', this.handleNodeDragMove);
    document.removeEventListener('mouseup', this.handleNodeDragEnd);
  }
}

