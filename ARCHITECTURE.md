# 架构文档

## 概述

Connector 是一个基于 pnpm + Turborepo 的 Monorepo 项目，采用模块化架构设计。

## 技术栈

### 构建工具
- **pnpm**: 快速、节省磁盘空间的包管理器
- **Turborepo**: 高性能构建系统，支持增量构建和缓存

### 前端
- **Vite**: 下一代前端构建工具
- **React 18**: UI 框架
- **TypeScript**: 类型安全

### 后端
- **Express**: Node.js Web 框架
- **TypeScript**: 类型安全

## 目录结构详解

### Apps (应用层)

#### web
前端 Web 应用，使用 Vite + React 构建。

**职责：**
- 用户界面展示
- 用户交互处理
- 调用 API 服务
- 使用共享 UI 组件

**依赖：**
- @connector/ui
- @connector/utils

#### api
后端 API 服务，使用 Express 构建。

**职责：**
- 提供 RESTful API
- 业务逻辑处理
- 数据持久化
- 身份认证和授权

**依赖：**
- @connector/utils

### Packages (共享包层)

#### ui
UI 组件库，提供可复用的 React 组件。

**特点：**
- 组件独立
- 类型安全
- 样式内联
- 支持 Tree-shaking

**导出格式：**
- ESM (dist/index.mjs)
- CJS (dist/index.js)
- TypeScript 类型定义 (dist/index.d.ts)

#### utils
工具函数库，提供通用的工具函数。

**特点：**
- 纯函数
- 无副作用
- 完整的类型定义
- 单元测试覆盖

**包含：**
- 日期处理
- 日志工具
- 其他通用工具

#### config
共享配置文件。

**包含：**
- ESLint 配置
- Prettier 配置

#### tsconfig
TypeScript 配置预设。

**包含：**
- base.json: 基础配置
- react.json: React 项目配置
- node.json: Node.js 项目配置

## 依赖关系图

```
┌─────────────────────────────────────────┐
│           Root Workspace                │
└─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
    ┌───▼────┐            ┌─────▼─────┐
    │  Apps  │            │  Packages │
    └───┬────┘            └─────┬─────┘
        │                       │
  ┌─────┴─────┐         ┌───────┼───────┬────────┐
  │           │         │       │       │        │
┌─▼──┐    ┌──▼─┐    ┌──▼──┐ ┌──▼───┐ ┌▼─────┐ ┌▼────────┐
│web │    │api │    │ ui  │ │utils │ │config│ │tsconfig │
└────┘    └────┘    └─────┘ └──────┘ └──────┘ └─────────┘
  │         │          │        │
  └─────────┼──────────┘        │
            └───────────────────┘
```

## 构建流程

### 开发模式
1. Turborepo 并行启动所有应用的 dev 脚本
2. 监听文件变化
3. 热更新

### 生产构建
1. Turborepo 分析依赖关系
2. 按照依赖顺序构建包
3. 利用缓存加速构建
4. 输出构建产物到 dist 目录

## 工作区协议

使用 `workspace:*` 协议引用内部包：

```json
{
  "dependencies": {
    "@connector/ui": "workspace:*"
  }
}
```

这样可以：
- 始终使用最新的本地版本
- 避免版本不一致问题
- 支持 pnpm 的符号链接优化

## 性能优化

### Turborepo 缓存
- 本地缓存构建结果
- 基于内容哈希的智能缓存
- 跨团队共享缓存（可选）

### pnpm 优化
- 内容寻址存储
- 符号链接节省磁盘空间
- 严格的依赖管理

### 增量构建
- 只构建变更的包
- 依赖包自动重新构建
- 并行构建提高速度

## 扩展指南

### 添加新应用
1. 在 `apps/` 下创建新目录
2. 创建 package.json
3. 配置 tsconfig.json
4. 在 turbo.json 中配置构建任务

### 添加新包
1. 在 `packages/` 下创建新目录
2. 创建 package.json（配置导出）
3. 配置 tsconfig.json
4. 实现功能并导出

### 添加依赖
```bash
# 添加到特定工作区
pnpm add <package> --filter @connector/web

# 添加到所有工作区
pnpm add <package> -w
```

## 最佳实践

1. **保持包的单一职责**
   - 每个包应该有明确的职责
   - 避免包之间的循环依赖

2. **合理使用共享包**
   - 只有真正需要共享的代码才放入 packages
   - 避免过度抽象

3. **类型安全**
   - 充分利用 TypeScript
   - 导出完整的类型定义

4. **测试覆盖**
   - 为共享包编写测试
   - 保持高测试覆盖率

5. **文档完善**
   - 每个包都应该有 README
   - 重要的功能需要详细文档

## 故障排查

### 依赖问题
```bash
# 清理并重新安装
pnpm clean
rm -rf node_modules
pnpm install
```

### 构建问题
```bash
# 清理构建缓存
pnpm clean
rm -rf .turbo

# 重新构建
pnpm build
```

### 类型检查问题
```bash
# 清理 TypeScript 缓存
find . -name "*.tsbuildinfo" -delete

# 重新检查
pnpm build
```

