import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function ArtigoLixoScreen() {
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
          <Text style={styles.headerTitle}>Como o Lixo Afeta os Ecossistemas</Text>
          <Text style={styles.headerSubtitle}>
            O impacto devastador do plástico na vida marinha
          </Text>
        </View>
      </LinearGradient>

      {/* Conteúdo do Artigo */}
      <View style={styles.articleContainer}>
        {/* Introdução */}
        <View style={styles.section}>
          <Text style={styles.emoji}>🌊</Text>
          <Text style={styles.sectionTitle}>Um Problema Global</Text>
          <Text style={styles.paragraph}>
            Todos os anos, mais de <Text style={styles.highlight}>8 milhões de toneladas</Text> de 
            lixo plástico chegam aos nossos oceanos. Isso equivale a despejar um caminhão 
            de lixo no mar a cada minuto!
          </Text>
        </View>

        {/* Impactos nos Animais */}
        <View style={styles.section}>
          <Text style={styles.emoji}>🐢</Text>
          <Text style={styles.sectionTitle}>Impacto nos Animais Marinhos</Text>
          <Text style={styles.paragraph}>
            O lixo marinho afeta diretamente a vida aquática:
          </Text>
          
          <View style={styles.impactList}>
            <View style={styles.impactItem}>
              <Text style={styles.impactIcon}>🪤</Text>
              <View style={styles.impactContent}>
                <Text style={styles.impactTitle}>Emaranhamento</Text>
                <Text style={styles.impactText}>
                  Redes de pesca, sacolas e outros detritos prendem animais, 
                  causando ferimentos graves ou morte.
                </Text>
              </View>
            </View>

            <View style={styles.impactItem}>
              <Text style={styles.impactIcon}>🍽️</Text>
              <View style={styles.impactContent}>
                <Text style={styles.impactTitle}>Ingestão</Text>
                <Text style={styles.impactText}>
                  Animais confundem plástico com comida, causando bloqueios 
                  intestinais e desnutrição.
                </Text>
              </View>
            </View>

            <View style={styles.impactItem}>
              <Text style={styles.impactIcon}>🧪</Text>
              <View style={styles.impactContent}>
                <Text style={styles.impactTitle}>Toxinas</Text>
                <Text style={styles.impactText}>
                  Plásticos liberam químicos tóxicos que se acumulam na 
                  cadeia alimentar.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Microplásticos */}
        <View style={styles.section}>
          <Text style={styles.emoji}>🔬</Text>
          <Text style={styles.sectionTitle}>O Perigo Invisível: Microplásticos</Text>
          <Text style={styles.paragraph}>
            Quando o plástico se quebra, forma partículas microscópicas que:
          </Text>
          
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>• São ingeridas por peixes pequenos</Text>
            <Text style={styles.bulletItem}>• Sobem na cadeia alimentar até nós</Text>
            <Text style={styles.bulletItem}>• Já foram encontradas no sangue humano</Text>
            <Text style={styles.bulletItem}>• Afetam o sistema reprodutivo marinho</Text>
          </View>
        </View>

        {/* Soluções */}
        <View style={styles.section}>
          <Text style={styles.emoji}>💡</Text>
          <Text style={styles.sectionTitle}>Como Você Pode Ajudar</Text>
          
          <View style={styles.solutionsList}>
            <View style={styles.solutionItem}>
              <View style={styles.solutionIcon}>
                <Ionicons name="leaf" size={24} color="#27AE60" />
              </View>
              <View style={styles.solutionContent}>
                <Text style={styles.solutionTitle}>Reduza o Plástico</Text>
                <Text style={styles.solutionText}>
                  Use garrafas reutilizáveis, sacolas ecológicas e evite embalagens desnecessárias.
                </Text>
              </View>
            </View>

            <View style={styles.solutionItem}>
              <View style={styles.solutionIcon}>
                <Ionicons name="camera" size={24} color="#008B8B" />
              </View>
              <View style={styles.solutionContent}>
                <Text style={styles.solutionTitle}>Denuncie</Text>
                <Text style={styles.solutionText}>
                  Use nosso app para reportar poluição e ajudar na limpeza dos oceanos.
                </Text>
              </View>
            </View>

            <View style={styles.solutionItem}>
              <View style={styles.solutionIcon}>
                <Ionicons name="people" size={24} color="#E74C3C" />
              </View>
              <View style={styles.solutionContent}>
                <Text style={styles.solutionTitle}>Eduque</Text>
                <Text style={styles.solutionText}>
                  Compartilhe conhecimento e inspire outros a protegerem os oceanos.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Call to Action */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Juntos Podemos Fazer a Diferença!</Text>
          <Text style={styles.ctaText}>
            Cada ação conta. Seja um guardião dos oceanos e ajude a proteger 
            a vida marinha para as futuras gerações.
          </Text>
          
          <TouchableOpacity style={styles.ctaButton} onPress={() => router.push('/(tabs)/denunciar')}>
            <LinearGradient
              colors={['#008B8B', '#20B2AA']}
              style={styles.ctaButtonGradient}
            >
              <Ionicons name="camera" size={20} color="#FFFFFF" style={styles.ctaIcon} />
              <Text style={styles.ctaButtonText}>Fazer uma Denúncia</Text>
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
  impactList: {
    marginTop: 15,
  },
  impactItem: {
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
  impactIcon: {
    fontSize: 32,
    marginRight: 15,
  },
  impactContent: {
    flex: 1,
  },
  impactTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E74C3C',
    marginBottom: 5,
  },
  impactText: {
    fontSize: 14,
    color: '#2C3E50',
    lineHeight: 20,
  },
  bulletList: {
    marginTop: 10,
  },
  bulletItem: {
    fontSize: 14,
    color: '#2C3E50',
    lineHeight: 22,
    marginBottom: 5,
  },
  solutionsList: {
    marginTop: 15,
  },
  solutionItem: {
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
  solutionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  solutionContent: {
    flex: 1,
  },
  solutionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#008B8B',
    marginBottom: 5,
  },
  solutionText: {
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