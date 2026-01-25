# Connector Monorepo - 项目概览

## 📊 项目统计

- **应用数量**: 2 个 (web, api)
- **共享包数量**: 4 个 (ui, utils, config, tsconfig)
- **包管理器**: pnpm 8.15.0
- **构建工具**: Turborepo 1.12.4
- **语言**: TypeScript 5.3.3

## 🗂️ 完整目录结构

```
connector/
├── .vscode/                    # VS Code 配置
│   ├── settings.json          # 编辑器设置
│   └── extensions.json        # 推荐扩展
│
├── apps/                       # 应用程序目录
│   ├── web/                   # Web 前端应用
│   │   ├── src/
│   │   │   ├── App.tsx        # 主应用组件
│   │   │   ├── main.tsx       # 入口文件
│   │   │   └── index.css      # 全局样式
│   │   ├── index.html         # HTML 模板
│   │   ├── vite.config.ts     # Vite 配置
│   │   ├── tsconfig.json      # TypeScript 配置
│   │   ├── package.json       # 包配置
│   │   └── README.md          # 文档
│   │
│   └── api/                   # API 后端服务
│       ├── src/
│       │   └── index.ts       # 服务器入口
│       ├── tsconfig.json      # TypeScript 配置
│       ├── package.json       # 包配置
│       └── README.md          # 文档
│
├── packages/                   # 共享包目录
│   ├── ui/                    # UI 组件库
│   │   ├── src/
│   │   │   ├── Button.tsx     # Button 组件
│   │   │   └── index.ts       # 导出文件
│   │   ├── tsconfig.json
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── utils/                 # 工具函数库
│   │   ├── src/
│   │   │   ├── date.ts        # 日期工具
│   │   │   ├── date.test.ts   # 日期测试
│   │   │   ├── logger.ts      # 日志工具
│   │   │   └── index.ts       # 导出文件
│   │   ├── vitest.config.ts   # 测试配置
│   │   ├── tsconfig.json
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── config/                # 共享配置
│   │   ├── eslint-preset.js   # ESLint 配置
│   │   ├── prettier-preset.js # Prettier 配置
│   │   └── package.json
│   │
│   └── tsconfig/              # TypeScript 配置
│       ├── base.json          # 基础配置
│       ├── react.json         # React 配置
│       ├── node.json          # Node 配置
│       └── package.json
│
├── scripts/                    # 脚本目录
│   ├── setup.sh               # Linux/Mac 设置脚本
│   └── setup.ps1              # Windows 设置脚本
│
├── .editorconfig              # 编辑器配置
├── .gitignore                 # Git 忽略文件
├── .npmrc                     # npm 配置
├── .prettierrc.js             # Prettier 配置
├── package.json               # 根包配置
├── pnpm-workspace.yaml        # pnpm 工作区配置
├── tsconfig.json              # 根 TypeScript 配置
├── turbo.json                 # Turborepo 配置
├── README.md                  # 主文档
├── ARCHITECTURE.md            # 架构文档
├── CHANGELOG.md               # 变更日志
├── CONTRIBUTING.md            # 贡献指南
└── PROJECT_OVERVIEW.md        # 本文档
```

## 🎯 核心功能

### Web 应用 (@connector/web)
- ✅ Vite + React 18 开发环境
- ✅ TypeScript 类型检查
- ✅ 热模块替换 (HMR)
- ✅ 使用共享 UI 组件
- ✅ 使用共享工具函数

### API 服务 (@connector/api)
- ✅ Express 服务器
- ✅ TypeScript 支持
- ✅ 热重载开发模式
- ✅ 使用共享工具函数
- ✅ RESTful API 端点

### UI 组件库 (@connector/ui)
- ✅ React 组件
- ✅ TypeScript 类型定义
- ✅ ESM + CJS 双格式导出
- ✅ Button 组件 (支持多种变体和尺寸)

### 工具函数库 (@connector/utils)
- ✅ 日期格式化工具
- ✅ 日志记录工具
- ✅ 单元测试覆盖
- ✅ ESM + CJS 双格式导出

### 配置包 (@connector/config)
- ✅ ESLint 预设配置
- ✅ Prettier 预设配置

### TypeScript 配置 (@connector/tsconfig)
- ✅ 基础配置 (base.json)
- ✅ React 配置 (react.json)
- ✅ Node 配置 (node.json)

## 🚀 快速开始

### 1. 环境准备
```bash
# 确保已安装 Node.js >= 18 和 pnpm >= 8
node -v
pnpm -v
```

### 2. 自动设置 (推荐)
```bash
# Windows
.\scripts\setup.ps1

# Linux/Mac
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### 3. 手动设置
```bash
# 安装依赖
pnpm install

# 构建所有包
pnpm build

# 启动开发服务器
pnpm dev
```

### 4. 访问应用
- Web 应用: http://localhost:3000
- API 服务: http://localhost:4000

## 📦 包依赖关系

```
@connector/web
├── @connector/ui
│   └── react
└── @connector/utils

@connector/api
└── @connector/utils

@connector/ui
├── @connector/tsconfig (devDep)
└── react

@connector/utils
└── @connector/tsconfig (devDep)
```

## 🛠️ 可用命令

### 根目录命令
```bash
pnpm dev          # 启动所有应用的开发模式
pnpm build        # 构建所有包和应用
pnpm test         # 运行所有测试
pnpm lint         # 运行代码检查
pnpm clean        # 清理构建产物
pnpm format       # 格式化代码
```

### 针对特定包的命令
```bash
# 启动 web 应用
pnpm --filter @connector/web dev

# 构建 ui 组件库
pnpm --filter @connector/ui build

# 测试 utils 包
pnpm --filter @connector/utils test
```

## 📝 开发工作流

### 添加新功能
1. 在相应的包中开发功能
2. 编写测试
3. 更新文档
4. 提交代码

### 添加新依赖
```bash
# 添加到特定包
pnpm add <package> --filter @connector/web

# 添加到根工作区
pnpm add -w <package>

# 添加开发依赖
pnpm add -D <package> --filter @connector/api
```

### 创建新包
1. 在 `packages/` 下创建新目录
2. 创建 `package.json` 和 `tsconfig.json`
3. 实现功能
4. 在需要的地方引用

### 创建新应用
1. 在 `apps/` 下创建新目录
2. 配置构建工具和 TypeScript
3. 在 `turbo.json` 中添加构建配置
4. 开发应用

## 🎨 代码规范

- **语言**: TypeScript
- **格式化**: Prettier
- **代码检查**: ESLint
- **提交规范**: Conventional Commits
- **测试**: Vitest

## 📚 文档索引

- [README.md](./README.md) - 项目介绍和快速开始
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 架构设计文档
- [CONTRIBUTING.md](./CONTRIBUTING.md) - 贡献指南
- [CHANGELOG.md](./CHANGELOG.md) - 变更日志
- [apps/web/README.md](./apps/web/README.md) - Web 应用文档
- [apps/api/README.md](./apps/api/README.md) - API 服务文档
- [packages/ui/README.md](./packages/ui/README.md) - UI 组件库文档
- [packages/utils/README.md](./packages/utils/README.md) - 工具函数库文档

## 🔧 配置文件说明

| 文件 | 用途 |
|------|------|
| `pnpm-workspace.yaml` | 定义 pnpm 工作区 |
| `turbo.json` | Turborepo 构建配置 |
| `tsconfig.json` | 根 TypeScript 配置 |
| `.prettierrc.js` | Prettier 格式化配置 |
| `.editorconfig` | 编辑器配置 |
| `.gitignore` | Git 忽略文件配置 |
| `.npmrc` | npm/pnpm 配置 |

## 🎯 下一步计划

- [ ] 添加 ESLint 配置并集成
- [ ] 添加 CI/CD 配置 (GitHub Actions)
- [ ] 添加更多 UI 组件
- [ ] 添加 API 路由示例
- [ ] 添加数据库集成示例
- [ ] 添加身份认证示例
- [ ] 添加 E2E 测试
- [ ] 添加 Docker 配置
- [ ] 添加部署文档

## 💡 最佳实践

1. **保持包的独立性**: 每个包应该能够独立构建和测试
2. **使用 workspace 协议**: 内部依赖使用 `workspace:*`
3. **类型安全优先**: 充分利用 TypeScript 的类型系统
4. **文档完善**: 每个包都应该有清晰的 README
5. **测试覆盖**: 为共享包编写单元测试
6. **代码复用**: 将通用逻辑抽取到共享包中
7. **增量构建**: 利用 Turborepo 的缓存机制

## 🐛 常见问题

### Q: 如何清理所有依赖和构建产物?
```bash
pnpm clean
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
pnpm install
```

### Q: 如何只构建某个包?
```bash
pnpm --filter @connector/ui build
```

### Q: 如何查看所有工作区?
```bash
pnpm list -r --depth 0
```

### Q: 类型检查失败怎么办?
```bash
# 清理 TypeScript 缓存
find . -name "*.tsbuildinfo" -delete
pnpm build
```

## 📞 联系方式

如有问题或建议,请通过以下方式联系:
- 创建 Issue
- 提交 Pull Request
- 查看文档

---

**最后更新**: 2024-01-01
**维护者**: Connector Team

