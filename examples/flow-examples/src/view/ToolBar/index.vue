<!--name: ToolBar - Right-click Context Menu -->
<!--description: Right-click a node to open a context menu with Add Node and Delete options -->
<!--author: Tem-man -->
<!--version: 1.0.0 -->
<template>
  <div class="page-wrapper" @click="closeAllMenus" @contextmenu.prevent>
    <!-- Source Code Button -->
    <SourceCode
      href="https://github.com/Tem-man/power-link/blob/main/examples/flow-examples/src/view/ToolBar/index.vue"
    />
    <!-- Canvas -->
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

    <!-- Context Menu -->
    <Teleport to="body">
      <div
        v-if="contextMenu.visible"
        class="context-menu"
        :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
        @click.stop
      >
        <div class="context-menu-section">
          <div class="context-menu-item" @click="openNodePicker">
            <span class="menu-item-icon">
              <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M8 2v12M2 8h12"
                  stroke="currentColor"
                  stroke-width="2.2"
                  stroke-linecap="round"
                />
              </svg>
            </span>
            <span class="menu-item-label">Add Node</span>
          </div>
          <div class="context-menu-item" @click="changeNodeType">
            <span class="menu-item-icon">
              <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M2 8a6 6 0 1 0 12 0A6 6 0 0 0 2 8z"
                  stroke="currentColor"
                  stroke-width="1.7"
                />
                <path
                  d="M8 5v3l2 2"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round"
                />
              </svg>
            </span>
            <span class="menu-item-label">Change Node</span>
          </div>
        </div>

        <div class="context-menu-divider"></div>

        <div class="context-menu-section">
          <div class="context-menu-item" @click="copyNode">
            <span class="menu-item-icon">
              <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect
                  x="5"
                  y="5"
                  width="8"
                  height="9"
                  rx="1.5"
                  stroke="currentColor"
                  stroke-width="1.7"
                />
                <path
                  d="M3 11V3a1 1 0 0 1 1-1h7"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round"
                />
              </svg>
            </span>
            <span class="menu-item-label">Copy</span>
            <span class="menu-item-shortcut">Ctrl C</span>
            <span v-if="clipboard" class="menu-item-copied-dot"></span>
          </div>
          <div class="context-menu-item" @click="duplicateNode">
            <span class="menu-item-icon">
              <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect
                  x="2"
                  y="2"
                  width="8"
                  height="9"
                  rx="1.5"
                  stroke="currentColor"
                  stroke-width="1.7"
                />
                <rect
                  x="6"
                  y="5"
                  width="8"
                  height="9"
                  rx="1.5"
                  stroke="currentColor"
                  stroke-width="1.7"
                />
              </svg>
            </span>
            <span class="menu-item-label">Duplicate</span>
            <span class="menu-item-shortcut">Ctrl D</span>
          </div>
        </div>

        <div class="context-menu-divider"></div>

        <div class="context-menu-section">
          <div class="context-menu-item danger" @click="deleteContextNode">
            <span class="menu-item-icon">
              <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M3 4h10M6 4V2h4v2M5 4v9a1 1 0 001 1h4a1 1 0 001-1V4"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
            <span class="menu-item-label">Delete</span>
            <span class="menu-item-shortcut">Del</span>
          </div>
        </div>

        <div class="context-menu-divider"></div>

        <div class="context-menu-about" v-if="contextMenu.node">
          <div class="about-title">About</div>
          <div class="about-name">{{ contextMenu.node.label }}</div>
          <div class="about-desc">
            {{ contextMenu.node.options?.info?.desc || 'No description available' }}
          </div>
          <div class="about-author">Author PowerLink</div>
        </div>
      </div>
    </Teleport>

    <!-- Canvas Context Menu -->
    <Teleport to="body">
      <div
        v-if="canvasMenu.visible"
        class="context-menu"
        :style="{ left: canvasMenu.x + 'px', top: canvasMenu.y + 'px' }"
        @click.stop
      >
        <div class="context-menu-section">
          <div class="context-menu-item" :class="{ disabled: !clipboard }" @click="pasteNode()">
            <span class="menu-item-icon">
              <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect
                  x="3"
                  y="4"
                  width="10"
                  height="10"
                  rx="1.5"
                  stroke="currentColor"
                  stroke-width="1.7"
                />
                <path
                  d="M6 4V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1"
                  stroke="currentColor"
                  stroke-width="1.7"
                  stroke-linecap="round"
                />
                <path
                  d="M6 9h4M8 7v4"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                />
              </svg>
            </span>
            <span class="menu-item-label">Paste</span>
            <span class="menu-item-shortcut">Ctrl V</span>
          </div>
        </div>
        <div v-if="!clipboard" class="canvas-menu-hint">Copy a node first (Ctrl C)</div>
      </div>
    </Teleport>

    <!-- Node Picker Modal -->
    <Teleport to="body">
      <div v-if="showNodePicker" class="modal-overlay" @click.self="showNodePicker = false">
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title">
              <svg
                class="modal-title-icon"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10 2v16M2 10h16"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                />
              </svg>
              {{ pickerMode === 'change' ? 'Change Node Type' : 'Select Node Type' }}
            </div>
            <button class="modal-close" @click="showNodePicker = false">
              <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M3 3l10 10M13 3L3 13"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          </div>

          <div class="modal-search">
            <svg
              class="search-icon"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" stroke-width="1.6" />
              <path
                d="M10 10l3 3"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
              />
            </svg>
            <input v-model="pickerSearch" class="search-input" placeholder="Search node types..." />
          </div>

          <div class="modal-body">
            <div v-for="group in filteredNodeGroups" :key="group.label" class="node-group">
              <div class="group-label">{{ group.label }}</div>
              <div class="node-grid">
                <div
                  v-for="preset in group.nodes"
                  :key="preset.type"
                  class="node-card"
                  @click="pickerMode === 'change' ? replaceNode(preset) : addNodeAfter(preset)"
                >
                  <div class="node-card-icon" :class="'icon-' + preset.style">
                    {{ preset.icon }}
                  </div>
                  <div class="node-card-info">
                    <div class="node-card-name">{{ preset.label }}</div>
                    <div class="node-card-desc">{{ preset.desc }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="filteredNodeGroups.length === 0" class="empty-search">
              No node types match "{{ pickerSearch }}"
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import Connector from 'power-link';
import SourceCode from '../../components/SourceCode/index.vue';

const containerRef = ref(null);
const wrapperRef = ref(null);
const nodeRefs = new Map();
const pickerSearch = ref('');
const showNodePicker = ref(false);
// 'add' = add node after, 'change' = replace node
const pickerMode = ref('add');
const pickerTargetNode = ref(null);

const setNodeRef = (el, id) => {
  if (el) nodeRefs.set(id, el);
  else nodeRefs.delete(id);
};

// Context menu state (node right-click)
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  node: null,
});

// Canvas right-click menu state
const canvasMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  canvasX: 0,
  canvasY: 0,
});

// Clipboard: stores a deep-copied snapshot of a node
const clipboard = ref(null);

// Tracks the latest mouse position (client coordinates) over the canvas
const mouseClientPos = { x: 0, y: 0 };

// Initial nodes
const nodes = ref([
  {
    id: 'start',
    label: 'Start',
    x: 120,
    y: 260,
    options: {
      dotPositions: ['right'],
      style: 'node-success',
      info: { id: 'start', name: 'Start', desc: 'Flow start node' },
    },
  },
  {
    id: 'end',
    label: 'End',
    x: 380,
    y: 260,
    options: {
      dotPositions: ['left'],
      style: 'node-success',
      info: { id: 'end', name: 'End', desc: 'Flow end node' },
    },
  },
]);

// Preset node groups for the picker
const nodeGroups = [
  {
    label: 'AI & Processing',
    nodes: [
      {
        type: 'llm',
        label: 'LLM',
        icon: '🤖',
        desc: 'Call large language model to process text',
        style: 'node-primary',
        dotPositions: 'both',
      },
      {
        type: 'knowledge',
        label: 'Knowledge',
        icon: '📚',
        desc: 'Query knowledge base for context',
        style: 'node-primary',
        dotPositions: 'both',
      },
      {
        type: 'search',
        label: 'Search',
        icon: '🔍',
        desc: 'Search external data sources',
        style: 'node-primary',
        dotPositions: 'both',
      },
    ],
  },
  {
    label: 'Flow Control',
    nodes: [
      {
        type: 'gateway',
        label: 'Gateway',
        icon: '🔀',
        desc: 'Split or merge flow paths',
        style: 'node-warning',
        dotPositions: 'both',
      },
      {
        type: 'condition',
        label: 'Condition',
        icon: '❓',
        desc: 'Branch based on conditions',
        style: 'node-warning',
        dotPositions: 'both',
      },
      {
        type: 'loop',
        label: 'Loop',
        icon: '🔁',
        desc: 'Repeat steps until condition met',
        style: 'node-warning',
        dotPositions: 'both',
      },
      {
        type: 'branch',
        label: 'Branch',
        icon: '🌿',
        desc: 'Parallel execution branches',
        style: 'node-warning',
        dotPositions: 'both',
      },
      {
        type: 'decision',
        label: 'Decision',
        icon: '⚖️',
        desc: 'Make a routing decision',
        style: 'node-warning',
        dotPositions: 'both',
      },
    ],
  },
  {
    label: 'Actions & Data',
    nodes: [
      {
        type: 'task',
        label: 'Task',
        icon: '📋',
        desc: 'Execute a defined task',
        style: 'node-primary',
        dotPositions: 'both',
      },
      {
        type: 'action',
        label: 'Action',
        icon: '⚡',
        desc: 'Perform an automated action',
        style: 'node-primary',
        dotPositions: 'both',
      },
      {
        type: 'database',
        label: 'Database',
        icon: '🗄️',
        desc: 'Read or write database records',
        style: 'node-primary',
        dotPositions: 'both',
      },
      {
        type: 'event',
        label: 'Event',
        icon: '📡',
        desc: 'Trigger or listen to an event',
        style: 'node-success',
        dotPositions: 'both',
      },
    ],
  },
  {
    label: 'Input & Output',
    nodes: [
      {
        type: 'input',
        label: 'Input',
        icon: '📥',
        desc: 'Receive data from external source',
        style: 'node-success',
        dotPositions: 'right',
      },
      {
        type: 'output',
        label: 'Output',
        icon: '📤',
        desc: 'Send results to output target',
        style: 'node-success',
        dotPositions: 'left',
      },
    ],
  },
];

const filteredNodeGroups = computed(() => {
  if (!pickerSearch.value.trim()) return nodeGroups;
  const q = pickerSearch.value.toLowerCase();
  return nodeGroups
    .map((group) => ({
      ...group,
      nodes: group.nodes.filter(
        (n) => n.label.toLowerCase().includes(q) || n.desc.toLowerCase().includes(q)
      ),
    }))
    .filter((g) => g.nodes.length > 0);
});

let connector = null;

// ── Context Menu ────────────────────────────────────────────────

const closeAllMenus = () => {
  contextMenu.value.visible = false;
  canvasMenu.value.visible = false;
};

// ── Context Menu Actions ────────────────────────────────────────

const openNodePicker = () => {
  pickerMode.value = 'add';
  pickerTargetNode.value = contextMenu.value.node;
  pickerSearch.value = '';
  showNodePicker.value = true;
  closeAllMenus();
};

const changeNodeType = () => {
  pickerMode.value = 'change';
  pickerTargetNode.value = contextMenu.value.node;
  pickerSearch.value = '';
  showNodePicker.value = true;
  closeAllMenus();
};

// Copy: snapshot the right-clicked node into clipboard
const copyNode = () => {
  const node = contextMenu.value.node;
  if (node) {
    clipboard.value = {
      label: node.label,
      type: node.type,
      options: JSON.parse(JSON.stringify(node.options ?? {})),
    };
  }
  closeAllMenus();
};

// Paste: place the clipboard node at the given position
const pasteNode = async (useMousePos = false) => {
  if (!clipboard.value || !connector) {
    closeAllMenus();
    return;
  }

  let x, y;
  if (useMousePos) {
    // Ctrl+V — paste at current mouse cursor position (library API)
    const pos = connector.clientToCanvas(mouseClientPos.x, mouseClientPos.y);
    x = pos.x;
    y = pos.y;
  } else {
    // Called from canvas context menu – paste at right-click position
    x = canvasMenu.value.canvasX;
    y = canvasMenu.value.canvasY;
  }

  closeAllMenus();

  const id = `node_${Date.now()}`;
  const src = clipboard.value;
  const newNode = {
    id,
    label: src.label,
    type: src.type,
    x,
    y,
    options: {
      ...JSON.parse(JSON.stringify(src.options)),
      info: { ...src.options?.info, id },
    },
  };

  nodes.value.push(newNode);
  await nextTick();

  const el = nodeRefs.get(id);
  if (el && connector) {
    connector.registerNode(id, el, { ...newNode.options, label: newNode.label });
  }
};

const duplicateNode = async () => {
  const sourceNode = contextMenu.value.node;
  if (!sourceNode || !connector) {
    closeAllMenus();
    return;
  }
  closeAllMenus();

  const id = `node_${Date.now()}`;
  const newNode = {
    id,
    label: sourceNode.label,
    x: sourceNode.x + 40,
    y: sourceNode.y + 40,
    type: sourceNode.type,
    options: {
      ...sourceNode.options,
      info: { ...sourceNode.options?.info, id },
    },
  };
  nodes.value.push(newNode);
  await nextTick();
  const el = nodeRefs.get(id);
  if (el && connector) {
    connector.registerNode(id, el, { ...newNode.options, label: newNode.label });
  }
};

const deleteContextNode = () => {
  const node = contextMenu.value.node;
  closeAllMenus();
  if (node && connector) {
    connector.deleteNode(node.id);
  }
};

// ── Replace Node ────────────────────────────────────────────────

const replaceNode = async (preset) => {
  const targetNode = pickerTargetNode.value;
  showNodePicker.value = false;

  if (!targetNode || !connector) return;

  // 1. Save all connections before deleting the node
  const savedConns = connector.getNodeConnections(targetNode.id);

  // 2. Delete the old node (triggers onNodeDelete → removes from nodes.value)
  connector.deleteNode(targetNode.id);

  // 3. Build replacement node at same position, reusing the same ID
  const replacedNode = {
    id: targetNode.id,
    label: preset.label,
    type: preset.type,
    x: targetNode.x,
    y: targetNode.y,
    options: {
      dotPositions: preset.dotPositions,
      style: preset.style,
      info: { id: targetNode.id, name: preset.label, desc: preset.desc },
    },
  };

  nodes.value.push(replacedNode);
  await nextTick();

  const el = nodeRefs.get(targetNode.id);
  if (!el || !connector) return;

  connector.registerNode(targetNode.id, el, { ...replacedNode.options, label: replacedNode.label });

  // 4. Restore saved connections (silent — no onConnect callback)
  for (const conn of savedConns) {
    connector.createConnection(conn.from, conn.to, conn.fromDot, conn.toDot, { silent: true });
  }
};

// ── Add Node After ──────────────────────────────────────────────

const addNodeAfter = async (preset) => {
  const sourceNode = contextMenu.value.node;
  showNodePicker.value = false;

  if (!sourceNode || !connector) return;

  const id = `node_${Date.now()}`;
  const newNode = {
    id,
    label: preset.label,
    x: sourceNode.x + 220,
    y: sourceNode.y,
    type: preset.type,
    options: {
      dotPositions: preset.dotPositions,
      style: preset.style,
      info: { id, name: preset.label, desc: preset.desc },
    },
  };

  nodes.value.push(newNode);
  await nextTick();

  const el = nodeRefs.get(id);
  if (el && connector) {
    connector.registerNode(id, el, { ...newNode.options, label: newNode.label });
    connector.createConnection(sourceNode.id, id);
  }
};

// ── Connector Setup ─────────────────────────────────────────────

onMounted(() => {
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

    // ── 库内置的右键事件 ────────────────────────────────────────
    onNodeContextMenu: ({ id, clientX, clientY }) => {
      const node = nodes.value.find((n) => n.id === id);
      canvasMenu.value.visible = false;
      contextMenu.value = { visible: true, x: clientX, y: clientY, node };
    },
    onCanvasContextMenu: ({ clientX, clientY, canvasX, canvasY }) => {
      contextMenu.value.visible = false;
      canvasMenu.value = { visible: true, x: clientX, y: clientY, canvasX, canvasY };
    },
  });

  wrapperRef.value = containerRef.value.querySelector('.connector-content-wrapper');

  nextTick(() => {
    nodes.value.forEach((node) => {
      const el = nodeRefs.get(node.id);
      if (el) connector.registerNode(node.id, el, { ...node.options, label: node.label });
    });
    connector.createConnection('start', 'end');
  });

  // Track mouse position on the canvas for Ctrl+V paste
  const onMouseMove = (e) => {
    mouseClientPos.x = e.clientX;
    mouseClientPos.y = e.clientY;
  };
  containerRef.value.addEventListener('mousemove', onMouseMove);
  onBeforeUnmount(() => containerRef.value?.removeEventListener('mousemove', onMouseMove));

  const onKeyDown = (e) => {
    const ctrlOrMeta = e.ctrlKey || e.metaKey;

    if (e.key === 'Escape') {
      closeAllMenus();
      showNodePicker.value = false;
      return;
    }

    // Ctrl+C — copy the currently selected node (via connector API)
    if (ctrlOrMeta && e.key === 'c') {
      const selected = connector?.getSelectedNode();
      if (selected) {
        const vuNode = nodes.value.find((n) => n.id === selected.id);
        if (vuNode) {
          clipboard.value = {
            label: vuNode.label,
            type: vuNode.type,
            options: JSON.parse(JSON.stringify(vuNode.options ?? {})),
          };
        }
      }
      return;
    }

    // Ctrl+V — paste from clipboard
    if (ctrlOrMeta && e.key === 'v') {
      e.preventDefault();
      pasteNode(true);
      return;
    }
  };
  window.addEventListener('keydown', onKeyDown);
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeyDown));
});

onBeforeUnmount(() => {
  if (connector) connector.destroy();
});
</script>

<style scoped>
.page-wrapper {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.container {
  position: relative;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%);
  background-image: radial-gradient(circle, #cbd5e1 1px, transparent 1px);
  background-size: 28px 28px;
}

/* ── Nodes ─────────────────────── */
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
  border: 1.5px solid transparent;
  font-weight: 500;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
}

.node:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.13);
}

.node-primary {
  background: linear-gradient(145deg, #fff 0%, #f0f7ff 100%);
  border-color: #bfdbfe;
  color: #1e40af;
}
.node-primary::before {
  content: '🔷';
  font-size: 14px;
}

.node-success {
  background: linear-gradient(145deg, #fff 0%, #f0fdf4 100%);
  border-color: #bbf7d0;
  color: #166534;
}
.node-success::before {
  content: '🟢';
  font-size: 14px;
}

.node-warning {
  background: linear-gradient(145deg, #fff 0%, #fff7ed 100%);
  border-color: #fed7aa;
  color: #9a3412;
}
.node-warning::before {
  content: '🔶';
  font-size: 14px;
}
</style>

<!-- Context menu & modal are teleported to body, so use global styles -->
<style>
/* ── Context Menu ──────────────────────────────── */
.context-menu {
  position: fixed;
  z-index: 9999;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow:
    0 8px 30px rgba(0, 0, 0, 0.14),
    0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 4px;
  min-width: 220px;
  animation: ctxFadeIn 0.12s ease;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

@keyframes ctxFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-4px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.context-menu-section {
  padding: 2px;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13.5px;
  color: #111827;
  transition: background 0.12s;
  user-select: none;
}

.context-menu-item:hover {
  background: #f3f4f6;
}

.context-menu-item.danger {
  color: #dc2626;
}

.context-menu-item.danger:hover {
  background: #fef2f2;
}

.context-menu-item.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.menu-item-copied-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #22c55e;
  flex-shrink: 0;
}

.canvas-menu-hint {
  padding: 4px 12px 8px;
  font-size: 11.5px;
  color: #9ca3af;
  font-style: italic;
}

.menu-item-icon {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: 0.7;
}

.menu-item-icon svg {
  width: 15px;
  height: 15px;
}

.menu-item-label {
  flex: 1;
  font-weight: 500;
}

.menu-item-shortcut {
  font-size: 11px;
  color: #9ca3af;
  background: #f3f4f6;
  padding: 2px 7px;
  border-radius: 4px;
  letter-spacing: 0.03em;
}

.context-menu-divider {
  height: 1px;
  background: #f3f4f6;
  margin: 3px 4px;
}

.context-menu-about {
  padding: 8px 12px 6px;
}

.about-title {
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 4px;
}

.about-name {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
}

.about-desc {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
  line-height: 1.5;
}

.about-author {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 4px;
}

/* ── Node Picker Modal ─────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(2px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: overlayIn 0.15s ease;
}

@keyframes overlayIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.2);
  width: 600px;
  max-width: 95vw;
  max-height: 82vh;
  display: flex;
  flex-direction: column;
  animation: modalIn 0.18s ease;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 22px 16px;
  border-bottom: 1px solid #f1f5f9;
}

.modal-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 9px;
}

.modal-title-icon {
  width: 20px;
  height: 20px;
  color: #5b5ef4;
}

.modal-close {
  width: 30px;
  height: 30px;
  border: none;
  background: #f1f5f9;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  padding: 0;
  color: #64748b;
}

.modal-close:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.modal-close svg {
  width: 13px;
  height: 13px;
}

.modal-search {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 22px 4px;
  padding: 9px 13px;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
}

.search-icon {
  width: 15px;
  height: 15px;
  color: #94a3b8;
  flex-shrink: 0;
}

.search-input {
  border: none;
  background: transparent;
  font-size: 13.5px;
  color: #1e293b;
  flex: 1;
  outline: none;
}

.search-input::placeholder {
  color: #94a3b8;
}

.modal-body {
  overflow-y: auto;
  padding: 12px 22px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.group-label {
  font-size: 11.5px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin-bottom: 8px;
}

.node-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.node-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.14s ease;
  background: #fff;
}

.node-card:hover {
  border-color: #5b5ef4;
  background: #f5f5fe;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(91, 94, 244, 0.12);
}

.node-card-icon {
  font-size: 22px;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-node-primary {
  background: #eff6ff;
}
.icon-node-success {
  background: #f0fdf4;
}
.icon-node-warning {
  background: #fff7ed;
}

.node-card-info {
  flex: 1;
  min-width: 0;
}

.node-card-name {
  font-size: 13.5px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 2px;
}

.node-card-desc {
  font-size: 11.5px;
  color: #64748b;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-search {
  text-align: center;
  padding: 32px;
  color: #94a3b8;
  font-size: 14px;
}
</style>
