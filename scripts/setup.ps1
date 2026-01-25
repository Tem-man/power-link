# Connector Monorepo 快速设置脚本 (PowerShell)

Write-Host "🚀 开始设置 Connector Monorepo..." -ForegroundColor Green

# 检查 Node.js 版本
Write-Host "📦 检查 Node.js 版本..." -ForegroundColor Yellow
try {
    $nodeVersion = (node -v).Substring(1).Split('.')[0]
    if ([int]$nodeVersion -lt 18) {
        Write-Host "❌ 错误: 需要 Node.js >= 18.0.0" -ForegroundColor Red
        Write-Host "   当前版本: $(node -v)" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Node.js 版本检查通过: $(node -v)" -ForegroundColor Green
} catch {
    Write-Host "❌ 错误: 未找到 Node.js" -ForegroundColor Red
    exit 1
}

# 检查 pnpm
Write-Host "📦 检查 pnpm..." -ForegroundColor Yellow
try {
    $pnpmVersion = pnpm -v
    Write-Host "✅ pnpm 版本: $pnpmVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️  未找到 pnpm，正在安装..." -ForegroundColor Yellow
    npm install -g pnpm
}

# 安装依赖
Write-Host "📦 安装依赖..." -ForegroundColor Yellow
pnpm install

# 创建环境变量文件
Write-Host "🔧 创建环境变量文件..." -ForegroundColor Yellow
if (-not (Test-Path "apps\web\.env")) {
    if (Test-Path "apps\web\.env.example") {
        Copy-Item "apps\web\.env.example" "apps\web\.env"
        Write-Host "✅ 已创建 apps\web\.env" -ForegroundColor Green
    }
}

if (-not (Test-Path "apps\api\.env")) {
    if (Test-Path "apps\api\.env.example") {
        Copy-Item "apps\api\.env.example" "apps\api\.env"
        Write-Host "✅ 已创建 apps\api\.env" -ForegroundColor Green
    }
}

# 构建所有包
Write-Host "🔨 构建所有包..." -ForegroundColor Yellow
pnpm build

Write-Host ""
Write-Host "✨ 设置完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📝 下一步：" -ForegroundColor Cyan
Write-Host "   1. 启动开发服务器: pnpm dev"
Write-Host "   2. Web 应用: http://localhost:3000"
Write-Host "   3. API 服务: http://localhost:4000"
Write-Host ""
Write-Host "💡 更多命令：" -ForegroundColor Cyan
Write-Host "   pnpm build  - 构建所有包"
Write-Host "   pnpm test   - 运行测试"
Write-Host "   pnpm lint   - 代码检查"
Write-Host "   pnpm clean  - 清理构建产物"
Write-Host ""

