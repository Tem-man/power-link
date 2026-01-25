/**
 * 几何计算工具函数
 */
import type { Point, DotPosition, BezierControlPoints } from '../types';

/**
 * 计算两点之间的距离
 * @param p1 - 第一个点
 * @param p2 - 第二个点
 * @returns 两点之间的欧几里得距离
 */
export function calculateDistance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 计算贝塞尔曲线的控制点
 * @param start - 起点坐标
 * @param end - 终点坐标
 * @param startDotPosition - 起点触点位置
 * @param endDotPosition - 终点触点位置
 * @param maxOffset - 最大控制点偏移量
 * @returns 贝塞尔曲线控制点
 */
export function getBezierControlPoints(
  start: Point,
  end: Point,
  startDotPosition: DotPosition = 'right',
  endDotPosition: DotPosition = 'left',
  maxOffset: number = 150
): BezierControlPoints {
  const distance = calculateDistance(start, end);
  const controlPointOffset = Math.min(distance * 0.5, maxOffset);

  // 根据触点位置决定控制点方向
  const startControlX =
    startDotPosition === 'right'
      ? start.x + controlPointOffset
      : start.x - controlPointOffset;

  const endControlX =
    endDotPosition === 'right'
      ? end.x + controlPointOffset
      : end.x - controlPointOffset;

  return {
    start,
    cp1: { x: startControlX, y: start.y },
    cp2: { x: endControlX, y: end.y },
    end,
  };
}

/**
 * 生成贝塞尔曲线 SVG 路径字符串
 * @param start - 起点坐标
 * @param end - 终点坐标
 * @param startDotPosition - 起点触点位置
 * @param endDotPosition - 终点触点位置
 * @returns SVG 路径字符串
 */
export function createBezierPath(
  start: Point,
  end: Point,
  startDotPosition: DotPosition = 'right',
  endDotPosition: DotPosition = 'left'
): string {
  const { cp1, cp2 } = getBezierControlPoints(start, end, startDotPosition, endDotPosition);
  return `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;
}

/**
 * 计算三次贝塞尔曲线上指定 t 值处的点
 * B(t) = (1-t)³P0 + 3(1-t)²tP1 + 3(1-t)t²P2 + t³P3
 * @param t - 参数值 [0, 1]
 * @param p0 - 起点
 * @param p1 - 控制点1
 * @param p2 - 控制点2
 * @param p3 - 终点
 * @returns 曲线上的点
 */
export function getPointOnBezier(
  t: number,
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point
): Point {
  const t2 = t * t;
  const t3 = t2 * t;
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;

  return {
    x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
    y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
  };
}

/**
 * 计算贝塞尔曲线的中点（t=0.5 处的点）
 * @param start - 起点坐标
 * @param end - 终点坐标
 * @param startDotPosition - 起点触点位置
 * @param endDotPosition - 终点触点位置
 * @returns 曲线中点坐标
 */
export function getBezierMidPoint(
  start: Point,
  end: Point,
  startDotPosition: DotPosition = 'right',
  endDotPosition: DotPosition = 'left'
): Point {
  const { cp1, cp2 } = getBezierControlPoints(start, end, startDotPosition, endDotPosition);
  return getPointOnBezier(0.5, start, cp1, cp2, end);
}

/**
 * 检查点是否在矩形区域内
 * @param point - 待检查的点
 * @param rect - 矩形区域 {x, y, width, height}
 * @returns 是否在区域内
 */
export function isPointInRect(
  point: Point,
  rect: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/**
 * 限制值在指定范围内
 * @param value - 原始值
 * @param min - 最小值
 * @param max - 最大值
 * @returns 限制后的值
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * 线性插值
 * @param start - 起始值
 * @param end - 结束值
 * @param t - 插值参数 [0, 1]
 * @returns 插值结果
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * 点的线性插值
 * @param p1 - 起始点
 * @param p2 - 结束点
 * @param t - 插值参数 [0, 1]
 * @returns 插值后的点
 */
export function lerpPoint(p1: Point, p2: Point, t: number): Point {
  return {
    x: lerp(p1.x, p2.x, t),
    y: lerp(p1.y, p2.y, t),
  };
}

