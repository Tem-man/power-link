# Release v1.0.1

## 🎉 Major Refactoring: TypeScript Migration

We're excited to announce that **power-link** has been completely refactored from JavaScript to **TypeScript**! This brings better type safety, improved developer experience, and enhanced IDE support.

## ✨ What's New

### TypeScript Support
- Full TypeScript rewrite with comprehensive type definitions
- Built-in type checking and IntelliSense support
- Better error detection during development
- Type definitions included in the package (`dist/index.d.ts`)

### Enhanced Build System
- Modern build setup using `tsup`
- Multiple output formats: CommonJS, ES Module, and IIFE
- Source maps included for better debugging experience

## ⚠️ Breaking Changes

### `createConnection` API Change

The `createConnection` method now accepts **node IDs (strings)** instead of node objects.

**Before (v1.0.0):**
```javascript
const node1 = connector.nodes[0];
const node2 = connector.nodes[1];
connector.createConnection(node1, node2, fromDot, toDot);
```

**After (v1.0.1):**
```javascript
// Use node IDs instead
connector.createConnection("node1", "node2");
connector.createConnection("node1", "node2", "right", "left");
connector.createConnection("node1", "node2", "right", "left", { silent: true });
```

**Migration Guide:**
- Replace node objects with their corresponding node ID strings
- The method signature is now: `createConnection(fromNodeId, toNodeId, fromDotPosition?, toDotPosition?, options?)`
- All parameters remain optional except for the two node IDs

## 📦 Package Structure

The package now includes:
- `dist/index.js` - CommonJS build
- `dist/index.mjs` - ES Module build
- `dist/index.d.ts` - TypeScript type definitions
- `dist/index.global.js` - IIFE build for browser usage

## 🔧 Technical Improvements

- **Type Safety**: Full TypeScript coverage with strict type checking
- **Better DX**: Enhanced IDE autocomplete and type hints
- **Modern Tooling**: Updated build pipeline with tsup
- **Code Quality**: Improved code organization and maintainability

## 📚 Documentation

- Updated README with TypeScript examples
- Complete API documentation with type information
- Migration guide for existing users

## 🚀 Installation

```bash
npm install power-link@1.0.1
# or
yarn add power-link@1.0.1
# or
pnpm add power-link@1.0.1
```

## 📝 Full Changelog

- [Full Changelog](https://github.com/Tem-man/power-link/compare/v1.0.0...v1.0.1)

---

**Note**: If you're upgrading from v1.0.0, please update your `createConnection` calls to use node IDs instead of node objects. The migration is straightforward and should only require minimal code changes.

