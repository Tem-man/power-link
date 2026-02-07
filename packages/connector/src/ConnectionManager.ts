/**
 * @fileoverview 连接管理器
 * @description 负责连接的创建、更新、断开，以及连线绘制（贝塞尔曲线）、删除按钮等
 */

import type {
  ConnectorContext,
  ConnectorNode,
  Connection,
  ConnectionInfo,
  Dot,
  DotPosition,
  Point,
  SilentOptions,
} from './types';
import type { PositionHelper } from './PositionHelper';

export class ConnectionManager {
  private ctx: ConnectorContext;
  private positionHelper: PositionHelper;

  constructor(ctx: ConnectorContext, positionHelper: PositionHelper) {
    this.ctx = ctx;
    this.positionHelper = positionHelper;
  }

  // ==================== 连接生命周期 ====================

  /**
   * 创建连接
   * @param fromNode - 起始节点
   * @param toNode - 目标节点
   * @param fromDot - 起始触点（可选，自动选择）
   * @param toDot - 目标触点（可选，自动选择）
   * @param options - 配置选项
   */
  createConnection(
    fromNode: ConnectorNode,
    toNode: ConnectorNode,
    fromDot: Dot | null = null,
    toDot: Dot | null = null,
    options: SilentOptions = {},
  ): Connection | undefined {
    // 自动选择触点：如果没有指定，则智能选择
    if (!fromDot && fromNode.dots) {
      fromDot = fromNode.dots.right || fromNode.dots.left || Object.values(fromNode.dots)[0] || null;
    }
    if (!toDot && toNode.dots) {
      toDot = toNode.dots.left || toNode.dots.right || Object.values(toNode.dots)[0] || null;
    }

    if (!fromDot || !toDot) {
      console.warn('无法创建连接：缺少触点');
      return undefined;
    }

    // 检查是否已存在相同的连接（同样的节点和触点）
    const existingConnection = this.ctx.connections.find(
      (conn) =>
        (conn.fromNode.id === fromNode.id &&
          conn.toNode.id === toNode.id &&
          conn.fromDot.position === fromDot!.position &&
          conn.toDot.position === toDot!.position) ||
        (conn.fromNode.id === toNode.id &&
          conn.toNode.id === fromNode.id &&
          conn.fromDot.position === toDot!.position &&
          conn.toDot.position === fromDot!.position),
    );

    if (existingConnection) {
      console.warn('该连接已存在');
      return undefined;
    }

    // 创建连接线
    const connectionLine = this.createLine();
    this.ctx.svg.appendChild(connectionLine);

    // 创建删除按钮
    const deleteButton = this.createDeleteButton();

    const connection: Connection = {
      id: `${fromNode.id}-${toNode.id}-${fromDot.position}-${toDot.position}-${Date.now()}`,
      fromNode,
      toNode,
      fromDot,
      toDot,
      line: connectionLine,
      deleteButton,
    };

    this.ctx.connections.push(connection);

    // 记录节点的连接
    fromNode.connections.push(connection);
    toNode.connections.push(connection);

    // 更新连接线位置
    this.updateConnection(connection);

    // 绑定连线事件（删除按钮等）
    this.bindConnectionEvents(connection);

    // 触发连接回调（除非是静默模式）
    if (!options.silent) {
      this.ctx.onConnect({
        from: fromNode.id,
        fromInfo: fromNode.info,
        to: toNode.id,
        toInfo: toNode.info,
        fromDot: fromDot.position,
        toDot: toDot.position,
      });
    }

    return connection;
  }

  /**
   * 更新单个连接
   */
  updateConnection(connection: Connection): void {
    if (!connection || !connection.line) return;

    const fromPos = this.positionHelper.getDotPosition(
      connection.fromNode.element,
      connection.fromDot.position,
    );
    const toPos = this.positionHelper.getDotPosition(
      connection.toNode.element,
      connection.toDot.position,
    );

    this.updateLine(
      connection.line,
      fromPos,
      toPos,
      connection.fromDot.position,
      connection.toDot.position,
    );

    // 同步更新悬浮路径
    if (connection.hoverPath) {
      this.updateLine(
        connection.hoverPath,
        fromPos,
        toPos,
        connection.fromDot.position,
        connection.toDot.position,
      );
    }

    // 更新删除按钮位置 - 计算贝塞尔曲线上的真实中点
    if (connection.deleteButton) {
      const midPoint = this.getBezierMidPoint(
        fromPos,
        toPos,
        connection.fromDot.position,
        connection.toDot.position,
      );
      connection.deleteButton.style.left = `${midPoint.x - this.ctx.config.deleteButtonSize / 2}px`;
      connection.deleteButton.style.top = `${midPoint.y - this.ctx.config.deleteButtonSize / 2}px`;
    }
  }

  /**
   * 更新节点的所有连接
   */
  updateNodeConnections(nodeId: string): void {
    const connections = this.ctx.connections.filter(
      (conn) => conn.fromNode.id === nodeId || conn.toNode.id === nodeId,
    );
    connections.forEach((conn) => this.updateConnection(conn));
  }

  /**
   * 更新所有连接线位置
   */
  updateAllConnections(): void {
    this.ctx.connections.forEach((conn) => this.updateConnection(conn));
  }

  /**
   * 断开连接
   * @param connectionId - 连接 ID，如果不提供则断开所有连接
   * @param options - 配置选项
   */
  disconnect(connectionId?: string, options: SilentOptions = {}): void {
    if (connectionId) {
      const index = this.ctx.connections.findIndex((conn) => conn.id === connectionId);
      if (index === -1) return;

      const connection = this.ctx.connections[index];
      const connectionInfo: ConnectionInfo = {
        from: connection.fromNode.id,
        fromInfo: connection.fromNode.info,
        to: connection.toNode.id,
        toInfo: connection.toNode.info,
        fromDot: connection.fromDot.position,
        toDot: connection.toDot.position,
      };

      // 移除连接线
      if (connection.line && connection.line.parentNode) {
        this.ctx.svg.removeChild(connection.line);
      }

      // 移除悬浮路径
      if (connection.hoverPath && connection.hoverPath.parentNode) {
        this.ctx.svg.removeChild(connection.hoverPath);
      }

      // 移除删除按钮
      if (connection.deleteButton && connection.deleteButton.parentNode) {
        connection.deleteButton.parentNode.removeChild(connection.deleteButton);
      }

      // 从节点的连接列表中移除
      connection.fromNode.connections = connection.fromNode.connections.filter(
        (c) => c.id !== connectionId,
      );
      connection.toNode.connections = connection.toNode.connections.filter(
        (c) => c.id !== connectionId,
      );

      // 从连接列表中移除
      this.ctx.connections.splice(index, 1);

      // 触发断开连接回调（除非是静默模式）
      if (!options.silent) {
        this.ctx.onDisconnect(connectionInfo);
      }
    } else {
      // 断开所有连接
      const allConnections = [...this.ctx.connections];
      allConnections.forEach((conn) => this.disconnect(conn.id, options));
    }
  }

  // ==================== 连接查询 ====================

  /**
   * 获取所有连接
   */
  getConnections(): ConnectionInfo[] {
    return this.ctx.connections.map((conn) => ({
      id: conn.id,
      from: conn.fromNode.id,
      to: conn.toNode.id,
      fromDot: conn.fromDot.position,
      toDot: conn.toDot.position,
    }));
  }

  /**
   * 获取节点的所有连接
   */
  getNodeConnections(nodeId: string): ConnectionInfo[] {
    return this.ctx.connections
      .filter((conn) => conn.fromNode.id === nodeId || conn.toNode.id === nodeId)
      .map((conn) => ({
        id: conn.id,
        from: conn.fromNode.id,
        to: conn.toNode.id,
        fromDot: conn.fromDot.position,
        toDot: conn.toDot.position,
      }));
  }

  // ==================== SVG 线条绘制 ====================

  /**
   * 创建线条
   */
  createLine(): SVGPathElement {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('stroke', this.ctx.config.lineColor);
    path.setAttribute('stroke-width', String(this.ctx.config.lineWidth));
    path.setAttribute('fill', 'none');
    return path;
  }

  /**
   * 更新线条路径（贝塞尔曲线）
   * @param line - SVG 路径元素
   * @param start - 起点坐标
   * @param end - 终点坐标
   * @param startDotPosition - 起点触点位置
   * @param endDotPosition - 终点触点位置
   */
  updateLine(
    line: SVGPathElement,
    start: Point,
    end: Point,
    startDotPosition: DotPosition = 'right',
    endDotPosition: DotPosition = 'left',
  ): void {
    const dx = end.x - start.x;
    const dy = end.y - start.y;

    // 控制点偏移量，根据距离动态调整
    const distance = Math.sqrt(dx * dx + dy * dy);
    const controlPointOffset = Math.min(distance * 0.5, 150);

    // 根据触点位置决定控制点方向
    const startControlX =
      startDotPosition === 'right'
        ? start.x + controlPointOffset
        : start.x - controlPointOffset;

    const endControlX =
      endDotPosition === 'right'
        ? end.x + controlPointOffset
        : end.x - controlPointOffset;

    // 使用三次贝塞尔曲线
    const path =
      `M ${start.x} ${start.y} C ${startControlX} ${start.y}, ${endControlX} ${end.y}, ${end.x} ${end.y}`;
    line.setAttribute('d', path);
  }

  /**
   * 计算三次贝塞尔曲线的中点（t=0.5 处的点）
   */
  getBezierMidPoint(
    start: Point,
    end: Point,
    startDotPosition: DotPosition = 'right',
    endDotPosition: DotPosition = 'left',
  ): Point {
    const dx = end.x - start.x;
    const dy = end.y - start.y;

    const distance = Math.sqrt(dx * dx + dy * dy);
    const controlPointOffset = Math.min(distance * 0.5, 150);

    const cp1x =
      startDotPosition === 'right'
        ? start.x + controlPointOffset
        : start.x - controlPointOffset;
    const cp1y = start.y;

    const cp2x =
      endDotPosition === 'right'
        ? end.x + controlPointOffset
        : end.x - controlPointOffset;
    const cp2y = end.y;

    // 三次贝塞尔曲线在 t=0.5 处的点
    const t = 0.5;
    const t2 = t * t;
    const t3 = t2 * t;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;

    const x = mt3 * start.x + 3 * mt2 * t * cp1x + 3 * mt * t2 * cp2x + t3 * end.x;
    const y = mt3 * start.y + 3 * mt2 * t * cp1y + 3 * mt * t2 * cp2y + t3 * end.y;

    return { x, y };
  }

  // ==================== UI 元素 ====================

  /**
   * 创建删除按钮
   */
  private createDeleteButton(): HTMLDivElement {
    const deleteButton = document.createElement('div');
    deleteButton.className = 'connector-delete-btn';
    deleteButton.innerHTML = '×';
    deleteButton.style.cssText = `
      position: absolute;
      width: ${this.ctx.config.deleteButtonSize}px;
      height: ${this.ctx.config.deleteButtonSize}px;
      background-color: #ff4d4f;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 16px;
      font-weight: bold;
      z-index: 100;
      opacity: 0;
      transition: opacity 0.2s, transform 0.2s;
      pointer-events: none;
    `;

    // 将删除按钮添加到 contentWrapper 内，使其跟随变换
    this.ctx.contentWrapper.appendChild(deleteButton);

    deleteButton.addEventListener('mouseenter', () => {
      deleteButton.style.transform = 'scale(1.2)';
    });

    deleteButton.addEventListener('mouseleave', () => {
      deleteButton.style.transform = 'scale(1)';
      deleteButton.style.opacity = '0';
      deleteButton.style.pointerEvents = 'none';
    });

    return deleteButton;
  }

  /**
   * 绑定连线的删除按钮事件
   */
  private bindConnectionEvents(connection: Connection): void {
    const { line, deleteButton } = connection;

    // 设置连线可交互（但保持原始宽度）
    line.style.pointerEvents = 'stroke';
    line.style.cursor = 'pointer';

    // 创建一个不可见的宽区域用于悬浮检测
    const hoverPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    hoverPath.setAttribute('stroke', 'transparent');
    hoverPath.setAttribute('stroke-width', '20');
    hoverPath.setAttribute('fill', 'none');
    hoverPath.style.pointerEvents = 'stroke';
    hoverPath.style.cursor = 'pointer';

    // 复制路径
    hoverPath.setAttribute('d', line.getAttribute('d') || '');
    this.ctx.svg.insertBefore(hoverPath, line);

    connection.hoverPath = hoverPath;

    const showDeleteButton = () => {
      deleteButton.style.opacity = '1';
      deleteButton.style.pointerEvents = 'auto';
    };

    const hideDeleteButton = () => {
      setTimeout(() => {
        if (!deleteButton.matches(':hover')) {
          deleteButton.style.opacity = '0';
          deleteButton.style.pointerEvents = 'none';
        }
      }, 100);
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
   * 销毁连接管理器
   */
  destroy(options: SilentOptions = {}): void {
    this.disconnect(undefined, { silent: options.silent ?? true });
  }
}

