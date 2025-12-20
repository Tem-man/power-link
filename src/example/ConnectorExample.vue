<template>
  <div class="connector-example">
    <div
      class="connector-container"
      ref="containerRef"
    >
      <div
        class="node node-1"
        ref="node1Ref"
      >
        <div class="node-icon">🤖</div>
        <div class="node-label">Robot</div>
      </div>

      <div
        class="node node-2"
        ref="node2Ref"
      >
        <div class="node-icon">📚</div>
        <div class="node-label">知识检索</div>
      </div>

      <div
        class="node node-3"
        ref="node3Ref"
      >
        <div class="node-icon">🔍</div>
        <div class="node-label">搜索引擎</div>
      </div>

      <div
        class="node node-4"
        ref="node4Ref"
      >
        <div class="node-icon">💾</div>
        <div class="node-label">数据库</div>
      </div>

      <div
        class="node node-5"
        ref="node5Ref"
      >
        <div class="node-icon">🎯</div>
        <div class="node-label">输出结果</div>
      </div>

      <div
        class="node node-6"
        ref="node6Ref"
      >
        <div class="node-icon">🔄</div>
        <div class="node-label">输入数据</div>
      </div>
    </div>

    <div class="controls">
      <button
        @click="programmaticConnect"
        class="btn btn-primary"
      >
        <span class="icon">🔗</span> 建立连接
      </button>
      <button
        @click="silentConnect"
        class="btn btn-success"
      >
        <span class="icon">🔇</span> 静默连接
      </button>

      <button
        @click="programmaticDisconnect"
        class="btn btn-danger"
      >
        <span class="icon">✂️</span> 断开所有连接
      </button>
      <button
        @click="silentDisconnect"
        class="btn btn-secondary"
      >
        <span class="icon">🔇</span> 静默断开
      </button>
      <button
        @click="disconnectSpecific('input', 'output')"
        class="btn btn-warning"
      >
        <span class="icon">🔌</span> 断开指定连接
      </button>

      <div class="divider"></div>
      <button
        @click="zoomIn"
        class="btn btn-zoom"
      >
        <span class="icon">🔍+</span> 放大
      </button>
      <button
        @click="zoomOut"
        class="btn btn-zoom"
      >
        <span class="icon">🔍-</span> 缩小
      </button>
      <button
        @click="resetView"
        class="btn btn-info"
      >
        <span class="icon">🎯</span> 重置视图
      </button>
      <div class="divider"></div>
      <button
        @click="clearLogs"
        class="btn btn-secondary"
      >
        <span class="icon">🗑️</span> 清空日志
      </button>
    </div>

    <div class="logs">
      <h3>事件日志：</h3>
      <div class="log-list">
        <div
          v-for="(log, index) in logs"
          :key="index"
          class="log-item"
          :class="log.type"
        >
          <span class="log-time">{{ log.time }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted, onBeforeUnmount } from "vue";
  import Connector from "../../packages/utils/connector/Connector.js";
  // import Connector from "../../packages/dist/index.js";
  // import Connector from "power-link";

  const containerRef = ref(null);
  const node1Ref = ref(null);
  const node2Ref = ref(null);
  const node3Ref = ref(null);
  const node4Ref = ref(null);
  const node5Ref = ref(null);
  const node6Ref = ref(null);
  const logs = ref([]);
  const currentZoom = ref(1);

  let connector = null;

  // 添加日志
  const addLog = (message, type = "info") => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

    logs.value.unshift({
      time,
      message,
      type
    });

    // 限制日志数量
    if (logs.value.length > 10) {
      logs.value.pop();
    }
  };

  // 清空日志
  const clearLogs = () => {
    logs.value = [];
    addLog("日志已清空", "info");
  };

  // 编程方式建立连接
  const programmaticConnect = () => {
    if (connector && connector.nodes.length >= 2) {
      // 建立多条连接示例 - 演示双触点功能
      const node1 = connector.nodes[0]; // LLM (左右触点)
      const node2 = connector.nodes[1]; // 知识检索 (左右触点)
      const node3 = connector.nodes[2]; // 搜索引擎 (左触点)
      const node5 = connector.nodes[4]; // 输出结果 (左右触点)

      // 自动选择合适的触点建立连接（会触发 onConnect 回调）
      connector.createConnection(node1, node2);
      connector.createConnection(node1, node3);
      connector.createConnection(node2, node5);
      connector.createConnection(node3, node5);

      addLog("通过编程方式建立了多条连接（会触发回调）", "success");
    }
  };

  // 静默方式建立连接（不触发回调）
  const silentConnect = () => {
    if (connector && connector.nodes.length >= 2) {
      const node6 = connector.nodes[5]; // 输入数据
      const node1 = connector.nodes[0]; // LLM

      // 使用 silent: true 静默创建连接，不触发 onConnect 回调
      connector.createConnection(node6, node1, null, null, { silent: true });

      addLog("静默方式建立连接（不触发回调，用于数据回显）", "info");
    }
  };

  // 编程方式断开连接（触发回调）
  const programmaticDisconnect = () => {
    if (connector && connector.connections && connector.connections.length > 0) {
      connector.disconnect();
      addLog("通过编程方式断开了所有连接（触发回调）", "warning");
    } else {
      addLog("当前没有连接可以断开", "warning");
    }
  };

  // 静默方式断开连接（不触发回调）
  const silentDisconnect = () => {
    if (connector && connector.connections && connector.connections.length > 0) {
      const count = connector.connections.length;
      connector.disconnect(null, { silent: true });
      addLog(`静默断开了 ${count} 条连接（不触发回调）`, "info");
    } else {
      addLog("当前没有连接可以断开", "warning");
    }
  };

  // 编程方式断开指定连接（通过节点ID）
  const disconnectSpecific = (fromNodeId, toNodeId = null) => {
    if (!connector || !connector.connections || connector.connections.length === 0) {
      addLog("当前没有连接可以断开", "warning");
      return;
    }

    // 如果只提供一个参数，断开该节点的所有连接
    if (!toNodeId) {
      const nodeConnections = connector.connections.filter((conn) => conn.fromNode.id === fromNodeId || conn.toNode.id === fromNodeId);

      if (nodeConnections.length === 0) {
        addLog(`节点 ${fromNodeId} 没有连接`, "warning");
        return;
      }

      nodeConnections.forEach((conn) => {
        connector.disconnect(conn.id);
      });
      addLog(`已断开节点 ${fromNodeId} 的 ${nodeConnections.length} 个连接`, "warning");
    } else {
      // 断开指定两个节点之间的连接
      const targetConnection = connector.connections.find(
        (conn) => (conn.fromNode.id === fromNodeId && conn.toNode.id === toNodeId) || (conn.fromNode.id === toNodeId && conn.toNode.id === fromNodeId)
      );

      if (targetConnection) {
        connector.disconnect(targetConnection.id);
        addLog(`已断开 ${fromNodeId} → ${toNodeId} 的连接`, "warning");
      } else {
        addLog(`未找到 ${fromNodeId} 与 ${toNodeId} 之间的连接`, "warning");
      }
    }
  };

  // 通过连接ID断开连接
  const disconnectByConnectionId = (connectionId) => {
    if (connector) {
      const conn = connector.connections.find((c) => c.id === connectionId);
      if (conn) {
        connector.disconnect(connectionId);
        addLog(`已断开连接: ${conn.fromNode.id} → ${conn.toNode.id}`, "warning");
      } else {
        addLog("未找到指定的连接", "warning");
      }
    }
  };

  // 放大
  const zoomIn = () => {
    if (connector) {
      connector.zoomIn();
      currentZoom.value = connector.getZoom();
      addLog(`画布已放大至 ${(currentZoom.value * 100).toFixed(0)}%`, "info");
    }
  };

  // 缩小
  const zoomOut = () => {
    if (connector) {
      connector.zoomOut();
      currentZoom.value = connector.getZoom();
      addLog(`画布已缩小至 ${(currentZoom.value * 100).toFixed(0)}%`, "info");
    }
  };

  // 重置视图
  const resetView = () => {
    if (connector) {
      connector.resetView();
      currentZoom.value = connector.getZoom();
      addLog("视图已重置", "info");
    }
  };

  onMounted(() => {
    // 初始化连线器
    connector = new Connector({
      container: containerRef.value,
      lineColor: "#155BD4",
      lineWidth: 2,
      dotSize: 12,
      dotHoverScale: 1.8,
      dotColor: "#155BD4",
      deleteButtonSize: 24,
      enableNodeDrag: true, // 启用节点拖拽
      enableSnap: true, // 启用吸附功能
      snapDistance: 30, // 吸附距离 30px
      enableZoom: true, // 启用缩放
      enablePan: true, // 启用平移
      minZoom: 0.1, // 最小 10%
      maxZoom: 4, // 最大 400%
      zoomStep: 0.1, // 步长 10%

      // 监听连接建立事件
      onConnect: (connection) => {
        console.log("连接已建立:", connection);
        addLog(`✅ 连接已建立: ${connection.from} → ${connection.to}`, "success");
      },

      // 监听连接断开事件
      onDisconnect: (connection) => {
        console.log("连接已断开:", connection);
        addLog(`❌ 连接已断开: ${connection.from} → ${connection.to}`, "error");
      },

      // 监听视图变化事件
      onViewChange: (viewState) => {
        currentZoom.value = viewState.scale;
      }
    });

    // 设置初始视图状态（缩放 80%，向右下平移 50px）
    connector.setViewState({
      scale: 0.8,
      translateX: 50,
      translateY: 30
    });

    // 初始化缩放显示
    currentZoom.value = connector.getZoom();

    // 注册节点 - 演示不同的触点配置
    // 配置方式1: 使用 'both' 表示左右都有触点
    connector.registerNode("llm", node1Ref.value, {
      dotPositions: ["right"]
    });

    // 配置方式2: 使用数组 ['left', 'right'] 表示左右都有触点
    connector.registerNode("knowledge", node2Ref.value, {
      dotPositions: ["left", "right"]
    });

    // 配置方式3: 使用数组 ['left', 'right'] 表示左右都有触点
    connector.registerNode("search", node3Ref.value, {
      dotPositions: ["left", "right"]
    });

    // 配置方式4: 使用数组 ['left'] 表示只有左侧触点
    connector.registerNode("database", node4Ref.value, {
      dotPositions: ["left"]
    });

    // 配置方式5: 使用数组 ['left'] 表示只有左侧触点
    connector.registerNode("output", node5Ref.value, {
      dotPositions: ["left"]
    });

    // 配置方式6: 使用数组 ['right'] 表示只有右侧触点
    connector.registerNode("input", node6Ref.value, {
      dotPositions: ["right"]
    });

    addLog("连线器初始化完成，共注册 6 个节点（支持双触点）", "info");
  });

  onBeforeUnmount(() => {
    // 销毁连线器
    if (connector) {
      connector.destroy();
      connector = null;
    }
  });
</script>

<style scoped lang="scss">
  .connector-example {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;

    .description {
      background: white;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

      p {
        margin: 0 0 10px 0;
        font-size: 16px;
        color: #333;
      }

      ul {
        margin: 0;
        padding-left: 20px;

        li {
          margin: 6px 0;
          font-size: 14px;
          color: #666;
          line-height: 1.6;

          strong {
            color: #155bd4;
          }
        }
      }
    }

    .connector-container {
      position: relative;
      height: 400px;
      background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%);
      border-radius: 12px;
      padding: 40px;
      margin-bottom: 30px;
    }

    .node-1 {
      left: 50px;
      top: 150px;
    }

    .node-2 {
      left: 50px;
      top: 250px;
    }

    .node-6 {
      left: 50px;
      top: 50px;
    }

    .node-3 {
      right: 50px;
      top: 180px;
    }

    .node-4 {
      right: 50px;
      top: 310px;
    }

    .node-5 {
      right: 50px;
      top: 50px;
    }

    .node {
      position: absolute;
      width: 160px;
      height: 90px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: box-shadow 0.2s;
      cursor: move;
      z-index: 10;
      user-select: none;

      &:hover {
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
      }

      &:active {
        cursor: grabbing;
      }

      .node-icon {
        font-size: 32px;
        margin-bottom: 6px;
      }

      .node-label {
        font-size: 14px;
        font-weight: 600;
        color: #333;
      }
    }

    .logs {
      background: white;
      border-radius: 8px;
      padding: 12px;
      margin-top: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

      h3 {
        margin: 0 0 12px 0;
        font-size: 18px;
        color: #333;
      }

      .log-list {
        max-height: 200px;
        overflow-y: auto;
      }

      .log-item {
        padding: 8px 12px;
        margin-bottom: 8px;
        border-radius: 4px;
        font-size: 14px;
        display: flex;
        gap: 12px;

        &.info {
          background-color: #e6f7ff;
          border-left: 3px solid #1890ff;
        }

        &.success {
          background-color: #f6ffed;
          border-left: 3px solid #52c41a;
        }

        &.warning {
          background-color: #fffbe6;
          border-left: 3px solid #faad14;
        }

        &.error {
          background-color: #fff2f0;
          border-left: 3px solid #ff4d4f;
        }

        .log-time {
          color: #999;
          font-family: monospace;
          min-width: 60px;
        }

        .log-message {
          color: #333;
          flex: 1;
        }
      }
    }

    .controls {
      display: flex;
      gap: 12px;
      justify-content: center;
      align-items: center;
      flex-wrap: wrap;
      margin-bottom: 16px;

      .divider {
        width: 1px;
        height: 30px;
        background-color: #e0e0e0;
        margin: 0 4px;
      }

      .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 6px;

        .icon {
          font-size: 16px;
        }

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        &:active {
          transform: translateY(0);
        }

        &.btn-primary {
          background-color: #155bd4;
          color: white;

          &:hover {
            background-color: #1248a8;
          }
        }

        &.btn-danger {
          background-color: #ff4d4f;
          color: white;

          &:hover {
            background-color: #d9363e;
          }
        }

        &.btn-zoom {
          background-color: #52c41a;
          color: white;

          &:hover {
            background-color: #3da010;
          }
        }

        &.btn-success {
          background-color: #52c41a;
          color: white;

          &:hover {
            background-color: #3da010;
          }
        }

        &.btn-info {
          background-color: #1890ff;
          color: white;

          &:hover {
            background-color: #0d7de0;
          }
        }

        &.btn-warning {
          background-color: #faad14;
          color: white;

          &:hover {
            background-color: #d89614;
          }
        }

        &.btn-secondary {
          background-color: #f0f0f0;
          color: #333;

          &:hover {
            background-color: #e0e0e0;
          }
        }
      }
    }

    .zoom-indicator {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      margin-bottom: 20px;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);

      .zoom-value {
        font-size: 28px;
        font-weight: 700;
        color: white;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        min-width: 80px;
      }

      .zoom-tips {
        display: flex;
        gap: 20px;
        flex-wrap: wrap;

        .tip {
          display: flex;
          align-items: center;
          gap: 6px;
          color: white;
          font-size: 13px;
          background: rgba(255, 255, 255, 0.15);
          padding: 6px 12px;
          border-radius: 6px;
          backdrop-filter: blur(10px);

          kbd {
            background-color: rgba(255, 255, 255, 0.25);
            padding: 2px 8px;
            border-radius: 4px;
            font-family: "Courier New", monospace;
            font-size: 12px;
            font-weight: 600;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
        }
      }
    }
  }
</style>
