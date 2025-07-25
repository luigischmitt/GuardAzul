# 🐳 Dockerfile para GuardAzul Frontend (React Native/Expo)
FROM node:18-alpine

# Informações do container
LABEL maintainer="Pythonautas"
LABEL description="Guarda Azul Frontend - App Mobile"

# Instalar dependências do sistema
RUN apk add --no-cache \
    git \
    curl \
    bash

# Instalar Expo CLI globalmente
RUN npm install -g @expo/cli

# Criar diretório de trabalho
WORKDIR /app

# Copiar package files primeiro (para cache do Docker)
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código da aplicação
COPY . .

# Expor portas do Expo
EXPOSE 8081 19000 19001 19002

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8081 || exit 1

# Comando para iniciar o Expo (usando --host lan para Docker)
CMD ["npx", "expo", "start", "--host", "lan", "--port", "8081"] 