/**
 * SVG 渲染器
 * 负责创建和管理 SVG 元素（连接线、路径等）
 */
import type { Point, DotPosition } from '../types';
import { createBezierPath, getBezierMidPoint } from '../utils/geometry';
import { createSVGElement, removeElement } from '../utils/dom';

/**
 * 连接线配置
 */
export interface LineConfig {
  /** 线条颜色 */
  color: string;
  /** 线条宽度 */
  width: number;
}

/**
 * 删除按钮配置
 */
export interface DeleteButtonConfig {
  /** 按钮大小 */
  size: number;
}

/**
 * 连接线元素组
 */
export interface ConnectionElements {
  /** 可见连接线 */
  line: SVGPathElement;
  /** 悬浮检测路径（更宽的透明区域） */
  hoverPath: SVGPathElement;
  /** 删除按钮 */
  deleteButton: HTMLDivElement;
}

/**
 * SVG 渲染器类
 */
export class SVGRenderer {
  /** SVG 画布元素 */
  private svg: SVGSVGElement;

  /** 内容包装器（用于添加删除按钮等 HTML 元素） */
  private contentWrapper: HTMLElement;

  /** 线条配置 */
  private lineConfig: LineConfig;

  /** 删除按钮配置 */
  private deleteButtonConfig: DeleteButtonConfig;

  constructor(
    contentWrapper: HTMLElement,
    config: {
      lineColor?: string;
      lineWidth?: number;
      deleteButtonSize?: number;
    } = {}
  ) {
    this.contentWrapper = contentWrapper;

    this.lineConfig = {
      color: config.lineColor ?? '#155BD4',
      width: config.lineWidth ?? 2,
    };

    this.deleteButtonConfig = {
      size: config.deleteButtonSize ?? 20,
    };

    // 创建 SVG 画布
    this.svg = this.createSVGCanvas();
    this.contentWrapper.appendChild(this.svg);
  }

  /**
   * 创建 SVG 画布
   */
  private createSVGCanvas(): SVGSVGElement {
    const svg = createSVGElement('svg');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.pointerEvents = 'none';
    svg.style.zIndex = '1';
    return svg;
  }

  /**
   * 获取 SVG 元素
   */
  getSVG(): SVGSVGElement {
    return this.svg;
  }

  /**
   * 创建连接线（仅路径，不含交互）
   * @param config - 可选的线条配置覆盖
   */
  createLine(config?: Partial<LineConfig>): SVGPathElement {
    const path = createSVGElement('path', {
      stroke: config?.color ?? this.lineConfig.color,
      'stroke-width': config?.width ?? this.lineConfig.width,
      fill: 'none',
    });
    return path;
  }

  /**
   * 创建临时连线（用于拖拽时预览）
   */
  createTempLine(): SVGPathElement {
    const line = this.createLine();
    this.svg.appendChild(line);
    return line;
  }

  /**
   * 移除临时连线
   */
  removeTempLine(line: SVGPathElement): void {
    removeElement(line);
  }

  /**
   * 创建完整的连接元素组（连接线 + 悬浮路径 + 删除按钮）
   */
  createConnectionElements(): ConnectionElements {
    // 创建悬浮检测路径（更宽的透明区域，便于鼠标交互）
    const hoverPath = createSVGElement('path', {
      stroke: 'transparent',
      'stroke-width': 20,
      fill: 'none',
    });
    hoverPath.style.pointerEvents = 'stroke';
    hoverPath.style.cursor = 'pointer';

    // 创建可见连接线
    const line = this.createLine();
    line.style.pointerEvents = 'stroke';
    line.style.cursor = 'pointer';

    // 创建删除按钮
    const deleteButton = this.createDeleteButton();

    // 按顺序添加到 SVG（hoverPath 在下面，line 在上面）
    this.svg.appendChild(hoverPath);
    this.svg.appendChild(line);

    return { line, hoverPath, deleteButton };
  }

  /**
   * 更新连接线路径
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
    endDotPosition: DotPosition = 'left'
  ): void {
    const pathData = createBezierPath(start, end, startDotPosition, endDotPosition);
    line.setAttribute('d', pathData);
  }

  /**
   * 同步更新连接线和悬浮路径
   */
  updateConnectionPaths(
    line: SVGPathElement,
    hoverPath: SVGPathElement,
    start: Point,
    end: Point,
    startDotPosition: DotPosition = 'right',
    endDotPosition: DotPosition = 'left'
  ): void {
    const pathData = createBezierPath(start, end, startDotPosition, endDotPosition);
    line.setAttribute('d', pathData);
    hoverPath.setAttribute('d', pathData);
  }

  /**
   * 更新删除按钮位置（放在连接线中点）
   */
  updateDeleteButtonPosition(
    deleteButton: HTMLDivElement,
    start: Point,
    end: Point,
    startDotPosition: DotPosition = 'right',
    endDotPosition: DotPosition = 'left'
  ): void {
    const midPoint = getBezierMidPoint(start, end, startDotPosition, endDotPosition);
    const size = this.deleteButtonConfig.size;
    deleteButton.style.left = `${midPoint.x - size / 2}px`;
    deleteButton.style.top = `${midPoint.y - size / 2}px`;
  }

  /**
   * 创建删除按钮
   */
  createDeleteButton(): HTMLDivElement {
    const size = this.deleteButtonConfig.size;
    const deleteButton = document.createElement('div');
    deleteButton.className = 'connector-delete-btn';
    deleteButton.innerHTML = '×';
    deleteButton.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
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

    // 将删除按钮添加到 contentWrapper
    this.contentWrapper.appendChild(deleteButton);

    // 悬浮效果
    deleteButton.addEventListener('mouseenter', () => {
      deleteButton.style.transform = 'scale(1.2)';
    });

    deleteButton.addEventListener('mouseleave', () => {
      deleteButton.style.transform = 'scale(1)';
      this.hideDeleteButton(deleteButton);
    });

    return deleteButton;
  }

  /**
   * 显示删除按钮
   */
  showDeleteButton(deleteButton: HTMLDivElement): void {
    deleteButton.style.opacity = '1';
    deleteButton.style.pointerEvents = 'auto';
  }

  /**
   * 隐藏删除按钮
   */
  hideDeleteButton(deleteButton: HTMLDivElement): void {
    // 延迟隐藏，防止从线移到按钮时闪烁
    setTimeout(() => {
      if (!deleteButton.matches(':hover')) {
        deleteButton.style.opacity = '0';
        deleteButton.style.pointerEvents = 'none';
      }
    }, 100);
  }

  /**
   * 移除连接元素组
   */
  removeConnectionElements(elements: ConnectionElements): void {
    removeElement(elements.line);
    removeElement(elements.hoverPath);
    removeElement(elements.deleteButton);
  }

  /**
   * 移除路径元素
   */
  removePath(path: SVGPathElement): void {
    removeElement(path);
  }

  /**
   * 创建触点元素
   * @param position - 触点位置 'left' 或 'right'
   * @param config - 触点配置
   */
  createDot(
    position: DotPosition,
    config: {
      size: number;
      color: string;
      hoverScale: number;
    }
  ): HTMLDivElement {
    const dot = document.createElement('div');
    dot.className = 'connector-dot';

    // 根据位置设置触点
    const positionStyle =
      position === 'right'
        ? `right: -${config.size / 2}px;`
        : `left: -${config.size / 2}px;`;

    dot.style.cssText = `
      position: absolute;
      width: ${config.size}px;
      height: ${config.size}px;
      background-color: ${config.color};
      border: 2px solid white;
      border-radius: 50%;
      cursor: pointer;
      ${positionStyle}
      top: 50%;
      transform: translateY(-50%);
      z-index: 10;
      transition: transform 0.2s;
    `;

    // 保存基础 transform 用于悬浮效果
    dot.dataset.baseTransform = 'translateY(-50%)';

    // 悬浮效果
    dot.addEventListener('mouseenter', () => {
      dot.style.transform = `translateY(-50%) scale(${config.hoverScale})`;
    });
    dot.addEventListener('mouseleave', () => {
      dot.style.transform = 'translateY(-50%) scale(1)';
    });

    return dot;
  }

  /**
   * 高亮触点
   */
  highlightDot(dot: HTMLDivElement): void {
    const baseTransform = dot.dataset.baseTransform || 'translateY(-50%)';
    dot.style.transform = `${baseTransform} scale(1.5)`;
    dot.style.boxShadow = '0 0 10px rgba(21, 91, 212, 0.6)';
    dot.dataset.highlighted = 'true';
  }

  /**
   * 取消触点高亮
   */
  unhighlightDot(dot: HTMLDivElement): void {
    if (dot.dataset.highlighted === 'true') {
      const baseTransform = dot.dataset.baseTransform || 'translateY(-50%)';
      dot.style.transform = baseTransform;
      dot.style.boxShadow = '';
      delete dot.dataset.highlighted;
    }
  }

  /**
   * 高亮节点（吸附效果）
   */
  highlightNode(element: HTMLElement): void {
    element.style.boxShadow = '0 0 0 3px rgba(21, 91, 212, 0.3)';
    element.style.transform = 'scale(1.05)';
    element.dataset.snapped = 'true';
  }

  /**
   * 取消节点高亮
   */
  unhighlightNode(element: HTMLElement): void {
    if (element.dataset.snapped === 'true') {
      element.style.boxShadow = '';
      element.style.transform = '';
      delete element.dataset.snapped;
    }
  }

  /**
   * 更新配置
   */
  updateConfig(config: {
    lineColor?: string;
    lineWidth?: number;
    deleteButtonSize?: number;
  }): void {
    if (config.lineColor !== undefined) {
      this.lineConfig.color = config.lineColor;
    }
    if (config.lineWidth !== undefined) {
      this.lineConfig.width = config.lineWidth;
    }
    if (config.deleteButtonSize !== undefined) {
      this.deleteButtonConfig.size = config.deleteButtonSize;
    }
  }

  /**
   * 获取当前配置
   */
  getConfig(): { line: LineConfig; deleteButton: DeleteButtonConfig } {
    return {
      line: { ...this.lineConfig },
      deleteButton: { ...this.deleteButtonConfig },
    };
  }

  /**
   * 销毁渲染器
   */
  destroy(): void {
    removeElement(this.svg);
  }
}

export default SVGRenderer;

