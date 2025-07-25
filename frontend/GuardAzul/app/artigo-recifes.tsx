import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ArtigoRecifesScreen() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={['#008B8B', '#20B2AA']}
        style={styles.headerGradient}
      >
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>A Função dos Recifes de Corais</Text>
          <Text style={styles.headerSubtitle}>
            As florestas tropicais dos oceanos
          </Text>
        </View>
      </LinearGradient>

      {/* Conteúdo do Artigo */}
      <View style={styles.articleContainer}>
        {/* Introdução */}
        <View style={styles.section}>
          <Text style={styles.emoji}>🪸</Text>
          <Text style={styles.sectionTitle}>Cidades Submarinas</Text>
          <Text style={styles.paragraph}>
            Os recifes de corais são ecossistemas únicos que abrigam cerca de 
            <Text style={styles.highlight}> 25% de toda a vida marinha</Text>, 
            apesar de ocuparem menos de 1% dos oceanos. São verdadeiras metrópoles submarinas!
          </Text>
        </View>

        {/* Funções Ecológicas */}
        <View style={styles.section}>
          <Text style={styles.emoji}>🏠</Text>
          <Text style={styles.sectionTitle}>Funções dos Recifes</Text>
          
          <View style={styles.functionsList}>
            <View style={styles.functionItem}>
              <Text style={styles.functionIcon}>🐠</Text>
              <View style={styles.functionContent}>
                <Text style={styles.functionTitle}>Habitat e Berçário</Text>
                <Text style={styles.functionText}>
                  Fornecem abrigo, alimento e locais de reprodução para milhares 
                  de espécies marinhas, desde peixes coloridos até tubarões.
                </Text>
              </View>
            </View>

            <View style={styles.functionItem}>
              <Text style={styles.functionIcon}>🌊</Text>
              <View style={styles.functionContent}>
                <Text style={styles.functionTitle}>Proteção Costeira</Text>
                <Text style={styles.functionText}>
                  Atuam como barreiras naturais, reduzindo o impacto das ondas 
                  e protegendo as costas da erosão e tempestades.
                </Text>
              </View>
            </View>

            <View style={styles.functionItem}>
              <Text style={styles.functionIcon}>🍽️</Text>
              <View style={styles.functionContent}>
                <Text style={styles.functionTitle}>Fonte de Alimento</Text>
                <Text style={styles.functionText}>
                  Sustentam as atividades pesqueiras que alimentam mais de 
                  500 milhões de pessoas ao redor do mundo.
                </Text>
              </View>
            </View>

            <View style={styles.functionItem}>
              <Text style={styles.functionIcon}>💰</Text>
              <View style={styles.functionContent}>
                <Text style={styles.functionTitle}>Turismo e Economia</Text>
                <Text style={styles.functionText}>
                  Geram bilhões de dólares em turismo, mergulho e atividades 
                  recreativas, sustentando comunidades costeiras.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Como Funcionam */}
        <View style={styles.section}>
          <Text style={styles.emoji}>🔬</Text>
          <Text style={styles.sectionTitle}>Como os Corais Funcionam</Text>
          <Text style={styles.paragraph}>
            Os corais são animais que vivem em simbiose com algas microscópicas 
            chamadas zooxantelas:
          </Text>
          
          <View style={styles.processBox}>
            <View style={styles.processStep}>
              <Text style={styles.processNumber}>1</Text>
              <Text style={styles.processText}>
                <Text style={styles.processBold}>Algas</Text> vivem dentro dos corais
              </Text>
            </View>
            <Text style={styles.processArrow}>↓</Text>
            <View style={styles.processStep}>
              <Text style={styles.processNumber}>2</Text>
              <Text style={styles.processText}>
                <Text style={styles.processBold}>Fotossíntese</Text> produz açúcar
              </Text>
            </View>
            <Text style={styles.processArrow}>↓</Text>
            <View style={styles.processStep}>
              <Text style={styles.processNumber}>3</Text>
              <Text style={styles.processText}>
                <Text style={styles.processBold}>Coral</Text> usa açúcar como energia
              </Text>
            </View>
            <Text style={styles.processArrow}>↓</Text>
            <View style={styles.processStep}>
              <Text style={styles.processNumber}>4</Text>
              <Text style={styles.processText}>
                <Text style={styles.processBold}>Crescimento</Text> do recife
              </Text>
            </View>
          </View>
        </View>

        {/* Ameaças */}
        <View style={styles.section}>
          <Text style={styles.emoji}>⚠️</Text>
          <Text style={styles.sectionTitle}>Ameaças aos Recifes</Text>
          
          <View style={styles.threatsList}>
            <Text style={styles.threatItem}>🌡️ <Text style={styles.threatBold}>Aquecimento global</Text> - branqueamento dos corais</Text>
            <Text style={styles.threatItem}>🏭 <Text style={styles.threatBold}>Poluição</Text> - químicos e plásticos</Text>
            <Text style={styles.threatItem}>🎣 <Text style={styles.threatBold}>Pesca predatória</Text> - destruição do habitat</Text>
            <Text style={styles.threatItem}>🏗️ <Text style={styles.threatBold}>Desenvolvimento costeiro</Text> - sedimentação</Text>
            <Text style={styles.threatItem}>⚗️ <Text style={styles.threatBold}>Acidificação oceânica</Text> - dissolução do carbonato</Text>
          </View>
        </View>

        {/* Conservação */}
        <View style={styles.section}>
          <Text style={styles.emoji}>🛡️</Text>
          <Text style={styles.sectionTitle}>Como Proteger os Recifes</Text>
          
          <View style={styles.conservationList}>
            <View style={styles.conservationItem}>
              <View style={styles.conservationIcon}>
                <Ionicons name="leaf" size={24} color="#27AE60" />
              </View>
              <View style={styles.conservationContent}>
                <Text style={styles.conservationTitle}>Reduza as Emissões</Text>
                <Text style={styles.conservationText}>
                  Use transporte sustentável e economize energia para combater o aquecimento global.
                </Text>
              </View>
            </View>

            <View style={styles.conservationItem}>
              <View style={styles.conservationIcon}>
                <Ionicons name="water" size={24} color="#3498DB" />
              </View>
              <View style={styles.conservationContent}>
                <Text style={styles.conservationTitle}>Proteja a Água</Text>
                <Text style={styles.conservationText}>
                  Não use químicos próximo à costa e evite descartar lixo no mar.
                </Text>
              </View>
            </View>

            <View style={styles.conservationItem}>
              <View style={styles.conservationIcon}>
                <Ionicons name="fish" size={24} color="#E67E22" />
              </View>
              <View style={styles.conservationContent}>
                <Text style={styles.conservationTitle}>Pesca Responsável</Text>
                <Text style={styles.conservationText}>
                  Apoie práticas de pesca sustentável e respeite áreas protegidas.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Call to Action */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Os Recifes Precisam de Você!</Text>
          <Text style={styles.ctaText}>
            Cada pequena ação conta para preservar esses ecossistemas únicos. 
            Ajude a proteger as "florestas tropicais dos oceanos"!
          </Text>
          
          <TouchableOpacity style={styles.ctaButton} onPress={() => router.push('/(tabs)/denunciar')}>
            <LinearGradient
              colors={['#008B8B', '#20B2AA']}
              style={styles.ctaButtonGradient}
            >
              <Ionicons name="camera" size={20} color="#FFFFFF" style={styles.ctaIcon} />
              <Text style={styles.ctaButtonText}>Reportar Danos aos Recifes</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Espaçamento inferior */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1,
    padding: 8,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 40, // Aumentado de 20 para 40
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 20,
  },
  articleContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  emoji: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
    textAlign: 'center',
  },
  paragraph: {
    fontSize: 16,
    color: '#2C3E50',
    lineHeight: 24,
    textAlign: 'justify',
  },
  highlight: {
    fontWeight: 'bold',
    color: '#008B8B',
  },
  functionsList: {
    marginTop: 15,
  },
  functionItem: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  functionIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  functionContent: {
    flex: 1,
  },
  functionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#008B8B',
    marginBottom: 5,
  },
  functionText: {
    fontSize: 14,
    color: '#2C3E50',
    lineHeight: 20,
  },
  processBox: {
    backgroundColor: '#E8F4FD',
    borderRadius: 12,
    padding: 20,
    marginTop: 15,
    alignItems: 'center',
  },
  processStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  processNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#008B8B',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 30,
    fontWeight: 'bold',
    marginRight: 15,
  },
  processText: {
    fontSize: 14,
    color: '#2C3E50',
  },
  processBold: {
    fontWeight: 'bold',
    color: '#008B8B',
  },
  processArrow: {
    fontSize: 20,
    color: '#008B8B',
    marginVertical: 5,
  },
  threatsList: {
    marginTop: 15,
  },
  threatItem: {
    fontSize: 14,
    color: '#2C3E50',
    lineHeight: 22,
    marginBottom: 8,
    paddingLeft: 10,
  },
  threatBold: {
    fontWeight: 'bold',
    color: '#E74C3C',
  },
  conservationList: {
    marginTop: 15,
  },
  conservationItem: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  conservationIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  conservationContent: {
    flex: 1,
  },
  conservationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#008B8B',
    marginBottom: 5,
  },
  conservationText: {
    fontSize: 14,
    color: '#2C3E50',
    lineHeight: 20,
  },
  ctaSection: {
    backgroundColor: '#E8F4FD',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#008B8B',
    marginBottom: 10,
    textAlign: 'center',
  },
  ctaText: {
    fontSize: 14,
    color: '#2C3E50',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  ctaButton: {
    borderRadius: 12,
    shadowColor: '#008B8B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  ctaButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  ctaIcon: {
    marginRight: 8,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: 100,
  },
}); 