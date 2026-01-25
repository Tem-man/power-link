/**
 * 事件发射器基类
 * 提供发布-订阅模式的事件系统
 */
export type EventCallback<T = any> = (data: T) => void;

export interface EventMap {
  [event: string]: any;
}

export class EventEmitter<E extends EventMap = EventMap> {
  private events: Map<keyof E, Set<EventCallback>> = new Map();

  /**
   * 订阅事件
   * @param event - 事件名称
   * @param callback - 回调函数
   * @returns 取消订阅的函数
   */
  on<K extends keyof E>(event: K, callback: EventCallback<E[K]>): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(callback);

    // 返回取消订阅的函数
    return () => this.off(event, callback);
  }

  /**
   * 订阅一次性事件
   * @param event - 事件名称
   * @param callback - 回调函数
   */
  once<K extends keyof E>(event: K, callback: EventCallback<E[K]>): () => void {
    const wrapper: EventCallback<E[K]> = (data) => {
      this.off(event, wrapper);
      callback(data);
    };
    return this.on(event, wrapper);
  }

  /**
   * 取消订阅事件
   * @param event - 事件名称
   * @param callback - 回调函数
   */
  off<K extends keyof E>(event: K, callback: EventCallback<E[K]>): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.events.delete(event);
      }
    }
  }

  /**
   * 触发事件
   * @param event - 事件名称
   * @param data - 事件数据
   */
  emit<K extends keyof E>(event: K, data?: E[K]): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event handler for "${String(event)}":`, error);
        }
      });
    }
  }

  /**
   * 移除指定事件的所有监听器，或移除所有事件的监听器
   * @param event - 可选，事件名称
   */
  removeAllListeners<K extends keyof E>(event?: K): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  /**
   * 获取指定事件的监听器数量
   * @param event - 事件名称
   */
  listenerCount<K extends keyof E>(event: K): number {
    return this.events.get(event)?.size || 0;
  }

  /**
   * 获取所有已注册的事件名称
   */
  eventNames(): (keyof E)[] {
    return Array.from(this.events.keys());
  }
}

export default EventEmitter;

