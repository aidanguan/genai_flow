from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base
import enum


class DiagramTypeEnum(str, enum.Enum):
    MERMAID = "MERMAID"
    EXCALIDRAW = "EXCALIDRAW"


class RoleEnum(str, enum.Enum):
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"


class PermissionEnum(str, enum.Enum):
    VIEW = "view"
    EDIT = "edit"


class EntityTypeEnum(str, enum.Enum):
    USER = "user"
    TEAM = "team"


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    
    # 关系
    diagrams = relationship("Diagram", back_populates="owner")
    team_members = relationship("TeamMember", back_populates="user")
    comments = relationship("Comment", back_populates="user")


class Diagram(Base):
    __tablename__ = "diagrams"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    diagram_type = Column(Enum(DiagramTypeEnum), nullable=False)
    render_engine = Column(Enum(DiagramTypeEnum), nullable=False)
    mermaid_code = Column(Text, nullable=True)
    excalidraw_data = Column(JSON, nullable=True)
    thumbnail_url = Column(String(500), nullable=True)
    cache_image_url = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    tags = Column(JSON, nullable=True)
    is_public = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    # 关系
    owner = relationship("User", back_populates="diagrams")
    permissions = relationship("DiagramPermission", back_populates="diagram")
    versions = relationship("DiagramVersion", back_populates="diagram")
    comments = relationship("Comment", back_populates="diagram")


class Team(Base):
    __tablename__ = "teams"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 关系
    members = relationship("TeamMember", back_populates="team")


class TeamMember(Base):
    __tablename__ = "team_members"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    role = Column(Enum(RoleEnum), nullable=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关系
    team = relationship("Team", back_populates="members")
    user = relationship("User", back_populates="team_members")


class DiagramPermission(Base):
    __tablename__ = "diagram_permissions"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    diagram_id = Column(Integer, ForeignKey("diagrams.id"), nullable=False, index=True)
    entity_type = Column(Enum(EntityTypeEnum), nullable=False)
    entity_id = Column(Integer, nullable=False)
    permission = Column(Enum(PermissionEnum), nullable=False)
    granted_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关系
    diagram = relationship("Diagram", back_populates="permissions")


class DiagramVersion(Base):
    __tablename__ = "diagram_versions"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    diagram_id = Column(Integer, ForeignKey("diagrams.id"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False)
    mermaid_code = Column(Text, nullable=True)
    excalidraw_data = Column(JSON, nullable=True)
    changed_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    change_description = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关系
    diagram = relationship("Diagram", back_populates="versions")


class Comment(Base):
    __tablename__ = "comments"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    diagram_id = Column(Integer, ForeignKey("diagrams.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    parent_id = Column(Integer, ForeignKey("comments.id"), nullable=True)
    content = Column(Text, nullable=False)
    position_x = Column(Integer, nullable=True)
    position_y = Column(Integer, nullable=True)
    element_id = Column(String(100), nullable=True)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 关系
    diagram = relationship("Diagram", back_populates="comments")
    user = relationship("User", back_populates="comments")


class Template(Base):
    __tablename__ = "templates"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)
    diagram_type = Column(Enum(DiagramTypeEnum), nullable=False)
    render_engine = Column(Enum(DiagramTypeEnum), nullable=False)
    mermaid_code = Column(Text, nullable=True)
    excalidraw_data = Column(JSON, nullable=True)
    thumbnail_url = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    usage_count = Column(Integer, default=0)
    is_featured = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
