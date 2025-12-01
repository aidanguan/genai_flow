#!/bin/bash

# AI Graphics Flow 项目启动脚本

echo "🚀 启动 AI Graphics Flow 项目..."

# 检查是否安装 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ 未检测到 Docker,请先安装 Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ 未检测到 docker-compose,请先安装 docker-compose"
    exit 1
fi

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "📝 创建 .env 文件..."
    cp .env.example .env
    echo "⚠️  请编辑 .env 文件,配置 AI API 密钥"
    echo "   GEMINI_API_KEY 或 AIHUBMIX_API_KEY"
fi

# 启动方式选择
echo ""
echo "请选择启动方式:"
echo "1) Docker 容器化部署 (推荐)"
echo "2) 本地开发模式"
read -p "请输入选项 (1 或 2): " choice

if [ "$choice" == "1" ]; then
    echo ""
    echo "🐳 使用 Docker 启动服务..."
    docker-compose up -d
    echo ""
    echo "✅ 服务已启动!"
    echo "   前端: http://localhost:8080"
    echo "   后端 API: http://localhost:8000"
    echo "   API 文档: http://localhost:8000/docs"
    echo ""
    echo "查看日志: docker-compose logs -f"
    echo "停止服务: docker-compose down"
    
elif [ "$choice" == "2" ]; then
    echo ""
    echo "💻 启动本地开发模式..."
    
    # 启动后端
    echo "启动后端服务..."
    cd backend
    if [ ! -d "venv" ]; then
        echo "创建 Python 虚拟环境..."
        python3 -m venv venv
    fi
    source venv/bin/activate
    pip install -r requirements.txt > /dev/null 2>&1
    python main.py &
    BACKEND_PID=$!
    cd ..
    
    # 启动前端
    echo "启动前端服务..."
    cd frontend
    if [ ! -d "node_modules" ]; then
        echo "安装前端依赖..."
        npm install
    fi
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    
    echo ""
    echo "✅ 开发服务已启动!"
    echo "   前端: http://localhost:5173"
    echo "   后端: http://localhost:8000"
    echo ""
    echo "按 Ctrl+C 停止所有服务"
    
    # 等待用户中断
    trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
    wait
else
    echo "无效的选项"
    exit 1
fi
