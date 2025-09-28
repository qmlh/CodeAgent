# 多Agent IDE 环境配置指南

## 系统要求

- Node.js 18+
- npm 或 yarn
- Windows 10/11 (推荐) / macOS / Linux

## 安装步骤

### 1. 克隆项目
```bash
git clone <repository-url>
cd multi-agent-ide
```

### 2. 安装依赖
```bash
npm install
```

### 3. 启动开发环境

#### Windows用户（推荐）
```bash
# 使用PowerShell脚本（解决中文编码问题）
npm run dev:ps

# 或使用批处理脚本
npm run dev:win

# 或使用改进的启动脚本
npm run dev
```

#### macOS/Linux用户
```bash
npm run dev
```

## 编码问题解决

### Windows中文乱码
如果遇到控制台中文乱码，请：

1. **设置控制台编码**：
   ```cmd
   chcp 65001
   ```

2. **使用PowerShell**：
   ```powershell
   npm run dev:ps
   ```

3. **配置VS Code**：
   - 已自动创建 `.vscode/settings.json`
   - 重启VS Code后生效

## 开发工具配置

### VS Code扩展推荐
- TypeScript and JavaScript Language Features
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- ESLint

### 调试配置
- 按F12打开开发者工具
- 使用React DevTools检查组件状态
- 使用Redux DevTools查看状态变化

## 构建和部署

### 开发构建
```bash
npm run build
```

### 生产构建
```bash
npm run build:electron
```

### 运行测试
```bash
npm test
npm run test:e2e
```

## 常见问题

### 1. 启动失败
- 检查Node.js版本是否>=18
- 删除node_modules重新安装
- 检查端口3000是否被占用

### 2. 中文显示乱码
- 使用 `npm run dev:ps` 启动
- 设置控制台编码为UTF-8

### 3. Electron窗口不显示
- 检查是否有防火墙阻止
- 尝试以管理员权限运行

## 项目结构

```
multi-agent-ide/
├── src/
│   ├── electron/          # Electron主进程
│   ├── renderer/          # React渲染进程
│   ├── services/          # 业务服务
│   └── types/            # TypeScript类型定义
├── scripts/              # 构建和启动脚本
├── docs/                 # 项目文档
└── dist/                 # 构建输出
```