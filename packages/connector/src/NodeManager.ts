/**
 * @fileoverview 节点管理器
 * @description 负责节点注册、触点创建、节点拖拽、连线拖拽、节点选中与删除等
 */

import type {
  ConnectorContext,
  ConnectorNode,
  Dot,
  DotPosition,
  RegisterNodeOptions,
  NodeMoveInfo,
  NodeContextMenuInfo,
  CanvasContextMenuInfo,
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

  // 拖拽阈值检测（用于区分点击与拖拽）
  private dragStartX = 0;
  private dragStartY = 0;
  private hasDragged = false;
  private readonly DRAG_THRESHOLD = 3;

  // 节点选中状态
  private selectedNode: ConnectorNode | null = null;

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

    // 判断是否超过拖拽阈值
    if (!this.hasDragged) {
      const dx = Math.abs(e.clientX - this.dragStartX);
      const dy = Math.abs(e.clientY - this.dragStartY);
      if (dx > this.DRAG_THRESHOLD || dy > this.DRAG_THRESHOLD) {
        this.hasDragged = true;
      }
    }

    // 未达到拖拽阈值时不移动节点（避免误操作）
    if (!this.hasDragged) return;

    const wrapperRect = this.ctx.contentWrapper.getBoundingClientRect();
    const { scale } = this.ctx.viewState;

    // 计算新位置
    const newX = (e.clientX - wrapperRect.left) / scale - this.dragOffset.x;
    const newY = (e.clientY - wrapperRect.top) / scale - this.dragOffset.y;

    // 更新节点位置（DOM + 内部状态同步）
    this.draggedNode.element.style.left = `${newX}px`;
    this.draggedNode.element.style.top = `${newY}px`;
    this.draggedNode.x = newX;
    this.draggedNode.y = newY;

    // 触发节点移动回调，通知外部同步位置
    const moveInfo: NodeMoveInfo = { id: this.draggedNode.id, x: newX, y: newY };
    this.ctx.onNodeMove(moveInfo);

    // 更新所有与该节点相关的连线
    this.connectionManager.updateNodeConnections(this.draggedNode.id);
  };

  private handleNodeDragEnd = (): void => {
    // 如果鼠标松开时没有发生拖拽，则视为点击 → 选中节点
    if (!this.hasDragged && this.draggedNode) {
      this.selectNode(this.draggedNode);
    }

    this.isDraggingNode = false;
    this.viewManager.isDraggingNode = false;
    this.draggedNode = null;
    this.hasDragged = false;

    document.removeEventListener('mousemove', this.handleNodeDragMove);
    document.removeEventListener('mouseup', this.handleNodeDragEnd);
  };

  /** 全局 keydown：按 Delete/Backspace 删除已选中的节点 */
  private handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key !== 'Delete' && e.key !== 'Backspace') return;
    if (!this.selectedNode) return;

    // 若焦点在输入框内，不拦截
    const target = e.target as HTMLElement;
    const tag = target.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || target.isContentEditable) return;

    this.deleteNode(this.selectedNode);
  };

  /** 点击画布空白区域时取消选中（节点的 mousedown stopPropagation，不会触发此处） */
  private handleContainerMouseDown = (e: MouseEvent): void => {
    const target = e.target as HTMLElement;
    // 点击连线删除按钮时不取消选中
    if (target.closest && target.closest('.connector-delete-btn')) return;
    this.deselectNode();
  };

  /**
   * 画布空白区域右键：节点的 contextmenu 会 stopPropagation，
   * 因此只有点击空白处时此处才会触发
   */
  private handleContainerContextMenu = (e: MouseEvent): void => {
    if (!this.ctx.onCanvasContextMenu) return;
    e.preventDefault();
    const rect = this.ctx.container.getBoundingClientRect();
    const { scale, translateX, translateY } = this.ctx.viewState;
    const info: CanvasContextMenuInfo = {
      clientX: e.clientX,
      clientY: e.clientY,
      canvasX: (e.clientX - rect.left - translateX) / scale,
      canvasY: (e.clientY - rect.top - translateY) / scale,
    };
    this.ctx.onCanvasContextMenu(info);
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

  /**
   * 初始化：绑定全局键盘监听和画布点击取消选中
   * 由 Connector 主类在 DOM 准备好后调用
   */
  init(): void {
    document.addEventListener('keydown', this.handleKeyDown);
    this.ctx.container.addEventListener('mousedown', this.handleContainerMouseDown);
    this.ctx.container.addEventListener('contextmenu', this.handleContainerContextMenu);
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
    } else if (options.dotPositions === 'left' || options.dotPositions === 'right') {
      // 明确指定单侧触点字符串
      dotPositions = [options.dotPositions];
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

    // 从元素的 style 读取初始坐标（由调用方通过 style.left/top 设置）
    const x = parseFloat(element.style.left) || 0;
    const y = parseFloat(element.style.top) || 0;

    const node: ConnectorNode = {
      id,
      label: options.label,
      element,
      info: options.info,
      dots,
      dotPositions,
      connections: [],
      x,
      y,
    };

    this.ctx.nodes.push(node);

    // 为每个连接点绑定事件
    Object.values(dots).forEach((dot) => {
      if (dot) {
        this.bindDotEvents(node, dot);
      }
    });

    // 绑定节点拖拽事件（包含点击选中逻辑）
    if (this.ctx.config.enableNodeDrag) {
      this.bindNodeDragEvents(node);
    } else {
      // 禁用拖拽时，单独绑定点击选中
      this.bindNodeClickEvents(node);
    }

    // 绑定节点右键菜单事件（始终挂载，回调不存在时为空操作）
    this.bindNodeContextMenuEvents(node);

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
   * 绑定节点右键菜单事件
   * 仅在用户提供 onNodeContextMenu 回调时拦截事件，否则不干预浏览器默认行为
   */
  private bindNodeContextMenuEvents(node: ConnectorNode): void {
    node.element.addEventListener('contextmenu', (e: MouseEvent) => {
      if (!this.ctx.onNodeContextMenu) return;
      e.preventDefault();
      e.stopPropagation();
      const info: NodeContextMenuInfo = {
        id: node.id,
        info: node.info,
        clientX: e.clientX,
        clientY: e.clientY,
      };
      this.ctx.onNodeContextMenu(info);
    });
  }

  /**
   * 绑定节点拖拽事件（同时包含点击选中逻辑）
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

      // 记录拖拽起点，用于区分点击与拖拽
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      this.hasDragged = false;

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

  /**
   * 禁用拖拽时，单独绑定点击选中事件
   */
  private bindNodeClickEvents(node: ConnectorNode): void {
    node.element.addEventListener('click', (e: MouseEvent) => {
      if ((e.target as HTMLElement).classList.contains('connector-dot')) return;
      e.stopPropagation();
      this.selectNode(node);
    });
  }

  // ==================== 节点选中 ====================

  /**
   * 选中节点，应用高亮样式并触发回调
   */
  selectNode(node: ConnectorNode): void {
    // 取消上一个选中
    if (this.selectedNode && this.selectedNode.id !== node.id) {
      this.removeSelectedStyle(this.selectedNode.element);
    }

    this.selectedNode = node;
    this.applySelectedStyle(node.element);

    this.ctx.onNodeSelect({ id: node.id, info: node.info });
  }

  /**
   * 取消选中当前节点
   */
  deselectNode(): void {
    if (!this.selectedNode) return;
    this.removeSelectedStyle(this.selectedNode.element);
    this.selectedNode = null;
    this.ctx.onNodeSelect(null);
  }

  /**
   * 获取当前选中的节点
   */
  getSelectedNode(): ConnectorNode | null {
    return this.selectedNode;
  }

  /** 应用选中高亮样式 */
  private applySelectedStyle(element: HTMLElement): void {
    const color = this.ctx.config.selectedBorderColor;
    element.style.outline = `2px solid ${color}`;
    element.style.outlineOffset = '2px';
    element.style.boxShadow = `0 0 0 4px ${color}33`;
  }

  /** 移除选中高亮样式 */
  private removeSelectedStyle(element: HTMLElement): void {
    element.style.outline = '';
    element.style.outlineOffset = '';
    element.style.boxShadow = '';
  }

  // ==================== 节点删除 ====================

  /**
   * 删除节点：移除其所有连接和触点，并从节点列表中移除
   * 注意：不会主动从 DOM 移除节点元素本身，由框架层（如 Vue/React）在 onNodeDelete 回调中处理
   */
  deleteNode(node: ConnectorNode): void {
    // 1. 断开该节点的所有连接
    const connectionIds = node.connections.map((c) => c.id);
    connectionIds.forEach((id) => this.connectionManager.disconnect(id, { silent: false }));

    // 2. 移除节点上的触点 DOM 元素
    Object.values(node.dots).forEach((dot) => {
      if (dot && dot.element && dot.element.parentNode) {
        dot.element.parentNode.removeChild(dot.element);
      }
    });

    // 3. 移除选中高亮（如果是当前选中节点）
    if (this.selectedNode && this.selectedNode.id === node.id) {
      this.removeSelectedStyle(node.element);
      this.selectedNode = null;
    }

    // 4. 从节点列表中移除
    const index = this.ctx.nodes.findIndex((n) => n.id === node.id);
    if (index !== -1) {
      this.ctx.nodes.splice(index, 1);
    }

    // 5. 触发删除回调（框架层在此回调中移除 DOM 节点）
    this.ctx.onNodeDelete({ id: node.id, info: node.info });
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
    // 移除全局事件监听
    document.removeEventListener('keydown', this.handleKeyDown);
    this.ctx.container.removeEventListener('mousedown', this.handleContainerMouseDown);
    this.ctx.container.removeEventListener('contextmenu', this.handleContainerContextMenu);

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
