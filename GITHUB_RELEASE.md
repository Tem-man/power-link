# Release v2.0.0

## 🎉 Major Features

### ✨ Node Selection & Deletion
- **Node Selection**: Click on a node to select it (with visual highlight), click on canvas to deselect
- **Node Deletion**: Press `Delete` or `Backspace` key to delete the selected node
- **Callbacks**: New `onNodeSelect` and `onNodeDelete` callbacks for handling selection and deletion events

### 💾 Topology Export & Import
- **`export()` Method**: Export the entire topology (nodes, connections, and view state) as a JSON object
- **`import()` Method**: Restore topology from exported JSON data
  - **Framework Mode**: Works seamlessly with Vue/React - library finds elements by `id` attribute
  - **Native JS Mode**: Factory function support for creating DOM elements programmatically
- **View State Persistence**: Automatically saves and restores zoom level and pan position

### 🔄 Node Position Synchronization
- **`onNodeMove` Callback**: New callback to synchronize node positions after dragging
- Fixes the bug where nodes would jump back to original position after dragging

## 🐛 Bug Fixes

### Connection Line Rendering
- Fixed issue where connection lines were obscured when dragging nodes upward
- Solution: Increased `contentWrapper` and SVG dimensions to prevent clipping

### Dot Positions Configuration
- Fixed bug where `dotPositions: "left"` or `"right"` (string format) was not properly recognized
- Now supports all formats: `'both'`, `'left'`, `'right'`, `['left']`, `['right']`, `['left', 'right']`

### Connection Line Length
- Fixed issue where connections appeared extremely long when using `right` CSS positioning
- Recommendation: Use `left` positioning instead of `right` for better compatibility

## 🎨 UI Improvements

### Delete Button Enhancement
- **SVG Rendering**: Delete button now uses pure SVG rendering instead of HTML/CSS
- **Better Centering**: Improved × symbol centering within the red circle
- **Visual Polish**: Optimized spacing between × symbol and circle border

## 📚 Documentation Updates

- Added comprehensive documentation for `export()` and `import()` methods
- Updated `dotPositions` usage guide with all supported formats
- Added examples for both framework mode and native JS mode
- Enhanced API documentation with detailed parameter descriptions

## 🔧 API Changes

### New Methods
- `connector.export()` - Export topology as JSON
- `connector.import(data, nodeFactory?)` - Restore topology from JSON
- `connector.selectNode(id)` - Programmatically select a node
- `connector.deselectNode()` - Deselect current node
- `connector.getSelectedNode()` - Get currently selected node
- `connector.deleteNode(id)` - Programmatically delete a node

### New Callbacks
- `onNodeMove({ id, x, y })` - Called when a node is dragged
- `onNodeSelect(info)` - Called when a node is selected/deselected
- `onNodeDelete({ id })` - Called when a node is deleted

### New Configuration
- `selectedBorderColor` - Color for selected node border (default: `'#155BD4'`)

## 📦 Type Definitions

### New Types
- `ExportData` - Topology export data structure
- `ExportNodeData` - Node data in export format
- `ExportConnectionData` - Connection data in export format
- `NodeFactory` - Factory function type for native JS mode
- `NodeMoveInfo` - Node move callback data
- `NodeSelectInfo` - Node selection callback data
- `NodeDeleteInfo` - Node deletion callback data

### Updated Types
- `RegisterNodeOptions.dotPositions` - Now supports `'both' | DotPosition | DotPosition[]`

## 🚀 Migration Guide

### For Existing Users

1. **Node Position Synchronization**: If you're experiencing nodes jumping back after dragging, add the `onNodeMove` callback:
   ```javascript
   const connector = new Connector({
     container: container,
     onNodeMove: ({ id, x, y }) => {
       // Update your node position in your state management
       updateNodePosition(id, x, y);
     }
   });
   ```

2. **Dot Positions**: If you're using string format for `dotPositions`, ensure you're using `'left'` or `'right'` (now fully supported).

3. **CSS Positioning**: If using `right` positioning, consider switching to `left` for better compatibility with the new `contentWrapper` structure.

## 📝 Full Changelog

### Added
- Node selection functionality with visual feedback
- Node deletion via keyboard shortcut
- Topology export/import functionality
- View state persistence (zoom & pan)
- SVG-based delete button rendering
- `onNodeMove`, `onNodeSelect`, `onNodeDelete` callbacks
- Programmatic node selection/deletion APIs

### Fixed
- Node position reset bug after dragging
- Connection lines obscured by nodes
- `dotPositions` string format not recognized
- Extremely long connection lines with `right` positioning
- Delete button × symbol centering

### Changed
- Delete button implementation (HTML → SVG)
- `contentWrapper` dimensions increased to prevent clipping
- Type definitions for `dotPositions` expanded

### Documentation
- Added export/import usage examples
- Updated API documentation
- Enhanced type definitions documentation

---

**Breaking Changes:** None - This is a backward-compatible release with new features.

**Contributors:** Thanks to all contributors who helped make this release possible!