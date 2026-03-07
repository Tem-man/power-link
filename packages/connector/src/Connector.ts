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
  ExportData,
  NodeFactory,
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
      selectedBorderColor: options.selectedBorderColor || options.lineColor || '#155BD4',
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
      onNodeMove: options.onNodeMove || (() => {}),
      onNodeSelect: options.onNodeSelect || (() => {}),
      onNodeDelete: options.onNodeDelete || (() => {}),
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
    // 设置足够大的尺寸（10000x10000），确保节点和连线即使拖到容器外部也不会被裁剪
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'connector-content-wrapper';
    contentWrapper.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 10000px;
      height: 10000px;
      transform-origin: 0 0;
      transition: none;
      overflow: visible;
    `;

    // 将容器的所有子元素移到包装器中
    const children = Array.from(container.children);
    children.forEach((child) => {
      contentWrapper.appendChild(child);
    });
    container.appendChild(contentWrapper);

    this.ctx.contentWrapper = contentWrapper;

    // 创建 SVG 画布
    // SVG 尺寸与 contentWrapper 一致，覆盖整个画布区域
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.width = '10000px';
    svg.style.height = '10000px';
    svg.style.pointerEvents = 'none';
    svg.style.zIndex = '1';
    svg.style.overflow = 'visible';
    contentWrapper.appendChild(svg);

    this.ctx.svg = svg;

    // 初始化视图管理器（绑定缩放、平移、resize 事件）
    this.viewManager.init();

    // 初始化节点管理器（绑定全局键盘与画布点击事件）
    this.nodeManager.init();
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

  /**
   * 选中指定节点
   * @param id - 节点 ID
   */
  selectNode(id: string): void {
    const node = this.ctx.nodes.find((n) => n.id === id);
    if (node) {
      this.nodeManager.selectNode(node);
    } else {
      console.warn(`节点 ${id} 不存在`);
    }
  }

  /**
   * 取消选中当前节点
   */
  deselectNode(): void {
    this.nodeManager.deselectNode();
  }

  /**
   * 获取当前选中的节点信息
   */
  getSelectedNode(): ConnectorNode | null {
    return this.nodeManager.getSelectedNode();
  }

  /**
   * 删除指定节点（移除其连接与触点，触发 onNodeDelete 回调）
   * @param id - 节点 ID
   */
  deleteNode(id: string): void {
    const node = this.ctx.nodes.find((n) => n.id === id);
    if (node) {
      this.nodeManager.deleteNode(node);
    } else {
      console.warn(`节点 ${id} 不存在`);
    }
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

  // ==================== 导入 / 导出 API ====================

  /**
   * 导出当前拓扑快照
   * 返回所有节点（含坐标）、连接关系和视图状态的标准 JSON，可直接持久化
   */
  export(): ExportData {
    return {
      nodes: this.ctx.nodes.map((node) => ({
        id: node.id,
        x: node.x,
        y: node.y,
        info: node.info,
        dotPositions: node.dotPositions,
      })),
      connections: this.ctx.connections.map((conn) => ({
        from: conn.fromNode.id,
        to: conn.toNode.id,
        fromDot: conn.fromDot.position,
        toDot: conn.toDot.position,
      })),
      viewState: this.getViewState(),
    };
  }

  /**
   * 从拓扑快照恢复节点与连接
   *
   * **两种使用模式：**
   *
   * 1. **框架模式（Vue / React 等）—— 不传 nodeFactory**
   *    调用方负责将节点渲染到 DOM（使用框架响应式），等待渲染完成后再调用
   *    `import(data)`，库会在 contentWrapper 内按 `id` 属性查找已存在的元素，
   *    完成注册并还原连接。
   *    ```js
   *    nodes.value = data.nodes;        // 触发框架渲染
   *    await nextTick();                // 等待 DOM 就绪
   *    await connector.import(data);    // 注册 + 连线
   *    ```
   *
   * 2. **原生 JS 模式 —— 传入 nodeFactory**
   *    库调用工厂函数创建 DOM 元素，自动定位、挂载、注册，最后还原连接。
   *    ```js
   *    await connector.import(data, (nodeData) => {
   *      const el = document.createElement('div');
   *      el.className = 'node';
   *      el.textContent = nodeData.info?.name ?? nodeData.id;
   *      return el;
   *    });
   *    ```
   *
   * @param data       由 `export()` 返回的拓扑数据
   * @param nodeFactory 可选，原生 JS 场景下的节点元素工厂
   */
  async import(data: ExportData, nodeFactory?: NodeFactory): Promise<void> {
    // ── 第一步：注册节点 ──────────────────────────────────────
    for (const nodeData of data.nodes) {
      // 已注册的节点跳过（支持增量导入）
      if (this.ctx.nodes.find((n) => n.id === nodeData.id)) continue;

      let element: HTMLElement | null = null;

      if (nodeFactory) {
        // 原生模式：工厂创建元素，库负责定位与挂载
        element = await Promise.resolve(nodeFactory(nodeData));
        if (!element.id) element.id = nodeData.id;
        element.style.position = 'absolute';
        element.style.left = `${nodeData.x}px`;
        element.style.top = `${nodeData.y}px`;
        this.ctx.contentWrapper.appendChild(element);
      } else {
        // 框架模式：按 id 属性查找已由框架渲染的元素
        element = this.ctx.contentWrapper.querySelector<HTMLElement>(
          `[id="${nodeData.id}"]`,
        );
        if (element) {
          // 用保存的坐标覆盖当前样式，确保位置精确还原
          element.style.left = `${nodeData.x}px`;
          element.style.top = `${nodeData.y}px`;
        }
      }

      if (!element) {
        console.warn(`[power-link] import: 找不到节点 "${nodeData.id}" 的 DOM 元素，已跳过`);
        continue;
      }

      this.nodeManager.registerNode(nodeData.id, element, {
        dotPositions: nodeData.dotPositions,
        info: nodeData.info,
      });
    }

    // ── 第二步：还原连接（静默模式，不触发 onConnect 回调）────
    for (const conn of data.connections) {
      this.createConnection(conn.from, conn.to, conn.fromDot, conn.toDot, { silent: true });
    }

    // ── 第三步：恢复视图状态（缩放、平移）────
    if (data.viewState) {
      this.setViewState(data.viewState);
    }
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
