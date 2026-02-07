/**
 * @fileoverview 吸附管理器
 * @description 负责拖拽连线时的吸附检测、高亮显示和清除
 */

import type { ConnectorContext, ConnectorNode, Dot, SnapResult, Point } from './types';
import type { PositionHelper } from './PositionHelper';

export class SnapManager {
  private ctx: ConnectorContext;
  private positionHelper: PositionHelper;

  /** 当前吸附的目标节点 */
  snapTarget: ConnectorNode | null = null;
  /** 当前吸附的目标触点 */
  snapTargetDot: Dot | null = null;
  /** 是否处于吸附状态 */
  isSnapped = false;

  constructor(ctx: ConnectorContext, positionHelper: PositionHelper) {
    this.ctx = ctx;
    this.positionHelper = positionHelper;
  }

  /**
   * 检查吸附
   * @param position - 当前鼠标位置（SVG 坐标）
   * @param startNode - 起始节点（排除自身）
   * @returns 吸附结果或 null
   */
  checkSnap(position: Point, startNode: ConnectorNode): SnapResult | null {
    if (!this.ctx.config.enableSnap) return null;

    let closestNode: ConnectorNode | null = null;
    let closestDot: Dot | null = null;
    let closestDistance = Infinity;

    for (const node of this.ctx.nodes) {
      // 跳过起始节点
      if (node.id === startNode.id) continue;

      // 遍历该节点的所有触点
      if (node.dots) {
        Object.values(node.dots).forEach((dot) => {
          if (!dot) return;
          const dotPos = this.positionHelper.getDotPosition(node.element, dot.position);

          const dx = position.x - dotPos.x;
          const dy = position.y - dotPos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < this.ctx.config.snapDistance && distance < closestDistance) {
            closestDistance = distance;
            closestNode = node;
            closestDot = dot;
          }
        });
      }
    }

    if (closestNode && closestDot) {
      return {
        node: closestNode,
        dot: closestDot,
        position: this.positionHelper.getDotPosition(
          (closestNode as ConnectorNode).element,
          (closestDot as Dot).position,
        ),
      };
    }

    return null;
  }

  /**
   * 高亮吸附目标
   * @param node - 目标节点
   * @param dot - 目标触点（可选）
   */
  highlightSnapTarget(node: ConnectorNode, dot: Dot | null = null): void {
    if (!node || !node.element) return;

    // 清除之前的高亮
    this.clearSnapHighlight();

    // 添加高亮效果
    node.element.style.boxShadow = '0 0 0 3px rgba(21, 91, 212, 0.3)';
    node.element.style.transform = 'scale(1.05)';
    node.element.dataset.snapped = 'true';

    // 高亮指定的连接点
    if (dot && dot.element) {
      const baseTransform = dot.element.dataset.baseTransform || 'translateY(-50%)';
      dot.element.style.transform = `${baseTransform} scale(1.5)`;
      dot.element.style.boxShadow = '0 0 10px rgba(21, 91, 212, 0.6)';
      dot.element.dataset.highlighted = 'true';
    }
  }

  /**
   * 清除吸附高亮
   */
  clearSnapHighlight(): void {
    this.ctx.nodes.forEach((node) => {
      if (node.element.dataset.snapped === 'true') {
        node.element.style.boxShadow = '';
        node.element.style.transform = '';
        delete node.element.dataset.snapped;

        // 清除所有触点的高亮
        if (node.dots) {
          Object.values(node.dots).forEach((dot) => {
            if (dot && dot.element.dataset.highlighted === 'true') {
              const baseTransform = dot.element.dataset.baseTransform || 'translateY(-50%)';
              dot.element.style.transform = baseTransform;
              dot.element.style.boxShadow = '';
              delete dot.element.dataset.highlighted;
            }
          });
        }
      }
    });
  }

  /**
   * 重置吸附状态
   */
  resetState(): void {
    this.clearSnapHighlight();
    this.snapTarget = null;
    this.snapTargetDot = null;
    this.isSnapped = false;
  }
}

