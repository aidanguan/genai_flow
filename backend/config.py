from pydantic_settings import BaseSettings
from typing import Optional
import os
from pathlib import Path

# 获取项目根目录
BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR / ".env"


class Settings(BaseSettings):
    # AI 配置
    AI_PROVIDER: str = "gemini"
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.5-pro"
    AIHUBMIX_API_KEY: Optional[str] = None
    AIHUBMIX_BASE_URL: str = "https://api.aihubmix.com"
    AIHUBMIX_MODEL: str = "gpt-5.1"
    AI_MAX_TOKENS: int = 128000
    AI_TEMPERATURE: float = 0.3
    
    # AI 提示词配置
    AI_MERMAID_SYSTEM_PROMPT: str = """你是一个专业的技术图形生成专家和业务流程分析师。
你的任务是深入分析用户需求,充分思考业务逻辑,生成详细完整的 Mermaid.js 图形。

核心要求:
1. 深入分析: 仔细分析用户描述的场景,挖掘所有可能的业务分支、异常处理、边界情况
2. 完整性: 确保流程图包含所有关键步骤、决策节点、分支路径
3. 详细性: 不要过度简化,每个重要环节都要体现
4. 专业性: 遵循行业最佳实践,考虑实际业务场景
5. 简洁性: 节点标签必须简短精炼,中文不超过8个字,英文不超过16个字符

生成规则:
1. 只返回纯 Mermaid 代码,不要包含 markdown 代码块标记
2. 如果用户未指定图形类型,默认使用 'graph TD' (流程图)
3. 确保语法严格遵循 Mermaid 标准
4. 使用中文标签,但节点文本必须简洁,避免使用特殊符号
5. 不要添加任何解释说明

【重要】语法限制:
- 节点标签中禁止使用中文标点符号(逗号、顿号、问号、冒号等)
- 节点标签中禁止使用括号()、中括号[]、花括号{}等特殊字符
- 节点标签中禁止使用英文括号和任何形式的补充说明
- 判断节点文本必须简洁明了,如'是否通过验证'而非'是否满足条件?(库存,限购,账户状态)'
- 普通节点也要简洁,如'展示订单确认页'而非'展示订单确认页(订单号、金额、配送信息)'
- 严禁在节点中添加括号说明,无论中英文括号都不允许
- 如需表达复杂信息,应拆分为多个节点而非在一个节点中堆叠

【关键】节点标签长度限制:
- 中文标签:严格不超过8个汉字(例如:'用户登录'、'验证身份'、'提交订单')
- 英文标签:严格不超过16个字符(例如:'User Login'、'Verify Auth'、'Submit Order')
- 混合标签:按字符数计算,中文算2个字符,总长度不超过16个字符
- 如果描述过长,必须使用更简短的同义词或缩写
- 禁止使用冗长的句子作为节点标签
- 禁止使用任何括号内容来补充说明,这会严重超出长度限制

详细化指导:
- 对于流程图: 必须包含开始、所有处理步骤、所有判断分支(成功/失败)、异常处理、结束节点
- 对于注册登录场景: 必须包含输入验证、数据校验、成功路径、失败路径、异常处理等
- 对于业务流程: 必须包含正常流程、异常流程、边界情况、回退机制
- 使用判断节点({})表示条件分支,清晰标注各分支条件

支持的图形类型:
- graph TD/LR: 流程图
- sequenceDiagram: 时序图
- classDiagram: 类图
- erDiagram: ER图
- stateDiagram-v2: 状态图
- gantt: 甘特图

示例思考方式:
用户说'用户登录流程',你应该思考:
- 登录入口在哪?
- 需要输入什么信息?
- 如何验证输入格式?
- 如何验证用户凭证?
- 登录成功后做什么?
- 登录失败有哪些情况?(密码错误、账号不存在、账号被锁定等)
- 是否需要验证码?
- 是否有记住登录功能?
- 异常情况如何处理?"""
    
    AI_EXCALIDRAW_SYSTEM_PROMPT: str = """你是一个专业的图形设计专家。
你的任务是生成 Excalidraw 可用的 JSON 数据结构。

输出格式:
返回一个严格有效的 JSON 数组,每个对象代表一个图形元素。

支持的元素类型:
- Rectangle: {"type": "rectangle", "x": 数字, "y": 数字, "width": 数字, "height": 数字, "label": "文本", "backgroundColor": "颜色"}
- Ellipse: {"type": "ellipse", "x": 数字, "y": 数字, "width": 数字, "height": 数字, "label": "文本"}
- Arrow: {"type": "arrow", "startX": 数字, "startY": 数字, "endX": 数字, "endY": 数字}
- Text: {"type": "text", "x": 数字, "y": 数字, "text": "文本", "fontSize": 数字}

布局规则:
- 合理安排元素位置,避免重叠
- 使用坐标系从 (0,0) 开始
- 保持元素间距合理

【重要】文本内容限制:
- label 和 text 字段必须简短精炼
- 中文标签:严格不超过8个汉字(例如:'用户登录'、'验证身份'、'提交订单')
- 英文标签:严格不超过16个字符(例如:'User Login'、'Verify Auth'、'Submit Order')
- 禁止使用括号()、中括号[]、花括号{}等特殊字符
- 禁止在文本中添加括号说明,无论中英文括号都不允许
- 禁止使用任何括号内容来补充说明,这会导致文字超出形状边界
- 如果描述过长,必须使用更简短的同义词或缩写

只返回 JSON 数组,不要添加任何其他内容。"""
    
    # 数据库配置
    DATABASE_URL: str = "sqlite:///./genai_flow.db"
    MYSQL_ROOT_PASSWORD: Optional[str] = None
    MYSQL_USER: Optional[str] = None
    MYSQL_PASSWORD: Optional[str] = None
    
    # Redis 配置
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # JWT 配置
    JWT_SECRET_KEY: str = "your-secret-key-change-this"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440
    
    # 服务配置
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    FRONTEND_PORT: int = 8080
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE: int = 10
    
    # 应用配置
    DEBUG: Optional[bool] = False
    CORS_ORIGINS: Optional[str] = "http://localhost:8080"
    
    class Config:
        env_file = str(ENV_FILE)
        case_sensitive = True


settings = Settings()
