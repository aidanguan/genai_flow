# 开发指南

## 项目结构

```
genai_flow/
├── frontend/                # Vue 3 前端应用
│   ├── src/
│   │   ├── components/      # Vue 组件
│   │   │   ├── Sidebar.vue
│   │   │   ├── Header.vue
│   │   │   ├── PromptInput.vue
│   │   │   ├── MermaidEditor.vue
│   │   │   └── ExcalidrawWrapper.vue
│   │   ├── App.vue         # 主应用组件
│   │   ├── types.ts        # TypeScript 类型定义
│   │   └── style.css       # 全局样式
│   ├── Dockerfile
│   └── package.json
│
├── backend/                 # FastAPI 后端服务
│   ├── main.py             # 主应用入口
│   ├── config.py           # 配置管理
│   ├── database.py         # 数据库连接
│   ├── models.py           # SQLAlchemy 模型
│   ├── auth.py             # 认证模块
│   ├── ai_service.py       # AI 服务
│   ├── export_service.py   # 导出服务
│   ├── Dockerfile
│   └── requirements.txt
│
├── docker-compose.yml       # Docker 编排配置
├── .env.example            # 环境变量示例
├── start.sh                # 启动脚本
└── README.md               # 项目说明
```

## 技术栈

### 前端
- **框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **图形库**: Mermaid.js, Excalidraw
- **图标**: lucide-vue-next
- **工具库**: clsx

### 后端
- **框架**: FastAPI
- **ORM**: SQLAlchemy
- **数据库**: MySQL
- **缓存**: Redis
- **认证**: JWT (python-jose)
- **密码加密**: passlib[bcrypt]

## 开发工作流

### 1. 前端开发

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 类型检查
npx vue-tsc --noEmit
```

#### 组件开发规范

- 使用 `<script setup lang="ts">` 语法
- Props 使用 TypeScript 接口定义
- 事件使用 `defineEmits` 声明
- 组件名使用 PascalCase

示例:
```vue
<script setup lang="ts">
interface Props {
  title: string
  count?: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  update: [value: string]
}>()
</script>
```

### 2. 后端开发

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 启动开发服务器
python main.py

# 或使用 uvicorn (支持热重载)
uvicorn main:app --reload --port 8000
```

#### API 开发规范

- 所有路由添加 `/api` 前缀
- 使用 Pydantic 模型验证请求/响应
- 需要认证的接口使用 `Depends(get_current_active_user)`
- 返回统一的错误格式

示例:
```python
@app.post("/api/resource", response_model=ResourceResponse)
async def create_resource(
    data: ResourceCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # 业务逻辑
    return resource
```

### 3. 数据库开发

#### 创建新模型

1. 在 `models.py` 中定义模型:
```python
class NewModel(Base):
    __tablename__ = "new_table"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
```

2. 运行迁移(自动创建表):
```python
from database import Base, engine
Base.metadata.create_all(bind=engine)
```

#### 查询示例

```python
# 查询所有
items = db.query(Model).all()

# 条件查询
item = db.query(Model).filter(Model.id == 1).first()

# 分页
items = db.query(Model).offset(skip).limit(limit).all()

# 关联查询
user_with_diagrams = db.query(User).options(
    joinedload(User.diagrams)
).filter(User.id == user_id).first()
```

### 4. AI 服务开发

#### 添加新的 AI 提供商

1. 在 `ai_service.py` 中添加方法:
```python
async def _generate_with_new_provider(
    self,
    prompt: str,
    diagram_type: DiagramTypeEnum,
    model: Optional[str] = None
) -> str:
    # 实现 API 调用逻辑
    pass
```

2. 更新 `generate_diagram` 方法:
```python
if self.provider == "new_provider":
    return await self._generate_with_new_provider(...)
```

3. 添加配置:
```python
# config.py
NEW_PROVIDER_API_KEY: Optional[str] = None
NEW_PROVIDER_MODEL: str = "default-model"
```

## 测试

### 前端测试

```bash
# 运行单元测试
npm run test

# E2E 测试
npm run test:e2e
```

### 后端测试

```bash
# 安装测试依赖
pip install pytest pytest-asyncio httpx

# 运行测试
pytest tests/

# 查看覆盖率
pytest --cov=. tests/
```

## 调试技巧

### 前端调试

1. **Vue DevTools**: 安装浏览器扩展
2. **Console 日志**: 使用 `console.log()`
3. **断点调试**: 浏览器开发者工具 Sources 面板

### 后端调试

1. **打印日志**:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)
logger.debug("调试信息")
```

2. **交互式 API 文档**: http://localhost:8000/docs

3. **数据库查询日志**:
```python
# database.py
engine = create_engine(url, echo=True)  # 开启 SQL 日志
```

## 代码规范

### 前端

- ESLint + Prettier
- 组件名: PascalCase
- 文件名: kebab-case
- 类型定义: 单独的 `.ts` 文件

### 后端

- PEP 8 规范
- 类型注解: 使用 typing
- 文档字符串: 所有公共函数
- 格式化: Black (可选)

```bash
# 安装 Black
pip install black

# 格式化代码
black backend/
```

## Git 工作流

```bash
# 创建功能分支
git checkout -b feature/new-feature

# 提交代码
git add .
git commit -m "feat: 添加新功能"

# 推送到远程
git push origin feature/new-feature

# 合并到主分支
git checkout main
git merge feature/new-feature
```

### Commit 规范

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具相关

## 常用命令

```bash
# 前端
npm run dev          # 开发服务器
npm run build        # 构建生产版本
npm run preview      # 预览构建结果

# 后端
python main.py       # 启动服务
uvicorn main:app --reload  # 热重载

# Docker
docker-compose up -d       # 启动
docker-compose logs -f     # 查看日志
docker-compose restart     # 重启
docker-compose down        # 停止
```

## 参考资料

- [Vue 3 文档](https://vuejs.org/)
- [FastAPI 文档](https://fastapi.tiangolo.com/)
- [Mermaid 文档](https://mermaid.js.org/)
- [Excalidraw 文档](https://docs.excalidraw.com/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
