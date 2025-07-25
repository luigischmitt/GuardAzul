from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
import os
import json
import shutil
import uuid
from datetime import datetime
from pathlib import Path

# Imports da nossa estrutura
from database.connection import get_db, engine
from database.models import Base, User, Denuncia, Conversation, Message
from services.ai_validation_service import SmartDenunciaValidator
from chatbot.model import GeminiChatbot

# Criar tabelas no banco
print("🏗️ Criando tabelas no PostgreSQL...")
Base.metadata.create_all(bind=engine)
print("✅ Tabelas criadas com sucesso!")

# Inicializar validador AI
ai_validator = SmartDenunciaValidator()
print("🤖 Validador AI inicializado!")

# Configuração do FastAPI
app = FastAPI(
    title="🌊 Guarda Azul Backend API v2.0",
    description="API para denúncias de poluição marinha com chat integrado",
    version="2.0.0"
)

# Configuração CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuração de uploads
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# 🌊 Pydantic models
class DenunciaCreate(BaseModel):
    description: str
    latitude: float
    longitude: float
    address: Optional[str] = None
    category: str

# 🚀 Novo modelo para resposta de criação assíncrona
class DenunciaCreateResponse(BaseModel):
    success: bool
    message: str
    denuncia_id: int
    saved_at: str

class DenunciaResponse(BaseModel):
    id: int
    user_id: Optional[int]
    description: str
    latitude: float
    longitude: float
    address: Optional[str]
    category: str
    status: str
    image_filename: Optional[str]
    image_path: Optional[str]
    processed: bool
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class DenunciaList(BaseModel):
    id: int
    description: str
    latitude: float
    longitude: float
    address: Optional[str]
    category: str
    status: str
    image_filename: Optional[str]
    image_path: Optional[str]
    created_at: datetime
    is_ai_validated: Optional[bool] = False
    is_valid: Optional[bool] = None
    validation_score: Optional[int] = 0

    class Config:
        from_attributes = True

# Chat models
class ChatMessageRequest(BaseModel):
    conversation_id: Optional[int] = None
    message: str
    session_id: Optional[str] = None

class ChatMessageResponse(BaseModel):
    conversation_id: int
    session_id: str
    user_message: str
    bot_response: str
    conversation: Optional[dict] = None

# Função helper para salvar imagem
def save_image(image: UploadFile) -> tuple:
    """Salva a imagem e retorna (caminho_completo, nome_arquivo)"""
    try:
        image_filename = f"{uuid.uuid4().hex[:8]}.{image.filename.split('.')[-1]}"
        image_path = UPLOAD_DIR / image_filename
        
        with open(image_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        return str(image_path), image_filename
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao salvar imagem: {str(e)}")

def process_ai_validation_background(denuncia_id: int, image_path: str, 
                                         category: str, description: str, 
                                         location: dict):
    """🤖 Processa validação AI em background - VERSÃO SÍNCRONA"""
    try:
        print(f"🔄 Iniciando validação AI em background para denúncia {denuncia_id}")
        
        # Executar validação IA de forma síncrona
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            validation_result = loop.run_until_complete(
                ai_validator.validate_denuncia_complete(
                    image_path, category, description, location
                )
            )
        finally:
            loop.close()
        
        # Atualizar no banco
        from database.connection import SessionLocal
        db = SessionLocal()
        
        try:
            denuncia = db.query(Denuncia).filter(Denuncia.id == denuncia_id).first()
            if denuncia:
                denuncia.is_ai_validated = True
                denuncia.is_valid = validation_result["is_valid"]
                denuncia.validation_score = validation_result["confidence_score"]
                denuncia.validation_details = validation_result["details"]
                denuncia.status = "validated" if validation_result["is_valid"] else "rejected"
                
                db.commit()
                
                print(f"✅ Validação AI concluída para denúncia {denuncia_id}:")
                print(f"   🎯 Válida: {validation_result['is_valid']}")
                print(f"   📊 Score: {validation_result['confidence_score']}/100")
                print(f"   📋 Status: {denuncia.status}")
            
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ Erro na validação AI background: {e}")
        
        # Em caso de erro, marcar como "needs_manual_review"
        from database.connection import SessionLocal
        db = SessionLocal()
        try:
            denuncia = db.query(Denuncia).filter(Denuncia.id == denuncia_id).first()
            if denuncia:
                denuncia.status = "needs_manual_review"
                denuncia.is_ai_validated = False
                db.commit()
        finally:
            db.close()

@app.get("/")
async def root():
    """Endpoint raiz da API"""
    return {
        "message": "🌊 Guarda Azul Backend API v2.0 - ASYNC AI + CHAT",
        "database": "PostgreSQL",
        "status": "ativo",
        "features": {
            "async_ai_validation": True,
            "real_time_status": True,
            "chat_integration": True
        },
        "endpoints": {
            "denuncias": "/denuncias",
            "listar_denuncias": "/denuncias/list",
            "status_validacao": "/denuncias/{id}/status",
            "chat": "/chat",
            "mares": "/mares",
            "docs": "/docs"
        }
    }

@app.get("/mares")
async def obter_dados_mares():
    """Obter dados de marés e sol para o frontend"""
    try:
        # Buscar arquivo de dados atualizado
        data_file = Path("data/dados_hoje.json")
        
        if data_file.exists():
            with open(data_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            return {
                "success": True,
                "data": data,
                "last_update": datetime.now().isoformat(),
                "source": "arquivo_local"
            }
        else:
            # Dados padrão se não encontrar arquivo
            return {
                "success": True,
                "data": {
                    "location": "João Pessoa, PB",
                    "sunrise": "05:30",
                    "sunset": "17:45",
                    "tides": [
                        {"time": "06:15", "type": "baixa", "height": "0.2m"},
                        {"time": "12:30", "type": "alta", "height": "2.1m"},
                        {"time": "18:45", "type": "baixa", "height": "0.3m"}
                    ],
                    "temperature": "28°C",
                    "conditions": "Ensolarado"
                },
                "last_update": datetime.now().isoformat(),
                "source": "dados_padrão"
            }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao obter dados de marés: {str(e)}")

@app.post("/denuncias", response_model=DenunciaCreateResponse)
async def criar_denuncia(
    background_tasks: BackgroundTasks,
    image: Optional[UploadFile] = File(None),
    description: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    address: Optional[str] = Form(None),
    category: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    🌊 Criar nova denúncia com validação AI assíncrona
    
    A denúncia é salva imediatamente e a validação AI é processada em background.
    Use o endpoint /denuncias/{id}/status para acompanhar o progresso.
    """
    try:
        # Salvar imagem se fornecida
        image_path = None
        image_filename = None
        
        if image:
            image_path, image_filename = save_image(image)
        
        # Criar nova denúncia no banco (status inicial: pending_validation)
        nova_denuncia = Denuncia(
            description=description,
            latitude=latitude,
            longitude=longitude,
            address=address,
            category=category,
            status="pending_validation",  # 🔄 Status inicial para AI async
            image_filename=image_filename,
            image_path=image_path,
            processed=False,
            is_ai_validated=False,  # 🤖 Ainda não validado
            is_valid=None,          # 🔍 Ainda não analisado
            validation_score=0      # 📊 Score inicial
        )
        
        db.add(nova_denuncia)
        db.commit()
        db.refresh(nova_denuncia)
        
        print(f"✅ Denúncia {nova_denuncia.id} salva no PostgreSQL")
        
        # 🚀 EXECUTAR VALIDAÇÃO AI EM BACKGROUND (se tem imagem)
        if image_path:
            location_dict = {
                "latitude": latitude,
                "longitude": longitude,
                "address": address or f"Lat: {latitude}, Long: {longitude}"
            }
            
            background_tasks.add_task(
                process_ai_validation_background,
                nova_denuncia.id,
                image_path,
                category,
                description,
                location_dict
            )
            print(f"🤖 Validação AI agendada para background (ID: {nova_denuncia.id})")
        
        return {
            "success": True,
            "message": "Denúncia recebida! Validação AI em progresso...",
            "denuncia_id": nova_denuncia.id,
            "saved_at": nova_denuncia.created_at.isoformat()
        }
        
    except Exception as e:
        db.rollback()
        print(f"❌ Erro ao criar denúncia: {e}")
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@app.get("/denuncias/{denuncia_id}/status")
async def get_validation_status(denuncia_id: int, db: Session = Depends(get_db)):
    """🔍 Consultar status da validação AI de uma denúncia específica"""
    try:
        denuncia = db.query(Denuncia).filter(Denuncia.id == denuncia_id).first()
        
        if not denuncia:
            raise HTTPException(status_code=404, detail="Denúncia não encontrada")
        
        # Determinar status detalhado
        if not denuncia.is_ai_validated:
            if denuncia.status == "pending_validation":
                status_message = "🔄 Analisando com AI..."
            elif denuncia.status == "needs_manual_review":
                status_message = "⚠️ Requer revisão manual"
            else:
                status_message = "📋 Processando..."
        else:
            if denuncia.is_valid:
                status_message = f"✅ Aprovada (Score: {denuncia.validation_score}/100)"
            else:
                status_message = f"❌ Rejeitada (Score: {denuncia.validation_score}/100)"
        
        return {
            "denuncia_id": denuncia_id,
            "status": denuncia.status,
            "is_ai_validated": denuncia.is_ai_validated,
            "is_valid": denuncia.is_valid,
            "validation_score": denuncia.validation_score,
            "status_message": status_message,
            "details": denuncia.validation_details if denuncia.validation_details else {}
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao consultar status: {str(e)}")

@app.get("/denuncias/list", response_model=List[DenunciaList])
async def listar_denuncias(db: Session = Depends(get_db)):
    """Listar todas as denúncias com informações básicas"""
    try:
        denuncias = db.query(Denuncia).order_by(Denuncia.created_at.desc()).all()
        return [DenunciaList.from_orm(denuncia) for denuncia in denuncias]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar denúncias: {str(e)}")

@app.get("/denuncias/validated", response_model=List[DenunciaList])
async def listar_denuncias_validadas(db: Session = Depends(get_db)):
    """🤖 Listar denúncias validadas pela AI (score >= 65)"""
    try:
        denuncias = db.query(Denuncia).filter(
            Denuncia.is_ai_validated == True,
            Denuncia.is_valid == True,
            Denuncia.validation_score >= 65
        ).order_by(Denuncia.created_at.desc()).all()
        
        return [DenunciaList.from_orm(denuncia) for denuncia in denuncias]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar denúncias validadas: {str(e)}")

@app.get("/denuncias/{denuncia_id}", response_model=DenunciaList)
async def obter_denuncia(denuncia_id: int, db: Session = Depends(get_db)):
    """Obter denúncia específica por ID"""
    denuncia = db.query(Denuncia).filter(Denuncia.id == denuncia_id).first()
    
    if not denuncia:
        raise HTTPException(status_code=404, detail="Denúncia não encontrada")
    
    return DenunciaList.from_orm(denuncia)

# === ENDPOINTS DE CHAT ===

@app.post("/chat/message", response_model=ChatMessageResponse)
async def enviar_mensagem_chat(
    request: ChatMessageRequest,
    db: Session = Depends(get_db)
):
    """
    💬 Enviar mensagem para o chatbot Nereu
    """
    try:
        # Instanciar o chatbot com sessão do banco
        chatbot = GeminiChatbot(
            session_id=request.session_id,
            db_session=db
        )
        
        # Gerar resposta usando método correto
        resultado = chatbot.gerar_resposta(request.message)
        
        # Buscar a conversa atualizada
        conversa = db.query(Conversation).filter(
            Conversation.session_id == resultado['session_id']
        ).first()
        
        return ChatMessageResponse(
            conversation_id=conversa.id if conversa else 0,
            session_id=resultado['session_id'],
            user_message=request.message,
            bot_response=resultado['resposta'],
            conversation={
                "id": conversa.id if conversa else 0,
                "session_id": resultado['session_id'],
                "title": conversa.title if conversa else "Nova conversa",
                "created_at": conversa.created_at.isoformat() if conversa else ""
            }
        )
        
    except Exception as e:
        print(f"❌ Erro no chat: {e}")
        raise HTTPException(status_code=500, detail=f"Erro no chat: {str(e)}")

@app.get("/chat/conversations")
async def listar_conversas(db: Session = Depends(get_db)):
    """📋 Listar todas as conversas do chat"""
    try:
        conversas = db.query(Conversation).order_by(Conversation.last_message_at.desc()).all()
        
        resultado = []
        for conversa in conversas:
            # Pegar última mensagem
            ultima_mensagem = db.query(Message).filter(
                Message.conversation_id == conversa.id
            ).order_by(Message.created_at.desc()).first()
            
            resultado.append({
                "id": conversa.id,
                "session_id": conversa.session_id,
                "title": conversa.title,
                "created_at": conversa.created_at.isoformat(),
                "ultima_mensagem": ultima_mensagem.content if ultima_mensagem else "Sem mensagens",
                "ultima_atividade": ultima_mensagem.created_at.isoformat() if ultima_mensagem else conversa.created_at.isoformat()
            })
        
        return {"conversations": resultado}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar conversas: {str(e)}")

@app.get("/chat/conversation/{conversation_id}")
async def obter_conversa(conversation_id: int, db: Session = Depends(get_db)):
    """💬 Obter histórico completo de uma conversa"""
    try:
        conversa = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        
        if not conversa:
            raise HTTPException(status_code=404, detail="Conversa não encontrada")
        
        messages = db.query(Message).filter(
            Message.conversation_id == conversation_id
        ).order_by(Message.created_at).all()
        
        return {
            "conversation": {
                "id": conversa.id,
                "session_id": conversa.session_id,
                "title": conversa.title,
                "created_at": conversa.created_at.isoformat()
            },
            "messages": [
                {
                    "id": msg.id,
                    "role": msg.role,
                    "content": msg.content,
                    "created_at": msg.created_at.isoformat()
                }
                for msg in messages
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao obter conversa: {str(e)}")

@app.post("/chat/conversation/new")
async def nova_conversa(title: str = "Nova conversa", db: Session = Depends(get_db)):
    """🆕 Criar nova conversa"""
    try:
        import uuid
        session_id = str(uuid.uuid4())
        
        nova_conversa = Conversation(
            session_id=session_id,
            title=title,
            is_active=True,
            created_at=datetime.now()
        )
        
        db.add(nova_conversa)
        db.commit()
        db.refresh(nova_conversa)
        
        return {
            "conversation_id": nova_conversa.id,
            "session_id": nova_conversa.session_id,
            "title": nova_conversa.title,
            "created_at": nova_conversa.created_at.isoformat(),
            "message": "Nova conversa criada!"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao criar conversa: {str(e)}")

@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """🏥 Health check com teste do PostgreSQL"""
    try:
        # Testar conexão com banco
        total_denuncias = db.query(Denuncia).count()
        total_users = db.query(User).count()
        total_conversas = db.query(Conversation).count()
        total_mensagens = db.query(Message).count()
        
        return {
            "status": "healthy",
            "database": "PostgreSQL conectado ✅",
            "timestamp": datetime.now().isoformat(),
            "stats": {
                "total_denuncias": total_denuncias,
                "total_users": total_users,
                "total_conversas": total_conversas,
                "total_mensagens": total_mensagens
            }
        }
    except Exception as e:
        return {
            "status": "error",
            "database": f"PostgreSQL erro: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
    