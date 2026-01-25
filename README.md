# Connector Monorepo

这是一个基于 pnpm + Turbo 的 Monorepo 项目结构。

## 📁 项目结构

```
connector/
├── apps/                    # 应用程序
│   ├── web/                # Web 前端应用 (Vite + React)
│   └── api/                # API 后端服务 (Express)
├── packages/               # 共享包
│   ├── ui/                 # UI 组件库
│   ├── utils/              # 工具函数库
│   ├── config/             # 共享配置 (ESLint, Prettier)
│   └── tsconfig/           # TypeScript 配置
├── package.json            # 根 package.json
├── pnpm-workspace.yaml     # pnpm 工作区配置
├── turbo.json              # Turbo 构建配置
└── tsconfig.json           # 根 TypeScript 配置
```

## 🚀 快速开始

### 前置要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
# 启动所有应用的开发模式
pnpm dev

# 或单独启动某个应用
pnpm --filter @connector/web dev
pnpm --filter @connector/api dev
```

### 构建

```bash
# 构建所有包和应用
pnpm build

# 或单独构建某个包
pnpm --filter @connector/ui build
```

### 测试

```bash
pnpm test
```

### 代码检查

```bash
pnpm lint
```

### 代码格式化

```bash
pnpm format
```

## 📦 包说明

### Apps

#### @connector/web

- **技术栈**: Vite + React + TypeScript
- **端口**: 3000
- **说明**: Web 前端应用

#### @connector/api

- **技术栈**: Express + TypeScript
- **端口**: 4000
- **说明**: API 后端服务

### Packages

#### @connector/ui

- **说明**: 共享 UI 组件库
- **导出**: Button 等组件

#### @connector/utils

- **说明**: 共享工具函数库
- **导出**: formatDate, logger 等工具函数

#### @connector/config

- **说明**: 共享配置文件 (ESLint, Prettier)

#### @connector/tsconfig

- **说明**: 共享 TypeScript 配置
- **包含**: base.json, react.json, node.json

## 🔧 常用命令

```bash
# 添加依赖到根项目
pnpm add -w <package>

# 添加依赖到特定工作区
pnpm add <package> --filter @connector/web

# 添加开发依赖
pnpm add -D <package> --filter @connector/api

# 清理所有构建产物和 node_modules
pnpm clean

# 查看所有工作区
pnpm list -r --depth 0
```

## 🏗️ 工作区依赖

在 monorepo 中,包之间可以相互依赖:

```json
{
  "dependencies": {
    "@connector/ui": "workspace:*",
    "@connector/utils": "workspace:*"
  }
}
```

## 📝 开发规范

1. **代码风格**: 使用 Prettier 统一代码格式
2. **类型检查**: 所有代码必须通过 TypeScript 类型检查
3. **命名规范**:
   - 包名使用 `@connector/` 前缀
   - 组件使用 PascalCase
   - 函数使用 camelCase
4. **提交规范**: 建议使用 Conventional Commits

## 🔗 相关链接

- [pnpm](https://pnpm.io/)
- [Turborepo](https://turbo.build/)
- [Vite](https://vitejs.dev/)
- [React](https://react.dev/)
- [Express](https://expressjs.com/)

## 📄 License

MIT
