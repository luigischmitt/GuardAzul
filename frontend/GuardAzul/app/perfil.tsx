import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function PerfilScreen() {
  const router = useRouter();

  const handleNavigateToRewards = () => {
    console.log('Navigating to rewards...');
    try {
      router.push('/recompensas');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Tem certeza que deseja sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          style: 'destructive',
          onPress: () => {
            // Aqui implementaria a lógica de logout
            Alert.alert('Logout realizado com sucesso!');
          }
        }
      ]
    );
  };

  const handleEditProfile = () => {
    Alert.alert('Em breve', 'Funcionalidade de editar perfil em desenvolvimento!');
  };

  // Dados mockados do usuário
  const userData = {
    name: 'Guardião Marinho',
    email: 'usuario@exemplo.com',
    points: 2840,
    level: 8,
    denunciasFeitas: 15,
    problemasResolvidos: 12,
    joinDate: 'Janeiro 2025'
  };

  const recentDenuncias = [
    {
      id: 1,
      title: 'Despejo de óleo na praia',
      date: '23 Jan 2025',
      status: 'Resolvida',
      points: 150
    },
    {
      id: 2,
      title: 'Lixo em área de manguezal',
      date: '20 Jan 2025',
      status: 'Em análise',
      points: 100
    },
    {
      id: 3,
      title: 'Pesca ilegal de tartarugas',
      date: '18 Jan 2025',
      status: 'Resolvida',
      points: 200
    }
  ];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
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
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={32} color="#008B8B" />
              </View>
            </View>
            <Text style={styles.userName}>{userData.name}</Text>
            <Text style={styles.userEmail}>{userData.email}</Text>
            <Text style={styles.joinDate}>Membro desde {userData.joinDate}</Text>
          </View>
        </LinearGradient>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="star" size={24} color="#FFD700" />
              <Text style={styles.statNumber}>{userData.points}</Text>
              <Text style={styles.statLabel}>Pontos</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="trending-up" size={24} color="#20B2AA" />
              <Text style={styles.statNumber}>Nível {userData.level}</Text>
              <Text style={styles.statLabel}>Guardião</Text>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="alert-circle" size={24} color="#FF4444" />
              <Text style={styles.statNumber}>{userData.denunciasFeitas}</Text>
              <Text style={styles.statLabel}>Denúncias</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle" size={24} color="#27AE60" />
              <Text style={styles.statNumber}>{userData.problemasResolvidos}</Text>
              <Text style={styles.statLabel}>Resolvidas</Text>
            </View>
          </View>
        </View>

        {/* Recompensas Preview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recompensas</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={handleNavigateToRewards}
            >
              <Text style={styles.viewAllText}>Ver todas</Text>
              <Ionicons name="chevron-forward" size={16} color="#008B8B" />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.rewardPreviewCard}
            onPress={handleNavigateToRewards}
          >
            <View style={styles.rewardPreviewContent}>
              <View style={styles.rewardPreviewIcon}>
                <Ionicons name="gift" size={24} color="#FFD700" />
              </View>
              <View style={styles.rewardPreviewInfo}>
                <Text style={styles.rewardPreviewTitle}>Próxima Recompensa</Text>
                <Text style={styles.rewardPreviewDescription}>
                  Vale guia-turístico ecológico R$ 100
                </Text>
                <View style={styles.rewardPreviewProgress}>
                  <Text style={styles.rewardPreviewPoints}>
                    {userData.points}/2500 pontos
                  </Text>
                  <View style={styles.previewProgressBar}>
                    <View style={[
                      styles.previewProgressFill, 
                      { width: `${Math.min((userData.points / 2500) * 100, 100)}%` }
                    ]} />
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#008B8B" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Minhas Denúncias */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Minhas Denúncias Recentes</Text>
          
          {recentDenuncias.map((denuncia) => (
            <View key={denuncia.id} style={styles.denunciaCard}>
              <View style={styles.denunciaHeader}>
                <Text style={styles.denunciaTitle}>{denuncia.title}</Text>
                <View style={[
                  styles.statusBadge,
                  denuncia.status === 'Resolvida' ? styles.statusResolvida : styles.statusAnalise
                ]}>
                  <Text style={[
                    styles.statusText,
                    denuncia.status === 'Resolvida' ? styles.statusTextResolvida : styles.statusTextAnalise
                  ]}>
                    {denuncia.status}
                  </Text>
                </View>
              </View>
              <View style={styles.denunciaFooter}>
                <Text style={styles.denunciaDate}>{denuncia.date}</Text>
                <View style={styles.pointsEarned}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={styles.pointsText}>+{denuncia.points} pts</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Ações do Perfil */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configurações</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleEditProfile}>
            <Ionicons name="person-outline" size={20} color="#FFFFFF" />
            <Text style={styles.actionText}>Editar Perfil</Text>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="help-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.actionText}>Ajuda e Suporte</Text>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionButton, styles.logoutButton]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#FF4444" />
            <Text style={[styles.actionText, styles.logoutText]}>Sair da Conta</Text>
            <Ionicons name="chevron-forward" size={20} color="#FF4444" />
          </TouchableOpacity>
        </View>

        {/* Espaçamento inferior */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },
  headerGradient: {
    paddingTop: 100, // Aumentado de 60 para 100
    paddingBottom: 40, // Aumentado de 30 para 40
    paddingHorizontal: 20,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 139, 139, 0.3)', // Diminuído de 0.5 para 0.3 - mais sutil
  },
  backButton: {
    position: 'absolute',
    top: 70, // Ajustado para acompanhar o novo paddingTop
    left: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Fundo sutil para destaque
    borderRadius: 20,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 10, // Espaço adicional do topo
  },
  avatarContainer: {
    marginBottom: 20, // Aumentado de 16 para 20
  },
  avatar: {
    width: 90, // Aumentado de 80 para 90
    height: 90, // Aumentado de 80 para 90
    borderRadius: 45, // Ajustado para o novo tamanho
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4, // Aumentado de 2 para 4
    },
    shadowOpacity: 0.15, // Aumentado de 0.1 para 0.15
    shadowRadius: 6, // Aumentado de 4 para 6
    elevation: 6, // Aumentado de 3 para 6
  },
  userName: {
    fontSize: 26, // Aumentado de 24 para 26
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6, // Aumentado de 4 para 6
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 6, // Aumentado de 4 para 6
    textAlign: 'center',
  },
  joinDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  statsContainer: {
    padding: 20,
    marginTop: 0, // Removido margin negativo para que fique apenas no fundo branco
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: '48%',
    borderLeftWidth: 3,
    borderLeftColor: '#008B8B',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6C757D',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  denunciaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#008B8B',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  denunciaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  denunciaTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusResolvida: {
    backgroundColor: '#E8F5E8',
  },
  statusAnalise: {
    backgroundColor: '#FFF3E0',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextResolvida: {
    color: '#27AE60',
  },
  statusTextAnalise: {
    color: '#FF9800',
  },
  denunciaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  denunciaDate: {
    fontSize: 14,
    color: '#6C757D',
  },
  pointsEarned: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFB800',
    marginLeft: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#008B8B',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    fontSize: 16,
    color: '#2C3E50',
    flex: 1,
    marginLeft: 12,
  },
  logoutButton: {
    borderLeftColor: '#FF4444',
  },
  logoutText: {
    color: '#FF4444',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: '#008B8B',
    fontWeight: '600',
    marginRight: 4,
  },
  rewardPreviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#FFD700',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rewardPreviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardPreviewIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF8E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  rewardPreviewInfo: {
    flex: 1,
  },
  rewardPreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  rewardPreviewDescription: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 8,
  },
  rewardPreviewProgress: {
    gap: 4,
  },
  rewardPreviewPoints: {
    fontSize: 12,
    color: '#6C757D',
    fontWeight: '500',
  },
  previewProgressBar: {
    height: 4,
    backgroundColor: '#E9ECEF',
    borderRadius: 2,
    overflow: 'hidden',
  },
  previewProgressFill: {
    height: '100%',
    backgroundColor: '#20B2AA',
    borderRadius: 2,
  },
  bottomSpacer: {
    height: 100,
  },
}); 