"""
AI 服务模块 - 集成 Google Gemini 和 AIHubMix
"""
from typing import Optional, Literal
import httpx
from config import settings
from models import DiagramTypeEnum


class AIService:
    """AI 服务基类"""
    
    def __init__(self):
        self.provider = settings.AI_PROVIDER
    
    async def generate_diagram(
        self,
        prompt: str,
        diagram_type: DiagramTypeEnum,
        model: Optional[str] = None,
        chart_type: Optional[str] = "flowchart"
    ) -> str:
        """生成图形代码"""
        # 根据模型名判断使用哪个提供商
        model_name = model or settings.GEMINI_MODEL
        
        # Gemini 模型以 "gemini" 开头
        if model_name.startswith("gemini"):
            return await self._generate_with_gemini(prompt, diagram_type, model_name, chart_type)
        # 其他模型使用 AIHubMix
        else:
            return await self._generate_with_aihubmix(prompt, diagram_type, model_name, chart_type)
    
    async def _generate_with_gemini(
        self,
        prompt: str,
        diagram_type: DiagramTypeEnum,
        model: Optional[str] = None,
        chart_type: Optional[str] = "flowchart"
    ) -> str:
        """使用 Google Gemini 生成"""
        if not settings.GEMINI_API_KEY:
            raise ValueError("未配置 GEMINI_API_KEY")
        
        model_name = model or settings.GEMINI_MODEL
        
        # 构建系统提示词
        system_prompt = self._get_system_prompt(diagram_type, chart_type)
        
        # 调用 Gemini API
        url = f"https://generativelanguage.googleapis.com/v1/models/{model_name}:generateContent"
        
        headers = {
            "Content-Type": "application/json",
        }
        
        payload = {
            "contents": [{
                "parts": [{
                    "text": f"{system_prompt}\n\n用户需求: {prompt}"
                }]
            }],
            "generationConfig": {
                "temperature": settings.AI_TEMPERATURE,
                "maxOutputTokens": settings.AI_MAX_TOKENS,
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                headers=headers,
                json=payload,
                params={"key": settings.GEMINI_API_KEY},
                timeout=60.0
            )
            response.raise_for_status()
            data = response.json()
        
        # 提取生成的代码
        if "candidates" in data and len(data["candidates"]) > 0:
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            # 清理可能的 markdown 代码块标记
            text = text.replace("```mermaid", "").replace("```json", "").replace("```", "").strip()
            return text
        
        raise ValueError("AI 生成失败,未返回有效内容")
    
    async def _generate_with_aihubmix(
        self,
        prompt: str,
        diagram_type: DiagramTypeEnum,
        model: Optional[str] = None,
        chart_type: Optional[str] = "flowchart"
    ) -> str:
        """使用 AIHubMix 生成"""
        if not settings.AIHUBMIX_API_KEY:
            raise ValueError("未配置 AIHUBMIX_API_KEY")
        
        model_name = model or settings.AIHUBMIX_MODEL
        system_prompt = self._get_system_prompt(diagram_type, chart_type)
        
        url = f"{settings.AIHUBMIX_BASE_URL}/v1/chat/completions"
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.AIHUBMIX_API_KEY}"
        }
        
        payload = {
            "model": model_name,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            "temperature": settings.AI_TEMPERATURE,
            "max_completion_tokens": settings.AI_MAX_TOKENS
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                headers=headers,
                json=payload,
                timeout=60.0
            )
            response.raise_for_status()
            data = response.json()
        
        # 提取生成的代码
        if "choices" in data and len(data["choices"]) > 0:
            text = data["choices"][0]["message"]["content"]
            text = text.replace("```mermaid", "").replace("```json", "").replace("```", "").strip()
            return text
        
        raise ValueError("AI 生成失败,未返回有效内容")
    
    def _get_system_prompt(self, diagram_type: DiagramTypeEnum, chart_type: Optional[str] = "flowchart") -> str:
        """获取系统提示词"""
        if diagram_type == DiagramTypeEnum.MERMAID:
            # 图形类型映射
            chart_type_map = {
                'flowchart': 'graph TD',
                'sequence': 'sequenceDiagram',
                'class': 'classDiagram',
                'state': 'stateDiagram-v2',
                'er': 'erDiagram',
                'gantt': 'gantt',
                'pie': 'pie',
                'journey': 'journey',
                'architecture': 'architecture-beta'
            }
            
            mermaid_keyword = chart_type_map.get(chart_type, 'graph TD')
            
            # Architecture 架构图需要特殊的提示词
            if chart_type == 'architecture':
                return f"""{settings.AI_MERMAID_SYSTEM_PROMPT}

【重要】用户选择的图形类型: Architecture 架构图
你必须严格按照以下 Mermaid architecture-beta 语法生成代码:

【关键规则】:
1. 必须以 'architecture-beta' 开头
2. 使用 group 定义分组: group groupId(icon)[DisplayName]
   - icon 可选值: cloud, server, disk, database, internet, users 等
   - DisplayName 必须使用英文，不要使用中文
3. 使用 service 定义服务: service serviceId(icon)[DisplayName] in groupId
   - icon 可选值: server, disk, database, internet 等
   - DisplayName 必须使用英文，不要使用中文
   - 'in groupId' 指定服务所属分组
4. 使用连接符定义关系:
   - **只能在 service 之间建立连接，不能连接到 group**
   - serviceA:L -- R:serviceB  (左到右)
   - serviceA:T -- B:serviceB  (上到下)
   - L=Left, R=Right, T=Top, B=Bottom

示例 (包含 EC2、ELB、RDS - 注意全部使用英文):
architecture-beta
    group aws(cloud)[AWS Cloud]
    
    service elb(internet)[Load Balancer] in aws
    service ec2_1(server)[Web Server 1] in aws
    service ec2_2(server)[Web Server 2] in aws
    service api(server)[API Gateway] in aws
    service rds(database)[MySQL Database] in aws
    
    elb:B -- T:ec2_1
    elb:B -- T:ec2_2
    ec2_1:R -- L:api
    ec2_2:R -- L:api
    api:B -- T:rds

【关键注意事项】:
- 所有 ID 必须是单个单词(使用下划线连接，不含空格和中划线)
- **显示名称必须使用英文，不要使用中文** (例如: [Web Server] 而不是 [Web应用])
- 显示名称用方括号 [] 包裹
- 图标用圆括号 () 包裹
- 连接使用 :L :R :T :B 指定方向
- 常用图标: cloud, server, disk, database, internet, users
- 使用缩进来提高可读性
- 连接语法必须是 serviceA:方向 -- 方向:serviceB 的格式

【严格禁止】:
- 不要在方括号 [] 中使用中文字符
- 不要在 ID 中使用中文
- 不要遗漏冒号 : 或双横线 --
- **不要在连接关系中使用 group ID，只能使用 service ID**
- **不要让 service 连接到 group，group 不能作为连接的端点**

请严格遵守以上语法规则生成 architecture-beta 架构图代码。"""
            
            return f"""{settings.AI_MERMAID_SYSTEM_PROMPT}

【重要】用户选择的图形类型: {chart_type}
你必须严格使用 '{mermaid_keyword}' 作为图形起始关键字。
例如:
- 如果是流程图 (flowchart): 使用 'graph TD' 或 'graph LR'
- 如果是时序图 (sequence): 使用 'sequenceDiagram'
- 如果是类图 (class): 使用 'classDiagram'
- 如果是状态图 (state): 使用 'stateDiagram-v2'
- 如果是ER图 (er): 使用 'erDiagram'
- 如果是甘特图 (gantt): 使用 'gantt'
- 如果是饼图 (pie): 使用 'pie'
- 如果是旅程图 (journey): 使用 'journey'
- 如果是架构图 (architecture): 使用 'architecture-beta'

请根据用户选择的类型和提示词内容,生成对应类型的 Mermaid 图形代码。"""
        else:  # EXCALIDRAW
            return settings.AI_EXCALIDRAW_SYSTEM_PROMPT


# 全局 AI 服务实例
ai_service = AIService()
