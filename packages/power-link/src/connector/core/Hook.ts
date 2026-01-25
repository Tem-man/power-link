/**
 * @fileoverview 钩子系统
 * 参考 BaklavaJS 的设计，提供顺序执行和可阻止的钩子
 */

/**
 * 钩子回调函数类型
 */
export type HookCallback<T, E = unknown> = (data: T, entity: E) => T;

/**
 * 可阻止钩子的回调函数类型
 */
export type PreventableHookCallback<T, E = unknown> = (data: T, entity: E) => T | false;

/**
 * 钩子执行结果
 */
export interface HookResult<T> {
  /** 最终数据 */
  data: T;
  /** 是否被阻止 */
  prevented: boolean;
}

/**
 * 顺序执行钩子
 * 每个回调可以修改数据，然后传给下一个回调
 *
 * @example
 * ```typescript
 * const hook = new SequentialHook<SaveState, Connector>(connector);
 *
 * // 注册钩子
 * hook.tap((state, connector) => {
 *   return { ...state, customData: 'xxx' };
 * });
 *
 * // 执行钩子
 * const result = hook.execute(initialState);
 * ```
 */
export class SequentialHook<T, E = unknown> {
  /** 钩子回调列表 */
  private callbacks: Array<HookCallback<T, E>> = [];

  /** 关联的实体 */
  private entity: E;

  constructor(entity: E) {
    this.entity = entity;
  }

  /**
   * 注册钩子回调
   * @param callback 回调函数，接收数据和实体，返回修改后的数据
   * @returns 取消注册的函数
   */
  tap(callback: HookCallback<T, E>): () => void {
    this.callbacks.push(callback);
    return () => this.untap(callback);
  }

  /**
   * 取消注册钩子回调
   */
  untap(callback: HookCallback<T, E>): void {
    const index = this.callbacks.indexOf(callback);
    if (index !== -1) {
      this.callbacks.splice(index, 1);
    }
  }

  /**
   * 执行钩子
   * @param data 初始数据
   * @returns 经过所有回调处理后的数据
   */
  execute(data: T): T {
    let currentData = data;
    for (const callback of this.callbacks) {
      try {
        currentData = callback(currentData, this.entity);
      } catch (error) {
        console.error('[SequentialHook] Callback error:', error);
      }
    }
    return currentData;
  }

  /**
   * 清空所有回调
   */
  clear(): void {
    this.callbacks = [];
  }

  /**
   * 获取回调数量
   */
  get size(): number {
    return this.callbacks.length;
  }
}

/**
 * 可阻止的顺序执行钩子
 * 回调返回 false 表示阻止后续执行
 *
 * @example
 * ```typescript
 * const hook = new PreventableHook<ConnectionParams, Connector>(connector);
 *
 * // 注册钩子 - 返回 false 阻止连接
 * hook.tap((params, connector) => {
 *   if (params.fromNode.id === params.toNode.id) {
 *     return false; // 阻止自连接
 *   }
 *   return params;
 * });
 *
 * // 执行钩子
 * const result = hook.execute(params);
 * if (result.prevented) {
 *   console.log('操作被阻止');
 * } else {
 *   console.log('处理后的数据:', result.data);
 * }
 * ```
 */
export class PreventableHook<T, E = unknown> {
  /** 钩子回调列表 */
  private callbacks: Array<PreventableHookCallback<T, E>> = [];

  /** 关联的实体 */
  private entity: E;

  constructor(entity: E) {
    this.entity = entity;
  }

  /**
   * 注册钩子回调
   * @param callback 回调函数，返回 false 阻止执行，返回修改后的数据继续执行
   * @returns 取消注册的函数
   */
  tap(callback: PreventableHookCallback<T, E>): () => void {
    this.callbacks.push(callback);
    return () => this.untap(callback);
  }

  /**
   * 取消注册钩子回调
   */
  untap(callback: PreventableHookCallback<T, E>): void {
    const index = this.callbacks.indexOf(callback);
    if (index !== -1) {
      this.callbacks.splice(index, 1);
    }
  }

  /**
   * 执行钩子
   * @param data 初始数据
   * @returns 执行结果，包含最终数据和是否被阻止
   */
  execute(data: T): HookResult<T> {
    let currentData = data;

    for (const callback of this.callbacks) {
      try {
        const result = callback(currentData, this.entity);

        if (result === false) {
          return { data: currentData, prevented: true };
        }

        currentData = result;
      } catch (error) {
        console.error('[PreventableHook] Callback error:', error);
      }
    }

    return { data: currentData, prevented: false };
  }

  /**
   * 清空所有回调
   */
  clear(): void {
    this.callbacks = [];
  }

  /**
   * 获取回调数量
   */
  get size(): number {
    return this.callbacks.length;
  }
}

/**
 * 并行执行钩子
 * 所有回调并行执行，收集结果
 */
export class ParallelHook<T, R, E = unknown> {
  /** 钩子回调列表 */
  private callbacks: Array<(data: T, entity: E) => R> = [];

  /** 关联的实体 */
  private entity: E;

  constructor(entity: E) {
    this.entity = entity;
  }

  /**
   * 注册钩子回调
   */
  tap(callback: (data: T, entity: E) => R): () => void {
    this.callbacks.push(callback);
    return () => this.untap(callback);
  }

  /**
   * 取消注册钩子回调
   */
  untap(callback: (data: T, entity: E) => R): void {
    const index = this.callbacks.indexOf(callback);
    if (index !== -1) {
      this.callbacks.splice(index, 1);
    }
  }

  /**
   * 执行钩子
   * @param data 输入数据
   * @returns 所有回调的结果数组
   */
  execute(data: T): R[] {
    const results: R[] = [];

    for (const callback of this.callbacks) {
      try {
        results.push(callback(data, this.entity));
      } catch (error) {
        console.error('[ParallelHook] Callback error:', error);
      }
    }

    return results;
  }

  /**
   * 清空所有回调
   */
  clear(): void {
    this.callbacks = [];
  }

  /**
   * 获取回调数量
   */
  get size(): number {
    return this.callbacks.length;
  }
}

