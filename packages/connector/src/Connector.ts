/**
 * @fileoverview 连线器主类
 * @description 用于在两个节点之间创建可视化连线，不依赖任何框架，纯 TypeScript 实现
 */

import type {
  ConnectorOptions,
  ConnectorConfig,
  ConnectorContext,
  ConnectorNode,
  ConnectionInfo,
  ViewState,
  RegisterNodeOptions,
  SilentOptions,
  Connection,
} from './types';
import { PositionHelper } from './PositionHelper';
import { ViewManager } from './ViewManager';
import { NodeManager } from './NodeManager';
import { ConnectionManager } from './ConnectionManager';
import { SnapManager } from './SnapManager';

export class Connector {
  private ctx: ConnectorContext;
  private viewManager: ViewManager;
  private nodeManager: NodeManager;
  private connectionManager: ConnectionManager;
  private snapManager: SnapManager;
  private positionHelper: PositionHelper;

  constructor(options: ConnectorOptions) {
    const container = options.container;
    if (!container) {
      throw new Error('Container element is required');
    }

    // 构建配置
    const config: ConnectorConfig = {
      lineColor: options.lineColor || '#155BD4',
      lineWidth: options.lineWidth || 2,
      dotSize: options.dotSize || 12,
      dotColor: options.dotColor || '#155BD4',
      dotHoverScale: options.dotHoverScale || 1.8,
      deleteButtonSize: options.deleteButtonSize || 20,
      enableNodeDrag: options.enableNodeDrag !== false,
      snapDistance: options.snapDistance || 20,
      enableSnap: options.enableSnap !== false,
      enableZoom: options.enableZoom !== false,
      enablePan: options.enablePan !== false,
      minZoom: options.minZoom || 0.1,
      maxZoom: options.maxZoom || 4,
      zoomStep: options.zoomStep || 0.1,
      ...options.config,
    };

    // 初始化共享上下文（contentWrapper 和 svg 在 init 中创建）
    this.ctx = {
      container,
      contentWrapper: null as unknown as HTMLDivElement,
      svg: null as unknown as SVGSVGElement,
      nodes: [],
      connections: [],
      viewState: {
        scale: 1,
        translateX: 0,
        translateY: 0,
      },
      config,
      onConnect: options.onConnect || (() => {}),
      onDisconnect: options.onDisconnect || (() => {}),
      onViewChange: options.onViewChange || (() => {}),
    };

    // 初始化各子模块
    this.positionHelper = new PositionHelper(this.ctx);
    this.viewManager = new ViewManager(this.ctx, this.positionHelper);
    this.snapManager = new SnapManager(this.ctx, this.positionHelper);
    this.connectionManager = new ConnectionManager(this.ctx, this.positionHelper);
    this.nodeManager = new NodeManager(this.ctx, this.positionHelper);

    // 延迟注入依赖
    this.nodeManager.setManagers(this.connectionManager, this.snapManager, this.viewManager);

    // 设置 resize 回调
    this.viewManager.setResizeCallback(() => {
      this.connectionManager.updateAllConnections();
    });

    // 初始化 DOM 和事件
    this.init();
  }

  /**
   * 初始化 DOM 结构和事件
   */
  private init(): void {
    const container = this.ctx.container;

    // 确保容器是相对定位
    const position = window.getComputedStyle(container).position;
    if (position === 'static') {
      container.style.position = 'relative';
    }

    // 容器设置 overflow: hidden
    container.style.overflow = 'hidden';

    // 创建内容包装器
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'connector-content-wrapper';
    contentWrapper.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      transform-origin: 0 0;
      transition: none;
    `;

    // 将容器的所有子元素移到包装器中
    const children = Array.from(container.children);
    children.forEach((child) => {
      contentWrapper.appendChild(child);
    });
    container.appendChild(contentWrapper);

    this.ctx.contentWrapper = contentWrapper;

    // 创建 SVG 画布
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.pointerEvents = 'none';
    svg.style.zIndex = '1';
    contentWrapper.appendChild(svg);

    this.ctx.svg = svg;

    // 初始化视图管理器（绑定缩放、平移、resize 事件）
    this.viewManager.init();
  }

  // ==================== 节点 API ====================

  /**
   * 注册节点
   * @param id - 节点唯一标识
   * @param element - 节点 DOM 元素
   * @param options - 节点配置选项
   */
  registerNode(
    id: string,
    element: HTMLElement,
    options?: RegisterNodeOptions,
  ): ConnectorNode | undefined {
    return this.nodeManager.registerNode(id, element, options);
  }

  /**
   * 更新节点位置（当节点移动时调用）
   */
  updateNodePosition(nodeId: string): void {
    this.nodeManager.updateNodePosition(nodeId);
  }

  // ==================== 连接 API ====================

  /**
   * 创建连接（编程式）
   */
  createConnection(
    fromNodeId: string,
    toNodeId: string,
    fromDotPosition?: string,
    toDotPosition?: string,
    options?: SilentOptions,
  ): Connection | undefined {
    const fromNode = this.ctx.nodes.find((n) => n.id === fromNodeId);
    const toNode = this.ctx.nodes.find((n) => n.id === toNodeId);
    if (!fromNode || !toNode) {
      console.warn('节点不存在');
      return undefined;
    }

    const fromDot = fromDotPosition
      ? fromNode.dots[fromDotPosition as 'left' | 'right'] || null
      : null;
    const toDot = toDotPosition
      ? toNode.dots[toDotPosition as 'left' | 'right'] || null
      : null;

    return this.connectionManager.createConnection(fromNode, toNode, fromDot, toDot, options);
  }

  /**
   * 断开连接
   * @param connectionId - 连接 ID，如果不提供则断开所有连接
   * @param options - 配置选项
   */
  disconnect(connectionId?: string, options?: SilentOptions): void {
    this.connectionManager.disconnect(connectionId, options);
  }

  /**
   * 获取所有连接
   */
  getConnections(): ConnectionInfo[] {
    return this.connectionManager.getConnections();
  }

  /**
   * 获取节点的所有连接
   */
  getNodeConnections(nodeId: string): ConnectionInfo[] {
    return this.connectionManager.getNodeConnections(nodeId);
  }

  /**
   * 更新所有连接线位置
   */
  updateAllConnections(): void {
    this.connectionManager.updateAllConnections();
  }

  // ==================== 视图 API ====================

  /**
   * 设置缩放比例（以画布中心为基准）
   */
  setZoom(scale: number): void {
    this.viewManager.setZoom(scale);
  }

  /**
   * 获取当前缩放比例
   */
  getZoom(): number {
    return this.viewManager.getZoom();
  }

  /**
   * 放大
   */
  zoomIn(): void {
    this.viewManager.zoomIn();
  }

  /**
   * 缩小
   */
  zoomOut(): void {
    this.viewManager.zoomOut();
  }

  /**
   * 重置视图
   */
  resetView(): void {
    this.viewManager.resetView();
  }

  /**
   * 获取视图状态
   */
  getViewState(): ViewState {
    return this.viewManager.getViewState();
  }

  /**
   * 设置视图状态（用于初始化或恢复视图）
   */
  setViewState(state: Partial<ViewState>): void {
    this.viewManager.setViewState(state);
  }

  // ==================== 生命周期 ====================

  /**
   * 销毁连线器
   * @param options - 配置选项
   */
  destroy(options: SilentOptions = {}): void {
    // 销毁连接管理器（断开所有连接）
    this.connectionManager.destroy(options);

    // 销毁节点管理器（移除触点和事件）
    this.nodeManager.destroy();

    // 销毁视图管理器（移除缩放、平移、resize 事件）
    this.viewManager.destroy();

    // 移除 SVG
    if (this.ctx.svg && this.ctx.svg.parentNode) {
      this.ctx.svg.parentNode.removeChild(this.ctx.svg);
    }

    // 清空节点和连接列表
    this.ctx.nodes = [];
    this.ctx.connections = [];
  }
}

export default Connector;

