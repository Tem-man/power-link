/**
 * @fileoverview 位置计算辅助类
 * @description 负责元素中心、触点位置、节点命中检测等坐标计算
 */

import type { ConnectorContext, ConnectorNode, DotPosition, Point } from './types';

export class PositionHelper {
  private ctx: ConnectorContext;

  constructor(ctx: ConnectorContext) {
    this.ctx = ctx;
  }

  /**
   * 获取元素中心位置（SVG 坐标系统）
   */
  getElementCenter(element: HTMLElement): Point {
    const rect = element.getBoundingClientRect();
    const containerRect = this.ctx.container.getBoundingClientRect();

    // 计算相对于容器的位置（屏幕坐标）
    const screenX = rect.left + rect.width / 2 - containerRect.left;
    const screenY = rect.top + rect.height / 2 - containerRect.top;

    // 转换为 SVG 坐标系统（考虑缩放和平移）
    const { scale, translateX, translateY } = this.ctx.viewState;
    const svgX = (screenX - translateX) / scale;
    const svgY = (screenY - translateY) / scale;

    return { x: svgX, y: svgY };
  }

  /**
   * 获取连接点位置（SVG 坐标系统）
   * @param element - 节点元素
   * @param dotPosition - 触点位置 'left' 或 'right'
   */
  getDotPosition(element: HTMLElement, dotPosition: DotPosition): Point {
    const rect = element.getBoundingClientRect();
    const containerRect = this.ctx.container.getBoundingClientRect();

    // 计算相对于容器的位置（屏幕坐标）
    const screenX =
      dotPosition === 'right'
        ? rect.right - containerRect.left
        : rect.left - containerRect.left;
    const screenY = rect.top + rect.height / 2 - containerRect.top;

    // 转换为 SVG 坐标系统（考虑缩放和平移）
    const { scale, translateX, translateY } = this.ctx.viewState;
    const svgX = (screenX - translateX) / scale;
    const svgY = (screenY - translateY) / scale;

    return { x: svgX, y: svgY };
  }

  /**
   * 获取指定位置的节点
   * @param x - 客户端 X 坐标
   * @param y - 客户端 Y 坐标
   */
  getNodeAtPosition(x: number, y: number): ConnectorNode | null {
    for (const node of this.ctx.nodes) {
      const rect = node.element.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return node;
      }
    }
    return null;
  }
}

