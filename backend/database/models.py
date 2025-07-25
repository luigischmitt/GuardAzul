from sqlalchemy import Column, Integer, String, Text, Float, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .connection import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relacionamentos
    denuncias = relationship("Denuncia", back_populates="user")
    conversations = relationship("Conversation", back_populates="user")

class Denuncia(Base):
    __tablename__ = "denuncias"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Permitir denúncias anônimas
    
    # Dados principais
    description = Column(Text, nullable=False)
    
    # Localização
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String(500), nullable=True)
    
    # Categoria e status
    category = Column(String(50), default="poluicao_marinha")
    status = Column(String(50), default="recebida")  # recebida, em_analise, resolvida
    
    # Arquivos
    image_filename = Column(String(255), nullable=True)
    image_path = Column(String(500), nullable=True)
    
    # 🤖 Campos de validação AI
    is_ai_validated = Column(Boolean, default=False)
    is_valid = Column(Boolean, default=None)
    validation_score = Column(Integer, default=0)
    validation_details = Column(JSON, default=None)
    
    # Metadados
    processed = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relacionamento com usuário
    user = relationship("User", back_populates="denuncias")

class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Permitir conversas anônimas
    session_id = Column(String(255), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=True)  # Título da conversa baseado no primeiro prompt
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_message_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relacionamentos
    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    
    # Conteúdo da mensagem
    content = Column(Text, nullable=False)
    role = Column(String(20), nullable=False)  # 'user' ou 'assistant'
    
    # Metadados
    tokens_used = Column(Integer, nullable=True)
    response_time = Column(Float, nullable=True)  # tempo de resposta em segundos
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relacionamento
    conversation = relationship("Conversation", back_populates="messages")
    