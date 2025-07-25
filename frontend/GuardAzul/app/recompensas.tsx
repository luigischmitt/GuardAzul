import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function RecompensasScreen() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  // Mock user data - in real app, this would come from context/API
  const userData = {
    points: 2840,
    level: 8,
  };

  // Rewards timeline data
  const rewards = [
    {
      id: 1,
      title: 'Guardião Iniciante',
      description: 'Desconto de 5% na conta de energia',
      pointsRequired: 500,
      icon: 'flash',
      color: '#4CAF50',
      type: 'utility',
      partner: 'Energisa',
      unlocked: true,
      claimed: true,
    },
    {
      id: 2,
      title: 'Protetor Marinho',
      description: 'Desconto de 10% na conta de água',
      pointsRequired: 1500,
      icon: 'water',
      color: '#2196F3',
      type: 'utility',
      partner: 'CAGEPA',
      unlocked: true,
      claimed: false,
    },
    {
      id: 3,
      title: 'Vigilante Oceânico',
      description: 'Vale guia-turístico ecológico R$ 100',
      pointsRequired: 2500,
      icon: 'map',
      color: '#FF9800',
      type: 'tourism',
      partner: 'EcoTour PB',
      unlocked: true,
      claimed: false,
    },
    {
      id: 4,
      title: 'Herói Ambiental',
      description: 'Desconto de 15% na conta de energia',
      pointsRequired: 4000,
      icon: 'flash',
      color: '#9C27B0',
      type: 'utility',
      partner: 'Energisa',
      unlocked: false,
      claimed: false,
    },
    {
      id: 5,
      title: 'Guardião Supremo',
      description: 'Kit eco-friendly completo + Certificado',
      pointsRequired: 6000,
      icon: 'trophy',
      color: '#FFD700',
      type: 'premium',
      partner: 'GuardAzul',
      unlocked: false,
      claimed: false,
    },
  ];

  const getProgressPercentage = (pointsRequired: number) => {
    return Math.min((userData.points / pointsRequired) * 100, 100);
  };

  const renderRewardCard = (reward: typeof rewards[0], index: number) => {
    const progress = getProgressPercentage(reward.pointsRequired);
    const isUnlocked = userData.points >= reward.pointsRequired;
    
    return (
      <View key={reward.id} style={styles.timelineItem}>
        {/* Timeline connector */}
        {index < rewards.length - 1 && (
          <View style={[
            styles.timelineConnector,
            { backgroundColor: isUnlocked ? reward.color : '#E0E0E0' }
          ]} />
        )}
        
        {/* Timeline dot */}
        <View style={[
          styles.timelineDot,
          { 
            backgroundColor: isUnlocked ? reward.color : '#E0E0E0',
            borderColor: isUnlocked ? reward.color : '#E0E0E0',
          }
        ]}>
          <Ionicons 
            name={reward.icon as any} 
            size={16} 
            color={isUnlocked ? '#FFFFFF' : '#9E9E9E'} 
          />
        </View>

        {/* Reward card */}
        <TouchableOpacity 
          style={[
            styles.rewardCard,
            { 
              backgroundColor: isUnlocked ? '#FFFFFF' : '#F8F9FA',
              opacity: isUnlocked ? 1 : 0.8,
            }
          ]}
          disabled={!isUnlocked}
        >
          <LinearGradient
            colors={isUnlocked ? [reward.color + '20', reward.color + '10'] : ['#F5F5F5', '#EEEEEE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <View style={styles.rewardHeader}>
              <View style={styles.rewardTitleContainer}>
                <Text style={[
                  styles.rewardTitle,
                  { color: isUnlocked ? '#1A1A1A' : '#9E9E9E' }
                ]}>
                  {reward.title}
                </Text>
                <Text style={styles.rewardPartner}>parceria com {reward.partner}</Text>
              </View>
              
              {reward.claimed ? (
                <View style={styles.claimedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="#27AE60" />
                  <Text style={styles.claimedText}>Resgatada</Text>
                </View>
              ) : isUnlocked ? (
                <TouchableOpacity style={[styles.claimButton, { backgroundColor: reward.color }]}>
                  <Text style={styles.claimButtonText}>Resgatar</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              ) : (
                <View style={styles.lockedBadge}>
                  <Ionicons name="lock-closed" size={18} color="#9E9E9E" />
                </View>
              )}
            </View>

            <Text style={[
              styles.rewardDescription,
              { color: isUnlocked ? '#4A5568' : '#9E9E9E' }
            ]}>
              {reward.description}
            </Text>

            <View style={styles.progressContainer}>
              <View style={styles.progressInfo}>
                <Text style={styles.pointsText}>
                  {userData.points.toLocaleString()} / {reward.pointsRequired.toLocaleString()} pontos
                </Text>
                <Text style={[
                  styles.progressPercentage,
                  { color: isUnlocked ? reward.color : '#9E9E9E' }
                ]}>
                  {Math.round(progress)}%
                </Text>
              </View>
              
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${progress}%`,
                      backgroundColor: isUnlocked ? reward.color : '#E0E0E0',
                    }
                  ]} 
                />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['#1e3c72', '#2a5298']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <View style={styles.headerIconContainer}>
              <Ionicons name="gift" size={36} color="#FFFFFF" />
            </View>
            <Text style={styles.headerTitle}>Recompensas</Text>
            <Text style={styles.headerSubtitle}>
              {userData.points.toLocaleString()} pontos disponíveis
            </Text>
            <View style={styles.levelBadge}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.levelText}>Nível {userData.level}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <LinearGradient
              colors={['#4facfe', '#00f2fe']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.infoGradient}
            >
              <Ionicons name="information-circle" size={24} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Como funciona?</Text>
              <Text style={styles.infoText}>
                Acumule pontos protegendo o meio ambiente e troque por benefícios reais! 
                Descontos em serviços, experiências turísticas ecológicas e muito mais.
              </Text>
            </View>
          </View>
        </View>

        {/* Rewards Timeline */}
        <View style={styles.timelineContainer}>
          <Text style={styles.sectionTitle}>Linha de Recompensas</Text>
          <View style={styles.timeline}>
            {rewards.map((reward, index) => renderRewardCard(reward, index))}
          </View>
        </View>

        {/* Bottom spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerGradient: {
    paddingTop: 100,
    paddingBottom: 50,
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 70,
    left: 20,
    zIndex: 10,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 50,
    backdropFilter: 'blur(10px)',
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 10,
  },
  headerIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  levelText: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: '600',
    marginLeft: 6,
  },
  infoSection: {
    padding: 20,
    marginTop: 0,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  infoGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 15,
    color: '#4A5568',
    lineHeight: 22,
  },
  timelineContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A202C',
    marginBottom: 24,
    textAlign: 'center',
  },
  timeline: {
    position: 'relative',
  },
  timelineItem: {
    position: 'relative',
    marginBottom: 24,
    paddingLeft: 50,
  },
  timelineConnector: {
    position: 'absolute',
    left: 24,
    top: 50,
    width: 3,
    height: 100,
    zIndex: 1,
    borderRadius: 2,
  },
  timelineDot: {
    position: 'absolute',
    left: 12,
    top: 20,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  rewardCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 4,
  },
  cardGradient: {
    padding: 20,
    borderRadius: 20,
  },
  rewardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  rewardTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  rewardTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  rewardPartner: {
    fontSize: 13,
    color: '#718096',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  claimedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  claimedText: {
    fontSize: 12,
    color: '#15803D',
    fontWeight: '600',
    marginLeft: 4,
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  claimButtonText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
    marginRight: 6,
  },
  lockedBadge: {
    padding: 8,
    backgroundColor: '#F7FAFC',
    borderRadius: 20,
  },
  rewardDescription: {
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pointsText: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  bottomSpacer: {
    height: 100,
  },
});
