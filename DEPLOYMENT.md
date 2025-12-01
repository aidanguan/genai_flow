# 部署指南

## 快速开始

### 使用启动脚本(推荐)

```bash
./start.sh
```

选择启动方式:
- **选项 1**: Docker 容器化部署(推荐生产环境)
- **选项 2**: 本地开发模式(适合开发调试)

### 手动启动

#### 1. Docker 部署

```bash
# 1. 配置环境变量
cp .env.example .env
# 编辑 .env 文件,配置 AI API 密钥

# 2. 启动所有服务
docker-compose up -d

# 3. 查看日志
docker-compose logs -f

# 4. 停止服务
docker-compose down
```

#### 2. 本地开发

**后端:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

**前端:**
```bash
cd frontend
npm install
npm run dev
```

## 环境变量配置

### 必需配置

至少配置以下 AI 服务之一:

**Google Gemini:**
```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-3-pro
```

**AIHubMix:**
```env
AI_PROVIDER=aihubmix
AIHUBMIX_API_KEY=your_api_key_here
AIHUBMIX_BASE_URL=https://api.aihubmix.com
AIHUBMIX_MODEL=gpt-5.1
```

### 数据库配置

```env
# MySQL (Docker 默认配置)
DATABASE_URL=mysql+pymysql://genai:genaipassword@mysql:3306/genai_flow

# 本地开发
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/genai_flow
```

### JWT 配置

```env
JWT_SECRET_KEY=your-very-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440
```

## 服务访问

### Docker 部署
- 前端: http://localhost:8080
- 后端 API: http://localhost:8000
- API 文档: http://localhost:8000/docs
- MySQL: localhost:3306
- Redis: localhost:6379

### 本地开发
- 前端: http://localhost:5173
- 后端 API: http://localhost:8000

## 数据库初始化

首次启动时,数据库表会自动创建。如需手动初始化:

```bash
# 进入后端容器
docker-compose exec backend bash

# 运行 Python
python
>>> from database import Base, engine
>>> Base.metadata.create_all(bind=engine)
>>> exit()
```

## 常见问题

### 1. 端口冲突

如果默认端口被占用,修改 `docker-compose.yml`:

```yaml
services:
  frontend:
    ports:
      - "8081:80"  # 修改为其他端口
  backend:
    ports:
      - "8001:8000"
```

### 2. AI API 调用失败

检查:
- `.env` 文件中 API 密钥是否正确
- AI_PROVIDER 设置是否匹配
- 网络连接是否正常

### 3. 数据库连接失败

Docker 部署:
```bash
# 等待 MySQL 完全启动
docker-compose up -d mysql
sleep 10
docker-compose up -d backend
```

本地开发:
- 确保 MySQL 服务运行中
- 检查数据库连接字符串
- 创建数据库: `CREATE DATABASE genai_flow;`

### 4. 前端构建失败

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 生产环境部署建议

1. **使用 HTTPS**: 配置 SSL 证书
2. **环境隔离**: 使用独立的数据库和 Redis
3. **日志管理**: 配置日志收集系统
4. **备份策略**: 定期备份 MySQL 数据
5. **监控告警**: 部署监控系统
6. **限流防护**: 配置 API 限流规则

## 性能优化

1. **前端优化**:
   - 启用 CDN
   - 配置资源缓存
   - 使用生产构建

2. **后端优化**:
   - 使用 Redis 缓存
   - 配置数据库连接池
   - 启用 Gzip 压缩

3. **数据库优化**:
   - 添加必要索引
   - 定期清理历史数据
   - 配置慢查询日志

## 维护命令

```bash
# 查看运行状态
docker-compose ps

# 查看日志
docker-compose logs -f [service_name]

# 重启服务
docker-compose restart [service_name]

# 进入容器
docker-compose exec [service_name] bash

# 清理资源
docker-compose down -v  # 警告:会删除数据卷
```
