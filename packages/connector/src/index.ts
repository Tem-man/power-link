/**
 * @fileoverview power-link 连线器工具库入口文件
 * @description 导出 Connector 类及相关类型定义
 */

import { Connector } from './Connector';

// 默认导出
export default Connector;

// 命名导出
export { Connector };

// 导出类型
export type {
  ConnectorOptions,
  ConnectorConfig,
  ConnectorNode,
  Connection,
  ConnectionInfo,
  ViewState,
  DotPosition,
  Point,
  RegisterNodeOptions,
  SilentOptions,
  Dot,
} from './types';
