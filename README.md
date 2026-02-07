# YAPK Next

> Yet Another Password Keeper - Next Generation

一个安全的跨平台密码管理器，使用 Tauri 2.0 和 Rust 构建。

## 特性

- 🔐 **安全存储** - 本地 SQLite 数据库，AES-256-GCM 加密
- 🔑 **主密码保护** - 应用锁定，需主密码解锁
- 🖥️ **跨平台** - 支持 macOS、Windows、Linux（iOS/Android 计划中）
- ⚡ **轻量高效** - 基于 Tauri 2.0，包体积仅 ~5MB
- 🎨 **现代 UI** - React 19 + TailwindCSS，支持亮色/暗色/跟随系统主题
- 🔍 **快速搜索** - 实时搜索密码记录
- 📋 **一键复制** - 快速复制用户名和密码
- 🎲 **密码生成器** - 自定义长度和字符类型
- 🏥 **健康检查** - 检测弱密码和重复密码
- 📁 **分类管理** - 支持自定义分类和图标
- 📤 **数据导入导出** - JSON 格式备份和恢复

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Tauri 2.0 |
| 前端 | React 19 + TypeScript 5.6 |
| 样式 | TailwindCSS 3.4 |
| 构建 | Vite 6 |
| 后端 | Rust |
| 数据库 | SQLite (rusqlite) |
| 状态管理 | Zustand 5 |

## 开发环境要求

- [Node.js](https://nodejs.org/) >= 18
- [Rust](https://www.rust-lang.org/) >= 1.75
- [pnpm](https://pnpm.io/) (推荐，通过 `corepack enable` 启用)

### macOS 额外依赖

```bash
xcode-select --install
```

### Windows 额外依赖

- [Microsoft Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
- [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)

### Linux 额外依赖

```bash
# Ubuntu/Debian
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libssl-dev libgtk-3-dev librsvg2-dev

# Fedora
sudo dnf install webkit2gtk4.1-devel openssl-devel curl wget file gtk3-devel librsvg2-devel

# Arch
sudo pacman -S webkit2gtk-4.1 base-devel curl wget file openssl gtk3 librsvg
```

## 快速开始

```bash
# 克隆项目
git clone https://github.com/xsddz/yapk-next.git
cd yapk-next

# 启用 pnpm (如未启用)
corepack enable

# 安装依赖
pnpm install

# 开发模式运行
pnpm tauri dev

# 构建生产版本
pnpm tauri build
```

## 项目结构

```
yapk-next/
├── src/                    # React 前端代码
│   ├── components/         # React 组件
│   ├── stores/             # Zustand 状态管理
│   ├── styles/             # CSS 样式
│   ├── types/              # TypeScript 类型定义
│   ├── App.tsx             # 主应用组件
│   └── main.tsx            # 入口文件
├── src-tauri/              # Rust 后端代码
│   ├── src/
│   │   ├── db.rs           # 数据库操作
│   │   ├── models.rs       # 数据模型
│   │   ├── lib.rs          # Tauri 命令
│   │   └── main.rs         # 程序入口
│   ├── capabilities/       # Tauri 权限配置
│   ├── Cargo.toml          # Rust 依赖
│   └── tauri.conf.json     # Tauri 配置
├── index.html              # HTML 模板
├── package.json            # Node.js 依赖
├── vite.config.ts          # Vite 配置
├── tailwind.config.js      # TailwindCSS 配置
└── tsconfig.json           # TypeScript 配置
```

## 脚本命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动前端开发服务器 |
| `pnpm build` | 构建前端生产版本 |
| `pnpm tauri dev` | 启动 Tauri 开发模式 |
| `pnpm tauri build` | 构建桌面应用 |

## 数据存储

密码数据存储在本地 SQLite 数据库中：

- **macOS**: `~/Library/Application Support/org.xsddz.yapk-next/passwords.db`
- **Windows**: `C:\Users\{User}\AppData\Roaming\org.xsddz.yapk-next\passwords.db`
- **Linux**: `~/.local/share/org.xsddz.yapk-next/passwords.db`

## 路线图

- [x] 主密码保护
- [x] 密码加密存储 (AES-256-GCM)
- [x] 密码生成器
- [x] 密码健康检查
- [x] 分类/标签管理
- [x] 数据导入导出
- [x] 主题切换（亮色/暗色/跟随系统）
- [ ] iOS 应用
- [ ] Android 应用
- [ ] 浏览器扩展

## 从旧版本迁移

如果你之前使用 [Yet-Another-Password-Keeper](https://github.com/xsddz/Yet-Another-Password-Keeper)，可以导入旧数据：

```bash
# 旧数据库位置
~/Documents/yet-another-password-keeper/passwd.db

# 即将支持迁移工具...
```

## 许可证

MIT License

## 相关项目

- [Yet-Another-Password-Keeper](https://github.com/xsddz/Yet-Another-Password-Keeper) - 基于 Electron 的前身项目
