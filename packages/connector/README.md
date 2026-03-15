# power-link

[![npm version](https://img.shields.io/npm/v/power-link.svg)](https://www.npmjs.com/package/power-link)
[![license](https://img.shields.io/npm/l/power-link.svg)](https://github.com/Tem-man/power-link/blob/main)

A pure TypeScript visual node connector for creating draggable connections between nodes. Framework-agnostic and easy to use.

![Node Link Connector Demo](https://github.com/Tem-man/power-link/blob/main/public/images/screen-shot.png)

### online demo
visit [online demo](https://tem-man.github.io/power-link)

## ✨ Features

- 🎯 **Visual Node Connections** - Create beautiful bezier curve connections between nodes
- 🖱️ **Drag & Drop** - Intuitive drag-and-drop connection creation
- 🔄 **Node Dragging** - Move nodes around with automatic connection updates
- 🧲 **Smart Snapping** - Automatic connection point detection and snapping
- 🎨 **Customizable** - Fully configurable colors, sizes, and behaviors
- 🚫 **Delete Connections** - Hover over connections to show delete button
- 📦 **Zero Dependencies** - Pure JavaScript, no framework required
- 🎭 **Multiple Connection Points** - Support for left and right connection dots
- 🔌 **Event Callbacks** - Listen to connection and disconnection events

## 📦 Installation

```bash
npm install power-link
```

Or using yarn:

```bash
yarn add power-link
```

Or using pnpm:

```bash
pnpm add power-link
```

## 🚀 Quick Start

### Basic Usage

```javascript
import Connector from "power-link";

// 1. Get container element
const container = document.getElementById("connector-container");

// 2. Create connector instance
const connector = new Connector({
  container: container,

  // Optional configuration
  lineColor: "#155BD4",
  lineWidth: 2,
  dotSize: 12,
  dotColor: "#155BD4",

  // Event callbacks
  onConnect: (connection) => {
    console.log("Connection created:", connection);
    // connection: { from: 'node1', to: 'node2', fromDot: 'right', toDot: 'left' }
  },

  onDisconnect: (connection) => {
    console.log("Connection removed:", connection);
  },

  onViewChange: (viewState) => {
    console.log("View changed:", viewState);
    // viewState: { scale: 1, translateX: 0, translateY: 0 }
    // Save view state to restore later
  },

  onNodeMove: ({ id, x, y }) => {
    console.log("Node moved:", id, "to", x, y);
    // Synchronize node position with your state management
    // This prevents nodes from jumping back after dragging
  }
});

// 3. Register nodes
const node1 = document.getElementById("node1");
const node2 = document.getElementById("node2");

connector.registerNode("node1", node1, {
  dotPositions: ["right"] // Only right connection dot
});

connector.registerNode("node2", node2, {
  dotPositions: ["left", "right"] // Both left and right dots
});
```

### HTML Structure

```html
<div
  id="connector-container"
  style="position: relative; height: 600px;"
>
  <div
    id="node1"
    style="position: absolute; left: 100px; top: 100px;"
  >
    Node 1
  </div>
  <div
    id="node2"
    style="position: absolute; left: 400px; top: 100px;"
  >
    Node 2
  </div>
</div>
```

## 📖 API Documentation

### Constructor Options

| Option             | Type        | Default      | Description                                     |
| ------------------ | ----------- | ------------ | ----------------------------------------------- |
| `container`        | HTMLElement | **Required** | Container element for the connector             |
| `lineColor`        | String      | `'#155BD4'`  | Color of connection lines                       |
| `lineWidth`        | Number      | `2`          | Width of connection lines                       |
| `dotSize`          | Number      | `12`         | Size of connection dots                         |
| `dotColor`         | String      | `'#155BD4'`  | Color of connection dots                        |
| `dotHoverScale`    | Number      | `1.8`        | Scale factor when hovering over connection dots |
| `deleteButtonSize` | Number      | `20`         | Size of delete button                           |
| `enableNodeDrag`   | Boolean     | `true`       | Enable node dragging                            |
| `enableSnap`       | Boolean     | `true`       | Enable connection snapping                      |
| `snapDistance`     | Number      | `20`         | Snap distance in pixels                         |
| `enableZoom`       | Boolean     | `true`       | Enable zoom functionality                       |
| `enablePan`        | Boolean     | `true`       | Enable pan functionality                        |
| `minZoom`          | Number      | `0.1`        | Minimum zoom level (10%)                        |
| `maxZoom`          | Number      | `4`          | Maximum zoom level (400%)                       |
| `zoomStep`         | Number      | `0.1`        | Zoom step size (10%)                            |
| `onConnect`        | Function    | `() => {}`   | Callback when connection is created             |
| `onDisconnect`     | Function    | `() => {}`   | Callback when connection is removed             |
| `onViewChange`     | Function    | `() => {}`   | Callback when view state changes (zoom/pan)    |
| `onNodeMove`       | Function    | `() => {}`   | Callback when a node is dragged (receives `{ id, x, y }`) |
| `onNodeSelect`     | Function    | `() => {}`   | Callback when a node is selected/deselected (receives node info or `null`) |
| `onNodeDelete`     | Function    | `() => {}`   | Callback when a node is deleted (receives `{ id, info }`) |

### Methods

#### `registerNode(id, element, options)`

Register a node for connection.

**Parameters:**

- `id` (String): Unique identifier for the node
- `element` (HTMLElement): DOM element of the node
- `options` (Object): Node configuration
  - `label` (String): Node name/label (optional)
  - `dotPositions` (String | Array): Connection dot positions
    - `'both'`: Both left and right dots
    - `'left'`: Only left dot (string format)
    - `'right'`: Only right dot (string format)
    - `['left', 'right']`: Array format, both sides
    - `['left']`: Only left dot (array format)
    - `['right']`: Only right dot (array format)
  - `info` (Object): Node extraneous information

**Returns:** Node object

**Example:**

```javascript
connector.registerNode("myNode", element, {
  label: "My Node",
  dotPositions: ["right"],
  info: {
    id: "123",
    name: "apple",
    desc: "this is a red apple"
  }
});
```

#### `createConnection(fromNodeId, toNodeId, fromDot, toDot, options)`

Programmatically create a connection between nodes.

**Parameters:**

- `fromNodeId` (String): Source node ID
- `toNodeId` (String): Target node ID
- `fromDot` (String): Source connection dot position - `'left'` or `'right'` (optional)
- `toDot` (String): Target connection dot position - `'left'` or `'right'` (optional)
- `options` (Object): Configuration options (optional)
  - `silent` (boolean): Whether to create silently (without triggering callbacks)

**Returns:** Connection object or undefined

**Example:**

```javascript
// Create connection with callbacks
connector.createConnection("node1", "node2");

// Create connection with specific dot positions
connector.createConnection("node1", "node2", "right", "left");

// Create connection silently without triggering callbacks
connector.createConnection("node1", "node2", "right", "left", { silent: true });
```

#### `disconnect(connectionId，options)`

Remove a connection.

**Parameters:**

- `connectionId` (String): Connection ID (optional, if not provided, removes all connections)
- `options` (Object): Configuration options (optional)
  - `silent` (boolean): Whether to disconnect silently (without triggering callbacks)

**Example:**

```javascript
connector.disconnect(); // Remove all connections
connector.disconnect("connection-id"); // Remove specific connection
connector.disconnect("connection-id", { silent: true }); // Remove connection silently without triggering callbacks
```

#### `getConnections()`

Get all connections.

**Returns:** Array of connection information

**Example:**

```javascript
const connections = connector.getConnections();
// [{ id: '...', from: 'node1', to: 'node2', fromDot: 'right', toDot: 'left' }]
```

#### `getNodeConnections(nodeId)`

Get all connections for a specific node.

**Parameters:**

- `nodeId` (String): Node ID

**Returns:** Array of connection information

#### `updateNodePosition(nodeId)`

Update node position (called when node is moved).

**Parameters:**

- `nodeId` (String): Node ID

#### `deleteNode(id)`

Delete a node and all its connections. This method removes the node from the connector, disconnects all associated connections, and triggers the `onNodeDelete` callback.

**Note:** This method does not remove the DOM element itself. You should handle DOM removal in your framework (e.g., Vue/React) within the `onNodeDelete` callback.

**Parameters:**

- `id` (String): Node ID to delete

**Example:**

```javascript
// Delete a specific node
connector.deleteNode('node1');

// In your connector setup, handle the deletion callback
const connector = new Connector({
  container: container,
  onNodeDelete: ({ id, info }) => {
    console.log('Node deleted:', id);
    // Remove node from your state management
    // In Vue: nodes.value = nodes.value.filter(n => n.id !== id);
    // In React: setNodes(nodes.filter(n => n.id !== id));
  }
});
```

#### `destroy(options)`

Destroy the connector and clean up all resources.

**Parameters:**

- `options` (Object): Configuration options (optional)
  - `silent` (boolean): Whether to destroy silently (without triggering callbacks)

**Example:**

```javascript
connector.destroy(); // Destroy silently by default (without triggering callbacks)
connector.destroy({ silent: false }); // Destroy non-silently (triggering callbacks)
```

#### `setViewState(state)`

Set the view state (for initialization or restoring view).

**Parameters:**

- `state` (Object): View state object
  - `scale` (Number): View scale (optional)
  - `translateX` (Number): X-axis translation (optional)
  - `translateY` (Number): Y-axis translation (optional)

**Example:**

```javascript
connector.setViewState({
  scale: 0.8,
  translateX: 50,
  translateY: 30
});
```

#### `getViewState()`

Get the current view state.

**Returns:** ViewState object with `scale`, `translateX`, and `translateY` properties

**Example:**

```javascript
const viewState = connector.getViewState();
console.log(viewState); // { scale: 1, translateX: 0, translateY: 0 }
```

#### `setZoom(scale)`

Set the zoom level (centered on canvas).

**Parameters:**

- `scale` (Number): Zoom scale (will be clamped to minZoom and maxZoom)

**Example:**

```javascript
connector.setZoom(1.5); // Zoom to 150%
```

#### `getZoom()`

Get the current zoom level.

**Returns:** Number - Current zoom scale

**Example:**

```javascript
const currentZoom = connector.getZoom();
console.log(currentZoom); // 1.0
```

#### `zoomIn()`

Zoom in by one step.

**Example:**

```javascript
connector.zoomIn(); // Increase zoom by zoomStep
```

#### `zoomOut()`

Zoom out by one step.

**Example:**

```javascript
connector.zoomOut(); // Decrease zoom by zoomStep
```

#### `resetView()`

Reset the view to default state (scale: 1, translateX: 0, translateY: 0).

**Example:**

```javascript
connector.resetView(); // Reset to default view
```

#### `updateAllConnections()`

Update all connection line positions (useful when container size changes or after manual node position updates).

**Example:**

```javascript
connector.updateAllConnections(); // Refresh all connection lines
```

#### `export()`

Export the current topology (nodes, connections, and view state) as a JSON object.

**Returns:** ExportData object containing:
- `nodes`: Array of node data (id, label, x, y, info, dotPositions)
- `connections`: Array of connection data (from, fromLabel, fromInfo, to, toLabel, toInfo, fromDot, toDot)
- `viewState`: Current view state (scale, translateX, translateY)

**Example:**

```javascript
const data = connector.export();
console.log(data);
// {
//   nodes: [
//     { id: 'node1', label: 'Node 1', x: 100, y: 100, info: {...}, dotPositions: ['right'] },
//     { id: 'node2', label: 'Node 2', x: 400, y: 100, info: {...}, dotPositions: ['left'] }
//   ],
//   connections: [
//     { 
//       from: 'node1', 
//       fromLabel: 'Node 1', 
//       fromInfo: {...}, 
//       to: 'node2', 
//       toLabel: 'Node 2', 
//       toInfo: {...}, 
//       fromDot: 'right', 
//       toDot: 'left' 
//     }
//   ],
//   viewState: { scale: 1, translateX: 0, translateY: 0 }
// }

// Save to localStorage
localStorage.setItem('topology', JSON.stringify(data));

// Or send to server
await fetch('/api/topology', {
  method: 'POST',
  body: JSON.stringify(data)
});
```

#### `import(data, nodeFactory?)`

Restore topology from exported data. Supports two modes:

**Parameters:**

- `data` (ExportData): Topology data returned by `export()`
- `nodeFactory` (Function, optional): Factory function for creating DOM elements (native JS mode only)

**Two Usage Modes:**

1. **Framework Mode (Vue/React/etc.) - No nodeFactory**
   - Framework handles DOM rendering
   - Library finds elements by `id` attribute
   - Use when nodes are managed by framework reactivity

2. **Native JS Mode - With nodeFactory**
   - Library calls factory to create DOM elements
   - Library handles positioning and mounting
   - Use for pure JavaScript applications

**Returns:** Promise<void>

**Example (Framework Mode - Vue):**

```javascript
// Save
const data = connector.export();
localStorage.setItem('topology', JSON.stringify(data));

// Load
const savedData = JSON.parse(localStorage.getItem('topology'));
// 1. Update framework reactive state (triggers DOM rendering)
nodes.value = savedData.nodes;
// 2. Wait for DOM to be ready
await nextTick();
// 3. Import (library finds elements by id and restores connections)
await connector.import(savedData);
```

**Example (Native JS Mode):**

```javascript
// Save
const data = connector.export();
localStorage.setItem('topology', JSON.stringify(data));

// Load
const savedData = JSON.parse(localStorage.getItem('topology'));
await connector.import(savedData, (nodeData) => {
  // Factory function: create and return DOM element
  const el = document.createElement('div');
  el.id = nodeData.id;
  el.className = 'node';
  el.textContent = nodeData.info?.name || nodeData.id;
  el.style.position = 'absolute';
  // Library will set left/top automatically
  return el;
});
```

**Note:** Connections are restored silently (without triggering `onConnect` callbacks) to avoid duplicate events during data restoration.


## 🎨 Usage Examples

### Vue 3

```vue
<template>
  <div
    class="container"
    ref="containerRef"
  >
    <div
      class="node"
      ref="node1Ref"
    >
      Node 1
    </div>
    <div
      class="node"
      ref="node2Ref"
    >
      Node 2
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted, onBeforeUnmount } from "vue";
  import Connector from "power-link";

  const containerRef = ref(null);
  const node1Ref = ref(null);
  const node2Ref = ref(null);

  let connector = null;

  onMounted(() => {
    connector = new Connector({
      container: containerRef.value,
      onConnect: (connection) => {
        console.log("Connection created:", connection);
      },
      onDisconnect: (connection) => {
        console.log("Connection removed:", connection);
      }
    });

    connector.registerNode("node1", node1Ref.value, {
      dotPositions: ["right"],
      info: {
        id: "123",
        name: "apple",
        desc: "this is a red apple"
      }
    });

    connector.registerNode("node2", node2Ref.value, {
      dotPositions: ["left"],
      info: {
        id: "456",
        name: "pear",
        desc: "this is a yellow pear"
      }
    });
  });

  onBeforeUnmount(() => {
    if (connector) {
      connector.destroy();
    }
  });
</script>

<style scoped>
  .container {
    position: relative;
    height: 600px;
    background: #f5f5f5;
  }

  .node {
    position: absolute;
    padding: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    cursor: move;
  }
</style>
````

### React

```jsx
import { useEffect, useRef } from "react";
import Connector from "power-link";

function App() {
  const containerRef = useRef(null);
  const node1Ref = useRef(null);
  const node2Ref = useRef(null);
  const connectorRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    connectorRef.current = new Connector({
      container: containerRef.current,
      onConnect: (connection) => {
        console.log("Connection created:", connection);
      },
      onDisconnect: (connection) => {
        console.log("Connection removed:", connection);
      }
    });

    connectorRef.current.registerNode("node1", node1Ref.current, {
      dotPositions: ["right"],
      info: {
        id: "123",
        name: "apple",
        desc: "this is a red apple"
      }
    });

    connectorRef.current.registerNode("node2", node2Ref.current, {
      dotPositions: ["left"],
      info: {
        id: "456",
        name: "pear",
        desc: "this is a yellow pear"
      }
    });

    return () => {
      if (connectorRef.current) {
        connectorRef.current.destroy();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", height: "600px" }}
    >
      <div
        ref={node1Ref}
        style={{ position: "absolute", left: "100px", top: "100px" }}
      >
        Node 1
      </div>
      <div
        ref={node2Ref}
        style={{ position: "absolute", left: "400px", top: "100px" }}
      >
        Node 2
      </div>
    </div>
  );
}
```

### Vanilla JavaScript

```html
<!DOCTYPE html>
<html>
  <head>
    <style>
      #container {
        position: relative;
        height: 600px;
        background: #f5f5f5;
      }
      .node {
        position: absolute;
        padding: 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        cursor: move;
      }
    </style>
  </head>
  <body>
    <div id="container">
      <div
        id="node1"
        class="node"
        style="left: 100px; top: 100px;"
      >
        Node 1
      </div>
      <div
        id="node2"
        class="node"
        style="left: 400px; top: 100px;"
      >
        Node 2
      </div>
    </div>

    <script type="module">
      import Connector from "power-link";

      const connector = new Connector({
        container: document.getElementById("container"),
        onConnect: (connection) => {
          console.log("Connection created:", connection);
        }
      });

      connector.registerNode("node1", document.getElementById("node1"), {
        dotPositions: ["right"],
        info: {
          id: "123",
          name: "apple",
          desc: "this is a red apple"
        }
      });

      connector.registerNode("node2", document.getElementById("node2"), {
        dotPositions: ["left"],
        info: {
          id: "456",
          name: "pear",
          desc: "this is a yellow pear"
        }
      });
    </script>
  </body>
</html>
```

## 🎯 Advanced Features

### Multiple Connection Points

```javascript
// Node with both left and right connection points
connector.registerNode("centerNode", element, {
  dotPositions: ["left", "right"]
});

// Node with only left connection point
connector.registerNode("endNode", element, {
  dotPositions: ["left"],
  info: {
    id: "456",
    name: "pear",
    desc: "this is a yellow pear"
  }
});

// Node with only right connection point
connector.registerNode("startNode", element, {
  dotPositions: ["right"]
});
```

### Silent Operations (No Callbacks)

Sometimes you may want to perform operations without triggering callbacks, such as when initializing connections from saved data or bulk operations.

```javascript
// Silent connection creation (won't trigger onConnect callback)
connector.createConnection("node1", "node2", "right", "left", { silent: true });

// Silent disconnection (won't trigger onDisconnect callback)
connector.disconnect("connection-id", { silent: true });

// Silent destroy (won't trigger callbacks, default behavior)
connector.destroy(); // Default is silent
connector.destroy({ silent: false }); // Non-silent destroy (triggers callbacks)

// Example: Restore connections from saved data without triggering callbacks
const savedConnections = [
  { from: "node1", to: "node2", fromDot: "right", toDot: "left" },
  { from: "node2", to: "node3", fromDot: "right", toDot: "left" }
];

savedConnections.forEach((conn) => {
  connector.createConnection(
    conn.from,
    conn.to,
    conn.fromDot,
    conn.toDot,
    { silent: true }
  );
});
```

### Node Info and Connection Data

You can attach custom information to nodes using the `info` parameter, which will be available in connection callbacks.

```javascript
// Register node with custom info
const items = [
  { id: "node1", name: "Apple", desc: "This is a red apple", type: "fruit" },
  { id: "node2", name: "Pear", desc: "This is a yellow pear", type: "fruit" }
];

items.forEach((item) => {
  const nodeElement = document.getElementById(item.id);
  connector.registerNode(item.id, nodeElement, {
    dotPositions: ["left"],
    info: item // Attach custom info to the node
  });
});

// Access node info in connection callbacks
const connector = new Connector({
  container: container,
  onConnect: async (connection) => {
    console.log("Connection created:", connection);
    console.log("From node info:", connection.fromInfo);
    // { id: "node1", name: "Apple", desc: "This is a red apple", type: "fruit" }
    console.log("To node info:", connection.toInfo);
    // { id: "node2", name: "Pear", desc: "This is a yellow pear", type: "fruit" }

    // You can use the info for saving to database, validation, etc.
    await saveConnection({
      from: connection.from,
      to: connection.to,
      fromInfo: connection.fromInfo,
      toInfo: connection.toInfo
    });
  },

  onDisconnect: (connection) => {
    console.log("Connection removed:", connection);
    console.log("From node info:", connection.fromInfo);
    console.log("To node info:", connection.toInfo);
  }
});
```

### Custom Styling

```javascript
const connector = new Connector({
  container: container,
  lineColor: "#FF6B6B", // Red connections
  lineWidth: 3, // Thicker lines
  dotSize: 16, // Larger dots
  dotColor: "#4ECDC4", // Teal dots
  deleteButtonSize: 24 // Larger delete button
});
```

### Event Handling

```javascript
const connector = new Connector({
  container: container,

  onConnect: (connection) => {
    console.log("New connection:", connection);
    // { from: 'node1', to: 'node2', fromDot: 'right', toDot: 'left' }

    // Save to database, update state, etc.
    saveConnection(connection);
  },

  onDisconnect: (connection) => {
    console.log("Connection removed:", connection);

    // Update database, state, etc.
    removeConnection(connection);
  },

  onViewChange: (viewState) => {
    console.log("View changed:", viewState);
    // { scale: 1, translateX: 0, translateY: 0 }

    // Save view state to restore later
    saveViewState(viewState);
  },

  onNodeMove: ({ id, x, y }) => {
    console.log("Node moved:", id, "to", x, y);
    // Synchronize node position with your state management
    // This prevents nodes from jumping back to original position after dragging
    // In Vue: const node = nodes.value.find(n => n.id === id); if (node) { node.x = x; node.y = y; }
    // In React: setNodes(nodes.map(n => n.id === id ? { ...n, x, y } : n));
  },

  onNodeSelect: (info) => {
    if (info) {
      console.log("Node selected:", info.id, info.info);
    } else {
      console.log("Node deselected");
    }
  },

  onNodeDelete: ({ id, info }) => {
    console.log("Node deleted:", id);
    // Remove node from your state management
    // In Vue: nodes.value = nodes.value.filter(n => n.id !== id);
    // In React: setNodes(nodes.filter(n => n.id !== id));
  }
});
```

### Node Management

#### Node Position Synchronization

When using frameworks like Vue or React, you need to synchronize node positions after dragging to prevent nodes from jumping back to their original position. Use the `onNodeMove` callback:

**Vue Example:**

```javascript
const connector = new Connector({
  container: containerRef.value,
  onNodeMove: ({ id, x, y }) => {
    // Update Vue reactive state
    const node = nodes.value.find(n => n.id === id);
    if (node) {
      node.x = x;
      node.y = y;
    }
  }
});
```

**React Example:**

```javascript
const connector = new Connector({
  container: containerRef.current,
  onNodeMove: ({ id, x, y }) => {
    // Update React state
    setNodes(prevNodes => 
      prevNodes.map(n => n.id === id ? { ...n, x, y } : n)
    );
  }
});
```

### View Management

```javascript
// Get current view state
const viewState = connector.getViewState();
console.log(viewState); // { scale: 1, translateX: 0, translateY: 0 }

// Set view state (restore saved view)
connector.setViewState({
  scale: 0.8,
  translateX: 100,
  translateY: 50
});

// Zoom controls
connector.setZoom(1.5); // Set zoom to 150%
connector.zoomIn(); // Zoom in by one step
connector.zoomOut(); // Zoom out by one step
const currentZoom = connector.getZoom(); // Get current zoom

// Reset view
connector.resetView(); // Reset to default (scale: 1, translateX: 0, translateY: 0)

// Update all connections (useful after manual node position changes)
connector.updateAllConnections();
```

### Save and Restore Topology

The `export()` and `import()` methods allow you to save and restore the entire topology (nodes, connections, and view state).

**Save Topology:**

```javascript
// Export current topology
const data = connector.export();

// Save to localStorage
localStorage.setItem('topology', JSON.stringify(data));

// Or save to server
await fetch('/api/topology', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

**Restore Topology (Framework Mode - Vue Example):**

```vue
<script setup>
import { ref, onMounted, nextTick } from 'vue';
import Connector from 'power-link';

const containerRef = ref(null);
const nodes = ref([]);
let connector = null;

const saveTopology = () => {
  const data = connector.export();
  // label is now included in export() by default
  // Merge other custom fields (type, etc.) if needed
  data.nodes = data.nodes.map(exportNode => {
    const origin = nodes.value.find(n => n.id === exportNode.id);
    return { ...exportNode, type: origin?.type };
  });
  localStorage.setItem('topology', JSON.stringify(data));
};

const loadTopology = async () => {
  const saved = localStorage.getItem('topology');
  if (saved) {
    const data = JSON.parse(saved);
    // 1. Update reactive state (triggers framework rendering)
    nodes.value = data.nodes;
    // 2. Wait for DOM to be ready
    await nextTick();
    // 3. Import (library finds elements by id and restores connections + view state)
    await connector.import(data);
  }
};

onMounted(() => {
  connector = new Connector({ container: containerRef.value });
  loadTopology();
});
</script>
```

**Restore Topology (Native JS Mode):**

```javascript
const loadTopology = async () => {
  const saved = localStorage.getItem('topology');
  if (saved) {
    const data = JSON.parse(saved);
    // Import with factory function
    await connector.import(data, (nodeData) => {
      const el = document.createElement('div');
      el.id = nodeData.id;
      el.className = 'node';
      el.textContent = nodeData.info?.name || nodeData.id;
      // Library will set position automatically
      return el;
    });
  }
};
```

**What's Included in Export:**

- **Nodes**: ID, label (node name), position (x, y), custom info, dot positions
- **Connections**: from, fromLabel, fromInfo, to, toLabel, toInfo, fromDot, toDot
- **View State**: Current zoom level and pan position (scale, translateX, translateY)

**Benefits:**

- ✅ Save/load entire graph state
- ✅ Restore view position and zoom level
- ✅ Preserve all node positions and connections
- ✅ Works with any storage backend (localStorage, database, etc.)

## 🔧 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📝 License

MIT License

## 🌟 Show Your Support

Give a ⭐️ on [GitHub](https://github.com/Tem-man/power-link) if this project helped you!

## 🤝 Contributing

If you have any questions or need help, please open an issue on GitHub.

---

