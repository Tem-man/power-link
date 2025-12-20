# Release v0.0.9

## 🎨 New Feature: Customizable Connection Dot Hover Scale

We've added a new configuration option `dotHoverScale` that allows you to customize the scale factor when hovering over connection dots. This gives you more control over the visual feedback and helps match your design requirements.

### What's New

- **`dotHoverScale` Configuration**: Control the size increase of connection dots when hovering over them
- **Default Value**: `1.8` (180% scale on hover)
- **Backward Compatible**: Existing code will continue to work with the default hover effect

### Usage

```javascript
// Use default hover scale (1.8)
const connector = new Connector({
  container: document.getElementById("container"),
  dotSize: 12,
  dotColor: "#155BD4"
  // dotHoverScale defaults to 1.8
});

// Custom larger hover effect
const connector = new Connector({
  container: document.getElementById("container"),
  dotHoverScale: 2.0, // Scale dots to 200% when hovering
  dotSize: 12,
  dotColor: "#155BD4"
});

// Smaller hover effect
const connector = new Connector({
  container: document.getElementById("container"),
  dotHoverScale: 1.5 // Scale dots to 150% when hovering
});

// Disable hover scale effect
const connector = new Connector({
  container: document.getElementById("container"),
  dotHoverScale: 1.0 // No scale change on hover
});
```

### API Changes

- Added `dotHoverScale` option to `Connector` constructor (default: `1.8`)

### Migration

No migration needed! This is a backward-compatible addition. If you don't specify `dotHoverScale`, it will default to `1.8`, maintaining the same behavior as before.

---

**Full Changelog**: https://github.com/Tem-man/node-link-utils/compare/v0.0.8...v0.0.9
