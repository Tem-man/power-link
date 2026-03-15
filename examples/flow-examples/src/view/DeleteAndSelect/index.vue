<!--name: DeleteAndSelect Node Deletion & Selection -->
<!--description: Demonstrates deleteNode / getSelectedNode / onNodeSelect usage -->
<!--author: Tem-man -->
<!--version: 1.0.0 -->
<template>
  <div class="page-wrapper">
    <!-- Toolbar -->
    <div class="toolbar">
      <div
        class="toolbar-item danger"
        :class="{ disabled: !selectedNodeInfo }"
        @click="deleteSelected"
        title="Delete the selected node (or press Delete / Backspace)"
      >
        <svg class="btn-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M3 4h10M6 4V2h4v2M5 4v9a1 1 0 001 1h4a1 1 0 001-1V4"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        Delete Selected
      </div>
      <div
        class="toolbar-item"
        @click="getSelected"
        title="Call getSelectedNode() to get the currently selected node"
      >
        <svg class="btn-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="7" cy="7" r="4.5" stroke="currentColor" stroke-width="1.8" />
          <path
            d="M10.5 10.5L13.5 13.5"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          />
        </svg>
        Get Selected (API)
      </div>
    </div>

    <!-- Source Code Button -->
    <SourceCode
      href="https://github.com/Tem-man/power-link/blob/main/examples/flow-examples/src/view/DeleteAndSelect/index.vue"
    />

    <div class="main-layout">
      <!-- Canvas -->
      <div class="container" ref="containerRef">
        <Teleport :to="wrapperRef" :disabled="!wrapperRef">
          <div
            v-for="node in nodes"
            :key="node.id"
            class="node"
            :class="node.style"
            :id="node.id"
            :ref="(el) => setNodeRef(el, node.id)"
            :style="{ left: node.x + 'px', top: node.y + 'px' }"
          >
            {{ node.label }}
          </div>
        </Teleport>
      </div>

      <!-- Info Panel -->
      <div class="info-panel">
        <!-- Selected Node Card -->
        <div class="panel-section">
          <div class="panel-title">
            <span class="dot" :class="{ active: !!selectedNodeInfo }"></span>
            Selected Node
          </div>

          <div v-if="selectedNodeInfo" class="node-card">
            <div class="node-card-row">
              <span class="field-key">id</span>
              <span class="field-val">{{ selectedNodeInfo.id }}</span>
            </div>
            <div class="node-card-row" v-if="selectedNodeInfo.info">
              <span class="field-key">name</span>
              <span class="field-val">{{ selectedNodeInfo.info.name }}</span>
            </div>
            <div class="node-card-row" v-if="selectedNodeInfo.info">
              <span class="field-key">desc</span>
              <span class="field-val muted">{{ selectedNodeInfo.info.desc }}</span>
            </div>
          </div>
          <div v-else class="empty-hint">Click a node on the canvas to select it</div>
        </div>

        <!-- Delete Log -->
        <div class="panel-section">
          <div class="panel-title">onNodeDelete</div>
          <div v-if="deleteLog[0]" class="node-card">
            <div class="node-card-row">
              <span class="field-key">id</span>
              <span class="field-val">{{ deleteLog[0].id }}</span>
            </div>
            <div class="node-card-row">
              <span class="field-key">time</span>
              <span class="field-val muted">{{ deleteLog[0].time }}</span>
            </div>
          </div>
          <div v-else class="empty-hint">No deletions yet</div>
        </div>

        <!-- API Reference -->
        <div class="panel-section">
          <div class="panel-title">API Reference</div>
          <div class="api-block">
            <div class="api-name">onNodeSelect</div>
            <div class="api-desc">
              Fires when a node is selected or deselected. <code>info</code> is null when
              deselected.
            </div>
            <pre class="code-snippet">
new Connector({
  onNodeSelect: (info) => {
    if (info) {
      console.log('selected:', info.id)
    } else {
      console.log('deselected')
    }
  }
})</pre
            >
          </div>
          <div class="api-block">
            <div class="api-name">getSelectedNode()</div>
            <div class="api-desc">
              Programmatically get the currently selected node. Returns <code>null</code> if none is
              selected.
            </div>
            <pre class="code-snippet">
const node = connector.getSelectedNode()
// node.id / node.label / node.x / node.y ...</pre
            >
          </div>
          <div class="api-block">
            <div class="api-name">deleteNode(id)</div>
            <div class="api-desc">
              Delete a node by id. All its connections are removed automatically and
              <code>onNodeDelete</code> fires. You can also press <kbd>Delete</kbd> to remove the
              selected node.
            </div>
            <pre class="code-snippet">
connector.deleteNode('node_id')

// Sync framework state in onNodeDelete
onNodeDelete: ({ id }) => {
  nodes.value = nodes.value.filter(n => n.id !== id)
}</pre
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import Connector from 'power-link';
import SourceCode from '../../components/SourceCode/index.vue';

const containerRef = ref(null);
const wrapperRef = ref(null);
const logListRef = ref(null);
const nodeRefs = new Map();

const setNodeRef = (el, id) => {
  if (el) nodeRefs.set(id, el);
  else nodeRefs.delete(id);
};

// Currently selected node (updated via onNodeSelect callback)
const selectedNodeInfo = ref(null);

// onNodeDelete log
const deleteLog = ref([]);
const pushDeleteLog = (id) => {
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  deleteLog.value = [{ id, time }];
};

// Initial node data
const nodes = ref([
  {
    id: 'start',
    label: 'Start',
    x: 60,
    y: 200,
    style: 'node-success',
    dotPositions: ['right'],
    info: { name: 'Start', desc: 'Flow start node' },
  },
  {
    id: 'process_a',
    label: 'Process A',
    x: 260,
    y: 120,
    style: 'node-primary',
    dotPositions: 'both',
    info: { name: 'Process A', desc: 'First processing step' },
  },
  {
    id: 'process_b',
    label: 'Process B',
    x: 260,
    y: 280,
    style: 'node-warning',
    dotPositions: 'both',
    info: { name: 'Process B', desc: 'Second processing step' },
  },
  {
    id: 'end',
    label: 'End',
    x: 470,
    y: 200,
    style: 'node-success',
    dotPositions: ['left'],
    info: { name: 'End', desc: 'Flow end node' },
  },
]);

let connector = null;

// ── deleteNode demo ────────────────────────────────
const deleteSelected = () => {
  if (!selectedNodeInfo.value || !connector) return;
  connector.deleteNode(selectedNodeInfo.value.id);
};

// ── getSelectedNode demo ──────────────────────────
const getSelected = () => {
  if (!connector) return;
  const node = connector.getSelectedNode();
  if (node) {
    console.log(
      `getSelectedNode() → id: "${node.id}", label: "${node.label}", x: ${Math.round(node.x)}, y: ${Math.round(node.y)}`
    );
  } else {
    console.log('getSelectedNode() → null (no node currently selected)');
  }
};

onMounted(async () => {
  connector = new Connector({
    container: containerRef.value,

    // ── onNodeSelect demo ─────────────────────────
    onNodeSelect: (info) => {
      selectedNodeInfo.value = info;
    },

    // ── onNodeDelete demo ─────────────────────────
    onNodeDelete: ({ id }) => {
      nodes.value = nodes.value.filter((n) => n.id !== id);
      selectedNodeInfo.value = null;
      pushDeleteLog(id);
    },

    onNodeMove: ({ id, x, y }) => {
      const node = nodes.value.find((n) => n.id === id);
      if (node) {
        node.x = x;
        node.y = y;
      }
    },
  });

  wrapperRef.value = containerRef.value.querySelector('.connector-content-wrapper');

  await nextTick();

  // Register all nodes
  nodes.value.forEach((node) => {
    const el = nodeRefs.get(node.id);
    if (el) {
      connector.registerNode(node.id, el, {
        label: node.label,
        dotPositions: node.dotPositions,
        info: node.info,
      });
    }
  });

  // Initial connections
  connector.createConnection('start', 'process_a', 'right', 'left', { silent: true });
  connector.createConnection('start', 'process_b', 'right', 'left', { silent: true });
  connector.createConnection('process_a', 'end', 'right', 'left', { silent: true });
  connector.createConnection('process_b', 'end', 'right', 'left', { silent: true });
});

onBeforeUnmount(() => {
  connector?.destroy();
});
</script>

<style scoped>
.page-wrapper {
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── Toolbar ── */
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

.toolbar-item.danger {
  background-color: #fee2e2;
  color: #b91c1c;
}

.toolbar-item.danger:hover {
  background-color: #fecaca;
  color: #991b1b;
}

.toolbar-item.danger:active {
  background-color: #fca5a5;
  transform: translateY(1px);
}

.toolbar-item.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.btn-icon {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
  margin-right: 6px;
}

/* ── Main Layout ── */
.main-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* ── Canvas ── */
.container {
  flex: 1;
  position: relative;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%);
  border: 1px solid #ddd;
  overflow: hidden;
}

/* ── Nodes ── */
.node {
  position: absolute;
  padding: 14px 22px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  cursor: move;
  user-select: none;
  min-width: 110px;
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

/* ── Info Panel ── */
.info-panel {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-left: 1px solid #eaecf0;
  overflow-y: auto;
}

.panel-section {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.panel-title {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Selected indicator dot */
.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #d1d5db;
  flex-shrink: 0;
  transition: background 0.2s;
}
.dot.active {
  background: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2);
}

/* Clear button */
.clear-btn {
  margin-left: auto;
  font-size: 11px;
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
  color: #9ca3af;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: all 0.15s;
}
.clear-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

/* Node card */
.node-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.node-card-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
}

.field-key {
  color: #9ca3af;
  font-family: 'Fira Code', monospace;
  font-size: 12px;
  min-width: 40px;
  padding-top: 1px;
}

.field-val {
  color: #1f2937;
  font-weight: 500;
  word-break: break-all;
}

.field-val.muted {
  color: #6b7280;
  font-weight: 400;
}

/* Empty hint */
.empty-hint {
  font-size: 13px;
  color: #9ca3af;
  text-align: center;
  padding: 8px 0;
}

/* API blocks */
.api-block {
  margin-bottom: 14px;
  padding-bottom: 14px;
  border-bottom: 1px dashed #f0f0f0;
}
.api-block:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.api-name {
  font-size: 13px;
  font-weight: 600;
  color: #155bd4;
  font-family: 'Fira Code', monospace;
  margin-bottom: 4px;
}

.api-desc {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 8px;
}

.api-desc code {
  background: #f1f5f9;
  color: #374151;
  padding: 1px 4px;
  border-radius: 3px;
  font-family: 'Fira Code', monospace;
  font-size: 11px;
}

kbd {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 3px;
  padding: 1px 5px;
  font-size: 11px;
  color: #374151;
}

.code-snippet {
  background: #1e293b;
  color: #e2e8f0;
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 11px;
  font-family: 'Fira Code', monospace;
  line-height: 1.7;
  margin: 0;
  overflow-x: auto;
  white-space: pre;
}
</style>
