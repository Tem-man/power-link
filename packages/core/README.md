# @connector/utils

共享工具函数库

## 安装

```bash
pnpm add @connector/utils
```

## 使用

```typescript
import { formatDate, logger } from '@connector/utils'

// 格式化日期
const formatted = formatDate(new Date())
console.log(formatted) // 2024-01-01 12:00:00

// 日志记录
logger.info('这是一条信息')
logger.warn('这是一条警告')
logger.error('这是一条错误')
logger.debug('这是调试信息')
```

## API

### formatDate(date: Date): string

格式化日期为 `YYYY-MM-DD HH:mm:ss` 格式

### logger

日志工具

- `logger.info(...args)` - 信息日志
- `logger.warn(...args)` - 警告日志
- `logger.error(...args)` - 错误日志
- `logger.debug(...args)` - 调试日志

## 开发

```bash
pnpm dev
```

## 测试

```bash
pnpm test
```

## 构建

```bash
pnpm build
```

