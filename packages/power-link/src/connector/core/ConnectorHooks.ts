/**
 * @fileoverview Connector 钩子集合
 * 提供类似 BaklavaJS 的 hooks 对象
 */

import { SequentialHook, PreventableHook } from './Hook';
import type {
  ConnectorState,
  NodeRegisterParams,
  ConnectionParams,
  ViewChangeParams,
  NodeDragParams,
  ViewState,
  ConnectionInfo,
  Point,
} from '../types';
import type { NodeModel, DotModel, ConnectionModel } from '../model';

/**
 * Connector 钩子接口
 */
export interface IConnectorHooks<E = unknown> {
  // 序列化钩子（顺序执行，可修改数据）
  readonly save: SequentialHook<ConnectorState, E>;
  readonly load: SequentialHook<ConnectorState, E>;

  // 节点钩子（可阻止）
  readonly beforeNodeRegister: PreventableHook<NodeRegisterParams, E>;
  readonly afterNodeRegister: SequentialHook<NodeModel, E>;
  readonly beforeNodeRemove: PreventableHook<NodeModel, E>;
  readonly afterNodeRemove: SequentialHook<string, E>;

  // 连接钩子（可阻止）
  readonly beforeConnect: PreventableHook<ConnectionParams, E>;
  readonly afterConnect: SequentialHook<ConnectionModel, E>;
  readonly beforeDisconnect: PreventableHook<ConnectionModel, E>;
  readonly afterDisconnect: SequentialHook<ConnectionInfo, E>;

  // 视图钩子（可阻止）
  readonly beforeViewChange: PreventableHook<ViewChangeParams, E>;
  readonly afterViewChange: SequentialHook<ViewState, E>;

  // 拖拽钩子
  readonly beforeDragStart: PreventableHook<NodeModel, E>;
  readonly onDrag: SequentialHook<NodeDragParams, E>;
  readonly afterDragEnd: SequentialHook<{ node: NodeModel; position: Point }, E>;

  // 渲染钩子
  readonly onRenderConnection: SequentialHook<{ connection: ConnectionModel; element: SVGPathElement }, E>;
  readonly onRenderDot: SequentialHook<{ dot: DotModel; element: HTMLElement }, E>;
}

/**
 * 创建 Connector 钩子集合
 */
export function createConnectorHooks<E>(entity: E): IConnectorHooks<E> {
  return {
    // 序列化钩子
    save: new SequentialHook<ConnectorState, E>(entity),
    load: new SequentialHook<ConnectorState, E>(entity),

    // 节点钩子
    beforeNodeRegister: new PreventableHook<NodeRegisterParams, E>(entity),
    afterNodeRegister: new SequentialHook<NodeModel, E>(entity),
    beforeNodeRemove: new PreventableHook<NodeModel, E>(entity),
    afterNodeRemove: new SequentialHook<string, E>(entity),

    // 连接钩子
    beforeConnect: new PreventableHook<ConnectionParams, E>(entity),
    afterConnect: new SequentialHook<ConnectionModel, E>(entity),
    beforeDisconnect: new PreventableHook<ConnectionModel, E>(entity),
    afterDisconnect: new SequentialHook<ConnectionInfo, E>(entity),

    // 视图钩子
    beforeViewChange: new PreventableHook<ViewChangeParams, E>(entity),
    afterViewChange: new SequentialHook<ViewState, E>(entity),

    // 拖拽钩子
    beforeDragStart: new PreventableHook<NodeModel, E>(entity),
    onDrag: new SequentialHook<NodeDragParams, E>(entity),
    afterDragEnd: new SequentialHook<{ node: NodeModel; position: Point }, E>(entity),

    // 渲染钩子
    onRenderConnection: new SequentialHook<{ connection: ConnectionModel; element: SVGPathElement }, E>(entity),
    onRenderDot: new SequentialHook<{ dot: DotModel; element: HTMLElement }, E>(entity),
  };
}

/**
 * 清空所有钩子
 */
export function clearAllHooks<E>(hooks: IConnectorHooks<E>): void {
  Object.values(hooks).forEach((hook) => {
    if (hook && typeof hook.clear === 'function') {
      hook.clear();
    }
  });
}

