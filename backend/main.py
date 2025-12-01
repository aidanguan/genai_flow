from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List, Optional
from pydantic import BaseModel, EmailStr
import uvicorn
import base64
from io import BytesIO

from config import settings
from database import get_db, Base, engine
from models import User, Diagram, DiagramTypeEnum
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_active_user
)
from ai_service import ai_service

# 创建数据库表
Base.metadata.create_all(bind=engine)

# 创建 FastAPI 应用
app = FastAPI(
    title="AI Graphics Flow API",
    description="AI 图形生成应用后端 API",
    version="1.0.0"
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:5177", "http://localhost:5178", "http://localhost:5179", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===== Pydantic 模型 =====

class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    avatar_url: Optional[str]
    
    class Config:
        from_attributes = True


class DiagramCreate(BaseModel):
    title: str
    diagram_type: DiagramTypeEnum
    mermaid_code: Optional[str] = None
    excalidraw_data: Optional[dict] = None


class DiagramResponse(BaseModel):
    id: int
    title: str
    diagram_type: DiagramTypeEnum
    render_engine: DiagramTypeEnum
    mermaid_code: Optional[str]
    excalidraw_data: Optional[dict]
    created_at: str
    updated_at: Optional[str]
    
    class Config:
        from_attributes = True


class AIGenerateRequest(BaseModel):
    prompt: str
    diagram_type: DiagramTypeEnum
    model: str = "gemini-3-pro"
    chart_type: Optional[str] = "flowchart"


class ExportRequest(BaseModel):
    svg_content: str
    format: str  # 'svg', 'png', 'pdf'
    filename: Optional[str] = None


# ===== API 路由 =====

@app.get("/")
async def root():
    """健康检查"""
    return {"status": "ok", "message": "AI Graphics Flow API is running"}


@app.post("/api/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """用户注册"""
    # 检查用户是否已存在
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="邮箱已被注册")
    
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="用户名已被使用")
    
    # 创建新用户
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hashed_password
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@app.post("/api/auth/login", response_model=Token)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """用户登录"""
    user = db.query(User).filter(User.email == user_data.email).first()
    
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误"
        )
    
    # 创建访问令牌
    access_token_expires = timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/api/users/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """获取当前用户信息"""
    return current_user


@app.post("/api/ai/generate")
async def generate_diagram(
    request: AIGenerateRequest,
    current_user: User = Depends(get_current_active_user)
):
    """AI 生成图形"""
    try:
        # 调用 AI 服务
        result = await ai_service.generate_diagram(
            prompt=request.prompt,
            diagram_type=request.diagram_type,
            model=request.model,
            chart_type=request.chart_type
        )
        
        return {
            "success": True,
            "diagram_type": request.diagram_type.value,
            "code" if request.diagram_type == DiagramTypeEnum.MERMAID else "data": result
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI 生成失败: {str(e)}"
        )


@app.post("/api/diagrams", response_model=DiagramResponse, status_code=status.HTTP_201_CREATED)
async def create_diagram(
    diagram_data: DiagramCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """创建图形"""
    new_diagram = Diagram(
        user_id=current_user.id,
        title=diagram_data.title,
        diagram_type=diagram_data.diagram_type,
        render_engine=diagram_data.diagram_type,
        mermaid_code=diagram_data.mermaid_code,
        excalidraw_data=diagram_data.excalidraw_data
    )
    
    db.add(new_diagram)
    db.commit()
    db.refresh(new_diagram)
    
    return new_diagram


@app.get("/api/diagrams", response_model=List[DiagramResponse])
async def get_diagrams(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取用户的图形列表"""
    diagrams = db.query(Diagram).filter(
        Diagram.user_id == current_user.id,
        Diagram.is_deleted == False
    ).offset(skip).limit(limit).all()
    
    return diagrams


@app.get("/api/diagrams/{diagram_id}", response_model=DiagramResponse)
async def get_diagram(
    diagram_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取单个图形"""
    diagram = db.query(Diagram).filter(
        Diagram.id == diagram_id,
        Diagram.user_id == current_user.id,
        Diagram.is_deleted == False
    ).first()
    
    if not diagram:
        raise HTTPException(status_code=404, detail="图形不存在")
    
    return diagram


@app.delete("/api/diagrams/{diagram_id}")
async def delete_diagram(
    diagram_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """删除图形"""
    diagram = db.query(Diagram).filter(
        Diagram.id == diagram_id,
        Diagram.user_id == current_user.id
    ).first()
    
    if not diagram:
        raise HTTPException(status_code=404, detail="图形不存在")
    
    diagram.is_deleted = True
    db.commit()
    
    return {"success": True, "message": "图形已删除"}


@app.post("/api/export")
async def export_diagram(
    request: ExportRequest,
    current_user: User = Depends(get_current_active_user)
):
    """导出图表为 SVG/PNG/PDF"""
    try:
        svg_content = request.svg_content
        export_format = request.format.lower()
        filename = request.filename or f"diagram.{export_format}"
        
        if export_format == 'svg':
            svg_bytes = svg_content.encode('utf-8')
            return StreamingResponse(
                BytesIO(svg_bytes),
                media_type="image/svg+xml",
                headers={"Content-Disposition": f"attachment; filename={filename}"}
            )
        elif export_format == 'png':
            # 返回 SVG,由前端使用 html2canvas 转换
            return {"success": True, "message": "请使用前端转换为 PNG"}
        elif export_format == 'pdf':
            # 返回 SVG,由前端使用 jsPDF 转换
            return {"success": True, "message": "请使用前端转换为 PDF"}
        else:
            raise HTTPException(status_code=400, detail="不支持的导出格式")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"导出失败: {str(e)}")


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.BACKEND_HOST,
        port=settings.BACKEND_PORT,
        reload=True
    )
