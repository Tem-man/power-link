/**
 * 视图控制器
 * 负责处理画布的缩放、平移和视图变换
 */
import { EventEmitter } from '../core/EventEmitter';
import type { ViewState, Point } from '../types';
import { clamp } from '../utils/geometry';
import { debounce } from '../utils/dom';

/**
 * ViewportController 事件映射
 */
export interface ViewportEventMap {
  /** 视图变化 */
  'view:change': ViewState;
  /** 缩放变化 */
  'zoom:change': { scale: number; point?: Point };
  /** 平移变化 */
  'pan:change': { translateX: number; translateY: number };
  /** 平移开始 */
  'pan:start': Point;
  /** 平移结束 */
  'pan:end': Point;
}

/**
 * ViewportController 配置
 */
export interface ViewportConfig {
  /** 是否启用缩放 */
  enableZoom: boolean;
  /** 是否启用平移 */
  enablePan: boolean;
  /** 最小缩放比例 */
  minZoom: number;
  /** 最大缩放比例 */
  maxZoom: number;
  /** 缩放步长 */
  zoomStep: number;
}

/**
 * 视图控制器类
 */
export class ViewportController extends EventEmitter<ViewportEventMap> {
  /** 容器元素 */
  private container: HTMLElement;

  /** 内容包装器 */
  private contentWrapper: HTMLElement | null = null;

  /** 配置 */
  private config: ViewportConfig;

  /** 视图状态 */
  private viewState: ViewState = {
    scale: 1,
    translateX: 0,
    translateY: 0,
  };

  /** 是否正在平移 */
  private isPanning: boolean = false;

  /** 平移起始位置 */
  private panStart: Point = { x: 0, y: 0 };

  /** 事件处理函数引用（用于移除监听） */
  private handleWheel: ((e: WheelEvent) => void) | null = null;
  private handlePanStart: ((e: MouseEvent) => void) | null = null;
  private handlePanMove: ((e: MouseEvent) => void) | null = null;
  private handlePanEnd: (() => void) | null = null;
  private handleResize: (() => void) | null = null;
  private resizeObserver: ResizeObserver | null = null;

  /** 外部检查函数：是否可以开始平移 */
  public canStartPan: ((e: MouseEvent) => boolean) | null = null;

  /** 窗口大小变化回调 */
  public onResize: (() => void) | null = null;

  constructor(container: HTMLElement, config: Partial<ViewportConfig> = {}) {
    super();

    this.container = container;
    this.config = {
      enableZoom: config.enableZoom !== false,
      enablePan: config.enablePan !== false,
      minZoom: config.minZoom ?? 0.1,
      maxZoom: config.maxZoom ?? 4,
      zoomStep: config.zoomStep ?? 0.1,
    };
  }

  /**
   * 初始化视图控制器
   * @param contentWrapper - 内容包装器元素
   */
  init(contentWrapper: HTMLElement): void {
    this.contentWrapper = contentWrapper;

    // 绑定事件
    if (this.config.enableZoom) {
      this.bindZoomEvents();
    }
    if (this.config.enablePan) {
      this.bindPanEvents();
    }
    this.bindResizeEvents();

    // 应用初始变换
    this.updateTransform();
  }

  /**
   * 更新变换矩阵
   */
  updateTransform(): void {
    if (!this.contentWrapper) return;

    const { scale, translateX, translateY } = this.viewState;
    this.contentWrapper.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;

    // 触发视图变化事件
    this.emit('view:change', { ...this.viewState });
  }

  /**
   * 绑定缩放事件
   */
  private bindZoomEvents(): void {
    this.handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const containerRect = this.container.getBoundingClientRect();
      const mouseX = e.clientX - containerRect.left;
      const mouseY = e.clientY - containerRect.top;

      // 计算缩放方向
      const delta = e.deltaY < 0 ? this.config.zoomStep : -this.config.zoomStep;
      const newScale = clamp(
        this.viewState.scale + delta,
        this.config.minZoom,
        this.config.maxZoom
      );

      // 以鼠标位置为中心缩放
      this.zoomAtPoint(newScale, mouseX, mouseY);
    };

    this.container.addEventListener('wheel', this.handleWheel, { passive: false });
  }

  /**
   * 绑定平移事件
   */
  private bindPanEvents(): void {
    // 设置默认光标
    this.container.style.cursor = 'grab';

    // 鼠标按下
    this.handlePanStart = (e: MouseEvent) => {
      // 检查是否可以开始平移
      if (this.canStartPan && !this.canStartPan(e)) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      this.isPanning = true;
      this.panStart = {
        x: e.clientX - this.viewState.translateX,
        y: e.clientY - this.viewState.translateY,
      };
      this.container.style.cursor = 'grabbing';

      this.emit('pan:start', { x: e.clientX, y: e.clientY });
    };

    // 鼠标移动
    this.handlePanMove = (e: MouseEvent) => {
      if (this.isPanning) {
        e.preventDefault();
        this.viewState.translateX = e.clientX - this.panStart.x;
        this.viewState.translateY = e.clientY - this.panStart.y;
        this.updateTransform();

        this.emit('pan:change', {
          translateX: this.viewState.translateX,
          translateY: this.viewState.translateY,
        });
      }
    };

    // 鼠标释放
    this.handlePanEnd = () => {
      if (this.isPanning) {
        this.stopPan();
        this.emit('pan:end', {
          x: this.viewState.translateX,
          y: this.viewState.translateY,
        });
      }
    };

    // 绑定事件
    this.container.addEventListener('mousedown', this.handlePanStart);
    document.addEventListener('mousemove', this.handlePanMove);
    document.addEventListener('mouseup', this.handlePanEnd);
  }

  /**
   * 停止平移
   */
  stopPan(): void {
    this.isPanning = false;
    this.container.style.cursor = 'grab';
  }

  /**
   * 绑定窗口大小变化事件
   */
  private bindResizeEvents(): void {
    const debouncedResize = debounce(() => {
      if (this.onResize) {
        this.onResize();
      }
    }, 100);

    this.handleResize = debouncedResize;
    window.addEventListener('resize', this.handleResize);

    // 使用 ResizeObserver 监听容器大小变化
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(debouncedResize);
      this.resizeObserver.observe(this.container);
    }
  }

  /**
   * 以指定点为中心缩放
   * @param newScale - 新的缩放比例
   * @param pointX - 缩放中心点 X 坐标（相对容器）
   * @param pointY - 缩放中心点 Y 坐标（相对容器）
   */
  zoomAtPoint(newScale: number, pointX: number, pointY: number): void {
    const oldScale = this.viewState.scale;
    newScale = clamp(newScale, this.config.minZoom, this.config.maxZoom);

    // 计算缩放点在变换前的坐标
    const worldX = (pointX - this.viewState.translateX) / oldScale;
    const worldY = (pointY - this.viewState.translateY) / oldScale;

    // 更新缩放
    this.viewState.scale = newScale;

    // 调整平移，保持缩放点位置不变
    this.viewState.translateX = pointX - worldX * newScale;
    this.viewState.translateY = pointY - worldY * newScale;

    this.updateTransform();

    this.emit('zoom:change', { scale: newScale, point: { x: pointX, y: pointY } });
  }

  /**
   * 设置缩放比例（以画布中心为基准）
   * @param scale - 缩放比例
   */
  setZoom(scale: number): void {
    const containerRect = this.container.getBoundingClientRect();
    const centerX = containerRect.width / 2;
    const centerY = containerRect.height / 2;
    this.zoomAtPoint(scale, centerX, centerY);
  }

  /**
   * 获取当前缩放比例
   */
  getZoom(): number {
    return this.viewState.scale;
  }

  /**
   * 重置视图
   */
  resetView(): void {
    this.viewState.scale = 1;
    this.viewState.translateX = 0;
    this.viewState.translateY = 0;
    this.updateTransform();
  }

  /**
   * 放大
   */
  zoomIn(): void {
    const newScale = Math.min(this.config.maxZoom, this.viewState.scale + this.config.zoomStep);
    this.setZoom(newScale);
  }

  /**
   * 缩小
   */
  zoomOut(): void {
    const newScale = Math.max(this.config.minZoom, this.viewState.scale - this.config.zoomStep);
    this.setZoom(newScale);
  }

  /**
   * 获取视图状态
   */
  getViewState(): ViewState {
    return { ...this.viewState };
  }

  /**
   * 设置视图状态
   * @param state - 视图状态
   */
  setViewState(state: Partial<ViewState> = {}): void {
    if (typeof state.scale === 'number') {
      this.viewState.scale = clamp(state.scale, this.config.minZoom, this.config.maxZoom);
    }
    if (typeof state.translateX === 'number') {
      this.viewState.translateX = state.translateX;
    }
    if (typeof state.translateY === 'number') {
      this.viewState.translateY = state.translateY;
    }
    this.updateTransform();
  }

  /**
   * 屏幕坐标转世界坐标
   * @param screenX - 屏幕 X 坐标（相对容器）
   * @param screenY - 屏幕 Y 坐标（相对容器）
   */
  screenToWorld(screenX: number, screenY: number): Point {
    const { scale, translateX, translateY } = this.viewState;
    return {
      x: (screenX - translateX) / scale,
      y: (screenY - translateY) / scale,
    };
  }

  /**
   * 世界坐标转屏幕坐标
   * @param worldX - 世界 X 坐标
   * @param worldY - 世界 Y 坐标
   */
  worldToScreen(worldX: number, worldY: number): Point {
    const { scale, translateX, translateY } = this.viewState;
    return {
      x: worldX * scale + translateX,
      y: worldY * scale + translateY,
    };
  }

  /**
   * 获取容器元素
   */
  getContainer(): HTMLElement {
    return this.container;
  }

  /**
   * 获取内容包装器
   */
  getContentWrapper(): HTMLElement | null {
    return this.contentWrapper;
  }

  /**
   * 检查是否正在平移
   */
  getIsPanning(): boolean {
    return this.isPanning;
  }

  /**
   * 销毁视图控制器
   */
  destroy(): void {
    // 移除缩放事件
    if (this.handleWheel) {
      this.container.removeEventListener('wheel', this.handleWheel);
      this.handleWheel = null;
    }

    // 移除平移事件
    if (this.handlePanStart) {
      this.container.removeEventListener('mousedown', this.handlePanStart);
      this.handlePanStart = null;
    }
    if (this.handlePanMove) {
      document.removeEventListener('mousemove', this.handlePanMove);
      this.handlePanMove = null;
    }
    if (this.handlePanEnd) {
      document.removeEventListener('mouseup', this.handlePanEnd);
      this.handlePanEnd = null;
    }

    // 移除窗口大小变化事件
    if (this.handleResize) {
      window.removeEventListener('resize', this.handleResize);
      this.handleResize = null;
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // 清除所有事件监听器
    this.removeAllListeners();

    // 清除引用
    this.contentWrapper = null;
    this.canStartPan = null;
    this.onResize = null;
  }
}

export default ViewportController;

