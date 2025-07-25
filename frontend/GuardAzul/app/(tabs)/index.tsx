// Homepage
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import {
  Alert,
  Clipboard,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useState, useEffect } from 'react';
import { fetchTidesData, ProcessedTidesData, getTideType, formatTime } from '../../services/tidesService';

const { width } = Dimensions.get('window');

const EXTRA_ENVIRONMENTAL_ORGS = [
  {
    id: 'inpact',
    name: 'InPact',
    description: 'Instituto de Pesquisa e Ação',
    contact: '(83) 99128-8835',
    url: 'https://www.inpact.org.br/',
    icon: 'water-outline'
  },
  {
    id: 'tamar',
    name: 'Projeto Tamar',
    description: 'Conservação de Tartarugas Marinhas',
    contact: 'www.tamar.org.br',
    url: 'https://www.tamar.org.br/',
    icon: 'fish-outline'
  },
  {
    id: 'ibama',
    name: 'IBAMA',
    description: 'Instituto Brasileiro do Meio Ambiente',
    contact: 'Linha Verde: 0800 618 080',
    url: 'https://www.gov.br/ibama/pt-br',
    icon: 'shield-checkmark-outline'
  },
  {
    id: 'icmbio',
    name: 'ICMBio',
    description: 'Instituto Chico Mendes de Conservação',
    contact: 'www.icmbio.gov.br',
    url: 'https://www.icmbio.gov.br/',
    icon: 'leaf-outline'
  }
];

const EXTRA_NEWS_ITEMS = [
  {
    id: 'balneabilidade',
    title: 'Balneabilidade: trechos próprios para banho no Litoral da PB',
    description: 'SUDEMA divulga relatório com praias próprias e impróprias para banho na Paraíba',
    source: 'Jornal da Paraíba',
    date: 'JUL 19',
    url: 'https://jornaldaparaiba.com.br/meio-ambiente/praias-improprias-para-banho-no-litoral-da-paraiba',
    icon: '🏖️',
    gradient: ['#4682B4', '#87CEEB'] as const
  },
  {
    id: 'poluicao_jp',
    title: 'João Pessoa enfrenta poluição por instalações clandestinas',
    description: 'Capital paraibana combate esgoto clandestino que polui rios e praias',
    source: 'Jornal Nacional',
    date: 'MAR 19',
    url: 'https://g1.globo.com/jornal-nacional/noticia/2025/03/19/joao-pessoa-pb-enfrenta-o-desafio-de-combater-poluicao-causada-por-instalacoes-clandestinas.ghtml',
    icon: '🏭',
    gradient: ['#FF6B6B', '#FF8E53'] as const
  },
  {
    id: 'avanco_mar',
    title: 'Cidade da PB decreta calamidade por avanço do mar',
    description: 'Erosão costeira força moradores a abandonar casas no litoral paraibano',
    source: 'Folha de S.Paulo',
    date: 'NOV 24',
    url: 'https://www1.folha.uol.com.br/cotidiano/2024/11/cidade-da-paraiba-decreta-calamidade-publica-por-avanco-do-mar-sobre-casas.shtml',
    icon: '🌊',
    gradient: ['#FF7675', '#74B9FF'] as const
  },
  {
    id: 'sos_mangue',
    title: 'SOS Manguezais: Proteção de ecossistemas costeiros',
    description: 'Projeto busca conservar manguezais essenciais para vida marinha',
    source: 'Portal Ambiental PB',
    date: 'JAN 25',
    url: 'https://www.mma.gov.br/',
    icon: '🌿',
    gradient: ['#00B894', '#00A085'] as const
  }
];

export default function HomeScreen() {
  const router = useRouter();
  const [showOrgansModal, setShowOrgansModal] = useState(false);
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [tidesData, setTidesData] = useState<ProcessedTidesData | null>(null);
  const [isLoadingTides, setIsLoadingTides] = useState(true);

  // Carregar dados de marés
  useEffect(() => {
    const loadTidesData = async () => {
      try {
        setIsLoadingTides(true);
        const data = await fetchTidesData();
        setTidesData(data);
      } catch (error) {
        console.error('Erro ao carregar dados de marés:', error);
        // Em caso de erro, não mostrar alerta para não interferir na UX
      } finally {
        setIsLoadingTides(false);
      }
    };

    loadTidesData();
  }, []);

  const handleEcosystemQuestion = (question: string) => {
    console.log('Pergunta selecionada:', question);
    
    if (question === 'lixo-ecossistemas') {
      router.push('/artigo-lixo');
    } else if (question === 'funcao-recifes') {
      router.push('/artigo-recifes');
    }
  };

  const handleNewsItem = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Erro', 'Não foi possível abrir o link');
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível abrir o link');
    }
  };

  const handleSeeMoreNews = () => {
    setShowNewsModal(true);
  };

  const handleContactPress = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Erro', 'Não foi possível abrir o link');
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível abrir o link');
    }
  };

  const handleSeeMoreContacts = () => {
    setShowOrgansModal(true);
  };

  const handlePhonePress = (phone: string) => {
    Alert.alert(
      'Contato Telefônico',
      `Deseja copiar o número ${phone}?`,
      [
        {
          text: 'Copiar',
          onPress: () => {
            Clipboard.setString(phone);
            Alert.alert('Copiado!', 'Número copiado para área de transferência');
          }
        },
        { text: 'Cancelar', style: 'cancel' }
      ]
    );
  };

  const handleEmailPress = async (email: string) => {
    try {
      const emailUrl = `mailto:${email}`;
      const canOpen = await Linking.canOpenURL(emailUrl);
      if (canOpen) {
        await Linking.openURL(emailUrl);
      } else {
        Alert.alert('Erro', 'Não foi possível abrir o app de email');
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível abrir o app de email');
    }
  };

  const renderOrganItem = ({ item }: { item: typeof EXTRA_ENVIRONMENTAL_ORGS[0] }) => (
    <TouchableOpacity
      style={styles.organItem}
      onPress={() => {
        setShowOrgansModal(false);
        handleContactPress(item.url);
      }}
    >
      <View style={styles.organIcon}>
        <Ionicons name={item.icon as any} size={24} color="#008B8B" />
      </View>
      <View style={styles.organText}>
        <Text style={styles.organTitle}>{item.name}</Text>
        <Text style={styles.organDescription}>{item.description}</Text>
        <Text style={styles.organContact}>{item.contact}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#008B8B" />
    </TouchableOpacity>
  );

  const renderNewsItem = ({ item }: { item: typeof EXTRA_NEWS_ITEMS[0] }) => (
    <TouchableOpacity
      style={styles.newsModalCard}
      onPress={() => {
        setShowNewsModal(false);
        handleNewsItem(item.url);
      }}
    >
      <View style={styles.newsModalImageContainer}>
        <LinearGradient
          colors={item.gradient}
          style={styles.newsModalImageGradient}
        >
          <Text style={styles.newsModalImageIcon}>{item.icon}</Text>
        </LinearGradient>
        <View style={styles.newsModalDateTag}>
          <Text style={styles.newsModalDateText}>{item.date}</Text>
        </View>
      </View>
      <View style={styles.newsModalContent}>
        <Text style={styles.newsModalTitle}>{item.title}</Text>
        <Text style={styles.newsModalDescription}>{item.description}</Text>
        <Text style={styles.newsModalSource}>{item.source}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Principal */}
      <ImageBackground 
        source={require('../../assets/images/homepage-background.png')} 
        style={styles.headerBackground}
        resizeMode="cover"
        imageStyle={{ marginTop: -50 }} // Crop para baixo - mostra parte superior da imagem
      >
        {/* Overlay para melhorar a legibilidade */}
        <View style={styles.headerOverlay} />
        
        {/* Ícone de Perfil */}
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => router.push('/perfil')}
        >
          <View style={styles.profileIcon}>
            <Ionicons name="person" size={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Bem-vindo!</Text>
            <Text style={styles.welcomeSubtitle}>
              Formamos guardiões da costa, onde cada denúncia se torna uma onda de proteção
            </Text>
          </View>
          
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/images/tridente-icon.png')} 
              style={styles.tridentIcon}
              resizeMode="contain"
            />
          </View>
        </View>
      </ImageBackground>

      {/* Seção Ecossistema Marinho */}
      <View style={styles.ecosystemSection}>
        <Text style={styles.sectionTitle}>Conheça o Ecossistema Marinho</Text>
        
        <TouchableOpacity 
          style={styles.questionCard}
          onPress={() => handleEcosystemQuestion('lixo-ecossistemas')}
        >
          <View style={styles.questionContent}>
            <Text style={styles.questionText}>
              Como o lixo afeta nossos ecossistemas
            </Text>
            <Text style={styles.questionSubtext}>
              Explorando o impacto do plástico
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#008B8B" style={styles.questionIcon} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.questionCard}
          onPress={() => handleEcosystemQuestion('funcao-recifes')}
        >
          <View style={styles.questionContent}>
            <Text style={styles.questionText}>
              Qual a função dos recifes de corais
            </Text>
            <Text style={styles.questionSubtext}>
              Para que servem os corais?
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#008B8B" style={styles.questionIcon} />
        </TouchableOpacity>
      </View>

      {/* Seção Últimas Notícias */}
      <View style={styles.newsSection}>
        <View style={styles.newsSectionHeader}>
          <Text style={styles.sectionTitle}>Últimas notícias do Mar</Text>
          <TouchableOpacity onPress={handleSeeMoreNews}>
            <Text style={styles.seeMoreText}>Veja mais</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.newsScrollView}
        >
          {/* Notícia 1 - Plâncton e Mudanças Climáticas */}
          <TouchableOpacity 
            style={styles.newsCard}
            onPress={() => handleNewsItem('https://www.ecodebate.com.br/2025/07/21/mudanca-climatica-afeta-o-plancton-e-ameaca-os-ecossistemas-marinhos-e-o-clima/')}
          >
            <View style={styles.newsImageContainer}>
              <LinearGradient
                colors={['#4682B4', '#008B8B']}
                style={styles.newsImageGradient}
              >
                <Text style={styles.newsImageIcon}>🦠</Text>
              </LinearGradient>
              <View style={styles.dateTag}>
                <Text style={styles.dateText}>JUL 21</Text>
              </View>
            </View>
            <View style={styles.newsContent}>
              <Text style={styles.newsTitle}>
                Mudanças climáticas afetam plâncton marinho
              </Text>
              <Text style={styles.newsLocation}>
                EcoDebate
              </Text>
              <View style={styles.readMoreButton}>
                <Text style={styles.readMoreText}>Ler notícia</Text>
                <Ionicons name="open-outline" size={14} color="#008B8B" style={styles.externalIcon} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Notícia 2 - Mineração em Águas Profundas */}
          <TouchableOpacity 
            style={styles.newsCard}
            onPress={() => handleNewsItem('https://oglobo.globo.com/mundo/clima-e-ciencia/noticia/2025/07/21/cientistas-temem-nao-conseguir-restaurar-ecossistemas-em-caso-de-mineracao-em-aguas-profundas.ghtml')}
          >
            <View style={styles.newsImageContainer}>
              <LinearGradient
                colors={['#8B4513', '#2C3E50']}
                style={styles.newsImageGradient}
              >
                <Text style={styles.newsImageIcon}>⛏️</Text>
              </LinearGradient>
              <View style={styles.dateTag}>
                <Text style={styles.dateText}>JUL 21</Text>
              </View>
            </View>
            <View style={styles.newsContent}>
              <Text style={styles.newsTitle}>
                Mineração em águas profundas ameaça ecossistemas
              </Text>
              <Text style={styles.newsLocation}>
                O Globo
              </Text>
              <View style={styles.readMoreButton}>
                <Text style={styles.readMoreText}>Ler notícia</Text>
                <Ionicons name="open-outline" size={14} color="#008B8B" style={styles.externalIcon} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Notícia 3 - Proteção de Manguezais */}
          <TouchableOpacity 
            style={styles.newsCard}
            onPress={() => handleNewsItem('https://noticias.ufal.br/transparencia/noticias/2025/5/pesquisa-mostra-impactos-das-unidades-de-conservacao-na-protecao-de-manguezais')}
          >
            <View style={styles.newsImageContainer}>
              <LinearGradient
                colors={['#32CD32', '#228B22']}
                style={styles.newsImageGradient}
              >
                <Text style={styles.newsImageIcon}>🌿</Text>
              </LinearGradient>
              <View style={styles.dateTag}>
                <Text style={styles.dateText}>MAI 25</Text>
              </View>
            </View>
            <View style={styles.newsContent}>
              <Text style={styles.newsTitle}>
                Proteção de manguezais por unidades de conservação
              </Text>
              <Text style={styles.newsLocation}>
                UFAL
              </Text>
              <View style={styles.readMoreButton}>
                <Text style={styles.readMoreText}>Ler notícia</Text>
                <Ionicons name="open-outline" size={14} color="#008B8B" style={styles.externalIcon} />
              </View>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* 🏛️ Seção Órgãos Ambientais */}
      <View style={styles.contactSection}>
        <View style={styles.contactSectionHeader}>
          <Text style={styles.sectionTitle}>Órgãos Ambientais</Text>
          <TouchableOpacity onPress={handleSeeMoreContacts}>
            <Text style={styles.seeMoreText}>Veja mais</Text>
          </TouchableOpacity>
        </View>

        {/* CONAMA */}
        <TouchableOpacity 
          style={styles.contactCard}
          onPress={() => handleContactPress('https://conama.mma.gov.br/')}
        >
          <Text style={styles.contactTitle}>CONAMA</Text>
          <Text style={styles.contactSubText}>Conselho Nacional do Meio Ambiente</Text>
          <TouchableOpacity onPress={() => handlePhonePress('+55 (61) 2028-1685')}>
            <Text style={styles.contactPhone}>+55 (61) 2028-1685</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleEmailPress('conama@mma.gov.br')}>
            <Text style={styles.contactPhone}>conama@mma.gov.br</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* SUDEMA */}
        <TouchableOpacity 
          style={styles.contactCard}
          onPress={() => handleContactPress('https://sudema.pb.gov.br/')}
        >
          <Text style={styles.contactTitle}>SUDEMA</Text>
          <Text style={styles.contactSubText}>Superintendência do Meio Ambiente - PB</Text>
          <TouchableOpacity onPress={() => handlePhonePress('+55 (83) 3690-1993')}>
            <Text style={styles.contactPhone}>+55 (83) 3690-1993</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleEmailPress('protocolo@sudema.pb.gov.br')}>
            <Text style={styles.contactPhone}>protocolo@sudema.pb.gov.br</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Preamar PB */}
        <TouchableOpacity 
          style={styles.contactCard}
          onPress={() => handleContactPress('https://www.instagram.com/preamarpb/')}
        >
          <Text style={styles.contactTitle}>Preamar PB</Text>
          <Text style={styles.contactSubText}>Proteção de Recifes e Ecossistemas Costeiros</Text>
          <Text style={styles.contactPhone}>@preamarpb</Text>
        </TouchableOpacity>
      </View>

      {/* 🌊 Seção Dados do Mar */}
      {!isLoadingTides && tidesData && (
        <View style={styles.oceanDataSection}>
          <Text style={styles.sectionTitle}>Dados do Mar - João Pessoa</Text>
          
          {/* Informações de Sol */}
          <View style={styles.sunInfoContainer}>
            <View style={styles.sunInfoCard}>
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.sunIconContainer}
              >
                <Ionicons name="sunny" size={20} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.sunInfoText}>
                <Text style={styles.sunInfoLabel}>Nascer</Text>
                <Text style={styles.sunInfoTime}>{formatTime(tidesData.sunrise)}</Text>
              </View>
            </View>
            
            <View style={styles.sunInfoCard}>
              <LinearGradient
                colors={['#FF6B6B', '#FF8E53']}
                style={styles.sunIconContainer}
              >
                <Ionicons name="sunny" size={20} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.sunInfoText}>
                <Text style={styles.sunInfoLabel}>Pôr do Sol</Text>
                <Text style={styles.sunInfoTime}>{formatTime(tidesData.sunset)}</Text>
              </View>
            </View>
          </View>

          {/* Scroll Horizontal de Marés */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.tidesScrollView}
            contentContainerStyle={styles.tidesScrollContent}
          >
            {tidesData.tides.map((tide, index) => {
              const tideType = getTideType(tide.height);
              return (
                <View key={index} style={styles.tideCard}>
                  <LinearGradient
                    colors={tideType === 'alta' ? ['#4682B4', '#87CEEB'] : ['#20B2AA', '#48D1CC']}
                    style={styles.tideCardGradient}
                  >
                    {/* Ícone de Maré */}
                    <View style={styles.tideIconContainer}>
                      <Ionicons 
                        name={tideType === 'alta' ? 'arrow-up' : 'arrow-down'} 
                        size={24} 
                        color="#FFFFFF" 
                      />
                    </View>
                    
                    {/* Informações da Maré */}
                    <View style={styles.tideInfo}>
                      <Text style={styles.tideTime}>{tide.time}</Text>
                      <Text style={styles.tideHeight}>{tide.height}</Text>
                      <Text style={styles.tideType}>
                        Maré {tideType === 'alta' ? 'Alta' : 'Baixa'}
                      </Text>
                      <Text style={styles.tideCoeff}>Coef: {tide.coefficient}</Text>
                    </View>
                    
                    {/* Efeito Visual de Onda */}
                    <View style={styles.waveEffect}>
                      <View style={[styles.wave, { opacity: 0.3 }]} />
                      <View style={[styles.wave, { opacity: 0.2, marginTop: 5 }]} />
                    </View>
                  </LinearGradient>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Modal de Notícias */}
      <Modal
        visible={showNewsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Mais Notícias do Mar</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowNewsModal(false)}
            >
              <Ionicons name="close" size={24} color="#008B8B" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.modalSubtitle}>
            Acompanhe as principais notícias sobre conservação marinha:
          </Text>
          
          <FlatList
            data={EXTRA_NEWS_ITEMS}
            keyExtractor={(item) => item.id}
            renderItem={renderNewsItem}
            showsVerticalScrollIndicator={false}
            style={styles.newsModalList}
          />
        </View>
      </Modal>

      {/* Modal de Órgãos Ambientais */}
      <Modal
        visible={showOrgansModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Mais Órgãos Ambientais</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowOrgansModal(false)}
            >
              <Ionicons name="close" size={24} color="#008B8B" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.modalSubtitle}>
            Outros parceiros importantes na conservação marinha:
          </Text>
          
          <FlatList
            data={EXTRA_ENVIRONMENTAL_ORGS}
            keyExtractor={(item) => item.id}
            renderItem={renderOrganItem}
            showsVerticalScrollIndicator={false}
            style={styles.organsList}
          />
        </View>
      </Modal>

      {/* Espaçamento inferior para navegação */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },
  headerBackground: {
    paddingTop: 80,
    paddingBottom: 15,
    paddingHorizontal: 20,
    minHeight: 240,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 139, 139, 0.3)', 
  },
  headerContent: {
    flex: 1,
    alignItems: 'center', 
    justifyContent: 'center',
    zIndex: 1,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 18, 
  },
  welcomeTitle: {
    fontSize: 32, 
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 14, 
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16, 
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tridentIcon: {
    width: 75, 
    height: 75, 
    tintColor: '#FFD700', 
  },
  profileButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ecosystemSection: {
    padding: 20,
    paddingTop: 20, // Reduzido de 30 para 20
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 18, 
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14, 
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#008B8B',
  },
  questionContent: {
    flex: 1,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 6, 
  },
  questionSubtext: {
    fontSize: 13,
    color: '#6C757D',
  },
  questionIcon: {
    marginLeft: 15,
  },
  newsSection: {
    paddingHorizontal: 20,
    paddingBottom: 0,
    paddingTop: 10, // Reduzido de 15 para 10
  },
  newsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  seeMoreText: {
    color: '#008B8B',
    fontSize: 16, 
    fontWeight: '600',
    paddingBottom: 22,
  },
  newsScrollView: {
    marginLeft: -20,
    paddingLeft: 20,
  },
  newsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginRight: 15,
    width: width * 0.7,
  },
  newsImageContainer: {
    position: 'relative',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  newsImageGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newsImageIcon: {
    fontSize: 48,
  },
  dateTag: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dateText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  newsContent: {
    padding: 16,
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 6,
    lineHeight: 22,
  },
  newsLocation: {
    fontSize: 13,
    color: '#6C757D',
    marginBottom: 12,
  },
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#008B8B',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  readMoreText: {
    color: '#008B8B',
    fontSize: 14,
    fontWeight: '600',
  },
  externalIcon: {
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 100,
  },
  contactSection: {
    paddingHorizontal: 20,
    paddingTop: 20, // Reduzido de 35 para 20
    paddingBottom: 10,
  },
  contactSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  contactSubtitle: {
    fontSize: 15,
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 20,
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    borderLeftWidth: 3,
    borderLeftColor: '#008B8B',
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  contactIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  contactSubText: {
    fontSize: 13,
    color: '#6C757D',
    marginBottom: 6,
  },
  contactDetails: {
    marginTop: 10,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#343A40',
    marginLeft: 10,
  },
  contactPhone: {
    fontSize: 14,
    color: '#008B8B',
    fontWeight: '600',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFB',
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
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
    textAlign: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  organsList: {
    paddingHorizontal: 20,
  },
  organItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#008B8B',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  organIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0FDFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  organText: {
    flex: 1,
  },
  organTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  organDescription: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 18,
    marginBottom: 4,
  },
  organContact: {
    fontSize: 13,
    color: '#008B8B',
    fontWeight: '500',
  },
  newsModalList: {
    paddingHorizontal: 20,
  },
  newsModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    overflow: 'hidden',
  },
  newsModalImageContainer: {
    position: 'relative',
    height: 100,
  },
  newsModalImageGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newsModalImageIcon: {
    fontSize: 40,
  },
  newsModalDateTag: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  newsModalDateText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  newsModalContent: {
    padding: 16,
  },
  newsModalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 6,
    lineHeight: 20,
  },
  newsModalDescription: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 18,
    marginBottom: 8,
  },
  newsModalSource: {
    fontSize: 13,
    color: '#008B8B',
    fontWeight: '600',
  },
  
  // Estilos para Seção de Dados do Mar
  oceanDataSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  // Estilos para informações do Sol
  sunInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 15,
  },
  sunInfoCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFB',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sunIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sunInfoText: {
    flex: 1,
  },
  sunInfoLabel: {
    fontSize: 12,
    color: '#6C757D',
    fontWeight: '500',
    marginBottom: 2,
  },
  sunInfoTime: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: 'bold',
  },
  
  // Estilos para Scroll de Marés
  tidesScrollView: {
    marginTop: 10,
  },
  tidesScrollContent: {
    paddingRight: 20,
  },
  tideCard: {
    width: 160,
    marginRight: 15,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  tideCardGradient: {
    padding: 20,
    minHeight: 140,
    position: 'relative',
    overflow: 'hidden',
  },
  tideIconContainer: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  tideInfo: {
    flex: 1,
  },
  tideTime: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tideHeight: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '800',
    marginBottom: 6,
  },
  tideType: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    opacity: 0.9,
    marginBottom: 4,
  },
  tideCoeff: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
    opacity: 0.8,
  },
  
  // Efeito Visual de Onda
  waveEffect: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    width: 60,
    height: 60,
  },
  wave: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    right: 0,
  },
});
