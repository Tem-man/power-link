<!--name: ImportAndExport 导入导出示例 -->
<!--description: 演示流程图数据的导入与导出功能 -->
<!--author: Tem-man -->
<!--version: 1.0.0 -->
<template>
  <div class="page-wrapper">
    <!-- Toolbar -->
    <div class="toolbar">
      <div class="toolbar-item primary" @click="saveData">
        <svg class="btn-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2M8 2v8M5 7l3 3 3-3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Save
      </div>
      <div class="toolbar-item" @click="openImportModal">
        <svg class="btn-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2M8 10V2M5 5l3-3 3 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Import
      </div>
      <div class="toolbar-item" @click="downloadData">
        <svg class="btn-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13 10H3a1 1 0 00-1 1v2a1 1 0 001 1h10a1 1 0 001-1v-2a1 1 0 00-1-1zM8 2v7M5 6l3 3 3-3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Export JSON
      </div>
    </div>

    <!-- Import Modal -->
    <div v-if="showImportModal" class="modal-overlay" @click.self="closeImportModal">
      <div class="modal-content">
        <h3>Import Data</h3>
        <p>Paste node data (JSON array) below:</p>
        <textarea
          v-model="importDataStr"
          class="modal-textarea"
          placeholder='[{"id":"node_1", ...}]'
        ></textarea>
        <div class="modal-footer">
          <button class="btn" @click="closeImportModal">Cancel</button>
          <button class="btn btn-primary" @click="confirmImport">Confirm</button>
        </div>
      </div>
    </div>

    <!-- Source Code Button -->
    <SourceCode
      href="https://github.com/Tem-man/power-link/blob/main/examples/flow-examples/src/view/ImportAndExport/index.vue"
    />

    <div class="container" ref="containerRef">
      <Teleport :to="wrapperRef" :disabled="!wrapperRef">
        <div
          v-for="node in nodes"
          :key="node.id"
          class="node"
          :class="node.options?.style"
          :id="node.id"
          :ref="(el) => setNodeRef(el, node.id)"
          :style="{ left: node.x + 'px', top: node.y + 'px' }"
        >
          {{ node.label }}
        </div>
      </Teleport>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import Connector from 'power-link';
import SourceCode from '../../components/SourceCode/index.vue';
const containerRef = ref(null);
const wrapperRef = ref(null);
const nodeRefs = new Map();
const setNodeRef = (el, id) => {
  if (el) {
    nodeRefs.set(id, el);
  } else {
    nodeRefs.delete(id);
  }
};

// Initial nodes state - starting empty or with simple default
const nodes = ref([]);

let connector = null;

const saveData = () => {
  if (!connector) return;

  // export() 内部已维护节点坐标，无需手动从 DOM 反查
  const data = connector.export();
  // 保留业务自定义字段（type / options 等，label 已由 export() 原生返回）
  data.nodes = data.nodes.map((exportNode) => {
    console.log('exportNode:', exportNode);
    const origin = nodes.value.find((n) => n.id === exportNode.id);
    return { ...exportNode, type: origin?.type, options: origin?.options };
  });

  localStorage.setItem('flowData', JSON.stringify(data));
  console.log('Data saved to localStorage', data);
  alert('Topology saved!');
};

const downloadData = () => {
  if (!connector) return;

  const data = connector.export();
  // Merge business data like type and options
  data.nodes = data.nodes.map((exportNode) => {
    const origin = nodes.value.find((n) => n.id === exportNode.id);
    return {
      ...exportNode,
      type: origin?.type,
      options: origin?.options,
    };
  });

  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'flow-data.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const showImportModal = ref(false);
const importDataStr = ref('');

const openImportModal = () => {
  showImportModal.value = true;
  importDataStr.value = JSON.stringify(
    {
      viewState: {
        scale: 1,
        translateX: -101,
        translateY: -22,
      },
      nodes: [
        {
          id: 'start',
          label: 'Start',
          x: 100.00001525878906,
          y: 245.99996948242188,
          info: {
            id: 'start',
            name: 'Start',
            desc: 'This is a Start Node',
          },
          dotPositions: ['right'],
          options: {
            dotPositions: ['right'],
            style: 'node-success',
            info: {
              id: 'start',
              name: 'Start',
              desc: 'This is a Start Node',
            },
          },
        },
        {
          id: 'end',
          label: 'End',
          x: 603.9847259521484,
          y: 256.9855194091797,
          info: {
            id: 'end',
            name: 'End',
            desc: 'This is a End Node',
          },
          dotPositions: ['left'],
          options: {
            dotPositions: ['left'],
            style: 'node-success',
            info: {
              id: 'end',
              name: 'End',
              desc: 'This is a End Node',
            },
          },
        },
        {
          id: 'node_1773236001994',
          label: 'Loop',
          x: 350.9813995361328,
          y: 294.9847412109375,
          info: {
            id: 'node_1773236001994',
            name: 'Loop',
            desc: 'A loop node',
          },
          dotPositions: ['left', 'right'],
          type: 'loop',
          options: {
            dotPositions: 'both',
            style: 'node-warning',
            info: {
              id: 'node_1773236001994',
              name: 'Loop',
              desc: 'A loop node',
            },
          },
        },
        {
          id: 'node_1773236011149',
          label: 'Branch',
          x: 341.9904022216797,
          y: 133.99224090576172,
          info: {
            id: 'node_1773236011149',
            name: 'Branch',
            desc: 'A branch node',
          },
          dotPositions: ['left', 'right'],
          type: 'branch',
          options: {
            dotPositions: 'both',
            style: 'node-warning',
            info: {
              id: 'node_1773236011149',
              name: 'Branch',
              desc: 'A branch node',
            },
          },
        },
        {
          id: 'node_1773236018946',
          label: 'Event Node',
          x: 223.98423767089844,
          y: 406.9891357421875,
          info: {
            id: 'node_1773236018946',
            name: 'Event',
            desc: 'An event node',
          },
          dotPositions: ['left', 'right'],
          type: 'event',
          options: {
            dotPositions: 'both',
            style: 'node-success',
            info: {
              id: 'node_1773236018946',
              name: 'Event',
              desc: 'An event node',
            },
          },
        },
        {
          id: 'node_1773236025815',
          label: 'Task Node',
          x: 442.9813690185547,
          y: 419.9873046875,
          info: {
            id: 'node_1773236025815',
            name: 'Task',
            desc: 'A task node',
          },
          dotPositions: ['left', 'right'],
          type: 'task',
          options: {
            dotPositions: 'both',
            style: 'node-primary',
            info: {
              id: 'node_1773236025815',
              name: 'Task',
              desc: 'A task node',
            },
          },
        },
      ],
      connections: [
        {
          from: 'start',
          fromLabel: 'Start',
          to: 'node_1773236011149',
          toLabel: 'Branch',
          fromDot: 'right',
          toDot: 'left',
        },
        {
          from: 'start',
          fromLabel: 'Start',
          to: 'node_1773236018946',
          toLabel: 'Event Node',
          fromDot: 'right',
          toDot: 'left',
        },
        {
          from: 'start',
          fromLabel: 'Start',
          to: 'node_1773236001994',
          toLabel: 'Loop',
          fromDot: 'right',
          toDot: 'left',
        },
        {
          from: 'node_1773236018946',
          fromLabel: 'Event Node',
          to: 'node_1773236025815',
          toLabel: 'Task Node',
          fromDot: 'right',
          toDot: 'left',
        },
        {
          from: 'node_1773236011149',
          fromLabel: 'Branch',
          to: 'end',
          toLabel: 'End',
          fromDot: 'right',
          toDot: 'left',
        },
        {
          from: 'node_1773236001994',
          fromLabel: 'Loop',
          to: 'end',
          toLabel: 'End',
          fromDot: 'right',
          toDot: 'left',
        },
        {
          from: 'node_1773236025815',
          fromLabel: 'Task Node',
          to: 'end',
          toLabel: 'End',
          fromDot: 'right',
          toDot: 'left',
        },
      ],
    },
    null,
    2
  );
};

const closeImportModal = () => {
  showImportModal.value = false;
};

const confirmImport = async () => {
  try {
    const parsed = JSON.parse(importDataStr.value);
    let newNodes = [];
    let connections = [];

    if (Array.isArray(parsed)) {
      newNodes = parsed;
    } else if (parsed.nodes && Array.isArray(parsed.nodes)) {
      newNodes = parsed.nodes;
      connections = parsed.connections || [];
    } else {
      alert('Invalid data format: Expected array or object with "nodes" array.');
      return;
    }

    if (newNodes.length === 0) {
      alert('No nodes found in data.');
      return;
    }

    // Merge nodes logic
    const existingIds = new Set(nodes.value.map((n) => n.id));
    const nodesToAdd = newNodes.filter((n) => !existingIds.has(n.id));

    if (nodesToAdd.length === 0) {
      alert('All nodes already exist.');
    } else {
      nodes.value.push(...nodesToAdd);
    }

    closeImportModal();

    await nextTick();

    const importPayload = {
      nodes: newNodes.map((n) => ({
        ...n,
        dotPositions: n.dotPositions || n.options?.dotPositions,
        info: n.info || n.options?.info,
      })),
      connections: connections,
      viewState: parsed.viewState || { scale: 1, translateX: 0, translateY: 0 },
    };

    await connector.import(importPayload);
  } catch (e) {
    console.error('Import failed', e);
    alert('Import failed: ' + e.message);
  }
};

onMounted(async () => {
  connector = new Connector({
    container: containerRef.value,
    onConnect: (connection) => {
      console.log('Connection created:', connection);
    },
    onDisconnect: (connection) => {
      console.log('Connection removed:', connection);
    },
    onNodeMove: ({ id, x, y }) => {
      const node = nodes.value.find((n) => n.id === id);
      if (node) {
        node.x = x;
        node.y = y;
      }
    },
    onNodeDelete: ({ id }) => {
      nodes.value = nodes.value.filter((n) => n.id !== id);
    },
  });

  wrapperRef.value = containerRef.value.querySelector('.connector-content-wrapper');

  await nextTick();
  // Attempt to load initial data
  // loadData();
});

onBeforeUnmount(() => {
  if (connector) {
    connector.destroy();
  }
});
</script>

<style scoped>
.page-wrapper {
  position: relative;
  width: 100%;
}

.toolbar {
  display: flex;
  align-items: center;
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 1000;
  background: white;
  border: 1px solid #eaeaea;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  padding: 6px;
  gap: 8px;
}

.toolbar-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  position: relative;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  user-select: none;
  border-radius: 8px;
  border: none;
  background-color: #ebebf5;
  transition: all 0.15s ease;
}

.toolbar-item:hover {
  background-color: #ddddf0;
  color: #111827;
}

.toolbar-item:active {
  background-color: #d0d0ea;
  transform: translateY(1px);
}

.toolbar-item.primary {
  background-color: #5b5ef4;
  color: #fff;
}

.toolbar-item.primary:hover {
  background-color: #4a4de0;
  color: #fff;
}

.toolbar-item.primary:active {
  background-color: #3d40cc;
}

.btn-icon {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
  margin-right: 6px;
}

.container {
  position: relative;
  height: calc(100vh - 24px);
  background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%);
  border: 1px solid #ddd;
}

.node {
  position: absolute;
  padding: 16px 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  cursor: move;
  user-select: none;
  min-width: 120px;
  text-align: center;
  z-index: 10;
  border: 1px solid transparent;
  font-weight: 500;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.node:hover {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
}

.node-primary {
  background: linear-gradient(145deg, #ffffff 0%, #f0f7ff 100%);
  border-color: #bfdbfe;
  color: #1e40af;
}
.node-primary::before {
  content: '🔷';
  font-size: 14px;
}

.node-success {
  background: linear-gradient(145deg, #ffffff 0%, #f0fdf4 100%);
  border-color: #bbf7d0;
  color: #166534;
}
.node-success::before {
  content: '🟢';
  font-size: 14px;
}

.node-warning {
  background: linear-gradient(145deg, #ffffff 0%, #fff7ed 100%);
  border-color: #fed7aa;
  color: #9a3412;
}
.node-warning::before {
  content: '🔶';
  font-size: 14px;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  padding: 24px;
  border-radius: 12px;
  width: 500px;
  max-width: 90%;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 16px;
  animation: modalPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modalPop {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-content h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.modal-content p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.modal-textarea {
  width: 100%;
  height: 200px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  resize: vertical;
  font-family: 'Fira Code', monospace;
  font-size: 13px;
  line-height: 1.5;
  outline: none;
  transition: border-color 0.2s;
}

.modal-textarea:focus {
  border-color: #155bd4;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid #e2e8f0;
  background: white;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s;
}

.btn:hover {
  background: #f8fafc;
}

.btn-primary {
  background: #155bd4;
  color: white;
  border-color: #155bd4;
}

.btn-primary:hover {
  background: #1e40af;
  border-color: #1e40af;
}
</style>
