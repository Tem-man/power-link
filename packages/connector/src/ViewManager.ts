/**
 * @fileoverview 视图管理器
 * @description 负责缩放、平移、窗口大小变化等视图控制逻辑
 */

import type { ConnectorContext, ViewState } from './types';
import type { PositionHelper } from './PositionHelper';

export class ViewManager {
  private ctx: ConnectorContext;
  private positionHelper: PositionHelper;

  // 画布拖拽状态
  private isPanning = false;
  private panStart: { x: number; y: number } = { x: 0, y: 0 };

  // 事件处理函数引用（用于移除监听）
  private handleWheel?: (e: WheelEvent) => void;
  private handlePanStart?: (e: MouseEvent) => void;
  private handlePanMove?: (e: MouseEvent) => void;
  private handlePanEnd?: () => void;
  private handleResize?: () => void;
  private resizeObserver?: ResizeObserver;

  /** 是否正在拖拽节点（由 NodeManager 设置，用于判断是否应处理画布拖拽） */
  isDragging = false;
  isDraggingNode = false;

  constructor(ctx: ConnectorContext, positionHelper: PositionHelper) {
    this.ctx = ctx;
    this.positionHelper = positionHelper;
  }

  /**
   * 初始化视图管理器，绑定事件
   */
  init(): void {
    if (this.ctx.config.enableZoom) {
      this.bindZoomEvents();
    }
    if (this.ctx.config.enablePan) {
      this.bindPanEvents();
    }
    this.bindResizeEvents();
    this.updateTransform();
  }

  /**
   * 更新变换矩阵
   */
  updateTransform(): void {
    if (!this.ctx.contentWrapper) return;

    const { scale, translateX, translateY } = this.ctx.viewState;
    this.ctx.contentWrapper.style.transform =
      `translate(${translateX}px, ${translateY}px) scale(${scale})`;

    // 触发视图变化回调
    this.ctx.onViewChange({ scale, translateX, translateY });
  }

  /**
   * 绑定缩放事件
   */
  private bindZoomEvents(): void {
    this.handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const containerRect = this.ctx.container.getBoundingClientRect();
      const mouseX = e.clientX - containerRect.left;
      const mouseY = e.clientY - containerRect.top;

      // 计算缩放方向
      const delta = e.deltaY < 0 ? this.ctx.config.zoomStep : -this.ctx.config.zoomStep;
      const newScale = Math.max(
        this.ctx.config.minZoom,
        Math.min(this.ctx.config.maxZoom, this.ctx.viewState.scale + delta),
      );

      this.zoomAtPoint(newScale, mouseX, mouseY);
    };

    this.ctx.container.addEventListener('wheel', this.handleWheel, { passive: false });
  }

  /**
   * 绑定平移事件
   */
  private bindPanEvents(): void {
    this.ctx.container.style.cursor = 'grab';

    this.handlePanStart = (e: MouseEvent) => {
      // 如果点击的是连接点或正在拖拽连线/节点，不处理画布拖拽
      if (
        (e.target as HTMLElement).classList.contains('connector-dot') ||
        this.isDragging ||
        this.isDraggingNode
      ) {
        return;
      }

      // 检查是否点击在节点上（节点拖拽优先）
      const clickedNode = this.positionHelper.getNodeAtPosition(e.clientX, e.clientY);
      if (clickedNode && this.ctx.config.enableNodeDrag) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      this.isPanning = true;
      this.panStart = {
        x: e.clientX - this.ctx.viewState.translateX,
        y: e.clientY - this.ctx.viewState.translateY,
      };
      this.ctx.container.style.cursor = 'grabbing';
    };

    this.handlePanMove = (e: MouseEvent) => {
      if (this.isPanning) {
        e.preventDefault();
        this.ctx.viewState.translateX = e.clientX - this.panStart.x;
        this.ctx.viewState.translateY = e.clientY - this.panStart.y;
        this.updateTransform();
      }
    };

    this.handlePanEnd = () => {
      if (this.isPanning) {
        this.stopPan();
      }
    };

    this.ctx.container.addEventListener('mousedown', this.handlePanStart);
    document.addEventListener('mousemove', this.handlePanMove);
    document.addEventListener('mouseup', this.handlePanEnd);
  }

  /**
   * 停止平移
   */
  stopPan(): void {
    this.isPanning = false;
    this.ctx.container.style.cursor = 'grab';
  }

  /**
   * 绑定窗口大小变化事件
   */
  private bindResizeEvents(): void {
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;

    const debouncedUpdate = () => {
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }
      resizeTimer = setTimeout(() => {
        this.onResize();
      }, 100);
    };

    this.handleResize = debouncedUpdate;
    window.addEventListener('resize', this.handleResize);

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(debouncedUpdate);
      this.resizeObserver.observe(this.ctx.container);
    }
  }

  /** resize 时的回调，由外部（Connector 主类）设置 */
  private onResizeCallback?: () => void;

  /**
   * 设置 resize 回调（由主类注入，用于更新所有连接线位置）
   */
  setResizeCallback(callback: () => void): void {
    this.onResizeCallback = callback;
  }

  private onResize(): void {
    this.onResizeCallback?.();
  }

  /**
   * 以指定点为中心缩放
   * @param newScale - 新的缩放比例
   * @param pointX - 缩放中心点 X 坐标（相对容器）
   * @param pointY - 缩放中心点 Y 坐标（相对容器）
   */
  zoomAtPoint(newScale: number, pointX: number, pointY: number): void {
    const oldScale = this.ctx.viewState.scale;

    // 计算缩放点在变换前的坐标
    const worldX = (pointX - this.ctx.viewState.translateX) / oldScale;
    const worldY = (pointY - this.ctx.viewState.translateY) / oldScale;

    // 更新缩放
    this.ctx.viewState.scale = newScale;

    // 调整平移，保持缩放点位置不变
    this.ctx.viewState.translateX = pointX - worldX * newScale;
    this.ctx.viewState.translateY = pointY - worldY * newScale;

    this.updateTransform();
  }

  /**
   * 设置缩放比例（以画布中心为基准）
   */
  setZoom(scale: number): void {
    const containerRect = this.ctx.container.getBoundingClientRect();
    const centerX = containerRect.width / 2;
    const centerY = containerRect.height / 2;
    this.zoomAtPoint(scale, centerX, centerY);
  }

  /**
   * 获取当前缩放比例
   */
  getZoom(): number {
    return this.ctx.viewState.scale;
  }

  /**
   * 重置视图
   */
  resetView(): void {
    this.ctx.viewState.scale = 1;
    this.ctx.viewState.translateX = 0;
    this.ctx.viewState.translateY = 0;
    this.updateTransform();
  }

  /**
   * 放大
   */
  zoomIn(): void {
    const newScale = Math.min(
      this.ctx.config.maxZoom,
      this.ctx.viewState.scale + this.ctx.config.zoomStep,
    );
    this.setZoom(newScale);
  }

  /**
   * 缩小
   */
  zoomOut(): void {
    const newScale = Math.max(
      this.ctx.config.minZoom,
      this.ctx.viewState.scale - this.ctx.config.zoomStep,
    );
    this.setZoom(newScale);
  }

  /**
   * 获取视图状态
   */
  getViewState(): ViewState {
    return { ...this.ctx.viewState };
  }

  /**
   * 设置视图状态（用于初始化或恢复视图）
   */
  setViewState(state: Partial<ViewState>): void {
    if (typeof state.scale === 'number') {
      this.ctx.viewState.scale = Math.max(
        this.ctx.config.minZoom,
        Math.min(this.ctx.config.maxZoom, state.scale),
      );
    }
    if (typeof state.translateX === 'number') {
      this.ctx.viewState.translateX = state.translateX;
    }
    if (typeof state.translateY === 'number') {
      this.ctx.viewState.translateY = state.translateY;
    }
    this.updateTransform();
  }

  /**
   * 销毁视图管理器，移除所有事件监听
   */
  destroy(): void {
    if (this.handleWheel) {
      this.ctx.container.removeEventListener('wheel', this.handleWheel);
    }
    if (this.handlePanStart) {
      this.ctx.container.removeEventListener('mousedown', this.handlePanStart);
    }
    if (this.handlePanMove) {
      document.removeEventListener('mousemove', this.handlePanMove);
    }
    if (this.handlePanEnd) {
      document.removeEventListener('mouseup', this.handlePanEnd);
    }
    if (this.handleResize) {
      window.removeEventListener('resize', this.handleResize);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = undefined;
    }
  }
}

