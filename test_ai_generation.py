#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
测试 AI 生成功能
"""
import httpx
import asyncio
import json

async def test_generate():
    """测试生成用户注册和登录流程图"""
    
    base_url = "http://localhost:8001"
    
    # 先注册一个测试用户
    print("👤 注册测试用户...")
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            register_response = await client.post(
                f"{base_url}/api/auth/register",
                json={
                    "username": "test_user_ai",
                    "email": "test_ai@example.com",
                    "password": "test123456"
                }
            )
            if register_response.status_code == 201:
                print("✅ 注册成功")
            elif register_response.status_code == 400:
                print("⚠️  用户已存在，继续登录...")
    except Exception as e:
        print(f"⚠️  注册失败: {e}，尝试登录...")
    
    # 登录获取 token
    print("🔐 登录获取 token...")
    async with httpx.AsyncClient(timeout=60.0) as client:
        login_response = await client.post(
            f"{base_url}/api/auth/login",
            json={
                "email": "test_ai@example.com",
                "password": "test123456"
            }
        )
        login_response.raise_for_status()
        token_data = login_response.json()
        access_token = token_data["access_token"]
        print("✅ 登录成功\n")
    
    prompt = """创建一个详细的用户注册和登录流程图，需要包含：
1. 注册流程：邮箱验证、密码强度检查、验证码校验
2. 登录流程：账号密码验证、登录成功/失败分支、异常处理
3. 请包含所有可能的分支和错误处理"""
    
    payload = {
        "prompt": prompt,
        "diagram_type": "MERMAID",
        "model": "gemini-3-pro"
    }
    
    print("🚀 开始测试 AI 生成...")
    print(f"📝 提示词: {prompt}\n")
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{base_url}/api/ai/generate",
                json=payload,
                headers={"Authorization": f"Bearer {access_token}"}
            )
            response.raise_for_status()
            
            result = response.json()
            print("✅ 生成成功！\n")
            print("=" * 80)
            print("生成的 Mermaid 代码：")
            print("=" * 80)
            code = result.get("code", "")
            print(code)
            print("=" * 80)
            
            # 统计行数和节点数
            lines = code.strip().split("\n")
            print(f"\n📊 统计信息:")
            print(f"   - 总行数: {len(lines)}")
            print(f"   - 包含 --> 的连接: {sum(1 for line in lines if '-->' in line)}")
            print(f"   - 包含判断节点 {{}}: {sum(1 for line in lines if '{' in line and '}' in line)}")
            print(f"   - 包含分支标签 (|): {sum(1 for line in lines if '|' in line and ('-->' in line or '---' in line))}")
            
    except Exception as e:
        print(f"❌ 生成失败: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_generate())
