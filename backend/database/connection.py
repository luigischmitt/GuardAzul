import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import pathlib

# Carregar .env da raiz do projeto (pasta pai da pasta backend)
root_dir = pathlib.Path(__file__).parent.parent
env_path = root_dir / '.env'
load_dotenv(dotenv_path=env_path)

print(f"📁 Carregando variáveis de ambiente de: {env_path}")

# URL do banco PostgreSQL
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://postgres:123456@localhost:5432/guarda-azul-db"
)

print(f"🐘 Conectando ao PostgreSQL: {DATABASE_URL}")

# Engine do SQLAlchemy
engine = create_engine(DATABASE_URL)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para os modelos
Base = declarative_base()

# Dependency para FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
