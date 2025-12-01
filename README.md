# AI Graphics Flow - AI 图形生成应用

<div align="center">

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688.svg)](https://fastapi.tiangolo.com/)
[![Vue](https://img.shields.io/badge/Vue-3.x-4FC08D.svg)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6.svg)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

基于 AI 的智能图形生成应用,支持通过自然语言描述生成流程图、架构图、数据结构图等技术图形。

[快速开始](#-快速开始) • [功能特性](#-功能特性) • [技术栈](#-技术栈) • [文档](#-文档)

</div>

---

## ✨ 功能特性

### 🤖 AI 智能生成
- 通过自然语言描述自动生成专业图形
- 支持多种 AI 模型 (Google Gemini, OpenAI)
- 智能提示词工程,生成高质量图形

### 🎨 双渲染引擎
- **Mermaid**: 支持流程图、时序图、类图、ER图等
- **Excalidraw**: 手绘风格自由画板
- 一键切换,满足不同场景需求

### 🛠️ 强大编辑功能
- 实时预览与编辑
- 代码编辑器 (Mermaid 语法)
- 可视化编辑器 (Excalidraw)
- 样式主题切换 (暗黑/明亮)

### 💾 数据管理
- 历史记录自动保存
- 用户认证与权限管理
- 图形版本控制
- 团队协作支持 (WebSocket)

### 📤 多格式导出
- SVG 矢量图
- PNG 位图
- PDF 文档

### 🎯 模板库
- 丰富的预设模板
- 快速启动创作
- 分类管理

## 🚀 快速开始

## 🛠️ 技术栈
### 前端技术
- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全
- **Vite** - 下一代前端构建工具
- **Tailwind CSS** - 实用优先的 CSS 框架
- **Mermaid.js** - 图形渲染引擎
- **Excalidraw** - 手绘风格画板
- **lucide-vue-next** - 精美图标库

### 后端技术
- **FastAPI** - 现代化高性能 Web 框架
- **SQLAlchemy** - Python ORM
- **MySQL** - 关系型数据库
- **Redis** - 内存缓存
- **JWT** - 安全认证
- **WebSocket** - 实时通信

### AI 服务
- **Google Gemini 3** - Google 最新大语言模型
- **GPT-5.1** - OpenAI 模型 (via AIHubMix)
- 智能提示词工程
- 多模型灵活切换

### DevOps
- **Docker** - 容器化
- **docker-compose** - 容器编排
- **Nginx** - 反向代理

## 📁 项目结构

```
genai_flow/
├── frontend/              # Vue 3 前端应用
│   ├── src/
│   │   ├── components/    # 核心组件
│   │   ├── App.vue       # 主应用
│   │   ├── types.ts      # 类型定义
│   │   └── style.css     # 全局样式
│   ├── Dockerfile
│   └── package.json
├── backend/               # FastAPI 后端
│   ├── main.py           # 主入口
│   ├── models.py         # 数据模型
│   ├── auth.py           # 认证模块
│   ├── ai_service.py     # AI 服务
│   ├── Dockerfile
│   └── requirements.txt
├── docker-compose.yml     # Docker 编排
├── start.sh              # 启动脚本
├── .env.example          # 环境变量模板
├── README.md             # 项目说明
├── DEPLOYMENT.md         # 部署指南
├── DEVELOPMENT.md        # 开发指南
└── PROJECT_SUMMARY.md    # 项目总结
```

## 🎯 快速上手

### 方式 1: 一键启动 (推荐)

```bash
# 克隆项目
git clone <repository-url>
cd genai_flow

# 运行启动脚本
chmod +x start.sh
./start.sh

# 选择启动方式:
# 1) Docker 部署 (推荐)
# 2) 本地开发模式
```

### 方式 2: Docker 部署

```bash
# 1. 配置环境变量
cp .env.example .env
# 编辑 .env 文件,配置 AI API 密钥

# 2. 启动所有服务
docker-compose up -d

# 3. 访问应用
# 前端: http://localhost:8080
# 后端 API: http://localhost:8000
# API 文档: http://localhost:8000/docs
```

### 方式 3: 本地开发

**后端:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

**前端 (新终端):**
```bash
cd frontend
npm install
npm run dev
```

访问: http://localhost:5173

## ⚙️ 环境配置

### 必需: AI API 密钥

至少配置以下其中一个:

**选项 1: Google Gemini (推荐)**

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3-pro
```

获取密钥: https://ai.google.dev/

**选项 2: AIHubMix (OpenAI)**
```env
AI_PROVIDER=aihubmix
AIHUBMIX_API_KEY=your_aihubmix_api_key_here
AIHUBMIX_BASE_URL=https://api.aihubmix.com
AIHUBMIX_MODEL=gpt-5.1
```

获取密钥: https://docs.aihubmix.com/

### 可选: 数据库配置

```env
# Docker 部署 (默认)
DATABASE_URL=mysql+pymysql://genai:genaipassword@mysql:3306/genai_flow

# 本地开发
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/genai_flow
```

### 安全: JWT 密钥

```env
JWT_SECRET_KEY=change-this-to-a-random-secret-key-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440
```

## 📖 文档

| 文档 | 说明 |
|------|------|
| [README.md](README.md) | 项目概述与快速开始 |
| [DEPLOYMENT.md](DEPLOYMENT.md) | 详细部署指南 |
| [DEVELOPMENT.md](DEVELOPMENT.md) | 开发规范与工作流 |
| [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) | 项目完成总结 |
| [设计文档](.qoder/quests/ai-graphics-app-development.md) | 高层设计文档 |

## 🎬 使用演示

### 1. AI 生成流程图

1. 在左侧选择 "Mermaid" 模式
2. 输入提示词: "创建一个用户注册流程图,包含邮箱验证"
3. 点击"生成"按钮
4. AI 自动生成并渲染图形

### 2. 手动编辑

1. 在代码编辑器中修改 Mermaid 语法
2. 实时查看预览更新
3. 使用工具栏调整样式和布局

### 3. 导出与分享

1. 点击工具栏下载按钮
2. 选择格式 (SVG/PNG)
3. 保存到本地或分享

## 🐛 常见问题

**Q: AI 生成失败?**
- 检查 .env 文件中 API 密钥是否配置正确
- 确认网络可以访问 AI 服务

**Q: 端口被占用?**
- 修改 docker-compose.yml 中的端口映射
- 或停止占用端口的其他服务

**Q: 数据库连接失败?**
- Docker 部署: 等待 MySQL 完全启动 (约 10 秒)
- 本地开发: 确保 MySQL 服务运行中

更多问题请查阅 [DEPLOYMENT.md](DEPLOYMENT.md)

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出建议!

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

详见 [DEVELOPMENT.md](DEVELOPMENT.md)

## 📊 项目状态

- ✅ 前端界面完成
- ✅ 后端 API 完成
- ✅ AI 服务集成完成
- ✅ 数据库设计完成
- ✅ Docker 部署完成
- ✅ 文档编写完成

**下一步计划:**
- WebSocket 实时协作
- 移动端适配
- 更多图形模板
- 性能优化

## 🙏 致谢

本项目基于以下优秀开源项目:

- [Vue.js](https://vuejs.org/) - 前端框架
- [FastAPI](https://fastapi.tiangolo.com/) - 后端框架
- [Mermaid.js](https://mermaid.js.org/) - 图形渲染
- [Excalidraw](https://excalidraw.com/) - 手绘画板
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架

## 📄 开源协议

MIT License - 详见 [LICENSE](LICENSE) 文件

---

<div align="center">

**Made with ❤️ by AI Graphics Flow Team**

[⬆ 回到顶部](#ai-graphics-flow---ai-图形生成应用)

</div>
