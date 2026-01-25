#!/bin/bash

# Connector Monorepo 快速设置脚本

echo "🚀 开始设置 Connector Monorepo..."

# 检查 Node.js 版本
echo "📦 检查 Node.js 版本..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ 错误: 需要 Node.js >= 18.0.0"
  echo "   当前版本: $(node -v)"
  exit 1
fi
echo "✅ Node.js 版本检查通过: $(node -v)"

# 检查 pnpm
echo "📦 检查 pnpm..."
if ! command -v pnpm &> /dev/null; then
  echo "⚠️  未找到 pnpm，正在安装..."
  npm install -g pnpm
fi
echo "✅ pnpm 版本: $(pnpm -v)"

# 安装依赖
echo "📦 安装依赖..."
pnpm install

# 创建环境变量文件
echo "🔧 创建环境变量文件..."
if [ ! -f "apps/web/.env" ]; then
  cp apps/web/.env.example apps/web/.env 2>/dev/null || true
  echo "✅ 已创建 apps/web/.env"
fi

if [ ! -f "apps/api/.env" ]; then
  cp apps/api/.env.example apps/api/.env 2>/dev/null || true
  echo "✅ 已创建 apps/api/.env"
fi

# 构建所有包
echo "🔨 构建所有包..."
pnpm build

echo ""
echo "✨ 设置完成！"
echo ""
echo "📝 下一步："
echo "   1. 启动开发服务器: pnpm dev"
echo "   2. Web 应用: http://localhost:3000"
echo "   3. API 服务: http://localhost:4000"
echo ""
echo "💡 更多命令："
echo "   pnpm build  - 构建所有包"
echo "   pnpm test   - 运行测试"
echo "   pnpm lint   - 代码检查"
echo "   pnpm clean  - 清理构建产物"
echo ""

