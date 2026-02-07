<template>
  <div class="plugin-example">
    <h2>🔌 插件系统示例</h2>

    <div class="plugin-info">
      <div class="plugin-card">
        <h3>📋 ValidationPlugin</h3>
        <p>连接验证插件 - 限制连接规则</p>
        <ul>
          <li>✓ 禁止自连接</li>
          <li>✓ 每个节点最多 2 个连接</li>
          <li>✓ 自定义规则：相同类型节点不能连接</li>
        </ul>
      </div>
      <div class="plugin-card">
        <h3>📜 HistoryPlugin</h3>
        <p>历史记录插件 - 支持撤销/重做</p>
        <ul>
          <li>✓ 记录连接操作</li>
          <li>✓ 最大 50 条记录</li>
        </ul>
      </div>
      <div class="plugin-card custom">
        <h3>🎨 CustomStylePlugin</h3>
        <p>自定义插件 - 连接线渐变色</p>
        <ul>
          <li>✓ 动态渐变色连接线</li>
          <li>✓ 连接时动画效果</li>
        </ul>
      </div>
      <div class="plugin-card serialize">
        <h3>📦 SerializationPlugin</h3>
        <p>序列化插件 - save/load 钩子</p>
        <ul>
          <li>✓ 保存时添加元数据</li>
          <li>✓ 加载时读取元数据</li>
          <li>✓ 持久化到 localStorage</li>
        </ul>
      </div>
    </div>

    <div class="connector-container" ref="containerRef">
      <div class="node node-input" ref="node1Ref" data-type="input">
        <div class="node-icon">📥</div>
        <div class="node-label">输入节点</div>
        <div class="node-type">type: input</div>
      </div>

      <div class="node node-process" ref="node2Ref" data-type="process">
        <div class="node-icon">⚙️</div>
        <div class="node-label">处理节点 A</div>
        <div class="node-type">type: process</div>
      </div>

      <div class="node node-process" ref="node3Ref" data-type="process">
        <div class="node-icon">🔧</div>
        <div class="node-label">处理节点 B</div>
        <div class="node-type">type: process</div>
      </div>

      <div class="node node-output" ref="node4Ref" data-type="output">
        <div class="node-icon">📤</div>
        <div class="node-label">输出节点</div>
        <div class="node-type">type: output</div>
      </div>
    </div>

    <div class="controls">
      <div class="control-group">
        <span class="group-label">连接操作：</span>
        <button @click="connectInputToProcessA" class="btn btn-primary">
          输入 → 处理A
        </button>
        <button @click="connectProcessAToOutput" class="btn btn-primary">
          处理A → 输出
        </button>
        <button @click="tryConnectSameType" class="btn btn-warning">
          ⚠️ 尝试连接相同类型
        </button>
        <button @click="disconnectAll" class="btn btn-danger">
          断开所有
        </button>
      </div>

      <div class="control-group">
        <span class="group-label">序列化（save/load 钩子）：</span>
        <button @click="saveState" class="btn btn-success">
          💾 保存状态
        </button>
        <button @click="loadState" class="btn btn-info" :disabled="!hasSavedState">
          📂 加载状态
        </button>
        <button @click="clearSavedState" class="btn btn-secondary" :disabled="!hasSavedState">
          🗑️ 清除保存
        </button>
        <span v-if="hasSavedState" class="saved-indicator">✓ 已保存</span>
      </div>

      <div class="control-group">
        <span class="group-label">插件状态：</span>
        <span class="status-badge" :class="{ active: installedPlugins.includes('ValidationPlugin') }">
          ValidationPlugin {{ installedPlugins.includes('ValidationPlugin') ? '✓' : '✗' }}
        </span>
        <span class="status-badge" :class="{ active: installedPlugins.includes('HistoryPlugin') }">
          HistoryPlugin {{ installedPlugins.includes('HistoryPlugin') ? '✓' : '✗' }}
        </span>
        <span class="status-badge custom" :class="{ active: installedPlugins.includes('CustomStylePlugin') }">
          CustomStylePlugin {{ installedPlugins.includes('CustomStylePlugin') ? '✓' : '✗' }}
        </span>
        <span class="status-badge serialize" :class="{ active: installedPlugins.includes('SerializationPlugin') }">
          SerializationPlugin {{ installedPlugins.includes('SerializationPlugin') ? '✓' : '✗' }}
        </span>
      </div>
    </div>

    <div class="logs">
      <h3>事件日志：</h3>
      <div class="log-list">
        <div v-for="(log, index) in logs" :key="index" class="log-item" :class="log.type">
          <span class="log-time">{{ log.time }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
        <div v-if="logs.length === 0" class="log-empty">
          暂无日志，尝试拖拽触点创建连接...
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import Connector, {
  ValidationPlugin,
  HistoryPlugin,
  type PowerLinkPlugin,
  type ConnectionModel,
  type NodeModel,
  type DotModel,
  type ConnectorState,
} from "power-link";

const containerRef = ref<HTMLElement | null>(null);
const node1Ref = ref<HTMLElement | null>(null);
const node2Ref = ref<HTMLElement | null>(null);
const node3Ref = ref<HTMLElement | null>(null);
const node4Ref = ref<HTMLElement | null>(null);

const logs = ref<Array<{ time: string; message: string; type: string }>>([]);
const installedPlugins = ref<string[]>([]);
const hasSavedState = ref(false);
let savedState: ConnectorState | null = null;

let connector: InstanceType<typeof Connector> | null = null;

// 添加日志
const addLog = (message: string, type = "info") => {
  const now = new Date();
  const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

  logs.value.unshift({ time, message, type });

  if (logs.value.length > 15) {
    logs.value.pop();
  }
};

// 自定义样式插件 - 演示如何使用新的钩子系统编写插件
const CustomStylePlugin: PowerLinkPlugin = {
  name: 'CustomStylePlugin',
  version: '1.0.0',

  // 在 install 中通过 context.hooks 注册钩子（推荐方式）
  install(context) {
    addLog('🎨 CustomStylePlugin 已安装（使用钩子系统）', 'success');

    // 注册 afterConnect 钩子 - 自定义连接线样式
    context.hooks.afterConnect.tap((connection: ConnectionModel) => {
      console.log('链接后：', connection);
      const elements = connection.renderElements;
      if (!elements) return connection;

      const line = elements.line;

      // 添加渐变动画效果
      line.style.stroke = 'url(#gradient-' + connection.id + ')';
      line.style.strokeLinecap = 'round';
      line.style.transition = 'stroke-dashoffset 0.3s ease';

      // 创建 SVG 渐变
      const svg = context.getSVG();
      if (svg) {
        const defs = svg.querySelector('defs') || createDefs(svg);
        const gradient = createGradient(connection.id);
        defs.appendChild(gradient);
      }

      addLog(`🎨 连接线样式已应用: ${connection.fromNode.id} → ${connection.toNode.id}`, 'info');

      return connection; // 钩子必须返回数据
    });

    // 注册 onRenderDot 钩子 - 触点脉冲动画
    context.hooks.onRenderDot.tap((params: { dot: DotModel; element: HTMLElement }) => {
      params.element.style.animation = 'pulse 2s infinite';
      return params; // 钩子必须返回数据
    });
  },

  uninstall() {
    // 钩子会在 PluginManager 卸载时自动取消注册
    addLog('🎨 CustomStylePlugin 已卸载', 'warning');
  },
};

// 创建 SVG defs 元素
function createDefs(svg: SVGSVGElement): SVGDefsElement {
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  svg.insertBefore(defs, svg.firstChild);
  return defs;
}

// 创建渐变元素
function createGradient(id: string): SVGLinearGradientElement {
  const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
  gradient.id = 'gradient-' + id;
  gradient.setAttribute('gradientUnits', 'userSpaceOnUse');

  const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop1.setAttribute('offset', '0%');
  stop1.setAttribute('stop-color', '#667eea');

  const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop2.setAttribute('offset', '100%');
  stop2.setAttribute('stop-color', '#764ba2');

  gradient.appendChild(stop1);
  gradient.appendChild(stop2);

  return gradient;
}

// 序列化插件 - 演示如何使用 save/load 钩子进行自定义序列化处理
const SerializationPlugin: PowerLinkPlugin = {
  name: 'SerializationPlugin',
  version: '1.0.0',

  install(context) {
    addLog('📦 SerializationPlugin 已安装（使用 save/load 钩子）', 'success');

    // 注册 save 钩子 - 在保存时添加自定义元数据
    context.hooks.save.tap((state: ConnectorState) => {
      // 添加自定义元数据
      const enhancedState = {
        ...state,
        metadata: {
          savedAt: new Date().toISOString(),
          savedBy: 'SerializationPlugin',
          nodeCount: state.nodes.length,
          connectionCount: state.connections.length,
        },
      };

      addLog(`💾 save 钩子: 添加元数据 (${state.connections.length} 条连接)`, 'info');

      return enhancedState as ConnectorState;
    });

    // 注册 load 钩子 - 在加载时处理自定义元数据
    context.hooks.load.tap((state: ConnectorState) => {
      const metadata = (state as any).metadata;

      if (metadata) {
        addLog(`📂 load 钩子: 读取元数据 - 保存于 ${metadata.savedAt}`, 'info');
        addLog(`📂 load 钩子: 原有 ${metadata.connectionCount} 条连接`, 'info');
      }

      return state;
    });
  },

  uninstall() {
    addLog('📦 SerializationPlugin 已卸载', 'warning');
  },
};

// 保存状态
const saveState = () => {
  if (!connector) return;

  savedState = connector.save();
  hasSavedState.value = true;

  // 同时保存到 localStorage（演示持久化）
  try {
    localStorage.setItem('power-link-demo-state', JSON.stringify(savedState));
    addLog(`✅ 状态已保存 (${savedState.connections.length} 条连接, ${savedState.nodes.length} 个节点)`, 'success');
  } catch (e) {
    addLog('⚠️ 保存到 localStorage 失败', 'warning');
  }
};

// 加载状态
const loadState = () => {
  if (!connector || !savedState) return;

  // 先断开所有连接
  connector.disconnect(undefined, { silent: true });

  // 加载状态
  const warnings = connector.load(savedState);

  if (warnings.length > 0) {
    warnings.forEach(w => addLog(`⚠️ 加载警告: ${w}`, 'warning'));
  } else {
    addLog(`✅ 状态已恢复 (${savedState.connections.length} 条连接)`, 'success');
  }
};

// 清除保存的状态
const clearSavedState = () => {
  savedState = null;
  hasSavedState.value = false;
  localStorage.removeItem('power-link-demo-state');
  addLog('🗑️ 已清除保存的状态', 'info');
};

// 连接操作
const connectInputToProcessA = () => {
  if (connector) {
    connector.connect('input', 'processA');
  }
};

const connectProcessAToOutput = () => {
  if (connector) {
    connector.connect('processA', 'output');
  }
};

const tryConnectSameType = () => {
  if (connector) {
    // 尝试连接两个 process 类型的节点，会被 ValidationPlugin 阻止
    connector.connect('processA', 'processB');
  }
};

const disconnectAll = () => {
  if (connector) {
    connector.disconnect();
    addLog('已断开所有连接', 'warning');
  }
};

onMounted(() => {
  if (!containerRef.value) return;

  // 创建连接器
  connector = new Connector({
    container: containerRef.value,
    lineColor: "#667eea",
    lineWidth: 3,
    dotSize: 14,
    dotHoverScale: 1.5,
    dotColor: "#667eea",
    deleteButtonSize: 24,
    enableNodeDrag: true,
    enableSnap: true,
    snapDistance: 40,

    onConnect: (info) => {
      addLog(`✅ 连接建立: ${info.from} → ${info.to}`, 'success');
    },

    onDisconnect: (info) => {
      addLog(`❌ 连接断开: ${info.from} → ${info.to}`, 'error');
    },
  });

  // 安装 ValidationPlugin
  connector.use(ValidationPlugin, {
    allowSelfConnection: false,
    maxConnectionsPerNode: 2,
    rules: [
      // 自定义规则：相同类型的节点不能连接
      (fromNode: NodeModel, toNode: NodeModel) => {
        const fromType = fromNode.element.dataset.type;
        const toType = toNode.element.dataset.type;

        if (fromType === toType) {
          return `不能连接相同类型的节点 (${fromType})`;
        }
        return true;
      },
    ],
    onValidationFail: (message) => {
      addLog(`🚫 验证失败: ${message}`, 'error');
    },
  });

  // 安装 HistoryPlugin
  connector.use(HistoryPlugin, {
    maxHistory: 50,
  });

  // 安装自定义插件
  connector.use(CustomStylePlugin);

  // 安装序列化插件 - 演示 save/load 钩子
  connector.use(SerializationPlugin);

  // 尝试从 localStorage 恢复状态
  try {
    const saved = localStorage.getItem('power-link-demo-state');
    if (saved) {
      savedState = JSON.parse(saved);
      hasSavedState.value = true;
      addLog('📂 发现之前保存的状态，可点击"加载状态"恢复', 'info');
    }
  } catch (e) {
    // 忽略解析错误
  }

  // 更新已安装插件列表
  installedPlugins.value = connector.getPluginNames();

  // 注册节点
  connector.registerNode("input", node1Ref.value!, {
    dotPositions: ["right"],
    info: { type: "input" },
  });

  connector.registerNode("processA", node2Ref.value!, {
    dotPositions: ["left", "right"],
    info: { type: "process" },
  });

  connector.registerNode("processB", node3Ref.value!, {
    dotPositions: ["left", "right"],
    info: { type: "process" },
  });

  connector.registerNode("output", node4Ref.value!, {
    dotPositions: ["left"],
    info: { type: "output" },
  });

  addLog(`🔌 已安装 ${installedPlugins.value.length} 个插件: ${installedPlugins.value.join(', ')}`, 'info');
  addLog('连接器已初始化，共注册 4 个节点', 'info');
});

onBeforeUnmount(() => {
  if (connector) {
    connector.destroy();
    connector = null;
  }
});
</script>

<style scoped lang="scss">
@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(102, 126, 234, 0);
  }
}

.plugin-example {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  h2 {
    text-align: center;
    color: #333;
    margin-bottom: 20px;
    font-size: 24px;
  }

  .plugin-info {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 20px;

    .plugin-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      padding: 16px;
      color: white;

      &.custom {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      }

      &.serialize {
        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
      }

      h3 {
        margin: 0 0 8px 0;
        font-size: 16px;
      }

      p {
        margin: 0 0 12px 0;
        font-size: 13px;
        opacity: 0.9;
      }

      ul {
        margin: 0;
        padding-left: 20px;
        font-size: 12px;

        li {
          margin: 4px 0;
          opacity: 0.85;
        }
      }
    }
  }

  .connector-container {
    position: relative;
    height: 300px;
    background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ed 100%);
    border-radius: 12px;
    margin-bottom: 20px;
    overflow: hidden;
  }

  .node {
    position: absolute;
    width: 140px;
    padding: 16px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    cursor: move;
    user-select: none;
    text-align: center;
    transition: box-shadow 0.2s, transform 0.1s;

    &:hover {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    }

    .node-icon {
      font-size: 28px;
      margin-bottom: 8px;
    }

    .node-label {
      font-size: 14px;
      font-weight: 600;
      color: #333;
      margin-bottom: 4px;
    }

    .node-type {
      font-size: 11px;
      color: #888;
      background: #f0f0f0;
      padding: 2px 8px;
      border-radius: 4px;
      display: inline-block;
    }
  }

  .node-input {
    left: 40px;
    top: 120px;
    border-left: 4px solid #52c41a;
  }

  .node-process {
    border-left: 4px solid #667eea;

    &:nth-child(2) {
      left: 280px;
      top: 40px;
    }

    &:nth-child(3) {
      left: 280px;
      top: 180px;
    }
  }

  .node-output {
    right: 40px;
    top: 120px;
    border-left: 4px solid #ff4d4f;
  }

  .controls {
    background: white;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

    .control-group {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 12px;

      &:last-child {
        margin-bottom: 0;
      }

      .group-label {
        font-size: 14px;
        font-weight: 600;
        color: #666;
        min-width: 80px;
      }
    }

    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        transform: translateY(-1px);
      }

      &.btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }

      &.btn-warning {
        background: linear-gradient(135deg, #f5af19 0%, #f12711 100%);
        color: white;
      }

      &.btn-danger {
        background: #ff4d4f;
        color: white;
      }
    }

    .status-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      background: #f0f0f0;
      color: #999;

      &.active {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }

      &.custom.active {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      }

      &.serialize.active {
        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
      }
    }

    .saved-indicator {
      color: #52c41a;
      font-size: 13px;
      font-weight: 500;
    }
  }

  .logs {
    background: white;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

    h3 {
      margin: 0 0 12px 0;
      font-size: 16px;
      color: #333;
    }

    .log-list {
      max-height: 200px;
      overflow-y: auto;
    }

    .log-item {
      padding: 8px 12px;
      margin-bottom: 6px;
      border-radius: 6px;
      font-size: 13px;
      display: flex;
      gap: 12px;
      align-items: center;

      &.info {
        background: #e6f7ff;
        border-left: 3px solid #1890ff;
      }

      &.success {
        background: #f6ffed;
        border-left: 3px solid #52c41a;
      }

      &.warning {
        background: #fffbe6;
        border-left: 3px solid #faad14;
      }

      &.error {
        background: #fff2f0;
        border-left: 3px solid #ff4d4f;
      }

      .log-time {
        color: #999;
        font-family: monospace;
        font-size: 12px;
      }

      .log-message {
        color: #333;
        flex: 1;
      }
    }

    .log-empty {
      text-align: center;
      color: #999;
      padding: 20px;
      font-size: 14px;
    }
  }
}

@media (max-width: 768px) {
  .plugin-example {
    .plugin-info {
      grid-template-columns: 1fr;
    }

    .controls .control-group {
      flex-direction: column;
      align-items: flex-start;
    }
  }
}
</style>

