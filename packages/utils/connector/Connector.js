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
    this.onViewChange = options.onViewChange || (() => {}) // 视图变化回调

    // 样式配置
    this.config = {
      lineColor: options.lineColor || "#155BD4",
      lineWidth: options.lineWidth || 2,
      dotSize: options.dotSize || 12,
      dotColor: options.dotColor || "#155BD4",
      dotHoverScale: options.dotHoverScale || 1.8,
      deleteButtonSize: options.deleteButtonSize || 20,
      enableNodeDrag: options.enableNodeDrag !== false, // 默认启用节点拖拽
      snapDistance: options.snapDistance || 20, // 吸附距离（像素）
      enableSnap: options.enableSnap !== false, // 默认启用吸附
      enableZoom: options.enableZoom !== false, // 默认启用缩放
      enablePan: options.enablePan !== false, // 默认启用平移
      minZoom: options.minZoom || 0.1, // 最小缩放比例 10%
      maxZoom: options.maxZoom || 4, // 最大缩放比例 400%
      zoomStep: options.zoomStep || 0.1, // 缩放步长 10%
      ...options.config
    }

    // 吸附状态
    this.snapTarget = null // 当前吸附的目标节点
    this.isSnapped = false // 是否处于吸附状态

    // 视图变换状态
    this.viewState = {
      scale: 1, // 缩放比例
      translateX: 0, // X 轴平移
      translateY: 0 // Y 轴平移
    }

    // 画布拖拽状态
    this.isPanning = false // 是否正在拖拽画布
    this.panStart = { x: 0, y: 0 } // 拖拽起始位置

    // 内容包装器
    this.contentWrapper = null

    this.init()
  }

  /**
   * 初始化
   */
  init() {
    if (!this.container) {
      throw new Error("Container element is required")
    }

    // 确保容器是相对定位
    const position = window.getComputedStyle(this.container).position
    if (position === "static") {
      this.container.style.position = "relative"
    }

    // 容器设置 overflow: hidden，防止内容溢出
    this.container.style.overflow = "hidden"

    // 创建内容包装器，用于应用变换
    this.contentWrapper = document.createElement("div")
    this.contentWrapper.className = "connector-content-wrapper"
    this.contentWrapper.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      transform-origin: 0 0;
      transition: none;
    `

    // 将容器的所有子元素移到包装器中
    const children = Array.from(this.container.children)
    children.forEach((child) => {
      this.contentWrapper.appendChild(child)
    })
    this.container.appendChild(this.contentWrapper)

    // 创建 SVG 画布
    this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    this.svg.style.position = "absolute"
    this.svg.style.top = "0"
    this.svg.style.left = "0"
    this.svg.style.width = "100%"
    this.svg.style.height = "100%"
    this.svg.style.pointerEvents = "none"
    this.svg.style.zIndex = "1"
    this.contentWrapper.appendChild(this.svg)

    // 绑定视图控制事件
    if (this.config.enableZoom) {
      this.bindZoomEvents()
    }
    if (this.config.enablePan) {
      this.bindPanEvents()
    }

    // 绑定窗口大小变化事件
    this.bindResizeEvents()

    // 应用初始变换
    this.updateTransform()
  }

  /**
   * 更新变换矩阵
   */
  updateTransform() {
    if (!this.contentWrapper) return

    const { scale, translateX, translateY } = this.viewState
    this.contentWrapper.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`

    // 触发视图变化回调
    this.onViewChange({
      scale,
      translateX,
      translateY
    })
  }

  /**
   * 绑定缩放事件
   */
  bindZoomEvents() {
    this.handleWheel = (e) => {
      // 滚轮直接缩放
      e.preventDefault()

      const containerRect = this.container.getBoundingClientRect()
      const mouseX = e.clientX - containerRect.left
      const mouseY = e.clientY - containerRect.top

      // 计算缩放方向
      const delta = e.deltaY < 0 ? this.config.zoomStep : -this.config.zoomStep
      const newScale = Math.max(this.config.minZoom, Math.min(this.config.maxZoom, this.viewState.scale + delta))

      // 以鼠标位置为中心缩放
      this.zoomAtPoint(newScale, mouseX, mouseY)
    }

    // 绑定滚轮事件，使用 passive: false 允许 preventDefault
    this.container.addEventListener("wheel", this.handleWheel, { passive: false })
  }

  /**
   * 绑定平移事件
   */
  bindPanEvents() {
    // 设置默认光标
    this.container.style.cursor = "grab"

    // 鼠标按下 - 直接左键平移
    this.handlePanStart = (e) => {
      // 如果点击的是连接点或正在拖拽连线/节点，不处理画布拖拽
      if (e.target.classList.contains("connector-dot") || this.isDragging || this.isDraggingNode) {
        return
      }

      // 检查是否点击在节点上（节点拖拽优先）
      const clickedNode = this.getNodeAtPosition(e.clientX, e.clientY)
      if (clickedNode && this.config.enableNodeDrag) {
        return
      }

      e.preventDefault()
      e.stopPropagation()

      this.isPanning = true
      this.panStart = {
        x: e.clientX - this.viewState.translateX,
        y: e.clientY - this.viewState.translateY
      }
      this.container.style.cursor = "grabbing"
    }

    // 鼠标移动
    this.handlePanMove = (e) => {
      if (this.isPanning) {
        e.preventDefault()
        this.viewState.translateX = e.clientX - this.panStart.x
        this.viewState.translateY = e.clientY - this.panStart.y
        this.updateTransform()
      }
    }

    // 鼠标释放
    this.handlePanEnd = () => {
      if (this.isPanning) {
        this.stopPan()
      }
    }

    // 绑定事件
    this.container.addEventListener("mousedown", this.handlePanStart)
    document.addEventListener("mousemove", this.handlePanMove)
    document.addEventListener("mouseup", this.handlePanEnd)
  }

  /**
   * 停止平移
   */
  stopPan() {
    this.isPanning = false
    this.container.style.cursor = "grab"
  }

  /**
   * 绑定窗口大小变化事件
   */
  bindResizeEvents() {
    // 使用防抖优化性能
    let resizeTimer = null

    this.handleResize = () => {
      // 清除之前的定时器
      if (resizeTimer) {
        clearTimeout(resizeTimer)
      }

      // 延迟执行，避免频繁更新
      resizeTimer = setTimeout(() => {
        // 更新所有连接线位置
        this.updateAllConnections()
      }, 100)
    }

    // 监听窗口大小变化
    window.addEventListener("resize", this.handleResize)

    // 使用 ResizeObserver 监听容器大小变化（更精确）
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => {
        // 清除之前的定时器
        if (resizeTimer) {
          clearTimeout(resizeTimer)
        }

        // 延迟执行
        resizeTimer = setTimeout(() => {
          this.updateAllConnections()
        }, 100)
      })

      this.resizeObserver.observe(this.container)
    }
  }

  /**
   * 以指定点为中心缩放
   * @param {number} newScale - 新的缩放比例
   * @param {number} pointX - 缩放中心点 X 坐标（相对容器）
   * @param {number} pointY - 缩放中心点 Y 坐标（相对容器）
   */
  zoomAtPoint(newScale, pointX, pointY) {
    const oldScale = this.viewState.scale

    // 计算缩放点在变换前的坐标
    const worldX = (pointX - this.viewState.translateX) / oldScale
    const worldY = (pointY - this.viewState.translateY) / oldScale

    // 更新缩放
    this.viewState.scale = newScale

    // 调整平移，保持缩放点位置不变
    this.viewState.translateX = pointX - worldX * newScale
    this.viewState.translateY = pointY - worldY * newScale

    this.updateTransform()
  }

  /**
   * 设置缩放比例（以画布中心为基准）
   * @param {number} scale - 缩放比例
   */
  setZoom(scale) {
    const containerRect = this.container.getBoundingClientRect()
    const centerX = containerRect.width / 2
    const centerY = containerRect.height / 2
    this.zoomAtPoint(scale, centerX, centerY)
  }

  /**
   * 获取当前缩放比例
   * @returns {number} 当前缩放比例
   */
  getZoom() {
    return this.viewState.scale
  }

  /**
   * 重置视图
   */
  resetView() {
    this.viewState.scale = 1
    this.viewState.translateX = 0
    this.viewState.translateY = 0
    this.updateTransform()
  }

  /**
   * 放大
   */
  zoomIn() {
    const newScale = Math.min(this.config.maxZoom, this.viewState.scale + this.config.zoomStep)
    this.setZoom(newScale)
  }

  /**
   * 缩小
   */
  zoomOut() {
    const newScale = Math.max(this.config.minZoom, this.viewState.scale - this.config.zoomStep)
    this.setZoom(newScale)
  }

  /**
   * 获取视图状态
   * @returns {Object} 视图状态 {scale, translateX, translateY}
   */
  getViewState() {
    return { ...this.viewState }
  }

  /**
   * 设置视图状态（用于初始化或恢复视图）
   * @param {Object} state - 视图状态
   *   - scale: number - 缩放比例（可选，默认 1）
   *   - translateX: number - X 轴平移（可选，默认 0）
   *   - translateY: number - Y 轴平移（可选，默认 0）
   */
  setViewState(state = {}) {
    if (typeof state.scale === "number") {
      // 限制缩放范围
      this.viewState.scale = Math.max(this.config.minZoom, Math.min(this.config.maxZoom, state.scale))
    }
    if (typeof state.translateX === "number") {
      this.viewState.translateX = state.translateX
    }
    if (typeof state.translateY === "number") {
      this.viewState.translateY = state.translateY
    }
    this.updateTransform()
  }

  /**
   * 注册节点
   * @param {string} id - 节点唯一标识
   * @param {HTMLElement} element - 节点 DOM 元素
   * @param {Object} options - 节点配置选项
   *   - info:object 节点附加信息
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

    if (options.dotPositions === "both") {
      // 'both' 表示左右都有
      dotPositions = ["left", "right"]
    } else if (Array.isArray(options.dotPositions)) {
      // 数组形式：['left', 'right'] 或 ['left'] 或 ['right']
      dotPositions = options.dotPositions.filter((pos) => pos === "left" || pos === "right")
    } else {
      // 默认：第一个节点右侧，其他节点左侧
      dotPositions = [this.nodes.length === 0 ? "right" : "left"]
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
      info: options?.info,
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
    const dot = document.createElement("div")
    dot.className = "connector-dot"

    // 根据位置设置触点
    const position = dotPosition === "right" ? `right: -${this.config.dotSize / 2}px;` : `left: -${this.config.dotSize / 2}px;`

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
    dot.dataset.baseTransform = "translateY(-50%)"

    // 悬浮效果
    dot.addEventListener("mouseenter", () => {
      dot.style.transform = `translateY(-50%) scale(${this.config.dotHoverScale})`
    })
    dot.addEventListener("mouseleave", () => {
      dot.style.transform = "translateY(-50%) scale(1)"
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

    dotElement.addEventListener("mousedown", (e) => {
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
      document.addEventListener("mousemove", this.handleMouseMove)
      document.addEventListener("mouseup", this.handleMouseUp)
    })
  }

  /**
   * 绑定节点拖拽事件
   */
  bindNodeDragEvents(node) {
    const { element } = node

    element.addEventListener("mousedown", (e) => {
      // 如果点击的是连接点，不处理节点拖拽
      if (e.target.classList.contains("connector-dot")) {
        return
      }

      e.preventDefault()
      e.stopPropagation()

      this.isDraggingNode = true
      this.draggedNode = node

      const rect = element.getBoundingClientRect()
      const wrapperRect = this.contentWrapper.getBoundingClientRect()
      const { scale } = this.viewState

      // 计算鼠标在节点内的偏移量（相对于节点左上角，需要除以缩放比例）
      this.dragOffset = {
        x: (e.clientX - rect.left) / scale,
        y: (e.clientY - rect.top) / scale
      }

      // 将当前位置转换为 left/top 定位，避免拖拽时跳动
      // 需要除以缩放比例，因为 left/top 是在未缩放的坐标系中
      const currentLeft = (rect.left - wrapperRect.left) / scale
      const currentTop = (rect.top - wrapperRect.top) / scale

      element.style.left = `${currentLeft}px`
      element.style.top = `${currentTop}px`
      element.style.right = ""
      element.style.bottom = ""

      // 绑定移动和释放事件
      document.addEventListener("mousemove", this.handleNodeDragMove)
      document.addEventListener("mouseup", this.handleNodeDragEnd)
    })
  }

  /**
   * 处理节点拖拽移动
   */
  handleNodeDragMove = (e) => {
    if (!this.isDraggingNode || !this.draggedNode) return

    const wrapperRect = this.contentWrapper.getBoundingClientRect()
    const { scale } = this.viewState

    // 计算新位置：(鼠标位置 - wrapper偏移) / 缩放比例 - 鼠标在节点内的偏移
    const newX = (e.clientX - wrapperRect.left) / scale - this.dragOffset.x
    const newY = (e.clientY - wrapperRect.top) / scale - this.dragOffset.y

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

    document.removeEventListener("mousemove", this.handleNodeDragMove)
    document.removeEventListener("mouseup", this.handleNodeDragEnd)
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
    document.removeEventListener("mousemove", this.handleMouseMove)
    document.removeEventListener("mouseup", this.handleMouseUp)
  }

  /**
   * 更新临时连线
   */
  updateTempLine(e) {
    if (!this.tempLine || !this.startNode || !this.startDot) return

    const startPos = this.getDotPosition(this.startNode.element, this.startDot.position)

    // 将鼠标位置转换为 SVG 坐标
    const containerRect = this.container.getBoundingClientRect()
    const screenX = e.clientX - containerRect.left
    const screenY = e.clientY - containerRect.top

    const { scale, translateX, translateY } = this.viewState
    let endPos = {
      x: (screenX - translateX) / scale,
      y: (screenY - translateY) / scale
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
   * @param {Object} options - 配置选项
   *   - silent: boolean - 是否静默创建（不触发回调）
   */
  createConnection(fromNode, toNode, fromDot = null, toDot = null, options = {}) {
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
        (conn.fromNode.id === fromNode.id && conn.toNode.id === toNode.id && conn.fromDot.position === fromDot.position && conn.toDot.position === toDot.position) ||
        (conn.fromNode.id === toNode.id && conn.toNode.id === fromNode.id && conn.fromDot.position === toDot.position && conn.toDot.position === fromDot.position)
    )

    if (existingConnection) {
      console.warn("该连接已存在")
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
      deleteButton: deleteButton
    }

    this.connections.push(connection)

    // 记录节点的连接
    fromNode.connections.push(connection)
    toNode.connections.push(connection)

    // 更新连接线位置
    this.updateConnection(connection)

    // 绑定连线事件（删除按钮等）
    this.bindConnectionEvents(connection)

    // 触发连接回调（除非是静默模式）
    if (!options.silent) {
      this.onConnect({
        from: fromNode.id,
        fromInfo: fromNode.info,
        to: toNode.id,
        toInfo: toNode.info,
        fromDot: fromDot.position,
        toDot: toDot.position
      })
    }

    return connection
  }

  /**
   * 更新单个连接
   */
  updateConnection(connection) {
    if (!connection || !connection.line) return

    const fromPos = this.getDotPosition(connection.fromNode.element, connection.fromDot.position)
    const toPos = this.getDotPosition(connection.toNode.element, connection.toDot.position)

    this.updateLine(connection.line, fromPos, toPos, connection.fromDot.position, connection.toDot.position)

    // 同步更新悬浮路径
    if (connection.hoverPath) {
      this.updateLine(connection.hoverPath, fromPos, toPos, connection.fromDot.position, connection.toDot.position)
    }

    // 更新删除按钮位置 - 计算贝塞尔曲线上的真实中点
    if (connection.deleteButton) {
      const midPoint = this.getBezierMidPoint(fromPos, toPos, connection.fromDot.position, connection.toDot.position)
      connection.deleteButton.style.left = `${midPoint.x - this.config.deleteButtonSize / 2}px`
      connection.deleteButton.style.top = `${midPoint.y - this.config.deleteButtonSize / 2}px`
    }
  }

  /**
   * 更新节点的所有连接
   */
  updateNodeConnections(nodeId) {
    const connections = this.connections.filter((conn) => conn.fromNode.id === nodeId || conn.toNode.id === nodeId)
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
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path")
    path.setAttribute("stroke", this.config.lineColor)
    path.setAttribute("stroke-width", this.config.lineWidth)
    path.setAttribute("fill", "none")
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
  updateLine(line, start, end, startDotPosition = "right", endDotPosition = "left") {
    const dx = end.x - start.x
    const dy = end.y - start.y

    // 控制点偏移量，根据距离动态调整
    const distance = Math.sqrt(dx * dx + dy * dy)
    const controlPointOffset = Math.min(distance * 0.5, 150)

    // 根据触点位置决定控制点方向
    // 'right' 向右，'left' 向左
    const startControlX = startDotPosition === "right" ? start.x + controlPointOffset : start.x - controlPointOffset

    const endControlX = endDotPosition === "right" ? end.x + controlPointOffset : end.x - controlPointOffset

    // 使用三次贝塞尔曲线
    const path = `M ${start.x} ${start.y} C ${startControlX} ${start.y}, ${endControlX} ${end.y}, ${end.x} ${end.y}`
    line.setAttribute("d", path)
  }

  /**
   * 计算三次贝塞尔曲线的中点（t=0.5处的点）
   * @param {Object} start - 起点坐标 {x, y}
   * @param {Object} end - 终点坐标 {x, y}
   * @param {string} startDotPosition - 起点触点位置 'left' 或 'right'
   * @param {string} endDotPosition - 终点触点位置 'left' 或 'right'
   * @returns {Object} 中点坐标 {x, y}
   */
  getBezierMidPoint(start, end, startDotPosition = "right", endDotPosition = "left") {
    const dx = end.x - start.x
    const dy = end.y - start.y

    // 控制点偏移量，根据距离动态调整（与 updateLine 保持一致）
    const distance = Math.sqrt(dx * dx + dy * dy)
    const controlPointOffset = Math.min(distance * 0.5, 150)

    // 计算控制点
    const cp1x = startDotPosition === "right" ? start.x + controlPointOffset : start.x - controlPointOffset
    const cp1y = start.y

    const cp2x = endDotPosition === "right" ? end.x + controlPointOffset : end.x - controlPointOffset
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
    const deleteButton = document.createElement("div")
    deleteButton.className = "connector-delete-btn"
    deleteButton.innerHTML = "×"
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

    // 将删除按钮添加到 contentWrapper 内，使其跟随变换
    this.contentWrapper.appendChild(deleteButton)

    deleteButton.addEventListener("mouseenter", () => {
      deleteButton.style.transform = "scale(1.2)"
    })

    deleteButton.addEventListener("mouseleave", () => {
      deleteButton.style.transform = "scale(1)"
      deleteButton.style.opacity = "0"
      deleteButton.style.pointerEvents = "none"
    })

    return deleteButton
  }

  /**
   * 绑定连线的删除按钮事件
   */
  bindConnectionEvents(connection) {
    const { line, deleteButton } = connection

    // 设置连线可交互（但保持原始宽度）
    line.style.pointerEvents = "stroke"
    line.style.cursor = "pointer"

    // 创建一个不可见的宽区域用于悬浮检测
    const hoverPath = document.createElementNS("http://www.w3.org/2000/svg", "path")
    hoverPath.setAttribute("stroke", "transparent")
    hoverPath.setAttribute("stroke-width", "20")
    hoverPath.setAttribute("fill", "none")
    hoverPath.style.pointerEvents = "stroke"
    hoverPath.style.cursor = "pointer"

    // 复制路径
    hoverPath.setAttribute("d", line.getAttribute("d"))
    this.svg.insertBefore(hoverPath, line)

    connection.hoverPath = hoverPath

    const showDeleteButton = () => {
      deleteButton.style.opacity = "1"
      deleteButton.style.pointerEvents = "auto"
    }

    const hideDeleteButton = () => {
      setTimeout(() => {
        if (!deleteButton.matches(":hover")) {
          deleteButton.style.opacity = "0"
          deleteButton.style.pointerEvents = "none"
        }
      }, 100)
    }

    hoverPath.addEventListener("mouseenter", showDeleteButton)
    hoverPath.addEventListener("mouseleave", hideDeleteButton)
    line.addEventListener("mouseenter", showDeleteButton)
    line.addEventListener("mouseleave", hideDeleteButton)

    deleteButton.addEventListener("click", () => {
      this.disconnect(connection.id)
    })
  }

  /**
   * 断开连接
   * @param {string} connectionId - 连接ID，如果不提供则断开所有连接
   * @param {Object} options - 配置选项
   *   - silent: boolean - 是否静默断开（不触发回调）
   */
  disconnect(connectionId, options = {}) {
    if (connectionId) {
      // 断开指定连接
      const index = this.connections.findIndex((conn) => conn.id === connectionId)
      if (index === -1) return

      const connection = this.connections[index]
      const connectionInfo = {
        from: connection.fromNode.id,
        fromInfo: connection.fromNode.info,
        to: connection.toNode.id,
        toInfo: connection.toNode.info,
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
        connection.deleteButton.parentNode.removeChild(connection.deleteButton)
      }

      // 从节点的连接列表中移除
      connection.fromNode.connections = connection.fromNode.connections.filter((c) => c.id !== connectionId)
      connection.toNode.connections = connection.toNode.connections.filter((c) => c.id !== connectionId)

      // 从连接列表中移除
      this.connections.splice(index, 1)

      // 触发断开连接回调（除非是静默模式）
      if (!options.silent) {
        this.onDisconnect(connectionInfo)
      }
    } else {
      // 断开所有连接
      const allConnections = [...this.connections]
      allConnections.forEach((conn) => this.disconnect(conn.id, options))
    }
  }

  /**
   * 获取元素中心位置（SVG 坐标系统）
   */
  getElementCenter(element) {
    // 获取节点在视口中的位置
    const rect = element.getBoundingClientRect()
    const containerRect = this.container.getBoundingClientRect()

    // 计算相对于容器的位置（屏幕坐标）
    const screenX = rect.left + rect.width / 2 - containerRect.left
    const screenY = rect.top + rect.height / 2 - containerRect.top

    // 转换为 SVG 坐标系统（考虑缩放和平移）
    const { scale, translateX, translateY } = this.viewState
    const svgX = (screenX - translateX) / scale
    const svgY = (screenY - translateY) / scale

    return { x: svgX, y: svgY }
  }

  /**
   * 获取连接点位置（SVG 坐标系统）
   * @param {HTMLElement} element - 节点元素
   * @param {string} dotPosition - 触点位置 'left' 或 'right'
   */
  getDotPosition(element, dotPosition) {
    // 获取节点在视口中的位置
    const rect = element.getBoundingClientRect()
    const containerRect = this.container.getBoundingClientRect()

    // 计算相对于容器的位置（屏幕坐标）
    const screenX = dotPosition === "right" ? rect.right - containerRect.left : rect.left - containerRect.left
    const screenY = rect.top + rect.height / 2 - containerRect.top

    // 转换为 SVG 坐标系统（考虑缩放和平移）
    const { scale, translateX, translateY } = this.viewState
    const svgX = (screenX - translateX) / scale
    const svgY = (screenY - translateY) / scale

    return { x: svgX, y: svgY }
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
    node.element.style.boxShadow = "0 0 0 3px rgba(21, 91, 212, 0.3)"
    node.element.style.transform = "scale(1.05)"
    node.element.dataset.snapped = "true"

    // 高亮指定的连接点
    if (dot && dot.element) {
      const baseTransform = dot.element.dataset.baseTransform || "translateY(-50%)"
      dot.element.style.transform = `${baseTransform} scale(1.5)`
      dot.element.style.boxShadow = "0 0 10px rgba(21, 91, 212, 0.6)"
      dot.element.dataset.highlighted = "true"
    }
  }

  /**
   * 清除吸附高亮
   */
  clearSnapHighlight() {
    this.nodes.forEach((node) => {
      if (node.element.dataset.snapped === "true") {
        node.element.style.boxShadow = ""
        node.element.style.transform = ""
        delete node.element.dataset.snapped

        // 清除所有触点的高亮
        if (node.dots) {
          Object.values(node.dots).forEach((dot) => {
            if (dot.element.dataset.highlighted === "true") {
              const baseTransform = dot.element.dataset.baseTransform || "translateY(-50%)"
              dot.element.style.transform = baseTransform
              dot.element.style.boxShadow = ""
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
  /**
   * 销毁连线器
   * @param {Object} options - 配置选项
   *   - silent: boolean - 是否静默销毁（不触发回调）
   */
  destroy(options = {}) {
    // 断开所有连接
    this.disconnect(null, { silent: options.silent || true })

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
    document.removeEventListener("mousemove", this.handleMouseMove)
    document.removeEventListener("mouseup", this.handleMouseUp)
    document.removeEventListener("mousemove", this.handleNodeDragMove)
    document.removeEventListener("mouseup", this.handleNodeDragEnd)

    // 移除缩放和平移事件监听
    if (this.handleWheel) {
      this.container.removeEventListener("wheel", this.handleWheel)
    }
    if (this.handlePanStart) {
      this.container.removeEventListener("mousedown", this.handlePanStart)
    }
    if (this.handlePanMove) {
      document.removeEventListener("mousemove", this.handlePanMove)
    }
    if (this.handlePanEnd) {
      document.removeEventListener("mouseup", this.handlePanEnd)
    }

    // 移除窗口大小变化事件监听
    if (this.handleResize) {
      window.removeEventListener("resize", this.handleResize)
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }

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
