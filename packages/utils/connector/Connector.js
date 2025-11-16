/**
 * 连线器类 - 用于在两个节点之间创建可视化连线
 * 不依赖任何框架，纯 JavaScript 实现
 */
class Connector {
  constructor(options = {}) {
    this.container = options.container // 容器元素
    this.nodes = [] // 存储节点信息
    this.connections = [] // 存储所有连接信息（支持多条连接）
    this.isDragging = false // 是否正在拖拽连线
    this.isDraggingNode = false // 是否正在拖拽节点
    this.tempLine = null // 临时连线元素
    this.draggedNode = null // 当前拖拽的节点
    this.dragOffset = { x: 0, y: 0 } // 拖拽偏移量

    // 回调函数
    this.onConnect = options.onConnect || (() => {})
    this.onDisconnect = options.onDisconnect || (() => {})

    // 样式配置
    this.config = {
      lineColor: options.lineColor || '#155BD4',
      lineWidth: options.lineWidth || 2,
      dotSize: options.dotSize || 12,
      dotColor: options.dotColor || '#155BD4',
      deleteButtonSize: options.deleteButtonSize || 20,
      enableNodeDrag: options.enableNodeDrag !== false, // 默认启用节点拖拽
      snapDistance: options.snapDistance || 20, // 吸附距离（像素）
      enableSnap: options.enableSnap !== false, // 默认启用吸附
      ...options.config
    }

    // 吸附状态
    this.snapTarget = null // 当前吸附的目标节点
    this.isSnapped = false // 是否处于吸附状态

    this.init()
  }

  /**
   * 初始化
   */
  init() {
    if (!this.container) {
      throw new Error('Container element is required')
    }

    // 确保容器是相对定位
    const position = window.getComputedStyle(this.container).position
    if (position === 'static') {
      this.container.style.position = 'relative'
    }

    // 创建 SVG 画布
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    this.svg.style.position = 'absolute'
    this.svg.style.top = '0'
    this.svg.style.left = '0'
    this.svg.style.width = '100%'
    this.svg.style.height = '100%'
    this.svg.style.pointerEvents = 'none'
    this.svg.style.zIndex = '1'
    this.container.appendChild(this.svg)
  }

  /**
   * 注册节点
   * @param {string} id - 节点唯一标识
   * @param {HTMLElement} element - 节点 DOM 元素
   * @param {Object} options - 节点配置选项
   *   - dotPositions: string | string[] - 触点位置配置
   *     - 'both': 左右都有触点
   *     - ['left', 'right']: 数组形式，左右都有
   *     - ['left']: 只有左侧触点
   *     - ['right']: 只有右侧触点
   */
  registerNode(id, element, options = {}) {
    // 检查是否已存在
    if (this.nodes.find((n) => n.id === id)) {
      console.warn(`节点 ${id} 已存在`)
      return
    }

    // 处理触点位置配置
    let dotPositions = []

    if (options.dotPositions === 'both') {
      // 'both' 表示左右都有
      dotPositions = ['left', 'right']
    } else if (Array.isArray(options.dotPositions)) {
      // 数组形式：['left', 'right'] 或 ['left'] 或 ['right']
      dotPositions = options.dotPositions.filter((pos) => pos === 'left' || pos === 'right')
    } else {
      // 默认：第一个节点右侧，其他节点左侧
      dotPositions = [this.nodes.length === 0 ? 'right' : 'left']
    }

    // 限制最多两个触点，且只能是 left 和 right（去重）
    dotPositions = [...new Set(dotPositions)].slice(0, 2)

    // 创建所有连接点
    const dots = {}
    dotPositions.forEach((position) => {
      const dot = this.createDot(position)
      element.appendChild(dot)
      dots[position] = {
        element: dot,
        position: position
      }
    })

    const node = {
      id,
      element,
      dots, // { left: {...}, right: {...} }
      dotPositions, // ['left', 'right'] 或 ['left'] 或 ['right']
      connections: [] // 存储该节点的所有连接
    }

    this.nodes.push(node)

    // 为每个连接点绑定事件
    Object.values(dots).forEach((dot) => {
      this.bindDotEvents(node, dot)
    })

    // 绑定节点拖拽事件
    if (this.config.enableNodeDrag) {
      this.bindNodeDragEvents(node)
    }

    return node
  }

  /**
   * 创建连接点
   * @param {string} dotPosition - 触点位置 'left' 或 'right'
   */
  createDot(dotPosition) {
    const dot = document.createElement('div')
    dot.className = 'connector-dot'

    // 根据位置设置触点
    const position =
      dotPosition === 'right'
        ? `right: -${this.config.dotSize / 2}px;`
        : `left: -${this.config.dotSize / 2}px;`

    dot.style.cssText = `
      position: absolute;
      width: ${this.config.dotSize}px;
      height: ${this.config.dotSize}px;
      background-color: ${this.config.dotColor};
      border: 2px solid white;
      border-radius: 50%;
      cursor: pointer;
      ${position}
      top: 50%;
      transform: translateY(-50%);
      z-index: 10;
      transition: transform 0.2s;
    `

    // 保存基础 transform 用于悬浮效果
    dot.dataset.baseTransform = 'translateY(-50%)'

    // 悬浮效果
    dot.addEventListener('mouseenter', () => {
      dot.style.transform = 'translateY(-50%) scale(1.2)'
    })
    dot.addEventListener('mouseleave', () => {
      dot.style.transform = 'translateY(-50%) scale(1)'
    })

    return dot
  }

  /**
   * 绑定连接点事件
   * @param {Object} node - 节点对象
   * @param {Object} dot - 触点对象 {element, position}
   */
  bindDotEvents(node, dot) {
    const dotElement = dot.element

    dotElement.addEventListener('mousedown', (e) => {
      e.preventDefault()
      e.stopPropagation()

      this.isDragging = true
      this.startNode = node
      this.startDot = dot // 记录起始触点

      // 创建临时连线
      this.tempLine = this.createLine()
      this.svg.appendChild(this.tempLine)

      // 更新临时连线
      this.updateTempLine(e)

      // 绑定移动和释放事件
      document.addEventListener('mousemove', this.handleMouseMove)
      document.addEventListener('mouseup', this.handleMouseUp)
    })
  }

  /**
   * 绑定节点拖拽事件
   */
  bindNodeDragEvents(node) {
    const { element } = node

    element.addEventListener('mousedown', (e) => {
      // 如果点击的是连接点，不处理节点拖拽
      if (e.target.classList.contains('connector-dot')) {
        return
      }

      e.preventDefault()
      e.stopPropagation()

      this.isDraggingNode = true
      this.draggedNode = node

      const rect = element.getBoundingClientRect()
      const containerRect = this.container.getBoundingClientRect()

      // 计算鼠标在节点内的偏移量（相对于节点左上角）
      this.dragOffset = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }

      // 将当前位置转换为 left/top 定位，避免拖拽时跳动
      const currentLeft = rect.left - containerRect.left
      const currentTop = rect.top - containerRect.top

      element.style.left = `${currentLeft}px`
      element.style.top = `${currentTop}px`
      element.style.right = ''
      element.style.bottom = ''

      // 绑定移动和释放事件
      document.addEventListener('mousemove', this.handleNodeDragMove)
      document.addEventListener('mouseup', this.handleNodeDragEnd)
    })
  }

  /**
   * 处理节点拖拽移动
   */
  handleNodeDragMove = (e) => {
    if (!this.isDraggingNode || !this.draggedNode) return

    const containerRect = this.container.getBoundingClientRect()

    // 计算新位置：鼠标位置 - 容器偏移 - 鼠标在节点内的偏移
    const newX = e.clientX - containerRect.left - this.dragOffset.x
    const newY = e.clientY - containerRect.top - this.dragOffset.y

    // 更新节点位置
    this.draggedNode.element.style.left = `${newX}px`
    this.draggedNode.element.style.top = `${newY}px`

    // 更新所有与该节点相关的连线
    this.updateNodeConnections(this.draggedNode.id)
  }

  /**
   * 处理节点拖拽结束
   */
  handleNodeDragEnd = () => {
    this.isDraggingNode = false
    this.draggedNode = null

    document.removeEventListener('mousemove', this.handleNodeDragMove)
    document.removeEventListener('mouseup', this.handleNodeDragEnd)
  }

  /**
   * 处理鼠标移动
   */
  handleMouseMove = (e) => {
    if (!this.isDragging) return
    this.updateTempLine(e)
  }

  /**
   * 处理鼠标释放
   */
  handleMouseUp = (e) => {
    if (!this.isDragging) return

    this.isDragging = false

    // 优先使用吸附的目标节点
    let targetNode = this.isSnapped ? this.snapTarget : this.getNodeAtPosition(e.clientX, e.clientY)
    let targetDot = this.isSnapped ? this.snapTargetDot : null

    if (targetNode && targetNode.id !== this.startNode.id) {
      // 建立连接，传递具体的触点信息
      this.createConnection(this.startNode, targetNode, this.startDot, targetDot)
    }

    // 清除吸附状态
    this.clearSnapHighlight()
    this.snapTarget = null
    this.snapTargetDot = null
    this.isSnapped = false
    this.startDot = null

    // 移除临时连线
    if (this.tempLine) {
      this.svg.removeChild(this.tempLine)
      this.tempLine = null
    }

    // 移除事件监听
    document.removeEventListener('mousemove', this.handleMouseMove)
    document.removeEventListener('mouseup', this.handleMouseUp)
  }

  /**
   * 更新临时连线
   */
  updateTempLine(e) {
    if (!this.tempLine || !this.startNode || !this.startDot) return

    const startPos = this.getDotPosition(this.startNode.element, this.startDot.position)
    const containerRect = this.container.getBoundingClientRect()
    let endPos = {
      x: e.clientX - containerRect.left,
      y: e.clientY - containerRect.top
    }

    // 检查吸附
    if (this.config.enableSnap) {
      const snapResult = this.checkSnap(endPos, this.startNode)
      if (snapResult) {
        endPos = snapResult.position
        this.snapTarget = snapResult.node
        this.snapTargetDot = snapResult.dot
        this.isSnapped = true

        // 高亮吸附目标
        this.highlightSnapTarget(snapResult.node, snapResult.dot)
      } else {
        this.isSnapped = false
        this.clearSnapHighlight()
        this.snapTarget = null
        this.snapTargetDot = null
      }
    }

    this.updateLine(this.tempLine, startPos, endPos, this.startDot.position)
  }

  /**
   * 创建连接
   * @param {Object} fromNode - 起始节点
   * @param {Object} toNode - 目标节点
   * @param {Object} fromDot - 起始触点（可选）
   * @param {Object} toDot - 目标触点（可选）
   */
  createConnection(fromNode, toNode, fromDot = null, toDot = null) {
    // 自动选择触点：如果没有指定，则智能选择
    if (!fromDot && fromNode.dots) {
      // 优先选择 right，如果没有则选择 left
      fromDot = fromNode.dots.right || fromNode.dots.left || Object.values(fromNode.dots)[0]
    }
    if (!toDot && toNode.dots) {
      // 优先选择 left，如果没有则选择 right
      toDot = toNode.dots.left || toNode.dots.right || Object.values(toNode.dots)[0]
    }

    // 检查是否已存在相同的连接（同样的节点和触点）
    const existingConnection = this.connections.find(
      (conn) =>
        (conn.fromNode.id === fromNode.id &&
          conn.toNode.id === toNode.id &&
          conn.fromDot.position === fromDot.position &&
          conn.toDot.position === toDot.position) ||
        (conn.fromNode.id === toNode.id &&
          conn.toNode.id === fromNode.id &&
          conn.fromDot.position === toDot.position &&
          conn.toDot.position === fromDot.position)
    )

    if (existingConnection) {
      console.warn('该连接已存在')
      return
    }

    // 创建连接线
    const connectionLine = this.createLine()
    this.svg.appendChild(connectionLine)

    // 创建删除按钮
    const deleteButton = this.createDeleteButton()

    const connection = {
      id: `${fromNode.id}-${toNode.id}-${fromDot.position}-${toDot.position}-${Date.now()}`,
      fromNode: fromNode,
      toNode: toNode,
      fromDot: fromDot,
      toDot: toDot,
      line: connectionLine,
      deleteButton: deleteButton,
      // 保留旧的属性名以兼容
      from: fromNode,
      to: toNode
    }

    this.connections.push(connection)

    // 记录节点的连接
    fromNode.connections.push(connection)
    toNode.connections.push(connection)

    // 更新连接线位置
    this.updateConnection(connection)

    // 绑定连线事件（删除按钮等）
    this.bindConnectionEvents(connection)

    // 触发连接回调
    this.onConnect({
      from: fromNode.id,
      to: toNode.id,
      fromDot: fromDot.position,
      toDot: toDot.position
    })

    return connection
  }

  /**
   * 更新单个连接
   */
  updateConnection(connection) {
    if (!connection || !connection.line) return

    const fromPos = this.getDotPosition(connection.fromNode.element, connection.fromDot.position)
    const toPos = this.getDotPosition(connection.toNode.element, connection.toDot.position)

    this.updateLine(
      connection.line,
      fromPos,
      toPos,
      connection.fromDot.position,
      connection.toDot.position
    )

    // 同步更新悬浮路径
    if (connection.hoverPath) {
      this.updateLine(
        connection.hoverPath,
        fromPos,
        toPos,
        connection.fromDot.position,
        connection.toDot.position
      )
    }

    // 更新删除按钮位置 - 计算贝塞尔曲线上的真实中点
    if (connection.deleteButton) {
      const midPoint = this.getBezierMidPoint(
        fromPos,
        toPos,
        connection.fromDot.position,
        connection.toDot.position
      )
      connection.deleteButton.style.left = `${midPoint.x - this.config.deleteButtonSize / 2}px`
      connection.deleteButton.style.top = `${midPoint.y - this.config.deleteButtonSize / 2}px`
    }
  }

  /**
   * 更新节点的所有连接
   */
  updateNodeConnections(nodeId) {
    const connections = this.connections.filter(
      (conn) => conn.fromNode.id === nodeId || conn.toNode.id === nodeId
    )
    connections.forEach((conn) => this.updateConnection(conn))
  }

  /**
   * 更新所有连接线位置
   */
  updateAllConnections() {
    this.connections.forEach((conn) => this.updateConnection(conn))
  }

  /**
   * 创建线条
   */
  createLine() {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('stroke', this.config.lineColor)
    path.setAttribute('stroke-width', this.config.lineWidth)
    path.setAttribute('fill', 'none')
    return path
  }

  /**
   * 更新线条路径（贝塞尔曲线）
   * @param {SVGPathElement} line - SVG 路径元素
   * @param {Object} start - 起点坐标 {x, y}
   * @param {Object} end - 终点坐标 {x, y}
   * @param {string} startDotPosition - 起点触点位置 'left' 或 'right'
   * @param {string} endDotPosition - 终点触点位置 'left' 或 'right'
   */
  updateLine(line, start, end, startDotPosition = 'right', endDotPosition = 'left') {
    const dx = end.x - start.x
    const dy = end.y - start.y

    // 控制点偏移量，根据距离动态调整
    const distance = Math.sqrt(dx * dx + dy * dy)
    const controlPointOffset = Math.min(distance * 0.5, 150)

    // 根据触点位置决定控制点方向
    // 'right' 向右，'left' 向左
    const startControlX =
      startDotPosition === 'right' ? start.x + controlPointOffset : start.x - controlPointOffset

    const endControlX =
      endDotPosition === 'right' ? end.x + controlPointOffset : end.x - controlPointOffset

    // 使用三次贝塞尔曲线
    const path = `M ${start.x} ${start.y} C ${startControlX} ${start.y}, ${endControlX} ${end.y}, ${end.x} ${end.y}`
    line.setAttribute('d', path)
  }

  /**
   * 计算三次贝塞尔曲线的中点（t=0.5处的点）
   * @param {Object} start - 起点坐标 {x, y}
   * @param {Object} end - 终点坐标 {x, y}
   * @param {string} startDotPosition - 起点触点位置 'left' 或 'right'
   * @param {string} endDotPosition - 终点触点位置 'left' 或 'right'
   * @returns {Object} 中点坐标 {x, y}
   */
  getBezierMidPoint(start, end, startDotPosition = 'right', endDotPosition = 'left') {
    const dx = end.x - start.x
    const dy = end.y - start.y

    // 控制点偏移量，根据距离动态调整（与 updateLine 保持一致）
    const distance = Math.sqrt(dx * dx + dy * dy)
    const controlPointOffset = Math.min(distance * 0.5, 150)

    // 计算控制点
    const cp1x =
      startDotPosition === 'right' ? start.x + controlPointOffset : start.x - controlPointOffset
    const cp1y = start.y

    const cp2x =
      endDotPosition === 'right' ? end.x + controlPointOffset : end.x - controlPointOffset
    const cp2y = end.y

    // 三次贝塞尔曲线在 t=0.5 处的点
    // B(t) = (1-t)³P0 + 3(1-t)²tP1 + 3(1-t)t²P2 + t³P3
    // 当 t=0.5 时：
    const t = 0.5
    const t2 = t * t
    const t3 = t2 * t
    const mt = 1 - t
    const mt2 = mt * mt
    const mt3 = mt2 * mt

    const x = mt3 * start.x + 3 * mt2 * t * cp1x + 3 * mt * t2 * cp2x + t3 * end.x
    const y = mt3 * start.y + 3 * mt2 * t * cp1y + 3 * mt * t2 * cp2y + t3 * end.y

    return { x, y }
  }

  /**
   * 创建删除按钮
   */
  createDeleteButton() {
    const deleteButton = document.createElement('div')
    deleteButton.className = 'connector-delete-btn'
    deleteButton.innerHTML = '×'
    deleteButton.style.cssText = `
      position: absolute;
      width: ${this.config.deleteButtonSize}px;
      height: ${this.config.deleteButtonSize}px;
      background-color: #ff4d4f;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 16px;
      font-weight: bold;
      z-index: 100;
      opacity: 0;
      transition: opacity 0.2s, transform 0.2s;
      pointer-events: none;
    `

    this.container.appendChild(deleteButton)

    deleteButton.addEventListener('mouseenter', () => {
      deleteButton.style.transform = 'scale(1.2)'
    })

    deleteButton.addEventListener('mouseleave', () => {
      deleteButton.style.transform = 'scale(1)'
      deleteButton.style.opacity = '0'
      deleteButton.style.pointerEvents = 'none'
    })

    return deleteButton
  }

  /**
   * 绑定连线的删除按钮事件
   */
  bindConnectionEvents(connection) {
    const { line, deleteButton } = connection

    // 设置连线可交互（但保持原始宽度）
    line.style.pointerEvents = 'stroke'
    line.style.cursor = 'pointer'

    // 创建一个不可见的宽区域用于悬浮检测
    const hoverPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    hoverPath.setAttribute('stroke', 'transparent')
    hoverPath.setAttribute('stroke-width', '20')
    hoverPath.setAttribute('fill', 'none')
    hoverPath.style.pointerEvents = 'stroke'
    hoverPath.style.cursor = 'pointer'

    // 复制路径
    hoverPath.setAttribute('d', line.getAttribute('d'))
    this.svg.insertBefore(hoverPath, line)

    connection.hoverPath = hoverPath

    const showDeleteButton = () => {
      deleteButton.style.opacity = '1'
      deleteButton.style.pointerEvents = 'auto'
    }

    const hideDeleteButton = () => {
      setTimeout(() => {
        if (!deleteButton.matches(':hover')) {
          deleteButton.style.opacity = '0'
          deleteButton.style.pointerEvents = 'none'
        }
      }, 100)
    }

    hoverPath.addEventListener('mouseenter', showDeleteButton)
    hoverPath.addEventListener('mouseleave', hideDeleteButton)
    line.addEventListener('mouseenter', showDeleteButton)
    line.addEventListener('mouseleave', hideDeleteButton)

    deleteButton.addEventListener('click', () => {
      this.disconnect(connection.id)
    })
  }

  /**
   * 断开连接
   * @param {string} connectionId - 连接ID，如果不提供则断开所有连接
   */
  disconnect(connectionId) {
    if (connectionId) {
      // 断开指定连接
      const index = this.connections.findIndex((conn) => conn.id === connectionId)
      if (index === -1) return

      const connection = this.connections[index]
      const connectionInfo = {
        from: connection.fromNode.id,
        to: connection.toNode.id,
        fromDot: connection.fromDot.position,
        toDot: connection.toDot.position
      }

      // 移除连接线
      if (connection.line && connection.line.parentNode) {
        this.svg.removeChild(connection.line)
      }

      // 移除悬浮路径
      if (connection.hoverPath && connection.hoverPath.parentNode) {
        this.svg.removeChild(connection.hoverPath)
      }

      // 移除删除按钮
      if (connection.deleteButton && connection.deleteButton.parentNode) {
        this.container.removeChild(connection.deleteButton)
      }

      // 从节点的连接列表中移除
      connection.fromNode.connections = connection.fromNode.connections.filter(
        (c) => c.id !== connectionId
      )
      connection.toNode.connections = connection.toNode.connections.filter(
        (c) => c.id !== connectionId
      )

      // 从连接列表中移除
      this.connections.splice(index, 1)

      // 触发断开连接回调
      this.onDisconnect(connectionInfo)
    } else {
      // 断开所有连接
      const allConnections = [...this.connections]
      allConnections.forEach((conn) => this.disconnect(conn.id))
    }
  }

  /**
   * 获取元素中心位置
   */
  getElementCenter(element) {
    const rect = element.getBoundingClientRect()
    const containerRect = this.container.getBoundingClientRect()

    return {
      x: rect.left + rect.width / 2 - containerRect.left,
      y: rect.top + rect.height / 2 - containerRect.top
    }
  }

  /**
   * 获取连接点位置
   * @param {HTMLElement} element - 节点元素
   * @param {string} dotPosition - 触点位置 'left' 或 'right'
   */
  getDotPosition(element, dotPosition) {
    const rect = element.getBoundingClientRect()
    const containerRect = this.container.getBoundingClientRect()

    return {
      x:
        dotPosition === 'right'
          ? rect.right - containerRect.left // 右边缘
          : rect.left - containerRect.left, // 左边缘
      y: rect.top + rect.height / 2 - containerRect.top // 垂直居中
    }
  }

  /**
   * 获取指定位置的节点
   */
  getNodeAtPosition(x, y) {
    for (const node of this.nodes) {
      const rect = node.element.getBoundingClientRect()
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return node
      }
    }
    return null
  }

  /**
   * 检查吸附
   * @param {Object} position - 当前鼠标位置 {x, y}
   * @param {Object} startNode - 起始节点
   * @returns {Object|null} - 吸附结果 {node, dot, position} 或 null
   */
  checkSnap(position, startNode) {
    if (!this.config.enableSnap) return null

    let closestNode = null
    let closestDot = null
    let closestDistance = Infinity

    // 遍历所有节点，找到最近的触点
    for (const node of this.nodes) {
      // 跳过起始节点
      if (node.id === startNode.id) continue

      // 遍历该节点的所有触点
      if (node.dots) {
        Object.values(node.dots).forEach((dot) => {
          const dotPos = this.getDotPosition(node.element, dot.position)

          // 计算距离
          const dx = position.x - dotPos.x
          const dy = position.y - dotPos.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          // 如果在吸附范围内且是最近的
          if (distance < this.config.snapDistance && distance < closestDistance) {
            closestDistance = distance
            closestNode = node
            closestDot = dot
          }
        })
      }
    }

    if (closestNode && closestDot) {
      return {
        node: closestNode,
        dot: closestDot,
        position: this.getDotPosition(closestNode.element, closestDot.position)
      }
    }

    return null
  }

  /**
   * 高亮吸附目标
   * @param {Object} node - 目标节点
   * @param {Object} dot - 目标触点（可选）
   */
  highlightSnapTarget(node, dot = null) {
    if (!node || !node.element) return

    // 清除之前的高亮
    this.clearSnapHighlight()

    // 添加高亮效果
    node.element.style.boxShadow = '0 0 0 3px rgba(21, 91, 212, 0.3)'
    node.element.style.transform = 'scale(1.05)'
    node.element.dataset.snapped = 'true'

    // 高亮指定的连接点
    if (dot && dot.element) {
      const baseTransform = dot.element.dataset.baseTransform || 'translateY(-50%)'
      dot.element.style.transform = `${baseTransform} scale(1.5)`
      dot.element.style.boxShadow = '0 0 10px rgba(21, 91, 212, 0.6)'
      dot.element.dataset.highlighted = 'true'
    }
  }

  /**
   * 清除吸附高亮
   */
  clearSnapHighlight() {
    this.nodes.forEach((node) => {
      if (node.element.dataset.snapped === 'true') {
        node.element.style.boxShadow = ''
        node.element.style.transform = ''
        delete node.element.dataset.snapped

        // 清除所有触点的高亮
        if (node.dots) {
          Object.values(node.dots).forEach((dot) => {
            if (dot.element.dataset.highlighted === 'true') {
              const baseTransform = dot.element.dataset.baseTransform || 'translateY(-50%)'
              dot.element.style.transform = baseTransform
              dot.element.style.boxShadow = ''
              delete dot.element.dataset.highlighted
            }
          })
        }
      }
    })
  }

  /**
   * 更新节点位置（当节点移动时调用）
   */
  updateNodePosition(nodeId) {
    const node = this.nodes.find((n) => n.id === nodeId)
    if (node) {
      // 更新所有触点的坐标
      if (node.dots) {
        Object.values(node.dots).forEach((dot) => {
          dot.coords = this.getDotPosition(node.element, dot.position)
        })
      }
      this.updateNodeConnections(nodeId)
    }
  }

  /**
   * 销毁连线器
   */
  destroy() {
    // 断开所有连接
    this.disconnect()

    // 移除所有连接点
    this.nodes.forEach((node) => {
      if (node.dots) {
        Object.values(node.dots).forEach((dot) => {
          if (dot.element && dot.element.parentNode) {
            dot.element.parentNode.removeChild(dot.element)
          }
        })
      }
    })

    // 移除 SVG
    if (this.svg && this.svg.parentNode) {
      this.svg.parentNode.removeChild(this.svg)
    }

    // 移除事件监听
    document.removeEventListener('mousemove', this.handleMouseMove)
    document.removeEventListener('mouseup', this.handleMouseUp)
    document.removeEventListener('mousemove', this.handleNodeDragMove)
    document.removeEventListener('mouseup', this.handleNodeDragEnd)

    this.nodes = []
    this.connections = []
  }

  /**
   * 获取所有连接
   */
  getConnections() {
    return this.connections.map((conn) => ({
      id: conn.id,
      from: conn.fromNode.id,
      to: conn.toNode.id,
      fromDot: conn.fromDot.position,
      toDot: conn.toDot.position
    }))
  }

  /**
   * 获取节点的所有连接
   */
  getNodeConnections(nodeId) {
    return this.connections
      .filter((conn) => conn.fromNode.id === nodeId || conn.toNode.id === nodeId)
      .map((conn) => ({
        id: conn.id,
        from: conn.fromNode.id,
        to: conn.toNode.id,
        fromDot: conn.fromDot.position,
        toDot: conn.toDot.position
      }))
  }
}

export default Connector
