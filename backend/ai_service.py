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
        model: Optional[str] = None
    ) -> str:
        """生成图形代码"""
        # 根据模型名判断使用哪个提供商
        model_name = model or settings.GEMINI_MODEL
        
        # Gemini 模型以 "gemini" 开头
        if model_name.startswith("gemini"):
            return await self._generate_with_gemini(prompt, diagram_type, model_name)
        # 其他模型使用 AIHubMix
        else:
            return await self._generate_with_aihubmix(prompt, diagram_type, model_name)
    
    async def _generate_with_gemini(
        self,
        prompt: str,
        diagram_type: DiagramTypeEnum,
        model: Optional[str] = None
    ) -> str:
        """使用 Google Gemini 生成"""
        if not settings.GEMINI_API_KEY:
            raise ValueError("未配置 GEMINI_API_KEY")
        
        model_name = model or settings.GEMINI_MODEL
        
        # 构建系统提示词
        system_prompt = self._get_system_prompt(diagram_type)
        
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
        model: Optional[str] = None
    ) -> str:
        """使用 AIHubMix 生成"""
        if not settings.AIHUBMIX_API_KEY:
            raise ValueError("未配置 AIHUBMIX_API_KEY")
        
        model_name = model or settings.AIHUBMIX_MODEL
        system_prompt = self._get_system_prompt(diagram_type)
        
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
    
    def _get_system_prompt(self, diagram_type: DiagramTypeEnum) -> str:
        """获取系统提示词"""
        if diagram_type == DiagramTypeEnum.MERMAID:
            return settings.AI_MERMAID_SYSTEM_PROMPT
        else:  # EXCALIDRAW
            return settings.AI_EXCALIDRAW_SYSTEM_PROMPT


# 全局 AI 服务实例
ai_service = AIService()
