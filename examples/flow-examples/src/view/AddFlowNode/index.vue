<!--name: AddFlowNode 添加流程节点 -->
<!--description: 添加流程节点 -->
<!--author: Tem-man -->
<!--version: 1.0.0 -->
<template>
  <div class="page-wrapper">
    <!-- Toolbar is isolated from the container -->
    <div class="toolbar">
      <div class="toolbar-item" @click="toggleDropdown">
        Add Node
        <div v-if="showDropdown" class="dropdown-menu">
          <div 
            v-for="preset in presetNodes" 
            :key="preset.type" 
            class="dropdown-item"
            @click.stop="addNode(preset)"
          >
            {{ preset.label }}
          </div>
        </div>
      </div>
      <div class="toolbar-item" @click="saveData">
        Save
      </div>
    </div>
    <div
      class="container"
      ref="containerRef"
    >
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
  import { ref, onMounted, onBeforeUnmount, nextTick } from "vue";
  import Connector from "power-link";

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

  // Initial nodes state
  const nodes = ref([
    { 
        id: 'start', 
        label: 'Start', 
        x: 100, 
        y: 250,
        options: {
            dotPositions: ["right"],
            style: 'node-success',
            info: {
                id: "start",
                name: "Start",
                desc: "This is a Start Node"
            }
        }
    },
    { 
        id: 'end', 
        label: 'End', 
        x: 300, 
        y: 250,
        options: {
            dotPositions: ["left"],
            style: 'node-success',
            info: {
                id: "end",
                name: "End",
                desc: "This is a End Node"
            }
        }
    }
  ]);

  const showDropdown = ref(false);
  
  // Preset nodes configuration
  //add node LLM
  //add node Knowledge
  //add node Search
  //add node Database
  //add node Output
  //add node Input
  const presetNodes = [
    { type: 'task', label: 'Task Node', dotPositions: "both", style: 'node-primary', info: { name: 'Task', desc: 'A task node' } },
    { type: 'event', label: 'Event Node', dotPositions: "both", style: 'node-success', info: { name: 'Event', desc: 'An event node' } },
    { type: 'gateway', label: 'Gateway Node', dotPositions: "both", style: 'node-warning', info: { name: 'Gateway', desc: 'A gateway node' } },
    { type: 'llm', label: 'LLM', dotPositions: "both", style: 'node-primary', info: { name: 'LLM', desc: 'A LLM node' } },
    { type: 'knowledge', label: 'Knowledge', dotPositions: "both", style: 'node-primary', info: { name: 'Knowledge', desc: 'A knowledge node' } },
    { type: 'search', label: 'Search', dotPositions: "both", style: 'node-primary', info: { name: 'Search', desc: 'A search node' } },
    { type: 'database', label: 'Database', dotPositions: "both", style: 'node-primary', info: { name: 'Database', desc: 'A database node' } },
    { type: 'output', label: 'Output', dotPositions: "left", style: 'node-success', info: { name: 'Output', desc: 'A output node' } },
    { type: 'input', label: 'Input', dotPositions: "right", style: 'node-success', info: { name: 'Input', desc: 'A input node' } },
    // 循环 分支
    { type: 'loop', label: 'Loop', dotPositions: "both", style: 'node-warning', info: { name: 'Loop', desc: 'A loop node' } },
    { type: 'branch', label: 'Branch', dotPositions: "both", style: 'node-warning', info: { name: 'Branch', desc: 'A branch node' } },
    { type: 'condition', label: 'Condition', dotPositions: "both", style: 'node-warning', info: { name: 'Condition', desc: 'A condition node' } },
    { type: 'action', label: 'Action', dotPositions: "both", style: 'node-primary', info: { name: 'Action', desc: 'A action node' } },
    { type: 'decision', label: 'Decision', dotPositions: "both", style: 'node-warning', info: { name: 'Decision', desc: 'A decision node' } },
  ];

  let connector = null;

  const toggleDropdown = () => {
    showDropdown.value = !showDropdown.value;
  };

  const addNode = async (preset) => {
    const id = `node_${Date.now()}`;
    // Calculate position for new node (staggered)
    const offset = (nodes.value.length * 20) % 200;
    const newNode = {
      id,
      label: preset.label,
      x: 100 + offset, 
      y: 100 + offset,
      type: preset.type,
      options: {
        dotPositions: preset.dotPositions,
        style: preset.style,
        info: {
          id,
          name: preset.info.name,
          desc: preset.info.desc
        }
      }
    };
    
    nodes.value.push(newNode);
    showDropdown.value = false;

    // Wait for DOM update so ref is available
    await nextTick();

    const el = nodeRefs.get(id);
    if (el && connector) {
      connector.registerNode(id, el, newNode.options);
    }
  };

  const saveData = () => {
    if (!connector) return;

    // export() 内部已维护节点坐标，无需手动从 DOM 反查
    const data = connector.export();
    // 保留业务自定义字段（label / type / options 等）
    data.nodes = data.nodes.map(exportNode => {
      const origin = nodes.value.find(n => n.id === exportNode.id);
      return { ...exportNode, label: origin?.label, type: origin?.type, options: origin?.options };
    });

    localStorage.setItem('flowData', JSON.stringify(data));
    console.log('Data saved to localStorage', data);
    alert('Topology saved!');
  };

  const loadData = async () => {
    const dataStr = localStorage.getItem('flowData');
    if (dataStr) {
      try {
        const data = JSON.parse(dataStr);
        if (data.nodes && Array.isArray(data.nodes)) {
          // 1. 用保存的节点列表更新 Vue 响应式状态（触发框架渲染）
          nodes.value = data.nodes;

          // 2. 等待 DOM 就绪
          await nextTick();

          // 3. import()：框架模式 —— 按 id 找元素，注册节点并还原连接
          await connector.import(data);
        }
      } catch (e) {
        console.error('Failed to load data', e);
      }
    } else {
      // 无存储数据，注册初始默认节点
      nodes.value.forEach(node => {
        const el = nodeRefs.get(node.id);
        if (el) connector.registerNode(node.id, el, node.options);
      });
    }
  };

  onMounted(() => {
    connector = new Connector({
      container: containerRef.value,
      onConnect: (connection) => {
        console.log("Connection created:", connection);
      },
      onDisconnect: (connection) => {
        console.log("Connection removed:", connection);
      },
      onNodeMove: ({ id, x, y }) => {
        // 同步拖拽后的位置回 Vue 响应式状态，防止重新渲染时节点跳回原位
        const node = nodes.value.find(n => n.id === id);
        if (node) {
          node.x = x;
          node.y = y;
        }
      },
      onNodeSelect: (info) => {
        if (info) {
          console.log('Node selected:', info.id);
        } else {
          console.log('Node deselected');
        }
      },
      onNodeDelete: ({ id }) => {
        // 从 Vue 响应式数组中移除节点，触发 DOM 卸载
        nodes.value = nodes.value.filter(n => n.id !== id);
        console.log('Node deleted:', id);
      }
    });

    wrapperRef.value = containerRef.value.querySelector('.connector-content-wrapper');

    loadData();
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

  /* Toolbar styling - isolated overlay */
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
    color: #4a4a4a;
    user-select: none;
    border-radius: 6px;
    transition: all 0.2s ease;
  }
  
  .toolbar-item:hover {
    background-color: #f5f7fa;
    color: #155bd4;
  }

  .toolbar-item:active {
    background-color: #e6ebf5;
  }

  /* Add icon placeholder */
  .toolbar-item::before {
    margin-right: 6px;
    font-size: 16px;
  }
  
  /* Specific icons for items (using unicode for simplicity) */
  .toolbar-item:first-child::before {
    content: "➕";
  }
  
  .toolbar-item:last-child::before {
    content: "💾";
  }

  .dropdown-menu {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    background: white;
    border: 1px solid #eaeaea;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    min-width: 160px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 4px;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .dropdown-item {
    padding: 10px 12px;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;
    border-radius: 6px;
    color: #333;
    font-size: 14px;
    display: flex;
    align-items: center;
  }

  .dropdown-item::before {
    content: "◉";
    margin-right: 8px;
    font-size: 14px;
    opacity: 0.7;
  }

  .dropdown-item:hover {
    background-color: #eff6ff;
    color: #155bd4;
  }

  .container {
    position: relative;
    height: calc(100vh - 24px);
    background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%);
    border: 1px solid #ddd; /* Visual boundary */
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
    /* transition: all 0.2s ease; */
    border: 1px solid transparent;
    font-weight: 500;
    color: #333;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .node:hover {
    /* transform: translateY(-2px); */
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
  }

  /* Style 1: Primary (Blue) - For Tasks/Actions */
  .node-primary {
    background: linear-gradient(145deg, #ffffff 0%, #f0f7ff 100%);
    border-color: #bfdbfe;
    color: #1e40af;
  }
  .node-primary::before {
    content: "🔷";
    font-size: 14px;
  }

  /* Style 2: Success (Green) - For Events/Start/End */
  .node-success {
    background: linear-gradient(145deg, #ffffff 0%, #f0fdf4 100%);
    border-color: #bbf7d0;
    color: #166534;
  }
  .node-success::before {
    content: "🟢";
    font-size: 14px;
  }

  /* Style 3: Warning (Orange) - For Gateways/Conditions */
  .node-warning {
    background: linear-gradient(145deg, #ffffff 0%, #fff7ed 100%);
    border-color: #fed7aa;
    color: #9a3412;
  }
  .node-warning::before {
    content: "🔶";
    font-size: 14px;
  }
</style>
