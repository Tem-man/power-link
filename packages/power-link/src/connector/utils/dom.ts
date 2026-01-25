/**
 * DOM 操作工具函数
 */
import type { Point, DotPosition, ViewState } from '../types';

/**
 * 获取元素中心位置（SVG 坐标系统）
 * @param element - 目标元素
 * @param container - 容器元素
 * @param viewState - 视图状态
 * @returns 元素中心的 SVG 坐标
 */
export function getElementCenter(
  element: HTMLElement,
  container: HTMLElement,
  viewState: ViewState
): Point {
  const rect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  // 计算相对于容器的位置（屏幕坐标）
  const screenX = rect.left + rect.width / 2 - containerRect.left;
  const screenY = rect.top + rect.height / 2 - containerRect.top;

  // 转换为 SVG 坐标系统（考虑缩放和平移）
  const { scale, translateX, translateY } = viewState;
  return {
    x: (screenX - translateX) / scale,
    y: (screenY - translateY) / scale,
  };
}

/**
 * 获取触点位置（SVG 坐标系统）
 * @param element - 节点元素
 * @param dotPosition - 触点位置 'left' 或 'right'
 * @param container - 容器元素
 * @param viewState - 视图状态
 * @returns 触点的 SVG 坐标
 */
export function getDotPosition(
  element: HTMLElement,
  dotPosition: DotPosition,
  container: HTMLElement,
  viewState: ViewState
): Point {
  const rect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  // 计算相对于容器的位置（屏幕坐标）
  const screenX =
    dotPosition === 'right'
      ? rect.right - containerRect.left
      : rect.left - containerRect.left;
  const screenY = rect.top + rect.height / 2 - containerRect.top;

  // 转换为 SVG 坐标系统（考虑缩放和平移）
  const { scale, translateX, translateY } = viewState;
  return {
    x: (screenX - translateX) / scale,
    y: (screenY - translateY) / scale,
  };
}

/**
 * 屏幕坐标转换为 SVG 坐标
 * @param screenX - 屏幕 X 坐标（相对于容器）
 * @param screenY - 屏幕 Y 坐标（相对于容器）
 * @param viewState - 视图状态
 * @returns SVG 坐标
 */
export function screenToSVG(
  screenX: number,
  screenY: number,
  viewState: ViewState
): Point {
  const { scale, translateX, translateY } = viewState;
  return {
    x: (screenX - translateX) / scale,
    y: (screenY - translateY) / scale,
  };
}

/**
 * SVG 坐标转换为屏幕坐标
 * @param svgX - SVG X 坐标
 * @param svgY - SVG Y 坐标
 * @param viewState - 视图状态
 * @returns 屏幕坐标（相对于容器）
 */
export function svgToScreen(
  svgX: number,
  svgY: number,
  viewState: ViewState
): Point {
  const { scale, translateX, translateY } = viewState;
  return {
    x: svgX * scale + translateX,
    y: svgY * scale + translateY,
  };
}

/**
 * 获取鼠标事件相对于容器的坐标
 * @param event - 鼠标事件
 * @param container - 容器元素
 * @returns 相对于容器的坐标
 */
export function getMousePosition(
  event: MouseEvent,
  container: HTMLElement
): Point {
  const containerRect = container.getBoundingClientRect();
  return {
    x: event.clientX - containerRect.left,
    y: event.clientY - containerRect.top,
  };
}

/**
 * 创建 SVG 元素
 * @param tagName - SVG 元素标签名
 * @param attributes - 元素属性
 * @returns SVG 元素
 */
export function createSVGElement<K extends keyof SVGElementTagNameMap>(
  tagName: K,
  attributes?: Record<string, string | number>
): SVGElementTagNameMap[K] {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tagName);
  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, String(value));
    });
  }
  return element;
}

/**
 * 设置元素样式
 * @param element - 目标元素
 * @param styles - 样式对象
 */
export function setStyles(
  element: HTMLElement | SVGElement,
  styles: Partial<CSSStyleDeclaration>
): void {
  Object.assign(element.style, styles);
}

/**
 * 检查元素是否包含指定类名
 * @param element - 目标元素
 * @param className - 类名
 * @returns 是否包含该类名
 */
export function hasClass(element: Element, className: string): boolean {
  return element.classList.contains(className);
}

/**
 * 检查点是否在元素的边界框内
 * @param x - X 坐标（屏幕坐标）
 * @param y - Y 坐标（屏幕坐标）
 * @param element - 目标元素
 * @returns 是否在元素内
 */
export function isPointInElement(
  x: number,
  y: number,
  element: HTMLElement
): boolean {
  const rect = element.getBoundingClientRect();
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

/**
 * 获取元素的计算样式中的 position 属性
 * @param element - 目标元素
 * @returns position 属性值
 */
export function getComputedPosition(element: HTMLElement): string {
  return window.getComputedStyle(element).position;
}

/**
 * 确保元素有定位（非 static）
 * @param element - 目标元素
 * @param defaultPosition - 默认 position 值
 */
export function ensurePositioned(
  element: HTMLElement,
  defaultPosition: 'relative' | 'absolute' = 'relative'
): void {
  if (getComputedPosition(element) === 'static') {
    element.style.position = defaultPosition;
  }
}

/**
 * 移除元素
 * @param element - 要移除的元素
 */
export function removeElement(element: Element | null | undefined): void {
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
  }
}

/**
 * 防抖函数
 * @param func - 要防抖的函数
 * @param wait - 等待时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func.apply(this, args);
      timeoutId = null;
    }, wait);
  };
}

