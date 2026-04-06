# Guarda Azul

> **Plataforma digital para proteção dos ecossistemas marinhos da Paraíba**

Sistema completo com **chat inteligente**, **denúncias colaborativas** e **educação ambiental**.

![Guarda Azul](https://img.shields.io/badge/Status-Ativo-brightgreen) ![React Native](https://img.shields.io/badge/React%20Native-Expo-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-PostgreSQL-green) ![IA](https://img.shields.io/badge/IA-Google%20Gemini-orange)

---

## Nereu - Assistente Marinho IA

Converse com **Nereu**, nosso chatbot especialista em ecossistema costeiro da Paraíba:

- **Informações sobre marés, pesca e condições do mar**
- **Conhecimento sobre vida marinha e conservação**  
- **Conversas com histórico persistente**
- **Orientações sobre denúncias ambientais**

## Principais Funcionalidades

### **Chat Inteligente**
- **Nereu**: Assistente especialista com IA Google Gemini
- Informações sobre ecossistema costeiro da Paraíba
- **Histórico persistente** de conversas

### **Sistema de Denúncias**
- **Captura de fotos** da poluição
- **Geolocalização automática**  
- **Categorização** de problemas ambientais

### **Educação Ambiental**
- **Artigos educativos** sobre vida marinha
- **Informações sobre recifes de corais**
- **Conscientização** através do chat

---

## Como Rodar (5 minutos)

### **1. Clone e Descubra seu IP**
```bash
https://github.com/luigischmitt/GuardAzul.git
cd GuardAzul
```

**Descubra seu IP local:**
```bash
# Windows
ipconfig
# Procure por "Endereço IPv4" ou "IPv4 Address"

# Mac/Linux  
ifconfig
# Procure por "inet" na interface ativa (ex: en0, wlan0)
```
**Exemplo de saída:**
```
Endereço IPv4: SEU_IP_LOCAL_AQUI  ← Este é seu IP!
```
> **Anote esse IP!** Você vai usá-lo no passo 3.

### **2. Configure Variáveis**
Crie `.env` na raiz:
```bash
# GuardAzul/.env
GEMINI_API_KEY=sua_chave_do_gemini_aqui
```

> **Apenas `GEMINI_API_KEY` é obrigatório!** O resto tem valores padrão.

### **3. Configure IP no Frontend**
Edite `frontend/GuardAzul/constants/Config.ts`:
```typescript
const BACKEND_IP = '<seu-ip>'; // ← Substitua pelo IP do passo 1
```
**Exemplo:** Se seu IP é `SEU_IP_LOCAL`:

Backend configurado para: http://SEU_IP_LOCAL:8000

### **4. Rodar com Docker (Recomendado)**
```bash
docker-compose up --build
```

### **5. OU Rodar Local**
```bash
# Terminal 1 - Backend
docker-compose up postgres -d
cd backend && pip install -r ../requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 3 - Frontend (Local) 
cd frontend/GuardAzul && npm install
npx expo start
```
> **PostgreSQL roda em background!** Pode fechar o terminal.

### **5. Teste no Celular**
1. Instale **Expo Go** 
2. Escaneie o **QR Code**
3. Converse com **Nereu** 🤖

### **Verificar se funcionou**
No console do Expo deve aparecer:
```
Backend configurado para: http://<seu-ip>:8000
IP configurado em: frontend/GuardAzul/constants/Config.ts
```
**Exemplo:** Se seu IP é `192.168.1.100`:
```
Backend configurado para: http://192.168.1.100:8000
IP configurado em: frontend/GuardAzul/constants/Config.ts
```

---

## Tecnologias

**Frontend:** React Native + Expo + TypeScript  
**Backend:** FastAPI + PostgreSQL + SQLAlchemy  
**IA:** Google Gemini 2.0 Flash  
**Deploy:** Docker + Expo EAS  

---

## Estrutura do Projeto

```
GuardAzul/
├── frontend/GuardAzul/          # App React Native
│   ├── app/(tabs)/                 # Telas (Home, Chat, Denúncias)
│   └── constants/Config.ts        # Configuração da API
├── backend/                     # API FastAPI
│   ├── database/models.py          # Banco (User, Conversation, Message, Denuncia)
│   ├── chatbot/model.py            # Sistema de IA
│   └── main.py                     # Endpoints REST
├── .env                         # Variáveis centralizadas
└──  docker-compose.yml          # Stack completo
```

---

## API Endpoints

### **Chat com IA**
- `POST /chat/message` - Enviar mensagem para Nereu
- `GET /chat/conversations` - Listar conversas
- `GET /chat/conversation/{session_id}` - Histórico

### **Denúncias**
- `POST /denuncias` - Criar denúncia com imagem
- `GET /denuncias/list` - Listar denúncias
- `GET /health` - Status da API

**Documentação completa:** http://localhost:8000/docs

---

## Problemas Comuns

**Chat não funciona:** Verifique `GEMINI_API_KEY` no .env  
**Não conecta no celular:** Configure seu IP real em `Config.ts`  
**PostgreSQL erro:** Execute `docker-compose up postgres -d`

---

## Próximas Features

- [ ] Autenticação JWT
- [ ] Dashboard administrativo  
- [ ] Mapa interativo das denúncias
- [ ] App nativo para iOS/Android


---

### *"Cada denúncia é uma onda de proteção aos ecossistemas marinhos"*


/frontend/GuardAzul/assets/images

---

## Contribuições
Contribuições são muito bem-vindas! Sinta-se à vontade para abrir um Pull Request ou entrar em contato caso tenha interesse em colaborar ou desenvolver algo novo.

---

## Telas do App

<table align="center">
  <tr>
    <td align="center">
      <img src="https://raw.githubusercontent.com/luigischmitt/GuardAzul/main/frontend/GuardAzul/assets/images/Login.png" alt="Tela de Login" width="200"/>
      <br>
      <strong>Tela de Login</strong>
    </td>
    <td align="center">
      <img src="https://raw.githubusercontent.com/luigischmitt/GuardAzul/main/frontend/GuardAzul/assets/images/Waves.png" alt="Tela Principal com informações das ondas" width="200"/>
      <br>
      <strong>Tela Principal</strong>
    </td>
    <td align="center">
      <img src="https://raw.githubusercontent.com/luigischmitt/GuardAzul/main/frontend/GuardAzul/assets/images/Denuncia.png" alt="Tela para fazer denúncias com geolocalização" width="200"/>
      <br>
      <strong>Tela de Denúncia</strong>
    </td>
    <td align="center">
      <img src="https://raw.githubusercontent.com/luigischmitt/GuardAzul/main/frontend/GuardAzul/assets/images/Nereu.png" alt="Chat com o assistente IA Nereu" width="200"/>
      <br>
      <strong>Chatbot Nereu</strong>
    </td>
  </tr>
</table>

---
