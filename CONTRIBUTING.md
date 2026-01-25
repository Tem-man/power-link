# 贡献指南

感谢你考虑为 Connector 项目做出贡献！

## 开发流程

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交你的更改 (`git commit -m 'feat: add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启一个 Pull Request

## 开发环境设置

```bash
# 克隆仓库
git clone https://github.com/yourusername/connector.git
cd connector

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

## 代码规范

### 提交信息规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/) 规范：

- `feat:` 新功能
- `fix:` 修复 bug
- `docs:` 文档更新
- `style:` 代码格式调整（不影响代码运行）
- `refactor:` 重构（既不是新增功能，也不是修复 bug）
- `perf:` 性能优化
- `test:` 测试相关
- `chore:` 构建过程或辅助工具的变动

示例：
```
feat(ui): 添加 Button 组件的 loading 状态
fix(api): 修复用户登录接口的错误处理
docs: 更新 README 中的安装说明
```

### 代码风格

- 使用 TypeScript
- 使用 Prettier 格式化代码
- 遵循 ESLint 规则
- 编写有意义的变量名和函数名

### 测试

- 为新功能添加测试
- 确保所有测试通过：`pnpm test`
- 保持测试覆盖率

## 项目结构

```
connector/
├── apps/           # 应用程序
├── packages/       # 共享包
├── .vscode/        # VS Code 配置
└── ...
```

## Pull Request 指南

1. 确保代码通过所有检查：
   ```bash
   pnpm lint
   pnpm test
   pnpm build
   ```

2. 更新相关文档

3. PR 描述应该清楚地说明：
   - 解决了什么问题
   - 如何解决的
   - 是否有破坏性变更

4. 保持 PR 小而专注，一个 PR 只做一件事

## 添加新包

```bash
# 在 packages/ 目录下创建新包
mkdir packages/new-package
cd packages/new-package

# 创建 package.json
pnpm init

# 添加必要的配置文件
```

## 问题反馈

如果你发现了 bug 或有新功能建议，请：

1. 先搜索是否已有相关 issue
2. 如果没有，创建新 issue
3. 清楚地描述问题或建议
4. 提供复现步骤（如果是 bug）

## 行为准则

- 尊重所有贡献者
- 接受建设性批评
- 专注于对项目最有利的事情
- 保持友好和专业

## 许可证

通过贡献代码，你同意你的贡献将在 MIT 许可证下发布。

