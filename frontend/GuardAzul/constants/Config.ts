/**
 * Configurações da aplicação Guarda Azul
 * 
 * 🔧 CONFIGURAÇÃO DE IP:
 * Configure seu IP local na variável BACKEND_IP abaixo
 */

// 🌐 Configure seu IP local aqui
const BACKEND_IP = 'SEU_IP_LOCAL_AQUI'; // ← SEU IP AQUI (rode 'ipconfig' para descobrir)

// Função para detectar o ambiente e retornar a URL correta
const getApiBaseUrl = () => {
  // Verificar se estamos rodando em Docker
  const isDocker = process.env.API_BASE_URL;
  
  if (isDocker) {
    // Em Docker, usar a URL do container
    console.log('🐳 Usando configuração Docker:', process.env.API_BASE_URL);
    return process.env.API_BASE_URL;
  }
  
  // Em desenvolvimento local, usar IP configurado manualmente
  const isDevelopment = __DEV__;
  
  if (isDevelopment) {
    const apiUrl = `http://${BACKEND_IP}:8000`;
    console.log('🌐 Backend configurado para:', apiUrl);
    console.log('📁 IP configurado em: frontend/GuardAzul/constants/Config.ts');
    return apiUrl;
  } else {
    // Em produção, usar a URL do deploy
    return 'https://sua-api-production.com';  
  }
};

// URL da API do backend
export const API_CONFIG = {
  // URL dinâmica baseada no ambiente
  BASE_URL: getApiBaseUrl(),
  
  ENDPOINTS: {
    DENUNCIAS: '/denuncias',
    DENUNCIAS_LIST: '/denuncias/list',
    HEALTH: '/health',
    CHAT_MESSAGE: '/chat/message',
    CHAT_CONVERSATIONS: '/chat/conversations',
    CHAT_CONVERSATION: '/chat/conversation',
    CHAT_NEW: '/chat/conversation/new',
  },
  
  TIMEOUT: 30000, // 30 segundos
};

// Configurações de upload
export const UPLOAD_CONFIG = {
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],
  QUALITY: 0.8,
};

// Mensagens padrão
export const MESSAGES = {
  SUCCESS: {
    DENUNCIA_ENVIADA: 'Denúncia enviada com sucesso! 🌊',
    OBRIGADO: 'Obrigado por proteger nossos oceanos! 💙',
  },
  ERROR: {
    SEM_CONEXAO: 'Erro de Conexão',
    SEM_LOCALIZACAO: 'Localização não encontrada. Tente novamente.',
    SEM_DESCRICAO: 'Por favor, descreva o problema observado',
    SEM_IMAGEM: 'Por favor, adicione uma foto da denúncia',
    ERRO_GENERICO: 'Não foi possível enviar a denúncia. Tente novamente.',
  },
}; 