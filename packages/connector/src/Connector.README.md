# Connector 连线器类

一个纯 JavaScript 实现的可视化连线器，用于在两个节点之间创建可拖拽的连线。不依赖任何框架，可以在任何 JavaScript 项目中使用。

## 特性

- ✅ 支持两个节点之间的连线
- ✅ 拖拽式连线操作
- ✅ 鼠标悬浮显示删除按钮
- ✅ 贝塞尔曲线连线效果
- ✅ 事件监听（连接建立、连接断开）
- ✅ 完全不依赖框架
- ✅ 可自定义样式配置

## 安装

```javascript
import Connector from '@/utils/Connector.js'
```

## 基本使用

```javascript
// 1. 获取容器元素
const container = document.getElementById('connector-container')

// 2. 创建连线器实例
const connector = new Connector({
  container: container,

  // 可选配置
  lineColor: '#155BD4',
  lineWidth: 2,
  dotSize: 12,
  dotColor: '#155BD4',
  deleteButtonSize: 24,

  // 监听连接建立
  onConnect: (connection) => {
    console.log('连接已建立:', connection)
    // connection: { from: 'node1', to: 'node2' }
  },

  // 监听连接断开
  onDisconnect: (connection) => {
    console.log('连接已断开:', connection)
    // connection: { from: 'node1', to: 'node2' }
  }
})

// 3. 注册节点
const node1 = document.getElementById('node1')
const node2 = document.getElementById('node2')

connector.registerNode('node1', node1)
connector.registerNode('node2', node2)
```

## API 文档

### 构造函数

```javascript
new Connector(options)
```

#### Options 参数

| 参数             | 类型        | 默认值    | 说明                 |
| ---------------- | ----------- | --------- | -------------------- |
| container        | HTMLElement | 必填      | 连线器的容器元素     |
| lineColor        | String      | '#155BD4' | 连线颜色             |
| lineWidth        | Number      | 2         | 连线宽度             |
| dotSize          | Number      | 12        | 连接点大小           |
| dotColor         | String      | '#155BD4' | 连接点颜色           |
| deleteButtonSize | Number      | 20        | 删除按钮大小         |
| onConnect        | Function    | () => {}  | 连接建立时的回调函数 |
| onDisconnect     | Function    | () => {}  | 连接断开时的回调函数 |

### 方法

#### registerNode(id, element)

注册一个节点。

**参数：**

- `id` (String): 节点的唯一标识
- `element` (HTMLElement): 节点的 DOM 元素

**返回值：** 节点对象

**示例：**

```javascript
connector.registerNode('llm', document.getElementById('llm-node'))
```

#### createConnection(fromNode, toNode)

编程方式建立连接。

**参数：**

- `fromNode` (Object): 起始节点对象
- `toNode` (Object): 目标节点对象

**示例：**

```javascript
const node1 = connector.nodes[0]
const node2 = connector.nodes[1]
connector.createConnection(node1, node2)
```

#### disconnect()

断开当前连接。

**示例：**

```javascript
connector.disconnect()
```

#### updateNodePosition(nodeId)

更新节点位置（当节点移动时调用）。

**参数：**

- `nodeId` (String): 节点 ID

**示例：**

```javascript
connector.updateNodePosition('node1')
```

#### destroy()

销毁连线器，清理所有资源。

**示例：**

```javascript
connector.destroy()
```

## 在 Vue 中使用

```vue
<template>
  <div class="container" ref="containerRef">
    <div class="node" ref="node1Ref">节点 1</div>
    <div class="node" ref="node2Ref">节点 2</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import Connector from '@/utils/Connector.js'

const containerRef = ref(null)
const node1Ref = ref(null)
const node2Ref = ref(null)

let connector = null

onMounted(() => {
  connector = new Connector({
    container: containerRef.value,
    onConnect: (connection) => {
      console.log('连接已建立:', connection)
    },
    onDisconnect: (connection) => {
      console.log('连接已断开:', connection)
    }
  })

  connector.registerNode('node1', node1Ref.value)
  connector.registerNode('node2', node2Ref.value)
})

onBeforeUnmount(() => {
  if (connector) {
    connector.destroy()
  }
})
</script>

<style scoped>
.container {
  position: relative;
  width: 100%;
  height: 400px;
}

.node {
  position: absolute;
  width: 120px;
  height: 80px;
  background: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
```

## 在 React 中使用

```jsx
import { useEffect, useRef } from 'react'
import Connector from '@/utils/Connector.js'

function ConnectorExample() {
  const containerRef = useRef(null)
  const node1Ref = useRef(null)
  const node2Ref = useRef(null)
  const connectorRef = useRef(null)

  useEffect(() => {
    connectorRef.current = new Connector({
      container: containerRef.current,
      onConnect: (connection) => {
        console.log('连接已建立:', connection)
      },
      onDisconnect: (connection) => {
        console.log('连接已断开:', connection)
      }
    })

    connectorRef.current.registerNode('node1', node1Ref.current)
    connectorRef.current.registerNode('node2', node2Ref.current)

    return () => {
      if (connectorRef.current) {
        connectorRef.current.destroy()
      }
    }
  }, [])

  return (
    <div ref={containerRef} style={{ position: 'relative', height: '400px' }}>
      <div ref={node1Ref} className="node">
        节点 1
      </div>
      <div ref={node2Ref} className="node">
        节点 2
      </div>
    </div>
  )
}
```

## 注意事项

1. **容器定位**：容器元素必须有定位属性（relative、absolute 或 fixed），如果没有，连线器会自动设置为 relative。

2. **节点数量限制**：当前版本只支持两个节点之间的连接。

3. **节点移动**：如果节点位置会动态改变，需要手动调用 `updateNodePosition()` 方法更新连线位置。

4. **清理资源**：在组件卸载时，务必调用 `destroy()` 方法清理资源，避免内存泄漏。

5. **样式冲突**：连线器使用绝对定位和 SVG，确保不会与现有样式冲突。

## 浏览器兼容性

- Chrome/Edge: ✅
- Firefox: ✅
- Safari: ✅
- IE11: ❌（不支持）

## License

MIT
