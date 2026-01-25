# 快速上手指南

欢迎使用 Connector Monorepo! 这份指南将帮助你快速开始开发。

## 📋 前置要求

在开始之前,请确保你的系统已安装:

- **Node.js** >= 18.0.0 ([下载](https://nodejs.org/))
- **pnpm** >= 8.0.0 (运行 `npm install -g pnpm` 安装)

检查版本:
```bash
node -v   # 应该显示 v18.0.0 或更高
pnpm -v   # 应该显示 8.0.0 或更高
```

## 🚀 三步开始

### 步骤 1: 安装依赖

```bash
pnpm install
```

这将安装所有应用和包的依赖。pnpm 会自动处理工作区之间的链接。

### 步骤 2: 构建所有包

```bash
pnpm build
```

这将按照依赖顺序构建所有共享包。Turborepo 会自动处理构建顺序。

### 步骤 3: 启动开发服务器

```bash
pnpm dev
```

这将同时启动:
- **Web 应用**: http://localhost:3000
- **API 服务**: http://localhost:4000

## 🎯 第一次运行

### 使用自动化脚本 (推荐)

**Windows:**
```powershell
.\scripts\setup.ps1
```

**Linux/Mac:**
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

脚本会自动:
1. 检查 Node.js 和 pnpm 版本
2. 安装所有依赖
3. 创建环境变量文件
4. 构建所有包
5. 显示下一步操作

## 📦 项目结构速览

```
connector/
├── apps/              # 应用程序
│   ├── web/          # React 前端 (端口 3000)
│   └── api/          # Express 后端 (端口 4000)
└── packages/         # 共享包
    ├── ui/           # UI 组件库
    ├── utils/        # 工具函数
    ├── config/       # 共享配置
    └── tsconfig/     # TS 配置
```

## 🛠️ 常用命令

### 开发
```bash
# 启动所有应用
pnpm dev

# 只启动 web 应用
pnpm --filter @connector/web dev

# 只启动 api 服务
pnpm --filter @connector/api dev
```

### 构建
```bash
# 构建所有包和应用
pnpm build

# 只构建 ui 组件库
pnpm --filter @connector/ui build
```

### 测试
```bash
# 运行所有测试
pnpm test

# 只测试 utils 包
pnpm --filter @connector/utils test
```

### 代码质量
```bash
# 代码检查
pnpm lint

# 代码格式化
pnpm format
```

### 清理
```bash
# 清理构建产物
pnpm clean
```

## 💻 开发工作流

### 1. 修改 UI 组件

```bash
# 1. 进入 ui 包目录
cd packages/ui

# 2. 启动开发模式 (监听文件变化)
pnpm dev

# 3. 在另一个终端启动 web 应用
cd ../../apps/web
pnpm dev

# 4. 修改 packages/ui/src/Button.tsx
# 5. web 应用会自动热更新
```

### 2. 添加新的工具函数

```bash
# 1. 在 packages/utils/src/ 创建新文件
# 例如: packages/utils/src/string.ts

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

# 2. 在 packages/utils/src/index.ts 导出
export { capitalize } from './string'

# 3. 在应用中使用
import { capitalize } from '@connector/utils'
```

### 3. 添加新的依赖

```bash
# 添加到 web 应用
pnpm add axios --filter @connector/web

# 添加到 api 服务
pnpm add cors --filter @connector/api

# 添加开发依赖
pnpm add -D @types/node --filter @connector/api

# 添加到根工作区
pnpm add -w husky
```

## 🎨 代码示例

### 使用 UI 组件

```tsx
// apps/web/src/App.tsx
import { Button } from '@connector/ui'

function App() {
  return (
    <div>
      <Button variant="primary" size="large">
        主要按钮
      </Button>
      <Button variant="secondary" size="medium">
        次要按钮
      </Button>
      <Button variant="danger" size="small">
        危险按钮
      </Button>
    </div>
  )
}
```

### 使用工具函数

```tsx
// apps/web/src/App.tsx
import { formatDate, logger } from '@connector/utils'

function App() {
  const now = formatDate(new Date())
  logger.info('应用已启动', { timestamp: now })
  
  return <div>当前时间: {now}</div>
}
```

### API 路由示例

```typescript
// apps/api/src/index.ts
import express from 'express'
import { logger } from '@connector/utils'

const app = express()

app.get('/api/users', (req, res) => {
  logger.info('获取用户列表')
  res.json({ users: [] })
})

app.listen(4000, () => {
  logger.info('服务器启动在 http://localhost:4000')
})
```

## 🔍 故障排查

### 问题: 依赖安装失败

**解决方案:**
```bash
# 清理并重新安装
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
rm pnpm-lock.yaml
pnpm install
```

### 问题: 构建失败

**解决方案:**
```bash
# 清理构建缓存
pnpm clean
rm -rf .turbo

# 重新构建
pnpm build
```

### 问题: TypeScript 类型错误

**解决方案:**
```bash
# 清理 TypeScript 缓存
find . -name "*.tsbuildinfo" -delete

# 重新构建
pnpm build
```

### 问题: 端口被占用

**解决方案:**
```bash
# Windows - 查找并结束占用端口的进程
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

## 📚 下一步

现在你已经成功运行了项目,可以:

1. **阅读架构文档**: [ARCHITECTURE.md](./ARCHITECTURE.md)
2. **查看贡献指南**: [CONTRIBUTING.md](./CONTRIBUTING.md)
3. **浏览项目概览**: [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)
4. **开始开发**: 选择一个应用或包开始编码!

## 💡 提示

- 使用 `pnpm --filter` 可以针对特定包运行命令
- Turborepo 会自动缓存构建结果,加快后续构建
- 修改共享包时,依赖它的应用会自动重新构建
- 使用 VS Code 可以获得最佳开发体验

## 🆘 需要帮助?

- 查看 [README.md](./README.md) 了解项目概述
- 查看各个包的 README 了解具体用法
- 创建 Issue 报告问题
- 查看 [pnpm 文档](https://pnpm.io/)
- 查看 [Turborepo 文档](https://turbo.build/)

---

**祝你开发愉快! 🎉**

