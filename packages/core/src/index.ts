/**
 * @fileoverview node-link 连线器工具库入口文件
 * @description 导出 Connector 类，用于创建可视化节点连线
 */

// @ts-ignore - Connector.js 是纯 JavaScript 文件，没有类型定义
import Connector from "./connector/Connector.js";

// 默认导出
export default Connector;

// 命名导出（方便使用命名导入）
export { Connector };

