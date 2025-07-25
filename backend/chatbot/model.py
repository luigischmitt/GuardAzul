import logging
from google import generativeai as genai
import os
import time
import uuid
from dotenv import load_dotenv
import pathlib
from .prompts.contexto import contexto_chatbot
from typing import List, Optional
from sqlalchemy.orm import Session
import json


# Carregar .env da raiz do projeto (pasta pai da pasta pai da pasta atual)
root_dir = pathlib.Path(__file__).parent.parent.parent
env_path = root_dir / '.env'
load_dotenv(dotenv_path=env_path)

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[logging.StreamHandler()]
)

def carregar_dados_oceanicos() -> str:
    """
    Carrega dados oceânicos atuais do arquivo JSON e converte para string
    
    Returns:
        str: Dados formatados como string para incluir no contexto do chatbot
    """
    try:
        # Caminho para o arquivo de dados
        data_dir = pathlib.Path(__file__).parent.parent / "data"
        dados_file = data_dir / "dados_hoje.json"
        
        if not dados_file.exists():
            logging.warning("Arquivo dados_hoje.json não encontrado")
            return ""
        
        # Ler dados JSON
        with open(dados_file, 'r', encoding='utf-8') as f:
            dados = json.load(f)
        
        # Formatar dados para o contexto
        dados_formatados = []
        dados_formatados.append(f"📅 Data: {dados.get('date', 'N/A')}")
        dados_formatados.append(f"📍 Local: {dados.get('location', 'João Pessoa, PB')}")
        
        # Informações do sol
        if dados.get('nascer_sol'):
            dados_formatados.append(f"🌅 Nascer do sol: {dados['nascer_sol']}")
        if dados.get('por_sol'):
            dados_formatados.append(f"🌇 Pôr do sol: {dados['por_sol']}")
        
        # Informações da lua
        if dados.get('nascer_lua'):
            dados_formatados.append(f"🌙 Nascer da lua: {dados['nascer_lua']}")
        if dados.get('por_lua'):
            dados_formatados.append(f"🌙 Pôr da lua: {dados['por_lua']}")
        if dados.get('fase_lua'):
            dados_formatados.append(f"🌙 Fase da lua: {dados['fase_lua']}")
        
        # Marés (formatadas de forma mais legível)
        if dados.get('mares'):
            dados_formatados.append("\n🌊 MARÉS DE HOJE:")
            for i, mare in enumerate(dados['mares'], 1):
                dados_formatados.append(f"   {i}. {mare}")
        
        # Ondas
        if dados.get('ondas_max') or dados.get('ondas_min'):
            dados_formatados.append(f"\n🌊 Ondas: {dados.get('ondas_min', 'N/A')} - {dados.get('ondas_max', 'N/A')}")
        
        # Atividade dos peixes
        if dados.get('atividade_peixes'):
            dados_formatados.append(f"🐟 Atividade de peixes: {dados['atividade_peixes']}")
        
        return "\n".join(dados_formatados)
        
    except Exception as e:
        logging.error(f"Erro ao carregar dados oceânicos: {e}")
        return ""

class GeminiChatbot:
    def __init__(self, model_name="gemini-2.0-flash-exp", session_id: str = None, db_session: Session = None):
        self.api_key = os.getenv("GEMINI_API_KEY")
        
        if not self.api_key:
            logging.error("API key do Gemini não fornecida, ou não está no arquivo .env.")
            raise ValueError("API key do Gemini não fornecida, ou não está no arquivo .env.")
        
        try:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel(model_name)
            logging.info(f"Modelo '{model_name}' inicializado com sucesso.")
        except Exception as e:
            logging.error(f"Erro ao inicializar o modelo: {e}")
            raise
            
        # Configuração da sessão
        self.session_id = session_id or str(uuid.uuid4())
        self.db_session = db_session
        
        # Carregar dados oceânicos atuais e incluir no contexto
        dados_oceanicos = carregar_dados_oceanicos()
        self.contexto_base = contexto_chatbot(dados_oceanicos)
        print(self.contexto_base)
        
        # Cache do histórico em memória para performance
        self._historico_cache = None

    def _carregar_historico_do_banco(self) -> List[str]:
        """Carrega o histórico da conversa do banco de dados"""
        if not self.db_session:
            return [self.contexto_base]
            
        try:
            from database.models import Conversation, Message
            
            # Buscar a conversa
            conversa = self.db_session.query(Conversation).filter(
                Conversation.session_id == self.session_id
            ).first()
            
            if not conversa:
                return [self.contexto_base]
            
            # Buscar mensagens ordenadas por data
            mensagens = self.db_session.query(Message).filter(
                Message.conversation_id == conversa.id
            ).order_by(Message.created_at).all()
            
            # Construir histórico
            historico = [self.contexto_base]
            for msg in mensagens:
                if msg.role == "user":
                    historico.append(f"Usuário: {msg.content}")
                else:
                    historico.append(f"Chatbot: {msg.content}")
            
            return historico
            
        except Exception as e:
            logging.error(f"Erro ao carregar histórico do banco: {e}")
            return [self.contexto_base]

    def _salvar_mensagem_no_banco(self, role: str, content: str, tokens_used: int = None, response_time: float = None):
        """Salva uma mensagem no banco de dados"""
        if not self.db_session:
            return
            
        try:
            from database.models import Conversation, Message
            
            # Buscar ou criar conversa
            conversa = self.db_session.query(Conversation).filter(
                Conversation.session_id == self.session_id
            ).first()
            
            if not conversa:
                # Criar nova conversa
                title = content[:50] + "..." if len(content) > 50 else content
                conversa = Conversation(
                    session_id=self.session_id,
                    title=title if role == "user" else "Nova conversa"
                )
                self.db_session.add(conversa)
                self.db_session.commit()
                self.db_session.refresh(conversa)
            
            # Criar mensagem
            mensagem = Message(
                conversation_id=conversa.id,
                content=content,
                role=role,
                tokens_used=tokens_used,
                response_time=response_time
            )
            
            self.db_session.add(mensagem)
            
            # Atualizar timestamp da conversa
            from sqlalchemy.sql import func
            conversa.last_message_at = func.now()
            
            self.db_session.commit()
            
            # Invalidar cache
            self._historico_cache = None
            
        except Exception as e:
            logging.error(f"Erro ao salvar mensagem no banco: {e}")
            self.db_session.rollback()

    def get_historico(self) -> List[str]:
        """Retorna o histórico da conversa (com cache)"""
        if self._historico_cache is None:
            self._historico_cache = self._carregar_historico_do_banco()
        return self._historico_cache

    def adicionar_mensagem_local(self, autor: str, mensagem: str):
        """Adiciona mensagem ao cache local (para compatibilidade)"""
        if self._historico_cache is None:
            self._historico_cache = self.get_historico()
        self._historico_cache.append(f"{autor}: {mensagem}")

    def gerar_resposta(self, mensagem_usuario: str, user_id: int = None) -> dict:
        """
        Gera resposta do chatbot e salva no banco
        
        Returns:
            dict: {
                'resposta': str,
                'session_id': str,
                'tokens_used': int,
                'response_time': float
            }
        """
        start_time = time.time()
        
        try:
            # Salvar mensagem do usuário
            self._salvar_mensagem_no_banco("user", mensagem_usuario)
            
            # Adicionar ao cache local
            self.adicionar_mensagem_local("Usuário", mensagem_usuario)
            
            # Construir prompt com histórico
            historico = self.get_historico()
            prompt_total = "\n".join(historico)
            
            # Gerar resposta
            response = self.model.generate_content(
                prompt_total,
                generation_config={
                    "temperature": 0.7,
                    "max_output_tokens": 1024,
                }
            )
            
            resposta = response.text if hasattr(response, 'text') else str(response)
            response_time = time.time() - start_time
            
            # Tentar extrair informações de tokens (se disponível)
            tokens_used = None
            if hasattr(response, 'usage_metadata'):
                tokens_used = getattr(response.usage_metadata, 'total_token_count', None)
            
            # Salvar resposta do chatbot
            self._salvar_mensagem_no_banco("assistant", resposta, tokens_used, response_time)
            
            # Adicionar ao cache local
            self.adicionar_mensagem_local("Chatbot", resposta)
            
            logging.info(f"Resposta gerada em {response_time:.2f}s")
            
            return {
                'resposta': resposta,
                'session_id': self.session_id,
                'tokens_used': tokens_used,
                'response_time': response_time
            }
            
        except Exception as e:
            logging.error(f"Erro ao gerar resposta: {e}")
            return {
                'resposta': f"Desculpe, ocorreu um erro inesperado. Tente novamente.",
                'session_id': self.session_id,
                'tokens_used': None,
                'response_time': time.time() - start_time,
                'error': str(e)
            }

    def descrever_imagem(self, caminho_imagem, prompt=None):
        """Mantém funcionalidade original de descrição de imagem"""
        import PIL.Image
        if prompt is None:
            prompt = "Descreva o que está nesta imagem de forma objetiva e clara."
        try:
            imagem = PIL.Image.open(caminho_imagem)
        except Exception as e:
            logging.error(f"Erro ao carregar a imagem '{caminho_imagem}': {e}")
            return f"[Erro ao carregar imagem]: {e}"
        try:
            vision_model = genai.GenerativeModel("gemini-1.5-flash")
            response = vision_model.generate_content(
                [prompt, imagem],
                generation_config={
                    "temperature": 0.4,
                    "max_output_tokens": 256,
                },
            )
            descricao = response.text if hasattr(response, 'text') else str(response)
            logging.info(f"Descrição gerada para a imagem '{caminho_imagem}' com sucesso.")
            return descricao
        except Exception as e:
            logging.error(f"Erro ao descrever a imagem '{caminho_imagem}': {e}")
            return f"[Erro ao descrever imagem]: {e}"

    def obter_estatisticas_conversa(self) -> dict:
        """Retorna estatísticas da conversa atual"""
        if not self.db_session:
            return {"error": "Banco de dados não conectado"}
            
        try:
            from database.models import Conversation, Message
            
            conversa = self.db_session.query(Conversation).filter(
                Conversation.session_id == self.session_id
            ).first()
            
            if not conversa:
                return {"total_mensagens": 0, "conversa_ativa": False}
            
            total_mensagens = self.db_session.query(Message).filter(
                Message.conversation_id == conversa.id
            ).count()
            
            return {
                "total_mensagens": total_mensagens,
                "conversa_ativa": conversa.is_active,
                "criada_em": conversa.created_at.isoformat(),
                "ultima_mensagem": conversa.last_message_at.isoformat(),
                "titulo": conversa.title
            }
            
        except Exception as e:
            logging.error(f"Erro ao obter estatísticas: {e}")
            return {"error": str(e)}

# Exemplo de uso
if __name__ == "__main__":
    print(carregar_dados_oceanicos())
    # try:
    #     chatbot = GeminiChatbot()
    #     while True:
    #         print("\nO que você deseja fazer?")
    #         print("1. Conversar com o chatbot")
    #         print("2. Descrever imagem com Gemini")
    #         print("3. Sair")
    #         escolha = input("Escolha uma opção (1/2/3): ").strip()
    #         if escolha == "1":
    #             while True:
    #                 entrada = input("Você: ")
    #                 if entrada.strip().lower() in ["sair", "exit", "quit"]:
    #                     print("Chatbot: Até logo!")
    #                     break
    #                 resultado = chatbot.gerar_resposta(entrada)
    #                 print("Chatbot:", resultado['resposta'])
    #         elif escolha == "2":
    #             nome_arquivo = input("Digite o nome da imagem (ex: foto.png): ").strip()
    #             caminho = os.path.join(os.path.dirname(__file__), '..', 'uploads', nome_arquivo)
    #             caminho = os.path.abspath(caminho)
    #             if not os.path.isfile(caminho):
    #                 print(f"Arquivo '{nome_arquivo}' não encontrado em 'backend/uploads'.")
    #                 continue
    #             prompt = "Descreva o que está nesta imagem de forma objetiva e clara. Procure por elementos da natureza ou algum sinal de problema ambiental e informe-os na descrição. Caso não tenha relação com algum desses cenários, apenas retorne a descrição normalmente. Não faça comentários adicionais, apenas retorne a descrição."
    #             descricao = chatbot.descrever_imagem(caminho, prompt)
    #             print("Descrição da imagem:", descricao)
    #         elif escolha == "3":
    #             print("Saindo. Até logo!")
    #             break
    #         else:
    #             print("Opção inválida. Tente novamente.")
    # except Exception as e:
    #     print(f"[Falha crítica] {e}")
