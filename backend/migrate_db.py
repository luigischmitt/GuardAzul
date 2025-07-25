#!/usr/bin/env python3
"""
🤖 Migração para adicionar campos AI na tabela denuncias
"""
from sqlalchemy import text
from database.connection import engine

def migrate_denuncias_table():
    """Adiciona campos de validação AI na tabela denuncias"""
    
    print("🗄️ Conectando ao PostgreSQL...")
    
    # Comandos SQL para adicionar colunas
    migration_sql = [
        "ALTER TABLE denuncias ADD COLUMN IF NOT EXISTS is_ai_validated BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE denuncias ADD COLUMN IF NOT EXISTS is_valid BOOLEAN DEFAULT NULL;", 
        "ALTER TABLE denuncias ADD COLUMN IF NOT EXISTS validation_score INTEGER DEFAULT 0;",
        "ALTER TABLE denuncias ADD COLUMN IF NOT EXISTS validation_details JSONB DEFAULT NULL;"
    ]
    
    with engine.connect() as conn:
        for sql in migration_sql:
            print(f"🔧 Executando: {sql}")
            conn.execute(text(sql))
        
        conn.commit()
        print("✅ Migração concluída com sucesso!")
        
        # Verificar se as colunas foram criadas
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'denuncias' 
            AND column_name IN ('is_ai_validated', 'is_valid', 'validation_score', 'validation_details')
            ORDER BY column_name;
        """))
        
        columns = [row[0] for row in result]
        print(f"🤖 Colunas AI criadas: {columns}")

if __name__ == "__main__":
    migrate_denuncias_table() 