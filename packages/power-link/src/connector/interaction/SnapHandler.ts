/**
 * 吸附处理器
 * 负责处理连线时的吸附效果
 */
import { EventEmitter } from '../core/EventEmitter';
import type { Point, DotPosition } from '../types';
import type { NodeModel, DotModel } from '../model';
import { calculateDistance } from '../utils/geometry';

/**
 * 吸附结果
 */
export interface SnapResult {
  /** 目标节点 */
  node: NodeModel;
  /** 目标触点 */
  dot: DotModel;
  /** 吸附位置 */
  position: Point;
}

/**
 * SnapHandler 事件映射
 */
export interface SnapEventMap {
  /** 吸附到目标 */
  'snap:enter': SnapResult;
  /** 离开吸附目标 */
  'snap:leave': void;
}

/**
 * SnapHandler 配置
 */
export interface SnapHandlerConfig {
  /** 是否启用吸附 */
  enabled: boolean;
  /** 吸附距离（像素） */
  snapDistance: number;
}

/**
 * 吸附处理器类
 */
export class SnapHandler extends EventEmitter<SnapEventMap> {
  /** 配置 */
  private config: SnapHandlerConfig;

  /** 当前吸附的目标节点 */
  private snapTarget: NodeModel | null = null;

  /** 当前吸附的目标触点 */
  private snapTargetDot: DotModel | null = null;

  /** 是否处于吸附状态 */
  private isSnapped: boolean = false;

  /** 获取所有节点的函数 */
  private getNodes: () => NodeModel[];

  /** 获取触点位置的函数 */
  private getDotPosition: (element: HTMLElement, position: DotPosition) => Point;

  /** 高亮节点回调 */
  public onHighlightNode: ((element: HTMLElement) => void) | null = null;

  /** 取消高亮节点回调 */
  public onUnhighlightNode: ((element: HTMLElement) => void) | null = null;

  /** 高亮触点回调 */
  public onHighlightDot: ((element: HTMLDivElement) => void) | null = null;

  /** 取消高亮触点回调 */
  public onUnhighlightDot: ((element: HTMLDivElement) => void) | null = null;

  constructor(
    config: Partial<SnapHandlerConfig> = {},
    getNodes: () => NodeModel[],
    getDotPosition: (element: HTMLElement, position: DotPosition) => Point
  ) {
    super();

    this.config = {
      enabled: config.enabled !== false,
      snapDistance: config.snapDistance ?? 20,
    };

    this.getNodes = getNodes;
    this.getDotPosition = getDotPosition;
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
   * 获取吸附距离
   */
  getSnapDistance(): number {
    return this.config.snapDistance;
  }

  /**
   * 设置吸附距离
   */
  setSnapDistance(distance: number): void {
    this.config.snapDistance = distance;
  }

  /**
   * 检查是否处于吸附状态
   */
  getIsSnapped(): boolean {
    return this.isSnapped;
  }

  /**
   * 获取当前吸附目标
   */
  getSnapTarget(): { node: NodeModel; dot: DotModel } | null {
    if (this.snapTarget && this.snapTargetDot) {
      return { node: this.snapTarget, dot: this.snapTargetDot };
    }
    return null;
  }

  /**
   * 检查吸附
   * @param position - 当前鼠标位置（世界坐标）
   * @param excludeNode - 要排除的节点（通常是起始节点）
   * @returns 吸附结果或 null
   */
  checkSnap(position: Point, excludeNode: NodeModel): SnapResult | null {
    if (!this.config.enabled) return null;

    let closestNode: NodeModel | null = null;
    let closestDot: DotModel | null = null;
    let closestDistance = Infinity;
    let closestPosition: Point | null = null;

    const nodes = this.getNodes();

    // 遍历所有节点，找到最近的触点
    for (const node of nodes) {
      // 跳过排除的节点
      if (node.id === excludeNode.id) continue;

      // 遍历该节点的所有触点
      node.forEachDot((dot, dotPosition) => {
        const dotPos = this.getDotPosition(node.element, dotPosition);

        // 计算距离
        const distance = calculateDistance(position, dotPos);

        // 如果在吸附范围内且是最近的
        if (distance < this.config.snapDistance && distance < closestDistance) {
          closestDistance = distance;
          closestNode = node;
          closestDot = dot;
          closestPosition = dotPos;
        }
      });
    }

    if (closestNode && closestDot && closestPosition) {
      const result: SnapResult = {
        node: closestNode,
        dot: closestDot,
        position: closestPosition,
      };

      // 更新吸附状态
      this.updateSnapState(result);

      return result;
    }

    // 清除吸附状态
    this.clearSnapState();
    return null;
  }

  /**
   * 更新吸附状态
   */
  private updateSnapState(result: SnapResult): void {
    const wasSnapped = this.isSnapped;
    const prevTarget = this.snapTarget;
    const prevDot = this.snapTargetDot;

    // 如果吸附目标改变，先清除旧的高亮
    if (prevTarget && (prevTarget.id !== result.node.id || prevDot !== result.dot)) {
      this.clearHighlight();
    }

    this.isSnapped = true;
    this.snapTarget = result.node;
    this.snapTargetDot = result.dot;

    // 高亮新目标
    this.highlightTarget(result.node, result.dot);

    // 触发事件
    if (!wasSnapped || prevTarget?.id !== result.node.id) {
      this.emit('snap:enter', result);
    }
  }

  /**
   * 清除吸附状态
   */
  private clearSnapState(): void {
    if (this.isSnapped) {
      this.clearHighlight();
      this.isSnapped = false;
      this.snapTarget = null;
      this.snapTargetDot = null;
      this.emit('snap:leave', undefined);
    }
  }

  /**
   * 高亮吸附目标
   */
  highlightTarget(node: NodeModel, dot?: DotModel): void {
    // 高亮节点
    if (this.onHighlightNode) {
      this.onHighlightNode(node.element);
    }

    // 高亮触点
    if (dot && this.onHighlightDot) {
      this.onHighlightDot(dot.element);
    }
  }

  /**
   * 清除高亮
   */
  clearHighlight(): void {
    const nodes = this.getNodes();

    nodes.forEach((node) => {
      // 检查节点是否有吸附标记
      if (node.element.dataset.snapped === 'true') {
        if (this.onUnhighlightNode) {
          this.onUnhighlightNode(node.element);
        }

        // 清除触点高亮
        node.forEachDot((dot) => {
          if (dot.element.dataset.highlighted === 'true') {
            if (this.onUnhighlightDot) {
              this.onUnhighlightDot(dot.element);
            }
          }
        });
      }
    });
  }

  /**
   * 强制清除吸附状态
   */
  reset(): void {
    this.clearSnapState();
  }

  /**
   * 销毁处理器
   */
  destroy(): void {
    this.clearHighlight();
    this.removeAllListeners();
    this.onHighlightNode = null;
    this.onUnhighlightNode = null;
    this.onHighlightDot = null;
    this.onUnhighlightDot = null;
  }
}

export default SnapHandler;

