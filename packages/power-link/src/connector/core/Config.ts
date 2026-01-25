/**
 * 配置管理
 */
import type { ConnectorConfig, ConnectorOptions } from '../types';

/**
 * 默认配置
 */
export const DEFAULT_CONFIG: ConnectorConfig = {
  // 连线样式
  lineColor: '#155BD4',
  lineWidth: 2,

  // 触点样式
  dotSize: 12,
  dotColor: '#155BD4',
  dotHoverScale: 1.8,

  // 删除按钮
  deleteButtonSize: 20,

  // 节点拖拽
  enableNodeDrag: true,

  // 吸附
  snapDistance: 20,
  enableSnap: true,

  // 缩放
  enableZoom: true,
  minZoom: 0.1,
  maxZoom: 4,
  zoomStep: 0.1,

  // 平移
  enablePan: true,
};

/**
 * 合并用户配置与默认配置
 * @param options - 用户配置选项
 * @returns 合并后的完整配置
 */
export function mergeConfig(options: ConnectorOptions): ConnectorConfig {
  return {
    ...DEFAULT_CONFIG,
    // 从 options 直接获取的配置项
    ...(options.lineColor !== undefined && { lineColor: options.lineColor }),
    ...(options.lineWidth !== undefined && { lineWidth: options.lineWidth }),
    ...(options.dotSize !== undefined && { dotSize: options.dotSize }),
    ...(options.dotColor !== undefined && { dotColor: options.dotColor }),
    ...(options.dotHoverScale !== undefined && { dotHoverScale: options.dotHoverScale }),
    ...(options.deleteButtonSize !== undefined && { deleteButtonSize: options.deleteButtonSize }),
    ...(options.enableNodeDrag !== undefined && { enableNodeDrag: options.enableNodeDrag }),
    ...(options.snapDistance !== undefined && { snapDistance: options.snapDistance }),
    ...(options.enableSnap !== undefined && { enableSnap: options.enableSnap }),
    ...(options.enableZoom !== undefined && { enableZoom: options.enableZoom }),
    ...(options.enablePan !== undefined && { enablePan: options.enablePan }),
    ...(options.minZoom !== undefined && { minZoom: options.minZoom }),
    ...(options.maxZoom !== undefined && { maxZoom: options.maxZoom }),
    ...(options.zoomStep !== undefined && { zoomStep: options.zoomStep }),
    // 从 options.config 中获取的配置项（向后兼容）
    ...options.config,
  };
}

/**
 * 验证配置
 * @param config - 配置对象
 * @returns 验证结果
 */
export function validateConfig(config: ConnectorConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 验证缩放范围
  if (config.minZoom >= config.maxZoom) {
    errors.push('minZoom must be less than maxZoom');
  }

  if (config.minZoom <= 0) {
    errors.push('minZoom must be greater than 0');
  }

  // 验证尺寸
  if (config.dotSize <= 0) {
    errors.push('dotSize must be greater than 0');
  }

  if (config.lineWidth <= 0) {
    errors.push('lineWidth must be greater than 0');
  }

  if (config.deleteButtonSize <= 0) {
    errors.push('deleteButtonSize must be greater than 0');
  }

  // 验证吸附距离
  if (config.snapDistance < 0) {
    errors.push('snapDistance must be non-negative');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export default { DEFAULT_CONFIG, mergeConfig, validateConfig };

