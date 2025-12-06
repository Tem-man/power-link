# Release Notes

## 🎉 New Features

### 1. Silent Operations Support

We've added support for silent operations that allow you to perform connection operations without triggering callbacks. This is particularly useful when initializing connections from saved data or performing bulk operations.

#### What's New

- **Silent Connection Creation**: Create connections without triggering `onConnect` callbacks
- **Silent Disconnection**: Remove connections without triggering `onDisconnect` callbacks
- **Silent Destroy**: Destroy connector without triggering callbacks (default behavior)

#### Usage

```javascript
// Silent connection creation
connector.createConnection(node1, node2, null, null, { silent: true });

// Silent disconnection
connector.disconnect("connection-id", { silent: true });

// Silent destroy (default behavior)
connector.destroy(); // Default is silent
connector.destroy({ silent: false }); // Non-silent destroy

// Example: Restore connections from saved data
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

#### API Changes

- `createConnection(fromNode, toNode, fromDot, toDot, options)` - Added `options.silent` parameter
- `disconnect(connectionId, options)` - Added `options.silent` parameter
- `destroy(options)` - Added `options.silent` parameter (default: `true`)

---

### 2. Node Info and Connection Data

You can now attach custom information to nodes and access it in connection callbacks. This enables better data management and integration with your application's data layer.

#### What's New

- **Node Info**: Attach custom data to nodes during registration
- **Connection Info Access**: Access node information via `fromInfo` and `toInfo` in connection callbacks

#### Usage

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

    // Use the info for saving to database, validation, etc.
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

#### API Changes

- `registerNode(id, element, options)` - `options.info` parameter available (was already supported, now documented)
- `onConnect(connection)` - Connection object now includes `fromInfo` and `toInfo` properties
- `onDisconnect(connection)` - Connection object now includes `fromInfo` and `toInfo` properties

---

## 📝 Migration Guide

### For Silent Operations

If you're currently using `createConnection`, `disconnect`, or `destroy` methods, they will continue to work as before. The new `options` parameter is optional and defaults to the previous behavior:

- `createConnection()` - Still triggers callbacks (backward compatible)
- `disconnect()` - Still triggers callbacks (backward compatible)
- `destroy()` - Now defaults to silent mode (no callbacks), use `{ silent: false }` to trigger callbacks

### For Node Info

If you were already using the `info` parameter in `registerNode`, no changes are needed. The connection callbacks now automatically include `fromInfo` and `toInfo` properties when nodes have info attached.

---

## 🔧 Improvements

- Better control over callback execution during bulk operations
- Enhanced connection data with node information
- Improved developer experience with more flexible API

---

## 📚 Documentation

Full documentation is available in the [README.md](./README.md) file, including:

- Complete API reference
- Usage examples for Vue, React, and Vanilla JavaScript
- Advanced features guide

---

## 🙏 Thanks

Thank you for using power-link! If you encounter any issues or have suggestions, please open an issue on GitHub.
