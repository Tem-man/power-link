# power-link

[![npm version](https://img.shields.io/npm/v/power-link.svg)](https://www.npmjs.com/package/power-link)
[![license](https://img.shields.io/npm/l/power-link.svg)](https://github.com/Tem-man/power-link/blob/main)

A pure JavaScript visual node connector for creating draggable connections between nodes. Framework-agnostic and easy to use.

![Node Link Connector Demo](https://github.com/Tem-man/power-link/blob/main/public/images/screen-shot.png)

### 📹 Demo Video

<video width="100%" controls>
  <source src="https://github.com/Tem-man/power-link/blob/main/public/images/video.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

**Watch the demo video** to see power-link in action! [Download video](https://github.com/Tem-man/node-link-utils/raw/main/packages/images/video.mp4)

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

### Methods

#### `registerNode(id, element, options)`

Register a node for connection.

**Parameters:**

- `id` (String): Unique identifier for the node
- `element` (HTMLElement): DOM element of the node
- `options` (Object): Node configuration
  - `dotPositions` (String | Array): Connection dot positions
    - `'both'`: Both left and right dots
    - `['left', 'right']`: Array format, both sides
    - `['left']`: Only left dot
    - `['right']`: Only right dot
  - `info` (Object): Node extraneous information

**Returns:** Node object

**Example:**

```javascript
connector.registerNode("myNode", element, {
  dotPositions: ["right"],
  info: {
    id: "123",
    name: "apple",
    desc: "this is a red apple"
  }
});
```

#### `createConnection(fromNode, toNode, fromDot, toDot，options)`

Programmatically create a connection between nodes.

**Parameters:**

- `fromNode` (Object): Source node object
- `toNode` (Object): Target node object
- `fromDot` (Object): Source connection dot (optional)
- `toDot` (Object): Target connection dot (optional)
- `options` (Object): Configuration options (optional)
  - `silent` (boolean): Whether to create silently (without triggering callbacks)

**Returns:** Connection object

**Example:**

```javascript
const node1 = connector.nodes[0];
const node2 = connector.nodes[1];
connector.createConnection(node1, node2); // Create connection with callbacks
connector.createConnection(node1, node2, null, null, { silent: true }); // Create connection silently without triggering callbacks
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

#### `setViewState(scale,translateX,translateY)`

Set the initial view state

**Parameters:**

- `scale` (Number): set initial view scale
- `translateX` (Number): set initial view x-axis translation
- `translateY` (Number): set initial view y-axis translation

**Example:**

````javascript
 connector.setViewState({
      scale: 0.8,
      translateX: 50,
      translateY: 30
    })
```


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
const node1 = connector.nodes[0];
const node2 = connector.nodes[1];
connector.createConnection(node1, node2, null, null, { silent: true });

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
  const fromNode = connector.nodes.find((n) => n.id === conn.from);
  const toNode = connector.nodes.find((n) => n.id === conn.to);
  const fromDot = fromNode?.dots[conn.fromDot];
  const toDot = toNode?.dots[conn.toDot];

  if (fromNode && toNode && fromDot && toDot) {
    connector.createConnection(fromNode, toNode, fromDot, toDot, { silent: true });
  }
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
  }
});
```

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

Made with ❤️ by the power-link team
