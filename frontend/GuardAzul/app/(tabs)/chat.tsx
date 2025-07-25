import React, { useState, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Image,
  ImageBackground,
  ListRenderItem,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { API_CONFIG } from '../../constants/Config';

// Importando componente de bolhas oceânicas
import Bubbles from '../../components/bubbles';

// Cores do tema consistente com o resto do app
const Cores = {
  fundo: '#F8FAFB', // Backup se não carregar imagem
  headerPrimary: '#008B8B', // Cor primária do app
  headerSecondary: '#20B2AA', // Cor secundária do app
  branco: '#FFFFFF',
  texto: '#2C3E50', // Cor de texto padrão
  textoSecundario: '#6C757D', // Cor de texto secundário
  bolhaChatbot: '#FFFFFF', // Fundo branco para bolhas do bot
  bolhaUsuario: '#008B8B', // Cor primária para bolhas do usuário
  bordaChatbot: '#E9ECEF', // Borda sutil para bolhas do bot
  accent: '#FFD700', // Dourado para detalhes
  overlay: 'rgba(0, 139, 139, 0.1)', // Overlay sutil sobre a imagem
};

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isLoading?: boolean;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Adicionar mensagem de boas-vindas do Nereu
    const welcomeMessage: Message = {
      id: 'welcome',
      content: 'Olá! Eu sou o Nereu, assistente especialista em ecossistema costeiro da Paraíba! 🌊\n\nPosso te ajudar com informações sobre:\n• Vida marinha e conservação\n• Problemas ambientais\n• Marés e condições do mar\n• Orientações sobre denúncias\n\nComo posso te ajudar hoje?',
      role: 'assistant',
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputText.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    // Adicionar mensagem do usuário
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Adicionar indicador de "digitando..."
    const loadingMessage: Message = {
      id: 'loading',
      content: 'Nereu está digitando...',
      role: 'assistant',
      timestamp: new Date(),
      isLoading: true,
    };
    setMessages(prev => [...prev, loadingMessage]);

    scrollToBottom();

    const apiUrl = `${API_CONFIG.BASE_URL}/chat/message`;
    console.log('🔗 Tentando conectar com:', apiUrl);
    console.log('📡 Enviando dados:', {
      message: userMessage.content,
      session_id: sessionId,
    });

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          session_id: sessionId,
        }),
      });

      console.log('📬 Response status:', response.status);
      console.log('📬 Response ok:', response.ok);

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Resposta recebida:', data);

      // Atualizar session ID se for a primeira mensagem
      if (!sessionId) {
        setSessionId(data.session_id);
      }

      // Remover mensagem de loading e adicionar resposta
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== 'loading');
        const botMessage: Message = {
          id: data.conversation_id?.toString() || Date.now().toString(),
          content: data.bot_response,
          role: 'assistant',
          timestamp: new Date(),
        };
        return [...filtered, botMessage];
      });

      setIsConnected(true);
    } catch (error) {
      console.error('❌ Erro completo:', error);
      console.error('❌ Tipo do erro:', typeof error);
      console.error('❌ Stack trace:', (error as Error)?.stack);
      
      // Remover mensagem de loading
      setMessages(prev => prev.filter(msg => msg.id !== 'loading'));
      
      // Adicionar mensagem de erro mais detalhada
      const errorMessage: Message = {
        id: 'error-' + Date.now(),
        content: `Erro de conexão com o servidor:\n${(error as Error)?.message || 'Erro desconhecido'}\n\nVerifique se o backend está rodando em ${API_CONFIG.BASE_URL}`,
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      
      setIsConnected(false);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  const clearChat = () => {
    Alert.alert(
      'Limpar Chat',
      'Deseja começar uma nova conversa? O histórico atual será perdido.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: () => {
            setMessages([]);
            setSessionId(null);
            // Adicionar mensagem de boas-vindas novamente
            const welcomeMessage: Message = {
              id: 'welcome-' + Date.now(),
              content: 'Olá novamente! Eu sou o Nereu. Como posso te ajudar hoje? 🌊',
              role: 'assistant',
              timestamp: new Date(),
            };
            setMessages([welcomeMessage]);
          },
        },
      ]
    );
  };

  const renderMessage: ListRenderItem<Message> = ({ item }) => {
    const isUser = item.role === 'user';
    
    return (
      <View style={[styles.containerBolhaMensagem, isUser ? styles.alinhamentoUsuario : styles.alinhamentoChatbot]}>
        <View style={[styles.bolhaMensagem, isUser ? styles.bolhaUsuario : styles.bolhaChatbot]}>
          {item.isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Cores.accent} />
              <Text style={[styles.textoMensagem, styles.loadingText, { color: Cores.texto }]}>{item.content}</Text>
            </View>
          ) : (
            <Text style={[styles.textoMensagem, { color: isUser ? Cores.branco : Cores.texto }]}>
              {item.content}
            </Text>
          )}
        </View>
        <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.botTimestamp]}>
          {item.timestamp.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="transparent" 
        translucent={true} 
      />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.keyboardContainer}
      >
        {/* Background da Homepage */}
        <ImageBackground 
          source={require('../../assets/images/homepage-background.png')} 
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          {/* Overlay sutil para melhor legibilidade */}
          <View style={styles.overlay} />
          
          {/* 🌊 Bolhas oceânicas sutis */}
          <View style={styles.animationsContainer}>
            <Bubbles />
          </View>

          {/* Messages Container - Por baixo do header */}
          <View style={styles.messagesWrapper}>
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              style={styles.listaMensagens}
              contentContainerStyle={styles.messagesContainer}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={scrollToBottom}
              automaticallyAdjustContentInsets={false}
              contentInsetAdjustmentBehavior="never"
            />
          </View>

          {/* Header ondulado com SVG - Por cima das mensagens */}
          <View style={styles.headerContainer}>
            {/* Onda SVG */}
            <Svg
              height="100%"
              width="100%"
              viewBox="0 0 1440 120"
              style={styles.svgWave}
              preserveAspectRatio="none"
            >
              <Path
                fill="rgba(0, 139, 139, 0.9)"
                d="M0,40L48,45.3C96,51,192,61,288,72C384,83,480,93,576,88C672,83,768,61,864,56C960,51,1056,61,1152,72C1248,83,1344,93,1392,98.7L1440,104L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
                />
              {/* Segunda onda para efeito sobreposto */}
              <Path
                fill="rgba(32, 178, 170, 0.6)"
                d="M0,72L48,66.7C96,61,192,51,288,50.7C384,51,480,61,576,66.7C672,72,768,72,864,66.7C960,61,1056,51,1152,50.7C1248,51,1344,61,1392,66.7L1440,72L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
                />
            </Svg>
            
            {/* Conteúdo do header */}
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <View style={styles.avatarContainer}>
                  <Image 
                    source={require('../../assets/images/Nereu.png')} 
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.headerText}>
                  <Text style={styles.nomeChatbot}>Nereu</Text>
                  <View style={styles.statusContainer}>
                    <View style={[styles.statusDot, { backgroundColor: isConnected ? Cores.headerSecondary : Cores.headerPrimary }]} />
                    <Text style={styles.statusText}>
                      {isConnected ? 'Online' : 'Offline'}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity onPress={clearChat} style={styles.clearButton}>
                <Ionicons name="trash-outline" size={24} color={Cores.accent} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Input Area Flutuante */}
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={styles.inputKeyboardContainer}
          >
            <View style={styles.inputContainer}>
              <View style={styles.inputBubble}>
                <TextInput
                  style={styles.input}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Converse com o Nereu..."
                  placeholderTextColor={`${Cores.textoSecundario}60`}
                  multiline
                  maxLength={1000}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={[styles.botaoEnviar, (!inputText.trim() || isLoading) && styles.botaoEnviarDisabled]}
                  onPress={sendMessage}
                  disabled={!inputText.trim() || isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={Cores.branco} />
                  ) : (
                    <Ionicons name="paper-plane" size={22} color={Cores.branco} style={{ marginLeft: 3 }} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </ImageBackground>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Cores.fundo, // Fallback
  },
  keyboardContainer: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    overflow: 'hidden', // Permite que as mensagens sejam cortadas pelo header
  },
  // 🌊 Container para animações de fundo
  animationsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  // Overlay sutil para melhor legibilidade
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Cores.overlay,
    zIndex: 1,
  },
  messagesWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5, // Por baixo do header mas acima do background
  },
  headerContainer: {
    position: 'absolute', // Mudado para absolute para ficar por cima
    top: 0,
    left: 0,
    right: 0,
    height: 240,
    zIndex: 20, // Muito alto para ficar por cima de tudo
    paddingTop: Platform.OS === 'ios' ? 44 : 25, // Status bar height
  },
  headerWave: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 30,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  headerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50, // Aumentado para melhor posicionamento
    paddingBottom: 25, // Aumentado
    zIndex: 15,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    marginRight: 15, 
    borderWidth: 3, 
    borderColor: Cores.accent,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Cores.branco,
    shadowColor: Cores.accent,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
  },
  headerText: {
    marginLeft: 0,
  },
  nomeChatbot: { 
    fontSize: 26, 
    color: Cores.branco,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  statusText: {
    fontSize: 14,
    color: Cores.branco,
    fontWeight: '500',
  },
  clearButton: {
    padding: 10,
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 20,
  },
  listaMensagens: { 
    zIndex: 5, 
    flex: 1, 
    paddingHorizontal: 15,
  },
  messagesContainer: {
    paddingTop: 160, // Espaço para o header (140px + 20px extra)
    paddingVertical: 20, // Aumentado para melhor espaçamento
    paddingBottom: 100, // Espaço maior para o input
    flexGrow: 1,
  },
  containerBolhaMensagem: { 
    marginVertical: 8 
  },
  alinhamentoUsuario: { 
    alignItems: 'flex-end' 
  },
  alinhamentoChatbot: { 
    alignItems: 'flex-start' 
  },
  bolhaMensagem: { 
    maxWidth: '85%', 
    paddingVertical: 14, 
    paddingHorizontal: 18, 
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  bolhaChatbot: { 
    backgroundColor: Cores.bolhaChatbot, 
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: Cores.bordaChatbot,
  },
  bolhaUsuario: { 
    backgroundColor: Cores.bolhaUsuario, 
    borderBottomRightRadius: 6,
    borderWidth: 1,
    borderColor: Cores.bolhaUsuario,
  },
  textoMensagem: { 
    fontSize: 16, 
    lineHeight: 24,
    fontWeight: '400',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: 10,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 6,
    marginHorizontal: 15,
    color: `${Cores.textoSecundario}70`,
    fontWeight: '500',
  },
  userTimestamp: {
    textAlign: 'right',
  },
  botTimestamp: {
    textAlign: 'left',
  },
  inputContainer: {
    backgroundColor: 'transparent',
  },
  inputKeyboardContainer: {
    position: 'absolute',
    bottom: 20, // Afastar da borda usando bottom ao invés de paddingBottom
    left: 0,
    right: 0,
    paddingHorizontal: 15,
    paddingBottom: 0, // Remover padding já que estamos usando bottom
    paddingTop: 15,
    backgroundColor: 'transparent',
    zIndex: 15, // Por cima das mensagens mas abaixo do header
  },
  inputBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  input: { 
    flex: 1, 
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: 'transparent', 
    borderRadius: 20, 
    paddingHorizontal: 15, 
    paddingVertical: 10,
    color: Cores.texto, 
    marginRight: 8,
    fontSize: 16,
  },
  botaoEnviar: {
    backgroundColor: Cores.headerPrimary, 
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  botaoEnviarDisabled: {
    backgroundColor: `${Cores.headerPrimary}50`,
    shadowOpacity: 0.1,
  },
  // New styles for SVG header
  svgWave: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
}); 