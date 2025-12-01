#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
调试 AIHubMix API
"""
import sys
sys.path.append('/Users/aidanguan/Project/genai_flow/backend')

import asyncio
import httpx
from config import settings

async def test_aihubmix():
    """测试 AIHubMix API"""
    
    url = f"{settings.AIHUBMIX_BASE_URL}/v1/chat/completions"
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.AIHUBMIX_API_KEY}"
    }
    
    # 先测试简单的请求
    payload = {
        "model": "gpt-5.1",
        "messages": [
            {"role": "system", "content": "你是一个助手"},
            {"role": "user", "content": "你好"}
        ],
        "temperature": 0.3,
        "max_tokens": 100
    }
    
    print("🚀 测试 AIHubMix API...")
    print(f"📍 URL: {url}")
    print(f"🔑 API Key: {settings.AIHUBMIX_API_KEY[:20]}...")
    print(f"📦 Payload: {payload}\n")
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url,
                headers=headers,
                json=payload
            )
            
            print(f"📊 Status Code: {response.status_code}")
            print(f"📄 Response Headers: {dict(response.headers)}")
            print(f"📝 Response Body:")
            print(response.text)
            
            if response.status_code == 200:
                print("\n✅ API 调用成功！")
                data = response.json()
                if "choices" in data:
                    print(f"💬 回复: {data['choices'][0]['message']['content']}")
            else:
                print(f"\n❌ API 调用失败")
                
    except Exception as e:
        print(f"❌ 请求失败: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_aihubmix())
