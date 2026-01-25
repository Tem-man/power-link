/**
 * 触点模型
 * 表示节点上的连接点
 */
import type { DotPosition, Point } from '../types';

/**
 * 触点模型配置
 */
export interface DotModelOptions {
  /** 触点位置 */
  position: DotPosition;
  /** 触点 DOM 元素 */
  element: HTMLDivElement;
}

/**
 * 触点模型类
 */
export class DotModel {
  /** 触点位置 'left' | 'right' */
  readonly position: DotPosition;

  /** 触点 DOM 元素 */
  readonly element: HTMLDivElement;

  /** 缓存的坐标（可选，用于性能优化） */
  private _cachedCoords: Point | null = null;

  constructor(options: DotModelOptions) {
    this.position = options.position;
    this.element = options.element;
  }

  /**
   * 获取缓存的坐标
   */
  get coords(): Point | null {
    return this._cachedCoords;
  }

  /**
   * 设置缓存的坐标
   */
  set coords(value: Point | null) {
    this._cachedCoords = value;
  }

  /**
   * 清除坐标缓存
   */
  clearCoordsCache(): void {
    this._cachedCoords = null;
  }

  /**
   * 检查是否是左侧触点
   */
  isLeft(): boolean {
    return this.position === 'left';
  }

  /**
   * 检查是否是右侧触点
   */
  isRight(): boolean {
    return this.position === 'right';
  }

  /**
   * 序列化为普通对象
   */
  toJSON(): { position: DotPosition } {
    return {
      position: this.position,
    };
  }
}

export default DotModel;

