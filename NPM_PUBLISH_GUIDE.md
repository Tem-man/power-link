# 发布 @connector/ui 到 npm

本指南介绍如何将 @connector/ui 组件库发布到 npm。

## 📋 发布前检查清单

- [ ] 所有组件已完成开发和测试
- [ ] 文档已更新（README.md, CHANGELOG.md）
- [ ] 版本号已更新（package.json）
- [ ] 构建成功（`pnpm build`）
- [ ] 已登录 npm 账号
- [ ] 包名未被占用（如果是首次发布）

## 🔧 准备工作

### 1. 注册 npm 账号

如果还没有 npm 账号，访问 https://www.npmjs.com/ 注册。

### 2. 登录 npm

```bash
npm login
```

输入用户名、密码和邮箱。

### 3. 检查登录状态

```bash
npm whoami
```

## 📦 发布步骤

### 方式一：手动发布（推荐用于学习）

#### 1. 进入 UI 包目录

```bash
cd packages/ui
```

#### 2. 更新版本号

根据改动类型更新版本号：

```bash
# 补丁版本（bug 修复）: 1.0.0 -> 1.0.1
npm version patch

# 次版本（新功能）: 1.0.0 -> 1.1.0
npm version minor

# 主版本（破坏性更新）: 1.0.0 -> 2.0.0
npm version major
```

或手动编辑 `package.json` 中的 `version` 字段。

#### 3. 构建包

```bash
pnpm build
```

#### 4. 测试打包内容

查看将要发布的文件：

```bash
npm pack --dry-run
```

这会显示将要包含在包中的所有文件。

#### 5. 发布到 npm

**公开包（免费）：**

```bash
npm publish --access public
```

**私有包（需要付费账号）：**

```bash
npm publish
```

**发布到特定 tag：**

```bash
# 发布为 beta 版本
npm publish --tag beta

# 发布为 next 版本
npm publish --tag next
```

### 方式二：使用根目录脚本

在项目根目录创建发布脚本：

```bash
# 从根目录运行
pnpm --filter @connector/ui build
cd packages/ui
npm publish --access public
```

## 🔍 验证发布

### 1. 检查 npm 网站

访问 https://www.npmjs.com/package/@connector/ui 查看包信息。

### 2. 安装测试

在新项目中测试安装：

```bash
npm install @connector/ui
# 或
pnpm add @connector/ui
# 或
yarn add @connector/ui
```

### 3. 测试使用

```tsx
import { Button, Tooltip } from '@connector/ui';

function App() {
  return (
    <Tooltip content="Hello">
      <Button>Click me</Button>
    </Tooltip>
  );
}
```

## 📝 版本管理最佳实践

### 语义化版本（SemVer）

- **主版本号（Major）**: 不兼容的 API 修改
- **次版本号（Minor）**: 向下兼容的功能新增
- **修订号（Patch）**: 向下兼容的问题修正

### 版本示例

```
1.0.0 -> 1.0.1  (修复 bug)
1.0.1 -> 1.1.0  (添加新组件)
1.1.0 -> 2.0.0  (重大 API 变更)
```

### 预发布版本

```bash
# Alpha 版本（内部测试）
1.0.0-alpha.1

# Beta 版本（公开测试）
1.0.0-beta.1

# RC 版本（发布候选）
1.0.0-rc.1
```

## 🏷️ 使用 npm tags

### 发布不同版本

```bash
# 发布稳定版（默认）
npm publish --access public

# 发布 beta 版
npm publish --tag beta --access public

# 发布 next 版
npm publish --tag next --access public
```

### 用户安装特定 tag

```bash
# 安装稳定版（默认）
npm install @connector/ui

# 安装 beta 版
npm install @connector/ui@beta

# 安装 next 版
npm install @connector/ui@next
```

## 🔄 更新已发布的包

### 1. 修改代码

```bash
# 修改组件代码
# 更新文档
# 更新 CHANGELOG.md
```

### 2. 更新版本

```bash
npm version patch  # 或 minor, major
```

### 3. 重新构建和发布

```bash
pnpm build
npm publish --access public
```

## ⚠️ 撤销发布

**注意：只能在发布后 72 小时内撤销！**

```bash
# 撤销特定版本
npm unpublish @connector/ui@1.0.0

# 撤销整个包（危险操作！）
npm unpublish @connector/ui --force
```

## 🔐 安全建议

### 1. 使用 2FA（双因素认证）

在 npm 网站启用 2FA 保护账号安全。

### 2. 使用 .npmrc 配置

```bash
# 在用户目录创建 ~/.npmrc
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
```

### 3. 检查依赖安全

```bash
npm audit
```

## 📊 发布检查脚本

创建 `scripts/check-package.sh`:

```bash
#!/bin/bash

echo "🔍 检查包配置..."

# 检查必要字段
if ! grep -q "\"name\"" package.json; then
  echo "❌ 缺少 name 字段"
  exit 1
fi

if ! grep -q "\"version\"" package.json; then
  echo "❌ 缺少 version 字段"
  exit 1
fi

# 检查构建产物
if [ ! -d "dist" ]; then
  echo "❌ dist 目录不存在，请先运行 pnpm build"
  exit 1
fi

# 检查类型定义
if [ ! -f "dist/index.d.ts" ]; then
  echo "❌ 缺少类型定义文件"
  exit 1
fi

echo "✅ 包检查通过！"
```

## 🚀 自动化发布（CI/CD）

### GitHub Actions 示例

创建 `.github/workflows/publish.yml`:

```yaml
name: Publish Package

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'

      - run: pnpm install

      - run: pnpm --filter @connector/ui build

      - run: cd packages/ui && npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## 📖 相关资源

- [npm 官方文档](https://docs.npmjs.com/)
- [语义化版本规范](https://semver.org/lang/zh-CN/)
- [npm 包发布最佳实践](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)

## 🆘 常见问题

### Q: 包名已被占用怎么办？

A: 使用 scoped package，例如 `@yourname/ui` 或选择其他名称。

### Q: 如何发布私有包？

A: 需要 npm 付费账号，然后使用 `npm publish` 不加 `--access public`。

### Q: 如何删除已发布的版本？

A: 使用 `npm unpublish @connector/ui@version`，但只能在 72 小时内。

### Q: 发布失败怎么办？

A: 检查：

1. 是否已登录 npm
2. 包名是否可用
3. 版本号是否已存在
4. 网络连接是否正常

## ✅ 发布成功后

1. 在 GitHub 创建 Release
2. 更新项目文档
3. 在社交媒体分享
4. 收集用户反馈
5. 持续维护和更新
