#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
直接测试 AI 服务
"""
import sys
sys.path.append('/Users/aidanguan/Project/genai_flow/backend')

import asyncio
import os
os.environ['AI_PROVIDER'] = 'aihubmix'  # 使用 AIHubMix

from ai_service import ai_service
from models import DiagramTypeEnum

async def test():
    prompt = """创建一个详细的用户注册和登录流程图，必须包含：
    
1. 注册流程：
   - 用户输入邮箱、密码
   - 邮箱格式验证
   - 密码强度检查
   - 发送验证码
   - 验证码校验（成功/失败）
   - 注册成功/失败分支

2. 登录流程：
   - 输入账号密码
   - 账号存在性检查
   - 密码校验
   - 登录成功 -> 跳转主页
   - 登录失败分支：
     * 账号不存在
     * 密码错误
     * 账号被锁定
   - 异常处理

请生成一个完整、详细的流程图，包含所有判断节点和分支。"""
    
    print("🚀 测试 AI 生成 (GPT 5.1 - AIHubMix)...")
    print(f"📝 提示词: {prompt}\n")
    
    try:
        result = await ai_service.generate_diagram(
            prompt=prompt,
            diagram_type=DiagramTypeEnum.MERMAID,
            model="gpt-5.1"
        )
        
        print("✅ 生成成功！\n")
        print("=" * 80)
        print(result)
        print("=" * 80)
        
        # 统计
        lines = result.strip().split("\n")
        print(f"\n📊 统计信息:")
        print(f"   - 总行数: {len(lines)}")
        print(f"   - 包含 --> 的连接: {sum(1 for line in lines if '-->' in line)}")
        print(f"   - 包含判断节点: {sum(1 for line in lines if '{' in line)}")
        
    except Exception as e:
        print(f"❌ 生成失败: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
