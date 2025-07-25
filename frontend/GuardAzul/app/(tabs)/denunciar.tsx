import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  FlatList,
} from 'react-native';
import { API_CONFIG, MESSAGES } from '../../constants/Config';

const { width } = Dimensions.get('window');

// 🌊 Categorias ambientais do CONAMA
const ENVIRONMENTAL_CATEGORIES = [
  {
    id: 'poluicao_aguas',
    title: 'Poluição das Águas',
    description: 'Despejo de esgoto, resíduos industriais, óleo e substâncias poluentes',
    icon: 'water-outline'
  },
  {
    id: 'desmatamento',
    title: 'Desmatamento e Degradação',
    description: 'Destruição de manguezais, restingas e vegetações costeiras',
    icon: 'leaf-outline'
  },
  {
    id: 'erosao_costeira',
    title: 'Erosão Costeira',
    description: 'Atividades que aceleram a erosão das praias e costas',
    icon: 'triangle-outline'  // 🏔️ Novo ícone
  },
  {
    id: 'poluicao_solo',
    title: 'Poluição do Solo',
    description: 'Deposição de resíduos sólidos e contaminantes em áreas costeiras',
    icon: 'earth-outline'
  },
  {
    id: 'fauna_marinha',
    title: 'Fauna Marinha',
    description: 'Pesca ilegal, captura de espécies ameaçadas, perturbação de habitats',
    icon: 'fish-outline'
  },
  {
    id: 'flora_marinha',
    title: 'Flora Marinha',
    description: 'Danos às plantas aquáticas, algas e corais',
    icon: 'flower-outline'
  },
  {
    id: 'poluicao_sonora',
    title: 'Poluição Sonora',
    description: 'Ruídos perturbadores em zonas costeiras',
    icon: 'volume-high-outline'
  },
  {
    id: 'construcoes_irregulares',
    title: 'Construções Irregulares',
    description: 'Edificações em desacordo com legislações ambientais',
    icon: 'home-outline'
  },
  {
    id: 'exploracao_recursos',
    title: 'Exploração de Recursos',
    description: 'Extração descontrolada de areia, minerais ou recursos marinhos',
    icon: 'construct-outline'
  },
  {
    id: 'turismo_predatorio',
    title: 'Turismo Predatório',
    description: 'Atividades turísticas que causam degradação ambiental',
    icon: 'camera-outline'
  },
  {
    id: 'outros',
    title: 'Outros',
    description: 'Outros problemas ambientais não listados',
    icon: 'ellipsis-horizontal-outline'
  }
];

export default function DenunciarScreen() {
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(''); // Nova state
  const [showCategoryModal, setShowCategoryModal] = useState(false); // Modal para seleção
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    address?: string;
  } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 🔄 Estados para validação AI
  const [lastSubmittedId, setLastSubmittedId] = useState<number | null>(null);
  const [validationStatus, setValidationStatus] = useState<{
    status: string;
    message: string;
    score: number;
    details: any;
    isValid?: boolean;
  } | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      setIsLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permissão necessária',
          'Precisamos da sua localização para registrar a denúncia.'
        );
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = currentLocation.coords;

      // Tentar obter endereço detalhado
      try {
        const [address] = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });
        
        console.log('📍 Endereço completo:', address); // Para debug
        
        // Construir endereço completo e específico
        const addressParts = [];
        
        // 1. Nome específico do local (se disponível)
        if (address.name && address.name !== address.street) {
          addressParts.push(address.name);
        }
        
        // 2. Rua e número
        if (address.street) {
          if (address.streetNumber) {
            addressParts.push(`${address.street}, ${address.streetNumber}`);
          } else {
            addressParts.push(address.street);
          }
        }
        
        // 3. Bairro/Distrito
        if (address.district && address.district !== address.city) {
          addressParts.push(address.district);
        }
        
        // 4. Cidade
        if (address.city) {
          addressParts.push(address.city);
        }
        
        // 5. Estado e CEP
        const stateAndZip = [];
        if (address.region) {
          stateAndZip.push(address.region);
        }
        if (address.postalCode) {
          stateAndZip.push(address.postalCode);
        }
        if (stateAndZip.length > 0) {
          addressParts.push(stateAndZip.join(' - '));
        }
        
        const detailedAddress = addressParts.join(', ');
        
        setLocation({
          latitude,
          longitude,
          address: detailedAddress || `${address.city || address.district || 'Localização'}, ${address.region || ''}`,
        });
        
      } catch {
        setLocation({ latitude, longitude });
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível obter sua localização');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const pickImage = async () => {
    Alert.alert(
      'Adicionar Foto',
      'Como você gostaria de adicionar a foto da denúncia?',
      [
        { text: 'Câmera', onPress: () => openCamera() },
        { text: 'Galeria', onPress: () => openGallery() },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à câmera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const openGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const sendDenunciaToAPI = async () => {
    if (!imageUri || !location) return null;

    try {
      // Preparar FormData para envio multipart
      const formData = new FormData();
      
      // Adicionar imagem
      const imageType = imageUri.split('.').pop() || 'jpg';
      formData.append('image', {
        uri: imageUri,
        type: `image/${imageType}`,
        name: `denuncia_${Date.now()}.${imageType}`,
      } as any);
      
      // Adicionar dados da denúncia
      formData.append('description', description);
      formData.append('latitude', location.latitude.toString());
      formData.append('longitude', location.longitude.toString());
      if (location.address) {
        formData.append('address', location.address);
      }
      // 🌊 Usar categoria selecionada ao invés de valor fixo
      formData.append('category', selectedCategory || 'outros');

      console.log('🚀 Enviando denúncia para a API...');
      console.log('📂 Categoria selecionada:', selectedCategory);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/denuncias`, {
        method: 'POST',
        body: formData,
        // 🔧 REMOVIDO: Content-Type manual - deixar o browser definir automaticamente para FormData
      });

      const responseData = await response.json();

      if (response.ok) {
        console.log('✅ Denúncia enviada com sucesso:', responseData);
        return responseData;
      } else {
        console.error('❌ Erro na resposta da API:', responseData);
        throw new Error(responseData.detail || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('❌ Erro ao enviar denúncia:', error);
      throw error;
    }
  };

  const handleSubmitReport = async () => {
    if (!description.trim()) {
      Alert.alert('Erro', MESSAGES.ERROR.SEM_DESCRICAO);
      return;
    }

    if (!imageUri) {
      Alert.alert('Erro', MESSAGES.ERROR.SEM_IMAGEM);
      return;
    }

    if (!selectedCategory) {
      Alert.alert('Erro', 'Por favor, selecione uma categoria do problema ambiental');
      return;
    }

    if (!location) {
      Alert.alert('Erro', MESSAGES.ERROR.SEM_LOCALIZACAO);
      return;
    }
    
    // 🧹 Limpar status de validação anterior antes de enviar nova denúncia
    setValidationStatus(null);
    setCheckingStatus(false);
    setLastSubmittedId(null);
    
    setIsSubmitting(true);
    
    try {
      const response = await sendDenunciaToAPI();
      
      if (response && response.success) {
        // 🔄 Inicializar status de validação
        setLastSubmittedId(response.denuncia_id);
        setValidationStatus({ 
          status: 'pending_validation', 
          message: '🔄 Analisando com AI...', 
          score: 0, 
          details: {},
          isValid: undefined  // 🔧 UNDEFINED = ainda não validou (era false)
        });
        setCheckingStatus(true);
        
        // 🚀 RESPOSTA SIMPLES SEM POPUP CHATO
        Alert.alert(
          '✅ Denúncia Enviada!',
          `Sua denúncia foi recebida! ID: ${response.denuncia_id}\n\nVamos analisar automaticamente e mostrar o resultado abaixo.`,
          [{ 
            text: 'OK', 
            onPress: () => {
              // 🔄 Iniciar polling para status
              startStatusPolling(response.denuncia_id);
              
              // 🧹 Limpar formulário mas MANTER status de validação
              setDescription('');
              setImageUri(null);
              setSelectedCategory('');
              getCurrentLocation();
              // NÃO limpar validationStatus - queremos mostrar o resultado!
            }
          }]
        );
      }
    } catch (error) {
      console.error('Erro completo:', error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage?.includes('Network') || errorMessage?.includes('fetch')) {
        Alert.alert(
          MESSAGES.ERROR.SEM_CONEXAO,
          'Não foi possível conectar com o servidor. Verifique sua conexão com a internet e se o backend está rodando.',
          [
            { text: 'Tentar Novamente', onPress: () => handleSubmitReport() },
            { text: 'Cancelar', style: 'cancel' }
          ]
        );
      } else {
        Alert.alert(
          'Erro',
          `Não foi possível enviar a denúncia: ${errorMessage || 'Erro desconhecido'}`
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const startStatusPolling = (denunciaId: number) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/denuncias/${denunciaId}/status`);
        const data = await response.json();
        
        if (response.ok) {
          setValidationStatus({
            status: data.status,
            message: data.status_message,
            score: data.validation_score,
            details: data.details || {},
            isValid: data.is_valid
          });
          
          // 🔥 PARAR POLLING quando validação concluir
          if (data.is_ai_validated) {
            setCheckingStatus(false);
            clearInterval(pollInterval);
            console.log('✅ Polling parado - validação concluída');
          }
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error);
      }
    }, 2000); // Verificar a cada 2 segundos
    
    // Parar polling após 30 segundos (timeout)
    setTimeout(() => {
      setCheckingStatus(false);
      clearInterval(pollInterval);
      console.log('⏰ Polling parado - timeout');
    }, 30000);
  };

  const checkValidationStatus = async (denunciaId: number) => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/denuncias/${denunciaId}/status`);
      const data = await response.json();
      
      if (response.ok) {
        setValidationStatus({
          status: data.status,
          message: data.status_message,
          score: data.validation_score,
          details: data.details || {},
          isValid: data.is_valid
        });
        setCheckingStatus(false);
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      setCheckingStatus(false);
    }
  };

  const getRejectionReasons = (details: any) => {
    const reasons = [];
    
    if (details.irrelevant_labels && details.irrelevant_labels.length > 0) {
      reasons.push(`🚫 Conteúdo irrelevante detectado: ${details.irrelevant_labels.join(', ')}`);
    }
    
    if (!details.has_outdoor_context) {
      reasons.push('🌍 Sem contexto ambiental detectado');
    }
    
    if (details.environmental_labels && details.environmental_labels.length === 0) {
      reasons.push('🔍 Nenhum problema ambiental identificado na imagem');
    }
    
    if (details.category_match < 10) {
      reasons.push('📂 Imagem não corresponde à categoria selecionada');
    }
    
    return reasons;
  };

  const renderCategoryItem = ({ item }: { item: typeof ENVIRONMENTAL_CATEGORIES[0] }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => {
        setSelectedCategory(item.id);
        setShowCategoryModal(false);
      }}
    >
      <View style={styles.categoryIcon}>
        <Ionicons name={item.icon as any} size={24} color="#008B8B" />
      </View>
      <View style={styles.categoryText}>
        <Text style={styles.categoryTitle}>{item.title}</Text>
        <Text style={styles.categoryDescription}>{item.description}</Text>
      </View>
      {selectedCategory === item.id && (
        <Ionicons name="checkmark-circle" size={24} color="#20B2AA" />
      )}
    </TouchableOpacity>
  );

  const getSelectedCategoryTitle = () => {
    const category = ENVIRONMENTAL_CATEGORIES.find(cat => cat.id === selectedCategory);
    return category ? category.title : 'Selecionar categoria';
  };

  const removeImage = () => {
    setImageUri(null);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={['#008B8B', '#20B2AA']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <Ionicons name="camera" size={32} color="#FFFFFF" />
          <Text style={styles.headerTitle}>Denunciar</Text>
          <Text style={styles.headerSubtitle}>
            Proteja a vida dos nossos ecossistemas costeiros reportando problemas ambientais
          </Text>
        </View>
      </LinearGradient>

      {/* Formulário */}
      <View style={styles.formContainer}>
        {/* Seção Foto */}
        <Text style={styles.sectionTitle}>Foto da Denúncia</Text>
        
        <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
          {imageUri ? (
            <View style={styles.imageWithRemoveButton}>
              <Image source={{ uri: imageUri }} style={styles.selectedImage} />
              <TouchableOpacity onPress={removeImage} style={styles.removeImageButton}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera-outline" size={48} color="#008B8B" />
              <Text style={styles.imagePlaceholderText}>
                Toque para adicionar foto
              </Text>
              <Text style={styles.imagePlaceholderSubtext}>
                Sua foto pode salvar vidas marinhas :)
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* 🌊 Nova Seção - Categoria do Problema */}
        <View style={styles.categoryContainer}>
          <Text style={styles.inputLabel}>Categoria do Problema Ambiental *</Text>
          <TouchableOpacity
            style={[
              styles.categorySelector,
              selectedCategory ? styles.categorySelectorSelected : {}
            ]}
            onPress={() => setShowCategoryModal(true)}
          >
            <View style={styles.categorySelectorContent}>
              <Ionicons 
                name={selectedCategory ? "checkmark-circle" : "list-outline"} 
                size={20} 
                color={selectedCategory ? "#20B2AA" : "#008B8B"} 
              />
              <Text style={[
                styles.categorySelectorText,
                selectedCategory ? styles.categorySelectorTextSelected : {}
              ]}>
                {getSelectedCategoryTitle()}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#008B8B" />
            </View>
          </TouchableOpacity>
          
          {selectedCategory && (
            <View style={styles.selectedCategoryInfo}>
              <Text style={styles.selectedCategoryText}>
                {ENVIRONMENTAL_CATEGORIES.find(cat => cat.id === selectedCategory)?.description}
              </Text>
            </View>
          )}
        </View>

        {/* Seção Descrição */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Descrição do Problema *</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Descreva detalhadamente o problema observado: local específico, extensão do dano, materiais envolvidos, etc."
            placeholderTextColor="#8B9499"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Seção Localização */}
        <View style={styles.locationContainer}>
          <Text style={styles.inputLabel}>Localização</Text>
          <View style={styles.locationInfo}>
            {isLoadingLocation ? (
              <View style={styles.loadingLocation}>
                <Ionicons name="location-outline" size={20} color="#008B8B" />
                <Text style={styles.locationText}>Obtendo localização...</Text>
              </View>
            ) : location ? (
              <View style={styles.locationFound}>
                <Ionicons name="location" size={20} color="#008B8B" />
                <View style={styles.locationDetails}>
                  <Text style={styles.locationText}>
                    {location.address || 'Localização obtida'}
                  </Text>
                  <Text style={styles.locationCoords}>
                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </Text>
                </View>
                <TouchableOpacity onPress={getCurrentLocation} style={styles.refreshButton}>
                  <Ionicons name="refresh" size={20} color="#008B8B" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={getCurrentLocation} style={styles.locationButton}>
                <Ionicons name="location-outline" size={20} color="#008B8B" />
                <Text style={styles.locationButtonText}>Obter localização</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Botão Enviar */}
        <TouchableOpacity 
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
          onPress={handleSubmitReport}
          disabled={isSubmitting}
        >
          <LinearGradient
            colors={isSubmitting ? ['#95A5A6', '#BDC3C7'] : ['#008B8B', '#20B2AA']}
            style={styles.submitButtonGradient}
          >
            {isSubmitting ? (
              <>
                <Ionicons name="sync" size={20} color="#FFFFFF" style={[styles.submitIcon, {transform: [{rotate: '45deg'}]}]} />
                <Text style={styles.submitButtonText}>Enviando...</Text>
              </>
            ) : (
              <>
                <Ionicons name="send" size={20} color="#FFFFFF" style={styles.submitIcon} />
                <Text style={styles.submitButtonText}>Enviar Denúncia</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* 🤖 Seção de Status de Validação AI - MOVIDA PARA EMBAIXO */}
        {validationStatus && (
          <View style={styles.validationContainer}>
            <Text style={styles.validationTitle}>Status da Validação AI</Text>
            
            <View style={[
              styles.validationCard, 
              validationStatus.isValid === true ? styles.validationApproved :
              validationStatus.isValid === false ? styles.validationRejected :
              styles.validationPending  // 🔧 undefined ou null = pending (amarelo)
            ]}>
              <View style={styles.validationHeader}>
                <Ionicons 
                  name={
                    validationStatus.isValid === true ? "checkmark-circle" :
                    validationStatus.isValid === false ? "close-circle" :
                    "time-outline"  // 🔧 undefined = tempo (analisando)
                  } 
                  size={24} 
                  color={
                    validationStatus.isValid === true ? "#4CAF50" :
                    validationStatus.isValid === false ? "#F44336" :
                    "#FF9800"  // 🔧 undefined = laranja (analisando)
                  } 
                />
                <Text style={[
                  styles.validationMessage,
                  validationStatus.isValid === true ? styles.approvedText :
                  validationStatus.isValid === false ? styles.rejectedText :
                  styles.pendingText  // 🔧 undefined = texto laranja
                ]}>
                  {validationStatus.message}
                </Text>
              </View>
              
              {validationStatus.score > 0 && validationStatus.isValid !== undefined && (
                <View style={styles.scoreContainer}>
                  <Text style={styles.scoreLabel}>Score de Confiança:</Text>
                  <Text style={[
                    styles.scoreValue,
                    validationStatus.score >= 65 ? styles.scoreGood :
                    validationStatus.score >= 40 ? styles.scoreMedium :
                    styles.scoreBad
                  ]}>
                    {validationStatus.score}/100
                  </Text>
                </View>
              )}
              
              {validationStatus.isValid === false && validationStatus.details && (
                <View style={styles.reasonsContainer}>
                  <Text style={styles.reasonsTitle}>Por que foi rejeitada:</Text>
                  {getRejectionReasons(validationStatus.details).map((reason, index) => (
                    <Text key={index} style={styles.reasonText}>• {reason}</Text>
                  ))}
                  
                  {validationStatus.details.environmental_labels && validationStatus.details.environmental_labels.length > 0 && (
                    <View style={styles.detectedContainer}>
                      <Text style={styles.detectedTitle}>✅ Problemas ambientais detectados:</Text>
                      <Text style={styles.detectedText}>
                        {validationStatus.details.environmental_labels.join(', ')}
                      </Text>
                    </View>
                  )}
                </View>
              )}
              
              {validationStatus.isValid === true && validationStatus.details.environmental_labels && (
                <View style={styles.approvedContainer}>
                  <Text style={styles.approvedTitle}>✅ Detectado na imagem:</Text>
                  <Text style={styles.approvedDetailsText}>
                    {validationStatus.details.environmental_labels.join(', ')}
                  </Text>
                </View>
              )}
              
              {checkingStatus && validationStatus.isValid === undefined && (
                <View style={styles.loadingContainer}>
                  <Ionicons name="sync" size={16} color="#FF9800" style={{transform: [{rotate: '45deg'}]}} />
                  <Text style={styles.loadingText}>Processando imagem...</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Modal de Seleção de Categoria */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecionar Categoria</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCategoryModal(false)}
            >
              <Ionicons name="close" size={24} color="#008B8B" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.modalSubtitle}>
            Escolha a categoria que melhor descreve o problema ambiental:
          </Text>
          
          <FlatList
            data={ENVIRONMENTAL_CATEGORIES}
            keyExtractor={(item) => item.id}
            renderItem={renderCategoryItem}
            showsVerticalScrollIndicator={false}
            style={styles.categoryList}
          />
        </View>
      </Modal>

      {/* Espaçamento inferior */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

// 🎨 Novos estilos para a seção de categorias
const newStyles = StyleSheet.create({
  // Categoria Container
  categoryContainer: {
    marginBottom: 20,
  },
  categorySelector: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    padding: 16,
    marginTop: 8,
  },
  categorySelectorSelected: {
    borderColor: '#20B2AA',
    backgroundColor: '#F0FDFF',
  },
  categorySelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categorySelectorText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#6C757D',
  },
  categorySelectorTextSelected: {
    color: '#2C3E50',
    fontWeight: '600',
  },
  selectedCategoryInfo: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#E8F8F8',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#20B2AA',
  },
  selectedCategoryText: {
    fontSize: 14,
    color: '#2C3E50',
    lineHeight: 20,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6C757D',
    margin: 20,
    marginBottom: 10,
    lineHeight: 22,
  },
  categoryList: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Category Items
  categoryItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0FDFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryText: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 18,
  },
});

// Combine os estilos existentes com os novos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 10,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 20,
  },
  formContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
  },
  imageContainer: {
    marginBottom: 25,
  },
  imageWithRemoveButton: {
    position: 'relative',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#008B8B',
    marginTop: 10,
  },
  imagePlaceholderSubtext: {
    fontSize: 13,
    color: '#6C757D',
    marginTop: 5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    color: '#2C3E50',
    minHeight: 120,
  },
  locationContainer: {
    marginBottom: 25,
  },
  locationInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  loadingLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  locationFound: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  locationDetails: {
    flex: 1,
    marginLeft: 12,
  },
  locationText: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '500',
  },
  locationCoords: {
    fontSize: 13,
    color: '#6C757D',
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  locationButtonText: {
    fontSize: 16,
    color: '#008B8B',
    fontWeight: '500',
    marginLeft: 8,
  },
  
  // 🤖 Estilos da Seção de Validação AI
  validationContainer: {
    marginBottom: 25,
  },
  validationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 12,
  },
  validationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  validationApproved: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8E9',
  },
  validationRejected: {
    borderColor: '#F44336',
    backgroundColor: '#FFEBEE',
  },
  validationPending: {
    borderColor: '#FF9800',
    backgroundColor: '#FFF8E1',
  },
  validationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  validationMessage: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  approvedText: {
    color: '#4CAF50',
  },
  rejectedText: {
    color: '#F44336',
  },
  pendingText: {
    color: '#FF9800',
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 8,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#6C757D',
    fontWeight: '500',
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scoreGood: {
    color: '#4CAF50',
  },
  scoreMedium: {
    color: '#FF9800',
  },
  scoreBad: {
    color: '#F44336',
  },
  reasonsContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F44336',
  },
  reasonsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F44336',
    marginBottom: 8,
  },
  reasonText: {
    fontSize: 13,
    color: '#6C757D',
    lineHeight: 18,
    marginBottom: 4,
  },
  detectedContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 6,
  },
  detectedTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 4,
  },
  detectedText: {
    fontSize: 12,
    color: '#2C3E50',
  },
  approvedContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  approvedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 6,
  },
  approvedDetailsText: {
    fontSize: 13,
    color: '#2C3E50',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 6,
  },
  loadingText: {
    fontSize: 12,
    color: '#FF9800',
    marginLeft: 6,
    fontStyle: 'italic',
  },
  
  pollutionTypes: {
    backgroundColor: '#E8F4FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 25,
    borderLeftWidth: 4,
    borderLeftColor: '#008B8B',
  },
  typesList: {
    marginTop: 8,
  },
  typeItem: {
    fontSize: 14,
    color: '#2C3E50',
    marginBottom: 6,
    lineHeight: 20,
  },
  submitButton: {
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#008B8B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  submitIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: 100,
  },
  ...newStyles, // Adicionar os novos estilos
}); 