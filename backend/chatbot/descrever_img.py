import google.generativeai as genai
import PIL.Image
from dotenv import load_dotenv
import os
import pathlib

# Carregar .env da raiz do projeto (pasta pai da pasta pai da pasta atual)
root_dir = pathlib.Path(__file__).parent.parent.parent
env_path = root_dir / '.env'
load_dotenv(dotenv_path=env_path)

# Configure sua chave da API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Carregar a imagem com PIL (Pillow)
def carregar_imagem(caminho):
    return PIL.Image.open(caminho)

# Enviar imagem para o modelo Gemini e obter descrição
def descrever_imagem(caminho_imagem):
    imagem = carregar_imagem(caminho_imagem)

    model = genai.GenerativeModel("gemini-pro-vision")

    # Prompt simples pedindo uma descrição
    prompt = "Descreva o que está nesta imagem de forma objetiva e clara."

    try:
        response = model.generate_content(
            [prompt, imagem],
            generation_config={
                "temperature": 0.4,
                "max_output_tokens": 256,
            },
        )
        return response.text
    except Exception as e:
        return f"[Erro]: {e}"

# Exemplo de uso
if __name__ == "__main__":
    caminho = "exemplo.jpg"  # Troque pelo caminho da sua imagem
    descricao = descrever_imagem(caminho)
    print("Descrição da imagem:", descricao)
