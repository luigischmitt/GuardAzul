# 🐳 Docker - Guarda Azul

Ambiente containerizado para rodar frontend e backend juntos.

## 🚀 Comandos Essenciais

### **Iniciar todo o ambiente:**
```bash
docker-compose up -d
```

### **Ver logs em tempo real:**
```bash
docker-compose logs -f
```

### **Parar tudo:**
```bash
docker-compose down
```

### **Reconstruir imagens:**
```bash
docker-compose build
```

## 🔗 Acessos

Após `docker-compose up -d`:

- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs  
- **Frontend Metro**: http://localhost:8081
- **Expo DevTools**: http://localhost:19000

## 📱 Testando o App

1. **Instale o Expo Go** no seu dispositivo
2. **Execute**: `docker-compose up -d`
3. **Acesse**: http://localhost:8081 
4. **Escaneie o QR code** que aparece
5. **Teste as denúncias** no app

## 🔧 Comandos Úteis

```bash
# Ver status dos containers
docker-compose ps

# Logs apenas do backend
docker-compose logs -f backend

# Logs apenas do frontend  
docker-compose logs -f frontend

# Acessar shell do backend
docker-compose exec backend bash

# Testar API rapidamente
curl http://localhost:8000/health
```

## 📁 Estrutura Docker

```
├── docker-compose.yml       # Orquestração dos serviços
├── backend/
│   ├── Dockerfile           # Container FastAPI
│   └── .dockerignore        # Arquivos ignorados
└── frontend/GuardAzul/
    ├── Dockerfile           # Container React Native/Expo
    └── .dockerignore        # Arquivos ignorados
```

## 💾 Volumes Persistentes

- **Denúncias**: Salvas em volume Docker `guardazul-denuncias`
- **Código**: Sincronizado em tempo real (hot reload)

## 🎯 Pronto para Usar!

**Um comando e está tudo rodando:**
```bash
docker-compose up -d
```

🌊 **Frontend e Backend integrados e funcionando!** 
