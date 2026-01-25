/**
 * 连线器类 - 用于在两个节点之间创建可视化连线
 * 重构版本：使用模块化架构，支持插件系统和钩子系统
 */
import { EventEmitter } from './core/EventEmitter';
import { mergeConfig } from './core/Config';
import { PluginManager } from './core/PluginManager';
import { createConnectorHooks, clearAllHooks } from './core/ConnectorHooks';
import type { IConnectorHooks } from './core/ConnectorHooks';
import { ViewportController } from './view/ViewportController';
import { SVGRenderer } from './view/SVGRenderer';
import { NodeModel, DotModel, ConnectionModel } from './model';
import { DragHandler, SnapHandler, ConnectionHandler } from './interaction';
import type {
  ConnectorConfig,
  ConnectorOptions,
  ConnectorEventMap,
  ViewState,
  DotPosition,
  Point,
  NodeOptions,
  ConnectionInfo,
  ConnectionData,
  PowerLinkPlugin,
  PluginOptions,
  PluginContext,
  ConnectorState,
  NodeState,
  ConnectionState,
} from './types';
import { ensurePositioned } from './utils/dom';
import { getDotPosition as getDotPositionUtil } from './utils/dom';

/**
 * 连线器类
 */
export class Connector extends EventEmitter<ConnectorEventMap> {
  /** 容器元素 */
  private container: HTMLElement;

  /** 内容包装器 */
  private contentWrapper: HTMLElement | null = null;

  /** 配置 */
  private config: ConnectorConfig;

  /** 节点列表 */
  private nodes: NodeModel[] = [];

  /** 连接列表 */
  private connections: ConnectionModel[] = [];

  /** 视图控制器 */
  private viewport: ViewportController;

  /** SVG 渲染器 */
  private renderer: SVGRenderer | null = null;

  /** 节点拖拽处理器 */
  private dragHandler: DragHandler | null = null;

  /** 吸附处理器 */
  private snapHandler: SnapHandler | null = null;

  /** 连线处理器 */
  private connectionHandler: ConnectionHandler | null = null;

  /** 插件管理器 */
  private pluginManager: PluginManager;

  /** 钩子系统 */
  public readonly hooks: IConnectorHooks<Connector>;

  /** 回调函数 */
  private onConnectCallback: (info: ConnectionInfo) => void;
  private onDisconnectCallback: (info: ConnectionInfo) => void;
  private onViewChangeCallback: (state: ViewState) => void;

  constructor(options: ConnectorOptions) {
    super();

    if (!options.container) {
      throw new Error('Container element is required');
    }

    this.container = options.container;
    this.config = mergeConfig(options);

    // 回调函数
    this.onConnectCallback = options.onConnect || (() => {});
    this.onDisconnectCallback = options.onDisconnect || (() => {});
    this.onViewChangeCallback = options.onViewChange || (() => {});

    // 创建插件管理器
    this.pluginManager = new PluginManager();

    // 创建钩子系统
    this.hooks = createConnectorHooks<Connector>(this);

    // 创建视图控制器
    this.viewport = new ViewportController(this.container, {
      enableZoom: this.config.enableZoom,
      enablePan: this.config.enablePan,
      minZoom: this.config.minZoom,
      maxZoom: this.config.maxZoom,
      zoomStep: this.config.zoomStep,
    });

    this.init();
  }

  /**
   * 初始化
   */
  private init(): void {
    // 确保容器是相对定位
    ensurePositioned(this.container, 'relative');

    // 容器设置 overflow: hidden
    this.container.style.overflow = 'hidden';

    // 创建内容包装器
    this.contentWrapper = this.createContentWrapper();

    // 初始化视图控制器
    this.viewport.init(this.contentWrapper);

    // 设置平移检查函数
    this.viewport.canStartPan = (e: MouseEvent) => {
      // 如果点击的是连接点或正在拖拽，不处理画布拖拽
      if ((e.target as HTMLElement).classList.contains('connector-dot')) {
        return false;
      }
      if (this.dragHandler?.getIsDragging() || this.connectionHandler?.getIsDragging()) {
        return false;
      }
      // 检查是否点击在节点上（节点拖拽优先）
      const clickedNode = this.getNodeAtPosition(e.clientX, e.clientY);
      if (clickedNode && this.config.enableNodeDrag) {
        return false;
      }
      return true;
    };

    // 设置窗口大小变化回调
    this.viewport.onResize = () => {
      this.updateAllConnections();
    };

    // 监听视图变化
    this.viewport.on('view:change', (state) => {
      // 调用钩子系统
      const processedState = this.hooks.afterViewChange.execute(state);

      this.onViewChangeCallback(processedState);
      this.emit('view:change', processedState);
    });

    // 创建渲染器
    this.renderer = new SVGRenderer(this.contentWrapper, {
      lineColor: this.config.lineColor,
      lineWidth: this.config.lineWidth,
      deleteButtonSize: this.config.deleteButtonSize,
    });

    // 创建交互处理器
    this.initInteractionHandlers();

    // 设置插件上下文并安装待安装的插件
    this.pluginManager.setContext(this.createPluginContext());
    this.pluginManager.installAll();
  }

  /**
   * 创建插件上下文
   */
  private createPluginContext(): PluginContext {
    return {
      getNodes: () => [...this.nodes],
      getNode: (id: string) => this.nodes.find(n => n.id === id),
      getConnections: () => [...this.connections],
      getConnection: (id: string) => this.connections.find(c => c.id === id),
      getViewState: () => this.viewport.getViewState(),
      setViewState: (state: Partial<ViewState>) => this.viewport.setViewState(state),
      getContainer: () => this.container,
      getSVG: () => this.renderer?.getSVG() || null,
      emit: (event: string, data?: any) => this.emit(event as keyof ConnectorEventMap, data),
      on: (event: string, callback: (data: any) => void) =>
        this.on(event as keyof ConnectorEventMap, callback as any),
      off: (event: string, callback?: (data: any) => void) =>
        this.off(event as keyof ConnectorEventMap, callback as any),
      // 暴露钩子系统给插件
      hooks: this.hooks,
    };
  }

  /**
   * 创建内容包装器
   */
  private createContentWrapper(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'connector-content-wrapper';
    wrapper.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      transform-origin: 0 0;
      transition: none;
    `;

    // 将容器的所有子元素移到包装器中
    const children = Array.from(this.container.children);
    children.forEach((child) => {
      wrapper.appendChild(child);
    });
    this.container.appendChild(wrapper);

    return wrapper;
  }

  /**
   * 初始化交互处理器
   */
  private initInteractionHandlers(): void {
    // 节点拖拽处理器
    this.dragHandler = new DragHandler(
      { enabled: this.config.enableNodeDrag },
      () => this.viewport.getViewState(),
      () => this.contentWrapper
    );

    this.dragHandler.onNodePositionChange = (nodeId) => {
      this.updateNodeConnections(nodeId);
    };

    // 吸附处理器
    this.snapHandler = new SnapHandler(
      { enabled: this.config.enableSnap, snapDistance: this.config.snapDistance },
      () => this.nodes,
      (element, position) => this.getDotPosition(element, position)
    );

    // 设置高亮回调
    this.snapHandler.onHighlightNode = (element) => {
      this.renderer?.highlightNode(element);
    };
    this.snapHandler.onUnhighlightNode = (element) => {
      this.renderer?.unhighlightNode(element);
    };
    this.snapHandler.onHighlightDot = (element) => {
      this.renderer?.highlightDot(element);
    };
    this.snapHandler.onUnhighlightDot = (element) => {
      this.renderer?.unhighlightDot(element);
    };

    // 连线处理器
    this.connectionHandler = new ConnectionHandler(
      { enabled: true },
      () => this.viewport.getViewState(),
      () => this.container,
      (element, position) => this.getDotPosition(element, position)
    );

    // 连接吸附处理器
    this.connectionHandler.checkSnap = (pos, node) =>
      this.snapHandler?.checkSnap(pos, node) ?? null;
    this.connectionHandler.clearSnap = () =>
      this.snapHandler?.reset();
    this.connectionHandler.getNodeAtPosition = (x, y) =>
      this.getNodeAtPosition(x, y);

    // 连接渲染回调
    this.connectionHandler.onCreateTempLine = () =>
      this.renderer!.createTempLine();
    this.connectionHandler.onRemoveTempLine = (line) =>
      this.renderer!.removeTempLine(line);
    this.connectionHandler.onUpdateTempLine = (line, start, end, startDotPosition) =>
      this.renderer!.updateLine(line, start, end, startDotPosition);

    // 监听连接请求
    this.connectionHandler.on('connection:request', ({ fromNode, toNode, fromDot, toDot }) => {
      this.createConnection(fromNode, toNode, fromDot, toDot);
    });
  }

  /**
   * 获取触点位置（SVG 坐标系统）
   */
  private getDotPosition(element: HTMLElement, position: DotPosition): Point {
    return getDotPositionUtil(element, position, this.container, this.viewport.getViewState());
  }

  // ==================== 插件 API ====================

  /**
   * 注册并安装插件
   * @param plugin 插件对象
   * @param options 插件选项
   */
  use<T extends PluginOptions>(plugin: PowerLinkPlugin<T>, options?: T): this {
    this.pluginManager.use(plugin, options);
    return this;
  }

  /**
   * 卸载插件
   * @param pluginName 插件名称
   */
  unuse(pluginName: string): this {
    this.pluginManager.unuse(pluginName);
    return this;
  }

  /**
   * 获取已安装的插件
   * @param name 插件名称
   */
  getPlugin<T extends PluginOptions>(name: string): PowerLinkPlugin<T> | undefined {
    return this.pluginManager.getPlugin<T>(name);
  }

  /**
   * 获取所有已安装的插件名称
   */
  getPluginNames(): string[] {
    return this.pluginManager.getPluginNames();
  }

  /**
   * 检查插件是否已安装
   * @param name 插件名称
   */
  hasPlugin(name: string): boolean {
    return this.pluginManager.hasPlugin(name);
  }

  // ==================== 节点 API ====================

  /**
   * 注册节点
   */
  registerNode(id: string, element: HTMLElement, options: NodeOptions = {}): NodeModel | undefined {
    // 检查是否已存在
    if (this.nodes.find((n) => n.id === id)) {
      console.warn(`节点 ${id} 已存在`);
      return;
    }

    // 调用钩子系统 - beforeNodeRegister
    const hookParams = { id, element, options };
    const { prevented } = this.hooks.beforeNodeRegister.execute(hookParams);
    if (prevented) {
      console.log(`节点 ${id} 注册被钩子阻止`);
      return;
    }

    // 处理触点位置配置
    let dotPositions: DotPosition[] = [];

    if (options.dotPositions === 'both') {
      dotPositions = ['left', 'right'];
    } else if (Array.isArray(options.dotPositions)) {
      dotPositions = options.dotPositions.filter((pos): pos is DotPosition =>
        pos === 'left' || pos === 'right'
      );
    } else {
      // 默认：第一个节点右侧，其他节点左侧
      dotPositions = [this.nodes.length === 0 ? 'right' : 'left'];
    }

    // 限制最多两个触点，且只能是 left 和 right（去重）
    dotPositions = [...new Set(dotPositions)].slice(0, 2);

    // 创建节点模型
    const node = new NodeModel({
      id,
      element,
      info: options.info,
      dotPositions,
    });

    // 创建触点
    dotPositions.forEach((position) => {
      const dotElement = this.renderer!.createDot(position, {
        size: this.config.dotSize,
        color: this.config.dotColor,
        hoverScale: this.config.dotHoverScale,
      });
      element.appendChild(dotElement);

      const dot = node.addDot(position, dotElement);

      // 调用钩子系统 - onRenderDot
      this.hooks.onRenderDot.execute({ dot, element: dotElement });

      // 绑定连线事件
      this.connectionHandler?.bindDotEvents(node, dot);
    });

    this.nodes.push(node);

    // 绑定节点拖拽事件
    if (this.config.enableNodeDrag) {
      this.dragHandler?.bindNodeDragEvents(node);
    }

    // 调用钩子系统 - afterNodeRegister
    this.hooks.afterNodeRegister.execute(node);

    // 触发事件
    this.emit('node:register', { id, node });

    return node;
  }

  /**
   * 移除节点
   */
  unregisterNode(nodeId: string): boolean {
    const index = this.nodes.findIndex(n => n.id === nodeId);
    if (index === -1) return false;

    const node = this.nodes[index];

    // 调用钩子系统 - beforeNodeRemove
    const { prevented } = this.hooks.beforeNodeRemove.execute(node);
    if (prevented) {
      console.log(`节点 ${nodeId} 移除被钩子阻止`);
      return false;
    }

    // 断开该节点的所有连接
    const nodeConnections = this.connections.filter(
      conn => conn.fromNode.id === nodeId || conn.toNode.id === nodeId
    );
    nodeConnections.forEach(conn => this.disconnect(conn.id));

    // 移除拖拽事件
    this.dragHandler?.unbindNodeDragEvents(node);

    // 移除触点
    node.forEachDot((dot) => {
      this.connectionHandler?.unbindDotEvents(dot);
      if (dot.element.parentNode) {
        dot.element.parentNode.removeChild(dot.element);
      }
    });

    // 从节点列表中移除
    this.nodes.splice(index, 1);

    // 调用钩子系统 - afterNodeRemove
    this.hooks.afterNodeRemove.execute(nodeId);

    // 触发事件
    this.emit('node:unregister', { id: nodeId });

    return true;
  }

  /**
   * 创建连接
   */
  createConnection(
    fromNode: NodeModel,
    toNode: NodeModel,
    fromDot: DotModel | null = null,
    toDot: DotModel | null = null,
    options: { silent?: boolean } = {}
  ): ConnectionModel | undefined {
    // 自动选择触点
    if (!fromDot) {
      fromDot = fromNode.getRightDot() || fromNode.getLeftDot() || fromNode.getFirstDot() || null;
    }
    if (!toDot) {
      toDot = toNode.getLeftDot() || toNode.getRightDot() || toNode.getFirstDot() || null;
    }

    if (!fromDot || !toDot) {
      console.warn('无法创建连接：缺少触点');
      return;
    }

    // 调用钩子系统 - beforeConnect
    const hookParams = { fromNode, toNode, fromDot, toDot };
    const { data: modifiedParams, prevented } = this.hooks.beforeConnect.execute(hookParams);

    if (prevented) {
      console.log('连接被钩子阻止');
      return;
    }

    // 使用可能被修改的参数
    fromNode = modifiedParams.fromNode;
    toNode = modifiedParams.toNode;
    fromDot = modifiedParams.fromDot;
    toDot = modifiedParams.toDot;

    // 检查是否已存在相同的连接
    const existingConnection = this.connections.find((conn) =>
      conn.matches(fromNode.id, toNode.id, fromDot.position, toDot.position)
    );

    if (existingConnection) {
      console.warn('该连接已存在');
      return;
    }

    // 生成连接 ID
    const connectionId = ConnectionModel.generateId(
      fromNode.id,
      toNode.id,
      fromDot.position,
      toDot.position
    );

    // 创建连接模型
    const connection = new ConnectionModel({
      id: connectionId,
      fromNode,
      toNode,
      fromDot,
      toDot,
    });

    // 创建渲染元素
    const elements = this.renderer!.createConnectionElements();
    connection.setRenderElements(elements);

    this.connections.push(connection);

    // 记录节点的连接
    fromNode.addConnection(connection);
    toNode.addConnection(connection);

    // 更新连接线位置
    this.updateConnection(connection);

    // 调用钩子系统 - onRenderConnection
    this.hooks.onRenderConnection.execute({ connection, element: elements.line });

    // 绑定连线事件（删除按钮等）
    this.bindConnectionEvents(connection);

    // 调用钩子系统 - afterConnect
    this.hooks.afterConnect.execute(connection);

    // 触发连接回调
    if (!options.silent) {
      const info = connection.toConnectionInfo();
      this.onConnectCallback(info);
      this.emit('connect', info);
    }

    return connection;
  }

  /**
   * 通过节点 ID 创建连接
   */
  connect(
    fromNodeId: string,
    toNodeId: string,
    fromDotPosition?: DotPosition,
    toDotPosition?: DotPosition,
    options?: { silent?: boolean }
  ): ConnectionModel | undefined {
    const fromNode = this.nodes.find((n) => n.id === fromNodeId);
    const toNode = this.nodes.find((n) => n.id === toNodeId);

    if (!fromNode || !toNode) {
      console.warn('节点不存在');
      return;
    }

    const fromDot = fromDotPosition ? fromNode.getDot(fromDotPosition) : null;
    const toDot = toDotPosition ? toNode.getDot(toDotPosition) : null;

    return this.createConnection(fromNode, toNode, fromDot ?? null, toDot ?? null, options);
  }

  /**
   * 更新单个连接
   */
  private updateConnection(connection: ConnectionModel): void {
    const elements = connection.renderElements;
    if (!elements) return;

    const fromPos = this.getDotPosition(connection.fromNode.element, connection.fromDot.position);
    const toPos = this.getDotPosition(connection.toNode.element, connection.toDot.position);

    // 更新连接线和悬浮路径
    this.renderer!.updateConnectionPaths(
      elements.line,
      elements.hoverPath,
      fromPos,
      toPos,
      connection.fromDot.position,
      connection.toDot.position
    );

    // 更新删除按钮位置
    this.renderer!.updateDeleteButtonPosition(
      elements.deleteButton,
      fromPos,
      toPos,
      connection.fromDot.position,
      connection.toDot.position
    );
  }

  /**
   * 更新节点的所有连接
   */
  updateNodeConnections(nodeId: string): void {
    const connections = this.connections.filter(
      (conn) => conn.fromNode.id === nodeId || conn.toNode.id === nodeId
    );
    connections.forEach((conn) => this.updateConnection(conn));
  }

  /**
   * 更新所有连接线位置
   */
  updateAllConnections(): void {
    this.connections.forEach((conn) => this.updateConnection(conn));
  }

  /**
   * 绑定连线的删除按钮事件
   */
  private bindConnectionEvents(connection: ConnectionModel): void {
    const elements = connection.renderElements;
    if (!elements) return;

    const { line, hoverPath, deleteButton } = elements;

    const showDeleteButton = () => {
      this.renderer!.showDeleteButton(deleteButton);
    };

    const hideDeleteButton = () => {
      this.renderer!.hideDeleteButton(deleteButton);
    };

    hoverPath.addEventListener('mouseenter', showDeleteButton);
    hoverPath.addEventListener('mouseleave', hideDeleteButton);
    line.addEventListener('mouseenter', showDeleteButton);
    line.addEventListener('mouseleave', hideDeleteButton);

    deleteButton.addEventListener('click', () => {
      this.disconnect(connection.id);
    });
  }

  /**
   * 断开连接
   */
  disconnect(connectionId?: string, options: { silent?: boolean } = {}): void {
    if (connectionId) {
      // 断开指定连接
      const index = this.connections.findIndex((conn) => conn.id === connectionId);
      if (index === -1) return;

      const connection = this.connections[index];

      // 调用钩子系统 - beforeDisconnect
      const { prevented } = this.hooks.beforeDisconnect.execute(connection);
      if (prevented) {
        console.log('断开连接被钩子阻止');
        return;
      }

      const connectionInfo = connection.toConnectionInfo();

      // 移除渲染元素
      const elements = connection.renderElements;
      if (elements) {
        this.renderer!.removeConnectionElements(elements);
      }

      // 从节点的连接列表中移除
      connection.fromNode.removeConnection(connection);
      connection.toNode.removeConnection(connection);

      // 从连接列表中移除
      this.connections.splice(index, 1);

      // 调用钩子系统 - afterDisconnect
      this.hooks.afterDisconnect.execute(connectionInfo);

      // 触发断开连接回调
      if (!options.silent) {
        this.onDisconnectCallback(connectionInfo);
        this.emit('disconnect', connectionInfo);
      }
    } else {
      // 断开所有连接
      const allConnections = [...this.connections];
      allConnections.forEach((conn) => this.disconnect(conn.id, options));
    }
  }

  /**
   * 获取指定位置的节点
   */
  getNodeAtPosition(x: number, y: number): NodeModel | null {
    for (const node of this.nodes) {
      const rect = node.element.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return node;
      }
    }
    return null;
  }

  /**
   * 更新节点位置
   */
  updateNodePosition(nodeId: string): void {
    const node = this.nodes.find((n) => n.id === nodeId);
    if (node) {
      node.clearDotCoordsCache();
      this.updateNodeConnections(nodeId);
    }
  }

  // ==================== 视图控制 API ====================

  /**
   * 设置缩放比例
   */
  setZoom(scale: number): void {
    this.viewport.setZoom(scale);
  }

  /**
   * 获取当前缩放比例
   */
  getZoom(): number {
    return this.viewport.getZoom();
  }

  /**
   * 放大
   */
  zoomIn(): void {
    this.viewport.zoomIn();
  }

  /**
   * 缩小
   */
  zoomOut(): void {
    this.viewport.zoomOut();
  }

  /**
   * 重置视图
   */
  resetView(): void {
    this.viewport.resetView();
  }

  /**
   * 获取视图状态
   */
  getViewState(): ViewState {
    return this.viewport.getViewState();
  }

  /**
   * 设置视图状态
   */
  setViewState(state: Partial<ViewState>): void {
    this.viewport.setViewState(state);
  }

  /**
   * 以指定点为中心缩放
   */
  zoomAtPoint(scale: number, pointX: number, pointY: number): void {
    this.viewport.zoomAtPoint(scale, pointX, pointY);
  }

  // ==================== 查询 API ====================

  /**
   * 获取所有连接
   */
  getConnections(): ConnectionData[] {
    return this.connections.map((conn) => conn.toConnectionData());
  }

  /**
   * 获取节点的所有连接
   */
  getNodeConnections(nodeId: string): ConnectionData[] {
    return this.connections
      .filter((conn) => conn.involvesNode(nodeId))
      .map((conn) => conn.toConnectionData());
  }

  /**
   * 获取节点
   */
  getNode(nodeId: string): NodeModel | undefined {
    return this.nodes.find((n) => n.id === nodeId);
  }

  /**
   * 获取所有节点
   */
  getNodes(): NodeModel[] {
    return [...this.nodes];
  }

  /**
   * 获取连接
   */
  getConnection(connectionId: string): ConnectionModel | undefined {
    return this.connections.find((c) => c.id === connectionId);
  }

  /**
   * 获取所有连接模型（完整对象）
   */
  getConnectionModels(): ConnectionModel[] {
    return [...this.connections];
  }

  /**
   * 获取连接数量
   */
  getConnectionCount(): number {
    return this.connections.length;
  }

  /**
   * 获取节点数量
   */
  getNodeCount(): number {
    return this.nodes.length;
  }

  // ==================== 配置 API ====================

  /**
   * 获取配置
   */
  getConfig(): ConnectorConfig {
    return { ...this.config };
  }

  // ==================== 序列化 API ====================

  /**
   * 保存当前状态
   * @returns 可序列化的状态对象
   *
   * @example
   * ```typescript
   * const state = connector.save();
   * localStorage.setItem('connector-state', JSON.stringify(state));
   * ```
   */
  save(): ConnectorState {
    // 收集节点状态
    const nodes: NodeState[] = this.nodes.map((node) => {
      // 获取元素位置
      const position: Point = {
        x: node.element.offsetLeft,
        y: node.element.offsetTop,
      };
      return {
        id: node.id,
        position,
        dotPositions: node.dotPositions,
        info: node.info,
      };
    });

    // 收集连接状态
    const connections: ConnectionState[] = this.connections.map((conn) => ({
      id: conn.id,
      fromNodeId: conn.fromNode.id,
      toNodeId: conn.toNode.id,
      fromDot: conn.fromDot.position,
      toDot: conn.toDot.position,
    }));

    // 构建状态对象
    let state: ConnectorState = {
      version: '1.0.0',
      nodes,
      connections,
      viewState: this.viewport.getViewState(),
    };

    // 执行保存钩子（允许插件修改状态）
    state = this.hooks.save.execute(state);

    return state;
  }

  /**
   * 加载状态
   * @param state 状态对象
   * @param options 加载选项
   * @returns 加载过程中的警告信息
   *
   * @example
   * ```typescript
   * const saved = localStorage.getItem('connector-state');
   * if (saved) {
   *   const warnings = connector.load(JSON.parse(saved));
   *   if (warnings.length > 0) {
   *     console.warn('加载警告:', warnings);
   *   }
   * }
   * ```
   */
  load(state: ConnectorState, options: { silent?: boolean } = {}): string[] {
    const warnings: string[] = [];

    // 执行加载钩子（允许插件修改状态）
    state = this.hooks.load.execute(state);

    // 清空当前状态
    this.disconnect(undefined, { silent: true });

    // 恢复视图状态
    if (state.viewState) {
      this.viewport.setViewState(state.viewState);
    }

    // 恢复连接
    for (const connState of state.connections) {
      const fromNode = this.nodes.find((n) => n.id === connState.fromNodeId);
      const toNode = this.nodes.find((n) => n.id === connState.toNodeId);

      if (!fromNode) {
        warnings.push(`节点 ${connState.fromNodeId} 不存在，跳过连接 ${connState.id}`);
        continue;
      }
      if (!toNode) {
        warnings.push(`节点 ${connState.toNodeId} 不存在，跳过连接 ${connState.id}`);
        continue;
      }

      const fromDot = fromNode.getDot(connState.fromDot);
      const toDot = toNode.getDot(connState.toDot);

      if (!fromDot) {
        warnings.push(`节点 ${connState.fromNodeId} 没有 ${connState.fromDot} 触点`);
        continue;
      }
      if (!toDot) {
        warnings.push(`节点 ${connState.toNodeId} 没有 ${connState.toDot} 触点`);
        continue;
      }

      this.createConnection(fromNode, toNode, fromDot, toDot, { silent: options.silent });
    }

    return warnings;
  }

  /**
   * 导出连接数据（简化版，仅连接关系）
   */
  exportConnections(): ConnectionState[] {
    return this.connections.map((conn) => ({
      id: conn.id,
      fromNodeId: conn.fromNode.id,
      toNodeId: conn.toNode.id,
      fromDot: conn.fromDot.position,
      toDot: conn.toDot.position,
    }));
  }

  /**
   * 导入连接数据
   * @param connections 连接状态数组
   * @param options 导入选项
   */
  importConnections(connections: ConnectionState[], options: { silent?: boolean } = {}): string[] {
    const warnings: string[] = [];

    for (const connState of connections) {
      const fromNode = this.nodes.find((n) => n.id === connState.fromNodeId);
      const toNode = this.nodes.find((n) => n.id === connState.toNodeId);

      if (!fromNode || !toNode) {
        warnings.push(`跳过连接: ${connState.fromNodeId} → ${connState.toNodeId}`);
        continue;
      }

      this.connect(
        connState.fromNodeId,
        connState.toNodeId,
        connState.fromDot,
        connState.toDot,
        { silent: options.silent }
      );
    }

    return warnings;
  }

  // ==================== 生命周期 ====================

  /**
   * 销毁连线器
   */
  destroy(options: { silent?: boolean } = {}): void {
    // 销毁插件管理器
    this.pluginManager.destroy();

    // 清空钩子
    clearAllHooks(this.hooks);

    // 断开所有连接
    this.disconnect(undefined, { silent: options.silent ?? true });

    // 移除所有节点的触点和事件
    this.nodes.forEach((node) => {
      // 移除拖拽事件
      this.dragHandler?.unbindNodeDragEvents(node);

      // 移除触点
      node.forEachDot((dot) => {
        this.connectionHandler?.unbindDotEvents(dot);
        if (dot.element.parentNode) {
          dot.element.parentNode.removeChild(dot.element);
        }
      });
    });

    // 销毁交互处理器
    this.dragHandler?.destroy();
    this.snapHandler?.destroy();
    this.connectionHandler?.destroy();

    // 销毁渲染器
    this.renderer?.destroy();

    // 销毁视图控制器
    this.viewport.destroy();

    // 清除所有事件监听器
    this.removeAllListeners();

    // 清空数据
    this.nodes = [];
    this.connections = [];
  }
}

export default Connector;
